import { createClient } from "@/lib/supabase/server";
import { getGoals, getUserProfile, getGoalByCurrentUser } from "@/lib/data";
import { GoalCard } from "@/components/goals/GoalCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import CreateGoalPage from "./(dashboard)/goals/create/page";
import { MyGoalView } from "@/components/my-goal-view";
import { AccountView } from "@/components/account-view";
import { Header } from "@/components/header";
import { SponsorPanel } from "@/components/sponsor-panel";
import { UserProfile } from "@/lib/types";

const GoalsList = async ({ userRole }: { userRole?: UserProfile['role'] }) => {
  const goals = await getGoals();
  const userProfile = await getUserProfile();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Goals</h1>
        <p className="text-muted-foreground">Browse and fund creative projects.</p>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} userRole={userRole} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-dashed border-2 rounded-lg">
          <h2 className="text-xl font-medium">No goals found.</h2>
          <p className="text-muted-foreground mb-4">Be the first to create one!</p>
          <Link href="/?view=create">
              <Button>Create a Goal</Button>
          </Link>
        </div>
      )}
    </div>
  );
};


export default async function Home({ searchParams }: { searchParams?: { view?: string }}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userProfile = await getUserProfile();
  
  const renderContent = () => {
    switch (searchParams?.view) {
      case 'create':
        return <CreateGoalPage />;
      case 'my-goal':
        const currentUserGoal = getGoalByCurrentUser();
        return <MyGoalView goalPromise={currentUserGoal} userRole={userProfile?.role} />;
      case 'account':
        return <AccountView userProfile={userProfile} userEmail={user?.email} />;
      case 'panel':
        return <SponsorPanel userRole={userProfile?.role} />;
      default:
        return <GoalsList userRole={userProfile?.role} />;
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar searchParams={searchParams} />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
