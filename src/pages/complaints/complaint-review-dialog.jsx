import { complaintService } from '@/api';
import { FormSubmitErrorV1 } from '@/components/shared/submit-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/utils';
import { Info, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ComplaintDetails } from './complaint-details';

/**
 * HR view of a single complaint.
 * HR Officers (MANAGE_COMPLAINTS) make the first-stage decision here.
 * HR Managers authorize in the Authorization Center; here they see the record and its history.
 */
export function ComplaintReviewDialog({ complaint, open, onOpenChange, canReview, canAuthorize, onReviewed }) {
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setDecision('');
      setNote('');
      setError(null);
    }
  }, [open, complaint?.id]);

  const awaitingReview = complaint?.status === 'PENDING_REVIEW';
  const awaitingAuthorization = complaint?.status === 'PENDING_APPROVAL';
  const isOwn = !!complaint?.isOwnComplaint;
  const showReviewForm = canReview && awaitingReview && !isOwn;

  const handleSubmit = async () => {
    if (submittingRef.current) return;

    if (!decision) {
      setError('Select a decision.');
      return;
    }
    if (decision === 'REJECT' && !note.trim()) {
      setError('A reason is required when rejecting.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const response = await complaintService.reviewComplaint(complaint.id, { decision, note: note.trim() });
      toast.success('Success', { description: response?.message ?? 'Complaint reviewed successfully' });
      onOpenChange(false);
      onReviewed?.();
    } catch (err) {
      logger.error({ caller: 'Review complaint', payload: { id: complaint?.id, message: err?.message } });
      setError(err?.message || 'Unable to review this complaint. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !submitting && onOpenChange(value)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-y-0 p-0">
        <DialogHeader className="sticky top-0 p-6 border-b bg-white">
          <DialogTitle className="text-xl font-bold">Complaint {complaint?.reference}</DialogTitle>
          <DialogDescription>
            {showReviewForm ? 'Review the complaint and record your decision.' : 'Complaint details and approval history.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <ComplaintDetails complaint={complaint} audience="hr" />

          {showReviewForm ? (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="complaint-decision">Decision</Label>
                <Select value={decision} onValueChange={setDecision} disabled={submitting}>
                  <SelectTrigger id="complaint-decision">
                    <SelectValue placeholder="Select a decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">Approve: send to HR Manager</SelectItem>
                    <SelectItem value="REJECT">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complaint-note">{decision === 'REJECT' ? 'Reason for rejection' : 'Note (Optional)'}</Label>
                <Textarea
                  id="complaint-note"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={submitting}
                  placeholder={decision === 'REJECT' ? 'This reason will be visible to the employee' : ''}
                />
              </div>
            </div>
          ) : null}

          {isOwn ? (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-blue-700">
                You submitted this complaint, so you can&apos;t review or authorize it. Another HR Officer or HR Manager must
                act on it.
              </AlertDescription>
            </Alert>
          ) : null}

          {canAuthorize && awaitingAuthorization && !isOwn ? (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-blue-700">
                This complaint is awaiting your authorization. Approve or reject it from the Authorization Center.
              </AlertDescription>
            </Alert>
          ) : null}

          {error ? <FormSubmitErrorV1>{error}</FormSubmitErrorV1> : null}
        </div>

        <DialogFooter className="sticky bottom-0 bg-white z-10 border-t p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Close
          </Button>
          {showReviewForm ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !decision}
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Decision
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
