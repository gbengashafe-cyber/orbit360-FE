import React, { useState, useEffect } from 'react';
import { MeetingMinutes, User } from '@/api/entities';
import { UploadFile, SendEmail, InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Upload, Send, FileText, Plus, Loader2, Sparkles, Users, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MeetingManager() {
  const [meetings, setMeetings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    meeting_title: '',
    meeting_date: '',
    meeting_time: '',
    meeting_type: 'team_meeting',
    attendees: [''],
    agenda_items: [''],
    minutes_content: '',
    action_items: [{ task: '', assignee: '', due_date: '' }],
    decisions_made: [''],
    next_meeting_date: '',
    file_url: ''
  });

  const [emailForm, setEmailForm] = useState({
    meeting_title: '',
    meeting_date: '',
    meeting_time: '',
    attendees: [''],
    agenda: '',
    meeting_purpose: '',
    generated_content: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meetingsData, userData] = await Promise.all([
        MeetingMinutes.list('-meeting_date'),
        User.me()
      ]);
      setMeetings(meetingsData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading meeting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setUploadForm(prev => ({ ...prev, file_url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const addArrayField = (field, emptyValue = '') => {
    setUploadForm(prev => ({
      ...prev,
      [field]: [...prev[field], emptyValue]
    }));
  };

  const updateArrayField = (field, index, value) => {
    setUploadForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayField = (field, index) => {
    setUploadForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmitMinutes = async (e) => {
    e.preventDefault();
    try {
      const processedData = {
        ...uploadForm,
        attendees: uploadForm.attendees.filter(a => a.trim()),
        agenda_items: uploadForm.agenda_items.filter(a => a.trim()),
        decisions_made: uploadForm.decisions_made.filter(d => d.trim()),
        action_items: uploadForm.action_items.filter(item => item.task.trim()),
        uploaded_by: currentUser.email,
        status: 'draft'
      };

      await MeetingMinutes.create(processedData);
      alert('Meeting minutes uploaded successfully!');
      setShowUploadDialog(false);
      resetUploadForm();
      loadData();
    } catch (error) {
      console.error('Error submitting meeting minutes:', error);
      alert('Failed to submit meeting minutes. Please try again.');
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      meeting_title: '',
      meeting_date: '',
      meeting_time: '',
      meeting_type: 'team_meeting',
      attendees: [''],
      agenda_items: [''],
      minutes_content: '',
      action_items: [{ task: '', assignee: '', due_date: '' }],
      decisions_made: [''],
      next_meeting_date: '',
      file_url: ''
    });
  };

  const generateMeetingEmail = async () => {
    setGeneratingEmail(true);
    try {
      const attendeesList = emailForm.attendees.filter(a => a.trim()).join(', ');
      
      const prompt = `Generate a professional meeting invitation email with the following details:
      
Meeting Title: ${emailForm.meeting_title}
Date: ${emailForm.meeting_date}
Time: ${emailForm.meeting_time}
Attendees: ${attendeesList}
Meeting Purpose: ${emailForm.meeting_purpose}
Agenda: ${emailForm.agenda}

Please create a warm, professional email that:
1. Has a clear subject line
2. Includes all meeting details
3. Lists the agenda items clearly
4. Asks for confirmation of attendance
5. Includes dial-in information placeholder
6. Has a professional closing
7. Uses a friendly but business-appropriate tone

Format it as a complete email with subject and body.`;

      const response = await InvokeLLM({ prompt });
      if (response) {
        setEmailForm(prev => ({ ...prev, generated_content: response }));
      }
    } catch (error) {
      console.error('Error generating email:', error);
      alert('Failed to generate email. Please try again.');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const sendGeneratedEmail = async () => {
    try {
      const attendeeEmails = emailForm.attendees.filter(email => email.trim() && email.includes('@'));
      
      if (attendeeEmails.length === 0) {
        alert('Please add valid email addresses for attendees.');
        return;
      }

      const emailLines = emailForm.generated_content.split('\n');
      const subject = emailLines.find(line => line.toLowerCase().includes('subject:'))?.replace(/subject:\s*/i, '') || `Meeting Invitation: ${emailForm.meeting_title}`;
      const bodyStart = emailLines.findIndex(line => line.toLowerCase().includes('subject:')) + 1;
      const body = emailLines.slice(bodyStart).join('\n').trim();

      for (const email of attendeeEmails) {
        await SendEmail({
          to: email,
          subject: subject,
          body: body,
          from_name: currentUser.full_name || "Meeting Organizer"
        });
      }

      alert(`Meeting invitation sent successfully to ${attendeeEmails.length} attendee(s)!`);
      setShowEmailDialog(false);
      setEmailForm({
        meeting_title: '',
        meeting_date: '',
        meeting_time: '',
        attendees: [''],
        agenda: '',
        meeting_purpose: '',
        generated_content: ''
      });
    } catch (error) {
      console.error('Error sending meeting emails:', error);
      alert('Failed to send meeting invitations. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      distributed: 'bg-blue-100 text-blue-700'
    };
    return <Badge className={colors[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meeting Manager</h1>
              <p className="text-gray-600">Upload meeting minutes and schedule meetings with AI assistance.</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="minutes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="minutes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Meeting Minutes
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Schedule Meetings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="minutes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Meeting Minutes</h2>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Minutes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Upload Meeting Minutes</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitMinutes} className="space-y-6 p-4">
                    {/* ... upload form content ... */}
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Meeting Minutes Table */}
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Meeting Details</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map(meeting => (
                      <TableRow key={meeting.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{meeting.meeting_title}</p>
                            {meeting.file_url && (
                              <a 
                                href={meeting.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Document
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{format(new Date(meeting.meeting_date), 'MMM dd, yyyy')}</p>
                            <p className="text-sm text-gray-500">{meeting.meeting_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {meeting.meeting_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{meeting.attendees?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {meeting.uploaded_by}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {meetings.length === 0 && (
                  <div className="text-center p-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold">No Meeting Minutes</h3>
                    <p>Upload your first meeting minutes to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {/* AI Meeting Scheduler */}
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Meeting Scheduler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Send className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Schedule Meetings with AI</h3>
                  <p className="text-gray-500 mb-6">
                    Use AI to generate professional meeting invitations and send them to attendees.
                  </p>
                  <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Meeting Invitation
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>AI Meeting Scheduler</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 p-4">
                        {/* ... email generation form ... */}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}