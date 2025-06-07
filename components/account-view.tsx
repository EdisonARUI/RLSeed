'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserProfile } from '@/lib/types';
import { getXrpBalance } from '@/lib/xrpl';
import { Loader2 } from 'lucide-react';

export function AccountView({ userProfile, userEmail }: { userProfile: UserProfile | null, userEmail: string | undefined }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      if (!userProfile?.xrp_wallet_address) {
        setIsLoadingBalance(false);
        return;
      }
      setIsLoadingBalance(true);
      const xrpBalance = await getXrpBalance(userProfile.xrp_wallet_address);
      setBalance(xrpBalance);
      setIsLoadingBalance(false);
    }
    fetchBalance();
  }, [userProfile?.xrp_wallet_address]);

  if (!userProfile) {
    return <div>Could not load user profile. You might not be logged in.</div>;
  }
  
  return (
    <Card>
        <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your user details as stored in the database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <p>{userProfile.username}</p>
            </div>
             <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{userEmail}</p>
            </div>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{userProfile.id}</p>
            </div>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p>{userProfile.role}</p>
            </div>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-muted-foreground">XRP Wallet Address</p>
                <p className="font-mono text-xs">{userProfile.xrp_wallet_address}</p>
            </div>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-muted-foreground">XRP Balance</p>
                 {isLoadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <p className="font-mono text-xs">{balance !== null ? `${balance} XRP` : 'Could not fetch balance.'}</p>
                )}
            </div>
        </CardContent>
    </Card>
  );
} 