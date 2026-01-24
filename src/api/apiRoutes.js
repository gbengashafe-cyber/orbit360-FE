// API Routes configuration
export class ApiRoutes {
  static BASE_URL = 'http://localhost:3000/api';

  // Authentication
  static Login = '/auth/login';
  static Logout = '/auth/logout';
  static GetCurrentUser = '/auth/me';
  static GoogleCallback = '/auth/google/callback';

  // Users
  static GetUsers = '/v1/users';
  static GetUserById = (id) => `/v1/users/${id}`;
  static CreateUser = '/v1/users';
  static UpdateUser = (id) => `/v1/users/${id}`;
  static DeleteUser = (id) => `/v1/users/${id}`;

  // Employees
  static GetEmployees = '/v1/employees';
  static GetEmployeeById = (id) => `/v1/employees/${id}`;
  static CreateEmployee = '/v1/employees';
  static UpdateEmployee = (id) => `/v1/employees/${id}`;
  static TerminateEmployee = (id) => `/v1/employees/${id}/status`;
  static DeleteEmployee = (id) => `/v1/employees/${id}`;

  // Departments
  static GetDepartments = '/v1/departments';
  static GetDepartmentById = (id) => `/v1/departments/${id}`;
  static CreateDepartment = '/v1/departments';
  static UpdateDepartment = (id) => `/v1/departments/${id}`;
  static DeleteDepartment = (id) => `/v1/departments/${id}`;

  // Job Roles/Positions
  static GetJobRoles = '/v1/job-roles';
  static GetJobRoleById = (id) => `/v1/job-roles/${id}`;
  static CreateJobRole = '/v1/job-roles';
  static UpdateJobRole = (id) => `/v1/job-roles/${id}`;
  static DeleteJobRole = (id) => `/v1/job-roles/${id}`;

  // Recruitment - Job Postings
  static GetJobPostings = '/v1/recruitment/postings';
  static GetJobPostingById = (id) => `/v1/recruitment/postings/${id}`;
  static CreateJobPosting = '/v1/recruitment/postings';
  static UpdateJobPosting = (id) => `/v1/recruitment/postings/${id}`;
  static DeleteJobPosting = (id) => `/v1/recruitment/postings/${id}`;
  static ApproveJobPosting = (id) => `/v1/recruitment/postings/${id}/approve`;
  static RejectJobPosting = (id) => `/v1/recruitment/postings/${id}/reject`;
  static CloseJobPosting = (id) => `/v1/recruitment/postings/${id}/close`;

  // Recruitment - Job Applications
  static GetJobApplications = '/v1/recruitment/applications';
  static GetJobApplicationById = (id) => `/v1/recruitment/applications/${id}`;
  static CreateJobApplication = '/v1/recruitment/applications';
  static DeleteJobApplication = (id) => `/v1/recruitment/applications/${id}`;
  static GetApplicationsByJobPosting = (jobPostingId) => `/v1/recruitment/applications/by-posting/${jobPostingId}`;
  static GetApplicationPipeline = (jobPostingId) => `/v1/recruitment/applications/pipeline/${jobPostingId}`;
  static UpdateApplicationStatus = (id) => `/v1/recruitment/applications/${id}/status`;
  static ScheduleInterview = (id) => `/v1/recruitment/applications/${id}/schedule-interview`;
  static SendOffer = (id) => `/v1/recruitment/applications/${id}/send-offer`;
  static HireApplicant = (id) => `/v1/recruitment/applications/${id}/hire`;
  static RejectApplicant = (id) => `/v1/recruitment/applications/${id}/reject`;

  // Recruitment - Applicants (Profile Management)
  static GetApplicants = '/v1/recruitment/applicants';
  static GetApplicantById = (id) => `/v1/recruitment/applicants/${id}`;
  static CreateApplicant = '/v1/recruitment/applicants';
  static UpdateApplicant = (id) => `/v1/recruitment/applicants/${id}`;
  static DeleteApplicant = (id) => `/v1/recruitment/applicants/${id}`;

  // Recruitment - Dashboard
  static GetRecruitmentDashboardStats = '/v1/recruitment/dashboard/stats';

  // Leave Management
  static GetLeaves = '/v1/leaves';
  static GetLeaveById = (id) => `/v1/leaves/${id}`;
  static CreateLeave = '/v1/leaves';
  static UpdateLeave = (id) => `/v1/leaves/${id}`;
  static DeleteLeave = (id) => `/v1/leaves/${id}`;
  static GetLeavesByEmployee = (employeeId) => `/v1/leaves/employee/${employeeId}`;
  static GetLeaveTypes = '/v1/leaves/types';
  static GetLeaveBalance = (employeeId) => `/v1/leaves/balance/${employeeId}`;
  static UpdateLeaveStatus = (id) => `/v1/leaves/${id}/status`;

  // Exit Management
  static GetExits = '/v1/exits';
  static GetExitById = (id) => `/v1/exits/${id}`;
  static CreateExit = '/v1/exits';
  static UpdateExit = (id) => `/v1/exits/${id}`;
  static DeleteExit = (id) => `/v1/exits/${id}`;
  static GetExitsByEmployee = (employeeId) => `/v1/exits/employee/${employeeId}`;
  static ApproveExit = (id) => `/v1/exits/${id}/approve`;

  // Onboarding
  static GetOnboardings = '/v1/onboardings';
  static GetOnboardingById = (id) => `/v1/onboardings/${id}`;
  static CreateOnboarding = '/v1/onboardings';
  static UpdateOnboarding = (id) => `/v1/onboardings/${id}`;
  static DeleteOnboarding = (id) => `/v1/onboardings/${id}`;
  static GetOnboardingsByEmployee = (employeeId) => `/v1/onboardings/employee/${employeeId}`;

  // Payroll
  static GetPayrolls = '/v1/payrolls';
  static GetPayrollById = (id) => `/v1/payrolls/${id}`;
  static GeneratePayroll = '/v1/payrolls';
  static regeneratePayroll = '/v1/payrolls?overwrite=true';
  static UpdatePayroll = (id) => `/v1/payrolls/${id}`;
  static UpdatePayrollStatus = (id) => `/v1/payrolls/${id}/status`;
  static DeletePayroll = (id) => `/v1/payrolls/${id}`;
  static GetPayrollsByEmployee = (id) => `/v1/payrolls/employee/${id}`;
  static GetPayrollsByPeriod = (payPeriod) => `/v1/payrolls/periods/${payPeriod}`;
  static ProcessPayroll = (id) => `/v1/payrolls/${id}/process`;
  static PayPayroll = (id) => `/v1/payrolls/${id}/pay`;
  static UploadPayrollReport = `/v1/payrolls/uploads`;
  static GetUploadedPayrollReports = `/v1/payrolls/uploads`;
  static DeleteUploadedPayrollReport = (id) => `/v1/payrolls/uploads/${id}`;

  // Deductions
  static GetDeductions = '/v1/deductions';
  static GetDeductionById = (id) => `/v1/deductions/${id}`;
  static CreateDeduction = '/v1/deductions';
  static UpdateDeduction = (id) => `/v1/deductions/${id}`;
  static DeleteDeduction = (id) => `/v1/deductions/${id}`;

  // Loans
  static GetLoans = '/v1/loans';
  static GetLoanDashboard = '/v1/loans/dashboard';
  static GetLoanById = (id) => `/v1/loans/${id}`;
  static CreateLoan = '/v1/loans';
  static UpdateLoan = (id) => `/v1/loans/${id}`;
  static DeleteLoan = (id) => `/v1/loans/${id}`;

  // Complaints
  static GetComplaints = '/v1/complaints';
  static GetComplaintById = (id) => `/v1/complaints/${id}`;
  static CreateComplaint = '/v1/complaints';
  static UpdateComplaint = (id) => `/v1/complaints/${id}`;
  static DeleteComplaint = (id) => `/v1/complaints/${id}`;
  static ResolveComplaint = (id) => `/v1/complaints/${id}/resolve`;
  static CloseComplaint = (id) => `/v1/complaints/${id}/close`;

  // Performance Management
  static GetPerformanceDashboard = '/v1/performance/dashboard';
  static GetPerformanceGoals = '/v1/performance/goals';
  static GetPerformanceGoalById = (id) => `/v1/performance/goals/${id}`;
  static CreatePerformanceGoal = '/v1/performance/goals';
  static UpdatePerformanceGoal = (id) => `/v1/performance/goals/${id}`;
  static DeletePerformanceGoal = (id) => `/v1/performance/goals/${id}`;
  static UpdatePerformanceGoalProgress = (id) => `/v1/performance/goals/${id}/progress`;
  static GetPerformanceCycles = '/v1/performance/cycles';
  static GetPerformanceCycleById = (id) => `/v1/performance/cycles/${id}`;
  static CreatePerformanceCycle = '/v1/performance/cycles';
  static UpdatePerformanceCycle = (id) => `/v1/performance/cycles/${id}`;
  static ActivatePerformanceCycle = (id) => `/v1/performance/cycles/${id}/activate`;
  static ClosePerformanceCycle = (id) => `/v1/performance/cycles/${id}/close`;
  static GetPerformanceAppraisals = '/v1/performance/appraisals';
  static GetPerformanceAppraisalById = (id) => `/v1/performance/appraisals/${id}`;
  static CreatePerformanceAppraisal = '/v1/performance/appraisals';
  static UpdatePerformanceAppraisal = (id) => `/v1/performance/appraisals/${id}`;
  static DeletePerformanceAppraisal = (id) => `/v1/performance/appraisals/${id}`;
  static SubmitPerformanceAppraisal = (id) => `/v1/performance/appraisals/${id}/submit`;
  static ReviewPerformanceAppraisal = (id) => `/v1/performance/appraisals/${id}/review`;

  // Companies
  static GetCompanies = '/v1/companies';
  static GetCompanyById = (id) => `/v1/companies/${id}`;
  static CreateCompany = '/v1/companies';
  static UpdateCompany = (id) => `/v1/companies/${id}`;
  static DeleteCompany = (id) => `/v1/companies/${id}`;

  // Health Check
  static Health = '/health';
}

export const apiRoutes = ApiRoutes;
