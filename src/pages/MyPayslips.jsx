import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Employee, PayrollRecord } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Receipt, Download, Printer } from 'lucide-react';
import Payslip from '../components/payroll/Payslip';

export default function MyPayslips() {
  const [currentUser, setCurrentUser] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        const employees = await Employee.filter({ email: user.email });
        if (employees.length > 0) {
          const emp = employees[0];
          setEmployeeData(emp);
          const records = await PayrollRecord.filter({ employee_id: emp.id }, '-pay_period');
          setPayrollRecords(records);
        } else {
          console.log("No employee record found for this user.");
        }
      } catch (error) {
        console.error("Error loading payslip data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="p-8 text-center text-gray-600">
        <h2 className="text-xl font-semibold">No Employee Data Found</h2>
        <p>Your user account is not linked to an employee record. Please contact HR.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
            <p className="text-gray-600">View and download your monthly salary statements.</p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Payslip History</CardTitle>
          </CardHeader>
          <CardContent>
            {payrollRecords.length > 0 ? (
              <ul className="space-y-3">
                {payrollRecords.map(record => (
                  <li key={record.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {new Date(record.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Net Pay: ₦{record.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Dialog open={selectedRecord?.id === record.id} onOpenChange={(isOpen) => !isOpen && setSelectedRecord(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedRecord(record)}>View Payslip</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 border-0">
                        {selectedRecord && (
                          <>
                            <Payslip payrollRecord={selectedRecord} employee={employeeData} />
                            <div className="p-4 bg-gray-100 flex justify-end no-print">
                               <Button onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2"/>
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