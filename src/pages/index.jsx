import { localStorageKeys, LocalStorageUtil } from '@/utils/local-storage.util';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router';
import Analytics from './Analytics';
import Appraisals from './Appraisals';
import AuthorizationCenter from './authorization-center';
import AuthorizationCenterWIP from './authorization-center-new';
import ClientAuth from './ClientAuth';
import CompanyDocuments from './CompanyDocuments';
import CompensationTool from './CompensationTool';
import Contacts from './Contacts';
import Cooperative from './Cooperative';
import Dashboard from './dashboard/Dashboard';
import Deals from './Deals';
import DocumentManagement from './DocumentManagement';
import EmailCenter from './EmailCenter';
import Employees from './employees/Employees';
import ExitManagement from './ExitManagement';
import ExpenseApprovals from './ExpenseApprovals';
import ExpenseDetail from './ExpenseDetail';
import Expenses from './Expenses';
import ExpenseSettings from './ExpenseSettings';
import FinancialReports from './FinancialReports';
import HRDashboard from './HRDashboard';
import InstallApp from './InstallApp';
import KPIManagement from './KPIManagement';
import Layout from './Layout.jsx';
import LeaveManagement from './LeaveManagement';
import LoginPage from './login/Login';
import MeetingManager from './MeetingManager';
import MyPayslips from './MyPayslips';
import Onboarding from './Onboarding';
import Payroll from './Payroll';
import Performance from './Performance';
import ProjectBoard from './ProjectBoard';
import Projects from './Projects';
import PublicJobView from './PublicJobView';
import Recruitment from './Recruitment';
import RequestTraining from './RequestTraining';
import ScrollBoard from './ScrollBoard';
import SmartContentEngine from './SmartContentEngine';
import SocialHub from './SocialHub';
import StaffComplaints from './StaffComplaints';
import StaffMovement from './StaffMovement';
import TaxCalculator from './TaxCalculator';
import UserManagement from './UserManagement';

const PAGES = {
  Dashboard: Dashboard,

  ClientAuth: ClientAuth,

  UserManagement: UserManagement,

  Payroll: Payroll,

  Recruitment: Recruitment,

  Employees: Employees,

  TaxCalculator: TaxCalculator,

  EmailCenter: EmailCenter,

  SocialHub: SocialHub,

  Projects: Projects,

  ProjectBoard: ProjectBoard,

  HRDashboard: HRDashboard,

  DocumentManagement: DocumentManagement,

  Performance: Performance,

  Onboarding: Onboarding,

  MyPayslips: MyPayslips,

  payslips: MyPayslips,

  Expenses: Expenses,

  ExpenseDetail: ExpenseDetail,

  ExpenseSettings: ExpenseSettings,

  CompensationTool: CompensationTool,

  ExpenseApprovals: ExpenseApprovals,

  MeetingManager: MeetingManager,

  LeaveManagement: LeaveManagement,

  Appraisals: Appraisals,

  ExitManagement: ExitManagement,

  InstallApp: InstallApp,

  ScrollBoard: ScrollBoard,

  StaffComplaints: StaffComplaints,

  RequestTraining: RequestTraining,

  StaffMovement: StaffMovement,

  SmartContentEngine: SmartContentEngine,

  PublicJobView: PublicJobView,

  Cooperative: Cooperative,

  KPIManagement: KPIManagement,

  CompanyDocuments: CompanyDocuments,

  Analytics: Analytics,

  Contacts: Contacts,

  Deals: Deals,

  FinancialReports: FinancialReports,

  login: LoginPage,
  AuthorizationCenterWIP,
};

function _getCurrentPage(url) {
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) {
    urlLastPart = urlLastPart.split('?')[0];
  }

  const pageName = Object.keys(PAGES).find((page) => page.toLowerCase() === urlLastPart.toLowerCase());
  return pageName || Object.keys(PAGES)[0];
}

function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Dashboard />} />

        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/authorization-center-old" element={<AuthorizationCenter />} />
        <Route path="/authorization-center" element={<AuthorizationCenterWIP />} />

        <Route path="/ClientAuth" element={<ClientAuth />} />

        <Route path="/UserManagement" element={<UserManagement />} />

        <Route path="/Payroll" element={<Payroll />} />

        <Route path="/Recruitment" element={<Recruitment />} />

        <Route path="/Employees" element={<Employees />} />

        <Route path="/TaxCalculator" element={<TaxCalculator />} />

        <Route path="/EmailCenter" element={<EmailCenter />} />

        <Route path="/SocialHub" element={<SocialHub />} />

        <Route path="/Projects" element={<Projects />} />

        <Route path="/ProjectBoard" element={<ProjectBoard />} />

        <Route path="/HRDashboard" element={<HRDashboard />} />

        <Route path="/DocumentManagement" element={<DocumentManagement />} />

        <Route path="/Performance" element={<Performance />} />

        <Route path="/Onboarding" element={<Onboarding />} />

        <Route path="/my-payslips" element={<MyPayslips />} />

        <Route path="/payslips" element={<MyPayslips />} />

        <Route path="/Expenses" element={<Expenses />} />

        <Route path="/ExpenseDetail" element={<ExpenseDetail />} />

        <Route path="/ExpenseSettings" element={<ExpenseSettings />} />

        <Route path="/CompensationTool" element={<CompensationTool />} />

        <Route path="/ExpenseApprovals" element={<ExpenseApprovals />} />

        <Route path="/MeetingManager" element={<MeetingManager />} />

        <Route path="/leave-management" element={<LeaveManagement />} />

        <Route path="/Appraisals" element={<Appraisals />} />

        <Route path="/ExitManagement" element={<ExitManagement />} />

        <Route path="/InstallApp" element={<InstallApp />} />

        <Route path="/ScrollBoard" element={<ScrollBoard />} />

        <Route path="/StaffComplaints" element={<StaffComplaints />} />

        <Route path="/RequestTraining" element={<RequestTraining />} />

        <Route path="/StaffMovement" element={<StaffMovement />} />

        <Route path="/SmartContentEngine" element={<SmartContentEngine />} />

        <Route path="/PublicJobView" element={<PublicJobView />} />

        <Route path="/cooperative" element={<Cooperative />} />

        <Route path="/KPIManagement" element={<KPIManagement />} />

        <Route path="/CompanyDocuments" element={<CompanyDocuments />} />

        <Route path="/Analytics" element={<Analytics />} />

        <Route path="/Contacts" element={<Contacts />} />

        <Route path="/Deals" element={<Deals />} />

        <Route path="/FinancialReports" element={<FinancialReports />} />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <RequireAuth>
        <PagesContent />
      </RequireAuth>
    </Router>
  );
}

export const isLoggedIn = () => {
  // const expiresAt = LocalStorageUtil.get(localStorageKeys.ACCESS_TOKEN_EXPIRES_AT);
  const accessToken = LocalStorageUtil.get(localStorageKeys.ACCESS_TOKEN);

  if (!accessToken) return false;

  return true;
};

const RequireAuth = ({ children }) => {
  const location = useLocation();

  if (!isLoggedIn()) {
    <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
