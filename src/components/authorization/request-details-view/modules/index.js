import { EmployeeSchema } from './employee';
import { leaveSchema } from './leave';
import { loanSchema } from './loan';
import { payrollBatchSchema } from './payroll-batch';

export const MODULE_SCHEMAS = { payrolls: payrollBatchSchema, loans: loanSchema, employees: EmployeeSchema, leaves: leaveSchema };
