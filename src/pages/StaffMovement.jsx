import React, { useState, useEffect } from 'react';
import { User, Employee, RedeploymentRequest, NewStaffRequest } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shuffle, UserPlus, Send, CheckCircle, XCircle, ShieldOff, Clock } from 'lucide-react';

export default function StaffMovement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [employees, setEmployees] = useState([]);
  const [redeploymentData, setRedeploymentData] = useState({ employee_id: '', proposed_department: '', proposed_role: '', reason_for_redeployment: '', effective_date: '' });
  const [newStaffData, setNewStaffData] = useState({ department: '', job_title: '', employment_type: 'full_time', justification: '', required_skills: '', proposed_start_date: '' });

  // History states
  const [redeploymentHistory, setRedeploymentHistory] = useState([]);
  const [newStaffHistory, setNewStaffHistory] = useState([]);

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        const userIsAuthorized = user.permissions?.includes('request_staff_movement');
        setIsAuthorized(userIsAuthorized);

        if (userIsAuthorized) {
          const [employeesData, redeployHistory, newStaffHistoryData] = await Promise.all([
            Employee.list(),
            RedeploymentRequest.filter({ requesting_manager_id: user.id }),
            NewStaffRequest.filter({ requesting_manager_id: user.id }),
          ]);
          setEmployees(employeesData.filter(e => e.employment_status === 'active'));
          setRedeploymentHistory(redeployHistory);
          setNewStaffHistory(newStaffHistoryData);
        }
      } catch (err) {
        setError('Failed to load initial data. Please try refreshing the page.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const getHRUserEmails = async () => {
    try {
      const hrUsers = await User.filter({ role: 'human_resources_manager' });
      return hrUsers.map(user => user.email).filter(Boolean);
    } catch (err) {
      console.error("Could not fetch HR user emails:", err);
      return [];
    }
  };

  const handleRedeploymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const selectedEmployee = employees.find(emp => emp.id === redeploymentData.employee_id);
      if (!selectedEmployee) {
        throw new Error("Selected employee not found.");
      }

      const requestPayload = {
        ...redeploymentData,
        employee_name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        current_department: selectedEmployee.department,
        current_role: selectedEmployee.position,
        requesting_manager_id: currentUser.id,
        requesting_manager_name: currentUser.full_name,
      };

      await RedeploymentRequest.create(requestPayload);
      
      const hrEmails = await getHRUserEmails();
      if (hrEmails.length > 0) {
        for (const email of hrEmails) {
            await SendEmail({
                to: email,
                subject: `Staff Redeployment Request: ${requestPayload.employee_name}`,
                body: `
                    <p>A new staff redeployment request has been submitted by ${currentUser.full_name}.</p>
                    <p><strong>Employee:</strong> ${requestPayload.employee_name}</p>
                    <p><strong>From:</strong> ${requestPayload.current_department} - ${requestPayload.current_role}</p>
                    <p><strong>To:</strong> ${requestPayload.proposed_department} - ${requestPayload.proposed_role}</p>
                    <p><strong>Reason:</strong> ${requestPayload.reason_for_redeployment}</p>
                    <p>Please log in to the platform to review and process this request.</p>
                `,
                from_name: "Orbit360 HR System",
            });
        }
      }

      setSuccess('Redeployment request submitted successfully.');
      setRedeploymentData({ employee_id: '', proposed_department: '', proposed_role: '', reason_for_redeployment: '', effective_date: '' });
      const updatedHistory = await RedeploymentRequest.filter({ requesting_manager_id: currentUser.id });
      setRedeploymentHistory(updatedHistory);

    } catch (err) {
      setError('Failed to submit request. Please check your input and try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewStaffSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const requestPayload = {
        ...newStaffData,
        requesting_manager_id: currentUser.id,
        requesting_manager_name: currentUser.full_name,
      };
      
      await NewStaffRequest.create(requestPayload);
      
      const hrEmails = await getHRUserEmails();
      if (hrEmails.length > 0) {
          for (const email of hrEmails) {
              await SendEmail({
                  to: email,
                  subject: `New Staff Request: ${requestPayload.job_title}`,
                  body: `
                      <p>A new staff request has been submitted by ${currentUser.full_name}.</p>
                      <p><strong>Department:</strong> ${requestPayload.department}</p>
                      <p><strong>Job Title:</strong> ${requestPayload.job_title}</p>
                      <p><strong>Justification:</strong> ${requestPayload.justification}</p>
                      <p>Please log in to the platform to review and process this request.</p>
                  `,
                  from_name: "Orbit360 HR System",
              });
          }
      }

      setSuccess('New staff request submitted successfully.');
      setNewStaffData({ department: '', job_title: '', employment_type: 'full_time', justification: '', required_skills: '', proposed_start_date: '' });
      const updatedHistory = await NewStaffRequest.filter({ requesting_manager_id: currentUser.id });
      setNewStaffHistory(updatedHistory);

    } catch (err) {
      setError('Failed to submit request. Please check your input and try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_hr_approval: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" />, text: 'Pending HR Approval' },
      approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" />, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" />, text: 'Rejected' },
      position_filled: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-3 h-3" />, text: 'Position Filled' },
    };
    const config = statusMap[status] || { color: 'bg-gray-100 text-gray-700', text: status };
    return <Badge className={`${config.color} flex items-center gap-1.5`}>{config.icon}{config.text}</Badge>;
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div></div>;
  }

  if (!isAuthorized) {
    return (
      <div className="p-4 lg:p-8 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <Alert variant="destructive" className="max-w-md text-center">
          <ShieldOff className="h-6 w-6 mx-auto mb-2" />
          <AlertTitle className="text-xl font-bold">Access Denied</AlertTitle>
          <AlertDescription>
            You do not have the required permissions to access this page. Please contact an administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <Shuffle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Movement Requests</h1>
            <p className="text-gray-600">Request to redeploy existing staff or hire new talent.</p>
          </div>
        </div>

        {success && <Alert className="border-green-200 bg-green-50"><CheckCircle className="h-4 w-4" /><AlertDescription className="text-green-700">{success}</AlertDescription></Alert>}
        {error && <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        <Tabs defaultValue="redeployment" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
            <TabsTrigger value="redeployment"><Shuffle className="w-4 h-4 mr-2" />Request Redeployment</TabsTrigger>
            <TabsTrigger value="new_staff"><UserPlus className="w-4 h-4 mr-2" />Request New Staff</TabsTrigger>
          </TabsList>
          
          <TabsContent value="redeployment">
            <Card className="shadow-xl shadow-gray-200/50">
              <CardHeader><CardTitle>Submit a Staff Redeployment Request</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleRedeploymentSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee to Redeploy</Label>
                      <Select value={redeploymentData.employee_id} onValueChange={(value) => setRedeploymentData({ ...redeploymentData, employee_id: value })} required>
                        <SelectTrigger><SelectValue placeholder="Select an employee..." /></SelectTrigger>
                        <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.position})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effective_date">Proposed Effective Date</Label>
                      <Input id="effective_date" type="date" value={redeploymentData.effective_date} onChange={(e) => setRedeploymentData({ ...redeploymentData, effective_date: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="proposed_department">Proposed New Department</Label>
                      <Select value={redeploymentData.proposed_department} onValueChange={(value) => setRedeploymentData({ ...redeploymentData, proposed_department: value })} required>
                        <SelectTrigger><SelectValue placeholder="Select a department..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="it">Information Technology</SelectItem>
                          <SelectItem value="admin">Administration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposed_role">Proposed New Role / Job Title</Label>
                      <Input id="proposed_role" value={redeploymentData.proposed_role} onChange={(e) => setRedeploymentData({ ...redeploymentData, proposed_role: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason_for_redeployment">Reason & Justification</Label>
                    <Textarea id="reason_for_redeployment" value={redeploymentData.reason_for_redeployment} onChange={(e) => setRedeploymentData({ ...redeploymentData, reason_for_redeployment: e.target.value })} required placeholder="Explain why this move is necessary and how it benefits the company and/or the employee..." />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-blue-700 to-blue-800 text-white"><Send className="w-4 h-4 mr-2" />{submitting ? 'Submitting...' : 'Submit Request'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card className="mt-8 shadow-xl shadow-gray-200/50">
                <CardHeader><CardTitle>Your Redeployment Request History</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Effective Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {redeploymentHistory.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.employee_name}</TableCell>
                                    <TableCell>{req.current_department} - {req.current_role}</TableCell>
                                    <TableCell>{req.proposed_department} - {req.proposed_role}</TableCell>
                                    <TableCell>{new Date(req.effective_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                </TableRow>
                            ))}
                            {redeploymentHistory.length === 0 && <TableRow><TableCell colSpan="5" className="text-center">No requests found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new_staff">
            <Card className="shadow-xl shadow-gray-200/50">
              <CardHeader><CardTitle>Submit a New Staff Request</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleNewStaffSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={newStaffData.department} onValueChange={(value) => setNewStaffData({ ...newStaffData, department: value })} required>
                        <SelectTrigger><SelectValue placeholder="Select a department..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="it">Information Technology</SelectItem>
                          <SelectItem value="admin">Administration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input id="job_title" value={newStaffData.job_title} onChange={(e) => setNewStaffData({ ...newStaffData, job_title: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="employment_type">Employment Type</Label>
                        <Select value={newStaffData.employment_type} onValueChange={(value) => setNewStaffData({ ...newStaffData, employment_type: value })} required>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full-Time</SelectItem>
                            <SelectItem value="part_time">Part-Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposed_start_date">Proposed Start Date</Label>
                      <Input id="proposed_start_date" type="date" value={newStaffData.proposed_start_date} onChange={(e) => setNewStaffData({ ...newStaffData, proposed_start_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="required_skills">Required Skills & Qualifications</Label>
                    <Textarea id="required_skills" value={newStaffData.required_skills} onChange={(e) => setNewStaffData({ ...newStaffData, required_skills: e.target.value })} required placeholder="List key skills, experience, and qualifications..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="justification">Business Justification</Label>
                    <Textarea id="justification" value={newStaffData.justification} onChange={(e) => setNewStaffData({ ...newStaffData, justification: e.target.value })} required placeholder="Explain why this role is needed now, its impact on team/company goals, and consequences of not hiring..." />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-blue-700 to-blue-800 text-white"><Send className="w-4 h-4 mr-2" />{submitting ? 'Submitting...' : 'Submit Request'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card className="mt-8 shadow-xl shadow-gray-200/50">
              <CardHeader><CardTitle>Your New Staff Request History</CardTitle></CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader><TableRow><TableHead>Job Title</TableHead><TableHead>Department</TableHead><TableHead>Date Requested</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {newStaffHistory.map(req => (
                              <TableRow key={req.id}>
                                  <TableCell>{req.job_title}</TableCell>
                                  <TableCell className="capitalize">{req.department}</TableCell>
                                  <TableCell>{new Date(req.created_date).toLocaleDateString()}</TableCell>
                                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                              </TableRow>
                          ))}
                          {newStaffHistory.length === 0 && <TableRow><TableCell colSpan="4" className="text-center">No requests found.</TableCell></TableRow>}
                      </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}