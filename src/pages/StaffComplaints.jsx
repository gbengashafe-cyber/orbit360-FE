
import React, { useState, useEffect } from 'react';
import { complaintService } from '@/api/complaint.service';
import { apiClient, apiRoutes } from '@/api';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
import { FileText, Plus, AlertTriangle, Clock, CheckCircle, Upload } from 'lucide-react';

export default function StaffComplaints() {
  const { addNotification } = useNotification();
  const [complaints, setComplaints] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        complaint_type: '',
        subject: '',
        description: '',
        incident_date: '',
        witnesses: '',
        urgency_level: 'medium',
        is_anonymous: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
      setLoading(true);
      try {
        // Get current user
        const userResponse = await apiClient.get('/auth/me');
        const user = userResponse.data?.data || userResponse.data;
        setCurrentUser(user);

        // Get complaints
        const response = await apiClient.get(apiRoutes.GetComplaints);
        const complaintsData = response.data?.data || response.data || [];
        setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!formData.complaint_type || !formData.subject || !formData.description) {
                setError('Please fill in all required fields');
                setSubmitting(false);
                return;
            }

            const complaintData = {
              employee_id: currentUser?.id,
              complaint_type: formData.complaint_type,
              title: formData.subject,
              description: formData.description,
              severity: formData.urgency_level,
              reported_to: 'HR Department',
            };

            const response = await complaintService.createComplaint(complaintData);

            addNotification('Your complaint has been submitted successfully. You will receive updates on its status.', 'success');
            setShowForm(false);
            setFormData({
                complaint_type: '',
                subject: '',
                description: '',
                incident_date: '',
                witnesses: '',
                urgency_level: 'medium',
                is_anonymous: false,
            });
            loadData();
        } catch (error) {
          addNotification('Failed to submit complaint. Please try again.', 'error');
          console.error('Error submitting complaint:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-blue-100 text-blue-700',
            under_review: 'bg-yellow-100 text-yellow-700',
            investigating: 'bg-orange-100 text-orange-700',
            resolved: 'bg-green-100 text-green-700',
            closed: 'bg-gray-100 text-gray-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getUrgencyColor = (urgency) => {
        const colors = {
            low: 'bg-green-100 text-green-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            critical: 'bg-red-100 text-red-700'
        };
        return colors[urgency] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return <div className="p-8 text-center">Loading complaints...</div>;
    }

    return (
        <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-800 rounded-2xl flex items-center justify-center shadow-lg shadow-red-700/25">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Staff Complaints</h1>
                            <p className="text-gray-600">Submit and track workplace complaints confidentially</p>
                        </div>
                    </div>
                    <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-lg shadow-red-700/25">
                                <Plus className="w-4 h-4 mr-2" />
                                Submit Complaint
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Submit a Staff Complaint</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="complaint_type">Complaint Type *</Label>
                                        <Select value={formData.complaint_type} onValueChange={(value) => setFormData({ ...formData, complaint_type: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select complaint type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="harassment">Harassment</SelectItem>
                                                <SelectItem value="discrimination">Discrimination</SelectItem>
                                                <SelectItem value="safety">Workplace Safety</SelectItem>
                                                <SelectItem value="wage_dispute">Wage Dispute</SelectItem>
                                                <SelectItem value="working_conditions">Working Conditions</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="urgency_level">Urgency Level</Label>
                                        <Select value={formData.urgency_level} onValueChange={(value) => setFormData({ ...formData, urgency_level: value })}>
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
                                    <Label htmlFor="subject">Subject *</Label>
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Brief description of the issue"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Detailed Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Please provide a detailed description of the complaint including what happened, when, where, and who was involved..."
                                        className="h-32"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="incident_date">Incident Date</Label>
                                        <Input
                                            id="incident_date"
                                            type="date"
                                            value={formData.incident_date}
                                            onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="witnesses">Witnesses (Optional)</Label>
                                        <Input
                                            id="witnesses"
                                            value={formData.witnesses}
                                            onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                                            placeholder="Names of any witnesses"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="anonymous"
                                        checked={formData.is_anonymous}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                                    />
                                    <Label htmlFor="anonymous" className="text-sm">
                                        Submit this complaint anonymously
                                    </Label>
                                </div>

                                {formData.is_anonymous && (
                                    <Alert>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            Anonymous complaints may take longer to investigate as we cannot contact you directly for clarification.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700">
                                        {submitting ? 'Submitting...' : 'Submit Complaint'}
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

                {/* Complaints List */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                    <CardHeader>
                        <CardTitle>Your Complaints ({complaints.length})</CardTitle>
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
                                        <TableHead>Date Reported</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {complaints.map((complaint) => (
                                        <TableRow key={complaint.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-medium">#{complaint.id}</TableCell>
                                            <TableCell className="capitalize">{complaint.complaint_type?.replace('_', ' ')}</TableCell>
                                            <TableCell>{complaint.title}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(complaint.status)}>
                                                    {complaint.status?.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getUrgencyColor(complaint.severity)}>
                                                    {complaint.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(complaint.reported_date).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {complaints.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold mb-2">No complaints submitted</h3>
                                <p className="mb-4">You haven't submitted any complaints yet.</p>
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Submit Your First Complaint
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
