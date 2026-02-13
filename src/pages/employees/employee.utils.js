export class EmployeeUtil {
  static getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      on_leave: 'bg-yellow-100 text-yellow-700',
      terminated: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  static calculateTotalGrossPay = (employee) => {
    const basic = parseFloat(employee.annualBasicSalary) || 0;
    const housing = parseFloat(employee.annualHousingAllowance) || 0;
    const transport = parseFloat(employee.annualTransportAllowance) || 0;
    const leave = parseFloat(employee.annualLeaveAllowance) || 0;
    const other = parseFloat(employee.annualOtherAllowances) || 0;
    return basic + housing + transport + leave + other;
  };

  // Calculate pension deduction (8% of Basic + Housing + Transport, only if applicable)
  static calculatePensionDeduction = (employee) => {
    if (employee.pensionApplicable === false) return 0;
    const basic = parseFloat(employee.annualBasicSalary) || 0;
    const housing = parseFloat(employee.annualHousingAllowance) || 0;
    const transport = parseFloat(employee.annualTransportAllowance) || 0;
    const pensionableIncome = basic + housing + transport;
    return (pensionableIncome * 8) / 100;
  };

  // Calculate NHF deduction (2.5% of Basic Salary only, if applicable)
  static calculateNHFDeduction = (employee) => {
    if (!employee.nhfApplicable) return 0;
    const basic = parseFloat(employee.annualBasicSalary) || 0;
    return (basic * 2.5) / 100;
  };

  static calculateRentRelief = (annualRentAmount) => {
    const annualRentRelief = annualRentAmount * 0.2;
    return annualRentRelief <= 500000 ? annualRentRelief : 500000;
  };

  static calculatePAYE = (employee) => {
    const annualGross = this.calculateTotalGrossPay(employee);
    const annualPension = this.calculatePensionDeduction(employee);
    const annualNhf = this.calculateNHFDeduction(employee);
    const annualRentRelief = this.calculateRentRelief(employee.annualRentAmount);

    // Step 1: Calculate Taxable Income (Gross Income - Deductions)
    const taxableIncome = parseFloat(Math.max(0, annualGross - annualPension - annualNhf - annualRentRelief).toFixed(2));

    // Step 2: Apply Progressive Tax Rates per Nigeria Tax Act 2025
    let annualTax = 0;
    let taxBreakdown = [];
    let remainingIncome = taxableIncome;

    // Band 1: First ₦800,000 @ 0% (Tax-Free Threshold)
    if (remainingIncome > 0) {
      const bandAmount = Math.min(remainingIncome, 800000);
      const bandTax = parseFloat((bandAmount * 0).toFixed(2));
      annualTax += bandTax;
      taxBreakdown.push({
        band: 'Band 1',
        tier: 'First ₦800,000 (₦0 - ₦800,000)',
        taxablePortion: parseFloat(bandAmount.toFixed(2)),
        rate: '0%',
        tax: bandTax,
      });
      remainingIncome -= bandAmount;
    }

    // Band 2: Next ₦2,200,000 (₦800,001 - ₦3,000,000) @ 15%
    if (remainingIncome > 0) {
      const bandAmount = Math.min(remainingIncome, 2200000);
      const bandTax = parseFloat((bandAmount * 0.15).toFixed(2));
      annualTax += bandTax;
      taxBreakdown.push({
        band: 'Band 2',
        tier: 'Next ₦2,200,000 (₦800,001 - ₦3,000,000)',
        taxablePortion: parseFloat(bandAmount.toFixed(2)),
        rate: '15%',
        tax: bandTax,
      });
      remainingIncome -= bandAmount;
    }

    // Band 3: Next ₦9,000,000 (₦3,000,001 - ₦12,000,000) @ 18%
    if (remainingIncome > 0) {
      const bandAmount = Math.min(remainingIncome, 9000000);
      const bandTax = parseFloat((bandAmount * 0.18).toFixed(2));
      annualTax += bandTax;
      taxBreakdown.push({
        band: 'Band 3',
        tier: 'Next ₦9,000,000 (₦3,000,001 - ₦12,000,000)',
        taxablePortion: parseFloat(bandAmount.toFixed(2)),
        rate: '18%',
        tax: bandTax,
      });
      remainingIncome -= bandAmount;
    }

    // Band 4: Next ₦13,000,000 (₦12,000,001 - ₦25,000,000) @ 21%
    if (remainingIncome > 0) {
      const bandAmount = Math.min(remainingIncome, 13000000);
      const bandTax = parseFloat((bandAmount * 0.21).toFixed(2));
      annualTax += bandTax;
      taxBreakdown.push({
        band: 'Band 4',
        tier: 'Next ₦13,000,000 (₦12,000,001 - ₦25,000,000)',
        taxablePortion: parseFloat(bandAmount.toFixed(2)),
        rate: '21%',
        tax: bandTax,
      });
      remainingIncome -= bandAmount;
    }

    // Band 5: Next ₦25,000,000 (₦25,000,001 - ₦50,000,000) @ 23%
    if (remainingIncome > 0) {
      const bandAmount = Math.min(remainingIncome, 25000000);
      const bandTax = parseFloat((bandAmount * 0.23).toFixed(2));
      annualTax += bandTax;
      taxBreakdown.push({
        band: 'Band 5',
        tier: 'Next ₦25,000,000 (₦25,000,001 - ₦50,000,000)',
        taxablePortion: parseFloat(bandAmount.toFixed(2)),
        rate: '23%',
        tax: bandTax,
      });
      remainingIncome -= bandAmount;
    }

    // Band 6: Above ₦50,000,000 @ 25%
    if (remainingIncome > 0) {
      const bandAmount = remainingIncome;
      const bandTax = parseFloat((bandAmount * 0.25).toFixed(2));
      annualTax += bandTax;
      taxBreakdown.push({
        band: 'Band 6',
        tier: 'Above ₦50,000,000',
        taxablePortion: parseFloat(bandAmount.toFixed(2)),
        rate: '25%',
        tax: bandTax,
      });
    }

    // Step 3: Return Annual Tax and Monthly Tax (Annual ÷ 12)
    const finalAnnualTax = parseFloat(annualTax.toFixed(2));
    const monthlyTax = parseFloat((finalAnnualTax / 12).toFixed(2));

    return {
      tax: finalAnnualTax,
      monthlyTax: monthlyTax,
      taxableIncome: taxableIncome,
      breakdown: taxBreakdown,
    };
  };

  static formatCurrency = (value) =>
    (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
