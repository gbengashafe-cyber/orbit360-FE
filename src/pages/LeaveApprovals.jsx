import { useState, useEffect } from 'react';
import { leaveService, employeeService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader, StatCard, StatusBadge, formatDate, formatDateRange } from '@/components/system';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, FileText } from 'lucide-react';
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

    const filteredRequests = leaveRequests.filter((req) => {
        if (filterStatus === 'all') return true;
        return req.status === filterStatus || req.status?.includes(filterStatus);
    });

    const pendingCount = leaveRequests.filter((r) => r.status?.includes('pending')).length;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            <PageHeader title="Leave approvals" description="Review and decide employee leave requests." />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Pending approvals" value={pendingCount} tone="pending" />
                <StatCard label="Approved" value={leaveRequests.filter((r) => r.status === 'approved').length} tone="success" />
                <StatCard label="Rejected" value={leaveRequests.filter((r) => r.status === 'rejected').length} tone="danger" />
                <StatCard label="Total requests" value={leaveRequests.length} />
            </div>

            {/* Requests Table */}
            <Card>
                <CardContent className="pt-6">
                    <Tabs value={filterStatus} onValueChange={setFilterStatus} className="mb-5">
                        <TabsList className="flex h-auto w-full flex-wrap justify-start">
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                            <TabsTrigger value="all">All requests</TabsTrigger>
                        </TabsList>
                    </Tabs>
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
                                                    {formatDateRange(startDate, endDate)}
                                                </TableCell>
                                                <TableCell>{days} days</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={request.status} />
                                                </TableCell>
                                                {(filterStatus === 'approved' || filterStatus === 'all') && (
                                                    <TableCell>
                                                        {request.status === 'approved' && request.updatedAt
                                                            ? formatDate(request.updatedAt)
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
                                                                    onClick={() => confirmApprovalDirect(request)}
                                                                    disabled={isProcessing}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedLeave(request);
                                                                        setRejectionDialogOpen(true);
                                                                    }}
                                                                    disabled={isProcessing}
                                                                >
                                                                    Reject
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
                        <EmptyState title="No leave requests" description="There are no requests to review with this filter." />
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
                                        {formatDateRange(selectedLeave.startDate || selectedLeave.start_date, selectedLeave.endDate || selectedLeave.end_date)}
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
                                            } catch {
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
                                            } catch {
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
