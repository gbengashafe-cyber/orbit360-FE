import React, { useState, useEffect } from 'react';
import { 
  PerformanceReview, 
  Employee, 
  User, 
  Goal, 
  Feedback, 
  CheckIn, 
  DevelopmentPlan, 
  Recognition,
  PerformanceImprovementPlan,
  EngagementSurvey 
} from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, MessageSquare, Calendar, BookOpen, Award, TrendingUp, Users, BarChart3, Settings } from 'lucide-react';

import PerformanceDashboard from '../components/performance/PerformanceDashboard';
import GoalManagement from '../components/performance/GoalManagement';
import FeedbackCenter from '../components/performance/FeedbackCenter';
import CheckInScheduler from '../components/performance/CheckInScheduler';
import DevelopmentPlanning from '../components/performance/DevelopmentPlanning';
import RecognitionHub from '../components/performance/RecognitionHub';
import PerformanceAnalytics from '../components/performance/PerformanceAnalytics';
import EngagementCenter from '../components/performance/EngagementCenter';

export default function Performance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "goals", label: "Goals & OKRs", icon: Target },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "checkins", label: "Check-ins", icon: Calendar },
    { id: "development", label: "Development", icon: BookOpen },
    { id: "recognition", label: "Recognition", icon: Award },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "engagement", label: "Engagement", icon: Users },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
              <p className="text-gray-600">Comprehensive performance tracking and development platform</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg" 
                    : "hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === "dashboard" && <PerformanceDashboard currentUser={currentUser} />}
          {activeTab === "goals" && <GoalManagement currentUser={currentUser} />}
          {activeTab === "feedback" && <FeedbackCenter currentUser={currentUser} />}
          {activeTab === "checkins" && <CheckInScheduler currentUser={currentUser} />}
          {activeTab === "development" && <DevelopmentPlanning currentUser={currentUser} />}
          {activeTab === "recognition" && <RecognitionHub currentUser={currentUser} />}
          {activeTab === "analytics" && <PerformanceAnalytics currentUser={currentUser} />}
          {activeTab === "engagement" && <EngagementCenter currentUser={currentUser} />}
        </div>
      </div>
    </div>
  );
}