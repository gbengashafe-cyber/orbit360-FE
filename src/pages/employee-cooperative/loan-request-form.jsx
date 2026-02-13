import { loanService } from '@/api/loan.service';
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

const loanSchema = z.object({
  loanTypeId: z.coerce.number('Select loan Type').min(1, 'Loan type is required'),
  principalAmount: z.string().min(1, 'Amount is required').pipe(z.coerce.number().positive('Amount must be greater than 0')),
  tenureMonths: z
    .string()
    .min(1, 'Loan tenure is required')
    .pipe(z.coerce.number().int('Tenure must be a whole number').positive('Tenure must be greater than 0')),
  startDate: z.string().min(1, 'Please select the required date'),
  employeeNote: z.string().optional(),
});

export default function EmployeeLoanForm({ open, onOpenChange, onSuccess, loanTypes }) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const form = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loanTypeId: '',
      principalAmount: '',
      tenureMonths: '',
      startDate: '',
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

      const response = await loanService.createLoanRequest(values);

      toast.success('Success', { description: response?.message ?? 'Loan request initiated successfully' });
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
                    <FormLabel>Loan Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          const selectedLoanType = loanTypes.find((_loan) => _loan.id === Number(form.getValues('loanTypeId')));
                          form.setValue('loanTypeMaxTenure', selectedLoanType?.maxTenureMonths || 0);
                          form.setValue('loanTypeId', val);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Please select loan type" />
                        </SelectTrigger>
                        <SelectContent>
                          {loanTypes?.length
                            ? loanTypes.map((_loanType) => (
                                <SelectItem key={_loanType.id} value={String(_loanType.id)}>
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
                      <Input type="number" min={0} step="0.01" {...field} />
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
                      <Input type="number" min={0} {...field} />
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
                      <Input type="date" {...field} />
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
                    <Textarea placeholder="Brief description of the loan purpose" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {apiError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{apiError}</div>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="rounded-2xl">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Loan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
