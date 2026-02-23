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
import { CheckCircle2, Loader2, Calendar, ThumbsUp, ThumbsDown, Download, FileText } from 'lucide-react';
import { calculateBusinessDays } from '@/utils/leaveCalculator';

export default function LeaveApprovalsPage() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
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

            // Debug log to check the data structure
            if (requests.length > 0) {
                console.log('First leave request data:', requests[0]);
            }

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
            await leaveService.updateLeaveStatus(selectedLeave.id, 'approved');

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

    const confirmApprovalDirect = async (leave) => {
        setIsProcessing(true);
        try {
            await leaveService.updateLeaveStatus(leave.id, 'approved');
            showToast.success('Leave request approved successfully', 'Success');
            loadData();
        } catch (error) {
            console.error('Error approving leave:', error);
            showToast.error('Failed to approve leave request', 'Error');
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmRejection = async () => {
        if (!selectedLeave) return;

        setIsProcessing(true);
        try {
            await leaveService.updateLeaveStatus(
                selectedLeave.id,
                'rejected',
                rejectionReason.trim() || null
            );

            showToast.success('Leave request rejected', 'Success');
            setRejectionDialogOpen(false);
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
                                        <TableHead>Status</TableHead>
                                        {(filterStatus === 'approved' || filterStatus === 'all') && <TableHead>Approved On</TableHead>}
                                        <TableHead className="text-right">Actions</TableHead>
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
                                                <TableCell>
                                                    <Badge className={getStatusBadge(request.status)}>
                                                        {request.status?.replaceAll('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                {(filterStatus === 'approved' || filterStatus === 'all') && (
                                                    <TableCell>
                                                        {request.status === 'approved' && request.updatedAt
                                                            ? new Date(request.updatedAt).toLocaleDateString()
                                                            : '-'}
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedLeave(request);
                                                                setViewDialogOpen(true);
                                                            }}
                                                        >
                                                            View
                                                        </Button>
                                                        {request.status?.includes('pending') && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                                                    onClick={() => confirmApprovalDirect(request)}
                                                                    disabled={isProcessing}
                                                                >
                                                                    <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                                    onClick={() => {
                                                                        setSelectedLeave(request);
                                                                        setRejectionDialogOpen(true);
                                                                    }}
                                                                    disabled={isProcessing}
                                                                >
                                                                    <ThumbsDown className="w-4 h-4 mr-1" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
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

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
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
                            {(() => {
                                try {
                                    let supportingDocs = [];
                                    let handoverDocs = [];
                                    
                                    // Try to parse supporting docs safely
                                    if (selectedLeave.supporting_documents) {
                                        if (typeof selectedLeave.supporting_documents === 'string') {
                                            try {
                                                supportingDocs = JSON.parse(selectedLeave.supporting_documents);
                                            } catch (e) {
                                                supportingDocs = [];
                                            }
                                        } else if (Array.isArray(selectedLeave.supporting_documents)) {
                                            supportingDocs = selectedLeave.supporting_documents;
                                        }
                                    }
                                    
                                    // Try to parse handover docs safely
                                    if (selectedLeave.handover_documents) {
                                        if (typeof selectedLeave.handover_documents === 'string') {
                                            try {
                                                handoverDocs = JSON.parse(selectedLeave.handover_documents);
                                            } catch (e) {
                                                handoverDocs = [];
                                            }
                                        } else if (Array.isArray(selectedLeave.handover_documents)) {
                                            handoverDocs = selectedLeave.handover_documents;
                                        }
                                    }
                                
                                    return (supportingDocs.length > 0 || handoverDocs.length > 0) ? (
                                    <div className="mt-6 pt-6 border-t">
                                        <h4 className="font-semibold text-gray-900 mb-4">Documents</h4>
                                        {supportingDocs.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-700 mb-3">Supporting Documents</p>
                                                <div className="space-y-2">
                                                    {supportingDocs.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                                                <span className="text-sm text-gray-700 truncate" title={doc.name || `Document ${idx + 1}`}>
                                                                    {doc.name || `Document ${idx + 1}`}
                                                                </span>
                                                            </div>
                                                            <a
                                                                href={doc.url || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors flex-shrink-0 ml-2"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                Download
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {handoverDocs.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-3">Handover Documents</p>
                                                <div className="space-y-2">
                                                    {handoverDocs.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                <span className="text-sm text-gray-700 truncate" title={doc.name || `Document ${idx + 1}`}>
                                                                    {doc.name || `Document ${idx + 1}`}
                                                                </span>
                                                            </div>
                                                            <a
                                                                href={doc.url || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex-shrink-0 ml-2"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                Download
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    ) : null;
                                } catch (error) {
                                    console.error('Error parsing documents:', error);
                                    return null;
                                }
                            })()}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setViewDialogOpen(false);
                                setSelectedLeave(null);
                            }}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Reason Dialog */}
            <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Leave Request</DialogTitle>
                        <DialogDescription>
                            {selectedLeave && getEmployeeName(selectedLeave.employeeId)}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Rejection Reason (Optional)
                            </label>
                            <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Provide a reason for rejection"
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setRejectionDialogOpen(false);
                                setSelectedLeave(null);
                                setRejectionReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmRejection}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
