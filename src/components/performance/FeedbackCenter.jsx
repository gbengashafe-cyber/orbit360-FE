
import React, { useState, useEffect } from 'react';
import { Feedback, Employee, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, Star, ThumbsUp, AlertCircle, UserIcon } from 'lucide-react';

export default function FeedbackCenter({ currentUser }) {
  const [feedbacks, setFeedbacks] = useState({
    received: [],
    given: []
  });
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("received");

  const [formData, setFormData] = useState({
    employee_id: '',
    feedback_type: 'general',
    category: 'communication',
    content: '',
    rating: 3,
    is_anonymous: false,
    context: ''
  });

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [employeesData, usersData] = await Promise.all([Employee.list(), User.list()]);
      const employee = employeesData.find(e => e.email === currentUser.email);
      
      if (employee) {
        const [receivedFeedback, givenFeedback] = await Promise.all([
          Feedback.filter({ employee_id: employee.id }),
          Feedback.filter({ feedback_from: currentUser.id })
        ]);

        // Enrich feedback with employee names
        const enrichedReceived = receivedFeedback.map(fb => {
          const fromUser = usersData.find(u => u.id === fb.feedback_from);
          const fromEmployee = employeesData.find(e => e.email === fromUser?.email);
          return {
            ...fb,
            from_name: fromEmployee ? `${fromEmployee.first_name} ${fromEmployee.last_name}` : 'Anonymous'
          };
        });

        const enrichedGiven = givenFeedback.map(fb => {
          const toEmployee = employeesData.find(e => e.id === fb.employee_id);
          return {
            ...fb,
            to_name: toEmployee ? `${toEmployee.first_name} ${toEmployee.last_name}` : 'Unknown'
          };
        });

        setFeedbacks({
          received: enrichedReceived,
          given: enrichedGiven
        });
        setCurrentEmployee(employee);
      }
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await Feedback.create({
        ...formData,
        feedback_from: currentUser.id,
        rating: parseInt(formData.rating)
      });

      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      feedback_type: 'general',
      category: 'communication',
      content: '',
      rating: 3,
      is_anonymous: false,
      context: ''
    });
  };

  const getFeedbackIcon = (type) => {
    const icons = {
      praise: <ThumbsUp className="w-4 h-4 text-green-600" />,
      improvement: <AlertCircle className="w-4 h-4 text-orange-600" />,
      general: <MessageSquare className="w-4 h-4 text-blue-600" />,
      '360_review': <Star className="w-4 h-4 text-purple-600" />
    };
    return icons[type] || <MessageSquare className="w-4 h-4 text-gray-600" />;
  };

  const getFeedbackTypeColor = (type) => {
    const colors = {
      praise: 'bg-green-100 text-green-700',
      improvement: 'bg-orange-100 text-orange-700',
      general: 'bg-blue-100 text-blue-700',
      '360_review': 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center p-12">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback Center</h2>
          <p className="text-gray-600">Give and receive continuous feedback</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Give Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Give Feedback</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_id">Feedback For *</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(emp => emp.email !== currentUser.email).map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="feedback_type">Feedback Type</Label>
                  <Select value={formData.feedback_type} onValueChange={(value) => setFormData({...formData, feedback_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="praise">Praise</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="360_review">360 Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="teamwork">Teamwork</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="problem_solving">Problem Solving</SelectItem>
                      <SelectItem value="initiative">Initiative</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Select value={formData.rating.toString()} onValueChange={(value) => setFormData({...formData, rating: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Needs Improvement</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Above Average</SelectItem>
                      <SelectItem value="5">5 - Outstanding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="context">Context/Situation</Label>
                <Input
                  id="context"
                  value={formData.context}
                  onChange={(e) => setFormData({...formData, context: e.target.value})}
                  placeholder="What was the situation or project?"
                />
              </div>

              <div>
                <Label htmlFor="content">Feedback Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  placeholder="Provide specific, actionable feedback..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData({...formData, is_anonymous: e.target.checked})}
                />
                <Label htmlFor="is_anonymous">Give feedback anonymously</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send Feedback</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">Feedback Received ({feedbacks.received.length})</TabsTrigger>
          <TabsTrigger value="given">Feedback Given ({feedbacks.given.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {feedbacks.received.map((feedback) => (
            <Card key={feedback.id} className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFeedbackIcon(feedback.feedback_type)}
                    <div>
                      <h3 className="font-semibold">{feedback.category.replace('_', ' ')}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getFeedbackTypeColor(feedback.feedback_type)}>
                          {feedback.feedback_type.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {feedback.is_anonymous ? 'Anonymous' : feedback.from_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(feedback.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {feedback.context && (
                  <div className="mb-3">
                    <span className="font-medium text-sm">Context: </span>
                    <span className="text-sm text-gray-600">{feedback.context}</span>
                  </div>
                )}
                <p className="text-gray-700">{feedback.content}</p>
              </CardContent>
            </Card>
          ))}

          {feedbacks.received.length === 0 && (
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
              <CardContent className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2 text-gray-700">No feedback received yet</h3>
                <p className="text-gray-500">Your feedback will appear here as you receive it</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="given" className="space-y-4">
          {feedbacks.given.map((feedback) => (
            <Card key={feedback.id} className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFeedbackIcon(feedback.feedback_type)}
                    <div>
                      <h3 className="font-semibold">To: {feedback.to_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getFeedbackTypeColor(feedback.feedback_type)}>
                          {feedback.feedback_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{feedback.category.replace('_', ' ')}</Badge>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(feedback.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {feedback.context && (
                  <div className="mb-3">
                    <span className="font-medium text-sm">Context: </span>
                    <span className="text-sm text-gray-600">{feedback.context}</span>
                  </div>
                )}
                <p className="text-gray-700">{feedback.content}</p>
              </CardContent>
            </Card>
          ))}

          {feedbacks.given.length === 0 && (
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
              <CardContent className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2 text-gray-700">No feedback given yet</h3>
                <p className="text-gray-500 mb-4">Start giving constructive feedback to your colleagues</p>
                <Button onClick={() => { resetForm(); setShowForm(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Give First Feedback
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
