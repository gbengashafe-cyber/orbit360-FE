import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/system';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalContext } from '@/state/context';
import { createPageUrl } from '@/utils';
import { HandCoins, PlaneTakeoff } from 'lucide-react';
import { Link } from 'react-router';

export function Dashboard() {
  const { currentUser, isLoadingUser } = useGlobalContext();
  const employee = currentUser?.employeeData;

  if (isLoadingUser) {
    return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8" aria-busy="true"><Skeleton className="h-16 w-72" /><Skeleton className="h-36 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={`Welcome, ${employee?.firstName ?? ''}`.replace(/, $/, '')} description={employee?.jobRole?.title || 'Your employee portal'} />

      <Card><CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Staff ID" value={employee?.staffId} />
        <Detail label="Supervisor" value={[employee?.supervisor?.firstName, employee?.supervisor?.lastName].filter(Boolean).join(' ')} />
        <Detail label="Department" value={employee?.department?.name} />
        <Detail label="SBU" value={employee?.company?.name} />
      </CardContent></Card>

      <Card><CardHeader className="pb-3"><CardTitle>Shortcuts</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">
        {SHORTCUTS.map((shortcut) => <Link key={shortcut.title} to={shortcut.url} className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"><shortcut.icon className="h-4 w-4 text-primary" strokeWidth={1.75} />{shortcut.title}</Link>)}
      </CardContent></Card>
    </div>
  );
}

function Detail({ label, value }) { return <div className="min-w-0"><p className="text-label text-muted-foreground">{label}</p><p className="truncate text-body text-foreground">{value || '—'}</p></div>; }

const SHORTCUTS = [
  { title: 'Leave management', url: createPageUrl('leave-management'), icon: PlaneTakeoff },
  { title: 'Loan requests', url: createPageUrl('employee-cooperative'), icon: HandCoins },
];
