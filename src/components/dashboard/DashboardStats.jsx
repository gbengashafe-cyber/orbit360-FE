
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, DollarSign, BookOpen, Mail, TrendingUp } from "lucide-react";

const statsConfig = [
  {
    title: "Total Contacts",
    key: "totalContacts",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-50 to-blue-100",
    textColor: "text-blue-600"
  },
  {
    title: "Active Deals",
    key: "totalDeals", 
    icon: Target,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "from-emerald-50 to-emerald-100",
    textColor: "text-emerald-600"
  },
  {
    title: "Revenue",
    key: "totalRevenue",
    icon: DollarSign,
    color: "from-purple-500 to-purple-600",
    bgColor: "from-purple-50 to-purple-100",
    textColor: "text-purple-600",
    format: "currency"
  },
  {
    title: "Training Programs",
    key: "activePrograms",
    icon: BookOpen,
    color: "from-orange-500 to-orange-600",
    bgColor: "from-orange-50 to-orange-100",
    textColor: "text-orange-600"
  }
];

export default function DashboardStats({ stats }) {
  const formatValue = (value, format) => {
    if (format === "currency") {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat) => (
        <Card key={stat.key} className="bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300" style={{ boxShadow: '0 10px 30px rgba(189, 195, 199, 0.3)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatValue(stats[stat.key], stat.format)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium">
                    +12% from last month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
