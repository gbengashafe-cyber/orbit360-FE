import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const recruitmentService = {
  // Job Postings
  async getJobPostings(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetJobPostings}?page=${page}&rows=${rows}`);
  },

  async getJobPostingById(id) {
    return apiClient.get(ApiRoutes.GetJobPostingById(id));
  },

  async createJobPosting(data) {
    console.log('Creating job posting with data:', data);
    const response = await apiClient.post(ApiRoutes.CreateJobPosting, data);
    console.log('Job posting created response:', response);
    return response;
  },

  async updateJobPosting(id, data) {
    return apiClient.put(ApiRoutes.UpdateJobPosting(id), data);
  },

  async approveJobPosting(id, approvedBy) {
    return apiClient.post(ApiRoutes.ApproveJobPosting(id), { approved_by: approvedBy });
  },

  async rejectJobPosting(id) {
    return apiClient.post(ApiRoutes.RejectJobPosting(id));
  },

  async closeJobPosting(id) {
    return apiClient.post(ApiRoutes.CloseJobPosting(id));
  },

  async deleteJobPosting(id) {
    return apiClient.delete(ApiRoutes.DeleteJobPosting(id));
  },

  // Job Applications
  async getJobApplications(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetJobApplications}?page=${page}&rows=${rows}`);
  },

  async getJobApplicationById(id) {
    return apiClient.get(ApiRoutes.GetJobApplicationById(id));
  },

  async getApplicationsByJobPosting(jobPostingId, page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetApplicationsByJobPosting(jobPostingId)}?page=${page}&rows=${rows}`);
  },

  async createJobApplication(data) {
    return apiClient.post(ApiRoutes.CreateJobApplication, data);
  },

  async updateApplicationStatus(id, status) {
    return apiClient.put(ApiRoutes.UpdateApplicationStatus(id), { status });
  },

  async scheduleInterview(id, interviewDate, interviewNotes) {
    return apiClient.post(ApiRoutes.ScheduleInterview(id), {
      interview_date: interviewDate,
      interview_notes: interviewNotes,
    });
  },

  async sendOffer(id) {
    return apiClient.post(ApiRoutes.SendOffer(id));
  },

  async hireApplicant(id) {
    return apiClient.post(ApiRoutes.HireApplicant(id));
  },

  async rejectApplicant(id) {
    return apiClient.post(ApiRoutes.RejectApplicant(id));
  },

  async deleteJobApplication(id) {
    return apiClient.delete(ApiRoutes.DeleteJobApplication(id));
  },

  // Dashboard
  async getDashboardStats() {
    return apiClient.get(ApiRoutes.GetRecruitmentDashboardStats);
  },
};
