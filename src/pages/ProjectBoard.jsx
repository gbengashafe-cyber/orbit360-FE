import React, { useState, useEffect } from "react";
import { Project, Issue, Sprint, User } from "@/api/entities";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  FolderOpen,
  Plus,
  Filter,
  Users,
  Calendar,
  MoreHorizontal,
  Bug,
  CheckSquare,
  Circle,
  AlertTriangle,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

import IssueCard from "../components/issues/IssueCard";
import IssueForm from "../components/issues/IssueForm";
import SprintHeader from "../components/sprints/SprintHeader";

const COLUMNS = [
  { id: "to_do", title: "To Do", color: "bg-gray-100" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100" },
  { id: "in_review", title: "In Review", color: "bg-yellow-100" },
  { id: "testing", title: "Testing", color: "bg-purple-100" },
  { id: "done", title: "Done", color: "bg-green-100" }
];

export default function ProjectBoard() {
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState("active");
  const [filters, setFilters] = useState({
    assignee: "all",
    priority: "all",
    type: "all"
  });
  const [activeTab, setActiveTab] = useState("board");

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('project');
      
      if (!projectId) {
        console.error('No project ID provided');
        return;
      }

      const [projectData, issuesData, sprintsData, usersData] = await Promise.all([
        Project.list(),
        Issue.list(),
        Sprint.list(),
        User.list()
      ]);

      const currentProject = projectData.find(p => p.id === projectId);
      const projectIssues = issuesData.filter(issue => issue.project_id === projectId);
      const projectSprints = sprintsData.filter(sprint => sprint.project_id === projectId);

      setProject(currentProject);
      setIssues(projectIssues);
      setSprints(projectSprints);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    try {
      await Issue.update(draggableId, { status: destination.droppableId });
      loadProjectData();
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const handleCreateIssue = async (issueData) => {
    try {
      const issueKey = `${project.key}-${issues.length + 1}`;
      await Issue.create({
        ...issueData,
        project_id: project.id,
        issue_key: issueKey
      });
      setShowIssueForm(false);
      setEditingIssue(null);
      loadProjectData();
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  };

  const getFilteredIssues = () => {
    return issues.filter(issue => {
      const sprintFilter = selectedSprint === "all" || 
        (selectedSprint === "active" && issue.sprint_id === activeSprint?.id) ||
        (selectedSprint === "backlog" && !issue.sprint_id);
      
      const assigneeFilter = filters.assignee === "all" || issue.assignee_id === filters.assignee;
      const priorityFilter = filters.priority === "all" || issue.priority === filters.priority;
      const typeFilter = filters.type === "all" || issue.issue_type === filters.type;
      
      return sprintFilter && assigneeFilter && priorityFilter && typeFilter;
    });
  };

  const activeSprint = sprints.find(sprint => sprint.status === 'active');
  const filteredIssues = getFilteredIssues();

  if (loading) {
    return <div className="p-8 text-center">Loading project board...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600">{project.key} • {project.methodology.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowIssueForm(true)}
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Issue
            </Button>
          </div>
        </div>

        {/* Sprint Header */}
        {activeSprint && <SprintHeader sprint={activeSprint} project={project} />}

        {/* Filters and Views */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Sprint</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="all">All Issues</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.assignee} onValueChange={(value) => setFilters({...filters, assignee: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="highest">Highest</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="lowest">Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Issue Form */}
        {showIssueForm && (
          <IssueForm
            issue={editingIssue}
            project={project}
            users={users}
            sprints={sprints}
            onSubmit={handleCreateIssue}
            onCancel={() => {
              setShowIssueForm(false);
              setEditingIssue(null);
            }}
          />
        )}

        {/* Board/List Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="board">Kanban Board</TabsTrigger>
            <TabsTrigger value="list">Issue List</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {COLUMNS.map(column => (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided, snapshot) => (
                      <Card className={`${column.color} border-gray-200 shadow-lg`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-gray-700">
                            {column.title}
                            <Badge variant="secondary" className="ml-2">
                              {filteredIssues.filter(issue => issue.status === column.id).length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-3 min-h-[400px] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                        >
                          {filteredIssues
                            .filter(issue => issue.status === column.id)
                            .map((issue, index) => (
                              <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`${snapshot.isDragging ? 'rotate-2 shadow-xl' : ''}`}
                                  >
                                    <IssueCard 
                                      issue={issue} 
                                      users={users}
                                      onClick={() => {
                                        setEditingIssue(issue);
                                        setShowIssueForm(true);
                                      }}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </CardContent>
                      </Card>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Issue</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Type</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Priority</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Assignee</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Story Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.map(issue => {
                        const assignee = users.find(u => u.id === issue.assignee_id);
                        return (
                          <tr key={issue.id} className="border-b hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setEditingIssue(issue);
                                setShowIssueForm(true);
                              }}>
                            <td className="p-4">
                              <div>
                                <p className="font-semibold text-gray-900">{issue.issue_key}</p>
                                <p className="text-sm text-gray-600">{issue.summary}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{issue.issue_type}</Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                issue.priority === 'highest' ? 'bg-red-100 text-red-700' :
                                issue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }>
                                {issue.priority}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary">{issue.status.replace('_', ' ')}</Badge>
                            </td>
                            <td className="p-4">
                              {assignee ? assignee.full_name : 'Unassigned'}
                            </td>
                            <td className="p-4">
                              {issue.story_points || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                <CardHeader>
                  <CardTitle>Sprint Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Completed Issues</span>
                      <span className="font-semibold">
                        {issues.filter(i => i.status === 'done').length} / {issues.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${issues.length > 0 ? (issues.filter(i => i.status === 'done').length / issues.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                <CardHeader>
                  <CardTitle>Issue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['epic', 'story', 'task', 'bug'].map(type => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}s</span>
                        <span className="font-semibold">
                          {issues.filter(i => i.issue_type === type).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}