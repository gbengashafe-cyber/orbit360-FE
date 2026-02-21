import { apiClient } from './apiClient';
import { ApiRoutes } from './apiRoutes';

export const userService = {
  async getCurrentUser() {
    return apiClient.get(ApiRoutes.GetCurrentUser);
  },

  async getUsers(page = 1, rows = 10) {
    return apiClient.get(`${ApiRoutes.GetUsers}?page=${page}&rows=${rows}`);
  },

  async getUserById(id) {
    return apiClient.get(ApiRoutes.GetUserById(id));
  },

  async createUser(data) {
    return apiClient.post(ApiRoutes.CreateUser, data);
  },

  async updateUser(id, data) {
    return apiClient.put(ApiRoutes.UpdateUser(id), data);
  },

  async deleteUser(id) {
    return apiClient.delete(ApiRoutes.DeleteUser(id));
  },

  async login(email, password) {
    return apiClient.post(ApiRoutes.Login, { email, password });
  },

  async logout() {
    return apiClient.post(ApiRoutes.Logout);
  },

  async googleCallback(token) {
    return apiClient.post(ApiRoutes.GoogleCallback, { token });
  },
};
