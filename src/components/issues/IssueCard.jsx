import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
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

const ISSUE_TYPE_ICONS = {
  epic: Target,
  story: CheckSquare,
  task: Circle,
  bug: Bug,
  subtask: Minus,
  improvement: Zap
};

const PRIORITY_COLORS = {
  highest: "text-red-600",
  high: "text-orange-600",
  medium: "text-yellow-600",
  low: "text-green-600",
  lowest: "text-blue-600"
};

export default function IssueCard({ issue, users, onClick }) {
  const IssueIcon = ISSUE_TYPE_ICONS[issue.issue_type] || Circle;
  const assignee = users?.find(u => u.id === issue.assignee_id);

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'highest':
        return <ArrowUp className="w-3 h-3 text-red-600" />;
      case 'high':
        return <ArrowUp className="w-3 h-3 text-orange-600" />;
      case 'medium':
        return <Minus className="w-3 h-3 text-yellow-600" />;
      case 'low':
        return <ArrowDown className="w-3 h-3 text-green-600" />;
      case 'lowest':
        return <ArrowDown className="w-3 h-3 text-blue-600" />;
      default:
        return <Minus className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <Card 
      className="bg-white border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IssueIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-500">{issue.issue_key}</span>
          </div>
          {getPriorityIcon(issue.priority)}
        </div>

        {/* Summary */}
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {issue.summary}
        </p>

        {/* Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issue.labels.slice(0, 3).map((label, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {issue.issue_type}
            </Badge>
            {issue.story_points && (
              <Badge variant="secondary" className="text-xs">
                {issue.story_points} SP
              </Badge>
            )}
          </div>
          
          {assignee && (
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                {assignee.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}