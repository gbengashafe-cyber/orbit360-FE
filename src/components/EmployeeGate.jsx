import { useState } from 'react';

// List of all possible permissions in the application
const ALL_PERMISSIONS = [
  'manage_users_and_roles',
  'manage_all_settings',
  'view_all_data',
  'process_payroll',
  'approve_all_requests',
  'request_staff_movement',
  'manage_vendors',
  'manage_employees',
  'approve_staff_movement',
  'approve_training_requests',
  'manage_complaints',
  'manage_recruitment',
  'audit_expenses',
  'manage_expenses',
  'view_financial_reports',
  'manage_own_projects',
  'manage_teams',
  'access_self_service',
  'approve_expenses_level_2',
  // New banking-specific permissions
  'approve_expenses_level_1',
  'view_branch_data',
  'manage_branch_staff',
  'process_loan_applications',
  'view_client_financials',
  'perform_customer_transactions',
  'audit_transactions',
  'manage_it_assets',
  'provide_technical_support',
  'manage_credit_risk',
  'manage_customer_relationships',
  'handle_customer_inquiries',
  'manage_marketing_campaigns',
  'conduct_internal_audits',
];

const ROLES = {
  admin: {
    permissions: ALL_PERMISSIONS, // Super admin gets all permissions
  },
};

// const SuspendedAccountScreen = () => {
//    const handleLogout = async () => {
//       await User.logout();
//       window.location.reload(); // Force a reload to clear session and show login
//    };

//    return (
//       <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
//          <div className="text-center bg-white p-10 rounded-lg shadow-lg max-w-md">
//             <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
//             <h2 className="text-2xl font-bold text-red-800 mb-2">Account Suspended</h2>
//             <p className="text-gray-600 mb-6">
//                Your access to the Orbit360 platform has been temporarily suspended. Please contact your administrator or the HR
//                department for further information.
//             </p>
//             <Button onClick={handleLogout} variant="destructive">
//                <LogOut className="w-4 h-4 mr-2" />
//                Logout
//             </Button>
//          </div>
//       </div>
//    );
// };

export default function EmployeeGate({ children }) {
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated', 'suspended'

  //  useEffect(() => {
  // const checkAuthAndPromoteAdmin = async () => {
  //    try {
  //       const user = await User.me();
  //       console.log("Current user:", user); // Debug log

  //       // Check for suspended status first
  //       if (user.status === "suspended") {
  //          setAuthStatus("suspended");
  //          return;
  //       }

  //       // Auto-promote and ensure the primary admin email always has the 'admin' role and full permissions
  //       if (user.email === "gbengashafe@gmail.com") {
  //          const isFullyAdmin =
  //             user.role === "admin" &&
  //             user.job_role === "admin" &&
  //             user.permissions?.includes("manage_users_and_roles") &&
  //             user.permissions?.length === ALL_PERMISSIONS.length; // Ensure all permissions are present

  //          if (!isFullyAdmin) {
  //             console.log("Ensuring primary admin has full admin privileges...");
  //             await User.update(user.id, {
  //                role: "admin", // The protected, system-level role
  //                job_role: "admin", // The descriptive role for UI consistency
  //                permissions: ALL_PERMISSIONS, // Assign all possible permissions
  //                department: "management", // Assign to the highest department
  //                assigned_by: "system_check",
  //             });
  //             console.log("Primary admin privileges synchronized. Reloading page to apply changes.");
  //             // Force a reload to apply the new role and permissions immediately
  //             window.location.reload();
  //             return; // Stop execution to allow reload to complete
  //          }
  //       }

  //       setAuthStatus("authenticated");
  //    } catch (error) {
  //       console.error("Auth check failed:", error);
  //       setAuthStatus("unauthenticated");
  //    }
  // };

  // checkAuthAndPromoteAdmin();
  //  }, []);

  //  if (authStatus === "loading") {
  //     return (
  //        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
  //           <div className="text-center">
  //              <Logo size="large" className="mx-auto mb-4" />
  //              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
  //              <p className="mt-4 text-gray-600">Loading Orbit360...</p>
  //           </div>
  //        </div>
  //     );
  //  }

  //  if (authStatus === "suspended") {
  //     return <SuspendedAccountScreen />;
  //  }

  //  if (authStatus === "unauthenticated") {
  //     return <EmployeeLogin />;
  //  }

  // authStatus must be 'authenticated'
  return children;
}
