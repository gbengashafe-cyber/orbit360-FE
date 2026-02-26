import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalContext } from '@/state/context';
import { Receipt } from 'lucide-react';
import { useLocation } from 'react-router';
import { EmployeePayslipView } from './employee-payslip-view';
import { HrPayslipView } from './hr-payslip-view';
import { usePayslips } from './use-payslips';

export default function MyPayslips() {
  const { currentUser } = useGlobalContext();
  const location = useLocation();

  const isHrView = location.pathname === '/payslips';

  const { loading, allEmployees, selectedEmployee, payrollRecords, handleEmployeeChange, loadingEmployees } = usePayslips({
    isHrView,
    employeeId: currentUser?.employeeData?.id,
    location,
  });

  return (
    <div className="p-4 lg:p-8 min-h-screen print:hidden" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
              <p className="text-gray-600">
                {isHrView
                  ? "View and download employees' salary statements."
                  : 'View and download your monthly salary statements.'}
              </p>
            </div>
          </div>
          {isHrView ? (
            <Select disabled={loadingEmployees} value={selectedEmployee?.id} onValueChange={handleEmployeeChange}>
              <SelectTrigger className="w-64 bg-white">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {allEmployees.length > 0
                  ? allEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.employeeId}
                      </SelectItem>
                    ))
                  : null}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {isHrView ? (
          <HrPayslipView records={payrollRecords} isLoading={loading} />
        ) : (
          <EmployeePayslipView employeeRecordId={currentUser?.employeeData?.id} isLoading={loading} />
        )}
      </div>
    </div>
  );
}
