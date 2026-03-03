export const trainingRequestSchema = {
  module: 'training-requests',
  sections: [
    {
      title: 'Employee',
      fields: [
        { label: 'Staff ID', path: 'employee.staffId', type: 'string' },
        { label: 'First Name', path: 'employee.firstName', type: 'string' },
        { label: 'Last Name', path: 'employee.lastName', type: 'string' },
      ],
    },
    {
      title: 'Training Request',
      fields: [
        { label: 'Status', path: 'status', type: 'badge' },
        { label: 'Type', path: 'trainingType', type: 'string' },
        { label: 'Title', path: 'trainingTitle', type: 'string' },
        { label: 'Priority', path: 'priority', type: 'string' },
        { label: 'Request Scope', path: 'requestScope', type: 'string' },
        { label: 'Number of Team Members', path: 'numberOfTeamMembers', type: 'string' },
        { label: 'Skills to Gain', path: 'skillsToGain', type: 'string' },
        { label: 'Delivery Method', path: 'deliveryMethod', type: 'string' },
        { label: 'Preferred Timeframe', path: 'preferredTimeframe', type: 'string' },
        { label: 'Business Justification', path: 'businessJustification', type: 'string' },
        { label: 'Estimated Cost', path: 'estimatedCost', type: 'currency' },
        { label: 'Training Provider', path: 'trainingProvider', type: 'string' },
      ],
    },
    {
      title: 'Supervisor Approver',
      fields: [
        {
          label: 'Name',
          path: 'supervisorApprover',
          formatter: (val) => `${val?.firstName || ''} ${val?.lastName || ''}`.trim(),
          type: 'string',
        },
        { label: 'Timestamp', path: 'supervisorApprovedAt', type: 'timestamp' },
        { label: 'Note', path: 'supervisorNote', type: 'string' },
      ],
    },
    {
      title: 'HR Reviewer',
      fields: [
        {
          label: 'Name',
          path: 'hrReviewer',
          formatter: (val) => `${val?.firstName || ''} ${val?.lastName || ''}`.trim(),
          type: 'string',
        },
        { label: 'Timestamp', path: 'hrReviewedAt', type: 'timestamp' },
        { label: 'Note', path: 'hrReviewerNote', type: 'string' },
      ],
    },
    {
      title: 'HR Approver',
      fields: [
        {
          label: 'Name',
          path: 'hrApprover',
          formatter: (val) => `${val?.firstName || ''} ${val?.lastName || ''}`.trim(),
          type: 'string',
        },
        { label: 'Timestamp', path: 'finalApprovedAt', type: 'timestamp' },
        { label: 'Note', path: 'finalNote', type: 'string' },
      ],
    },
  ],
};
