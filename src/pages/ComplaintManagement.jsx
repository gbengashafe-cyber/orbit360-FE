import { complaintService } from '@/api/complaint.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useNotification } from '@/context/NotificationContext';
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStatusColor } from './authorization-center/authorization-center.util';

export default function ComplaintManagement() {
  const { addNotification } = useNotification();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    complaint_type: '',
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution_notes: '',
  });
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadComplaints();
  }, [filters]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintService.getComplaints(1, 100, filters);
      const data = response.data || response;
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading complaints:', error);
      addNotification('Failed to load complaints', 'error');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status,
      resolution_notes: complaint.resolution_notes || '',
    });
    setShowDetailsModal(true);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      if (updateData.status === 'resolved' && !updateData.resolution_notes) {
        addNotification('Resolution notes are required when marking as resolved', 'warning');
        setUpdating(false);
        return;
      }

      const payload = {
        status: updateData.status,
      };

      if (updateData.status === 'resolved') {
        // Use resolve endpoint for resolved complaints
        await complaintService.resolveComplaint(selectedComplaint.id, updateData.resolution_notes);
      } else {
        // Use update endpoint for other status changes
        await complaintService.updateComplaint(selectedComplaint.id, payload);
      }

      addNotification('Complaint updated successfully', 'success');
      setShowDetailsModal(false);
      loadComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      addNotification('Failed to update complaint', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  if (loading && complaints.length === 0) {
    return <div className="p-8 text-center">Loading complaints...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complaint Management</h1>
            <p className="text-gray-600">Review and manage staff complaints</p>
          </div>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.complaint_type} onValueChange={(value) => setFilters({ ...filters, complaint_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="discrimination">Discrimination</SelectItem>
                  <SelectItem value="safety">Workplace Safety</SelectItem>
                  <SelectItem value="wage_dispute">Wage Dispute</SelectItem>
                  <SelectItem value="working_conditions">Working Conditions</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Complaints Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Complaints ({complaints.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reported Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-8 text-gray-500">
                        No complaints found
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map((complaint) => (
                      <TableRow key={complaint.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">#{complaint.id}</TableCell>
                        <TableCell className="capitalize">{complaint.complaint_type?.replace('_', ' ')}</TableCell>
                        <TableCell>{complaint.title}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(complaint.status)}>{complaint.status?.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(complaint.severity)}>{complaint.severity}</Badge>
                        </TableCell>
                        <TableCell>{new Date(complaint.reported_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Dialog
                            open={showDetailsModal && selectedComplaint?.id === complaint.id}
                            onOpenChange={setShowDetailsModal}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(complaint)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            {selectedComplaint?.id === complaint.id && (
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Complaint Details - ID #{complaint.id}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  {/* Read-only complaint details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-semibold">Type</Label>
                                      <p className="text-sm text-gray-700 capitalize">
                                        {complaint.complaint_type?.replace('_', ' ')}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-semibold">Severity</Label>
                                      <p className="text-sm text-gray-700 capitalize">{complaint.severity}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-semibold">Title</Label>
                                    <p className="text-sm text-gray-700">{complaint.title}</p>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-semibold">Description</Label>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{complaint.description}</p>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-semibold">Reported To</Label>
                                    <p className="text-sm text-gray-700">{complaint.reported_to || 'N/A'}</p>
                                  </div>

                                  <hr />

                                  {/* Editable fields */}
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="status">Status</Label>
                                      <Select
                                        value={updateData.status}
                                        onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="open">Open</SelectItem>
                                          <SelectItem value="under_review">Under Review</SelectItem>
                                          <SelectItem value="resolved">Resolved</SelectItem>
                                          <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {updateData.status === 'resolved' && (
                                      <div>
                                        <Label htmlFor="resolution_notes">Resolution Notes *</Label>
                                        <Textarea
                                          id="resolution_notes"
                                          value={updateData.resolution_notes}
                                          onChange={(e) =>
                                            setUpdateData({
                                              ...updateData,
                                              resolution_notes: e.target.value,
                                            })
                                          }
                                          placeholder="Explain how this complaint was resolved..."
                                          rows={4}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setShowDetailsModal(false)} disabled={updating}>
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateComplaint}
                                      disabled={updating}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      {updating ? 'Updating...' : 'Update'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
