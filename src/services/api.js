import axios from 'axios';
import { cognitoService } from './cognito';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await cognitoService.refreshToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      cognitoService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Complaints
  getComplaints: (params) => apiClient.get('/complaints', { params }),
  getComplaint: (id) => apiClient.get(`/complaints/${id}`),
  updateComplaint: (id, data) => apiClient.put(`/complaints/${id}`, data),
  deleteComplaint: (id) => apiClient.delete(`/complaints/${id}`),
  
  // Statistics
  getStats: () => apiClient.get('/stats'),
  getCategoryStats: () => apiClient.get('/stats/categories'),
  
  // Users (Admin only)
  getUsers: () => apiClient.get('/users'),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data)
};

export default apiClient;