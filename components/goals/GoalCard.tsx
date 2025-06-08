'use client';

import { useState } from 'react';
import { GoalWithMilestones, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { MilestoneList } from './MilestoneList';
import { getGoalDetailsForModal, fundGoalWithMilestoneEscrows } from '@/lib/actions';
import { Loader2, CalendarIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { format, isPast } from 'date-fns';
import { useXrpl } from '@/lib/xrpl/hooks';
import * as crypto from 'crypto';
import * as xrpl from 'xrpl';
import confetti from 'canvas-confetti';

const FundButton = ({ goal, goalDetails, onFundingComplete }: { goal: GoalWithMilestones, goalDetails: GoalWithMilestones, onFundingComplete: () => void }) => {
    const { connect, getTestnetFundingWallet } = useXrpl();
    const [isFunding, setIsFunding] = useState(false);
    const [fundingError, setFundingError] = useState<string | null>(null);

    const handleFund = async () => {
        setIsFunding(true);
        setFundingError(null);
        
        try {
            // 1. Connect to XRPL and get a test wallet
            const client = await connect();
            const wallet = await getTestnetFundingWallet(client);
            
            if (!wallet) {
                throw new Error('Failed to get test wallet');
            }

            // 2. Prepare escrow data for each milestone
            const escrowData = goalDetails.milestones.map((milestone, index) => ({
                milestone_id: milestone.id,
                sequence: index + 1,
                escrow_condition: crypto.randomBytes(32).toString('hex'), // Mock condition
                escrow_fulfillment: crypto.randomBytes(32).toString('hex'), // Mock fulfillment
            }));

            // 3. Call the funding action
            const result = await fundGoalWithMilestoneEscrows(
                goal.id,
                wallet.address,
                escrowData
            );

            if (result.error) {
                throw new Error(result.error);
            }

            // 4. Show success animation
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });

            // 5. Update UI
            onFundingComplete();
        } catch (error) {
            setFundingError(error instanceof Error ? error.message : 'Failed to fund goal');
        } finally {
            setIsFunding(false);
        }
    };

    return (
        <>
            <Button onClick={handleFund} disabled={isFunding} className="w-full font-semibold" size="lg">
                {isFunding ? 'Funding...' : `Fund`}
            </Button>
            {fundingError && <p className="text-destructive text-sm mt-2 col-span-2">{fundingError}</p>}
        </>
    );
};


type GoalCardProps = {
  goal: GoalWithMilestones; // Now expects milestones for progress calculation
  userRole?: UserProfile['role'];
};

export function GoalCard({ goal, userRole }: GoalCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalDetails, setGoalDetails] = useState<GoalWithMilestones | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isFundingComplete, setIsFundingComplete] = useState(goal.status === 'seeded');

  const completedMilestones = (goal.milestones || []).filter(m => m.status === 'completed' || m.status === 'approved').length;
  const progressPercentage = goal.milestones?.length > 0 ? (completedMilestones / goal.milestones.length) * 100 : 0;

  const releasedBudget = (goal.milestones || [])
    .filter(m => m.status === 'completed' || m.status === 'approved')
    .reduce((sum, m) => sum + m.reward_amount, 0);
  const remainingBudget = goal.total_budget - releasedBudget;

  const getNextMilestone = () => {
      if (goal.status !== 'seeded') return null;
      return (goal.milestones || []).find(m => m.status === 'active' || m.status === 'todo');
  }

  const nextMilestone = getNextMilestone();
  const isExpired = nextMilestone?.deadline ? isPast(new Date(nextMilestone.deadline)) : false;
  const currentStatus = isExpired && goal.status === 'seeded' ? 'expired' : goal.status;

  const handleViewDetails = async () => {
    setIsModalOpen(true);
    if (!goalDetails) {
        setIsLoadingDetails(true);
        const details = await getGoalDetailsForModal(goal.id);
        setGoalDetails(details);
        setIsLoadingDetails(false);
    }
  };

  const handleFundingComplete = () => {
      setIsFundingComplete(true);
      goal.status = 'seeded';
      setIsModalOpen(false);
      // Force a re-render of the card
      setGoalDetails(prev => prev ? { ...prev, status: 'seeded' } : null);
  }
  
  return (
    <>
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{goal.title}</CardTitle>
                    <div className="flex items-center gap-2">
                       {currentStatus === 'expired' && (
                           <Button variant="destructive" size="sm">
                               <RefreshCw className="h-4 w-4 mr-2"/> Refund
                           </Button>
                       )}
                       <Badge variant={currentStatus === 'active' ? 'default' : (currentStatus === 'seeded' ? 'secondary' : 'outline')}>
                           {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                       </Badge>
                    </div>
                </div>
                 <CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        {nextMilestone && nextMilestone.deadline && (
                            <div className={`flex items-center gap-1 ${isExpired ? 'text-destructive' : ''}`}>
                                {isExpired ? <AlertTriangle className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                                <span>
                                    {isExpired ? 'Expired on' : 'Due by'} {format(new Date(nextMilestone.deadline), "MMM dd, yyyy")}
                                </span>
                            </div>
                        )}
                    </div>
                 </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <p className="text-muted-foreground line-clamp-2">{goal.description}</p>
                <div>
                    <div className="mb-2 flex justify-between text-sm font-medium">
                        <span>Progress ({completedMilestones}/{goal.milestones.length})</span>
                        <span>{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start space-y-2 pt-4">
                <div className="w-full flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="text-lg font-bold">{goal.total_budget} XRP</span>
                </div>
                 <div className="w-full flex justify-between items-baseline text-sm">
                    <span className="text-green-500">Released</span>
                    <span>{releasedBudget} XRP</span>
                </div>
                 <div className="w-full flex justify-between items-baseline text-sm">
                    <span className="text-amber-500">Remaining</span>
                    <span>{remainingBudget} XRP</span>
                </div>
                 <Button onClick={handleViewDetails} className="w-full mt-4">View Details</Button>
            </CardFooter>
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={goal.title}>
            <div className="space-y-4">
                {isLoadingDetails ? (
                    <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : goalDetails ? (
                    <MilestoneList milestones={goalDetails.milestones} />
                ) : (
                    <p>Could not load goal details.</p>
                )}
            </div>
            <div className="mt-6 flex items-stretch justify-center gap-4">
                 {userRole === 'sponsor' && goal.status === 'active' && !isFundingComplete && goalDetails ? (
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full" size="lg">Close</Button>
                        <FundButton goal={goal} goalDetails={goalDetails} onFundingComplete={handleFundingComplete} />
                    </>
                 ) : (
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full" size="lg">Close</Button>
                 )}
            </div>
        </Modal>
    </>
  );
}
