import { employeeService, userService } from '@/api';
import { jobRoleService } from '@/api/job-role.service';
import { EmployeeBioDataTable } from '@/components/employees/EmployeeBioDataTable';
import { EmployeeUtil } from '@/components/employees/employee.utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllDepartments } from '@/hooks/use-all-departments';
import { useGlobalContext } from '@/state/context';
import { AlertCircle, Check, Copy, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmployeeForm from '../components/employees/EmployeeForm';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWelcomeInfoDialog, setShowWelcomeInfoDialog] = useState(false);
  const [welcomeInfo, setWelcomeInfo] = useState({ email: '', instructions: '' });
  const [copied, setCopied] = useState(false);
  const [jobRoles, setJobRoles] = useState([]);

  const { currentUser } = useGlobalContext();
  const { allDepartments } = useAllDepartments();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesData, jobRolesData] = await Promise.all([
        employeeService.getEmployees(),
        jobRoleService.getJobRoles({ rows: 1000 }),
      ]);
      setEmployees(employeesData.data);
      setJobRoles(jobRolesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    const { employeeData, createUser } = formData;
    setError('');
    setSuccess('');
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, employeeData);
        setSuccess('Employee details updated successfully.');
      } else {
        const newEmployee = await employeeService.createEmployee(employeeData);
        let successMsg = 'New employee created successfully.';

        if (createUser && newEmployee) {
          try {
            const user = {
              firstName: employeeData.firstName,
              lastName: employeeData.lastName,
              email: employeeData.email,
              role: 'user',
              jobRole: employeeData.jobRole,
              department: employeeData.department,
              createdBy: currentUser?.id,
            };

            await userService.createUser(user);

            const instructions = `
              <h3>Welcome aboard!</h3>
              <p>An employee account has been created for you on the Orbit360 platform.</p>
              <p>You can access the Employee Self-Service Portal by logging in with your Google account associated with this email address (${employeeData.email}).</p>
              <p>Your portal provides access to tools for leave management, performance appraisals, and more.</p>
              <p>If you have any questions, please contact the HR department.</p>
            `
              .replace(/\s+/g, ' ')
              .trim();

            setWelcomeInfo({
              email: employeeData.email,
              instructions: instructions,
            });
            setShowWelcomeInfoDialog(true);

            successMsg += ' A user account was created. Please share the login instructions with the new employee.';
          } catch (userError) {
            setError(`Employee was created, but failed to create user account: ${userError.message}`);
          }
        }
        setSuccess(successMsg);
      }
      setShowForm(false);
      setEditingEmployee(null);
      loadData();
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 8000);
    } catch (error) {
      setError(`Failed to save employee: ${error.message || 'Unable to complete request. Kindly contact the administrator'}`);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleResendInstructions = (employee) => {
    const instructions = `
        <h3>Welcome aboard!</h3>
        <p>An employee account has been created for you on the Orbit360 platform.</p>
        <p>You can access the Employee Self-Service Portal by logging in with your Google account associated with this email address (${employee.email}).</p>
        <p>Your portal provides access to tools for leave management, performance appraisals, and more.</p>
        <p>If you have any questions, please contact the HR department.</p>
      `
      .replace(/\s+/g, ' ')
      .trim();

    setWelcomeInfo({
      email: employee.email,
      instructions: instructions,
    });
    setShowWelcomeInfoDialog(true);
  };

  const handleTerminate = async (employeeId) => {
    if (window.confirm('Are you sure you want to terminate this employee? Their record will be moved to the ex-staff archive.')) {
      try {
        await employeeService.terminateEmployee(employeeId, { status: 'terminated' });
        loadData();
        setSuccess('Employee terminated successfully.');
        setTimeout(() => setSuccess(''), 8000);
      } catch (error) {
        setError(`Failed to terminate employee: ${error.message}`);
        setTimeout(() => setError(''), 8000);
      }
    }
  };

  const activeEmployees = employees.filter((e) => e.status === 'active' || e.status === 'on_leave' || e.status === 'inactive');
  const terminatedEmployees = employees.filter((e) => e.status === 'terminated');

  if (loading) {
    return <div className="p-8 text-center">Loading employee directory...</div>;
  }

  const handleCopy = () => {
    // Remove HTML tags and convert to plain text for clipboard
    const plainTextInstructions = welcomeInfo.instructions
      .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newlines
      .replace(/<\/?(h[1-6]|p|div|ul|ol|li)[^>]*>/gi, '\n') // Replace block tags with newlines
      .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
      .replace(/\n\s*\n/g, '\n\n') // Consolidate multiple newlines
      .trim();

    navigator.clipboard.writeText(
      `To: ${welcomeInfo.email}\nSubject: Welcome to Orbit360 - Your Employee Portal Account\n\n${plainTextInstructions}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
              <p className="text-gray-600">Add, manage, and archive company employees</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingEmployee(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 text-green-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <EmployeeForm
            allDepartments={allDepartments}
            employee={editingEmployee}
            jobRoles={jobRoles}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingEmployee(null);
            }}
          />
        )}

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <Tabs defaultValue="active" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="active">Active Employees ({activeEmployees.length})</TabsTrigger>
                <TabsTrigger value="terminated">Ex-Staff Archive ({terminatedEmployees.length})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="active">
                <EmployeeBioDataTable
                  employees={activeEmployees}
                  onEdit={handleEdit}
                  onTerminate={handleTerminate}
                  getStatusColor={EmployeeUtil.getStatusColor}
                  onResendInstructions={handleResendInstructions}
                />
              </TabsContent>
              <TabsContent value="terminated">
                <EmployeeBioDataTable
                  employees={terminatedEmployees}
                  onEdit={handleEdit}
                  onTerminate={handleTerminate}
                  getStatusColor={EmployeeUtil.getStatusColor}
                  onResendInstructions={handleResendInstructions}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <Dialog open={showWelcomeInfoDialog} onOpenChange={setShowWelcomeInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Account Created Successfully!</DialogTitle>
            <DialogDescription>
              A user account has been created for the new employee. Please copy the instructions below and send them to the
              employee using your own email client. This ensures personalized communication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="text-sm">
              <strong>To:</strong> {welcomeInfo.email}
            </div>
            <div className="text-sm">
              <strong>Subject:</strong> Welcome to Orbit360 - Your Employee Portal Account
            </div>
            <div
              className="p-4 bg-gray-100 rounded-lg border text-sm max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: welcomeInfo.instructions }}
            />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Email Content'}
            </Button>
            <Button variant="secondary" onClick={() => setShowWelcomeInfoDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
