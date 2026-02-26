import { PayslipHistoryList } from './payslip-history-list';

export const HrPayslipView = ({ records, isLoading }) => {
  return <PayslipHistoryList records={records} isLoading={isLoading} />;
};
