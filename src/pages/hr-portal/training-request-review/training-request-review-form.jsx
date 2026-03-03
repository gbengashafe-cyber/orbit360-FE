import { trainingService } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getStatusColor } from '@/pages/authorization-center/authorization-center.util';
import { FieldDisplay } from '@/pages/authorization-center/request-details-view/shared/field-display';
import { logger } from '@/utils';
import { format } from 'date-fns';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';

const trainingRequestReviewSchema = z
  .object({
    reviewerDecision: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['APPROVE', 'REJECT'], 'Invalid decision was provided'),
    ),
    hrReviewerNote: z.string().max(300),
  })
  .refine(
    ({ reviewerDecision, hrReviewerNote }) => {
      return !(reviewerDecision.toUpperCase() === 'REJECT' && hrReviewerNote.length < 2);
    },
    { message: 'Note is required if recommendation is `Reject`', path: ['hrReviewerNote'] },
  );

export const TrainingRequestReviewForm = ({ showForm, setShowForm, onCancel, trainingRequest, onSubmit }) => {
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    reviewerDecision: trainingRequest?.reviewerDecision || '',
    hrReviewerNote: trainingRequest?.hrReviewerNote || '',
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    setSubmitError('');
    try {
      e.preventDefault();

      let validatedPayload;
      try {
        validatedPayload = trainingRequestReviewSchema.parse(formData);
      } catch (error) {
        setSubmitError(JSON.parse(error.message)[0].message);
        return;
      }

      const response = await trainingService.hrReview(trainingRequest.id, validatedPayload);

      toast.success('Success', { description: response.message ?? 'Request submitted successfully' });
      onSubmit();
      setShowForm(false);
    } catch (error) {
      logger.error({ caller: 'Error reviewing training requests', payload: error });
      setSubmitError(error.message || 'Unable to complete your request. Kindly contact the system admin');
    }
  };

  const isLockedForReview = !['PENDING_SUPERVISOR_APPROVAL', 'PENDING_HR_REVIEW'].includes(
    trainingRequest?.status?.toUpperCase(),
  );

  return (
    <Dialog open={showForm} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg max-h-[90%] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>{'Review Training Request'}</DialogTitle>
          <DialogDescription className="sr-only"></DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-10">
              <FieldDisplay
                label="Status"
                value={<Badge className={getStatusColor(trainingRequest.status?.toLowerCase())}>{trainingRequest.status}</Badge>}
              />
              <FieldDisplay
                label="Employee"
                value={`${trainingRequest?.employee.firstName} ${trainingRequest?.employee?.lastName}`}
              />
              <FieldDisplay label="Staff ID" value={trainingRequest?.employee?.staffId} />
              <FieldDisplay label="Type" value={trainingRequest?.trainingType} />
              <FieldDisplay label="Request Scope" value={trainingRequest?.requestScope} />
              <FieldDisplay label="Title" value={trainingRequest?.trainingTitle} />
              <FieldDisplay label="Priority" value={trainingRequest?.priority} />
              <FieldDisplay label="Estimated Cost" value={`#${trainingRequest?.estimatedCost?.toLocaleString()}`} />
              <FieldDisplay label="Delivery Method" value={trainingRequest?.deliveryMethod} />
              <FieldDisplay label="Training Provider" value={trainingRequest?.trainingProvider} />
              <FieldDisplay label="Preferred Timeframe" value={trainingRequest?.preferredTimeframe} />
              <FieldDisplay label="Date Initiated" value={format(trainingRequest?.createdAt, 'dd-MMM-yyyy hh:mm a')} />
              <FieldDisplay label="Skill To Gain" value={trainingRequest?.skillsToGain} />
              <FieldDisplay label="Description" value={trainingRequest?.trainingDescription} />
              <FieldDisplay label="Business Justification" value={trainingRequest?.businessJustification} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewerDecision">Recommendation</Label>
              <Select
                disabled={isLockedForReview}
                onValueChange={(val) => handleInputChange('reviewerDecision', val)}
                value={formData?.reviewerDecision?.toUpperCase()}
              >
                <SelectTrigger className="" id="reviewerDecision" name="reviewerDecision">
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent align="start" readOnly={isLockedForReview}>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {trainingRequest?.approverNote ? (
              <div className="text-sm space-y-2 bg-slate-100 py-2 px-3 rounded-lg">
                <p className="font-semibold">Approver Note:</p>
                <p className="italic">{trainingRequest?.approverNote}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="hrReviewerNote">Notes</Label>
              <Textarea
                id="hrReviewerNote"
                value={formData.hrReviewerNote}
                onChange={(e) => handleInputChange('hrReviewerNote', e.target.value)}
                readOnly={isLockedForReview}
              />
            </div>

            {submitError ? <div className="flex gap-3 py-2 px-3 rounded-lg text-red-800 bg-red-100">{submitError}</div> : null}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {!isLockedForReview ? (
                <Button type="submit">
                  <Save className="w-4 h-4 mr-1" /> Submit
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
