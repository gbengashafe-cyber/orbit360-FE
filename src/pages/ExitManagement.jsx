import React, { useState, useEffect } from 'react';
import { User, Employee } from '@/api/entities';
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
      const user = await User.me();
      setCurrentUser(user);

      const userIsHrAdmin = user.role && ['admin', 'admin_officer'].includes(user.role);
      setIsHrAdmin(userIsHrAdmin);

      if (userIsHrAdmin) {
        const allEmps = await Employee.list();
        setAllEmployees(allEmps);
      }

      const employees = await Employee.filter({ email: user.email });
      if (employees.length > 0) {
        const selfRecord = employees[0];
        setSelfEmployeeRecord(selfRecord);
        if (selectedEmployeeId === 'self') {
          await loadDataForEmployee(selfRecord);
        } else {
          const targetEmployee = allEmployees.find(e => e.id === selectedEmployeeId);
          await loadDataForEmployee(targetEmployee);
        }
      } else {
        const basicEmployeeData = { id: user.id, first_name: user.full_name?.split(' ')[0] || 'User', last_name: user.full_name?.split(' ').slice(1).join(' ') || '', email: user.email, department: user.department || 'general', position: 'Employee', employment_status: 'active' };
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
    if (employeeId === 'self') {
      await loadDataForEmployee(selfEmployeeRecord);
    } else {
      const targetEmployee = allEmployees.find(e => e.id === employeeId);
      await loadDataForEmployee(targetEmployee);
    }
    setLoading(false);
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
                        {selfEmployeeRecord && <SelectItem value="self">View My Portal ({selfEmployeeRecord.first_name} {selfEmployeeRecord.last_name})</SelectItem>}
                        {allEmployees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        )}
        
        <ExitManagementComponent employee={currentEmployeeData} onUpdate={loadBaseData} />
      </div>
    </div>
  );
}