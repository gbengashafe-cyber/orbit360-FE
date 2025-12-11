
import React, { useState, useEffect } from 'react';
import { StaffComplaint } from '@/api/entities';
import { Employee, User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
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
      const [user, employees, complaintsData] = await Promise.all([
        User.me(),
        Employee.list(),
        StaffComplaint.filter({ employee_id: (await User.me()).id })
      ]);

      setCurrentUser(user);
      const employeeProfile = employees.find(e => e.email === user.email);
      setCurrentEmployee(employeeProfile);
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateComplaintId = () => {
    return 'COMP-' + Date.now().toString(36).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const complaintId = generateComplaintId();
      
      const complaintData = {
        complaint_id: complaintId,
        employee_id: currentUser.id,
        employee_name: formData.is_anonymous ? 'Anonymous' : currentEmployee?.first_name + ' ' + currentEmployee?.last_name,
        employee_email: formData.is_anonymous ? 'anonymous@company.com' : currentUser.email,
        employee_department: currentEmployee?.department || 'Unknown',
        ...formData
      };

      await StaffComplaint.create(complaintData);

      // Send notification to HR - only to registered users
      try {
        const [allUsers, hrEmployees] = await Promise.all([
          User.list(),
          Employee.filter({ department: 'hr' })
        ]);

        // Find HR users who are both employees and registered users
        const hrUsers = allUsers.filter(user => 
          hrEmployees.some(emp => emp.email === user.email)
        );

        if (hrUsers.length > 0) {
          for (const hrUser of hrUsers) {
            try {
              await SendEmail({
                to: hrUser.email,
                subject: `New Staff Complaint Submitted - ${complaintId}`,
                body: `
                  <h3>New Staff Complaint Received</h3>
                  <p><strong>Complaint ID:</strong> ${complaintId}</p>
                  <p><strong>Type:</strong> ${formData.complaint_type}</p>
                  <p><strong>Subject:</strong> ${formData.subject}</p>
                  <p><strong>Urgency:</strong> ${formData.urgency_level}</p>
                  <p><strong>Anonymous:</strong> ${formData.is_anonymous ? 'Yes' : 'No'}</p>
                  <p><strong>Submitted by:</strong> ${formData.is_anonymous ? 'Anonymous' : currentEmployee?.first_name + ' ' + currentEmployee?.last_name}</p>
                  <p><strong>Department:</strong> ${currentEmployee?.department}</p>
                  <p><strong>Description:</strong></p>
                  <p>${formData.description}</p>
                  <p>Please log in to the platform to review and handle this complaint.</p>
                `,
                from_name: "Orbit360 HR System"
              });
            } catch (emailError) {
              console.warn(`Failed to send email to ${hrUser.email}:`, emailError);
            }
          }
        } else {
          console.warn('No registered HR users found to send notifications');
        }
      } catch (emailError) {
        console.warn('Failed to send email notifications:', emailError);
        // Don't fail the whole operation if email fails
      }

      setSuccess('Your complaint has been submitted successfully. You will receive updates on its status.');
      setShowForm(false);
      setFormData({
        complaint_type: '',
        subject: '',
        description: '',
        incident_date: '',
        witnesses: '',
        urgency_level: 'medium',
        is_anonymous: false
      });
      loadData();
    } catch (error) {
      setError('Failed to submit complaint. Please try again.');
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
                    <Select value={formData.complaint_type} onValueChange={(value) => setFormData({...formData, complaint_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complaint type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="discrimination">Discrimination</SelectItem>
                        <SelectItem value="workplace_safety">Workplace Safety</SelectItem>
                        <SelectItem value="unfair_treatment">Unfair Treatment</SelectItem>
                        <SelectItem value="policy_violation">Policy Violation</SelectItem>
                        <SelectItem value="work_conditions">Work Conditions</SelectItem>
                        <SelectItem value="supervisor_conduct">Supervisor Conduct</SelectItem>
                        <SelectItem value="compensation_benefits">Compensation & Benefits</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgency_level">Urgency Level</Label>
                    <Select value={formData.urgency_level} onValueChange={(value) => setFormData({...formData, urgency_level: value})}>
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
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="witnesses">Witnesses (Optional)</Label>
                    <Input
                      id="witnesses"
                      value={formData.witnesses}
                      onChange={(e) => setFormData({...formData, witnesses: e.target.value})}
                      placeholder="Names of any witnesses"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) => setFormData({...formData, is_anonymous: checked})}
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
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Date Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">{complaint.complaint_id}</TableCell>
                      <TableCell className="capitalize">{complaint.complaint_type.replace('_', ' ')}</TableCell>
                      <TableCell>{complaint.subject}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(complaint.urgency_level)}>
                          {complaint.urgency_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(complaint.created_date).toLocaleDateString()}
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
