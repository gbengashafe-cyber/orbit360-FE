import { trainingService } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/utils';
import { showToast } from '@/utils/toast';
import { BookOpen, Eye, GraduationCap, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getStatusColor } from '../authorization-center/authorization-center.util';
import { RequestDeleteConfirmation } from './request-delete-confirmation';
import { TrainingRequestForm } from './training-request-form';

export default function RequestTraining() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Approval states
  const [approvalModal, setApprovalModal] = useState({
    open: false,
    requestId: null,
    type: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModal, setDetailsModal] = useState({ open: false });
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [processingAction, setProcessingAction] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await trainingService.getRequestsByEmployee();
      setRequests(response?.data);
    } catch (error) {
      logger.error({ caller: 'Error loading training requests', payload: error });
      toast.error('Error', { description: 'Failed to load your training requests. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId, approved, e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    if (!approved && !rejectionReason.trim()) {
      showToast.error('Rejection reason is required', 'Error');
      return;
    }

    if (isApproving) return; // avoid concurrent actions

    setIsApproving(true);
    setProcessingAction(approved ? 'approve' : 'reject');

    try {
      showToast.success(`Request ${approved ? 'approved' : 'rejected'} successfully!`, 'Success');
      setApprovalModal({ open: false, requestId: null, type: null });
      setRejectionReason('');
      await loadData();
    } catch (error) {
      showToast.error('Failed to process approval: ' + error.message, 'Error');
      console.error('Error processing approval:', error);
    } finally {
      setIsApproving(false);
      setProcessingAction('');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

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

          <Button
            onClick={() => setShowRequestForm(true)}
            className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white shadow-lg shadow-green-700/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Training
          </Button>
          {showRequestForm ? (
            <TrainingRequestForm
              showForm={showRequestForm}
              onOpenChange={() => {
                loadData();
                setShowRequestForm(false);
              }}
            />
          ) : null}
        </div>

        {/* All Training Requests */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Your Training Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request?.trainingTitle}</TableCell>
                      <TableCell>{request?.trainingType.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>{request.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                      </TableCell>

                      <TableCell>{new Date(request.createdAt || request.created_date).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDetailsModal({ open: true });
                          }}
                        >
                          <Eye className="w-4" />
                          View
                        </Button>

                        {request?.status.toUpperCase() === 'PENDING' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            title="Delete training request"
                            onClick={() => setRequestToDelete(request)}
                            disabled={requestToDelete?.id === request.id}
                          >
                            <Trash2 className="w-4" />
                            {requestToDelete?.id === request.id ? <Loader2 /> : null}
                          </Button>
                        ) : null}
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

      {/* Details Modal */}
      <Dialog open={detailsModal.open} onOpenChange={(open) => setDetailsModal({ ...detailsModal, open })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between w-full">
              <div>
                <DialogTitle className="text-xl md:text-2xl">{selectedRequest?.trainingTitle}</DialogTitle>
                <div className="mt-2">
                  <Badge className={getStatusColor(selectedRequest?.status)}>{selectedRequest?.status?.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div />
            </div>
          </DialogHeader>

          <div className="space-y-6 p-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {selectedRequest?.trainingType || selectedRequest?.training_type || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Priority:</strong> {selectedRequest?.priority || 'medium'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Delivery:</strong>{' '}
                    {selectedRequest?.deliveryMethod || selectedRequest?.preferred_delivery_method || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Timeframe:</strong>{' '}
                    {selectedRequest?.preferredTimeframe || selectedRequest?.preferred_timeframe || 'Not specified'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    <strong>Cost</strong>
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    ₦{selectedRequest?.estimatedCost ?? selectedRequest?.estimated_cost ?? '0'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Requested on{' '}
                    {selectedRequest
                      ? new Date(selectedRequest.createdAt || selectedRequest.created_date).toLocaleDateString()
                      : ''}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Description</Label>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                {selectedRequest?.trainingDescription || selectedRequest?.training_description || 'No description provided.'}
              </p>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Business Justification</Label>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                {selectedRequest?.businessJustification || selectedRequest?.business_justification || 'Not specified'}
              </p>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Skills to Gain</Label>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                {selectedRequest?.skillsToGain || selectedRequest?.skills_to_gain || 'Not specified'}
              </p>
            </div>

            {(selectedRequest?.status || '').toString().toUpperCase().includes('REJECT') && (
              <div className="bg-red-50 border border-red-100 p-4 rounded">
                <Label className="text-sm text-red-700">Rejection Reason</Label>
                <p className="text-sm text-red-800 mt-2 whitespace-pre-wrap">
                  {selectedRequest?.rejectionReason || selectedRequest?.rejection_reason || 'No reason provided.'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={approvalModal.open} onOpenChange={(open) => setApprovalModal({ ...approvalModal, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.trainingTitle || ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Current Status</Label>
              <Badge className={getStatusColor(selectedRequest?.status)}>
                {(selectedRequest?.status || '').replace('_', ' ')}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Type:</strong> {selectedRequest?.trainingType}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Priority:</strong> {selectedRequest?.priority}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Cost:</strong> ₦{selectedRequest?.estimatedCost}
              </p>
            </div>

            <div>
              <Label htmlFor="rejection_reason">Rejection Reason (Required only if rejecting)</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason if you're rejecting this request..."
                className="h-24 mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={(e) => handleApproval(selectedRequest.id, true, e)}
                disabled={processingAction === 'approve'}
              >
                {processingAction === 'approve' ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={(e) => handleApproval(selectedRequest.id, false, e)}
                disabled={processingAction === 'reject'}
              >
                {processingAction === 'reject' ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setApprovalModal({ open: false, requestId: null, type: null });
                  setRejectionReason('');
                }}
                disabled={processingAction !== ''}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {requestToDelete ? (
        <RequestDeleteConfirmation
          onOpenChange={() => {
            setRequestToDelete(null);
          }}
          requestToDelete={requestToDelete}
          loadData={loadData}
        />
      ) : null}
    </div>
  );
}
