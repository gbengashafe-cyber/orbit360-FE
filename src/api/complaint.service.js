import { apiClient, makeQueryParams } from './apiClient';
import { ApiRoutes } from './apiRoutes';

/**
 * Staff complaints.
 * Ownership is decided by the backend from the logged-in user; never send an employee ID.
 */
export const complaintService = {
  // Employee: own complaints (including anonymous ones).
  async getMyComplaints({ page = 1, rows = 25 } = {}) {
    return apiClient.get(`${ApiRoutes.complaints.mine}?${makeQueryParams({ page, rows })}`);
  },

  // HR Officer / HR Manager: all complaints, identities masked for anonymous ones.
  // Filters: status, severity, search (staff name/ID, complaint ID, subject), dateFrom/dateTo ('YYYY-MM-DD').
  async getComplaints({ page = 1, rows = 25, status, severity, search, dateFrom, dateTo } = {}) {
    return apiClient.get(
      `${ApiRoutes.complaints.list}?${makeQueryParams({ page, rows, status, severity, search, dateFrom, dateTo })}`,
    );
  },

  // HR: totals per tab ({ PENDING_REVIEW, PENDING_APPROVAL, all }) for the given severity/search/date filters.
  async getComplaintCounts({ severity, search, dateFrom, dateTo } = {}) {
    return apiClient.get(`${ApiRoutes.complaints.counts}?${makeQueryParams({ severity, search, dateFrom, dateTo })}`);
  },

  async getComplaintById(id) {
    return apiClient.get(ApiRoutes.complaints.byId(id));
  },

  async createComplaint(data) {
    return apiClient.post(ApiRoutes.complaints.create, data);
  },

  // Stage 1 (HR Officer): decision is 'APPROVE' or 'REJECT'.
  async reviewComplaint(id, { decision, note }) {
    return apiClient.patch(ApiRoutes.complaints.review(id), { decision, note: note || undefined });
  },

  // Stage 2 (HR Manager).
  async approveComplaint(id, { note } = {}) {
    return apiClient.patch(ApiRoutes.complaints.approve(id), { note: note || undefined });
  },

  async rejectComplaint(id, { note }) {
    return apiClient.patch(ApiRoutes.complaints.reject(id), { note });
  },
};
