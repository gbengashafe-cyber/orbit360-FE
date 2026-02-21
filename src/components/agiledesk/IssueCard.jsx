import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BookOpen, Bug, CheckSquare, Zap, Minus, ArrowUp, ArrowDown, User
} from "lucide-react";

const ISSUE_TYPE_ICONS = {
  epic: { icon: BookOpen, color: "text-purple-600" },
  story: { icon: Zap, color: "text-green-600" },
  task: { icon: CheckSquare, color: "text-blue-600" },
  bug: { icon: Bug, color: "text-red-600" },
  subtask: { icon: Minus, color: "text-gray-600" },
  improvement: { icon: ArrowUp, color: "text-indigo-600" }
};

const PRIORITY_ICONS = {
  highest: { icon: ArrowUp, color: "text-red-600" },
  high: { icon: ArrowUp, color: "text-orange-500" },
  medium: { icon: Minus, color: "text-yellow-500" },
  low: { icon: ArrowDown, color: "text-blue-500" },
  lowest: { icon: ArrowDown, color: "text-gray-400" }
};

export default function IssueCard({ issue, teamMembers, onEdit }) {
  const TypeIcon = ISSUE_TYPE_ICONS[issue.issue_type]?.icon || CheckSquare;
  const typeColor = ISSUE_TYPE_ICONS[issue.issue_type]?.color || "text-gray-600";
  const priorityConfig = PRIORITY_ICONS[issue.priority] || PRIORITY_ICONS.medium;
  const PriorityIcon = priorityConfig.icon;
  
  const assignee = teamMembers.find(member => member.id === issue.assignee_id);

  return (
    <Card 
      onClick={() => onEdit(issue)}
      className="bg-white hover:bg-gray-50/80 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 group"
    >
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-gray-800 text-sm leading-tight line-clamp-2">
          {issue.summary}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className={`w-4 h-4 ${typeColor}`} />
            <PriorityIcon className={`w-4 h-4 ${priorityConfig.color}`} />
            <span className="text-xs font-medium text-gray-500 uppercase">
              {issue.issue_key}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {issue.story_points > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {issue.story_points}
                </Badge>
            )}
            {assignee ? (
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-gray-200">
                  {assignee.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-400"/>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}