import { loanService } from '@/api/loan.service';
import { LoanUtil } from '@/components/cooperative/loan.utils';
import { FormSubmitError } from '@/components/shared/submit-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const loanSchema = z
  .object({
    loanTypeId: z.coerce.number('Select loan Type').min(1, 'Loan type is required'),
    principalAmount: z.coerce
      .string('Invalid loan amount provided')
      .min(1, 'Amount is required')
      .pipe(z.coerce.number().positive('Loan amount is required')),
    tenureMonths: z.coerce
      .string('Invalid loan tenure provided')
      .min(1, 'Loan tenure is required')
      .pipe(z.coerce.number().int('Tenure must be a whole number').positive('Tenure must be greater than 0')),
    startDate: z.string().min(1, 'Please select the required date'),
    employeeNote: z.string().optional(),
    loanTypeMaxTenure: z.coerce.number().optional(),
  })
  .refine(({ loanTypeMaxTenure, tenureMonths }) => tenureMonths <= loanTypeMaxTenure, {
    message: 'Loan tenure cannot exceed the allowed tenure for the selected loan type',
    path: ['tenureMonths'],
  });

export default function EmployeeLoanForm({ open, onOpenChange, onSuccess, loanTypes, loan }) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const form = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: loan
      ? { ...loan, loanTypeMaxTenure: loan?.loanType?.maxTenureMonths || 0 }
      : {
          loanTypeId: '',
          principalAmount: 0,
          tenureMonths: '',
          startDate: new Date().toJSON().split('T')[0],
          employeeNote: '',
          loanTypeMaxTenure: '',
          interestRate: 0,
        },
    mode: 'all',
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setApiError(null);
    }
  }, [open, form]);

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      setApiError(null);

      if (loan) {
        const response = await loanService.updateLoanRequest(loan.id, values);
        toast.success('Success', { description: response?.message ?? 'Loan request updated successfully' });
      } else {
        const response = await loanService.createLoanRequest(values);
        toast.success('Success', { description: response?.message ?? 'Loan request initiated successfully' });
      }
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      logger.error({ caller: 'Error saving loan:', payload: error });
      setApiError(error?.message || 'Something went wrong while saving the loan.');
    } finally {
      setLoading(false);
    }
  };

  const lockFields = ['CANCELLED', 'REJECTED', 'PENDING_APPROVAL'].includes(loan?.status?.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden overflow-y-auto flex flex-col gap-y-0 p-0 ">
        <DialogHeader className="sticky top-0 border-b px-6 py-4 bg-white">
          <DialogTitle>New Loan Request</DialogTitle>
          <DialogDescription>Fill in the details to create a new employee loan request.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="loanTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(val) => {
                            const selectedLoanType = loanTypes?.find(
                              (_loan) => _loan.id === Number(form.getValues('loanTypeId')),
                            );
                            form.setValue('loanTypeMaxTenure', selectedLoanType?.maxTenureMonths || 0);
                            form.setValue('interestRate', selectedLoanType?.interestRate || 0);
                            form.setValue('loanTypeId', val);
                          }}
                          value={Number(field.value)}
                          disabled={lockFields}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Please select loan type" />
                          </SelectTrigger>
                          <SelectContent>
                            {loanTypes?.length
                              ? loanTypes.map((_loanType) => (
                                  <SelectItem key={_loanType.id} value={Number(_loanType.id)}>
                                    {_loanType.name} - {_loanType.interestRate}%
                                  </SelectItem>
                                ))
                              : null}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="principalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" disabled={lockFields} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tenureMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="grid grid-flow-col leading-6 justify-between gap-x-4">
                        Tenure (Months)
                        {form.watch('loanTypeMaxTenure') ? (
                          <span className="italic font-normal text-slate-600">
                            Max Tenure: {form.watch('loanTypeMaxTenure')} months
                          </span>
                        ) : null}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={0} disabled={lockFields || !form.getValues('loanTypeId')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Needed</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={lockFields} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="employeeNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the loan purpose" disabled={lockFields} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-sm text-red-700 italic">
                By submitting this request, you confirm that you agree to the terms for requesting an employee loan. You
                understand that submission does not guarantee approval and that repayment will be made through payroll deductions.
              </p>

              <LoanBreakDown loan={form.watch()} />

              {!['PENDING_APPROVAL'].includes(loan?.status?.toUpperCase()) ? (
                <>
                  {loan && loan?.reviewerNote ? (
                    <div className="text-sm space-y-2 bg-slate-100 py-2 px-3 rounded-lg">
                      <p className="font-semibold">Reviewer Note:</p>
                      <p className="italic">{loan?.reviewerNote}</p>
                    </div>
                  ) : null}

                  {loan && loan?.approverNote ? (
                    <div className="text-sm space-y-2 bg-slate-100 py-2 px-3 rounded-lg">
                      <p className="font-semibold">Approver Note:</p>
                      <p className="italic">{loan?.approverNote}</p>
                    </div>
                  ) : null}
                </>
              ) : null}

              {apiError && <FormSubmitError>{apiError}</FormSubmitError>}
            </div>
            <DialogFooter className="sticky bottom-0 bg-white z-10 border-t p-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              {!['CANCELLED'].includes(loan?.status?.toUpperCase()) ? (
                <Button
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loan ? 'Edit loan' : 'Create Loan'}
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export const LoanBreakDown = ({ loan }) => {
  const [calculations, setCalculations] = useState({
    monthlyDeduction: loan?.monthlyDeduction || 0,
    totalRepayment: loan?.totalRepayment || 0,
    endDate: loan?.endDate ? new Date(loan.endDate) : null,
  });

  useEffect(() => {
    const { principalAmount, interestRate, tenureMonths, startDate } = loan;
    if (principalAmount > 0 && interestRate >= 0 && tenureMonths > 0) {
      const calculations = LoanUtil.calculations({ principalAmount, interestRate, tenureMonths, startDate });

      setCalculations(calculations);
    } else {
      setCalculations({ monthlyDeduction: 0, totalRepayment: 0, endDate: null });
    }
  }, [loan]);

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
      <h4 className="font-semibold text-sm">Loan Summary</h4>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Loan Amount:</span>{' '}
        <strong>₦{loan?.principalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Monthly Deduction:</span>{' '}
        <strong>₦{calculations.monthlyDeduction.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Total Repayment:</span>{' '}
        <strong>₦{calculations.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
      </div>
    </div>
  );
};
