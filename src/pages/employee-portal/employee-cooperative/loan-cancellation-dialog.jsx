import { loanService } from '@/api/loan.service';
import { FormSubmitError } from '@/components/shared/submit-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logger } from '@/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoanRequestCancellationDialog({ open, onOpenChange, onSuccess, loan }) {
  const [apiError, setApiError] = useState(null);

  const [isCancelling, setIsCancelling] = useState(false);

  const cancelLoanRequest = async (loanId) => {
    setIsCancelling(true);
    try {
      const response = await loanService.cancelLoanRequest(loanId);
      toast.success('Success', { description: response?.message ?? 'Loan request updated successfully' });
      onSuccess();
    } catch (error) {
      logger.error({ caller: 'Cancel loan', payload: error });
      setApiError(error?.message ?? 'Unable to cancel loan');
      toast.error('Error', { description: error.message ?? 'Unable to cancel loan' });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Cancellation</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        You are about to cancel this loan request. This action cannot be undone. If you still need the loan, you will have to
        submit a new request. Do you wish to continue?
        {apiError ? <FormSubmitError>{apiError}</FormSubmitError> : null}
        <DialogFooter>
          <Button variant="outline" disabled={isCancelling} onClick={onOpenChange}>
            Close
          </Button>
          <Button variant="destructive" disabled={isCancelling} onClick={() => cancelLoanRequest(loan.id)}>
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
