import { loanSchema } from './loan';
import { payrollBatchSchema } from './payroll-batch';

export const MODULE_SCHEMAS = { payrolls: payrollBatchSchema, loans: loanSchema };
