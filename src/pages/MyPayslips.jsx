import { employeeService, payrollService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalContext } from '@/state/context';
import { Loader2, Printer, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import Payslip from '../components/payroll/Payslip';

export default function MyPayslips() {
  const [employeeData, setEmployeeData] = useState(null);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);

  const { currentUser } = useGlobalContext();
  const location = useLocation();

  const showEmployeeList = location.pathname === '/payslips';

  useEffect(() => {
    const loadAllData = async () => {
      try {
        if (showEmployeeList) {
          const employeesDataResponse = await employeeService.getEmployees({ rows: 1000 });
          setAllEmployees(employeesDataResponse.data);
          if (employeesDataResponse.data.length > 0) {
            const emp = employeesDataResponse.data?.[0];
            setEmployeeData(emp);
            const records = await payrollService.getPayrollByEmployee({ id: emp.id });
            setPayrollRecords(records.data);
          }
        } else {
          if (currentUser?.employee?.id) {
            const records = await employeeService.getEmployeePayrollRecords(currentUser?.employee?.id);
            setPayrollRecords(records.data);
          } else {
            console.log('No employee record found for this user.');
          }
        }
      } catch (error) {
        toast.error('Error loading payslip data', { description: `${error.message ? error.message : ''}` });
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [showEmployeeList, currentUser?.employee?.id]);

  const handleEmployeeChange = async (id) => {
    try {
      setLoading(true);
      const emp = allEmployees.find((e) => e.id === id);
      if (emp) {
        setEmployeeData(emp);
        const records = await payrollService.getPayrollByEmployee({ id: emp.id });
        setPayrollRecords(records.data);
      }
    } catch (error) {
      alert(`Error loading payroll: ${error.message || 'Unable to fetch payroll records. Kindly contact system administrator'} `);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !currentUser) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!currentUser?.employee?.id) {
    return (
      <div className="p-8 text-center text-gray-600">
        <h2 className="text-xl font-semibold">No Employee Data Found</h2>
        <p>Your user account is not linked to an employee record. Please contact HR.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen no-print" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
              <p className="text-gray-600">View and download your monthly salary statements.</p>
            </div>
          </div>
          {showEmployeeList && allEmployees.length > 0 && (
            <Select value={employeeData?.id} onValueChange={handleEmployeeChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {allEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.employeeId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Payslip History</CardTitle>
              {/*
              <div className="flex gap-2 items-center">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const period = date.toISOString().slice(0, 7);
                      return (
                        <SelectItem key={period} value={period}>
                          {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                 <Button onClick={generateMyPayroll} disabled={generating} className="bg-green-600 hover:bg-green-700">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  {generating ? 'Generating...' : 'Generate'}
                </Button> 
              </div>*/}
            </div>
          </CardHeader>
          <CardContent>
            {payrollRecords.length > 0 ? (
              <ul className="space-y-3">
                {payrollRecords.map((record) => (
                  <li
                    key={record.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {new Date(record.payPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Net Pay: ₦
                        {record.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Dialog open={selectedRecord?.id === record.id} onOpenChange={(isOpen) => !isOpen && setSelectedRecord(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedRecord(record)}>
                          View Payslip
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 border-0">
                        {selectedRecord && (
                          <>
                            <DialogHeader>
                              <DialogTitle></DialogTitle>
                              <DialogDescription></DialogDescription>
                            </DialogHeader>
                            <Payslip payrollRecord={selectedRecord} employee={employeeData} />
                            <div className="p-4 bg-gray-100 flex justify-end no-print">
                              <Button onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Print / Save as PDF
                              </Button>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No payslips found for your record.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
