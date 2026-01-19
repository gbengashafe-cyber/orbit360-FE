export class LoanUtil {
  static calculateMonthlyContribution = ({ principalAmount, interestRate, tenureMonths }) => {
    const principal = parseFloat(principalAmount);
    const annualInterest = parseFloat(interestRate) / 100;
    const tenure = parseInt(tenureMonths);

    const totalInterest = principal * annualInterest * (tenure / 12);
    const totalRepayment = principal + totalInterest;
    const monthlyDeduction = totalRepayment / tenure;

    return monthlyDeduction;
  };
}
