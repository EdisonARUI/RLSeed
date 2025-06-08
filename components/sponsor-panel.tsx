import { getSponsoredGoals } from '@/lib/data';
import { GoalCard } from './goals/GoalCard';
import { UserProfile, GoalWithMilestones } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// Mock data for testing
const mockSponsoredGoals: GoalWithMilestones[] = [
    {
        id: 1,
        created_at: new Date().toISOString(),
        title: "Build a Decentralized Social Network",
        description: "Create a social network platform using blockchain technology",
        total_budget: 1000,
        status: "seeded",
        creator_id: "mock-creator-1",
        creator: {
            id: "mock-creator-1",
            username: "alice_dev",
            avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
            role: "developer",
            is_setgoal: true,
            xrp_wallet_address: "mock-wallet-1"
        },
        sponsor_id: "mock-sponsor-1",
        platform_escrow_address: "mock-escrow-1",
        milestones: [
            {
                id: 1,
                goal_id: 1,
                title: "Design System Architecture",
                description: "Create the initial system design and architecture",
                reward_amount: 300,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: "completed",
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                goal_id: 1,
                title: "Implement Core Features",
                description: "Develop the main functionality of the platform",
                reward_amount: 400,
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                status: "active",
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                goal_id: 1,
                title: "Testing and Deployment",
                description: "Final testing and platform deployment",
                reward_amount: 300,
                deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
                status: "todo",
                created_at: new Date().toISOString()
            }
        ]
    },
    {
        id: 2,
        created_at: new Date().toISOString(),
        title: "Develop Smart Contract Framework",
        description: "Create a reusable framework for smart contract development",
        total_budget: 800,
        status: "seeded",
        creator_id: "mock-creator-2",
        creator: {
            id: "mock-creator-2",
            username: "bob_dev",
            avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
            role: "developer",
            is_setgoal: true,
            xrp_wallet_address: "mock-wallet-2"
        },
        sponsor_id: "mock-sponsor-1",
        platform_escrow_address: "mock-escrow-2",
        milestones: [
            {
                id: 4,
                goal_id: 2,
                title: "Framework Design",
                description: "Design the framework architecture",
                reward_amount: 300,
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                status: "completed",
                created_at: new Date().toISOString()
            },
            {
                id: 5,
                goal_id: 2,
                title: "Core Implementation",
                description: "Implement the core framework features",
                reward_amount: 500,
                deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                status: "active",
                created_at: new Date().toISOString()
            }
        ]
    }
];

export const SponsorPanel = async ({ userRole }: { userRole?: UserProfile['role'] }) => {
    // Use mock data for testing
    const sponsoredGoals = process.env.NODE_ENV === 'development' ? mockSponsoredGoals : await getSponsoredGoals();

    if (sponsoredGoals.length === 0) {
        return (
            <div className="text-center py-10 border-dashed border-2 rounded-lg">
                <h2 className="text-xl font-medium">No Sponsored Goals</h2>
                <p className="text-muted-foreground">You have not sponsored any projects yet.</p>
            </div>
        );
    }
    
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Sponsored Goals</h1>
                <p className="text-muted-foreground">Projects you are currently funding.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sponsoredGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} userRole={userRole}/>
                ))}
            </div>
        </div>
    );
}; 