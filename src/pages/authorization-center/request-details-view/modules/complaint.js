import { complaintTypeLabel, statusLabel, submitterName, urgencyOption } from '@/pages/complaints/complaint.constants';

const personName = (person) => (person ? `${person.firstName} ${person.lastName}` : '—');

// Rows come from the backend reviewer serializer: anonymous complaints have no submitter details.
export const complaintSchema = {
  module: 'complaints',
  sections: [
    {
      title: 'Complaint Details',
      fields: [
        { label: 'Complaint ID', path: 'reference', type: 'string' },
        { label: 'Status', path: 'status', type: 'string', formatter: (value) => statusLabel(value) },
        { label: 'Complaint Type', path: 'complaintType', type: 'string', formatter: (value) => complaintTypeLabel(value) },
        { label: 'Urgency', path: 'severity', type: 'string', formatter: (value) => urgencyOption(value)?.label ?? value },
        { label: 'Subject', path: 'title', type: 'string', fullWidth: true },
        { label: 'Detailed Description', path: 'description', type: 'string', fullWidth: true },
        { label: 'Incident Date', path: 'incidentDate', type: 'date' },
        { label: 'Date Submitted', path: 'submittedAt', type: 'date' },
        { label: 'Witnesses', path: 'witnesses', type: 'string', formatter: (value) => value || '—', fullWidth: true },
      ],
    },
    {
      title: 'Submitted By',
      fields: [
        { label: 'Employee', path: 'submittedBy', type: 'string', formatter: (_value, item) => submitterName(item) },
        { label: 'Staff ID', path: 'submittedBy.staffId', type: 'string', formatter: (value) => value ?? '—' },
        { label: 'Department', path: 'submittedBy.department', type: 'string', formatter: (value) => value ?? '—' },
      ],
    },
    {
      title: 'HR Officer Review',
      fields: [
        { label: 'Reviewed By', path: 'reviewer', type: 'string', formatter: personName },
        { label: 'Review Date', path: 'reviewedDate', type: 'timestamp' },
        { label: "HR Officer's Note", path: 'reviewerNote', type: 'string', formatter: (value) => value || '—', fullWidth: true },
      ],
    },
  ],
};
