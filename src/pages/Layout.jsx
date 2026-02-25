import { userService } from '@/api';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { GlobalContextProvider, useGlobalContext } from '@/state/context';
import { createPageUrl } from '@/utils';
import {
  BadgePercent,
  Banknote,
  BookCopy,
  Calculator,
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
  MessageSquareHeart,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  PlaneTakeoff,
  Scale,
  Shuffle,
  Star,
  UserCheck,
  UserRoundX,
  Users,
  Users2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { isLoggedIn } from '.';
import EmployeeGate from '../components/EmployeeGate';
import Logo from '../components/Logo';
import { localStorageKeys, LocalStorageUtil } from '../utils/local-storage.util';

const hrNav = [
  // { title: 'Authorization Center', url: createPageUrl('AuthorizationCenter'), icon: ClipboardList },
  { title: 'Authorization Center', url: createPageUrl('authorization-center'), icon: ClipboardList },
  { title: 'Employees', url: createPageUrl('Employees'), icon: Users2 },
  { title: 'Payroll', url: createPageUrl('payroll'), icon: Banknote },
  { title: 'Payslips', url: createPageUrl('payslips'), icon: FileText },
  { title: 'Cooperative & Loans', url: createPageUrl('Cooperative'), icon: HandCoins },
  // { title: 'Compensation Tool', url: createPageUrl('CompensationTool'), icon: Calculator },
  { title: 'Recruitment', url: createPageUrl('Recruitment'), icon: UserCheck },
  { title: 'Recruitment Approvals', url: '/RecruitmentApprovals', icon: CheckCircle2 },
  { title: 'Onboarding', url: createPageUrl('Onboarding'), icon: ClipboardList },
  { title: 'Performance', url: createPageUrl('Performance'), icon: Star },
  { title: 'Leave Approvals', url: createPageUrl('leave-approvals'), icon: CheckCircle2 },
  { title: 'Exit Approvals', url: '/ExitApprovals', icon: UserRoundX },
  { title: 'KPI Management', url: createPageUrl('KPIManagement'), icon: BadgePercent },
  { title: 'Disciplinary Actions', url: createPageUrl('DisciplinaryActions'), icon: Scale },
  { title: 'Documents', url: createPageUrl('DocumentManagement'), icon: FolderArchive },
  { title: 'Tax Calculator', url: createPageUrl('TaxCalculator'), icon: Calculator },
];

const employeePortalNav = [
  { title: 'My Payslips', url: createPageUrl('my-payslips'), icon: FileText },
  { title: 'Appraisals', url: createPageUrl('Appraisals'), icon: BookCopy },
  { title: 'Loan Requests', url: createPageUrl('employee-cooperative'), icon: HandCoins },
  { title: 'Leave Management', url: createPageUrl('leave-management'), icon: PlaneTakeoff },
  { title: 'Exit Management', url: createPageUrl('ExitManagement'), icon: UserRoundX },
  { title: 'Document Hub', url: createPageUrl('CompanyDocuments'), icon: FileBox },
  { title: 'Staff Complaints', url: createPageUrl('StaffComplaints'), icon: MessageSquareHeart },
  { title: 'Request Training', url: createPageUrl('RequestTraining'), icon: NotebookPen },
  { title: 'Staff Movement', url: createPageUrl('StaffMovement'), icon: Shuffle },
  { title: 'Authorization Center', url: createPageUrl('authorization-center'), icon: ClipboardList },
];

const supervisorNav = [
  { title: 'Exit Approvals', url: '/ExitApprovals', icon: UserRoundX },
];

const adminNav = [
  { title: 'User Management', url: createPageUrl('UserManagement'), icon: Users },
  { title: 'Install App', url: createPageUrl('InstallApp'), icon: Download },
];

const LayoutContent = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isHrNavOpen, setHrNavOpen] = useState(false);
  const [isEmployeePortalNavOpen, setEmployeePortalNavOpen] = useState(false);
  const [isSupervisorNavOpen, setIsSupervisorNavOpen] = useState(false);
  const [isAdminNavOpen, setIsAdminNavOpen] = useState(false);

  const { currentUser, isAdmin, isLoadingUser } = useGlobalContext();

  const isSupervisor = currentUser?.permissions?.includes('APPROVE_EXITS');

  useEffect(() => {
    const path = location.pathname;
    const isDashboard = path === createPageUrl('Dashboard');
    setHrNavOpen(hrNav.some((item) => path === item.url) || isDashboard);
    setEmployeePortalNavOpen(employeePortalNav.some((item) => path === item.url));
    setIsSupervisorNavOpen(supervisorNav.some((item) => path === item.url));
    setIsAdminNavOpen(adminNav.some((item) => path === item.url));
  }, [location.pathname]);

  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const MATERIAL_COLORS = {
    primary: '#1976D2',
    surface: '#FFFFFF',
    background: '#FAFAFA',
  };

  const handleLogout = async () => {
    await userService.logout();
    LocalStorageUtil.delete(localStorageKeys.ACCESS_TOKEN);
    LocalStorageUtil.delete(localStorageKeys.ACCESS_TOKEN_EXPIRES_AT);
    LocalStorageUtil.delete(localStorageKeys.CURRENT_USER);
    window.location.href = '/login';
  };

  const NavItem = ({ item }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        className={`transition-all duration-200 rounded-lg py-3 px-3 ${
          location.pathname === item.url
            ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-700'
            : 'hover:bg-gray-50 hover:shadow-sm text-gray-700 hover:text-gray-900'
        }`}
      >
        <Link to={item.url} className="flex items-center gap-3 font-medium">
          <item.icon className="w-5 h-5" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const NavGroup = ({ title, isOpen, onOpenChange, navItems }) => (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full">
        <SidebarGroupLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100 rounded-lg">
          {title}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </SidebarGroupLabel>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1 mt-1">
            {navItems.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </CollapsibleContent>
    </Collapsible>
  );

  if (isLoadingUser) {
    return (
      <div className="min-h-screen min-w-72 flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-3 text-gray-700">
          <span className="text-lg font-medium flex ">
            <Loader2 className="w-8 aspect-square animate-spin text-blue-700" /> Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: MATERIAL_COLORS.background }}>
      <Sidebar
        className="border-r border-gray-200 bg-white transition-all duration-300 shadow-lg"
        style={{
          boxShadow: '0 8px 10px -5px rgba(0,0,0,0.2), 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12)',
        }}
        collapsible
        // open={sidebarOpen}
        // onOpenChange={setSidebarOpen}
      >
        <SidebarHeader
          className="border-b border-gray-100 p-6 flex justify-between items-center"
          style={{ backgroundColor: MATERIAL_COLORS.primary }}
        >
          <div className="flex items-center gap-3">
            <Logo size="default" />
            <div className={`${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
              <h2 className="font-bold text-white text-lg">Orbit360</h2>
              <p className="text-xs text-blue-100">Business Platform</p>
            </div>
          </div>
          <div className="hidden lg:inline-flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-blue-800"
            >
              {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4 space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={`transition-all duration-200 rounded-lg py-3 px-3 ${location.pathname === createPageUrl('Dashboard') ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-700' : 'hover:bg-gray-50 hover:shadow-sm text-gray-700 hover:text-gray-900'}`}
            >
              <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3 font-medium">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <NavGroup title="Human Resources" isOpen={isHrNavOpen} onOpenChange={setHrNavOpen} navItems={hrNav} />
          <NavGroup
            title="Employee Portal"
            isOpen={isEmployeePortalNavOpen}
            onOpenChange={setEmployeePortalNavOpen}
            navItems={employeePortalNav}
          />
          {isSupervisor && (
            <NavGroup title="Supervisor" isOpen={isSupervisorNavOpen} onOpenChange={setIsSupervisorNavOpen} navItems={supervisorNav} />
          )}
          {isAdmin && (
            <NavGroup title="Administration" isOpen={isAdminNavOpen} onOpenChange={setIsAdminNavOpen} navItems={adminNav} />
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-100 p-4" style={{ backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: MATERIAL_COLORS.primary }}
            >
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className={`flex-1 min-w-0 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
              <p className="font-medium text-gray-900 text-sm truncate">
                {currentUser?.firstName}
                {isAdmin && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-600 truncate">{currentUser?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <div className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default function Layout({ children, currentPageName }) {
  if (['PublicJobView', 'ScrollBoard', 'login'].includes(currentPageName?.toLowerCase())) {
    return <>{children}</>;
  }

  return (
    <EmployeeGate>
      <GlobalContextProvider>
        <SidebarProvider
          style={{
            '--sidebar-width': '18rem',
            '--sidebar-width-mobile': '20rem',
          }}
        >
          <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
      </GlobalContextProvider>
    </EmployeeGate>
  );
}
