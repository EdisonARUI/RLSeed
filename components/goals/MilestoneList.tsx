'use client';

import { Milestone } from "@/lib/types";
import { Badge } from "../ui/badge";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, CheckCircle2 } from "lucide-react";

type MilestoneListProps = {
    milestones: Milestone[];
};

export function MilestoneList({ milestones }: MilestoneListProps) {
    if (!milestones || milestones.length === 0) {
        return <p>No milestones for this goal yet.</p>;
    }

    return (
        <div>
            <h3 className="font-semibold text-lg mb-2">Milestones</h3>
            <div className="space-y-4">
                {milestones.map((milestone) => (
                     <Card key={milestone.id}>
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{milestone.title}</CardTitle>
                                <Badge variant={milestone.status === 'completed' || milestone.status === 'approved' ? 'default' : 'secondary'}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                     {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                                 </Badge>
                             </div>
                             {milestone.deadline && (
                                <CardDescription className="flex items-center gap-2 pt-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>Due by {format(new Date(milestone.deadline), "MMM dd, yyyy")}</span>
                                </CardDescription>
                             )}
                        </CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground mb-2">
                                {milestone.description || 'No description provided.'}
                             </p>
                             <p className="font-semibold">{milestone.reward_amount} XRP</p>
                        </CardContent>
                     </Card>
                ))}
            </div>
        </div>
    );
}

// Note: You may need to add a 'success' variant to your Badge component for this to work as intended.
// You can add this in `components/ui/badge.tsx` in the `badgeVariants`.
// e.g., success: "border-transparent bg-green-500 text-primary-foreground shadow hover:bg-green-500/80", 