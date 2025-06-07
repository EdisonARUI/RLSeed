'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getGoalById } from './data';
import { GoalWithMilestones } from './types';

type MilestoneData = {
  title: string;
  description?: string;
  reward_amount: number;
  deadline: string;
};

type GoalData = {
  title: string;
  description: string;
  milestones: MilestoneData[];
};

export async function createGoal(goalData: GoalData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create a goal.' };
  }

  // Check if user has already created a goal
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('is_setgoal')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile for goal creation check:', profileError);
    return { error: 'Could not verify user profile.' };
  }

  if (userProfile?.is_setgoal) {
    return { error: 'You have already created a goal. Each user can only create one.' };
  }

  const { title, description, milestones } = goalData;

  // Calculate total budget
  const total_budget = milestones.reduce((sum, m) => sum + m.reward_amount, 0);

  // 1. Insert the goal
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .insert({
      title,
      description,
      total_budget,
      creator_id: user.id,
      status: 'active',
    })
    .select()
    .single();

  if (goalError) {
    console.error('Error creating goal:', goalError);
    return { error: 'Failed to create the goal.' };
  }

  // 2. Insert the milestones
  const milestoneInserts = milestones.map(m => ({
    goal_id: goal.id,
    title: m.title,
    reward_amount: m.reward_amount,
    deadline: m.deadline
  }));

  const { error: milestonesError } = await supabase
    .from('milestones')
    .insert(milestoneInserts);

  if (milestonesError) {
    console.error('Error creating milestones:', milestonesError);
    // Optionally, delete the created goal if milestones fail
    await supabase.from('goals').delete().eq('id', goal.id);
    return { error: 'Failed to create milestones for the goal.' };
  }
  
  // Update the user's is_setgoal flag
  const { error: updateUserError } = await supabase
    .from('users')
    .update({ is_setgoal: true })
    .eq('id', user.id);

  if (updateUserError) {
    // This is a non-critical error for the user, as the goal was created.
    // Log it for the developers to investigate.
    console.error(`CRITICAL: Failed to set is_setgoal flag for user ${user.id}`, updateUserError);
  }

  // Revalidate the homepage to show the new goal
  // revalidatePath('/'); // We will use router.refresh() on the client for faster feedback

  return { success: true, goalId: goal.id };
}

type UpdateGoalData = {
  title: string;
  description: string;
};

export async function updateGoal(goalId: number, goalData: UpdateGoalData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update a goal.' };
  }

  const { error } = await supabase
    .from('goals')
    .update({
      title: goalData.title,
      description: goalData.description,
    })
    .eq('id', goalId)
    .eq('creator_id', user.id); // Ensure only the creator can update

  if (error) {
    console.error('Error updating goal:', error);
    return { error: 'Failed to update the goal.' };
  }

  // revalidatePath('/');
  revalidatePath(`/goals/${goalId}`);

  return { success: true };
}

type UpdateGoalPayload = {
  goalId: number;
  platform_escrow_address: string;
};

export async function updateGoalOnFunding(payload: UpdateGoalPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to fund a goal.' };
  }

  const { goalId, platform_escrow_address } = payload;

  const { data, error } = await supabase
    .from('goals')
    .update({
      status: 'seeded',
      sponsor_id: user.id,
      platform_escrow_address,
    })
    .eq('id', goalId);

  if (error) {
    console.error('Error updating goal on funding:', error);
    return { error: 'Failed to update the goal after funding.' };
  }

  // revalidatePath('/');
  revalidatePath(`/goals/${goalId}`);
  
  return { success: true };
}

export async function deleteGoal(goalId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to delete a goal.' };
  }

  // First, update the user's is_setgoal flag to false
  const { error: updateUserError } = await supabase
    .from('users')
    .update({ is_setgoal: false })
    .eq('id', user.id);

  if (updateUserError) {
    console.error('Error updating user is_setgoal flag before deleting goal:', updateUserError);
    return { error: 'Failed to update user status before deleting goal.' };
  }
  
  // Then, delete the goal
  const { error: deleteError } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('creator_id', user.id);

  if (deleteError) {
    console.error('Error deleting goal:', deleteError);
    // Attempt to revert the is_setgoal flag if goal deletion fails
    await supabase.from('users').update({ is_setgoal: true }).eq('id', user.id);
    return { error: 'Failed to delete the goal.' };
  }

  // revalidatePath('/');
  return { success: true };
}

export async function getGoalDetailsForModal(goalId: number): Promise<GoalWithMilestones | null> {
    const goalDetails = await getGoalById(String(goalId));
    return goalDetails;
}

type EscrowData = {
    milestone_id: number;
    sequence: number;
    escrow_condition: string;
    escrow_fulfillment: string;
};

export async function fundGoalWithMilestoneEscrows(
    goalId: number, 
    sponsorWalletAddress: string, 
    escrowData: EscrowData[]
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to fund a goal.' };
    }

    // 1. Update the goal status to 'seeded' and link the sponsor
    const { error: goalUpdateError } = await supabase
        .from('goals')
        .update({
            status: 'seeded',
            sponsor_id: user.id,
            platform_escrow_address: sponsorWalletAddress, // Using this to store the sponsor's funding wallet
        })
        .eq('id', goalId);
    
    if (goalUpdateError) {
        console.error('Error updating goal status:', goalUpdateError);
        return { error: 'Failed to update goal status.' };
    }

    // 2. Insert all the milestone escrow details
    const escrowInserts = escrowData.map(e => ({
        milestone_id: e.milestone_id,
        sequence: e.sequence,
        escrow_condition: e.escrow_condition,
        escrow_fulfillment: e.escrow_fulfillment,
    }));

    const { error: escrowInsertError } = await supabase
        .from('milestone_escrows')
        .insert(escrowInserts);

    if (escrowInsertError) {
        console.error('Error inserting escrow data:', escrowInsertError);
        // TODO: Should we try to roll back the goal status update?
        return { error: 'Failed to save escrow details.' };
    }

    revalidatePath('/');
    return { success: true };
}

export async function finishMilestone(milestoneId: number) {
    const supabase = await createClient();
    
    // We need to fetch the escrow details for the milestone
    const { data: escrow, error: escrowError } = await supabase
        .from('milestone_escrows')
        .select('*')
        .eq('milestone_id', milestoneId)
        .single();
    
    if (escrowError || !escrow) {
        return { error: 'Could not find escrow details for this milestone.' };
    }
    
    // We also need the goal to get the sponsor's funding wallet address (Owner)
    const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .select('*, goals(*)')
        .eq('id', milestoneId)
        .single();

    if (milestoneError || !milestone || !milestone.goals) {
        return { error: 'Could not find the parent goal for this milestone.' };
    }

    // Now, update the milestone status in our DB to 'completed'
    const { error: updateError } = await supabase
        .from('milestones')
        .update({ status: 'completed' })
        .eq('id', milestoneId);

    if (updateError) {
        return { error: 'Failed to update milestone status in the database.' };
    }

    revalidatePath('/');
    return { 
        success: true,
        escrowDetails: {
            owner: milestone.goals.platform_escrow_address, // The temporary wallet that funded the escrow
            offerSequence: escrow.sequence,
            condition: escrow.escrow_condition,
            fulfillment: escrow.escrow_fulfillment
        }
    };
} 