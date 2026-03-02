import { Issue, Project, Sprint } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { BarChart3, FolderOpen, MoreHorizontal, Plus, Search, Settings, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import ProjectForm from '../components/projects/ProjectForm';
import { getStatusColor } from './authorization-center/authorization-center.util';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const [projectsData, issuesData, sprintsData] = await Promise.all([
        Project.list('-created_date'),
        Issue.list(),
        Sprint.list(),
      ]);

      // Calculate stats for each project
      const stats = {};
      projectsData.forEach((project) => {
        const projectIssues = issuesData.filter((issue) => issue.project_id === project.id);
        const projectSprints = sprintsData.filter((sprint) => sprint.project_id === project.id);

        stats[project.id] = {
          totalIssues: projectIssues.length,
          completedIssues: projectIssues.filter((issue) => issue.status === 'done').length,
          activeSprints: projectSprints.filter((sprint) => sprint.status === 'active').length,
          totalSprints: projectSprints.length,
        };
      });

      setProjects(projectsData);
      setProjectStats(stats);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (projectData) => {
    try {
      if (editingProject) {
        await Project.update(editingProject.id, projectData);
      } else {
        await Project.create(projectData);
      }
      setShowForm(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const getMethodologyColor = (methodology) => {
    const colors = {
      scrum: 'bg-blue-100 text-blue-700',
      kanban: 'bg-purple-100 text-purple-700',
      waterfall: 'bg-orange-100 text-orange-700',
      hybrid: 'bg-indigo-100 text-indigo-700',
    };
    return colors[methodology] || 'bg-gray-100 text-gray-700';
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.key.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return <div className="p-8 text-center">Loading projects...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600">Manage your project portfolio</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Project Form */}
        {showForm && (
          <ProjectForm
            project={editingProject}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
          />
        )}

        {/* Search and Filter */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const stats = projectStats[project.id] || {};
            const completionRate = stats.totalIssues > 0 ? Math.round((stats.completedIssues / stats.totalIssues) * 100) : 0;

            return (
              <Card
                key={project.id}
                className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-shadow"
              >
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">
                          <Link
                            to={createPageUrl(`ProjectBoard?project=${project.id}`)}
                            className="hover:text-blue-700 transition-colors"
                          >
                            {project.name}
                          </Link>
                        </CardTitle>
                        <p className="text-sm text-gray-500">{project.key}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(project)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          Manage Team
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Reports
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description || 'No description provided'}</p>

                    <div className="flex gap-2">
                      <Badge className={getStatusColor(project.status)}>{project.status.replace('_', ' ')}</Badge>
                      <Badge className={getMethodologyColor(project.methodology)}>{project.methodology}</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalIssues || 0}</div>
                        <div className="text-xs text-gray-500">Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.activeSprints || 0}</div>
                        <div className="text-xs text-gray-500">Active Sprints</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2 text-gray-700">{searchTerm ? 'No projects found' : 'No projects yet'}</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Create your first project to get started with issue tracking and sprint management'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
