import { employeeService } from '@/api';
import { DebouncedSearch } from '@/components/shared/debounced-search';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanies } from '@/hooks/use-all-companies';
import { EmployeeBioDataTable } from '@/pages/employees/employee-bio-data-table';
import { logger } from '@/utils';
import { FilterIcon, Plus, RefreshCw, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmployeeForm } from './employee-form';
import { WelcomeDialog } from './welcome-dialog';

export function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [showWelcomeInfoDialog, setShowWelcomeInfoDialog] = useState(false);
  const [welcomeInfo, setWelcomeInfo] = useState({ email: '', instructions: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(25);
  const [pages, setPages] = useState(1);
  const [currentTab, setCurrentTab] = useState('active');
  const [companyId, setCompanyId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { allCompanies } = useCompanies();

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const loadEmployees = async () => {
      setLoading(true);
      setIsSearching(!!searchQuery);

      try {
        const params = {
          page: currentPage,
          rows,
          search: searchQuery,
          companyId: companyId === 'all' ? '' : companyId,
        };

        let response;

        if (currentTab === 'active') {
          response = await employeeService.getActiveEmployeesV2(params, { signal: controller.signal });
        } else {
          response = await employeeService.getEmployeesV1(
            {
              ...params,
              status: currentTab,
            },
            { signal: controller.signal },
          );
        }

        setEmployees(response.data);
        setPages(response?.pagination?.pages || 1);
      } catch (error) {
        if (error.name === 'AbortError') return;

        logger.error({ caller: 'Fetching employees', payload: error });
        toast.error('Error', {
          description: error.message || 'Unable to load employees data.',
        });
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    loadEmployees();
    return () => {
      controller.abort();
    };
  }, [companyId, currentPage, currentTab, rows, searchQuery, refreshKey]);

  const handleFormSubmit = async (formData) => {
    const { employeeData, createUser } = formData;
    setError('');
    try {
      if (editingEmployee) {
        const response = await employeeService.submitModificationRequest(editingEmployee.id, employeeData);
        toast.success('Success', { description: response.message ?? 'Employee details updated successfully' });
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
            throw new Error(
              `Employee was created, but failed to create user account: ${userError?.message || 'Kindly contact system administrator'}`,
            );
          }
        }
        toast.success('Success', { description: successMsg });
      }
      setShowForm(false);
      setEditingEmployee(null);
      refresh();
    } catch (error) {
      logger.error({ caller: 'Employee page - handleSubmit', payload: error });
      setError(error?.message || 'Unable to complete request. Kindly contact the administrator');
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
        const response = await employeeService.submitModificationRequest(employeeId, { status: 'exited' });
        refresh();
        toast.success('Success', { description: response.message ?? 'Employee terminated successfully.' });
      } catch (error) {
        setError(`Failed to terminate employee: ${error.message}`);
      }
    }
  };

  const handleReinstate = async (employeeId) => {
    if (window.confirm('Are you sure you want to reinstate this employee?')) {
      try {
        const response = await employeeService.submitModificationRequest(employeeId, { status: 'active' });
        refresh();
        toast.success('Success', { description: response.message ?? 'Employee modification submitted successfully.' });
      } catch (error) {
        setError(`Failed to submit modification request: ${error.message}`);
      }
    }
  };
  const handleSuspend = async (employeeId) => {
    if (window.confirm('Are you sure you want to suspend this employee?')) {
      try {
        const response = await employeeService.submitModificationRequest(employeeId, { status: 'SUSPENDED' });
        refresh();
        toast.success('Success', { description: response.message ?? 'Employee modification submitted successfully.' });
      } catch (error) {
        setError(`Failed to submit modification request: ${error.message}`);
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

          <div className="grid gap-y-4 md:grid-flow-col gap-x-4">
            <Button variant="outline" size="icon" onClick={refresh}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
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
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <div className="grid gap-4 md:grid-flow-col px-7 pt-5">
            <div className="relative flex items-center">
              <FilterIcon className="absolute left-3 w-4 text-muted-foreground" />
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SBU" />
                </SelectTrigger>

                <SelectContent className="">
                  <SelectItem value="all" className="cursor-pointer">
                    <span className="ps-6 inline-block p-2 w-full">All SBUs</span>
                  </SelectItem>

                  {allCompanies?.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)} className="cursor-pointer">
                      <span className="ps-6 inline-block p-2  w-full">{company.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DebouncedSearch
              value={searchInput}
              placeholder="Search employees"
              onChange={setSearchInput}
              onSearch={(val) => {
                setCurrentPage(1);
                setSearchQuery(val);
              }}
              loading={isSearching}
            />
          </div>
          <Tabs
            className="w-full"
            onValueChange={(val) => {
              setCurrentTab(val);
              setCurrentPage(1);
            }}
            value={currentTab}
          >
            <CardHeader>
              <TabsList className="grid w-full grid-flow-col justify-start">
                <TabsTrigger value="active">Active Employees</TabsTrigger>
                <TabsTrigger value="pending_approval">Pending Approval</TabsTrigger>
                <TabsTrigger value="on_leave">On Leave</TabsTrigger>
                <TabsTrigger value="suspended">Suspended</TabsTrigger>
                <TabsTrigger value="exited">Ex-Staff Archive</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0 min-h-[400px] relative">
              {loading ? (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-700 border-t-transparent rounded-full" />
                    Loading
                  </div>
                </div>
              ) : (
                <TabsContent value={currentTab}>
                  <EmployeeBioDataTable
                    employees={employees}
                    onEdit={handleEdit}
                    onTerminate={handleTerminate}
                    onSuspend={handleSuspend}
                    onReinstate={handleReinstate}
                    onResendInstructions={handleResendInstructions}
                    currentTab={currentTab}
                  />
                </TabsContent>
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
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          error={error}
          onCancel={() => {
            setShowForm(false);
            setEditingEmployee(null);
          }}
          allCompanies={allCompanies}
        />
      ) : null}
      <WelcomeDialog shouldOpen={showWelcomeInfoDialog} setShouldOpen={setShowWelcomeInfoDialog} welcomeInfo={welcomeInfo} />
    </div>
  );
}
