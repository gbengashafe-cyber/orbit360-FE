import { complaintService } from '@/api';
import { DatePicker } from '@/components/shared/date-picker';
import { FormSubmitErrorV1 } from '@/components/shared/submit-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ANONYMOUS_NOTICE, COMPLAINT_TYPES, COMPLAINT_URGENCY } from './complaint.constants';

const todayIsoDate = () => new Date().toISOString().split('T')[0];

// Mirrors the backend validation.
const complaintSchema = z.object({
  complaintType: z.string().min(1, 'Complaint type is required'),
  severity: z.string().min(1, 'Urgency level is required'),
  title: z.string().trim().min(3, 'Subject must be at least 3 characters').max(255, 'Subject must be at most 255 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  incidentDate: z
    .string()
    .optional()
    .refine((value) => !value || value <= todayIsoDate(), 'Incident date cannot be in the future'),
  witnesses: z.string().trim().max(1000, 'Witnesses must be at most 1000 characters').optional(),
  isAnonymous: z.boolean(),
});

const DEFAULT_VALUES = {
  complaintType: '',
  severity: 'medium',
  title: '',
  description: '',
  incidentDate: '',
  witnesses: '',
  isAnonymous: false,
};

export function ComplaintFormDialog({ open, onOpenChange, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  // Guards against double submission before the disabled state re-renders.
  const submittingRef = useRef(false);

  const form = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULT_VALUES);
      setApiError(null);
    }
  }, [open, form]);

  const isAnonymous = form.watch('isAnonymous');

  const onSubmit = async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setApiError(null);

    try {
      const response = await complaintService.createComplaint({
        ...values,
        incidentDate: values.incidentDate || null,
        witnesses: values.witnesses || null,
      });
      toast.success('Success', {
        description: response?.data?.reference
          ? `Complaint ${response.data.reference} submitted successfully`
          : (response?.message ?? 'Complaint submitted successfully'),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Keep the entered values so the employee can retry.
      logger.error({ caller: 'Submit complaint', payload: { message: error?.message } });
      setApiError(error?.message || 'Unable to submit your complaint. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !submitting && onOpenChange(value)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden overflow-y-auto flex flex-col gap-y-0 p-0">
        <DialogHeader className="sticky top-0 border-b px-6 py-4 bg-white z-10">
          <DialogTitle>Submit a Complaint</DialogTitle>
          <DialogDescription>Report a workplace issue, concern or incident to HR.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="complaintType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select complaint type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPLAINT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPLAINT_URGENCY.map((urgency) => (
                            <SelectItem key={urgency.value} value={urgency.value}>
                              {urgency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of the complaint" maxLength={255} disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Describe what happened, when and where"
                        disabled={submitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Date (Optional)</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          maxDate={todayIsoDate()}
                          placeholder="Select incident date"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="witnesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Witnesses (Optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Names of anyone who witnessed the incident" disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled={submitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Submit Anonymously</FormLabel>
                      <p className="text-sm text-gray-500">HR reviewers will not see your name.</p>
                    </div>
                  </FormItem>
                )}
              />

              {isAnonymous ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="w-4 h-4" />
                  <AlertDescription className="text-blue-700">{ANONYMOUS_NOTICE}</AlertDescription>
                </Alert>
              ) : null}

              {apiError ? <FormSubmitErrorV1>{apiError}</FormSubmitErrorV1> : null}
            </div>

            <DialogFooter className="sticky bottom-0 bg-white z-10 border-t p-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Complaint
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
