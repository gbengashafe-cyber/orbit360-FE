
import React, { useState, useEffect } from 'react';
import { userService, employeeService, trainingService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { GraduationCap, Plus, BookOpen, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';

export default function RequestTraining() {
    const [requests, setRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('my_requests');

    // Approval states
    const [approvalModal, setApprovalModal] = useState({
        open: false,
        requestId: null,
        type: null, // 'supervisor', 'hr', 'final'
    });
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestsNeedingApproval, setRequestsNeedingApproval] = useState([]);

    const [formData, setFormData] = useState({
        training_type: '',
        training_title: '',
        training_description: '',
        business_justification: '',
        skills_to_gain: '',
        preferred_delivery_method: '',
        preferred_timeframe: '',
        estimated_duration: '',
        estimated_cost: '',
        external_provider: '',
        priority: 'medium',
        request_scope: 'self',
        team_count: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const userResponse = await userService.getCurrentUser();
            const user = userResponse?.data || userResponse;
            setCurrentUser(user);

            const employeeResponse = await employeeService.getUserEmployeeData();
            const employeeRecord = employeeResponse?.data || employeeResponse;
            setCurrentEmployee(employeeRecord);

            try {
                const requestsResponse = await trainingService.getRequests();
                const allRequests = requestsResponse?.data || requestsResponse || [];
                setRequests(allRequests);

                // Filter requests needing approval based on user role
                if (user?.role === 'supervisor' || user?.role === 'admin' || user?.role === 'admin_officer') {
                    const needApproval = allRequests.filter(r => 
                        r.status === 'PENDING' || r.status === 'SUPERVISOR_REJECTED'
                    );
                    setRequestsNeedingApproval(needApproval);
                } else if (user?.role === 'hr_officer' || user?.role === 'hr_manager') {
                    const needApproval = allRequests.filter(r => 
                        r.status === 'PENDING' || r.status === 'SUPERVISOR_APPROVED' || r.status === 'SUPERVISOR_REJECTED'
                    );
                    setRequestsNeedingApproval(needApproval);
                }
            } catch (error) {
                console.warn('Could not fetch training requests:', error);
                setRequests([]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showToast.error('Failed to load user data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentEmployee) {
            setError('Employee data not loaded. Please refresh and try again.');
            return;
        }

        if (!formData.training_type || !formData.training_title || !formData.training_description) {
            setError('Please fill in all required fields.');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const requestData = {
                employeeId: currentEmployee.id,
                trainingType: formData.training_type,
                trainingTitle: formData.training_title,
                trainingDescription: formData.training_description,
                businessJustification: formData.business_justification || 'Not specified',
                skillsToGain: formData.skills_to_gain || 'Not specified',
                deliveryMethod: formData.preferred_delivery_method || 'online',
                preferredTimeframe: formData.preferred_timeframe || 'within_month',
                estimatedDuration: formData.estimated_duration || 'To be determined',
                estimatedCost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : 0,
                trainingProvider: formData.external_provider || 'Not specified',
                priority: formData.priority || 'medium',
                requestScope: formData.request_scope || 'self',
                numberOfTeamMembers: formData.request_scope === 'team' ? parseInt(formData.team_count) : 0
            };

            await trainingService.submitRequest(requestData);

            showToast.success('Your training request has been submitted successfully!', 'Success');
            setSuccess('Your training request has been submitted successfully. You will receive updates on its status.');

            setShowForm(false);
            setFormData({
                training_type: '',
                training_title: '',
                training_description: '',
                business_justification: '',
                skills_to_gain: '',
                preferred_delivery_method: '',
                preferred_timeframe: '',
                estimated_duration: '',
                estimated_cost: '',
                external_provider: '',
                priority: 'medium',
                request_scope: 'self',
                team_count: 0
            });

            await loadData();
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit training request. Please try again.';
            setError(errorMessage);
            showToast.error(errorMessage, 'Error');
            console.error('Error submitting training request:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleApproval = async (requestId, approved) => {
        if (!approved && !rejectionReason.trim()) {
            showToast.error('Rejection reason is required', 'Error');
            return;
        }

        try {
            if (approvalModal.type === 'supervisor') {
                // Call supervisor approval endpoint
                await fetch(`/api/v1/training-requests/${requestId}/supervisor-approval`, {
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
            } else if (approvalModal.type === 'hr') {
                // Call HR approval endpoint
                await fetch(`/api/v1/training-requests/${requestId}/hr-approval`, {
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
            } else if (approvalModal.type === 'final') {
                // Call final approval endpoint
                await fetch(`/api/v1/training-requests/${requestId}/final-approval`, {
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
            }

            showToast.success(`Request ${approved ? 'approved' : 'rejected'} successfully!`, 'Success');
            setApprovalModal({ open: false, requestId: null, type: null });
            setRejectionReason('');
            await loadData();
        } catch (error) {
            showToast.error('Failed to process approval: ' + error.message, 'Error');
            console.error('Error processing approval:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'bg-blue-100 text-blue-700',
            SUPERVISOR_APPROVED: 'bg-green-100 text-green-700',
            SUPERVISOR_REJECTED: 'bg-red-100 text-red-700',
            HR_APPROVED: 'bg-green-100 text-green-700',
            HR_REJECTED: 'bg-red-100 text-red-700',
            FINAL_APPROVED: 'bg-emerald-100 text-emerald-700',
            FINAL_REJECTED: 'bg-red-100 text-red-700',
            HR_REVIEWING: 'bg-yellow-100 text-yellow-700'
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

    const isApprovalRole = currentUser?.role === 'supervisor' || 
                          currentUser?.role === 'admin' || 
                          currentUser?.role === 'admin_officer' ||
                          currentUser?.role === 'hr_officer' ||
                          currentUser?.role === 'hr_manager';

    if (loading) {
        return <div className="p-8 text-center">Loading training requests...</div>;
    }

    return (
        <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-800 rounded-2xl flex items-center justify-center shadow-lg shadow-green-700/25">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Training Requests</h1>
                            <p className="text-gray-600">Request training to enhance your skills and career development</p>
                        </div>
                    </div>
                    <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white shadow-lg shadow-green-700/25">
                                <Plus className="w-4 h-4 mr-2" />
                                Request Training
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Submit Training Request</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="training_type">Training Type *</Label>
                                        <Select value={formData.training_type} onValueChange={(value) => setFormData({ ...formData, training_type: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select training type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="technical_skills">Technical Skills</SelectItem>
                                                <SelectItem value="soft_skills">Soft Skills</SelectItem>
                                                <SelectItem value="leadership">Leadership</SelectItem>
                                                <SelectItem value="compliance">Compliance</SelectItem>
                                                <SelectItem value="safety">Safety</SelectItem>
                                                <SelectItem value="software_training">Software Training</SelectItem>
                                                <SelectItem value="certification">Certification</SelectItem>
                                                <SelectItem value="professional_development">Professional Development</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority Level</Label>
                                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="request_scope">Request Scope</Label>
                                    <Select value={formData.request_scope} onValueChange={(value) => setFormData({ ...formData, request_scope: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="self">Self</SelectItem>
                                            <SelectItem value="team">Team</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.request_scope === 'team' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="team_count">Number of Team Members *</Label>
                                        <Input
                                            id="team_count"
                                            type="number"
                                            min="1"
                                            value={formData.team_count}
                                            onChange={(e) => setFormData({ ...formData, team_count: e.target.value })}
                                            placeholder="Enter number of team members"
                                            required={formData.request_scope === 'team'}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="training_title">Training Title *</Label>
                                    <Input
                                        id="training_title"
                                        value={formData.training_title}
                                        onChange={(e) => setFormData({ ...formData, training_title: e.target.value })}
                                        placeholder="e.g., Advanced Excel Training"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="training_description">Training Description *</Label>
                                    <Textarea
                                        id="training_description"
                                        value={formData.training_description}
                                        onChange={(e) => setFormData({ ...formData, training_description: e.target.value })}
                                        placeholder="Describe the training content..."
                                        className="h-24"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business_justification">Business Justification</Label>
                                    <Textarea
                                        id="business_justification"
                                        value={formData.business_justification}
                                        onChange={(e) => setFormData({ ...formData, business_justification: e.target.value })}
                                        placeholder="Explain how this benefits..."
                                        className="h-24"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="skills_to_gain">Skills to Gain</Label>
                                    <Textarea
                                        id="skills_to_gain"
                                        value={formData.skills_to_gain}
                                        onChange={(e) => setFormData({ ...formData, skills_to_gain: e.target.value })}
                                        placeholder="List expected skills..."
                                        className="h-20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="preferred_delivery_method">Delivery Method</Label>
                                        <Select value={formData.preferred_delivery_method} onValueChange={(value) => setFormData({ ...formData, preferred_delivery_method: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="online">Online</SelectItem>
                                                <SelectItem value="in_person">In-Person</SelectItem>
                                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="preferred_timeframe">Preferred Timeframe</Label>
                                        <Select value={formData.preferred_timeframe} onValueChange={(value) => setFormData({ ...formData, preferred_timeframe: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="When?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="immediate">Immediate</SelectItem>
                                                <SelectItem value="within_month">Within 1 Month</SelectItem>
                                                <SelectItem value="within_quarter">Within 3 Months</SelectItem>
                                                <SelectItem value="within_6_months">Within 6 Months</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="estimated_duration">Duration</Label>
                                        <Input
                                            id="estimated_duration"
                                            value={formData.estimated_duration}
                                            onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                                            placeholder="e.g., 8 hours"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="estimated_cost">Cost (₦)</Label>
                                        <Input
                                            id="estimated_cost"
                                            type="number"
                                            value={formData.estimated_cost}
                                            onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="external_provider">Provider</Label>
                                        <Input
                                            id="external_provider"
                                            value={formData.external_provider}
                                            onChange={(e) => setFormData({ ...formData, external_provider: e.target.value })}
                                            placeholder="e.g., Udemy"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Alerts */}
                {success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Approval Needed Section */}
                {isApprovalRole && requestsNeedingApproval.length > 0 && (
                    <Card className="bg-white/90 border-orange-200 shadow-xl shadow-orange-200/50">
                        <CardHeader>
                            <CardTitle className="text-orange-700">
                                Requests Pending Your Approval ({requestsNeedingApproval.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-orange-50">
                                            <TableHead>ID</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requestsNeedingApproval.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">{request.id?.substring(0, 8)}</TableCell>
                                                <TableCell>{request.trainingTitle || request.training_title}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(request.status)}>
                                                        {(request.status || '').replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getPriorityColor(request.priority)}>
                                                        {request.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(request.createdAt || request.created_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setApprovalModal({ open: true, requestId: request.id, type: currentUser?.role === 'hr_officer' || currentUser?.role === 'hr_manager' ? 'hr' : 'supervisor' });
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-600"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setApprovalModal({ open: true, requestId: request.id, type: currentUser?.role === 'hr_officer' || currentUser?.role === 'hr_manager' ? 'hr' : 'supervisor' });
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </TableBody>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Training Requests */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                    <CardHeader>
                        <CardTitle>Your Training Requests ({requests.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>ID</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Timeframe</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium">{request.id?.substring(0, 8)}</TableCell>
                                            <TableCell>{request.trainingTitle || request.training_title}</TableCell>
                                            <TableCell>
                                                {(request.trainingType || request.training_type || '').replace('_', ' ')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(request.status)}>
                                                    {(request.status || '').replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getPriorityColor(request.priority)}>
                                                    {request.priority || 'medium'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {(request.preferredTimeframe || request.preferred_timeframe || '').replace('_', ' ') || 'Not specified'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(request.createdAt || request.created_date).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {requests.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold mb-2">No training requests</h3>
                                <p>No requests submitted yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Approval Modal */}
            <Dialog open={approvalModal.open} onOpenChange={(open) => setApprovalModal({ ...approvalModal, open })}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRequest?.trainingTitle || 'Training Request Approval'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm text-gray-600">Status</Label>
                            <Badge className={getStatusColor(selectedRequest?.status)}>
                                {(selectedRequest?.status || '').replace('_', ' ')}
                            </Badge>
                        </div>

                        <div>
                            <Label htmlFor="rejection_reason">
                                Rejection Reason (Required if rejecting)
                            </Label>
                            <Textarea
                                id="rejection_reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="h-24 mt-2"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproval(selectedRequest.id, true)}
                            >
                                Approve
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700"
                                onClick={() => handleApproval(selectedRequest.id, false)}
                            >
                                Reject
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setApprovalModal({ open: false, requestId: null, type: null })}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
