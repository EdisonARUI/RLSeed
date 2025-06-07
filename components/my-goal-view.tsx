'use client';

import { use, Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoalWithMilestones, UserProfile, Milestone } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useXrpl } from '../lib/xrpl/hooks';
import { finishMilestone, updateGoal, deleteGoal } from '../lib/actions';
import { Loader2, Trash2, FilePenLine } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

// --- This is a placeholder for demonstration. ---
// In a real app, the developer's seed would come from a secure vault or wallet connection, NOT hardcoded.
const TEMP_DEVELOPER_SEED = process.env.XRPL_ACCOUNT2_SEED || '';

const CompleteMilestoneButton = ({ milestone, onComplete }: { milestone: Milestone, onComplete: () => void }) => {
    const { finishMilestoneEscrow } = useXrpl();
    const [isCompleting, setIsCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleComplete = async () => {
        setIsCompleting(true);
        setError(null);

        // 1. Call the server action to get escrow details and update DB
        const actionResult = await finishMilestone(milestone.id);

        if (actionResult.error || !actionResult.success || !actionResult.escrowDetails) {
            setError(actionResult.error || "Failed to get escrow details.");
            setIsCompleting(false);
            return;
        }

        const { owner, offerSequence, condition, fulfillment } = actionResult.escrowDetails;

        if (!owner || !fulfillment) {
             setError("Missing owner or fulfillment details for escrow transaction.");
             setIsCompleting(false);
             return;
        }

        // 2. Use the details to finish the on-chain transaction
        const txResult = await finishMilestoneEscrow(
            TEMP_DEVELOPER_SEED,
            owner,
            offerSequence,
            condition,
            fulfillment
        );

        if (txResult.error) {
            setError(txResult.error);
        } else {
            onComplete(); // Refresh the UI
        }

        setIsCompleting(false);
    };

    return (
        <div>
            <Button onClick={handleComplete} disabled={isCompleting} size="sm">
                {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCompleting ? 'Completing...' : 'Complete'}
            </Button>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>
    );
}

type MyGoalViewProps = {
    goalPromise: Promise<GoalWithMilestones | null>;
    userRole?: UserProfile['role'];
};

export function MyGoalView({ goalPromise, userRole }: MyGoalViewProps) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <GoalDetailsFetcher goalPromise={goalPromise} userRole={userRole}/>
        </Suspense>
    );
}

function GoalDetailsFetcher({ goalPromise, userRole }: { goalPromise: Promise<GoalWithMilestones | null>, userRole?: UserProfile['role'] }) {
    const goal = use(goalPromise);
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(goal?.title || '');
    const [description, setDescription] = useState(goal?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (goal) {
            setTitle(goal.title);
            setDescription(goal.description);
        }
    }, [goal]);

    if (!goal) {
        return (
             <div className="text-center py-10 border-dashed border-2 rounded-lg">
                <h2 className="text-xl font-medium">No Goal Found</h2>
                <p className="text-muted-foreground">You have not created a goal yet. Go to "Create Goal" to get started.</p>
            </div>
        );
    }
    
    const handleUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);
        const result = await updateGoal(goal.id, { title, description });
        setIsSubmitting(false);
        if (result.error) {
            setError(result.error);
        } else {
            setIsEditing(false);
            router.refresh();
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this goal? This cannot be undone.')) return;
        setIsDeleting(true);
        const result = await deleteGoal(goal.id);
        if (result.error) {
            setError(result.error);
            setIsDeleting(false);
        } else {
            router.push('/');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                     <CardTitle className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Goal" : goal.title}</CardTitle>
                     {!isEditing && <CardDescription className="pt-2 text-base">{goal.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing ? (
                         <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}><FilePenLine className="h-4 w-4" /></Button>
                    ) : (
                         <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    )}
                    <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="title">Goal Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={8} disabled={isSubmitting}/>
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Goal
                        </Button>
                        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                    </form>
                 ) : (
                    <div className="space-y-4 pt-4">
                        <h3 className="font-semibold">Milestones</h3>
                        {goal.milestones.map(m => (
                            <div key={m.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold">{m.title}</h4>
                                    <p className="text-sm text-muted-foreground">{m.description}</p>
                                    <p className="text-xs text-muted-foreground pt-2">STATUS: {m.status.toUpperCase()}</p>
                                </div>
                                {goal.status === 'seeded' && (m.status === 'active' || m.status === 'todo') && (
                                    <CompleteMilestoneButton milestone={m} onComplete={() => router.refresh()} />
                                )}
                            </div>
                        ))}
                    </div>
                 )}
            </CardContent>
        </Card>
    );
} 