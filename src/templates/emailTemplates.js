/**
 * Email Templates for Orbit360
 * Centralized email template definitions
 */

export const leaveRequestEmailTemplates = {
  /**
   * Email to Supervisor - Leave Request for Approval
   * @param {Object} params - Template parameters
   * @returns {string} HTML email body
   */
  supervisorApprovalRequest: ({
    supervisorName,
    employeeName,
    employeeId,
    department,
    leaveType,
    startDate,
    endDate,
    daysRequested,
    reason,
    approvalLink
  }) => `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Leave Request Pending Your Approval</h1>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <p>Dear ${supervisorName},</p>
        
        <p>A leave request has been submitted by <strong>${employeeName}</strong> and is awaiting your approval.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0; border-radius: 4px;">
          <p style="margin-top: 0;"><strong>Leave Request Details</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Employee Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${employeeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Employee ID:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${employeeId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Department:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="background-color: #e3f2fd; padding: 4px 8px; border-radius: 4px;">${leaveType}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Start Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>End Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Duration:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${daysRequested} day(s)</strong></td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Reason for Leave:</strong></p>
          <p style="margin: 8px 0 0 0; color: #333;">${reason || 'No reason provided'}</p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <p style="margin-bottom: 15px; color: #666;">Please review the request and take action below:</p>
          <a href="${approvalLink}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 16px;">
            Review & Approve/Reject
          </a>
        </div>

        <div style="background-color: #f0f7ff; padding: 12px; border-radius: 4px; margin-top: 20px; border-left: 4px solid #0066cc;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            <strong>Note:</strong> If you cannot view the button above, please copy and paste this link in your browser:<br/>
            <code style="background-color: #e8f4f8; padding: 4px 8px; border-radius: 3px; word-break: break-all;">${approvalLink}</code>
          </p>
        </div>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-top: 1px solid #ddd; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; font-size: 12px; color: #666;">
          This is an automated message from Orbit360 Leave Management System.<br/>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `,

  /**
   * Email to HR - Leave Request Notification (informational only)
   * @param {Object} params - Template parameters
   * @returns {string} HTML email body
   */
  hrNotification: ({
    employeeName,
    employeeId,
    department,
    leaveType,
    startDate,
    endDate,
    daysRequested,
    supervisorName
  }) => `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Leave Request Notification</h1>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <p>A new leave request has been submitted and is pending supervisor approval.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0; border-radius: 4px;">
          <p style="margin-top: 0;"><strong>Leave Request Details</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Employee:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${employeeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Employee ID:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${employeeId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Department:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="background-color: #e3f2fd; padding: 4px 8px; border-radius: 4px;">${leaveType}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Period:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startDate} to ${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Duration:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${daysRequested} day(s)</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Designated Approver:</strong></td>
              <td style="padding: 8px;">${supervisorName}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e8f5e9; padding: 12px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #4caf50;">
          <p style="margin: 0; font-size: 14px; color: #2e7d32;">
            <strong>Status:</strong> Pending supervisor approval. No action is required from HR at this time.
          </p>
        </div>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-top: 1px solid #ddd; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; font-size: 12px; color: #666;">
          This is an automated notification from Orbit360 Leave Management System.<br/>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `,

  /**
   * Email to Employee - Leave Request Submitted Confirmation
   * @param {Object} params - Template parameters
   * @returns {string} HTML email body
   */
  employeeConfirmation: ({
    employeeName,
    leaveType,
    startDate,
    endDate,
    daysRequested,
    supervisorName
  }) => `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Leave Request Submitted</h1>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <p>Dear ${employeeName},</p>
        
        <p>Your leave request has been successfully submitted and is now pending approval.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; border-radius: 4px;">
          <p style="margin-top: 0;"><strong>Your Leave Details</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="background-color: #e3f2fd; padding: 4px 8px; border-radius: 4px;">${leaveType}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Start Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>End Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Days:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${daysRequested} day(s)</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Pending Approval From:</strong></td>
              <td style="padding: 8px;">${supervisorName}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e3f2fd; padding: 12px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #2196f3;">
          <p style="margin: 0; font-size: 14px; color: #1565c0;">
            <strong>What's Next?</strong> Your supervisor will review your request and notify you of the approval status within 2 business days.
          </p>
        </div>

        <p style="color: #666; font-size: 14px;">
          You can track the status of your leave request by logging into the Orbit360 portal.
        </p>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-top: 1px solid #ddd; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; font-size: 12px; color: #666;">
          This is an automated message from Orbit360 Leave Management System.<br/>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `
};
