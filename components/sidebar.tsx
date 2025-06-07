import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserProfile } from '@/lib/data';
import { Home, Zap, Target, User, Wallet } from 'lucide-react';

type SidebarProps = {
  searchParams?: {
    view?: string;
  };
};

export async function Sidebar({ searchParams }: SidebarProps) {
  const userProfile = await getUserProfile();
  const userRole = userProfile?.role;
  const view = searchParams?.view;

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-background p-4 flex flex-col justify-between">
      <div className="flex flex-col gap-y-2">
        <Link href="/">
          <Button variant={!view ? 'default' : 'ghost'} className="w-full justify-start gap-2">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        {userRole === 'developer' && (
          <Link href="/?view=create">
            <Button variant={view === 'create' ? 'default' : 'ghost'} className="w-full justify-start gap-2">
              <Zap className="h-4 w-4" />
              Create Goal
            </Button>
          </Link>
        )}
        {userRole === 'developer' && (
          <Link href="/?view=my-goal">
            <Button variant={view === 'my-goal' ? 'default' : 'ghost'} className="w-full justify-start gap-2">
              <Target className="h-4 w-4" />
              My Goal
            </Button>
          </Link>
        )}
        {userRole === 'sponsor' && (
          <Link href="/?view=panel">
            <Button variant={view === 'panel' ? 'default' : 'ghost'} className="w-full justify-start gap-2">
              <Wallet className="h-4 w-4" />
              Panel
            </Button>
          </Link>
        )}
        <Link href="/?view=account">
          <Button variant={view === 'account' ? 'default' : 'ghost'} className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              Account
          </Button>
        </Link>
      </div>

      <div>
        <div className="h-10 px-4 py-2 bg-primary text-primary-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium w-full">
          {userProfile
            ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
            : 'Guest'}
        </div>
      </div>
    </aside>
  );
} 