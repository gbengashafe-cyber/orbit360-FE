import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoanUtil } from './loan.utils';

export default function LoanForm({ loan, employees, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employeeId: loan?.employeeId || '',
    loanType: loan?.loanType || 'personal',
    principalAmount: loan?.principalAmount || '',
    interestRate: loan?.interestRate || '',
    tenureMonths: loan?.tenureMonths || '',
    startDate: loan?.startDate ? new Date(loan.startDate) : new Date(),
    status: loan?.status || 'pending_approval',
    approverRole: loan?.approverRole || '',
    notes: loan?.notes || '',
  });

  const [calculations, setCalculations] = useState({
    monthlyDeduction: loan?.monthlyDeduction || 0,
    totalRepayment: loan?.totalRepayment || 0,
    endDate: loan?.endDate ? new Date(loan.endDate) : null,
  });

  useEffect(() => {
    const { principalAmount, interestRate, tenureMonths } = formData;
    if (principalAmount > 0 && interestRate >= 0 && tenureMonths > 0) {
      const calculations = LoanUtil.calculations(formData);

      setCalculations(calculations);
    } else {
      setCalculations({ monthlyDeduction: 0, totalRepayment: 0, endDate: null });
    }
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      principalAmount: parseFloat(formData.principalAmount),
      interestRate: parseFloat(formData.interestRate),
      tenureMonths: parseInt(formData.tenureMonths),
      monthlyDeduction: calculations.monthlyDeduction,
      totalRepayment: calculations.totalRepayment,
      startDate: format(formData.startDate, 'yyyy-MM-dd'),
      endDate: calculations.endDate ? format(calculations.endDate, 'yyyy-MM-dd') : null,
      approverRole: formData.approverRole,
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employeeId">Employee *</Label>
        <Select value={String(formData.employeeId)} onValueChange={(value) => handleInputChange('employeeId', value)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={String(emp.id)}>
                {emp.firstName} {emp.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loanType">Loan Type *</Label>
          <Select value={formData.loanType} onValueChange={(value) => handleInputChange('loanType', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERSONAL">Personal Loan</SelectItem>
              <SelectItem value="SALARY_ADVANCE">Salary Advance</SelectItem>
              <SelectItem value="THRIFT">Thrift</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loan?.id ? (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="pending_disbursement">Pending Disbursement</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paid_off">Paid Off</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="principalAmount">Principal (₦) *</Label>
          <Input
            id="principalAmount"
            type="number"
            value={formData.principalAmount}
            onChange={(e) => handleInputChange('principalAmount', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interestRate">Annual Interest (%) *</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.1"
            value={formData.interestRate}
            onChange={(e) => handleInputChange('interestRate', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenureMonths">Tenure (Months) *</Label>
          <Input
            id="tenureMonths"
            type="number"
            value={formData.tenureMonths}
            onChange={(e) => handleInputChange('tenureMonths', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData.startDate} onSelect={(date) => handleInputChange('startDate', date)} />
            </PopoverContent>
          </Popover>
        </div>

        {loan?.id ? (
          <div className="space-y-2">
            <Label htmlFor="approverRole">Approving Manager *</Label>
            <Select value={formData.approverRole} onValueChange={(value) => handleInputChange('approverRole', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select approver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="headOfOperations">Head of Operations</SelectItem>
                <SelectItem value="managingDirector">Managing Director</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h4 className="font-semibold text-sm">Loan Summary</h4>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Monthly Deduction:</span>{' '}
          <strong>₦{calculations.monthlyDeduction.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Repayment:</span>{' '}
          <strong>₦{calculations.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">End Date:</span>{' '}
          <strong>{calculations.endDate ? format(calculations.endDate, 'yyyy-mm-dd') : 'N/A'}</strong>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" /> {loan ? 'Update' : 'Save'} Loan
        </Button>
      </div>
    </form>
  );
}
