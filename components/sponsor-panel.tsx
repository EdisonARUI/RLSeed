import { getSponsoredGoals } from '@/lib/data';
import { GoalCard } from './goals/GoalCard';
import { UserProfile } from '@/lib/types';

export const SponsorPanel = async ({ userRole }: { userRole?: UserProfile['role'] }) => {
    const sponsoredGoals = await getSponsoredGoals();

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