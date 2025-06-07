'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { createGoal } from '../../../../lib/actions';

export default function CreateGoalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState<{ title: string; reward_amount: number; deadline: string; }[]>([
    { title: '', reward_amount: 0, deadline: '' },
  ]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newTotalBudget = milestones.reduce((sum, m) => sum + (m.reward_amount || 0), 0);
    setTotalBudget(newTotalBudget);
  }, [milestones]);

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', reward_amount: 0, deadline: '' }]);
  };

  const handleRemoveMilestone = (index: number) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(newMilestones);
  };

  const handleMilestoneChange = (index: number, field: 'title' | 'reward_amount' | 'deadline', value: string) => {
    const newMilestones = [...milestones];
    if (field === 'title') {
      newMilestones[index].title = value;
    } else if (field === 'reward_amount') {
      newMilestones[index].reward_amount = parseFloat(value) || 0;
    } else if (field === 'deadline') {
      newMilestones[index].deadline = value;
    }
    setMilestones(newMilestones);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createGoal({
      title,
      description,
      milestones,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.goalId) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      router.refresh();
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create a New Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="e.g., Build a decentralized social network"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe the goal in detail, including its purpose, scope, and expected outcomes."
                rows={10}
                disabled={isSubmitting}
              />
            </div>
            
            <div>
                <h3 className="text-lg font-medium mb-2">Milestones</h3>
                <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="flex-grow space-y-2">
                                <Label htmlFor={`milestone-title-${index}`}>Title</Label>
                                <Input
                                    id={`milestone-title-${index}`}
                                    value={milestone.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMilestoneChange(index, 'title', e.target.value)}
                                    placeholder="e.g., Implement user authentication"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="w-48 space-y-2">
                                <Label htmlFor={`milestone-deadline-${index}`}>Deadline</Label>
                                <Input
                                    id={`milestone-deadline-${index}`}
                                    type="date"
                                    value={milestone.deadline}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMilestoneChange(index, 'deadline', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="w-32 space-y-2">
                                <Label htmlFor={`milestone-amount-${index}`}>Reward (XRP)</Label>
                                <Input
                                    id={`milestone-amount-${index}`}
                                    type="number"
                                    value={milestone.reward_amount}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMilestoneChange(index, 'reward_amount', e.target.value)}
                                    placeholder="100"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <Button type="button" variant="destructive" onClick={() => handleRemoveMilestone(index)} disabled={isSubmitting}>
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
                 <Button type="button" variant="outline" onClick={handleAddMilestone} className="mt-4" disabled={isSubmitting}>
                    Add Milestone
                </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-budget">Total Budget (XRP)</Label>
              <Input
                id="total-budget"
                type="number"
                value={totalBudget}
                disabled
                readOnly
              />
              <p className="text-sm text-muted-foreground">
                Total budget is automatically calculated from milestone rewards.
              </p>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 