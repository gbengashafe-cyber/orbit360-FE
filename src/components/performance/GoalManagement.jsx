import React, { useState, useEffect } from 'react';
import { Goal, Employee } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Target, Plus, Edit, Trash2, Calendar, TrendingUp } from 'lucide-react';

export default function GoalManagement({ currentUser }) {
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'individual',
    category: 'performance',
    priority: 'medium',
    weight: 20,
    target_value: '',
    unit: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    key_results: ['']
  });

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [employeesData] = await Promise.all([Employee.list()]);
      const employee = employeesData.find(e => e.email === currentUser.email);
      
      if (employee) {
        const goalsData = await Goal.filter({ employee_id: employee.id });
        setGoals(goalsData);
        setCurrentEmployee(employee);
      }
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const goalData = {
        ...formData,
        employee_id: currentEmployee.id,
        target_value: parseFloat(formData.target_value) || 0,
        weight: parseFloat(formData.weight) || 0,
        current_value: 0,
        status: 'not_started'
      };

      if (editingGoal) {
        await Goal.update(editingGoal.id, goalData);
      } else {
        await Goal.create(goalData);
      }

      setShowForm(false);
      setEditingGoal(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      ...goal,
      start_date: goal.start_date || new Date().toISOString().split('T')[0],
      key_results: goal.key_results || ['']
    });
    setShowForm(true);
  };

  const handleDelete = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await Goal.delete(goalId);
        loadData();
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const updateGoalProgress = async (goalId, newValue) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      const newStatus = newValue >= goal.target_value ? 'completed' : newValue > 0 ? 'in_progress' : 'not_started';
      
      await Goal.update(goalId, { 
        current_value: newValue,
        status: newStatus
      });
      loadData();
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      goal_type: 'individual',
      category: 'performance',
      priority: 'medium',
      weight: 20,
      target_value: '',
      unit: '',
      start_date: new Date().toISOString().split('T')[0],
      due_date: '',
      key_results: ['']
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center p-12">Loading goals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goal Management</h2>
          <p className="text-gray-600">Set and track your performance objectives</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingGoal(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Goal Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="goal_type">Goal Type</Label>
                  <Select value={formData.goal_type} onValueChange={(value) => setFormData({...formData, goal_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="okr">OKR</SelectItem>
                      <SelectItem value="kpi">KPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
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
                <div>
                  <Label htmlFor="weight">Weight (%)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="%, $, hours, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              {formData.goal_type === 'okr' && (
                <div>
                  <Label>Key Results</Label>
                  {formData.key_results.map((result, index) => (
                    <Input
                      key={index}
                      value={result}
                      onChange={(e) => {
                        const newResults = [...formData.key_results];
                        newResults[index] = e.target.value;
                        setFormData({...formData, key_results: newResults});
                      }}
                      placeholder={`Key Result ${index + 1}`}
                      className="mt-2"
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setFormData({...formData, key_results: [...formData.key_results, '']})}
                  >
                    Add Key Result
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      <div className="grid gap-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    {goal.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{goal.category}</Badge>
                    <Badge variant="outline">{goal.priority} priority</Badge>
                    <Badge variant="outline">{goal.weight}% weight</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{goal.description}</p>
              
              {goal.target_value > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-600">
                      {goal.current_value}/{goal.target_value} {goal.unit}
                    </span>
                  </div>
                  <Progress value={(goal.current_value / goal.target_value) * 100} className="mb-2" />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Update progress"
                      className="max-w-32"
                      onBlur={(e) => {
                        if (e.target.value && parseFloat(e.target.value) !== goal.current_value) {
                          updateGoalProgress(goal.id, parseFloat(e.target.value));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-500 self-center">{goal.unit}</span>
                  </div>
                </div>
              )}

              {goal.key_results && goal.key_results.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Key Results:</h4>
                  <ul className="space-y-1">
                    {goal.key_results.map((result, index) => (
                      <li key={index} className="text-sm text-gray-600">• {result}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                <span>Created: {new Date(goal.created_date).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {goals.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
            <CardContent className="text-center py-12">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2 text-gray-700">No goals set yet</h3>
              <p className="text-gray-500 mb-4">Create your first performance goal to get started</p>
              <Button onClick={() => { setEditingGoal(null); resetForm(); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}