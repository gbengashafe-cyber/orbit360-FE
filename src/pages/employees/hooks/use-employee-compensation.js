import { useMemo } from 'react';
import { EmployeeUtil } from '../employee.utils';
import { LoanUtil } from '@/components/cooperative/loan.utils';

export function useEmployeeCompensation(formData, employeeLoans) {
  return useMemo(() => {
    const totalGrossPay = EmployeeUtil.calculateTotalGrossPay(formData);
    const annualPensionDeduction = EmployeeUtil.calculatePensionDeduction(formData);
    const annualNHFDeduction = EmployeeUtil.calculateNHFDeduction(formData);
    const annualPAYEData = EmployeeUtil.calculatePAYE(formData);

    const totalMonthlyLoanDeduction = employeeLoans.reduce(
      (sum, loan) => sum + (LoanUtil.calculations(loan).monthlyDeduction || 0),
      0,
    );

    const monthlyGross = totalGrossPay / 12;
    const monthlyPension = annualPensionDeduction / 12;
    const monthlyNHF = annualNHFDeduction / 12;
    const monthlyTax = annualPAYEData.tax / 12;
    const monthlyNetSalary = monthlyGross - monthlyPension - monthlyNHF - monthlyTax - totalMonthlyLoanDeduction;

    return {
      totalGrossPay,
      annualPensionDeduction,
      annualNHFDeduction,
      annualPAYEData,
      totalMonthlyLoanDeduction,
      totalAnnualLoanDeduction: totalMonthlyLoanDeduction * 12,
      monthlyGross,
      monthlyPension,
      monthlyNHF,
      monthlyTax,
      monthlyNetSalary,
      annualNetSalary: monthlyNetSalary * 12,
    };
  }, [formData, employeeLoans]);
}
