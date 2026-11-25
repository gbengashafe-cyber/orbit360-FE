import { localStorageKeys, LocalStorageUtil } from '@/utils/local-storage.util';
import { lazy, Suspense } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router';
import AuthorizationCenterWIP from './authorization-center';
import CompanyDocuments from './CompanyDocuments';
import ComplaintManagement from './complaints/complaint-management';
import DocumentManagement from './DocumentManagement';
import { Dashboard } from './employee-portal/dashboard/Dashboard';
import { EmployeeCooperative } from './employee-portal/employee-cooperative/cooperative-loan';
import EmployeeDocuments from './EmployeeDocuments';
import { Employees } from './employees/employees-page';
import ExitApprovals from './ExitApprovals';
import ExitManagement from './ExitManagement';
import { HRDashboard } from './hr-portal/dashboard/Dashboard';
import Cooperative from './hr-portal/loans/Cooperative';
import MyPayslips from './hr-portal/payslip/payslips';
import { TrainingRequestReview } from './hr-portal/training-request-review';
import Layout from './Layout.jsx';
import LeaveApprovals from './LeaveApprovals';
import LeaveManagement from './LeaveManagement';
import { LoginPage } from './login/Login';
import Onboarding from './Onboarding';
import NotificationCenter, { NotificationPreferences } from './notifications/NotificationCenter';
import Payroll from './Payroll';
import Recruitment from './Recruitment';
import RecruitmentApprovals from './RecruitmentApprovals';
import StaffComplaints from './complaints/staff-complaints';
import TaxCalculator from './TaxCalculator';
import RequestTraining from './training-requests/RequestTraining';
import UserManagement from './UserManagement';

// Development-only reference for DESIGN.md. Not included in production builds.
const DesignSystemPage = import.meta.env.DEV ? lazy(() => import('./design-system')) : null;

const PAGES = {
  HRDashboard: HRDashboard,

  UserManagement: UserManagement,

  Payroll: Payroll,

  Recruitment: Recruitment,

  RecruitmentApprovals: RecruitmentApprovals,

  Employees: Employees,

  TaxCalculator: TaxCalculator,

  DocumentManagement: DocumentManagement,

  EmployeeDocuments: EmployeeDocuments,

  Onboarding: Onboarding,

  MyPayslips: MyPayslips,

  payslips: MyPayslips,

  LeaveManagement: LeaveManagement,

  LeaveApprovals: LeaveApprovals,

  ExitManagement: ExitManagement,

  ExitApprovals: ExitApprovals,

  'staff-complaints': StaffComplaints,

  'complaint-management': ComplaintManagement,

  RequestTraining: RequestTraining,

  Cooperative: Cooperative,

  CompanyDocuments: CompanyDocuments,

  login: LoginPage,
  AuthorizationCenterWIP,
  TrainingRequestReview,
  notifications: NotificationCenter,
  preferences: NotificationPreferences,
  ...(DesignSystemPage ? { 'design-system': DesignSystemPage } : {}),
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
        <Route path="/login" element={isLoggedIn() ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/authorization-center" element={<AuthorizationCenterWIP />} />
        <Route path="/training-request-reviews" element={<TrainingRequestReview />} />

        <Route path="/UserManagement" element={<UserManagement />} />

        <Route path="/payroll" element={<Payroll />} />

        <Route path="/Recruitment" element={<Recruitment />} />

        <Route path="/RecruitmentApprovals" element={<RecruitmentApprovals />} />

        <Route path="/Employees" element={<Employees />} />

        <Route path="/TaxCalculator" element={<TaxCalculator />} />

        <Route path="/HRDashboard" element={<HRDashboard />} />

        <Route path="/DocumentManagement" element={<DocumentManagement />} />

        <Route path="/EmployeeDocuments" element={<EmployeeDocuments />} />

        <Route path="/Onboarding" element={<Onboarding />} />

        <Route path="/my-payslips" element={<MyPayslips />} />

        <Route path="/payslips" element={<MyPayslips />} />

        <Route path="/leave-management" element={<LeaveManagement />} />

        <Route path="/leave-approvals" element={<LeaveApprovals />} />

        <Route path="/exit-management" element={<ExitManagement />} />

        <Route path="/ExitApprovals" element={<ExitApprovals />} />

        <Route path="/staff-complaints" element={<StaffComplaints />} />
        <Route path="/StaffComplaints" element={<Navigate to="/staff-complaints" replace />} />

        <Route path="/complaint-management" element={<ComplaintManagement />} />
        <Route path="/ComplaintManagement" element={<Navigate to="/complaint-management" replace />} />

        <Route path="/request-training" element={<RequestTraining />} />

        <Route path="/notifications" element={<NotificationCenter />} />
        <Route path="/notifications/preferences" element={<NotificationPreferences />} />

        <Route path="/cooperative" element={<Cooperative />} />
        <Route path="/employee-cooperative" element={<EmployeeCooperative />} />

        <Route path="/CompanyDocuments" element={<CompanyDocuments />} />

        {DesignSystemPage ? (
          <Route
            path="/design-system"
            element={
              <Suspense fallback={null}>
                <DesignSystemPage />
              </Suspense>
            }
          />
        ) : null}
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
