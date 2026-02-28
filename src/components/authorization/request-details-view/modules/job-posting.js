export const jobPostingSchema = {
  module: 'job-posting',
  sections: [
    {
      title: 'Job Posting Details',
      fields: [
        { label: 'Department', path: 'department', type: 'string' },
        { label: 'Employment Type', path: 'employment_type', type: 'string' },
        { label: 'Title', path: 'title', type: 'string' },
        { label: 'Location', path: 'location', type: 'string' },
        { label: 'Min Salary', path: 'salary_range_min', type: 'currency' },
        { label: 'Max Salary', path: 'salary_range_max', type: 'currency' },
        { label: 'Posted Date', path: 'posted_date', type: 'date' },
        { label: 'Status', path: 'status', type: 'badge' },
        { label: 'Description', path: 'description', type: 'string' },
        { label: 'Requirements', path: 'requirements', type: 'string' },
      ],
    },
  ],
};
