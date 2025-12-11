
import React, { useState, useEffect, useCallback } from 'react';
import { User, Employee } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Users } from 'lucide-react';
import AppraisalsComponent from '../components/selfservice/Appraisals';
import { Loader2 } from 'lucide-react';

export default function AppraisalsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployeeData, setCurrentEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHrAdmin, setIsHrAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [directReports, setDirectReports] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('self');
  const [selfEmployeeRecord, setSelfEmployeeRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('my_appraisal');

  const loadDataForEmployee = useCallback(async (employee) => {
    if (!employee) {
      setCurrentEmployeeData(null);
      return;
    }
    setCurrentEmployeeData(employee);
  }, []); // Dependencies are stable setters, so empty array is fine for now

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const userIsHrAdmin = user.role && ['admin', 'human_resources_manager', 'managing_director'].includes(user.role);
      setIsHrAdmin(userIsHrAdmin);

      const allEmps = await Employee.list();

      const userEmployeeRecord = allEmps.find(e => e.email === user.email);

      if (userIsHrAdmin) {
        setAllEmployees(allEmps);
      }
      
      if (userEmployeeRecord) {
        const reports = allEmps.filter(e => e.supervisor_id === userEmployeeRecord.id);
        if (reports.length > 0) {
            setIsSupervisor(true);
            setDirectReports(reports);
        }
      }

      if (userEmployeeRecord) {
        setSelfEmployeeRecord(userEmployeeRecord);
        if (selectedEmployeeId === 'self') {
          await loadDataForEmployee(userEmployeeRecord);
        } else {
          const targetEmployee = allEmps.find(e => e.id === selectedEmployeeId);
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
  }, [selectedEmployeeId, loadDataForEmployee]); // Add selectedEmployeeId and loadDataForEmployee to dependencies

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]); // Depend on loadBaseData to re-run when it changes (due to its own dependencies)

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
    return <div className="p-8 text-center flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" /></div>;
  }

  if (!currentEmployeeData) {
    return <div className="p-8 text-center text-red-500">Could not load employee data. Please contact support.</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Appraisals</h1>
            <p className="text-gray-600">Manage your annual performance review and team appraisals.</p>
          </div>
        </div>

        {isHrAdmin && (
          <div className="flex flex-col md:flex-row items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl gap-4">
             <p className="text-sm font-medium text-blue-800">Admin View: Select an employee to view their portal.</p>
            <div className="w-full md:w-72">
                <Select value={selectedEmployeeId} onValueChange={handleEmployeeSwitch}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="View as..." /></SelectTrigger>
                    <SelectContent>
                        {selfEmployeeRecord && <SelectItem value="self">My Portal ({selfEmployeeRecord.first_name} {selfEmployeeRecord.last_name})</SelectItem>}
                        {allEmployees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        )}

        <Card className="shadow-xl">
            <CardContent className="p-6">
                <AppraisalsComponent 
                    employee={currentEmployeeData}
                    currentUser={currentUser}
                    isSupervisor={isSupervisor}
                    isHrAdmin={isHrAdmin} // Added isHrAdmin prop
                    directReports={directReports}
                    onUpdate={loadBaseData} 
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
