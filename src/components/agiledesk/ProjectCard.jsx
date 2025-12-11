import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Layers3,
  MoreHorizontal,
  Settings,
  Target,
  BarChart3,
  Archive,
  PlayCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProjectCard({ project, stats, onEdit, onArchive }) {
  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-700",
      archived: "bg-gray-100 text-gray-700",
      on_hold: "bg-yellow-100 text-yellow-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getMethodologyColor = (methodology) => {
    const colors = {
      scrum: "bg-blue-100 text-blue-700",
      kanban: "bg-purple-100 text-purple-700",
      hybrid: "bg-indigo-100 text-indigo-700"
    };
    return colors[methodology] || "bg-gray-100 text-gray-700";
  };

  const completionRate = stats.totalIssues > 0 
    ? Math.round((stats.completedIssues / stats.totalIssues) * 100) 
    : 0;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers3 className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                <Link 
                  to={createPageUrl(`AgileDeskBoard?project=${project.id}`)}
                  className="hover:text-blue-700 transition-colors"
                >
                  {project.name}
                </Link>
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {project.key}
                </Badge>
                <Badge className={getMethodologyColor(project.methodology)}>
                  {project.methodology}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl(`AgileDeskBoard?project=${project.id}`)} className="flex items-center w-full cursor-pointer">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Go to Board
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl(`AgileDeskReports?project=${project.id}`)} className="flex items-center w-full cursor-pointer">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(project)} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Project Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(project)} className="text-orange-600 cursor-pointer">
                <Archive className="w-4 h-4 mr-2" />
                Archive Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 line-clamp-2 h-10">
            {project.description || "No description provided."}
          </p>
          
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{stats.completedIssues} of {stats.totalIssues} issues</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{stats.totalIssues || 0}</div>
              <div className="text-xs text-gray-500">Total Issues</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{stats.inProgressIssues || 0}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{stats.bugs || 0}</div>
              <div className="text-xs text-gray-500">Open Bugs</div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}