import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, CheckCircle } from "lucide-react";

export default function UpcomingTasks() {
  // Mock data for upcoming tasks
  const upcomingTasks = [
    {
      id: 1,
      title: "Follow up with ABC Corp",
      type: "follow_up",
      date: "2024-01-15",
      time: "10:00 AM",
      priority: "high"
    },
    {
      id: 2,
      title: "Demo presentation for TechStart",
      type: "demo",
      date: "2024-01-16",
      time: "2:00 PM",
      priority: "medium"
    },
    {
      id: 3,
      title: "Send proposal to Manufacturing Inc",
      type: "proposal",
      date: "2024-01-17",
      time: "9:00 AM",
      priority: "high"
    }
  ];

  const priorityColors = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700"
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl shadow-slate-200/50">
      <CardHeader className="border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Upcoming Tasks
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">{task.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority} priority
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {task.date} at {task.time}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-emerald-600">
                <CheckCircle className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {upcomingTasks.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No upcoming tasks. You're all caught up!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}