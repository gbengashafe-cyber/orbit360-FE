import { departmentService, userService } from '@/api';
import { jobRoleService } from '@/api/job-role.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGlobalContext } from '@/state/context';
import { logger } from '@/utils';
import { Info, Loader2, Pencil, Shield, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// The backend allows up to 250 rows per page.
const MAX_ROWS = 250;

// Must match userRoleOptions / userStatusOptions in the backend user model.
const USER_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const USER_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'user',
  departmentId: '',
  jobRoleId: '',
  status: 'ACTIVE',
};

const statusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'border-green-300 text-green-700 bg-green-50';
    case 'INACTIVE':
      return 'border-red-300 text-red-700 bg-red-50';
    default:
      return 'border-amber-300 text-amber-700 bg-amber-50';
  }
};

const departmentLabel = (department) =>
  department ? `${department.name}${department.company?.name ? ` (${department.company.name})` : ''}` : 'N/A';

function UserForm({ form, setForm, departments, jobRoles, isEdit, isSelf }) {
  const departmentJobRoles = useMemo(
    () =>
      jobRoles
        .filter((jobRole) => String(jobRole.departmentId) === String(form.departmentId))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [jobRoles, form.departmentId],
  );

  const update = (field) => (value) => setForm((previous) => ({ ...previous, [field]: value }));

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user-first-name">First name</Label>
          <Input
            id="user-first-name"
            value={form.firstName}
            onChange={(e) => update('firstName')(e.target.value)}
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-last-name">Last name</Label>
          <Input id="user-last-name" value={form.lastName} onChange={(e) => update('lastName')(e.target.value)} maxLength={50} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">Email address</Label>
        <Input
          id="user-email"
          type="email"
          value={form.email}
          onChange={(e) => update('email')(e.target.value)}
          placeholder="user@company.com"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user-role">Access level</Label>
          <Select value={form.role} onValueChange={update('role')} disabled={isSelf}>
            <SelectTrigger id="user-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="user-status">Status</Label>
            <Select value={form.status} onValueChange={update('status')} disabled={isSelf}>
              <SelectTrigger id="user-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {isSelf && <p className="text-xs text-gray-500">You can&apos;t change your own access level or status.</p>}

      <div className="space-y-2">
        <Label htmlFor="user-department">Department</Label>
        <Select
          value={form.departmentId ? String(form.departmentId) : ''}
          onValueChange={(value) => setForm((previous) => ({ ...previous, departmentId: value, jobRoleId: '' }))}
        >
          <SelectTrigger id="user-department">
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={String(department.id)}>
                {departmentLabel(department)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-job-role">Job role</Label>
        <Select
          value={form.jobRoleId ? String(form.jobRoleId) : ''}
          onValueChange={update('jobRoleId')}
          disabled={!form.departmentId}
        >
          <SelectTrigger id="user-job-role">
            <SelectValue placeholder={form.departmentId ? 'Select a job role' : 'Select a department first'} />
          </SelectTrigger>
          <SelectContent>
            {departmentJobRoles.map((jobRole) => (
              <SelectItem key={jobRole.id} value={String(jobRole.id)}>
                {jobRole.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Application permissions come from the job role.</p>
      </div>
    </div>
  );
}

const isFormComplete = (form) =>
  form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.role && form.departmentId && form.jobRoleId;

const toPayload = (form, { includeStatus }) => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  email: form.email.trim(),
  role: form.role,
  departmentId: Number(form.departmentId),
  jobRoleId: Number(form.jobRoleId),
  ...(includeStatus ? { status: form.status } : {}),
});

export default function UserManagement() {
  const { currentUser, isAdmin, isLoadingUser } = useGlobalContext();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogMode, setDialogMode] = useState(null); // 'create' | 'edit' | null
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [usersResponse, departmentsResponse, jobRolesResponse] = await Promise.all([
        userService.getUsers(1, MAX_ROWS),
        departmentService.getDepartments({ rows: MAX_ROWS }),
        jobRoleService.getJobRoles({ rows: MAX_ROWS }),
      ]);
      setUsers(usersResponse?.data ?? []);
      setDepartments(
        [...(departmentsResponse?.data ?? [])].sort((a, b) => departmentLabel(a).localeCompare(departmentLabel(b))),
      );
      setJobRoles(jobRolesResponse?.data ?? []);
    } catch (error) {
      logger.error({ caller: 'UserManagement - load data', payload: error });
      setLoadError(error?.message ?? 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);
  const jobRoleById = useMemo(() => new Map(jobRoles.map((j) => [j.id, j])), [jobRoles]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.firstName, user.lastName, user.email].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [users, searchQuery]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setDialogMode('create');
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      role: user.role ?? 'user',
      departmentId: user.departmentId ? String(user.departmentId) : '',
      jobRoleId: user.jobRoleId ? String(user.jobRoleId) : '',
      status: user.status ?? 'ACTIVE',
    });
    setDialogMode('edit');
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogMode(null);
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!isFormComplete(form)) {
      toast.error('Missing details', { description: 'Fill in every field before saving.' });
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === 'create') {
        await userService.createUser(toPayload(form, { includeStatus: false }));
        toast.success('User created', { description: form.email.trim() });
      } else {
        await userService.updateUser(editingUser.id, toPayload(form, { includeStatus: true }));
        toast.success('User updated', { description: form.email.trim() });
      }
      setDialogMode(null);
      setEditingUser(null);
      await loadData();
    } catch (error) {
      logger.error({ caller: `UserManagement - ${dialogMode} user`, payload: error });
      toast.error(dialogMode === 'create' ? 'Unable to create user' : 'Unable to update user', {
        description: error?.message ?? 'Something went wrong.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  // Mirrors the backend: every /api/v1/users endpoint requires role === 'admin'.
  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500">Only administrators can manage users.</p>
      </div>
    );
  }

  const isSelf = editingUser?.id === currentUser?.id;

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Create users and manage their access level, job role and status.</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="bg-blue-700 hover:bg-blue-800 text-white shadow-md">
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-blue-700">
            <strong>Admin</strong> access lets a user manage users, companies and job roles. What a user can do in HR modules
            (payroll, loans, employees, approvals) comes from the permissions of their <strong>job role</strong>.
          </AlertDescription>
        </Alert>

        {loadError && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{loadError}</span>
              <Button variant="outline" size="sm" onClick={loadData}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-white rounded-lg shadow">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Users ({users.length})</CardTitle>
              <Input
                className="w-full max-w-sm"
                placeholder="Filter by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>User</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Job role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">
                            {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === 'admin' ? 'bg-red-100 text-red-800 hover:bg-red-100' : 'bg-stone-100 text-stone-700 hover:bg-stone-100'
                            }
                          >
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">{jobRoleById.get(user.jobRoleId)?.title ?? 'N/A'}</TableCell>
                        <TableCell className="text-gray-700">{departmentLabel(departmentById.get(user.departmentId))}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(user.status)}>
                            {USER_STATUSES.find((status) => status.value === user.status)?.label ?? user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.id === currentUser?.id && <Badge variant="outline">You</Badge>}
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && !loadError && (
                  <div className="text-center p-12 text-gray-400">No users match your filter.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Create user' : `Edit ${editingUser?.email ?? 'user'}`}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'The system generates a random password for new users. Password sign-in needs a password reset before it can be used.'
                : 'Changes take effect the next time the user signs in or refreshes their session.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            form={form}
            setForm={setForm}
            departments={departments}
            jobRoles={jobRoles}
            isEdit={dialogMode === 'edit'}
            isSelf={dialogMode === 'edit' && isSelf}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isFormComplete(form)}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {dialogMode === 'create' ? 'Create user' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
