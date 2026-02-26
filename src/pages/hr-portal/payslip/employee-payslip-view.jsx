import { PayslipHistoryList } from './payslip-history-list';

export const EmployeePayslipView = ({ payrollRecords, employeeRecordId, isLoading }) => {
  if (!employeeRecordId) {
    return (
      <div className="p-8 text-center text-gray-600">
        <h2 className="text-xl font-semibold">No Employee Data Found</h2>
        <p>Your user account is not linked to an employee record. Please contact HR.</p>
      </div>
    );
  }
  return <PayslipHistoryList records={payrollRecords} isLoading={isLoading} />;
};
