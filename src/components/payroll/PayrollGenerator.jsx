import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Coins, TrendingDown, CircleHelp, Calculator as CalculatorIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TAX_BRACKETS = [
  { min: 0, max: 300000, rate: 7 },
  { min: 300000, max: 600000, rate: 11 },
  { min: 600000, max: 1100000, rate: 15 },
  { min: 1100000, max: 1600000, rate: 19 },
  { min: 1600000, max: 3200000, rate: 21 },
  { min: 3200000, max: Infinity, rate: 24 }
];

const PayrollGenerator = ({ onClose }) => {
  const [annualGross, setAnnualGross] = useState(0);
  const [annualBasic, setAnnualBasic] = useState(0);
  const [annualHousing, setAnnualHousing] = useState(0);
  const [annualTransport, setAnnualTransport] = useState(0);
  
  const [nhfApplicable, setNhfApplicable] = useState(true);
  
  const [taxResult, setTaxResult] = useState(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
  };
  
  const calculatePAYE = () => {
    const gross = parseFloat(annualGross) || 0;
    const basic = parseFloat(annualBasic) || 0;
    const housing = parseFloat(annualHousing) || 0;
    const transport = parseFloat(annualTransport) || 0;

    // Pension is 8% of Basic + Housing + Transport
    const pensionableIncome = basic + housing + transport;
    const annualPension = pensionableIncome * 0.08;

    // NHF is 2.5% of Basic
    const annualNhf = nhfApplicable ? basic * 0.025 : 0;
    
    // CRA = 20% of gross + higher of (200,000 or 1% of gross)
    const twentyPercentOfGross = gross * 0.20;
    const onePercentOfGross = gross * 0.01;
    const higherAmount = Math.max(200000, onePercentOfGross);
    const consolidatedRelief = twentyPercentOfGross + higherAmount;
    
    // Taxable income
    const taxableIncome = Math.max(0, gross - consolidatedRelief - annualPension - annualNhf);

    let annualTax = 0;
    let remainingIncome = taxableIncome;
    let taxBreakdown = [];

    for (const bracket of TAX_BRACKETS) {
      if (remainingIncome <= 0) break;
      const rangeSize = bracket.max - (bracket.min || 0);
      const taxableInBracket = Math.min(remainingIncome, rangeSize);
      const taxForBracket = (taxableInBracket * bracket.rate) / 100;
      annualTax += taxForBracket;
      
      if (taxableInBracket > 0) {
        taxBreakdown.push({
          bracket: `₦${(bracket.min || 0).toLocaleString()} - ${bracket.max === Infinity ? 'Above' : '₦' + bracket.max.toLocaleString()}`,
          rate: `${bracket.rate}%`,
          taxableAmount: taxableInBracket,
          tax: taxForBracket
        });
      }
      remainingIncome -= taxableInBracket;
    }

    setTaxResult({
      annualGross: gross,
      annualPension: annualPension,
      annualNhf: annualNhf,
      consolidatedRelief: consolidatedRelief,
      taxableIncome: taxableIncome,
      annualTax: annualTax,
      monthlyTax: annualTax / 12,
      taxBreakdown: taxBreakdown,
    });
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Enter Annual Salary Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annual-basic">Annual Basic Salary (₦)</Label>
              <Input id="annual-basic" type="number" placeholder="e.g., 3000000" onChange={e => setAnnualBasic(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual-housing">Annual Housing Allowance (₦)</Label>
              <Input id="annual-housing" type="number" placeholder="e.g., 1500000" onChange={e => setAnnualHousing(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual-transport">Annual Transport Allowance (₦)</Label>
              <Input id="annual-transport" type="number" placeholder="e.g., 500000" onChange={e => setAnnualTransport(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual-gross">Total Annual Gross Income (₦)</Label>
              <Input id="annual-gross" type="number" placeholder="e.g., 6000000" onChange={e => setAnnualGross(e.target.value)} />
              <p className="text-xs text-gray-500">Enter total gross if you don't want to break it down.</p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="nhf-applicable"
                  checked={nhfApplicable}
                  onCheckedChange={setNhfApplicable}
                />
                <Label htmlFor="nhf-applicable" className="text-sm font-normal">
                  NHF Deduction Applies (2.5% of Basic)
                </Label>
              </div>
          </CardContent>
          <CardFooter className="flex justify-end">
             <Button onClick={calculatePAYE}>
              <CalculatorIcon className="mr-2 h-4 w-4" /> Calculate PAYE
            </Button>
          </CardFooter>
        </Card>

        {/* Result Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Tax Calculation Result</CardTitle>
          </CardHeader>
          <CardContent>
            {taxResult ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Annual Gross Income:</span> <strong>{formatCurrency(taxResult.annualGross)}</strong></div>
                <div className="border-b pb-2"></div>
                <div className="flex justify-between text-red-600"><span>Pension Deduction (8%):</span> <span>- {formatCurrency(taxResult.annualPension)}</span></div>
                <div className="flex justify-between text-red-600"><span>NHF Deduction:</span> <span>- {formatCurrency(taxResult.annualNhf)}</span></div>
                <div className="flex justify-between text-red-600"><span>Consolidated Relief:</span> <span>- {formatCurrency(taxResult.consolidatedRelief)}</span></div>
                <div className="border-b pb-2"></div>
                <div className="flex justify-between"><span>Total Taxable Income:</span> <strong>{formatCurrency(taxResult.taxableIncome)}</strong></div>
                <div className="border-b pb-2"></div>
                <div className="flex justify-between text-lg font-bold text-blue-700"><span>Total Annual Tax (PAYE):</span> <span>{formatCurrency(taxResult.annualTax)}</span></div>
                <div className="flex justify-between text-md font-semibold text-blue-600"><span>Effective Monthly Tax:</span> <span>{formatCurrency(taxResult.monthlyTax)}</span></div>
                
                <div className="pt-4">
                  <h4 className="font-semibold mb-2 flex items-center"><Coins className="w-4 h-4 mr-2" />Tax Brackets Breakdown:</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bracket</TableHead>
                        <TableHead>Taxable</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxResult.taxBreakdown.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.bracket}</TableCell>
                          <TableCell>{formatCurrency(item.taxableAmount)}</TableCell>
                          <TableCell>{item.rate}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.tax)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <CircleHelp className="h-4 w-4" />
                <AlertTitle>Awaiting Calculation</AlertTitle>
                <AlertDescription>
                  Enter the annual salary details and click "Calculate PAYE" to see the results.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollGenerator;