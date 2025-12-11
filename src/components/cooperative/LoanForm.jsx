
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { format, addMonths } from "date-fns";

export default function LoanForm({ loan, employees, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employee_id: loan?.employee_id || "",
    loan_type: loan?.loan_type || "personal",
    principal_amount: loan?.principal_amount || "",
    interest_rate: loan?.interest_rate || "",
    tenure_months: loan?.tenure_months || "",
    start_date: loan?.start_date ? new Date(loan.start_date) : new Date(),
    status: loan?.status || "pending_approval",
    approver_role: loan?.approver_role || "", // Added approver_role
    notes: loan?.notes || "",
  });

  const [calculations, setCalculations] = useState({
    monthly_deduction: loan?.monthly_deduction || 0,
    total_repayment: loan?.total_repayment || 0,
    end_date: loan?.end_date ? new Date(loan.end_date) : null,
  });

  useEffect(() => {
    const { principal_amount, interest_rate, tenure_months, start_date } = formData;
    if (principal_amount > 0 && interest_rate >= 0 && tenure_months > 0) {
      const principal = parseFloat(principal_amount);
      const annualInterest = parseFloat(interest_rate) / 100;
      const tenure = parseInt(tenure_months);
      
      const totalInterest = principal * annualInterest * (tenure / 12);
      const totalRepayment = principal + totalInterest;
      const monthlyDeduction = totalRepayment / tenure;

      const endDate = addMonths(new Date(start_date), tenure);

      setCalculations({
        monthly_deduction: monthlyDeduction,
        total_repayment: totalRepayment,
        end_date: endDate,
      });
    } else {
       setCalculations({ monthly_deduction: 0, total_repayment: 0, end_date: null });
    }
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      principal_amount: parseFloat(formData.principal_amount),
      interest_rate: parseFloat(formData.interest_rate),
      tenure_months: parseInt(formData.tenure_months),
      monthly_deduction: calculations.monthly_deduction,
      total_repayment: calculations.total_repayment,
      start_date: format(formData.start_date, "yyyy-MM-dd"),
      end_date: calculations.end_date ? format(calculations.end_date, "yyyy-MM-dd") : null,
      approver_role: formData.approver_role, // Included approver_role in submission
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee_id">Employee *</Label>
        <Select value={formData.employee_id} onValueChange={(value) => handleInputChange("employee_id", value)} required>
          <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loan_type">Loan Type *</Label>
          <Select value={formData.loan_type} onValueChange={(value) => handleInputChange("loan_type", value)} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Loan</SelectItem>
              <SelectItem value="salary_advance">Salary Advance</SelectItem>
              <SelectItem value="thrift">Thrift</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paid_off">Paid Off</SelectItem>
               <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="principal_amount">Principal (₦) *</Label>
          <Input id="principal_amount" type="number" value={formData.principal_amount} onChange={e => handleInputChange("principal_amount", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interest_rate">Annual Interest (%) *</Label>
          <Input id="interest_rate" type="number" step="0.1" value={formData.interest_rate} onChange={e => handleInputChange("interest_rate", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenure_months">Tenure (Months) *</Label>
          <Input id="tenure_months" type="number" value={formData.tenure_months} onChange={e => handleInputChange("tenure_months", e.target.value)} required />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label> {/* Label updated to be required */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData.start_date} onSelect={(date) => handleInputChange("start_date", date)} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="approver_role">Approving Manager *</Label>
          <Select value={formData.approver_role} onValueChange={(value) => handleInputChange("approver_role", value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select approver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="head_of_operations">Head of Operations</SelectItem>
              <SelectItem value="managing_director">Managing Director</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h4 className="font-semibold text-sm">Loan Summary</h4>
        <div className="flex justify-between text-sm"><span className="text-gray-600">Monthly Deduction:</span> <strong>₦{calculations.monthly_deduction.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
        <div className="flex justify-between text-sm"><span className="text-gray-600">Total Repayment:</span> <strong>₦{calculations.total_repayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
        <div className="flex justify-between text-sm"><span className="text-gray-600">End Date:</span> <strong>{calculations.end_date ? format(calculations.end_date, 'PPP') : 'N/A'}</strong></div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={formData.notes} onChange={e => handleInputChange("notes", e.target.value)} />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit"><Save className="w-4 h-4 mr-2" /> {loan ? 'Update' : 'Save'} Loan</Button>
      </div>
    </form>
  );
}
