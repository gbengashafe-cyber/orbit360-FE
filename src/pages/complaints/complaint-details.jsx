import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getStatusColor } from '@/pages/authorization-center/authorization-center.util';
import { FieldDisplay } from '@/pages/authorization-center/request-details-view/shared/field-display';
import { format } from 'date-fns';
import {
  complaintTypeLabel,
  EMPLOYEE_STATUS_LABELS,
  HR_STATUS_LABELS,
  statusLabel,
  submitterName,
  urgencyOption,
} from './complaint.constants';

const formatDate = (value, pattern = 'dd-MMM-yyyy') => (value ? format(new Date(value), pattern) : '—');
const personName = (person) => (person ? `${person.firstName} ${person.lastName}` : '—');

export function ComplaintStatusBadge({ status, audience = 'hr' }) {
  return (
    <Badge className={getStatusColor(status?.toLowerCase())}>
      {statusLabel(status, audience === 'employee' ? EMPLOYEE_STATUS_LABELS : HR_STATUS_LABELS)}
    </Badge>
  );
}

export function UrgencyBadge({ value }) {
  const option = urgencyOption(value);
  return <Badge className={option?.className ?? 'bg-gray-100 text-gray-700'}>{option?.label ?? value ?? '—'}</Badge>;
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">{children}</div>
    </div>
  );
}

/**
 * Read-only complaint details.
 * audience="employee": the submitter's view (outcomes and rejection reasons only).
 * audience="hr": reviewer view (submitter, unless anonymous, plus approval history).
 */
export function ComplaintDetails({ complaint, audience = 'hr' }) {
  if (!complaint) return null;

  const isHr = audience === 'hr';
  const rejectionReason =
    complaint.status === 'REJECTED_BY_REVIEWER'
      ? complaint.reviewerNote
      : complaint.status === 'REJECTED_BY_APPROVER'
        ? complaint.approverNote
        : null;

  return (
    <div className="space-y-6">
      <Section title="Complaint">
        <FieldDisplay label="Complaint ID" value={complaint.reference ?? '—'} />
        <FieldDisplay label="Status" value={<ComplaintStatusBadge status={complaint.status} audience={audience} />} />
        <FieldDisplay label="Complaint Type" value={complaintTypeLabel(complaint.complaintType)} />
        <FieldDisplay label="Urgency" value={<UrgencyBadge value={complaint.severity} />} />
        <FieldDisplay label="Subject" value={complaint.title} fullWidth />
        <FieldDisplay
          label="Detailed Description"
          value={<p className="whitespace-pre-wrap break-words">{complaint.description}</p>}
          fullWidth
        />
        <FieldDisplay label="Incident Date" value={formatDate(complaint.incidentDate)} />
        <FieldDisplay label="Date Submitted" value={formatDate(complaint.submittedAt)} />
        <FieldDisplay
          label="Witnesses"
          value={<p className="whitespace-pre-wrap break-words">{complaint.witnesses || '—'}</p>}
          fullWidth
        />
      </Section>

      {isHr ? (
        <Section title="Submitted By">
          <FieldDisplay label="Employee" value={submitterName(complaint)} />
          {complaint.submittedBy ? (
            <>
              <FieldDisplay label="Staff ID" value={complaint.submittedBy.staffId ?? '—'} />
              <FieldDisplay label="Department" value={complaint.submittedBy.department ?? '—'} />
            </>
          ) : (
            <FieldDisplay label="Note" value="The employee chose to submit this complaint anonymously." />
          )}
        </Section>
      ) : (
        <Section title="Submission">
          <FieldDisplay label="Submitted Anonymously" value={complaint.isAnonymous ? 'Yes' : 'No'} />
        </Section>
      )}

      {isHr ? (
        <Section title="Approval History">
          <FieldDisplay label="HR Officer" value={personName(complaint.reviewer)} />
          <FieldDisplay label="HR Officer Decision Date" value={formatDate(complaint.reviewedDate, 'dd-MMM-yyyy HH:mm')} />
          <FieldDisplay label="HR Officer Note" value={complaint.reviewerNote || '—'} fullWidth />
          <FieldDisplay label="HR Manager" value={personName(complaint.approver)} />
          <FieldDisplay label="HR Manager Decision Date" value={formatDate(complaint.approvedDate, 'dd-MMM-yyyy HH:mm')} />
          <FieldDisplay label="HR Manager Note" value={complaint.approverNote || '—'} fullWidth />
        </Section>
      ) : rejectionReason ? (
        <Section title="Decision">
          <FieldDisplay label="Reason for Rejection" value={rejectionReason} fullWidth />
        </Section>
      ) : null}
    </div>
  );
}
