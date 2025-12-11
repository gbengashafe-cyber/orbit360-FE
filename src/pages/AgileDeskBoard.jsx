
import React, { useState, useEffect, useCallback } from "react";
import { Project, Issue, Sprint, User, IssueComment } from "@/api/entities";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus,
  ChevronLeft,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import IssueCard from "../components/agiledesk/IssueCard";
import IssueForm from "../components/agiledesk/IssueForm";
import SprintHeader from "../components/agiledesk/SprintHeader";
import BoardHeader from "../components/agiledesk/BoardHeader";

const STATUSES = [
  { id: "to_do", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "in_review", title: "In Review" },
  { id: "done", title: "Done" }
];

export default function AgileDeskBoard() {
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [filters, setFilters] = useState({ assignee: "all" });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('project');

  const loadBoardData = useCallback(async () => {
    if (!projectId) return; 
    setLoading(true);
    try {
      const [projectData, issuesData, sprintsData, usersData] = await Promise.all([
        Project.list({ id: projectId }),
        Issue.list({ project_id: projectId }),
        Sprint.list({ project_id: projectId }),
        User.list()
      ]);

      const currentProject = projectData[0];
      setProject(currentProject);
      setTeamMembers(usersData);
      
      if (currentProject.methodology === 'scrum') {
        const projectSprints = sprintsData.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        const currentActiveSprint = projectSprints.find(s => s.status === 'active');
        const sprintIssues = issuesData.filter(i => i.sprint_id === currentActiveSprint?.id);
        
        setIssues(sprintIssues);
        setSprints(projectSprints);
        setActiveSprint(currentActiveSprint);
      } else { // Kanban or other methodologies
        // For Kanban, we show all issues not in 'done' or 'cancelled' status
        const kanbanIssues = issuesData.filter(i => i.status !== 'done' && i.status !== 'cancelled');
        setIssues(kanbanIssues);
        setSprints([]);
        setActiveSprint(null);
      }

    } catch (error) {
      console.error('Error loading board data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]); 

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]); 

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const issueToMove = issues.find(issue => issue.id === draggableId);
    if (!issueToMove) return;

    const newStatus = destination.droppableId;
    
    // Optimistic UI update
    const newIssues = issues.map(issue => 
        issue.id === draggableId ? { ...issue, status: newStatus } : issue
    );
    setIssues(newIssues);

    try {
      await Issue.update(draggableId, { 
        status: newStatus,
        ...(newStatus === 'done' && { resolution: 'done', resolution_date: new Date().toISOString() })
      });
      // Optionally reload data to confirm, but optimistic is faster
      // loadBoardData(); 
    } catch (error) {
      console.error('Failed to update issue status:', error);
      // Revert UI if API call fails
      setIssues(issues);
    }
  };

  const handleIssueSubmit = async (issueData) => {
    try {
      if (editingIssue) {
        // Update Issue
        await Issue.update(editingIssue.id, issueData);
      } else {
        // Create Issue
        const issueCount = (await Issue.list({project_id: projectId})).length + 1;
        const issueKey = `${project.key}-${issueCount}`;
        await Issue.create({
          ...issueData,
          project_id: projectId,
          issue_key: issueKey,
          sprint_id: activeSprint?.id, // Assign to active sprint by default
          status: 'to_do',
        });
      }
      setShowIssueForm(false);
      setEditingIssue(null);
      loadBoardData();
    } catch (error) {
      console.error('Error saving issue:', error);
    }
  };

  const handleEditIssue = (issue) => {
    setEditingIssue(issue);
    setShowIssueForm(true);
  };

  const filteredIssues = issues.filter(issue => 
    filters.assignee === "all" || issue.assignee_id === filters.assignee
  );

  const getIssuesByStatus = (status) => {
    return filteredIssues
      .filter(issue => issue.status === status)
      .sort((a, b) => a.updated_date < b.updated_date ? 1 : -1);
  };
  
  if (loading) {
    return <div className="p-8 text-center flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-700" /></div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found. Go back to <Link to={createPageUrl("AgileDesk")} className="text-blue-600 hover:underline">AgileDesk</Link>.</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50 flex flex-col">
        <BoardHeader 
            project={project}
            teamMembers={teamMembers}
            filters={filters}
            onFilterChange={setFilters}
            onCreateIssue={() => { setEditingIssue(null); setShowIssueForm(true); }}
        />

        {project.methodology === 'scrum' && activeSprint && (
          <SprintHeader 
            sprint={activeSprint}
            issues={issues}
          />
        )}
        
        {project.methodology === 'scrum' && !activeSprint && (
            <Card className="my-6 bg-yellow-50 border-yellow-200">
                <CardContent className="p-6 text-center">
                    <p className="font-semibold text-yellow-800">No active sprint for this Scrum project.</p>
                    <p className="text-sm text-yellow-700">Go to project settings to start a new sprint and begin tracking work.</p>
                </CardContent>
            </Card>
        )}

        <Dialog open={showIssueForm} onOpenChange={setShowIssueForm}>
            <DialogContent className="max-w-3xl">
                <IssueForm
                    issue={editingIssue}
                    project={project}
                    teamMembers={teamMembers}
                    sprints={sprints}
                    onSubmit={handleIssueSubmit}
                    onCancel={() => { setShowIssueForm(false); setEditingIssue(null); }}
                />
            </DialogContent>
        </Dialog>

        <div className="flex-1 overflow-x-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 pb-4">
                {STATUSES.map((status) => {
                  const statusIssues = getIssuesByStatus(status.id);
                  return (
                    <Droppable key={status.id} droppableId={status.id}>
                      {(provided, snapshot) => (
                        <div className="w-80 flex-shrink-0">
                          <Card className={`bg-gray-100/60 border-gray-200 ${snapshot.isDraggingOver ? 'shadow-lg bg-blue-50' : ''} transition-colors`}>
                            <CardHeader className="pb-3 pt-4 border-b">
                              <CardTitle className="flex items-center justify-between text-base">
                                <span className="font-semibold text-gray-700 uppercase tracking-wider text-sm">{status.title}</span>
                                <Badge variant="secondary">
                                  {statusIssues.length}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="p-3 space-y-3 min-h-[500px]"
                            >
                              {statusIssues.map((issue, index) => (
                                <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={snapshot.isDragging ? 'transform rotate-2 shadow-2xl' : ''}
                                    >
                                      <IssueCard
                                        issue={issue}
                                        teamMembers={teamMembers}
                                        onEdit={handleEditIssue}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
        </div>
    </div>
  );
}
