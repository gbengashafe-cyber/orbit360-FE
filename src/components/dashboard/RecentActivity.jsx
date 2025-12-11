
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  FileText,
  ArrowRight,
  Activity as ActivityIcon
} from "lucide-react";
import { format } from "date-fns";

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  demo: MessageCircle,
  follow_up: FileText,
  proposal_sent: FileText,
  contract_signed: FileText,
  training_delivered: FileText
};

const activityColors = {
  call: "text-blue-600 bg-blue-50",
  email: "text-emerald-600 bg-emerald-50",
  meeting: "text-purple-600 bg-purple-50",
  demo: "text-orange-600 bg-orange-50",
  follow_up: "text-slate-600 bg-slate-50",
  proposal_sent: "text-indigo-600 bg-indigo-50",
  contract_signed: "text-green-600 bg-green-50",
  training_delivered: "text-pink-600 bg-pink-50"
};

export default function RecentActivity({ activities }) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-blue-700" />
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || FileText;
            const colorClass = activityColors[activity.type] || "text-gray-600 bg-gray-50";

            return (
              <div key={activity.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{activity.title}</h4>
                  <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(new Date(activity.created_date), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity. Start engaging with your contacts!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
