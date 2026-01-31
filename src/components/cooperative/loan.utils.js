import { addMonths } from 'date-fns';

export class LoanUtil {
  static calculations = (loan) => {
    const { principalAmount, interestRate, tenureMonths, startDate } = loan;
    const principal = parseFloat(principalAmount);
    const annualInterest = parseFloat(interestRate) / 100;
    const tenure = parseInt(tenureMonths);

    const totalInterest = principal * annualInterest;
    const totalRepayment = principal + totalInterest;
    const monthlyDeduction = totalRepayment / tenure;

    const endDate = addMonths(new Date(startDate), tenureMonths);

    return { monthlyDeduction, totalRepayment, totalInterest, endDate };
  };
}
