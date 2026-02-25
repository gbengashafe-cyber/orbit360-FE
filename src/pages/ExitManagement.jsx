import React, { useState, useEffect } from 'react';
import { userService, employeeService, departmentService } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import ExitManagementComponent from '../components/selfservice/ExitManagement';

export default function ExitManagementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployeeData, setCurrentEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHrAdmin, setIsHrAdmin] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('self');
  const [selfEmployeeRecord, setSelfEmployeeRecord] = useState(null);

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadDataForEmployee = async (employee) => {
    if (!employee) {
      setCurrentEmployeeData(null);
      return;
    }
    setCurrentEmployeeData(employee);
  };

  const loadBaseData = async () => {
    setLoading(true);
    try {
      // Get current user
      const userResponse = await userService.getCurrentUser();
      const user = userResponse?.data || userResponse;
      setCurrentUser(user);

      // Get employee record to find department
      let userEmployeeRecord = null;
      let allEmpsData = [];
      const userIsHrAdmin = user.role && ['admin', 'admin_officer'].includes(user.role);

      // If HR admin, fetch all employees from all departments using pagination
      if (userIsHrAdmin) {
        const employeesResponse = await employeeService.getEmployees({ page: 1, rows: 500 });
        allEmpsData = Array.isArray(employeesResponse?.data) ? employeesResponse.data : Array.isArray(employeesResponse) ? employeesResponse : [];
        userEmployeeRecord = allEmpsData.find(e => e.email === user.email) || null;
        setAllEmployees(allEmpsData);
      } else {
         // For regular employees, use the user service to get their employee data
         try {
           const empData = await employeeService.getUserEmployeeData();
           userEmployeeRecord = empData?.data || empData;
           
           // Add department information if missing
           if (userEmployeeRecord && !userEmployeeRecord.departmentName) {
             // Try to get department name from department object or ID
             userEmployeeRecord.departmentName = userEmployeeRecord.department?.name || 
                                                  userEmployeeRecord.departmentName || 
                                                  'N/A';
           }
         } catch (err) {
           console.warn('Could not fetch user employee data:', err);
         }
       }

      // Check if HR admin
      setIsHrAdmin(userIsHrAdmin);

      // Set self employee record and load data
      if (userEmployeeRecord) {
        setSelfEmployeeRecord(userEmployeeRecord);
        if (selectedEmployeeId === 'self') {
          await loadDataForEmployee(userEmployeeRecord);
        } else {
          const targetEmployee = allEmpsData.find(e => String(e.id) === String(selectedEmployeeId));
          await loadDataForEmployee(targetEmployee);
        }
      } else {
        // Fallback if employee record not found
        const basicEmployeeData = {
          id: user.id,
          firstName: user.full_name?.split(' ')[0] || 'User',
          lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          departmentName: user.department || 'general',
          jobRole: 'Employee',
          status: 'active'
        };
        setSelfEmployeeRecord(basicEmployeeData);
        if (selectedEmployeeId === 'self') {
          setCurrentEmployeeData(basicEmployeeData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSwitch = async (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setLoading(true);
    try {
      if (employeeId === 'self') {
        await loadDataForEmployee(selfEmployeeRecord);
      } else {
        const targetEmployee = allEmployees.find(e => String(e.id) === employeeId);
        await loadDataForEmployee(targetEmployee);
      }
    } catch (error) {
      console.error('Error switching employee:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div></div>;
  }

  if (!currentEmployeeData) {
    return <div className="p-8 text-center text-red-500">Could not load employee data. Please contact support.</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exit Management</h1>
            <p className="text-gray-600">Manage resignations and the offboarding process</p>
          </div>
        </div>

        {isHrAdmin && (
          <div className="flex flex-col md:flex-row items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl gap-4">
             <p className="text-sm font-medium text-blue-800">Admin: You are viewing an employee portal.</p>
            <div className="w-full md:w-72">
                <Select value={selectedEmployeeId} onValueChange={handleEmployeeSwitch}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="View as..." /></SelectTrigger>
                    <SelectContent>
                        {selfEmployeeRecord && <SelectItem value="self">View My Portal ({selfEmployeeRecord.firstName} {selfEmployeeRecord.lastName})</SelectItem>}
                        {allEmployees.map(emp => (<SelectItem key={emp.id} value={String(emp.id)}>{emp.firstName} {emp.lastName} ({emp.staffId || 'N/A'})</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        )}
        
        <ExitManagementComponent employee={currentEmployeeData} isHrAdmin={isHrAdmin} onUpdate={loadBaseData} />
      </div>
    </div>
  );
}