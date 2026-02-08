import { employeeService } from '@/api';
import { jobRoleService } from '@/api/job-role.service';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllDepartments } from '@/hooks/use-all-departments';
import { EmployeeBioDataTable } from '@/pages/employees/employee-bio-data-table';
import { logger } from '@/utils';
import { AlertCircle, Plus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EmployeeForm } from './employee-form';
import { WelcomeDialog } from './welcome-dialog';

export function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWelcomeInfoDialog, setShowWelcomeInfoDialog] = useState(false);
  const [welcomeInfo, setWelcomeInfo] = useState({ email: '', instructions: '' });
  const [jobRoles, setJobRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(25);
  const [pages, setPages] = useState(1);
  const [currentStatus, setCurrentStatus] = useState('active');

  const { allDepartments } = useAllDepartments();

  const loadTerminatedEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const employeesData = await employeeService.getEmployees({
        page: currentPage,
        rows,
        options: { status: currentStatus },
      });
      setEmployees(employeesData.data);
      setPages(employeesData?.pagination?.pages || 1);
    } catch (error) {
      logger.error({ caller: 'Loading terminated employees', payload: error });
      toast.error('Error', { description: `${error.message ? error.message : 'Unable to load employees data.'}` });
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentStatus, rows]);

  const loadActiveEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const employeesData = await employeeService.getActiveEmployees({
        page: currentPage,
        rows,
      });
      setEmployees(employeesData.data);
      setPages(employeesData?.pagination?.pages || 1);
    } catch (error) {
      logger.error({ caller: 'Loading active employees', payload: error });
      toast.error('Error', { description: `${error.message ? error.message : 'Unable to load employees data.'}` });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rows]);

  useEffect(() => {
    currentStatus === 'active' ? loadActiveEmployees() : loadTerminatedEmployees();
  }, [currentStatus, loadActiveEmployees, loadTerminatedEmployees]);

  useEffect(() => {
    loadJobRoles();
  }, []);

  const loadJobRoles = async () => {
    try {
      const jobRolesData = await jobRoleService.getJobRoles({ rows: 1000 });
      setJobRoles(jobRolesData.data);
    } catch (error) {
      toast.error('Error', { description: `${error.message ? error.message : 'Unable to load job roles data.'}` });
    }
  };

  const handleFormSubmit = async (formData) => {
    const { employeeData, createUser } = formData;
    setError('');
    setSuccess('');
    try {
      if (editingEmployee) {
        const response = await employeeService.submitModificationRequest(editingEmployee.id, employeeData);
        toast.success({ description: response.message ?? 'Employee details updated successfully' });
      } else {
        const newEmployeeResponse = await employeeService.createEmployee({ ...employeeData, createUser });
        let successMsg = newEmployeeResponse.message ?? 'New employee created successfully.';

        if (createUser && newEmployeeResponse) {
          try {
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
            throw new Error(`Employee was created, but failed to create user account: ${userError.message}`);
          }
        }
        toast.success('Success', { description: successMsg });
      }
      setShowForm(false);
      setEditingEmployee(null);
      loadTerminatedEmployees();
    } catch (error) {
      setError(`${error.message || 'Unable to complete request. Kindly contact the administrator'}`);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
    setError('');
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
        const response = await employeeService.submitModificationRequest(employeeId, { status: 'terminated' });
        loadTerminatedEmployees();
        toast.success('Success', { description: response.message ?? 'Employee terminated successfully.' });
      } catch (error) {
        setError(`Failed to terminate employee: ${error.message}`);
      }
    }
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
              setError('');
            }}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <Tabs
            defaultValue="active"
            className="w-full"
            onValueChange={(val) => {
              setCurrentStatus(val);
              setCurrentPage(1);
            }}
          >
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="active">Active Employees</TabsTrigger>
                <TabsTrigger value="terminated">Ex-Staff Archive</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0 min-h-[400px] relative">
              {loading ? (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-700 border-t-transparent rounded-full" />
                    Loading ...
                  </div>
                </div>
              ) : (
                <>
                  <TabsContent value="active">
                    <EmployeeBioDataTable
                      employees={employees}
                      onEdit={handleEdit}
                      onTerminate={handleTerminate}
                      onResendInstructions={handleResendInstructions}
                    />
                  </TabsContent>
                  <TabsContent value="terminated">
                    <EmployeeBioDataTable
                      employees={employees}
                      onEdit={handleEdit}
                      onTerminate={handleTerminate}
                      onResendInstructions={handleResendInstructions}
                    />
                  </TabsContent>
                </>
              )}
            </CardContent>
            <CardFooter className="my-8 grid gap-y-4 text-center justify-center items-center">
              <p className="text-sm">
                Showing Page {currentPage} of {pages}
              </p>
              <PaginationIconsOnly
                currentPage={currentPage}
                pages={pages}
                setRows={setRows}
                setCurrentPage={setCurrentPage}
                rows={rows}
              />
            </CardFooter>
          </Tabs>
        </Card>
      </div>
      {showForm ? (
        <EmployeeForm
          showForm={showForm}
          allDepartments={allDepartments}
          employee={editingEmployee}
          jobRoles={jobRoles}
          onSubmit={handleFormSubmit}
          error={error}
          onCancel={() => {
            setShowForm(false);
            setEditingEmployee(null);
          }}
        />
      ) : null}
      <WelcomeDialog shouldOpen={showWelcomeInfoDialog} setShouldOpen={setShowWelcomeInfoDialog} welcomeInfo={welcomeInfo} />
    </div>
  );
}
