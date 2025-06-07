import { getGoalById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MilestoneList } from "@/components/goals/MilestoneList";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

type GoalDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
    const goal = await getGoalById(params.id);

    if (!goal) {
        notFound();
    }

    return (
        <div className="flex flex-col min-h-screen">
             <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <nav className="w-full flex justify-center border-b h-16">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                    <div className="font-semibold">
                    <Link href={"/"}>RLSeed</Link>
                    </div>
                    <div className="flex gap-4 items-center">
                    <AuthButton />
                    <ThemeSwitcher />
                    </div>
                </div>
                </nav>
            </header>
            <main className="flex-1 w-full max-w-4xl mx-auto p-5">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-3xl mb-2">{goal.title}</CardTitle>
                                <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>{goal.status}</Badge>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{goal.total_budget} XRP</p>
                                <p className="text-sm text-muted-foreground">Total Budget</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Description</h3>
                            <p className="whitespace-pre-wrap">{goal.description}</p>
                        </div>
                        <MilestoneList milestones={goal.milestones} />
                    </CardContent>
                    <CardFooter>
                        {goal.status === 'active' && (
                           <p className="text-sm text-muted-foreground">Funding is handled from the main dashboard.</p>
                        )}
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
} 