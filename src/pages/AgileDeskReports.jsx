import { Issue, Project, Sprint } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ArrowDown, CheckCircle, ChevronLeft, GitBranch, Loader2, Target, XCircle, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AgileDeskReports() {
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('project');

  const loadReportData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [allProjects, allIssues, allSprints] = await Promise.all([
        Project.list({ id: projectId }),
        Issue.list({ project_id: projectId }),
        Sprint.list({ project_id: projectId }),
      ]);

      const currentProject = allProjects[0];
      const projectSprints = allSprints.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

      setProject(currentProject);
      setIssues(allIssues);
      setSprints(projectSprints);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const getVelocityData = () => {
    return sprints
      .filter((s) => s.status === 'closed')
      .map((s) => ({
        name: s.name,
        Committed: s.committed_points || 0,
        Completed: s.completed_points || 0,
      }));
  };

  const getStatusDistributionData = () => {
    const statusCounts = issues.reduce((acc, issue) => {
      const status = issue.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const getBurndownData = () => {
    const activeSprint = sprints.find((s) => s.status === 'active');
    if (!activeSprint) return [];

    const sprintIssues = issues.filter((i) => i.sprint_id === activeSprint.id);
    let remainingPoints = sprintIssues.reduce((sum, i) => sum + (i.story_points || 0), 0);

    const startDate = new Date(activeSprint.start_date);
    const endDate = new Date(activeSprint.end_date);
    // const today = new Date(); // This variable was declared but not used.

    // Initialize burndown with the total points at the start date
    let burndown = [{ day: format(startDate, 'MMM d'), remaining: remainingPoints }];

    // Aggregate points removed by resolved issues
    sprintIssues
      .filter((i) => i.resolution_date)
      .forEach((i) => {
        const resolutionDate = new Date(i.resolution_date);
        // Only consider issues resolved within the sprint timeframe
        if (resolutionDate >= startDate && resolutionDate <= endDate) {
          // Subtract points for each resolved issue
          remainingPoints -= i.story_points || 0;
          // Add a data point for each resolution, ensuring order
          burndown.push({ day: format(resolutionDate, 'MMM d'), remaining: remainingPoints });
        }
      });

    // Sort burndown data by day to ensure correct charting order
    burndown.sort((a, b) => new Date(a.day) - new Date(b.day));

    // Ensure there's a data point for the end of the sprint if no issues were resolved on the last day,
    // to show the total remaining points
    if (burndown.length > 0 && new Date(burndown[burndown.length - 1].day).getTime() < endDate.getTime()) {
      burndown.push({ day: format(endDate, 'MMM d'), remaining: burndown[burndown.length - 1].remaining });
    }

    // Add a theoretical ideal burndown line later if needed. For now, just actual.

    return burndown;
  };

  const getLastClosedSprint = () => {
    return sprints.filter((s) => s.status === 'closed').sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
  };

  const lastSprint = getLastClosedSprint();
  const lastSprintIssues = lastSprint ? issues.filter((i) => i.sprint_id === lastSprint.id) : [];

  if (loading) {
    return (
      <div className="p-8 text-center flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found or reports could not be generated.</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl(`AgileDeskBoard?project=${projectId}`)}>
            <Button variant="outline" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports: {project.name}</h1>
            <p className="text-gray-600">Analytics and insights for your project's performance.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-700" />
                Team Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getVelocityData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Committed" fill="#8884d8" />
                  <Bar dataKey="Completed" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-700" />
                Issue Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusDistributionData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {getStatusDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDown className="w-5 h-5 text-blue-700" />
                Sprint Burndown Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getBurndownData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="remaining" stroke="#8884d8" name="Remaining SP" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {lastSprint && (
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-700" />
                Sprint Report: {lastSprint.name}
              </CardTitle>
              <p className="text-sm text-gray-500">{lastSprint.goal}</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Story Points</TableHead>
                      <TableHead>Final Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastSprintIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>{issue.issue_key}</TableCell>
                        <TableCell>{issue.summary}</TableCell>
                        <TableCell>{issue.story_points || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={issue.status === 'done' ? 'default' : 'destructive'}
                            className={issue.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                          >
                            {issue.status === 'done' ? (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            {issue.status === 'done' ? 'Completed' : 'Not Completed'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
