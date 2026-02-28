import { departmentService, leaveService } from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useNotification } from '@/context/NotificationContext';
import { getStatusColor } from '@/pages/authorization-center-new/authorization-center.util';
import { logger } from '@/utils';
import { calculateBusinessDays, formatLeaveType, getLeaveTypeDisplay } from '@/utils/leaveCalculator';
import { showToast } from '@/utils/toast';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  Paperclip,
  Plus,
  Upload,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

const FileUploader = ({ files, setFiles, title, description, id }) => {
  const handleFileChange = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{title}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
        <Input id={id} type="file" multiple onChange={handleFileChange} className="text-sm" />
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      {files.length > 0 && (
        <div className="space-y-2 pt-2">
          {files.map((file) => (
            <div key={file.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 overflow-hidden">
                <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file.name)}
                className="text-red-500 hover:text-red-700 h-6 w-6"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

FileUploader.propTypes = {
  files: PropTypes.array.isRequired,
  setFiles: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  id: PropTypes.string.isRequired,
};

export default function LeaveManagement({ employee, onUpdate, preLoadedLeaves, leaveBalance: preLoadedBalance }) {
  const notificationContext = useNotification();
  const { addNotification } = notificationContext;
  console.log('📝 LeaveManagement - Notification context:', notificationContext);
  const [leaveRequests, setLeaveRequests] = useState(preLoadedLeaves || []);
  const [employees, setEmployees] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(preLoadedBalance || 0);
  const [leaveBalanceByType, setLeaveBalanceByType] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(!preLoadedLeaves);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState(null);

  const [handoverFiles, setHandoverFiles] = useState([]);
  const [supportingFiles, setSupportingFiles] = useState([]);

  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    leave_period: 'full_day',
    reason: '',
    emergency_contact: employee?.phone || '',
    alternative_email: '',
    handover_notes: '',
    covering_employee_id: '',
    selected_supervisor_id: '',
    supervisor_department: '',
  });

  const [formError, setFormError] = useState('');

  // Log form data changes
  React.useEffect(() => {
    console.log('📋 Leave Form Data:', {
      formData,
      supportingFiles: supportingFiles.map((f) => ({ name: f.name, size: f.size })),
      handoverFiles: handoverFiles.map((f) => ({ name: f.name, size: f.size })),
      supportingFilesCount: supportingFiles.length,
      handoverFilesCount: handoverFiles.length,
    });
  }, [formData, supportingFiles, handoverFiles]);

  // FIXED: Calculate leave balance using business days (excluding weekends)
  const calculateLeaveBalance = React.useCallback(
    (requests) => {
      const approvedAnnualLeave = requests
        .filter((r) => r.status === 'approved' && (r.type === 'vacation' || r.type === 'annual'))
        .reduce((acc, curr) => {
          const days = calculateBusinessDays(curr.startDate || curr.start_date, curr.endDate || curr.end_date, curr.leave_period);
          return acc + days;
        }, 0);
      const entitlement = employee?.leaveEntitlement || 0;
      const remaining = entitlement - approvedAnnualLeave;
      setLeaveBalance(Math.max(0, remaining));
    },
    [employee?.leaveEntitlement],
  );

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Use department-specific endpoint to get employees
      const deptId = employee?.departmentId;
      const promisesToAwait = [
        leaveService.getLeaves(1, 100),
        employee?.id ? leaveService.getLeaveBalance(employee.id) : Promise.resolve({ data: [] }),
      ];

      // Only fetch employees if we have a department ID
      if (deptId) {
        promisesToAwait.splice(
          1,
          0,
          departmentService.getDepartmentEmployees({ id: deptId, page: 1, rows: 100 }, { signal: null }),
        );
      }

      const results = await Promise.all(promisesToAwait);
      const leavesData = results[0];
      const allEmployeesData = deptId ? results[1] : null;
      const balanceData = deptId ? results[2] : results[1];

      const requests = leavesData?.data || leavesData || [];
      const allEmps = allEmployeesData?.data?.employees || allEmployeesData?.employees || [];
      const balances = balanceData?.data || balanceData || [];

      setLeaveRequests(requests);
      setEmployees(allEmps);

      // Default leave entitlements (must match backend defaults)
      const DEFAULT_LEAVE_ENTITLEMENTS = {
        annual: 15,
        sick: 5,
        maternity: 90,
        paternity: 5,
        compassionate: 5,
        study: 5,
        unpaid: 0,
        casual: 5,
      };

      // If balances is empty, compute from requests
      if (!balances || balances.length === 0) {
        // Get unique leave types from requests
        const leaveTypes = [...new Set(requests.map((r) => r.type || r.leave_type))];
        const computedBalances = leaveTypes.map((type, idx) => ({
          id: idx,
          leaveType: type,
          totalDays: DEFAULT_LEAVE_ENTITLEMENTS[type] || DEFAULT_LEAVE_ENTITLEMENTS.annual,
        }));
        console.log('Computed leave balances:', computedBalances);
        setLeaveBalanceByType(computedBalances);
      } else {
        setLeaveBalanceByType(balances);
      }

      // Calculate total balance for backward compatibility
      if (employee?.annual_leave_entitlement) {
        calculateLeaveBalance(requests);
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      if (error?.response?.status === 403) {
        showToast.error('You do not have permission to view leave data', 'Access Denied');
      } else if (error?.message?.includes('departmentId')) {
        showToast.error('Unable to load department information. Please refresh the page.', 'Error');
      } else {
        showToast.error(error?.message || 'Failed to load leave requests', 'Error');
      }
    } finally {
      setLoading(false);
    }
  }, [calculateLeaveBalance, employee?.annual_leave_entitlement, employee?.id, employee?.departmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // FIXED: Use business days calculator that excludes weekends
  const calculateDays = (startDate, endDate, period) => {
    const result = calculateBusinessDays(startDate, endDate, period);
    // Debug: Log calculation to verify it's working
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      console.log(`[Leave Calc] ${start.toDateString()} → ${end.toDateString()} = ${result} days (${period})`);
    }
    return result;
  };

  // FIXED: Enhanced form submission with leave type formatting and proper validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate leave type is selected
    if (!formData.leave_type) {
      setFormError('Please select a leave type');
      return;
    }

    const daysRequested = calculateDays(formData.start_date, formData.end_date, formData.leave_period);

    // Only check balance for leave types with entitlement
    const leaveTypesWithBalance = ['annual', 'vacation'];
    if (leaveTypesWithBalance.includes(formData.leave_type) && daysRequested > leaveBalance) {
      setFormError(`Insufficient leave balance. Available: ${leaveBalance} days, Requested: ${daysRequested} days.`);
      return;
    }

    setIsSubmitting(true);

    console.log('🚀 Submitting Leave Request with data:', {
      formData,
      supportingFilesCount: supportingFiles.length,
      handoverFilesCount: handoverFiles.length,
    });

    try {
      // Format leave type to match API expectations
      const leaveType = formatLeaveType(formData.leave_type);

      // Build FormData for multipart upload
      const formDataPayload = new FormData();
      formDataPayload.append('employeeId', parseInt(employee.id, 10));
      formDataPayload.append('type', leaveType);
      formDataPayload.append('startDate', formData.start_date);
      formDataPayload.append('endDate', formData.end_date);
      formDataPayload.append('reason', formData.reason);
      formDataPayload.append('leave_period', formData.leave_period);
      if (formData.selected_supervisor_id)
        formDataPayload.append('selected_supervisor_id', parseInt(formData.selected_supervisor_id, 10));
      if (formData.covering_employee_id)
        formDataPayload.append('covering_employee_id', parseInt(formData.covering_employee_id, 10));
      if (formData.handover_notes) formDataPayload.append('handover_notes', formData.handover_notes);
      if (formData.emergency_contact) formDataPayload.append('emergency_contact', formData.emergency_contact);
      if (formData.alternative_email) formDataPayload.append('alternative_email', formData.alternative_email);

      // Append supporting documents
      supportingFiles.forEach((file, index) => {
        formDataPayload.append('supporting_documents', file);
      });

      // Append handover documents
      handoverFiles.forEach((file, index) => {
        formDataPayload.append('handover_documents', file);
      });

      console.log('📤 FormData Payload with files:', {
        supportingFilesCount: supportingFiles.length,
        handoverFilesCount: handoverFiles.length,
      });

      const response = await leaveService.createLeaveMultipart(formDataPayload);

      // Verify response was successful
      if (!response || (response.error && response.error !== false)) {
        throw new Error(response?.message || 'Failed to create leave request');
      }

      // Backend automatically sends emails to supervisor, HR, and employee
      // No need to send emails from frontend

      console.log('🎉 Calling addNotification with success message');
      addNotification(
        'Leave request submitted successfully! Notification emails have been sent to your supervisor and HR.',
        'success',
      );
      console.log('✅ addNotification called');
      setShowForm(false);
      resetForm();
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      logger.error({ caller: 'Error submitting leave request:', payload: error });
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit leave request';
      addNotification(errorMsg, 'error');
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leave_type: '',
      start_date: '',
      end_date: '',
      leave_period: 'full_day',
      reason: '',
      emergency_contact: employee?.phone || '',
      alternative_email: '',
      handover_notes: '',
      covering_employee_id: '',
      selected_supervisor_id: '',
      supervisor_department: '',
    });
    setHandoverFiles([]);
    setSupportingFiles([]);
    setFormError('');
  };

  const handleFormOpen = (isOpen) => {
    setShowForm(isOpen);
    if (isOpen && employee?.supervisor_id) {
      setFormData((prev) => ({
        ...prev,
        selected_supervisor_id: employee.supervisor_id.toString(),
      }));
    } else if (!isOpen) {
      resetForm();
    }
  };

  const getSupervisorName = () => {
    if (employee?.supervisor_name) return employee.supervisor_name;
    if (employee?.supervisor_id && employees.length > 0) {
      const supervisor = employees.find((e) => e.id === employee.supervisor_id);
      if (supervisor) return `${supervisor.first_name} ${supervisor.last_name}`;
    }
    return 'N/A';
  };

  const handleSupervisorChange = (supervisorId) => {
    setFormData((prev) => {
      const selectedSupervisor = employees.find((e) => e.id.toString() === supervisorId);
      return {
        ...prev,
        selected_supervisor_id: supervisorId,
        supervisor_department: selectedSupervisor?.department || '',
      };
    });
  };

  const handleDelete = async (requestId) => {
    setLeaveToDelete(requestId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leaveToDelete) return;
    try {
      await leaveService.deleteLeave(leaveToDelete);
      showToast.success('Leave request deleted successfully', 'Success');
      setDeleteModalOpen(false);
      setLeaveToDelete(null);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting leave request:', error);
      showToast.error('Failed to delete leave request', 'Error');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending_supervisor_approval: <UserCheck className="w-4 h-4" />,
      pending_hr_approval: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
      pending: <UserCheck className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600">Manage your leave and view approvals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded px-4 py-2 flex items-center gap-2 hover:from-blue-800 hover:to-blue-900"
        >
          <Plus className="w-4 h-4" />
          New Leave Request
        </button>
      </div>

      {/* Leave Balance Summary - Always show summary cards */}
      <div className="border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Leave Balance Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          {leaveBalanceByType && leaveBalanceByType.length > 0 ? (
            leaveBalanceByType.map((balance) => {
              // Calculate approved days for this leave type
              const approvedDaysForType = leaveRequests
                .filter((req) => {
                  const reqType = req.type || req.leave_type;
                  const isApproved = req.status === 'approved';
                  const typeMatches =
                    reqType === balance.leaveType || reqType?.toLowerCase() === balance.leaveType?.toLowerCase();
                  return isApproved && typeMatches;
                })
                .reduce((total, req) => {
                  const days = calculateBusinessDays(
                    req.startDate || req.start_date,
                    req.endDate || req.end_date,
                    req.leave_period,
                  );
                  return total + days;
                }, 0);

              const usagePercentage = balance.totalDays > 0 ? (approvedDaysForType / balance.totalDays) * 100 : 0;
              // Color coding for usage: Red (>50% used), Yellow (20-50% used), Blue (<20% used)
              const getProgressBarColor = () => {
                if (usagePercentage > 50) return 'bg-red-500';
                if (usagePercentage > 20) return 'bg-yellow-500';
                return 'bg-blue-600';
              };
              return (
                <div key={balance.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 capitalize">{balance.leaveType}</p>
                    <span className="text-lg font-bold text-gray-900">
                      {approvedDaysForType}/{balance.totalDays}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded h-2.5 overflow-hidden">
                    <div
                      className={`${getProgressBarColor()} h-2.5 rounded transition-all duration-300`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Entitlement</p>
                  <p className="text-2xl font-bold text-gray-900">{employee?.annual_leave_entitlement || 15} days</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Used (Approved)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaveRequests
                      .filter((r) => r.status === 'approved' && (r.type === 'vacation' || r.type === 'annual'))
                      .reduce(
                        (acc, curr) =>
                          acc +
                          calculateBusinessDays(
                            curr.startDate || curr.start_date,
                            curr.endDate || curr.end_date,
                            curr.leave_period,
                          ),
                        0,
                      )}{' '}
                    days
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance Remaining</p>
                  <p className="text-2xl font-bold text-green-600">{leaveBalance} days</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>My Leave</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center p-8">Loading leave requests...</div>}
          {!loading && leaveRequests.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => {
                    const startDate = new Date(request.startDate || request.start_date);
                    const endDate = new Date(request.endDate || request.end_date);
                    const days = calculateBusinessDays(
                      request.startDate || request.start_date,
                      request.endDate || request.end_date,
                      request.leave_period,
                    );
                    const leaveType = request.type || request.leave_type;
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="capitalize">{getLeaveTypeDisplay(leaveType)}</TableCell>
                        <TableCell>
                          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>{days}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status.replaceAll('_', ' ').toUpperCase()}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt || request.created_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {!['approved', 'cancelled'].includes(request.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleDelete(request.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && leaveRequests.length === 0 && (
            <div className="text-center p-12 text-gray-500">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Leave History</h3>
              <p>You haven&apos;t submitted any leave requests yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={handleFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <Alert variant="info" className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Please fill out all relevant fields. While not mandatory, complete information helps expedite the approval
                process.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="bg-gray-50 rounded-t-lg p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" /> Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Full Name:</span>
                  <p>
                    {employee?.firstName || employee?.first_name} {employee?.lastName || employee?.last_name}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Employee ID:</span>
                  <p>{employee?.id || employee?.employee_id}</p>
                </div>
                <div>
                  <span className="font-medium">Department:</span>
                  <p className="capitalize">{employee?.departmentName || employee?.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Supervisor:</span>
                  <p>{getSupervisorName()}</p>
                </div>
              </CardContent>
            </Card>

            {leaveBalanceByType && leaveBalanceByType.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Leave Balance by Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {leaveBalanceByType.map((balance) => {
                    // Calculate approved days for this leave type
                    const approvedDaysForType = leaveRequests
                      .filter((req) => {
                        const reqType = req.type || req.leave_type;
                        const isApproved = req.status === 'approved';
                        const typeMatches =
                          reqType === balance.leaveType || reqType?.toLowerCase() === balance.leaveType?.toLowerCase();
                        return isApproved && typeMatches;
                      })
                      .reduce((total, req) => {
                        const days = calculateBusinessDays(
                          req.startDate || req.start_date,
                          req.endDate || req.end_date,
                          req.leave_period,
                        );
                        return total + days;
                      }, 0);

                    // Debug log
                    if (balance.leaveType === 'annual' && approvedDaysForType === 0) {
                      console.log(`Leave Balance Debug [${balance.leaveType}]:`, {
                        leaveType: balance.leaveType,
                        totalDays: balance.totalDays,
                        approvedDays: approvedDaysForType,
                        approvedRequests: leaveRequests.filter((r) => r.status === 'approved'),
                      });
                    }

                    const usagePercentage = balance.totalDays > 0 ? (approvedDaysForType / balance.totalDays) * 100 : 0;

                    // Color coding for usage: Red (>50% used), Yellow (20-50% used), Blue (<20% used)
                    const getProgressBarColor = () => {
                      if (usagePercentage > 50) return 'bg-red-500';
                      if (usagePercentage > 20) return 'bg-yellow-500';
                      return 'bg-blue-600';
                    };

                    return (
                      <div key={balance.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700 capitalize">{balance.leaveType}</p>
                          <span className="text-sm font-bold text-gray-900">
                            {approvedDaysForType}/{balance.totalDays}
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 rounded h-2.5 overflow-hidden">
                          <div
                            className={`${getProgressBarColor()} h-2.5 rounded transition-all duration-300`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Alert variant="info" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Your current annual leave balance is <strong>{leaveBalance} days</strong>.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-lg border-b pb-2">Leave Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave_type">Type of Leave</Label>
                <Select value={formData.leave_type} onValueChange={(value) => setFormData({ ...formData, leave_type: value })}>
                  <SelectTrigger id="leave_type">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                    <SelectItem value="paternity">Paternity Leave</SelectItem>
                    <SelectItem value="compassionate">Compassionate Leave</SelectItem>
                    <SelectItem value="study">Study Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave_period">Leave Period</Label>
                <Select
                  value={formData.leave_period}
                  onValueChange={(value) => setFormData({ ...formData, leave_period: value })}
                >
                  <SelectTrigger id="leave_period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day(s)</SelectItem>
                    <SelectItem value="half_day_morning">Half Day - Morning</SelectItem>
                    <SelectItem value="half_day_afternoon">Half Day - Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Days</Label>
                <Input
                  value={calculateDays(formData.start_date, formData.end_date, formData.leave_period)}
                  readOnly
                  className="bg-gray-100 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Provide a brief reason for your leave request..."
                rows={3}
              />
            </div>

            <FileUploader
              files={supportingFiles}
              setFiles={setSupportingFiles}
              title="Supporting Document(s)"
              description="e.g., medical certificate for sick leave, travel itinerary, etc. (Max 5MB per file)"
              id="supporting_document"
            />

            <div className="space-y-2 pt-4">
              <h3 className="font-semibold text-lg border-b pb-2">Handover & Backup</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selected_supervisor_id">Approving Supervisor</Label>
                <Select value={formData.selected_supervisor_id} onValueChange={handleSupervisorChange}>
                  <SelectTrigger id="selected_supervisor_id">
                    <SelectValue placeholder="Select your direct supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.firstName || emp.first_name} {emp.lastName || emp.last_name} -{' '}
                        {emp.jobRole || emp.position || emp.departmentName || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Contact Number (during leave)</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="Your phone number while on leave"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternative_email">Alternative Email</Label>
                <Input
                  id="alternative_email"
                  type="email"
                  value={formData.alternative_email}
                  onChange={(e) => setFormData({ ...formData, alternative_email: e.target.value })}
                  placeholder="Alternative email if applicable"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="covering_employee_id">Backup/Reliever Name</Label>
              <Select
                value={formData.covering_employee_id}
                onValueChange={(value) => setFormData({ ...formData, covering_employee_id: value })}
              >
                <SelectTrigger id="covering_employee_id">
                  <SelectValue placeholder="Select employee to cover your duties" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.firstName || emp.first_name} {emp.lastName || emp.last_name} -{' '}
                      {emp.departmentName || emp.department || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="handover_notes">Handover Notes</Label>
              <Textarea
                id="handover_notes"
                value={formData.handover_notes}
                onChange={(e) => setFormData({ ...formData, handover_notes: e.target.value })}
                placeholder="Provide detailed instructions for the person covering your duties..."
                rows={4}
              />
            </div>

            <FileUploader
              files={handoverFiles}
              setFiles={setHandoverFiles}
              title="Handover Document(s)"
              description="Attach any files relevant to your handover. (Max 5MB per file)"
              id="handover_document"
            />

            {formError ? <div className="px-4 py-3 bg-red-100 text-red-900 rounded-lg">{formError}</div> : null}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Submitting...'}
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

LeaveManagement.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.number,
    firstName: PropTypes.string,
    first_name: PropTypes.string,
    lastName: PropTypes.string,
    last_name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    departmentName: PropTypes.string,
    department: PropTypes.string,
    annual_leave_entitlement: PropTypes.number,
    supervisor_name: PropTypes.string,
    supervisor_id: PropTypes.number,
    employee_id: PropTypes.number,
  }),
  onUpdate: PropTypes.func,
  preLoadedLeaves: PropTypes.array,
  leaveBalance: PropTypes.number,
};
