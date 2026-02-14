import React, { useState, useEffect } from 'react';
import { leaveService, employeeService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { calculateBusinessDays } from '@/utils/leaveCalculator';

export default function LeaveApprovalsPage() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('pending');

    const loadData = async () => {
        setLoading(true);
        try {
            const [leavesData, employeesData] = await Promise.all([
                leaveService.getLeaves(1, 100),
                employeeService.getEmployees({ page: 1, rows: 100 }),
            ]);

            const requests = leavesData?.data || leavesData || [];
            const emps = employeesData?.data || employeesData || [];

            setLeaveRequests(requests);
            setEmployees(emps);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast.error('Failed to load leave requests', 'Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getEmployeeName = (employeeId) => {
        const emp = employees.find((e) => e.id === employeeId);
        if (emp) {
            return `${emp.first_name || emp.firstName} ${emp.last_name || emp.lastName}`;
        }
        return 'Unknown Employee';
    };

    const confirmApproval = async () => {
        if (!selectedLeave) return;

        setIsProcessing(true);
        try {
            await leaveService.updateLeave(selectedLeave.id, {
                status: 'approved',
            });

            showToast.success('Leave request approved successfully', 'Success');
            setApprovalDialogOpen(false);
            setSelectedLeave(null);
            loadData();
        } catch (error) {
            console.error('Error approving leave:', error);
            showToast.error('Failed to approve leave request', 'Error');
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmRejection = async () => {
        if (!selectedLeave || !rejectionReason.trim()) {
            showToast.error('Please provide a reason for rejection', 'Error');
            return;
        }

        setIsProcessing(true);
        try {
            await leaveService.updateLeave(selectedLeave.id, {
                status: 'rejected',
                rejection_reason: rejectionReason,
            });

            showToast.success('Leave request rejected', 'Success');
            setApprovalDialogOpen(false);
            setSelectedLeave(null);
            setRejectionReason('');
            loadData();
        } catch (error) {
            console.error('Error rejecting leave:', error);
            showToast.error('Failed to reject leave request', 'Error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            pending_supervisor_approval: 'bg-orange-100 text-orange-700',
            pending_hr_approval: 'bg-blue-100 text-blue-800',
            pending_manager_approval: 'bg-indigo-100 text-indigo-800',
            cancelled: 'bg-gray-100 text-gray-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const filteredRequests = leaveRequests.filter((req) => {
        if (filterStatus === 'all') return true;
        return req.status === filterStatus || req.status?.includes(filterStatus);
    });

    const pendingCount = leaveRequests.filter((r) => r.status?.includes('pending')).length;

    return (
        <div className="space-y-6 p-4 lg:p-8">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
                    <p className="text-gray-600">Review and approve/reject employee leave requests</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Pending Approvals</p>
                        <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Approved</p>
                        <p className="text-3xl font-bold text-green-600">
                            {leaveRequests.filter((r) => r.status === 'approved').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Rejected</p>
                        <p className="text-3xl font-bold text-red-600">
                            {leaveRequests.filter((r) => r.status === 'rejected').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Total Requests</p>
                        <p className="text-3xl font-bold text-blue-600">{leaveRequests.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('pending')}
                    size="sm"
                >
                    Pending
                </Button>
                <Button
                    variant={filterStatus === 'approved' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('approved')}
                    size="sm"
                >
                    Approved
                </Button>
                <Button
                    variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('rejected')}
                    size="sm"
                >
                    Rejected
                </Button>
                <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                    size="sm"
                >
                    All Requests
                </Button>
            </div>

            {/* Requests Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" />
                        </div>
                    ) : filteredRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Leave Type</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.map((request) => {
                                        const startDate = new Date(request.startDate || request.start_date);
                                        const endDate = new Date(request.endDate || request.end_date);
                                        const days = calculateBusinessDays(
                                            request.startDate || request.start_date,
                                            request.endDate || request.end_date,
                                            request.leave_period
                                        );

                                        return (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">
                                                    {getEmployeeName(request.employeeId)}
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {(request.type || request.leave_type)?.replaceAll('_', ' ')}
                                                </TableCell>
                                                <TableCell>
                                                    {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{days} days</TableCell>
                                                <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                                                    {request.reason || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusBadge(request.status)}>
                                                        {request.status?.replaceAll('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="bg-transparent text-black hover:text-white border border-gray-400"
                                                        onClick={() => {
                                                            setSelectedLeave(request);
                                                            setRejectionReason('');
                                                            setApprovalDialogOpen(true);
                                                        }}
                                                    >
                                                        View Application
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center p-12 text-gray-500">
                            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold mb-2">No Leave Requests</h3>
                            <p>No leave requests to review.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approval/Rejection Dialog */}
            <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedLeave?.status?.includes('pending')
                                ? 'Review Leave Request'
                                : 'Leave Request'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedLeave && getEmployeeName(selectedLeave.employeeId)}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLeave && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div>
                                    <p className="text-sm text-gray-600">Leave Type</p>
                                    <p className="font-medium capitalize">
                                        {(selectedLeave.type || selectedLeave.leave_type)?.replaceAll('_', ' ')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Dates</p>
                                    <p className="font-medium">
                                        {new Date(selectedLeave.startDate || selectedLeave.start_date).toLocaleDateString()} -{' '}
                                        {new Date(selectedLeave.endDate || selectedLeave.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Days</p>
                                    <p className="font-medium">
                                        {calculateBusinessDays(
                                            selectedLeave.startDate || selectedLeave.start_date,
                                            selectedLeave.endDate || selectedLeave.end_date,
                                            selectedLeave.leave_period
                                        )}{' '}
                                        days
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Reason</p>
                                    <p className="font-medium">{selectedLeave.reason || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Supervisor</p>
                                    <p className="font-medium">
                                        {selectedLeave.selected_supervisor_id
                                            ? employees.find((e) => e.id === parseInt(selectedLeave.selected_supervisor_id))
                                                ? `${employees.find((e) => e.id === parseInt(selectedLeave.selected_supervisor_id))?.firstName || employees.find((e) => e.id === parseInt(selectedLeave.selected_supervisor_id))?.first_name} ${employees.find((e) => e.id === parseInt(selectedLeave.selected_supervisor_id))?.lastName || employees.find((e) => e.id === parseInt(selectedLeave.selected_supervisor_id))?.last_name}`
                                                : '-'
                                            : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Reliever Name</p>
                                    <p className="font-medium">
                                        {selectedLeave.covering_employee_id
                                            ? employees.find((e) => e.id === parseInt(selectedLeave.covering_employee_id))
                                                ? `${employees.find((e) => e.id === parseInt(selectedLeave.covering_employee_id))?.firstName || employees.find((e) => e.id === parseInt(selectedLeave.covering_employee_id))?.first_name} ${employees.find((e) => e.id === parseInt(selectedLeave.covering_employee_id))?.lastName || employees.find((e) => e.id === parseInt(selectedLeave.covering_employee_id))?.last_name}`
                                                : '-'
                                            : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Handover Note</p>
                                    <p className="font-medium">{selectedLeave.handover_notes || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Contact Number (During Leave)</p>
                                    <p className="font-medium">{selectedLeave.emergency_contact || '-'}</p>
                                </div>
                            </div>

                            {/* Documents Section */}
                            {(selectedLeave.supporting_documents?.length > 0 || selectedLeave.handover_documents?.length > 0) && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-semibold text-gray-900 mb-4">Documents</h4>
                                    {selectedLeave.supporting_documents?.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Supporting Documents</p>
                                            <div className="space-y-2">
                                                {selectedLeave.supporting_documents.map((doc, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                        <span className="text-sm text-gray-700">{doc.name || `Document ${idx + 1}`}</span>
                                                        <a
                                                            href={doc.url || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            View
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedLeave.handover_documents?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Handover Documents</p>
                                            <div className="space-y-2">
                                                {selectedLeave.handover_documents.map((doc, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                        <span className="text-sm text-gray-700">{doc.name || `Document ${idx + 1}`}</span>
                                                        <a
                                                            href={doc.url || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            View
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* {selectedLeave.status?.includes('pending') && (
                                <>
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <AlertDescription className="text-blue-800">
                                            Choose to approve or reject this leave request.
                                        </AlertDescription>
                                    </Alert>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Rejection Reason (if rejecting)
                                        </label>
                                        <Textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Provide a reason for rejection (optional if approving)"
                                            rows={3}
                                        />
                                    </div>
                                </>
                            )} */}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setApprovalDialogOpen(false);
                                setSelectedLeave(null);
                                setRejectionReason('');
                            }}
                        >
                            Close
                        </Button>
                        {/* {selectedLeave?.status?.includes('pending') && (
                            <>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={confirmRejection}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Reject
                                </Button>
                                <Button
                                    type="button"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={confirmApproval}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Approve
                                </Button>
                            </>
                        )} */}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
