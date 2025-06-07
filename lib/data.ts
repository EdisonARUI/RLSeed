import { createClient } from '@/lib/supabase/server';
import { Goal, GoalWithMilestones, Milestone, UserProfile } from './types';

export async function getGoals(): Promise<GoalWithMilestones[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*, creator:creator_id(*), milestones(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return data || [];
}

export async function getGoalById(id: string): Promise<GoalWithMilestones | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*, creator:creator_id(*), milestones(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching goal ${id}:`, error);
    return null;
  }

  return data;
}

export async function getUserProfile(): Promise<UserProfile | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data;
}

export async function getGoalByCurrentUser(): Promise<GoalWithMilestones | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('goals')
    .select('*, creator:creator_id(*), milestones(*, milestone_escrows(*))')
    .eq('creator_id', user.id)
    .single();
  
  if (error) {
    // It's okay if no row is found, it just means the user hasn't created a goal.
    if (error.code !== 'PGRST116') {
      console.error('Error fetching user goal:', error);
    }
    return null;
  }

  return data;
}

export async function getSponsoredGoals(): Promise<GoalWithMilestones[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('goals')
        .select('*, creator:creator_id(*), milestones(*, milestone_escrows(*))')
        .eq('sponsor_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sponsored goals:', error);
        return [];
    }

    return data || [];
}

 