
import React, { useState, useEffect } from "react";
import { userService, employeeService, recruitmentService } from "@/api";
import { showToast } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Plus, Briefcase, Calendar, TrendingUp, Linkedin, Check, X, Copy } from "lucide-react";

import JobPostingForm from "../components/recruitment/JobPostingForm";
import ApplicationPipeline from "../components/recruitment/ApplicationPipeline";

export default function Recruitment() {
  const [jobPostings, setJobPostings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    pendingInterviews: 0,
    hireRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMD, setIsMD] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    loadData();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user?.data || user);
      
      // Check if user is a Managing Director
      const employees = await employeeService.getEmployees(1, 100);
      const currentEmployee = employees?.data?.find(e => e.email === (user?.data?.email || user?.email));
      const isMDUser = currentEmployee?.position === "Managing Director";
      console.log('Current user:', user?.data?.email || user?.email);
      console.log('Current employee:', currentEmployee?.position);
      console.log('Is Managing Director:', isMDUser);
      setIsMD(isMDUser);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadData = async () => {
    console.log('loadData called');
    setLoading(true);
    try {
      // Fetch recruitment data without authentication
      const [jobsResponse, applicationsResponse, statsResponse] = await Promise.all([
        recruitmentService.getJobPostings(1, 100),
        recruitmentService.getJobApplications(1, 100),
        recruitmentService.getDashboardStats()
      ]);
      
      // Set job postings
      const jobs = Array.isArray(jobsResponse) ? jobsResponse : (jobsResponse?.data || []);
      setJobPostings(jobs);
      
      // Set applications
      const applications = Array.isArray(applicationsResponse) ? applicationsResponse : (applicationsResponse?.data || []);
      setApplications(applications);
      
      // Set dashboard stats from API
      const stats = statsResponse?.data || statsResponse || {};
      setDashboardStats({
        activeJobs: stats.activeJobs || 0,
        totalApplications: stats.totalApplications || 0,
        pendingInterviews: stats.pendingInterviews || 0,
        hireRate: stats.hireRate || 0,
      });

      console.log('Recruitment data loaded successfully');
    } catch (error) {
      console.error('Error loading recruitment data:', error);
      showToast.error('Failed to load recruitment data', 'Error');
    } finally {
      setLoading(false);
    }
  };
  
  const getManagingDirectorEmails = async () => {
      const response = await employeeService.getEmployees(1, 100);
      const employees = response.data || [];
      return employees
        .filter(e => e.position === "Managing Director")
        .map(e => e.email);
  }

  // Helper function to create public page PATH segments (e.g., "/PublicJobView?id=...")
  // This is a placeholder; in a real app, this might come from a router utility
  const createPagePathSegment = (pathSegment) => `/${pathSegment}`;

  // Helper function to create full public page URLs (e.g., "https://example.com/PublicJobView?id=...")
  const createPublicPageUrl = (pathWithQuery) => `${window.location.origin}${createPagePathSegment(pathWithQuery)}`;

  const handleShareOnLinkedIn = (job) => {
    // Assuming a public job page URL structure
    const jobUrl = createPublicPageUrl(`PublicJobView?id=${job.id}`);
    const shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(jobUrl)}&title=${encodeURIComponent(job.title)}&summary=${encodeURIComponent(job.description.substring(0, 200) + '...')}`;
    window.open(shareUrl, '_blank');
  };

  const handleCopyLink = (job) => {
    const jobUrl = createPublicPageUrl(`PublicJobView?id=${job.id}`);
    navigator.clipboard.writeText(jobUrl).then(() => {
        setCopiedJobId(job.id);
        setTimeout(() => setCopiedJobId(null), 2000); // Reset after 2 seconds
    });
  };

  const handleJobSubmit = async (response) => {
    try {
      console.log('Job posting created successfully:', response);
      setShowJobForm(false);
      
      // Extract title from the response
      const jobTitle = response?.title || response?.data?.title || 'Job posting';
      showToast.success(`"${jobTitle}" created successfully and is pending approval`, 'Job Posted');
      
      // Reload data to show the new job posting
      await loadData();
    } catch (error) {
      console.error('Error after job creation:', error);
      showToast.error(error.response?.data?.message || error.message || 'Failed to reload data', 'Error');
    }
  };

  const handleApproval = async (job, approved) => {
    try {
        if (approved) {
            await recruitmentService.approveJobPosting(job.id, currentUser.email);
        } else {
            await recruitmentService.rejectJobPosting(job.id);
        }
        
        showToast.success(`Job posting ${approved ? 'approved' : 'rejected'} successfully!`, 'Success');
        loadData();
    } catch (error) {
        console.error('Error updating job status:', error);
        showToast.error(error.message || 'Failed to update job status', 'Error');
    }
  };

  const handleCloseRole = async (job) => {
      if (!window.confirm("Are you sure you want to close this role? This will prevent new applications.")) return;
      try {
          await recruitmentService.closeJobPosting(job.id);
          showToast.success('Job posting closed successfully!', 'Success');
          loadData();
      } catch(error) {
          console.error("Error closing role:", error);
          showToast.error(error.message || 'Failed to close job posting', 'Error');
      }
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      pending_approval: "bg-orange-100 text-orange-700",
      active: "bg-green-100 text-green-700",
      closed: "bg-red-100 text-red-700",
      on_hold: "bg-yellow-100 text-yellow-700",
      rejected: "bg-red-200 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="p-8 text-center min-h-screen flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recruitment data...</p>
        </div>
      </div>
    );
  }

  // if (!currentUser) {
  //   return (
  //     <div className="p-8 text-center min-h-screen flex items-center justify-center">
  //       <div>
  //         <p className="text-red-600 font-semibold mb-4">Failed to load user information</p>
  //         <p className="text-gray-600 mb-4">Backend server may not be running at http://localhost:3000</p>
  //         <button 
  //           onClick={() => window.location.reload()} 
  //           className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
  //         >
  //           Retry
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }
  
  const pendingApprovalJobs = jobPostings.filter(j => j.status === 'pending_approval');
  const displayedJobs = jobPostings; // Show all jobs in the main table

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recruitment & Onboarding</h1>
              <p className="text-gray-600">Manage job postings and track applications</p>
            </div>
          </div>
          <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25">
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Job Posting</DialogTitle>
              </DialogHeader>
              <JobPostingForm onSubmit={handleJobSubmit} onCancel={() => setShowJobForm(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards - KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeJobs}</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalApplications}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingInterviews}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hire Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.hireRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {isMD && pendingApprovalJobs.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-xl shadow-orange-200/50">
                <CardHeader>
                    <CardTitle className="text-orange-700">Action Required: Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingApprovalJobs.map(job => (
                                    <TableRow key={job.id} className="hover:bg-orange-50/50 transition-colors">
                                        <TableCell>{job.title}</TableCell>
                                        <TableCell className="capitalize">{job.department}</TableCell>
                                        <TableCell>{job.created_by}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleApproval(job, true)}><Check className="w-4 h-4 mr-1"/>Approve</Button>
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleApproval(job, false)}><X className="w-4 h-4 mr-1"/>Reject</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Job Postings Table */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Job Postings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Job Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedJobs.map((job) => {
                    const jobApplications = applications.filter(a => a.job_posting_id === job.id);
                    return (
                      <TableRow key={job.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{job.title}</p>
                            <p className="text-sm text-gray-500">{job.location}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{job.department}</TableCell>
                        <TableCell className="capitalize">{job.employment_type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {jobApplications.length} application{jobApplications.length > 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.posted_date && new Date(job.posted_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex gap-1 flex-wrap">
                          <TooltipProvider>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedJob(job)}
                            >
                              View Applications
                            </Button>
                            {job.status === 'pending_approval' && isMD && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleApproval(job, true)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleApproval(job, false)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="pointer-events-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleShareOnLinkedIn(job)}
                                  disabled={job.status !== 'active'}
                                >
                                  <Linkedin className="w-4 h-4" />
                                </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {job.status === 'active' ? 'Share on LinkedIn' : 'Only available for active jobs'}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="pointer-events-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleCopyLink(job)}
                                  disabled={job.status !== 'active'}
                                >
                                  {copiedJobId === job.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {job.status === 'active' ? 'Copy link' : 'Only available for active jobs'}
                            </TooltipContent>
                          </Tooltip>
                           {job.status === 'active' && 
                             <Button 
                                 size="sm" 
                                 variant="destructive" 
                                 className="bg-red-500 hover:bg-red-600 text-white"
                                 onClick={() => handleCloseRole(job)}
                             >
                                 Close Role
                             </Button>}
                           </TooltipProvider>
                           </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {jobPostings.length === 0 && ( // This check should probably be for all jobPostings, not just otherJobs
              <div className="p-12 text-center text-gray-500">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No job postings yet</h3>
                <p className="mb-4">Start by creating your first job posting</p>
                <Button
                  onClick={() => setShowJobForm(true)}
                  className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Pipeline in a Modal */}
        <Dialog open={!!selectedJob} onOpenChange={(isOpen) => { if (!isOpen) setSelectedJob(null); }}>
          <DialogContent className="max-w-screen-xl w-11/12 h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl">Application Pipeline</DialogTitle>
              {selectedJob && <DialogDescription>Viewing applicants for: <span className="font-semibold text-blue-700">{selectedJob.title}</span></DialogDescription>}
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              {selectedJob && (
                <ApplicationPipeline
                  job={selectedJob}
                  applications={applications.filter(a => a.job_posting_id === selectedJob.id)}
                  onClose={() => setSelectedJob(null)}
                  onRefreshApplications={loadData}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
