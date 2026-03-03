import { EmployeeSchema } from './employee';
import { exitSchema } from './exits';
import { jobPostingSchema } from './job-posting';
import { leaveSchema } from './leave';
import { loanSchema } from './loan';
import { payrollBatchSchema } from './payroll-batch';
import { trainingRequestSchema } from './training-request';

export const MODULE_SCHEMAS = {
  payrolls: payrollBatchSchema,
  loans: loanSchema,
  employees: EmployeeSchema,
  leaves: leaveSchema,
  'job postings': jobPostingSchema,
  exits: exitSchema,
  'training requests': trainingRequestSchema,
};
