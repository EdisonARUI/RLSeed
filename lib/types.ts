export type Goal = {
  id: number;
  created_at: string;
  title: string;
  description: string;
  total_budget: number;
  status: 'active' | 'seeded' | 'completed' | 'expired' | 'cancelled';
  creator_id: string; // uuid of the user who created the goal
  creator: UserProfile;
  sponsor_id?: string; // uuid of the user who sponsored the goal
  platform_escrow_address?: string | null;
};

// Extend Goal type to include milestones for the detail page query
export type GoalWithMilestones = Goal & {
  milestones: Milestone[];
};

export type UserProfile = {
  id: string; // uuid
  username: string;
  avatar_url: string;
  xrp_wallet_address: string;
  role: 'developer' | 'sponsor';
  is_setgoal: boolean;
};

export type MilestoneEscrow = {
    id: number;
    milestone_id: number;
    sequence: number;
    escrow_condition: string;
    escrow_fulfillment?: string;
}

export type Milestone = {
  id: number;
  created_at: string;
  goal_id: number;
  title: string;
  description?: string;
  reward_amount: number;
  deadline?: string;
  status: 'todo' | 'active' | 'completed' | 'pending_review' | 'rejected' | 'approved';
  milestone_escrows?: MilestoneEscrow[];
}; 