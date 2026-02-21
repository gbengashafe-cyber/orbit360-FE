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
          <DialogTitle>Cancel Loan Request</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        Confirm you want to cancel this loan request.
        {apiError ? <FormSubmitError>{apiError}</FormSubmitError> : null}
        <DialogFooter>
          <Button variant="outline" disabled={isCancelling} onClick={onOpenChange}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isCancelling} onClick={() => cancelLoanRequest(loan.id)}>
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
