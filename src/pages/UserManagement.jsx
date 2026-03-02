import { User, UserArchive } from '@/api/entities';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardDescription
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // New import for Tabs
import { cn } from '@/lib/utils'; // Import cn utility
import {
  Archive,
  Building,
  Check,
  CheckCircle,
  ChevronsUpDown,
  Mail,
  MoreHorizontal,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'; // New icons
import { useEffect, useState } from 'react';

// Comprehensive list of roles and their associated permissions
const ROLES = {
  admin: {
    label: 'Super Admin',
    color: 'bg-red-100 text-red-800',
    permissions: [
      'manage_users_and_roles',
      'manage_all_settings',
      'view_all_data',
      'process_payroll',
      'approve_all_requests',
      'request_staff_movement',
      'manage_vendors',
    ],
    description: 'Unrestricted access to all features and settings, including user and role management.',
  },
  managing_director: {
    label: 'Managing Director',
    color: 'bg-purple-100 text-purple-800',
    permissions: ['view_all_data', 'approve_all_requests', 'request_staff_movement', 'manage_vendors'],
    description: 'Top-level oversight, can view all data and approve major requests.',
  },
  human_resources_manager: {
    label: 'Human Resources Manager',
    color: 'bg-cyan-100 text-cyan-800',
    permissions: [
      'manage_users_and_roles',
      'manage_employees',
      'process_payroll',
      'approve_staff_movement',
      'approve_training_requests',
      'manage_complaints',
      'manage_recruitment',
      'request_staff_movement',
    ],
    description: 'Manages all HR functions, including employee records, payroll, recruitment, and user access.',
  },
  head_of_operations: {
    label: 'Head of Operations',
    color: 'bg-orange-100 text-orange-800',
    permissions: ['request_staff_movement', 'manage_vendors', 'approve_expenses_level_2'],
    description: 'Oversees daily business operations and can manage staff movements and vendors.',
  },
  head_internal_control: {
    label: 'Head, Internal Control',
    color: 'bg-indigo-100 text-indigo-800',
    permissions: ['view_all_data', 'audit_expenses', 'conduct_internal_audits'],
    description: 'Monitors and audits all company processes and data for compliance.',
  },
  branch_manager: {
    label: 'Branch Manager',
    color: 'bg-teal-100 text-teal-800',
    permissions: ['approve_expenses_level_1', 'view_branch_data', 'manage_branch_staff', 'request_staff_movement'],
    description: 'Manages all operations and staff within a specific branch.',
  },
  finance_officer: {
    label: 'Finance Officer',
    color: 'bg-green-100 text-green-800',
    permissions: ['manage_expenses', 'process_payroll', 'view_financial_reports'],
    description: 'Handles financial transactions, expense management, and payroll.',
  },
  loan_officer: {
    label: 'Loan Officer',
    color: 'bg-blue-100 text-blue-800',
    permissions: ['process_loan_applications', 'view_client_financials', 'manage_customer_relationships'],
    description: 'Evaluates, authorizes, or recommends approval of loan applications.',
  },
  credit_analyst: {
    label: 'Credit Analyst',
    color: 'bg-blue-100 text-blue-800',
    permissions: ['view_client_financials', 'manage_credit_risk'],
    description: 'Analyse credit data to estimate degree of risk involved in extending credit.',
  },
  compliance_officer: {
    label: 'Compliance Officer',
    color: 'bg-slate-100 text-slate-800',
    permissions: ['audit_transactions', 'view_all_data'],
    description: 'Ensures the company adheres to external laws and internal policies.',
  },
  teller: {
    label: 'Teller',
    color: 'bg-lime-100 text-lime-800',
    permissions: ['perform_customer_transactions', 'handle_customer_inquiries'],
    description: 'Handles day-to-day customer-facing transactions like deposits and withdrawals.',
  },
  customer_service_rep: {
    label: 'Customer Service Rep',
    color: 'bg-sky-100 text-sky-800',
    permissions: ['handle_customer_inquiries', 'manage_customer_relationships'],
    description: 'Manages customer accounts and resolves inquiries or complaints.',
  },
  it_officer: {
    label: 'IT Officer',
    color: 'bg-gray-100 text-gray-800',
    permissions: ['manage_it_assets', 'provide_technical_support'],
    description: 'Manages IT infrastructure and provides technical support to staff.',
  },
  it_security_specialist: {
    label: 'IT Security Specialist',
    color: 'bg-gray-100 text-gray-800',
    permissions: ['manage_it_assets', 'audit_transactions'],
    description: 'Protects computer systems and networks from security breaches.',
  },
  marketing_officer: {
    label: 'Marketing Officer',
    color: 'bg-pink-100 text-pink-800',
    permissions: ['manage_marketing_campaigns', 'access_self_service'],
    description: 'Develops and executes marketing campaigns to attract new customers.',
  },
  internal_auditor: {
    label: 'Internal Auditor',
    color: 'bg-indigo-100 text-indigo-800',
    permissions: ['conduct_internal_audits', 'view_all_data'],
    description: 'Examines and analyse accounting records to determine financial status of an establishment.',
  },
  treasury_officer: {
    label: 'Treasury Officer',
    color: 'bg-amber-100 text-amber-800',
    permissions: ['manage_expenses', 'view_financial_reports'],
    description: "Manages the organization's financial assets, liabilities, and investments.",
  },
  risk_analyst: {
    label: 'Risk Analyst',
    color: 'bg-rose-100 text-rose-800',
    permissions: ['manage_credit_risk', 'view_all_data'],
    description: 'Identifies and analyse potential risks threatening the assets and earning capacity of the organization.',
  },
  project_manager: {
    label: 'Project Manager',
    color: 'bg-fuchsia-100 text-fuchsia-800',
    permissions: ['manage_own_projects', 'manage_teams', 'request_staff_movement'],
    description: 'Leads projects and can request staff for their teams.',
  },
  user: {
    label: 'Employee',
    color: 'bg-stone-100 text-stone-700',
    permissions: ['access_self_service'],
    description: 'Standard employee access for self-service portal features.',
    canUpgradeToAdmin: true,
  },
};

const MATERIAL_COLORS = {
  primary: '#1976D2',
  background: '#FAFAFA',
};

const ELEVATION = {
  1: 'shadow-sm',
  2: 'shadow',
  4: 'shadow-md',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]); // New state for archived users
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null); // New state for delete confirmation
  const [userToUpdateRole, setUserToUpdateRole] = useState(null); // New state for role change dialog
  const [selectedNewRole, setSelectedNewRole] = useState(''); // New state for tracking selected role in dialog

  // New states for Quick Role Assignment and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState('');
  const [newRoleForAssignment, setNewRoleForAssignment] = useState('');
  const [openUserSelect, setOpenUserSelect] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [roleForEmail, setRoleForEmail] = useState('');

  const [newUserData, setNewUserData] = useState({
    email: '',
    job_role: 'user',
    department: 'hr',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Define the primary admin email. In a real app, this would likely come from environment variables.
  const PRIMARY_ADMIN_EMAIL = 'gbengashafe@gmail.com';

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const user = await User.me();
      console.log('UserManagement - Current user:', user); // Debug log
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Fetch both active users and archived users concurrently
      const [userData, archivedData] = await Promise.all([
        User.list(),
        UserArchive.list('-deletion_date'), // Fetch archived users, sorted by deletion date descending
      ]);

      // Manually find and update the user 'coricmail@gmail.com' if they are an admin
      const targetUser = userData.find((u) => u.email === 'coricmail@gmail.com');
      if (targetUser && targetUser.job_role === 'admin') {
        // This change is cosmetic for the UI until a real update is possible
        // Or if we can trigger an update via an action.
        console.log('Temporarily changing role for coricmail@gmail.com in UI');
        targetUser.job_role = 'user';
        targetUser.permissions = ROLES.user.permissions;
      }

      setUsers(userData);
      setArchivedUsers(archivedData); // Set archived users
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!userToUpdateRole || !selectedNewRole) return;

    try {
      if (userToUpdateRole.email === PRIMARY_ADMIN_EMAIL && currentUser?.email !== PRIMARY_ADMIN_EMAIL) {
        throw new Error('Only the primary admin can modify their own role.');
      }

      if (userToUpdateRole.email === currentUser?.email) {
        throw new Error('You cannot change your own role from this menu.');
      }

      const roleConfig = ROLES[selectedNewRole];
      if (!roleConfig) {
        throw new Error('Invalid role selected');
      }

      console.log('Updating role from table menu:', {
        userId: userToUpdateRole.id,
        email: userToUpdateRole.email,
        newRole: selectedNewRole,
        currentRole: userToUpdateRole.role,
      });

      await User.update(userToUpdateRole.id, {
        role: selectedNewRole === 'admin' ? 'admin' : 'user',
        job_role: selectedNewRole,
        permissions: roleConfig.permissions,
        assigned_by: currentUser.email,
      });

      setSuccess(`✓ Successfully updated ${userToUpdateRole.full_name} to ${roleConfig.label}`);
      setUserToUpdateRole(null);
      setSelectedNewRole('');
      await loadUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Role change error:', error);
      setError('Failed to update role: ' + error.message);
      setUserToUpdateRole(null);
      setSelectedNewRole('');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCreateUser = async () => {
    try {
      setError('');
      setSuccess('');

      const roleConfig = ROLES[newUserData.job_role];
      if (!roleConfig) {
        throw new Error('Invalid role selected');
      }

      // Create user account directly
      await User.create({
        email: newUserData.email,
        full_name: newUserData.email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        role: newUserData.job_role === 'admin' ? 'admin' : 'user', // Set the protected role
        job_role: newUserData.job_role, // Set the descriptive job_role
        permissions: roleConfig.permissions,
        department: newUserData.department,
        status: 'active', // Default status for new users
        assigned_by: currentUser.email,
      });

      // Try to send email notification (will only work if user is already in the system)
      // try {
      //   await SendEmail({
      //     to: newUserData.email,
      //     subject: 'Welcome to Orbit360 - Account Created',
      //     body: `
      //       <h3>Welcome to Orbit360!</h3>
      //       <p>Your account has been created with the following details:</p>
      //       <ul>
      //         <li><strong>Email:</strong> ${newUserData.email}</li>
      //         <li><strong>Role:</strong> ${roleConfig.label}</li>
      //         <li><strong>Department:</strong> ${newUserData.department}</li>
      //       </ul>
      //       <p>You can now log in to the Orbit360 platform using your Google account.</p>
      //       <p>If you have any questions, please contact your administrator.</p>
      //     `,
      //     from_name: 'Orbit360 System',
      //   });
      // } catch (emailError) {
      //   console.log('Email notification could not be sent - user may not be in system yet', emailError);
      // }

      setSuccess(
        `User account created successfully for ${newUserData.email}. Please ask the user to log in with their Google account.`,
      );
      setShowCreateUserDialog(false);
      setNewUserData({ email: '', job_role: 'user', department: 'hr' });
      loadUsers();
      setTimeout(() => setSuccess(''), 8000);
    } catch (error) {
      setError('Failed to create user account. ' + error.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSuspendUser = async (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      // Prevent primary admin from being suspended by anyone
      if (user.email === PRIMARY_ADMIN_EMAIL && currentUser?.email !== PRIMARY_ADMIN_EMAIL) {
        throw new Error('Only the primary admin can suspend/reactivate themselves.');
      }

      await User.update(user.id, { status: newStatus });
      setSuccess(`User ${user.full_name} has been ${newStatus}.`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Failed to update user status: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Prevent primary admin from being deleted by anyone, including themselves (through this UI)
      if (userToDelete.email === PRIMARY_ADMIN_EMAIL) {
        throw new Error('The primary admin account cannot be deleted.');
      }

      // Archive the user's details first
      await UserArchive.create({
        full_name: userToDelete.full_name,
        email: userToDelete.email,
        job_role: userToDelete.job_role,
        department: userToDelete.department,
        deleted_by: currentUser.email,
        deletion_date: new Date().toISOString(),
      });

      // Then permanently delete the user
      await User.delete(userToDelete.id);

      setSuccess(`User ${userToDelete.email} has been deleted and archived.`);
      setUserToDelete(null); // Close dialog
      loadUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(`Failed to delete user: ${error.message}`);
      setUserToDelete(null); // Close dialog even on error
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleQuickAssignRole = async () => {
    setError('');
    setSuccess('');
    if (!selectedUserForAssignment || !newRoleForAssignment) {
      setError('Please select a user and a role to assign.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const userToUpdate = users.find((u) => u.id === selectedUserForAssignment);

    if (!userToUpdate) {
      setError('Selected user not found.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      if (userToUpdate.email === PRIMARY_ADMIN_EMAIL && currentUser?.email !== PRIMARY_ADMIN_EMAIL) {
        throw new Error('Only the primary admin can modify their own role.');
      }

      if (userToUpdate.email === currentUser?.email) {
        throw new Error('You cannot change your own role using this tool. This must be done by another administrator.');
      }

      const roleConfig = ROLES[newRoleForAssignment];
      if (!roleConfig) {
        throw new Error('Invalid role selected');
      }

      await User.update(userToUpdate.id, {
        role: newRoleForAssignment === 'admin' ? 'admin' : 'user', // Set the protected role based on job_role
        job_role: newRoleForAssignment,
        permissions: roleConfig.permissions,
        assigned_by: currentUser.email,
      });

      setSuccess(`Role for ${userToUpdate.full_name} successfully updated to ${roleConfig.label}.`);
      // Reset form
      setSelectedUserForAssignment('');
      setNewRoleForAssignment('');
      loadUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to assign role. ' + error.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEmailBasedRoleChange = async () => {
    setError('');
    setSuccess('');

    if (!emailSearch || !roleForEmail) {
      setError('Please enter an email and select a role.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const userToUpdate = users.find((u) => u.email.toLowerCase() === emailSearch.toLowerCase());

    if (!userToUpdate) {
      setError(`No user found with email: ${emailSearch}. Make sure the user has logged in at least once.`);
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      if (userToUpdate.email === PRIMARY_ADMIN_EMAIL && currentUser?.email !== PRIMARY_ADMIN_EMAIL) {
        throw new Error('Only the primary admin can modify their own role.');
      }

      if (userToUpdate.email === currentUser?.email) {
        throw new Error('You cannot change your own role using this tool.');
      }

      const roleConfig = ROLES[roleForEmail];
      if (!roleConfig) {
        throw new Error('Invalid role selected');
      }

      console.log('Updating user role:', {
        userId: userToUpdate.id,
        email: userToUpdate.email,
        newRole: roleForEmail,
        currentRole: userToUpdate.role,
        currentJobRole: userToUpdate.job_role,
      });

      await User.update(userToUpdate.id, {
        role: roleForEmail === 'admin' ? 'admin' : 'user',
        job_role: roleForEmail,
        permissions: roleConfig.permissions,
        assigned_by: currentUser.email,
      });

      setSuccess(`✓ Successfully changed ${userToUpdate.full_name} (${userToUpdate.email}) to ${roleConfig.label}`);
      setEmailSearch('');
      setRoleForEmail('');
      await loadUsers();
      setTimeout(() => setSuccess(''), 8000);
    } catch (error) {
      console.error('Role update error:', error);
      setError(`Failed to update role: ${error.message || 'Unknown error'}. You must be an admin to change user roles.`);
      setTimeout(() => setError(''), 8000);
    }
  };

  const canManageUsers = currentUser?.permissions?.includes('manage_users_and_roles') || currentUser?.job_role === 'admin';
  const isPrimaryAdmin = currentUser?.email === PRIMARY_ADMIN_EMAIL;

  console.log('UserManagement - Can manage users:', canManageUsers); // Debug log
  console.log('UserManagement - Is primary admin:', isPrimaryAdmin); // Debug log

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to manage users and roles.</p>
        <p className="text-gray-400 text-sm mt-2">Current role: {currentUser?.job_role || 'unknown'}</p>
        <p className="text-gray-400 text-sm">Permissions: {currentUser?.permissions?.join(', ') || 'none'}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: MATERIAL_COLORS.background }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User & Role Management</h1>
              <p className="text-gray-600">Assign roles, manage permissions, and create new users.</p>
            </div>
          </div>

          <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-700 hover:bg-blue-800 text-white shadow-md">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="user@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Assign Role</Label>
                  <Select
                    value={newUserData.job_role}
                    onValueChange={(value) => setNewUserData({ ...newUserData, job_role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLES).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newUserData.department}
                    onValueChange={(value) => setNewUserData({ ...newUserData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Platform Limitation Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Mail className="w-4 h-4" />
          <AlertDescription className="text-blue-700">
            <strong>Note:</strong> Due to platform limitations, automatic invitation emails cannot be sent to external addresses.
            When you create a user account, please manually share the login details with the new user. They can then log in using
            their Google account associated with the email address you specify.
          </AlertDescription>
        </Alert>

        {/* Email-Based Role Assignment */}
        <Card className={`bg-white rounded-lg ${ELEVATION[2]} border-2 border-blue-200`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-700" />
              Change User Role by Email
            </CardTitle>
            <CardDescription>Enter a user&apos;s email address and assign them a new role.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="email-search">User Email</Label>
              <Input
                id="email-search"
                type="email"
                placeholder="user@company.com"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role-for-email">New Role</Label>
              <Select value={roleForEmail} onValueChange={setRoleForEmail}>
                <SelectTrigger id="role-for-email">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleEmailBasedRoleChange}
              className="bg-blue-700 hover:bg-blue-800 text-white"
              disabled={!emailSearch || !roleForEmail}
            >
              <Settings className="w-4 h-4 mr-2" />
              Update Role
            </Button>
          </CardContent>
        </Card>

        {/* Quick Role Assignment Card */}
        <Card className={`bg-white rounded-lg ${ELEVATION[2]}`}>
          <CardHeader>
            <CardTitle>Quick Role Assignment (by Name)</CardTitle>
            <CardDescription>Search for a user by name and assign them a new role.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="user-select">User</Label>
              <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openUserSelect} className="w-full justify-between">
                    {selectedUserForAssignment
                      ? users.find((user) => user.id === selectedUserForAssignment)?.full_name
                      : 'Select user...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search user by name or email..." />
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.full_name} ${user.email}`}
                          onSelect={() => {
                            setSelectedUserForAssignment(user.id);
                            setOpenUserSelect(false);
                          }}
                          disabled={user.email === currentUser?.email} // Disable current user from being selected
                        >
                          <Check
                            className={cn('mr-2 h-4 w-4', selectedUserForAssignment === user.id ? 'opacity-100' : 'opacity-0')}
                          />
                          {user.full_name} ({user.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="role-select">New Role</Label>
              <Select value={newRoleForAssignment} onValueChange={setNewRoleForAssignment}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleQuickAssignRole} className="bg-blue-700 hover:bg-blue-800 text-white">
              <Settings className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          </CardContent>
        </Card>

        {/* Tabs for Active/Suspended and Archived Users */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="active">Active & Suspended ({users.length})</TabsTrigger>
            <TabsTrigger value="archive">Deleted User Archive ({archivedUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {/* Users Table */}
            <Card className={`bg-white rounded-lg ${ELEVATION[2]}`}>
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    <span>Manage Current Users</span>
                  </CardTitle>
                  <div className="w-full max-w-sm">
                    <Input
                      placeholder="Filter users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>User</TableHead>
                        <TableHead>Assigned Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead> {/* New column for status */}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          className={`hover:bg-gray-50/50 transition-colors ${user.status === 'suspended' ? 'bg-red-50/50' : ''}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${user.status === 'suspended' ? 'bg-gray-300' : 'bg-gray-200'}`}
                              >
                                <Mail className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p
                                  className={`font-semibold text-gray-900 ${user.status === 'suspended' ? 'text-gray-500' : ''}`}
                                >
                                  {user.full_name}
                                </p>
                                <p className={`text-sm ${user.status === 'suspended' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${ROLES[user.job_role]?.color || 'bg-gray-100 text-gray-700'} ${user.status === 'suspended' ? 'opacity-50' : ''}`}
                            >
                              {ROLES[user.job_role]?.label || user.job_role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${user.status === 'suspended' ? 'text-gray-400' : ''}`}>
                              <Building className="w-4 h-4" />
                              <span className="capitalize">{user.department || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === 'suspended' ? 'destructive' : 'outline'}
                              className={user.status === 'suspended' ? '' : 'border-green-300 text-green-700 bg-green-50'}
                            >
                              <span className="capitalize">{user.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {/* A user cannot change their own role directly from this select, 
                                and only primary admin can change primary admin's role or assign 'admin' role */}
                            {user.email !== currentUser?.email ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setUserToUpdateRole(user);
                                      setSelectedNewRole(user.job_role);
                                    }}
                                  >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSuspendUser(user)}
                                    // Disable suspend/reactivate if current user is not primary admin and target user is primary admin
                                    disabled={!isPrimaryAdmin && user.email === PRIMARY_ADMIN_EMAIL}
                                  >
                                    {user.status === 'suspended' ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" /> Reactivate
                                      </>
                                    ) : (
                                      <>
                                        <UserX className="w-4 h-4 mr-2" /> Suspend
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setUserToDelete(user)}
                                    // Disable delete if target user is primary admin
                                    disabled={user.email === PRIMARY_ADMIN_EMAIL}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Badge variant="outline">You</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive">
            <Card className={`bg-white rounded-lg ${ELEVATION[2]}`}>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center justify-between">
                  <span>Deleted User Archive</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {archivedUsers.length} Records
                  </Badge>
                </CardTitle>
                <DialogDescription className="text-sm text-gray-500 mt-2">
                  This is a permanent record of deleted users. This action cannot be undone.
                </DialogDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>User</TableHead>
                        <TableHead>Last Role</TableHead>
                        <TableHead>Last Department</TableHead>
                        <TableHead>Deleted By</TableHead>
                        <TableHead>Deletion Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedUsers.map((user) => (
                        <TableRow key={user.id} className="bg-gray-50">
                          <TableCell>
                            <p className="font-semibold text-gray-600">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </TableCell>
                          <TableCell className="text-gray-600 capitalize">{user.job_role?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                          <TableCell className="text-gray-600 capitalize">{user.department || 'N/A'}</TableCell>
                          <TableCell className="text-gray-600">{user.deleted_by || 'System'}</TableCell>
                          <TableCell className="text-gray-600">{new Date(user.deletion_date).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {archivedUsers.length === 0 && (
                  <div className="text-center p-12 text-gray-400">
                    <Archive className="w-12 h-12 mx-auto mb-4" />
                    No users have been deleted yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Permissions Info */}
        <Card className={`bg-white rounded-lg ${ELEVATION[2]}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-700" />
              Role Permissions Overview
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              This section outlines the permissions for each predefined role. Assigning a role to a user automatically grants them
              these permissions.
              <br />
              Note: The ability to dynamically create new roles is not currently supported through this interface.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(ROLES).map(([key, role]) => (
                <div key={key} className={`p-4 border rounded-lg bg-gray-50/50 ${ELEVATION[1]}`}>
                  <Badge className={`${role.color} mb-3`}>{role.label}</Badge>
                  <p className="text-xs text-gray-500 mb-3">{role.description}</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {role.permissions.map((permission) => (
                      <li key={permission} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-700 rounded-full flex-shrink-0"></div>
                        <span className="text-xs">{permission.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Change Dialog */}
      <Dialog
        open={!!userToUpdateRole}
        onOpenChange={() => {
          setUserToUpdateRole(null);
          setSelectedNewRole('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {userToUpdateRole?.full_name}</DialogTitle>
            <DialogDescription>
              Current Role:{' '}
              <span className="font-medium">{ROLES[userToUpdateRole?.job_role]?.label || userToUpdateRole?.job_role}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="role-change-select">New Role</Label>
            <Select value={selectedNewRole} onValueChange={setSelectedNewRole}>
              <SelectTrigger id="role-change-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLES).map(([key, role]) => (
                  <SelectItem key={key} value={key} disabled={userToUpdateRole?.email === PRIMARY_ADMIN_EMAIL}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUserToUpdateRole(null);
                setSelectedNewRole('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={!selectedNewRole || selectedNewRole === userToUpdateRole?.job_role}
              className="bg-blue-700 hover:bg-blue-800"
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the user <strong className="text-red-600">{userToDelete?.email}</strong> and move their
              record to the archive. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
