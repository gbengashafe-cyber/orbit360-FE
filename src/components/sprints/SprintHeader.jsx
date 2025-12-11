import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, Users, Clock } from "lucide-react";
import { format } from "date-fns";

export default function SprintHeader({ sprint, project }) {
  const today = new Date();
  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
  const progressPercentage = Math.min(100, (daysPassed / totalDays) * 100);

  const completionRate = sprint.committed_points > 0 
    ? Math.round((sprint.completed_points / sprint.committed_points) * 100) 
    : 0;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
      <CardHeader className="border-b border-blue-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-900">
            <Target className="w-6 h-6" />
            {sprint.name}
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800">
            Active Sprint
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sprint Goal */}
          <div className="md:col-span-2">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Sprint Goal
            </h4>
            <p className="text-blue-700">
              {sprint.goal || "No sprint goal defined"}
            </p>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h4>
            <div className="text-sm text-blue-700">
              <p>{format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}</p>
              <p className="text-xs mt-1">
                Day {Math.min(daysPassed, totalDays)} of {totalDays}
              </p>
            </div>
            <Progress value={progressPercentage} className="mt-2 h-2" />
          </div>

          {/* Story Points */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Story Points
            </h4>
            <div className="text-sm text-blue-700">
              <p>
                <span className="font-semibold">{sprint.completed_points || 0}</span>
                {' '} of {sprint.committed_points || 0} completed
              </p>
              <p className="text-xs mt-1">
                {completionRate}% completion rate
              </p>
            </div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}