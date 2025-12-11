import React, { useState, useEffect } from "react";
import { Project } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Layers3, Loader2, KanbanSquare, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BoardCard = ({ project }) => {
    return (
        <Link to={createPageUrl(`AgileDeskBoard?project=${project.id}`)}>
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900">{project.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">{project.status}</Badge>
                    </div>
                    <CardDescription>{project.key}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">{project.description}</p>
                </CardContent>
            </Card>
        </Link>
    )
}

export default function KanbanBoards() {
  const [scrumProjects, setScrumProjects] = useState([]);
  const [kanbanProjects, setKanbanProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const allProjects = await Project.list('-created_date');
        setScrumProjects(allProjects.filter(p => p.methodology === 'scrum'));
        setKanbanProjects(allProjects.filter(p => p.methodology === 'kanban' || p.methodology === 'hybrid'));
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center flex justify-center items-center h-screen">
        <Loader2 className="animate-spin rounded-full h-12 w-12 text-blue-700" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-700 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-700/25">
            <Layers3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Boards</h1>
            <p className="text-gray-600">Access your Scrum and Kanban boards.</p>
          </div>
        </div>

        <div className="space-y-12">
            {/* Scrum Boards */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Timer className="w-6 h-6 text-blue-700" />
                    <h2 className="text-2xl font-semibold text-gray-800">Scrum Boards</h2>
                </div>
                {scrumProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scrumProjects.map(project => <BoardCard key={project.id} project={project} />)}
                    </div>
                ) : (
                    <p className="text-gray-500">No active Scrum projects found.</p>
                )}
            </section>

            {/* Kanban Boards */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <KanbanSquare className="w-6 h-6 text-purple-700" />
                    <h2 className="text-2xl font-semibold text-gray-800">Kanban Boards</h2>
                </div>
                 {kanbanProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kanbanProjects.map(project => <BoardCard key={project.id} project={project} />)}
                    </div>
                 ) : (
                    <p className="text-gray-500">No active Kanban or Hybrid projects found.</p>
                 )}
            </section>
        </div>
      </div>
    </div>
  );
}