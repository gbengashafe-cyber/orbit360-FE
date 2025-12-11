import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Layers3, Plus, Filter, Users, BarChart3 } from "lucide-react";

export default function BoardHeader({ project, teamMembers, filters, onFilterChange, onCreateIssue }) {
  return (
    <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to={createPageUrl("AgileDesk")}>
                <Button variant="outline" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                </Link>
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <Layers3 className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Project Board</p>
                    <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Link to={createPageUrl(`AgileDeskReports?project=${project.id}`)}>
                    <Button variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Reports
                    </Button>
                </Link>
                <Button
                    onClick={onCreateIssue}
                    className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Issue
                </Button>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={filters.assignee} onValueChange={(value) => onFilterChange(prev => ({...prev, assignee: value}))}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by Assignee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4"/> All Assignees
                        </div>
                    </SelectItem>
                    {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        </div>
    </div>
  );
}