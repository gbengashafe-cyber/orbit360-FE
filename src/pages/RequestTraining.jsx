
import React, { useState, useEffect } from 'react';
import { TrainingRequest } from '@/api/entities';
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
import { GraduationCap, Plus, BookOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function RequestTraining() {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
    priority: 'medium'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, employees, requestsData] = await Promise.all([
        User.me(),
        Employee.list(),
        TrainingRequest.filter({ employee_id: (await User.me()).id })
      ]);

      setCurrentUser(user);
      const employeeProfile = employees.find(e => e.email === user.email);
      setCurrentEmployee(employeeProfile);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRequestId = () => {
    return 'TR-' + Date.now().toString(36).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const requestId = generateRequestId();
      
      const requestData = {
        request_id: requestId,
        employee_id: currentUser.id,
        employee_name: currentEmployee?.first_name + ' ' + currentEmployee?.last_name,
        employee_email: currentUser.email,
        employee_department: currentEmployee?.department || 'Unknown',
        employee_position: currentEmployee?.position || 'Unknown',
        ...formData
      };

      await TrainingRequest.create(requestData);

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
                subject: `New Training Request Submitted - ${requestId}`,
                body: `
                  <h3>New Training Request Received</h3>
                  <p><strong>Request ID:</strong> ${requestId}</p>
                  <p><strong>Employee:</strong> ${currentEmployee?.first_name} ${currentEmployee?.last_name}</p>
                  <p><strong>Department:</strong> ${currentEmployee?.department}</p>
                  <p><strong>Position:</strong> ${currentEmployee?.position}</p>
                  <p><strong>Training Type:</strong> ${formData.training_type}</p>
                  <p><strong>Training Title:</strong> ${formData.training_title}</p>
                  <p><strong>Priority:</strong> ${formData.priority}</p>
                  <p><strong>Preferred Timeframe:</strong> ${formData.preferred_timeframe}</p>
                  <p><strong>Estimated Cost:</strong> ${formData.estimated_cost ? '₦' + formData.estimated_cost : 'Not specified'}</p>
                  <p><strong>Business Justification:</strong></p>
                  <p>${formData.business_justification}</p>
                  <p><strong>Skills to Gain:</strong></p>
                  <p>${formData.skills_to_gain}</p>
                  <p>Please log in to the platform to review and approve this training request.</p>
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
        priority: 'medium'
      });
      loadData();
    } catch (error) {
      setError('Failed to submit training request. Please try again.');
      console.error('Error submitting training request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-700',
      supervisor_review: 'bg-yellow-100 text-yellow-700',
      hr_review: 'bg-orange-100 text-orange-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      scheduled: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-emerald-100 text-emerald-700'
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
                    <Select value={formData.training_type} onValueChange={(value) => setFormData({...formData, training_type: value})}>
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
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
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
                  <Label htmlFor="training_title">Training Title *</Label>
                  <Input
                    id="training_title"
                    value={formData.training_title}
                    onChange={(e) => setFormData({...formData, training_title: e.target.value})}
                    placeholder="e.g., Advanced Excel Training, Leadership Certification"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training_description">Training Description *</Label>
                  <Textarea
                    id="training_description"
                    value={formData.training_description}
                    onChange={(e) => setFormData({...formData, training_description: e.target.value})}
                    placeholder="Describe the training content, curriculum, and learning outcomes..."
                    className="h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_justification">Business Justification *</Label>
                  <Textarea
                    id="business_justification"
                    value={formData.business_justification}
                    onChange={(e) => setFormData({...formData, business_justification: e.target.value})}
                    placeholder="Explain how this training will benefit your role and contribute to company objectives..."
                    className="h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills_to_gain">Skills to Gain *</Label>
                  <Textarea
                    id="skills_to_gain"
                    value={formData.skills_to_gain}
                    onChange={(e) => setFormData({...formData, skills_to_gain: e.target.value})}
                    placeholder="List specific skills, knowledge, or competencies you expect to gain..."
                    className="h-20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_delivery_method">Delivery Method</Label>
                    <Select value={formData.preferred_delivery_method} onValueChange={(value) => setFormData({...formData, preferred_delivery_method: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in_person">In-Person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="self_paced">Self-Paced</SelectItem>
                        <SelectItem value="instructor_led">Instructor-Led</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferred_timeframe">Preferred Timeframe</Label>
                    <Select value={formData.preferred_timeframe} onValueChange={(value) => setFormData({...formData, preferred_timeframe: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="When would you like to complete this?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (ASAP)</SelectItem>
                        <SelectItem value="within_month">Within 1 Month</SelectItem>
                        <SelectItem value="within_quarter">Within 3 Months</SelectItem>
                        <SelectItem value="within_6_months">Within 6 Months</SelectItem>
                        <SelectItem value="within_year">Within 1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_duration">Estimated Duration</Label>
                    <Input
                      id="estimated_duration"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({...formData, estimated_duration: e.target.value})}
                      placeholder="e.g., 8 hours, 2 days, 1 week"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_cost">Estimated Cost (₦)</Label>
                    <Input
                      id="estimated_cost"
                      type="number"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="external_provider">Training Provider</Label>
                    <Input
                      id="external_provider"
                      value={formData.external_provider}
                      onChange={(e) => setFormData({...formData, external_provider: e.target.value})}
                      placeholder="e.g., Coursera, LinkedIn Learning"
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

        {/* Training Requests List */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Your Training Requests ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Request ID</TableHead>
                    <TableHead>Training Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Timeframe</TableHead>
                    <TableHead>Date Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">{request.request_id}</TableCell>
                      <TableCell>{request.training_title}</TableCell>
                      <TableCell className="capitalize">{request.training_type.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {request.preferred_timeframe?.replace('_', ' ') || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {requests.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No training requests submitted</h3>
                <p className="mb-4">You haven't submitted any training requests yet.</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Request Your First Training
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
