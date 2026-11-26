import { apiClient } from '@/api/apiClient';
import { notificationService } from '@/api/notification.service';
import { PageHeader, StatCard, StatusBadge, formatDate, formatDateTime } from '@/components/system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationDestination } from '@/notifications/destination';
import { useGlobalContext } from '@/state/context';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

const actions = [['Request leave', '/leave-management'], ['Request loan', '/employee-cooperative'], ['Request training', '/request-training'], ['View payslips', '/my-payslips'], ['View documents', '/companydocuments'], ['Submit a complaint', '/staff-complaints']];

export function PersonalDashboard() {
  const { currentUser } = useGlobalContext();
  const [summary, setSummary] = useState(null);
  const [summaryState, setSummaryState] = useState('loading');
  const [notifications, setNotifications] = useState([]);
  const [notificationState, setNotificationState] = useState('loading');
  useEffect(() => {
    let active = true;
    apiClient.get('/v1/dashboard/me').then(result => { if (active) { setSummary(result.data); setSummaryState('ready'); } }).catch(() => { if (active) setSummaryState('error'); });
    notificationService.getFeed({ rows: '5', sort: 'desc' }).then(result => { if (active) { setNotifications(result.data || []); setNotificationState('ready'); } }).catch(() => { if (active) setNotificationState('error'); });
    return () => { active = false; };
  }, []);
  const employee = summary?.employee;
  const profile = employee;
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const cards = [['Available annual leave', summary?.leaveBalance == null ? 'Unavailable' : `${summary.leaveBalance} days`, '/leave-management'], ['Pending requests', summary?.pendingRequests ?? 'Unavailable', '#recent-requests'], ['Active loans', summary?.activeLoans ?? 'Unavailable', '/employee-cooperative'], ['Latest payslip', summary?.latestPayslip ?? 'Unavailable', '/my-payslips']];
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
    <PageHeader title={`${greeting}${employee?.firstName ? `, ${employee.firstName}` : ''}`} description={`Your personal HR workspace · ${formatDate(new Date())}`} />
    {summaryState === 'loading' ? <Skeleton className="h-36 w-full" /> : summaryState === 'error' ? <p role="alert">Your dashboard could not be loaded. Please refresh the page.</p> : !employee ? <p>No employee profile is linked to your account.</p> : <>
      <Card><CardHeader><CardTitle>Employment summary</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium" aria-label="Employee initials">{`${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`}</span><Detail label="Name" value={`${employee.firstName} ${employee.lastName}`} /></div><Detail label="Staff ID" value={employee.staffId} /><Detail label="Designation" value={profile?.jobRole?.title} /><Detail label="Department" value={profile?.department?.name || profile?.company?.name} /><div><p className="text-label text-muted-foreground">Employment status</p><StatusBadge status={employee.status} /></div></CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, path]) => path.startsWith('#') ? <a key={label} href={path}><StatCard label={label} value={value} /></a> : <Link key={label} to={path}><StatCard label={label} value={value} /></Link>)}</div>
      <Card><CardHeader><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">{actions.map(([label, path]) => <Link key={path} to={path} className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">{label}</Link>)}</CardContent></Card>
      <Card id="recent-requests"><CardHeader><CardTitle>Recent requests</CardTitle></CardHeader><CardContent>{summary.requestsIncomplete && <p role="alert" className="mb-3 text-sm text-muted-foreground">Some requests could not be loaded.</p>}{summary.recentRequests.length ? <ul className="divide-y">{summary.recentRequests.map(item => <li key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><Link className="text-primary hover:underline" to={item.path}>{item.title}</Link><span className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</span><StatusBadge status={item.status} /></li>)}</ul> : <p className="text-sm text-muted-foreground">No recent requests.</p>}</CardContent></Card>
    </>}
    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Recent notifications</CardTitle><Link to="/notifications" className="text-sm text-primary hover:underline">View notifications</Link></CardHeader><CardContent>{notificationState === 'loading' ? <Skeleton className="h-20 w-full" /> : notificationState === 'error' ? <p role="alert">Notifications could not be loaded.</p> : notifications.length ? <ul className="divide-y">{notifications.map(item => <li key={item.id} className="py-3"><Link to={notificationDestination(item, currentUser?.permissions || [])} className="text-primary hover:underline">{item.title}</Link>{!item.isRead && <span className="ml-2 text-xs text-muted-foreground">Unread</span>}<p className="text-sm">{item.message}</p><p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No notifications yet.</p>}</CardContent></Card>
  </div>;
}
function Detail({ label, value }) { return <div className="min-w-0"><p className="text-label text-muted-foreground">{label}</p><p className="truncate text-body">{value || '—'}</p></div>; }
