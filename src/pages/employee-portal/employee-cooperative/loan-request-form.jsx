import { loanService } from '@/api/loan.service';
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
      .pipe(z.coerce.number().positive('Amount must be greater than 0')),
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
          principalAmount: '',
          tenureMonths: '',
          startDate: new Date().toJSON().split('T')[0],
          employeeNote: '',
          loanTypeMaxTenure: 0,
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
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>New Loan Request</DialogTitle>
          <DialogDescription>Fill in the details to create a new employee loan request.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex justify-between py-1">
                        Loan Type{' '}
                        {form.getValues('loanTypeMaxTenure') ? (
                          <span className="italic font-normal">Max Tenure: {form.getValues('loanTypeMaxTenure')} months</span>
                        ) : null}
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          const selectedLoanType = loanTypes?.find((_loan) => _loan.id === Number(form.getValues('loanTypeId')));
                          form.setValue('loanTypeMaxTenure', selectedLoanType?.maxTenureMonths || 0);
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
                    <FormLabel>Tenure (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} disabled={lockFields} {...field} />
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
              By submitting this request, you confirm that you agree to the terms for requesting an employee loan. You understand
              that submission does not guarantee approval and that repayment will be made through payroll deductions.
            </p>

            {apiError && <FormSubmitError>{apiError}</FormSubmitError>}

            <DialogFooter>
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
