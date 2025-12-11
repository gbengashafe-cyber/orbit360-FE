import React, { useState, useEffect } from 'react';
import { Goal, Feedback, CheckIn, Employee, Recognition } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, MessageSquare, Calendar, Award, TrendingUp, Users, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PerformanceDashboard({ currentUser }) {
  const [dashboardData, setDashboardData] = useState({
    goals: [],
    recentFeedback: [],
    upcomingCheckIns: [],
    recognitions: [],
    employee: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      const [employees] = await Promise.all([Employee.list()]);
      const currentEmployee = employees.find(e => e.email === currentUser.email);
      
      if (currentEmployee) {
        const [goals, feedback, checkIns, recognitions] = await Promise.all([
          Goal.filter({ employee_id: currentEmployee.id }),
          Feedback.filter({ employee_id: currentEmployee.id }),
          CheckIn.filter({ employee_id: currentEmployee.id }),
          Recognition.filter({ employee_id: currentEmployee.id })
        ]);

        setDashboardData({
          goals: goals.slice(0, 5),
          recentFeedback: feedback.slice(0, 3),
          upcomingCheckIns: checkIns.filter(c => c.status === 'scheduled').slice(0, 3),
          recognitions: recognitions.slice(0, 3),
          employee: currentEmployee
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalStatusData = () => {
    const statusCounts = dashboardData.goals.reduce((acc, goal) => {
      acc[goal.status] = (acc[goal.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const calculateOverallProgress = () => {
    if (dashboardData.goals.length === 0) return 0;
    const totalProgress = dashboardData.goals.reduce((sum, goal) => {
      if (goal.target_value && goal.current_value) {
        return sum + (goal.current_value / goal.target_value) * 100;
      }
      return sum + (goal.status === 'completed' ? 100 : goal.status === 'in_progress' ? 50 : 0);
    }, 0);
    return Math.round(totalProgress / dashboardData.goals.length);
  };

  if (loading) {
    return (
      <div className="text-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {dashboardData.employee?.first_name}! 👋
              </h2>
              <p className="text-gray-600 mt-1">
                Here's your performance overview for this quarter
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-700">{overallProgress}%</div>
              <p className="text-sm text-gray-600">Overall Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.goals.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.recentFeedback.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.upcomingCheckIns.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recognitions</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.recognitions.length}</p>
              </div>
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Goal Status Chart */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle>Goal Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getGoalStatusData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getGoalStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentFeedback.map((feedback, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{feedback.category}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{feedback.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {feedback.feedback_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {dashboardData.recentFeedback.length === 0 && (
                <p className="text-center text-gray-500 py-8">No recent feedback</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle>Current Goals Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.goals.map((goal, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  <Badge variant={goal.status === 'completed' ? 'default' : goal.status === 'in_progress' ? 'secondary' : 'outline'}>
                    {goal.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                <div className="flex items-center justify-between">
                  <Progress 
                    value={goal.target_value ? (goal.current_value / goal.target_value) * 100 : (goal.status === 'completed' ? 100 : 0)} 
                    className="flex-1 mr-4" 
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {goal.target_value ? `${goal.current_value}/${goal.target_value} ${goal.unit || ''}` : goal.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                  <span>Weight: {goal.weight}%</span>
                </div>
              </div>
            ))}
            {dashboardData.goals.length === 0 && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No goals set yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}