import React, { useState, useEffect } from 'react';
import { Project, Issue } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AreaChart, BarChart3, Layers3, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function StatCard({ title, value, icon: Icon, color }) {
    return (
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
}

export default function Analytics() {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [projectsData, issuesData] = await Promise.all([
          Project.list('-created_date'),
          Issue.list(),
        ]);
        setProjects(projectsData);
        setIssues(issuesData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getChartData = () => {
    return projects.map(project => {
      const projectIssues = issues.filter(i => i.project_id === project.id);
      return {
        name: project.key,
        'To Do': projectIssues.filter(i => i.status === 'to_do').length,
        'In Progress': projectIssues.filter(i => i.status === 'in_progress').length,
        'Done': projectIssues.filter(i => i.status === 'done').length,
      };
    });
  };

  const totalProjects = projects.length;
  const totalIssues = issues.length;
  const doneIssues = issues.filter(i => i.status === 'done').length;
  const inProgressIssues = issues.filter(i => i.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="p-8 text-center flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
            <AreaChart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Cross-project performance and status overview.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Projects" value={totalProjects} icon={Layers3} color="text-blue-600" />
          <StatCard title="Total Issues" value={totalIssues} icon={AlertCircle} color="text-purple-600" />
          <StatCard title="Issues In Progress" value={inProgressIssues} icon={Clock} color="text-orange-600" />
          <StatCard title="Issues Completed" value={doneIssues} icon={CheckCircle} color="text-green-600" />
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle>Issue Distribution by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="To Do" stackId="a" fill="#facc15" />
                <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Done" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle>Project Reports</CardTitle>
            <p className="text-sm text-gray-500">Select a project to view its detailed report.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Methodology</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map(project => (
                    <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name} ({project.key})</TableCell>
                        <TableCell className="capitalize">{project.methodology}</TableCell>
                        <TableCell className="capitalize">{project.status}</TableCell>
                        <TableCell>
                        <Link to={createPageUrl(`AgileDeskReports?project=${project.id}`)}>
                            <Button variant="outline">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Report
                            </Button>
                        </Link>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}