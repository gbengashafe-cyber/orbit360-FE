import { userService } from '@/api';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { NotificationCenterProvider, useNotificationCenter } from '@/context/NotificationCenterContext';
import { GlobalContextProvider, useGlobalContext } from '@/state/context';
import { createPageUrl } from '@/utils';
import {
  Banknote,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  FileBox,
  FileText,
  FolderArchive,
  HandCoins,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareWarning,
  NotebookPen,
  PlaneTakeoff,
  UserCheck,
  UserRoundX,
  Users,
  Users2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { isLoggedIn } from '.';
import EmployeeGate from '../components/EmployeeGate';
import { localStorageKeys, LocalStorageUtil } from '../utils/local-storage.util';
import logo from '../ORBIT360_logo_white.png';

const authorizationItem = { title: 'Authorization Center', url: createPageUrl('authorization-center'), icon: ClipboardList, requiresSupervisor: true };

const hrNav = [
  { title: 'HR Dashboard', url: createPageUrl('hr-dashboard'), icon: LayoutDashboard },
  authorizationItem,
  { title: 'Employees', url: createPageUrl('Employees'), icon: Users2 },
  { title: 'Payrolls', url: createPageUrl('payroll'), icon: Banknote },
  { title: 'Payslips', url: createPageUrl('payslips'), icon: FileText },
  { title: 'Cooperative & Loans', url: createPageUrl('Cooperative'), icon: HandCoins },
  { title: 'Training Requests Review', url: createPageUrl('training-request-reviews'), icon: NotebookPen },
  { title: 'Recruitment', url: createPageUrl('Recruitment'), icon: UserCheck },
  { title: 'Recruitment Approvals', url: '/RecruitmentApprovals', icon: CheckCircle2 },
  { title: 'Onboarding', url: createPageUrl('Onboarding'), icon: ClipboardList },
  { title: 'Leave Approvals', url: createPageUrl('leave-approvals'), icon: CheckCircle2 },
  { title: 'Exit Review', url: '/ExitApprovals', icon: UserRoundX },
  { title: 'Documents', url: createPageUrl('DocumentManagement'), icon: FolderArchive },
  { title: 'Staff Complaints', url: createPageUrl('complaint-management'), icon: MessageSquareWarning, permissions: ['MANAGE_COMPLAINTS', 'APPROVE_COMPLAINTS'] },
];

const employeePortalNav = [
  { title: 'Dashboard', url: createPageUrl('dashboard'), icon: LayoutDashboard },
  authorizationItem,
  { title: 'Notification Hub', url: '/notifications', icon: Bell, notificationHub: true },
  { title: 'My Payslips', url: createPageUrl('my-payslips'), icon: FileText },
  { title: 'Loan Requests', url: createPageUrl('employee-cooperative'), icon: HandCoins },
  { title: 'Leave Management', url: createPageUrl('leave-management'), icon: PlaneTakeoff },
  { title: 'Exit Management', url: createPageUrl('exit-management'), icon: UserRoundX },
  { title: 'Document Hub', url: createPageUrl('CompanyDocuments'), icon: FileBox },
  { title: 'Request Training', url: createPageUrl('request-training'), icon: NotebookPen },
  { title: 'Staff Complaints', url: createPageUrl('staff-complaints'), icon: MessageSquareWarning },
];

const adminNav = [
  { title: 'User Management', url: createPageUrl('UserManagement'), icon: Users },
  { title: 'Install App', url: createPageUrl('InstallApp'), icon: Download },
];

const hasAnyPermission = (user, permissions) => {
  const userPermissions = (user?.permissions ?? []).map((permission) => permission?.toString().toUpperCase());
  return permissions.some((permission) => userPermissions.includes(permission));
};

const isHRManager = (user) => {
  const roleTitle = user?.employeeData?.jobRole?.title ?? user?.employeeData?.jobRole?.name ?? '';
  return /HUMAN RESOURCES MANAGER|HR MANAGER/i.test(roleTitle);
};

const isVisible = (item, user) => {
  if (item.permissions && !hasAnyPermission(user, item.permissions)) return false;
  if (item.requiresSupervisor && !user?.isSupervisor) return false;
  return true;
};

const LayoutContent = ({ children }) => {
  const location = useLocation();
  const [isHrNavOpen, setHrNavOpen] = useState(true);
  const [isEmployeePortalNavOpen, setEmployeePortalNavOpen] = useState(false);
  const [isAdminNavOpen, setIsAdminNavOpen] = useState(false);
  const initializedNavigation = useRef(false);
  const { currentUser, isAdmin, isLoadingUser } = useGlobalContext();
  const { setOpenMobile, state, toggleSidebar } = useSidebar();
  const { unread } = useNotificationCenter();
  const userIsHR = Boolean(currentUser?.isHR);
  const userIsHRManager = userIsHR && isHRManager(currentUser);

  useEffect(() => { setOpenMobile(false); }, [location.pathname, setOpenMobile]);

  useEffect(() => {
    if (isLoadingUser) return;
    if (userIsHR && !initializedNavigation.current) {
      setHrNavOpen(true);
      setEmployeePortalNavOpen(false);
      initializedNavigation.current = true;
      return;
    }

    initializedNavigation.current = true;
    setHrNavOpen(hrNav.some((item) => location.pathname === item.url));
    setEmployeePortalNavOpen(employeePortalNav.some((item) => location.pathname === item.url));
    setIsAdminNavOpen(adminNav.some((item) => location.pathname === item.url));
  }, [isLoadingUser, location.pathname, userIsHR]);

  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await userService.logout();
    LocalStorageUtil.delete(localStorageKeys.ACCESS_TOKEN);
    LocalStorageUtil.delete(localStorageKeys.ACCESS_TOKEN_EXPIRES_AT);
    LocalStorageUtil.delete(localStorageKeys.CURRENT_USER);
    window.location.href = '/login';
  };

  const NavItem = ({ item }) => {
    const active = location.pathname === item.url;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-9 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground">
          <Link to={item.url} onClick={() => setOpenMobile(false)} className="flex items-center gap-2.5">
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <span className="flex-1 truncate">{item.title}</span>
            {item.notificationHub && unread.total > 0 ? <span className="rounded-sm bg-primary px-1.5 text-xs font-semibold leading-5 text-primary-foreground">{unread.total > 99 ? '99+' : unread.total}</span> : null}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const NavigationItems = ({ items, excludeAuthorization = false }) => (
    <SidebarMenu className="space-y-1">
      {items.filter((item) => isVisible(item, currentUser) && (!excludeAuthorization || item.url !== authorizationItem.url)).map((item) => <NavItem key={item.title} item={item} />)}
    </SidebarMenu>
  );

  const NavGroup = ({ title, isOpen, onOpenChange, items, excludeAuthorization }) => (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="group/collapsible">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-label font-semibold text-muted-foreground hover:bg-accent hover:text-foreground">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" strokeWidth={1.75} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1">
        <NavigationItems items={items} excludeAuthorization={excludeAuthorization} />
      </CollapsibleContent>
    </Collapsible>
  );

  const employeeItems = employeePortalNav.filter((item) => isVisible(item, currentUser));
  const compactNavigationItems = [...(userIsHR ? hrNav : []), ...employeeItems, ...(isAdmin ? adminNav : [])]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.url === item.url) === index);
  const isSidebarCollapsed = state === 'collapsed';

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="flex h-16 shrink-0 flex-row items-center border-b border-white/20 bg-primary px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="w-24 group-data-[collapsible=icon]:hidden">
            <img src={logo} alt="Orbit 360" className="h-auto w-24" />
          </div>
          <div className="hidden w-8 overflow-hidden group-data-[collapsible=icon]:block" aria-label="Orbit 360">
            <img src={logo} alt="" className="h-auto w-24 max-w-none" />
          </div>
        </SidebarHeader>

        {isLoadingUser ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading navigation" />
          </div>
        ) : (
          <SidebarContent className="px-3 py-4">
            {isSidebarCollapsed ? (
              <SidebarGroup className="p-0">
                <SidebarGroupContent><NavigationItems items={compactNavigationItems} /></SidebarGroupContent>
              </SidebarGroup>
            ) : (
              <>
                {userIsHR ? (
              <SidebarGroup className="p-0">
                <NavGroup title="HR resources" isOpen={isHrNavOpen} onOpenChange={setHrNavOpen} items={hrNav} excludeAuthorization={userIsHRManager} />
              </SidebarGroup>
                ) : null}

                {userIsHRManager && currentUser?.isSupervisor ? (
              <>
                <SidebarSeparator className="my-3" />
                <SidebarGroup className="p-0">
                  <SidebarGroupLabel className="px-2.5 py-1.5 text-label font-semibold text-muted-foreground">Authorization</SidebarGroupLabel>
                  <SidebarGroupContent><NavigationItems items={[authorizationItem]} /></SidebarGroupContent>
                </SidebarGroup>
              </>
                ) : null}

                {userIsHR ? <SidebarSeparator className="my-3" /> : null}
                <SidebarGroup className="p-0">
                  {userIsHR ? (
                    <NavGroup title="Employee portal" isOpen={isEmployeePortalNavOpen} onOpenChange={setEmployeePortalNavOpen} items={employeePortalNav} excludeAuthorization={userIsHRManager} />
                  ) : (
                    <SidebarGroupContent><NavigationItems items={employeeItems} /></SidebarGroupContent>
                  )}
                </SidebarGroup>

                {isAdmin ? (
              <>
                <SidebarSeparator className="my-3" />
                <SidebarGroup className="p-0"><NavGroup title="Administration" isOpen={isAdminNavOpen} onOpenChange={setIsAdminNavOpen} items={adminNav} /></SidebarGroup>
              </>
                ) : null}
              </>
            )}
          </SidebarContent>
        )}

        {isLoadingUser ? null : (
          <SidebarFooter className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-primary"><UserCheck className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-label font-medium text-foreground">{currentUser?.firstName} {currentUser?.lastName}</p><p className="truncate text-caption text-muted-foreground">{currentUser?.email}</p></div>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={handleLogout} aria-label="Log out"><LogOut /></Button>
            </div>
          </SidebarFooter>
        )}
      </Sidebar>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-3 sm:px-5">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden" aria-label="Open navigation menu"><Menu /></Button>
          <SidebarTrigger aria-label="Toggle navigation" className="hidden md:inline-flex" />
          <NotificationBell />
        </header>
        <div className="min-h-0 flex-1 overflow-auto"><div className="min-h-full">{children}</div></div>
      </main>
    </div>
  );
};

export default function Layout({ children, currentPageName }) {
  if (['PublicJobView', 'ScrollBoard', 'login', 'design-system'].includes(currentPageName?.toLowerCase())) return <>{children}</>;

  return (
    <EmployeeGate>
      <GlobalContextProvider>
        <SidebarProvider style={{ '--sidebar-width': '18rem', '--sidebar-width-mobile': '20rem' }}>
          <NotificationCenterProvider><LayoutContent>{children}</LayoutContent></NotificationCenterProvider>
        </SidebarProvider>
      </GlobalContextProvider>
    </EmployeeGate>
  );
}
