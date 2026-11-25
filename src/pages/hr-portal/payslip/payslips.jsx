import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalContext } from '@/state/context';
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
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 print:hidden">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-page-title text-foreground">{isHrView ? 'Payslips' : 'My payslips'}</h1>
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
