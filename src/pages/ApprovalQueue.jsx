
import React, { useState, useEffect } from 'react';
import { userService, employeeService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function ApprovalQueue() {
    const [requests, setRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [approvalModal, setApprovalModal] = useState({
        open: false,
        requestId: null,
    });
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const userResponse = await userService.getCurrentUser();
            const user = userResponse?.data || userResponse;
            setCurrentUser(user);

            // Fetch training requests
            try {
                const response = await fetch('/api/v1/training-requests', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('orbit360-access-token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                const allRequests = result?.data || [];

                // Filter based on role
                let pendingRequests = [];
                if (user?.role === 'supervisor' || user?.role === 'admin' || user?.role === 'admin_officer') {
                    pendingRequests = allRequests.filter(r => r.status === 'PENDING');
                } else if (user?.role === 'hr_officer' || user?.role === 'hr_manager') {
                    pendingRequests = allRequests.filter(r => 
                        r.status === 'PENDING' || r.status === 'SUPERVISOR_APPROVED' || r.status === 'SUPERVISOR_REJECTED'
                    );
                }

                setRequests(pendingRequests);
            } catch (fetchError) {
                console.error('Error fetching requests:', fetchError);
                setError(`Failed to load requests: ${fetchError.message}`);
                setRequests([]);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (requestId, approved) => {
        if (!approved && !rejectionReason.trim()) {
            showToast.error('Rejection reason is required', 'Error');
            return;
        }

        setIsApproving(true);
        try {
            const endpoint = currentUser?.role === 'supervisor' || currentUser?.role === 'admin' || currentUser?.role === 'admin_officer'
                ? `/api/v1/training-requests/${requestId}/supervisor-approval`
                : `/api/v1/training-requests/${requestId}/hr-approval`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('orbit360-access-token')}`
                },
                body: JSON.stringify({
                    approved,
                    rejectionReason: approved ? null : rejectionReason
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to process approval');
            }

            showToast.success(`Request ${approved ? 'approved' : 'rejected'} successfully!`, 'Success');
            setApprovalModal({ open: false, requestId: null });
            setRejectionReason('');
            await loadData();
        } catch (err) {
            showToast.error('Failed to process approval: ' + err.message, 'Error');
            console.error('Error processing approval:', err);
        } finally {
            setIsApproving(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'bg-blue-100 text-blue-700',
            SUPERVISOR_APPROVED: 'bg-green-100 text-green-700',
            SUPERVISOR_REJECTED: 'bg-red-100 text-red-700',
            HR_APPROVED: 'bg-green-100 text-green-700',
            HR_REJECTED: 'bg-red-100 text-red-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-green-100 text-green-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            critical: 'bg-red-100 text-red-700'
        };
        return colors[priority] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return <div className="p-8 text-center">Loading approval queue...</div>;
    }

    return (
        <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
                        <p className="text-gray-600">Review and approve training requests</p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Empty State */}
                {requests.length === 0 && !error && (
                    <Card>
                        <CardContent className="pt-12">
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                                <h3 className="text-lg font-semibold mb-2 text-gray-900">All Caught Up</h3>
                                <p className="text-gray-600">No training requests pending your approval</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pending Requests Table */}
                {requests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Pending Approvals ({requests.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Training Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date Submitted</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((request) => (
                                            <TableRow key={request.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    {request.employeeName || 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    {request.trainingTitle || request.training_title}
                                                </TableCell>
                                                <TableCell>
                                                    {(request.trainingType || request.training_type || '').replace('_', ' ')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getPriorityColor(request.priority)}>
                                                        {request.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(request.status)}>
                                                        {(request.status || '').replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(request.createdAt || request.created_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setApprovalModal({ open: true, requestId: request.id });
                                                        }}
                                                    >
                                                        Review
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Approval Modal */}
            <Dialog open={approvalModal.open} onOpenChange={(open) => {
                setApprovalModal({ ...approvalModal, open });
                if (!open) setRejectionReason('');
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedRequest?.trainingTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Request Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Type</p>
                                <p className="text-sm text-gray-600">
                                    {(selectedRequest?.trainingType || selectedRequest?.training_type || '').replace('_', ' ')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Priority</p>
                                <Badge className={getPriorityColor(selectedRequest?.priority)}>
                                    {selectedRequest?.priority}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Status</p>
                                <Badge className={getStatusColor(selectedRequest?.status)}>
                                    {(selectedRequest?.status || '').replace('_', ' ')}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Cost</p>
                                <p className="text-sm text-gray-600">
                                    ₦{selectedRequest?.estimatedCost || 0}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                {selectedRequest?.description || selectedRequest?.trainingDescription}
                            </p>
                        </div>

                        {/* Business Justification */}
                        {selectedRequest?.businessJustification && (
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Business Justification</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    {selectedRequest.businessJustification}
                                </p>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        <div>
                            <Label htmlFor="rejection_reason">
                                Rejection Reason (Required only if rejecting)
                            </Label>
                            <Textarea
                                id="rejection_reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Provide a reason if you're rejecting this request..."
                                className="h-24 mt-2"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setApprovalModal({ open: false, requestId: null });
                                    setRejectionReason('');
                                }}
                                disabled={isApproving}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleApproval(selectedRequest?.id, false)}
                                disabled={isApproving}
                            >
                                {isApproving ? 'Processing...' : 'Reject'}
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproval(selectedRequest?.id, true)}
                                disabled={isApproving}
                            >
                                {isApproving ? 'Processing...' : 'Approve'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
