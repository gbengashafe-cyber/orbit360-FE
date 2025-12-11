import React, { useState, useEffect } from 'react';
import { Employee, JobPosting, PerformanceReview } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users2, Briefcase, Star, FolderArchive, ArrowRight, Loader2 } from 'lucide-react';

const QuickLinkCard = ({ title, icon: Icon, value, linkTo, linkText }) => (
  <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50 hover:shadow-blue-200/50 hover:border-blue-300 transition-all">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      <Icon className="w-5 h-5 text-blue-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <Link to={linkTo}>
        <Button variant="link" className="p-0 h-auto text-blue-700 mt-2">
          {linkText} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

export default function HRDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeJobs: 0,
    pendingReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [employees, jobs, reviews] = await Promise.all([
        Employee.list(),
        JobPosting.list(),
        PerformanceReview.list(),
      ]);

      setStats({
        totalEmployees: employees.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        pendingReviews: reviews.filter(r => r.status !== 'completed').length,
      });
    } catch (error) {
      console.error("Error loading HR dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 text-center flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Human Resources Dashboard</h1>
            <p className="text-gray-600">Your central hub for all HR activities</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <QuickLinkCard 
            title="Total Employees"
            icon={Users2}
            value={stats.totalEmployees}
            linkTo={createPageUrl("Employees")}
            linkText="Manage Employees"
          />
          <QuickLinkCard 
            title="Active Job Openings"
            icon={Briefcase}
            value={stats.activeJobs}
            linkTo={createPageUrl("Recruitment")}
            linkText="Manage Recruitment"
          />
          <QuickLinkCard 
            title="Pending Reviews"
            icon={Star}
            value={stats.pendingReviews}
            linkTo={createPageUrl("Performance")}
            linkText="View Performance"
          />
           <QuickLinkCard 
            title="HR Documents"
            icon={FolderArchive}
            value={"Secure"}
            linkTo={createPageUrl("DocumentManagement")}
            linkText="Access Files"
          />
        </div>

        {/* Placeholder for future reports */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardHeader>
                <CardTitle>HR Reports</CardTitle>
                <p className="text-sm text-gray-500">More detailed reports and analytics coming soon.</p>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 text-gray-500">
                    <p>Employee distribution charts and hiring trends will be displayed here.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}