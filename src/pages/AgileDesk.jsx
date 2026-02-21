
import React, { useState, useEffect } from "react";
import { Project, Issue, Sprint, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Layers3,
  Plus,
  Search,
  Loader2
} from "lucide-react";

import ProjectForm from "../components/agiledesk/ProjectForm";
import ProjectCard from "../components/agiledesk/ProjectCard";
import AgileDeskStats from "../components/agiledesk/AgileDeskStats";

export default function AgileDesk() {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, issuesData, sprintsData, usersData] = await Promise.all([
        Project.list('-created_date'),
        Issue.list(),
        Sprint.list(),
        User.list()
      ]);

      const stats = {};
      projectsData.forEach(project => {
        const projectIssues = issuesData.filter(issue => issue.project_id === project.id);
        const projectSprints = sprintsData.filter(sprint => sprint.project_id === project.id);
        const activeSprint = projectSprints.find(sprint => sprint.status === 'active');
        
        const totalStoryPoints = projectIssues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);
        const completedStoryPoints = projectIssues
          .filter(issue => issue.status === 'done')
          .reduce((sum, issue) => sum + (issue.story_points || 0), 0);

        stats[project.id] = {
          totalIssues: projectIssues.length,
          completedIssues: projectIssues.filter(issue => issue.status === 'done').length,
          inProgressIssues: projectIssues.filter(issue => issue.status === 'in_progress').length,
          activeSprints: projectSprints.filter(sprint => sprint.status === 'active').length,
          totalSprints: projectSprints.length,
          totalStoryPoints,
          completedStoryPoints,
          velocity: activeSprint ? activeSprint.completed_points || 0 : 0,
          epics: projectIssues.filter(issue => issue.issue_type === 'epic').length,
          bugs: projectIssues.filter(issue => issue.issue_type === 'bug').length,
          activeSprint
        };
      });

      setProjects(projectsData);
      setProjectStats(stats);
      setTeamMembers(usersData);
    } catch (error) {
      console.error('Error loading AgileDesk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (projectData) => {
    try {
      if (editingProject) {
        await Project.update(editingProject.id, projectData);
      } else {
        const newProject = {
          ...projectData,
          settings: {
            issue_types: ['epic', 'story', 'task', 'bug', 'subtask', 'improvement'],
            workflows: {
              default: ['to_do', 'in_progress', 'in_review', 'testing', 'done']
            },
          }
        };
        await Project.create(newProject);
      }
      setShowForm(false);
      setEditingProject(null);
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.key.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && project.status === activeTab;
  });

  if (loading) {
    return (
      <div className="p-8 text-center flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin rounded-full h-12 w-12 text-blue-700" />
          <p className="text-gray-600">Loading AgileDesk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Layers3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Home</h1>
              <p className="text-gray-600">Create, manage, and track all your agile projects.</p>
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
            New Project
          </Button>
        </div>

        {showForm && (
          <ProjectForm
            project={editingProject}
            teamMembers={teamMembers}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
          />
        )}

        <AgileDeskStats projects={projects} projectStats={projectStats} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <TabsList className="grid w-full lg:w-auto grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
              <TabsTrigger value="all">All Projects</TabsTrigger>
            </TabsList>
            
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  stats={projectStats[project.id] || {}}
                  onEdit={handleEdit}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm mt-6">
                <Layers3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2 text-gray-700">
                  {searchTerm ? "No projects found" : "No projects in this view"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? "Try adjusting your search criteria" 
                    : `Create your first project to get started.`
                  }
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
