import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getStatusColor } from '@/pages/authorization-center/authorization-center.util';
import { format } from 'date-fns';
import { LoanUtil } from '../cooperative/loan.utils';

const FieldDisplay = ({ label, value, fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
    <div className="text-sm text-gray-900">{value || 'N/A'}</div>
  </div>
);

export default function RequestDetailsView({ item, moduleName }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'PPP');
    } catch {
      return date;
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'PPP p');
    } catch {
      return date;
    }
  };

  const renderJobPosting = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Job Title" value={item.title} />
        <FieldDisplay label="Department" value={item.department} />
        <FieldDisplay label="Employment Type" value={item.employment_type?.replace('_', ' ')} />
        <FieldDisplay label="Location" value={item.location} />
        <FieldDisplay
          label="Salary Range"
          value={
            item.salary_range_min && item.salary_range_max
              ? `₦${item.salary_range_min?.toLocaleString()} - ₦${item.salary_range_max?.toLocaleString()}`
              : 'N/A'
          }
        />
        <FieldDisplay label="Application Deadline" value={formatDate(item.application_deadline)} />
        <FieldDisplay label="Hiring Manager" value={item.hiring_manager} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
      </div>
      <Separator />
      <FieldDisplay label="Description" value={item.description} fullWidth />
      <FieldDisplay label="Requirements" value={item.requirements} fullWidth />
      <FieldDisplay label="Responsibilities" value={item.responsibilities} fullWidth />
    </div>
  );

  const renderLeaveRequest = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Employee Name" value={item.employee_name} />
        <FieldDisplay label="Employee Email" value={item.employee_email} />
        <FieldDisplay label="Department" value={item.employee_department} />
        <FieldDisplay label="Leave Type" value={item.leave_type?.replace('_', ' ')} />
        <FieldDisplay label="Start Date" value={formatDate(item.start_date)} />
        <FieldDisplay label="End Date" value={formatDate(item.end_date)} />
        <FieldDisplay label="Number of Days" value={item.number_of_days} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
      </div>
      <Separator />
      <FieldDisplay label="Reason" value={item.reason} fullWidth />
      {item.relief_officer_name && <FieldDisplay label="Relief Officer" value={item.relief_officer_name} fullWidth />}
      {item.hr_comments && <FieldDisplay label="HR Comments" value={item.hr_comments} fullWidth />}
    </div>
  );

  const renderLoan = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Employee Name" value={`${item?.employee?.firstName} ${item?.employee?.lastName}`} />
        <FieldDisplay label="Employee Email" value={item.employee?.email} />
        <FieldDisplay label="Loan Amount" value={`₦${item.principalAmount?.toLocaleString()}`} />
        <FieldDisplay label="Interest Rate" value={`${item.interestRate}%`} />
        <FieldDisplay label="Tenure (Months)" value={item.tenureMonths} />
        <FieldDisplay label="Monthly Repayment" value={`₦${LoanUtil.calculations(item).monthlyDeduction?.toLocaleString()}`} />
        <FieldDisplay label="Total Repayment" value={`₦${LoanUtil.calculations(item).totalRepayment?.toLocaleString()}`} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
        <FieldDisplay label="Start Date" value={formatDate(item.startDate)} />
      </div>
      <Separator />
      <FieldDisplay label="Type" value={item.loanType} fullWidth />
    </div>
  );

  const renderResignation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Employee Name" value={item.employee_name} />
        <FieldDisplay label="Employee Email" value={item.employee_email} />
        <FieldDisplay label="Department" value={item.employee_department} />
        <FieldDisplay label="Position" value={item.employee_position} />
        <FieldDisplay label="Resignation Date" value={formatDate(item.resignation_date)} />
        <FieldDisplay label="Last Working Day" value={formatDate(item.last_working_day)} />
        <FieldDisplay label="Notice Period (Days)" value={item.notice_period_days} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
      </div>
      <Separator />
      <FieldDisplay label="Reason for Leaving" value={item.reason} fullWidth />
      {item.hr_comments && <FieldDisplay label="HR Comments" value={item.hr_comments} fullWidth />}
    </div>
  );

  const renderRedeployment = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Employee Name" value={item.employee_name} />
        <FieldDisplay label="Employee Email" value={item.employee_email} />
        <FieldDisplay label="Current Department" value={item.current_department} />
        <FieldDisplay label="Current Position" value={item.current_position} />
        <FieldDisplay label="New Department" value={item.new_department} />
        <FieldDisplay label="New Position" value={item.new_position} />
        <FieldDisplay label="Effective Date" value={formatDate(item.effective_date)} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
      </div>
      <Separator />
      <FieldDisplay label="Reason" value={item.reason} fullWidth />
      {item.hr_comments && <FieldDisplay label="HR Comments" value={item.hr_comments} fullWidth />}
    </div>
  );

  const renderNewStaffRequest = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Position" value={item.position} />
        <FieldDisplay label="Department" value={item.department} />
        <FieldDisplay label="Employment Type" value={item.employment_type} />
        <FieldDisplay label="Number of Positions" value={item.number_of_positions} />
        <FieldDisplay
          label="Proposed Salary Range"
          value={
            item.proposed_salary_min && item.proposed_salary_max
              ? `₦${item.proposed_salary_min?.toLocaleString()} - ₦${item.proposed_salary_max?.toLocaleString()}`
              : 'N/A'
          }
        />
        <FieldDisplay label="Required Start Date" value={formatDate(item.required_start_date)} />
        <FieldDisplay label="Requested By" value={item.requested_by} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
      </div>
      <Separator />
      <FieldDisplay label="Justification" value={item.justification} fullWidth />
      <FieldDisplay label="Key Responsibilities" value={item.key_responsibilities} fullWidth />
      <FieldDisplay label="Required Qualifications" value={item.required_qualifications} fullWidth />
      {item.hr_comments && <FieldDisplay label="HR Comments" value={item.hr_comments} fullWidth />}
    </div>
  );

  const renderTrainingRequest = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Employee Name" value={item.employee_name} />
        <FieldDisplay label="Employee Email" value={item.employee_email} />
        <FieldDisplay label="Department" value={item.employee_department} />
        <FieldDisplay label="Training Title" value={item.training_title} />
        <FieldDisplay label="Training Provider" value={item.training_provider} />
        <FieldDisplay label="Training Type" value={item.training_type?.replace('_', ' ')} />
        <FieldDisplay label="Start Date" value={formatDate(item.start_date)} />
        <FieldDisplay label="End Date" value={formatDate(item.end_date)} />
        <FieldDisplay label="Duration" value={item.duration} />
        <FieldDisplay label="Estimated Cost" value={`₦${item.estimated_cost?.toLocaleString()}`} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
      </div>
      <Separator />
      <FieldDisplay label="Objectives" value={item.objectives} fullWidth />
      <FieldDisplay label="Expected Benefits" value={item.expected_benefits} fullWidth />
      {item.hr_comments && <FieldDisplay label="HR Comments" value={item.hr_comments} fullWidth />}
    </div>
  );

  const renderStaffComplaint = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Employee Name" value={item.employee_name} />
        <FieldDisplay label="Employee Email" value={item.employee_email} />
        <FieldDisplay label="Department" value={item.employee_department} />
        <FieldDisplay label="Complaint Type" value={item.complaint_type?.replace('_', ' ')} />
        <FieldDisplay label="Subject" value={item.subject} />
        <FieldDisplay label="Incident Date" value={formatDate(item.incident_date)} />
        <FieldDisplay label="Urgency Level" value={item.urgency_level} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
        {item.witnesses && <FieldDisplay label="Witnesses" value={item.witnesses} fullWidth />}
      </div>
      <Separator />
      <FieldDisplay label="Description" value={item.description} fullWidth />
      {item.hr_comments && <FieldDisplay label="HR Comments" value={item.hr_comments} fullWidth />}
      {item.hr_action_taken && <FieldDisplay label="HR Action Taken" value={item.hr_action_taken} fullWidth />}
    </div>
  );

  const renderDisciplinaryCase = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Case Number" value={item.case_number} />
        <FieldDisplay label="Employee Names" value={item.employee_names} />
        <FieldDisplay label="Departments" value={item.employee_departments} />
        <FieldDisplay label="Offense Type" value={item.offense_type?.replace('_', ' ')} />
        <FieldDisplay label="Incident Date" value={formatDate(item.incident_date)} />
        <FieldDisplay label="Reported By" value={item.reported_by} />
        <FieldDisplay label="Investigating Officers" value={item.investigating_officers} />
        <FieldDisplay label="Disciplinary Committee" value={item.disciplinary_committee} />
        <FieldDisplay label="Witnesses" value={item.witnesses} />
        <FieldDisplay label="Hearing Date" value={formatDate(item.hearing_date)} />
        <FieldDisplay label="Verdict" value={<Badge className={getStatusColor(item.verdict)}>{item.verdict}</Badge>} />
        <FieldDisplay label="Penalty" value={item.penalty?.replace('_', ' ')} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
      </div>
      <Separator />
      <FieldDisplay label="Offense Description" value={item.offense_description} fullWidth />
      {item.investigation_notes && <FieldDisplay label="Investigation Notes" value={item.investigation_notes} fullWidth />}
      {item.hearing_notes && <FieldDisplay label="Hearing Notes" value={item.hearing_notes} fullWidth />}
      {item.penalty_details && <FieldDisplay label="Penalty Details" value={item.penalty_details} fullWidth />}
      {item.final_resolution && <FieldDisplay label="Final Resolution" value={item.final_resolution} fullWidth />}
    </div>
  );

  const renderAppraisal = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FieldDisplay label="Employee Name" value={item.employee_name} />
        <FieldDisplay label="Employee Email" value={item.employee_email} />
        <FieldDisplay label="Appraisal Cycle" value={item.cycle_name} />
        <FieldDisplay label="Job Role" value={item.job_role} />
        <FieldDisplay label="Department" value={item.department} />
        <FieldDisplay label="Supervisor" value={item.supervisor_name} />
        <FieldDisplay label="Total Score" value={item.total_score} />
        <FieldDisplay label="Status" value={<Badge className={getStatusColor(item.status)}>{item.status}</Badge>} />
        <FieldDisplay label="Submission Date" value={formatDateTime(item.submission_date)} />
        {item.supervisor_approval_date && (
          <FieldDisplay label="Supervisor Approval" value={formatDateTime(item.supervisor_approval_date)} />
        )}
        {item.hr_approval_date && <FieldDisplay label="HR Approval" value={formatDateTime(item.hr_approval_date)} />}
      </div>
      <Separator />
      {item.employee_overall_comments && (
        <FieldDisplay label="Employee Comments" value={item.employee_overall_comments} fullWidth />
      )}
      {item.supervisor_overall_comments && (
        <FieldDisplay label="Supervisor Comments" value={item.supervisor_overall_comments} fullWidth />
      )}
      {item.hr_overall_comments && <FieldDisplay label="HR Comments" value={item.hr_overall_comments} fullWidth />}
    </div>
  );

  return (
    <div className="max-h-[70vh] overflow-y-auto px-1">
      {item.type === 'Job Posting' && renderJobPosting()}
      {item.type === 'Leave Request' && renderLeaveRequest()}
      {moduleName === 'loans' && renderLoan()}
      {item.type === 'Resignation' && renderResignation()}
      {item.type === 'Redeployment' && renderRedeployment()}
      {item.type === 'New Staff Request' && renderNewStaffRequest()}
      {item.type === 'Training Request' && renderTrainingRequest()}
      {item.type === 'Staff Complaint' && renderStaffComplaint()}
      {item.type === 'Disciplinary Case' && renderDisciplinaryCase()}
      {item.type === 'Appraisal' && renderAppraisal()}
    </div>
  );
}
