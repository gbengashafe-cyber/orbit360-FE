import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, Target, Calendar } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

export default function SprintHeader({ sprint, issues }) {
  const sprintIssues = issues.filter(issue => issue.sprint_id === sprint.id);
  const completedIssues = sprintIssues.filter(issue => issue.status === 'done');
  
  const totalStoryPoints = sprintIssues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);
  const completedStoryPoints = completedIssues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);
  
  const progressByIssues = sprintIssues.length > 0 ? Math.round((completedIssues.length / sprintIssues.length) * 100) : 0;
  const progressByStoryPoints = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;
  
  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const today = new Date();
  
  const daysRemaining = isPast(endDate) ? 0 : differenceInDays(endDate, today);

  return (
    <Card className="my-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {sprint.name}
                <Badge className="bg-blue-100 text-blue-700">Active Sprint</Badge>
              </h2>
              <p className="text-gray-600 text-sm mt-1">{sprint.goal || "No sprint goal set."}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                </span>
                <span className="font-medium">{daysRemaining} days remaining</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{completedIssues.length}/{sprintIssues.length}</div>
              <div className="text-xs text-gray-500">Issues Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{completedStoryPoints}/{totalStoryPoints}</div>
              <div className="text-xs text-gray-500">Story Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{progressByStoryPoints}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span>Sprint Progress (Story Points)</span>
            <span>{progressByStoryPoints}%</span>
          </div>
          <Progress value={progressByStoryPoints} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}