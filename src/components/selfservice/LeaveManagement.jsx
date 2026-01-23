
import React, { useState, useEffect } from 'react';
import { leaveService, employeeService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Plus, FileText, Clock, CheckCircle, XCircle, Briefcase, User, Info, UserCheck, AlertCircle, Upload, Paperclip, Loader2 } from 'lucide-react';

export default function LeaveManagement({ employee, onUpdate, preLoadedLeaves, leaveBalance: preLoadedBalance }) {
    const [leaveRequests, setLeaveRequests] = useState(preLoadedLeaves || []);
    const [employees, setEmployees] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState(preLoadedBalance || 0);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(!preLoadedLeaves);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [handoverFiles, setHandoverFiles] = useState([]);
    const [supportingFiles, setSupportingFiles] = useState([]);

    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        leave_period: 'full_day',
        reason: '',
        emergency_contact: employee.phone || '',
        alternative_email: '',
        handover_notes: '',
        covering_employee_id: '',
        selected_supervisor_id: ''
    });

    const calculateLeaveBalance = React.useCallback((requests) => {
        const approvedAnnualLeave = requests
            .filter(r => r.status === 'approved' && r.type === 'vacation')
            .reduce((acc, curr) => {
                const startDate = new Date(curr.startDate);
                const endDate = new Date(curr.endDate);
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                return acc + days;
            }, 0);
        const entitlement = employee.annual_leave_entitlement || 21;
        setLeaveBalance(entitlement - approvedAnnualLeave);
    }, [employee.annual_leave_entitlement]);

    const loadData = React.useCallback(async () => {
        if (!employee?.id) return;

        // If we have preLoaded leaves, use them directly
        if (preLoadedLeaves && preLoadedLeaves.length > 0) {
            setLeaveRequests(preLoadedLeaves);
            setLoading(false);
            calculateLeaveBalance(preLoadedLeaves);
            // Still load employees
            try {
                const allEmployeesData = await employeeService.getEmployees({ page: 1, rows: 100 });
                const allEmps = allEmployeesData?.data || allEmployeesData || [];
                setEmployees(allEmps);
            } catch (error) {
                console.error('Error loading employees:', error);
            }
            return;
        }

        setLoading(true);
        try {
            const [leavesData, allEmployeesData] = await Promise.all([
                leaveService.getLeavesByEmployee(employee.id, 1, 100),
                employeeService.getEmployees({ page: 1, rows: 100 })
            ]);

            const requests = leavesData?.data || leavesData || [];
            const allEmps = allEmployeesData?.data || allEmployeesData || [];

            setLeaveRequests(requests);
            setEmployees(allEmps);
            calculateLeaveBalance(requests);
        } catch (error) {
            console.error('Error loading leave data:', error);
            showToast.error('Failed to load leave requests', 'Error');
        } finally {
            setLoading(false);
        }
    }, [employee?.id, calculateLeaveBalance, preLoadedLeaves]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const calculateDays = (startDate, endDate, period) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (period !== 'full_day' && start.toDateString() === end.toDateString()) {
            return 0.5;
        }

        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const daysRequested = calculateDays(formData.start_date, formData.end_date, formData.leave_period);

        if (formData.leave_type === 'vacation' && daysRequested > leaveBalance) {
            showToast.error(`Insufficient leave balance. Available: ${leaveBalance} days, Requested: ${daysRequested} days.`, 'Error');
            return;
        }

        setIsSubmitting(true);

        try {
            const leaveData = {
                employeeId: employee.id,
                type: formData.leave_type,
                startDate: formData.start_date,
                endDate: formData.end_date,
                reason: formData.reason
            };

            await leaveService.createLeave(leaveData);

            showToast.success('Leave request submitted successfully!', 'Success');
            setShowForm(false);
            resetForm();
            loadData();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error submitting leave request:', error);
            showToast.error(error.response?.data?.message || error.message || 'Failed to submit leave request', 'Error');
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
            emergency_contact: employee.phone || '',
            alternative_email: '',
            handover_notes: '',
            covering_employee_id: '',
            selected_supervisor_id: ''
        });
        setHandoverFiles([]);
        setSupportingFiles([]);
    };

    const handleDelete = async (requestId) => {
        if (window.confirm('Are you sure you want to delete this leave request? This action cannot be undone.')) {
            try {
                await leaveService.deleteLeave(requestId);
                showToast.success('Leave request deleted successfully', 'Success');
                loadData();
                if (onUpdate) onUpdate();
            } catch (error) {
                console.error('Error deleting leave request:', error);
                showToast.error('Failed to delete leave request', 'Error');
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending_supervisor_approval: 'bg-orange-100 text-orange-700',
            pending_hr_approval: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending_supervisor_approval: <UserCheck className="w-4 h-4" />,
            pending_hr_approval: <Clock className="w-4 h-4" />,
            approved: <CheckCircle className="w-4 h-4" />,
            rejected: <XCircle className="w-4 h-4" />,
            cancelled: <XCircle className="w-4 h-4" />
        };
        return icons[status] || <Clock className="w-4 h-4" />;
    };

    const FileUploader = ({ files, setFiles, title, description, id }) => {
        const handleFileChange = (e) => {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        };

        const removeFile = (index) => {
            setFiles(prev => prev.filter((_, i) => i !== index));
        };

        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <div className="truncate">
                                        <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 h-6 w-6">
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const handleEmployeeChange = (employeeId) => {
        const selected = employees.find(e => String(e.id) === String(employeeId));
        if (selected) {
            const filteredLeaves = leaveRequests.filter(leave => leave.employeeId === selected.id);
            calculateLeaveBalance(filteredLeaves);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
                    <p className="text-gray-600">Manage your leave and view approvals</p>
                </div>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-700 to-blue-800">
                            <Plus className="w-4 h-4 mr-2" />
                            New Leave Request
                        </Button>
                    </DialogTrigger>
                </Dialog>
            </div>

            {/* Employee Selector */}
            <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Select Employee</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={String(employee?.id)} onValueChange={handleEmployeeChange}>
                        <SelectTrigger className="w-full md:w-1/3">
                            <SelectValue placeholder="Select employee..." />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(emp => (
                                <SelectItem key={emp.id} value={String(emp.id)}>
                                    {((emp.firstName || emp.first_name) + ' ' + (emp.lastName || emp.last_name)).toUpperCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {employee && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Name</p>
                                    <p className="font-semibold text-gray-900">{employee.firstName} {employee.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Email</p>
                                    <p className="font-semibold text-gray-900 truncate">{employee.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Department</p>
                                    <p className="font-semibold text-gray-900">{employee.departmentName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Leave Balance</p>
                                    <p className="font-semibold text-blue-600 text-lg">{leaveBalance} days</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader><CardTitle>My Leave</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">Loading leave requests...</div>
                    ) : leaveRequests.length > 0 ? (
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
                                        const startDate = new Date(request.startDate);
                                        const endDate = new Date(request.endDate);
                                        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                                        return (
                                            <TableRow key={request.id}>
                                                <TableCell className="capitalize">{(request.type || request.leave_type).replace('_', ' ')}</TableCell>
                                                <TableCell>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</TableCell>
                                                <TableCell>{days}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(request.status)}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(request.status)}
                                                            {request.status.replace(/_/g, ' ').toUpperCase()}
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
                    ) : (
                        <div className="text-center p-12 text-gray-500">
                            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold mb-2">No Leave History</h3>
                            <p>You haven't submitted any leave requests yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Submit Leave Request</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">

                        <Alert variant="info" className="bg-orange-50 border-orange-200">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                                Please fill out all relevant fields. While not mandatory, complete information helps expedite the approval process.
                            </AlertDescription>
                        </Alert>

                        <Card>
                            <CardHeader className="bg-gray-50 rounded-t-lg p-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="w-4 h-4" /> Employee Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><span className="font-medium">Full Name:</span><p>{employee.firstName || employee.first_name} {employee.lastName || employee.last_name}</p></div>
                                <div><span className="font-medium">Employee ID:</span><p>{employee.id || employee.employee_id}</p></div>
                                <div><span className="font-medium">Department:</span><p className="capitalize">{employee.department || 'N/A'}</p></div>
                                <div><span className="font-medium">Supervisor:</span><p>{employee.supervisor_name || 'N/A'}</p></div>
                            </CardContent>
                        </Card>

                        <Alert variant="info" className="bg-blue-50 border-blue-200">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                Your current annual leave balance is <strong>{leaveBalance} days</strong>.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-2">Leave Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="leave_type">Type of Leave</Label>
                                <Select value={formData.leave_type} onValueChange={(value) => setFormData({ ...formData, leave_type: value })}>
                                    <SelectTrigger id="leave_type"><SelectValue placeholder="Select leave type" /></SelectTrigger>
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
                                <Select value={formData.leave_period} onValueChange={(value) => setFormData({ ...formData, leave_period: value })}>
                                    <SelectTrigger id="leave_period"><SelectValue /></SelectTrigger>
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
                                <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Days</Label>
                                <Input value={calculateDays(formData.start_date, formData.end_date, formData.leave_period)} readOnly className="bg-gray-100 font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Leave</Label>
                            <Textarea id="reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Provide a brief reason for your leave request..." rows={3} />
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

                        <div className="space-y-2">
                            <Label htmlFor="selected_supervisor_id">Approving Supervisor</Label>
                            <Select value={formData.selected_supervisor_id} onValueChange={(value) => setFormData({ ...formData, selected_supervisor_id: value })}>
                                <SelectTrigger id="selected_supervisor_id"><SelectValue placeholder="Select your direct supervisor" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} - {emp.position}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact">Contact Number (during leave)</Label>
                                <Input id="emergency_contact" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} placeholder="Your phone number while on leave" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alternative_email">Alternative Email</Label>
                                <Input id="alternative_email" type="email" value={formData.alternative_email} onChange={(e) => setFormData({ ...formData, alternative_email: e.target.value })} placeholder="Alternative email if applicable" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="covering_employee_id">Backup/Reliever Name</Label>
                            <Select value={formData.covering_employee_id} onValueChange={(value) => setFormData({ ...formData, covering_employee_id: value })}>
                                <SelectTrigger id="covering_employee_id"><SelectValue placeholder="Select employee to cover your duties" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} - {emp.department}</SelectItem>
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

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
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
        </div>
    );
}
