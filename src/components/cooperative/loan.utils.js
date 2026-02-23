import { addMonths } from 'date-fns';
import Decimal from 'decimal.js';

export class LoanUtil {
  static calculations = (loan) => {
    const { principalAmount, interestRate, tenureMonths, startDate } = loan;
    const principal = new Decimal(principalAmount);
    const annualRate = new Decimal(interestRate).div(100);
    const tenure = new Decimal(tenureMonths);

    const monthlyRate = annualRate.div(12);
    const totalInterest = principal.mul(monthlyRate).mul(tenure);
    const totalRepayment = principal.plus(totalInterest);

    const monthlyDeduction = totalRepayment.div(tenure).toDecimalPlaces(2);
    const endDate = addMonths(new Date(startDate), Number(tenureMonths));

    return {
      monthlyDeduction: monthlyDeduction.toNumber(),
      totalRepayment: totalRepayment.toDecimalPlaces(2).toNumber(),
      totalInterest: totalInterest.toDecimalPlaces(2).toNumber(),
      endDate,
    };
  };
}
