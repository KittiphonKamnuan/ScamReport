// src/services/complaintApi.js
import axios from 'axios';

// ใช้ relative URL ใน development (จะผ่าน Vite proxy)
// ใช้ Lambda URL จริงใน production
const API_BASE_URL = import.meta.env.DEV
  ? '' // Development: ใช้ relative URL (Vite proxy จะจัดการ CORS)
  : (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_ADMIN_API_URL);

console.log('API_BASE_URL:', API_BASE_URL, 'Mode:', import.meta.env.MODE);

// สร้าง axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor สำหรับเพิ่ม token (ปิดไว้ก่อนเพราะ Lambda ไม่ได้ใช้ JWT auth)
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Helper function สำหรับ parse Lambda response
const parseLambdaResponse = (data) => {
  if (data.body && typeof data.body === 'string') {
    return JSON.parse(data.body);
  }
  return data;
};

export const complaintApi = {
  // ดึงรายการร้องเรียนทั้งหมด
  getComplaints: async (params = {}) => {
    try {
      const response = await apiClient.get('/table/complaints', { params });
      const data = parseLambdaResponse(response.data);
      return data.data || data;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  },

  // ดึงรายการตาม ID
  getComplaintById: async (id) => {
    try {
      const response = await apiClient.get(`/table/complaints/${id}`);
      const data = parseLambdaResponse(response.data);
      return data.data || data;
    } catch (error) {
      console.error(`Error fetching complaint ${id}:`, error);
      throw error;
    }
  },

  // สถิติ Dashboard
  getStats: async () => {
    try {
      const response = await apiClient.get('/table/complaints/stats');
      const data = parseLambdaResponse(response.data);
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // ============= Messages API =============

  // ดึงข้อความ/แชททั้งหมดของ complaint (พร้อม complaint_title)
  getComplaintMessages: async (complaintId) => {
    try {
      const response = await apiClient.get(`/table/complaints/${complaintId}/messages`);
      const data = parseLambdaResponse(response.data);
      // Return ทั้ง response เพื่อรวม complaint_title และ complaint_status
      return data;
    } catch (error) {
      console.error(`Error fetching messages for complaint ${complaintId}:`, error);
      throw error;
    }
  },

  // ดึง summary ของแชท
  getComplaintSummary: async (complaintId) => {
    try {
      const response = await apiClient.get(`/table/complaints/${complaintId}/summary`);
      const data = parseLambdaResponse(response.data);
      return data.summary || data.data || data;
    } catch (error) {
      console.error(`Error fetching summary for complaint ${complaintId}:`, error);
      throw error;
    }
  },

  // สร้าง summary ใหม่สำหรับแชท
  createComplaintSummary: async (complaintId) => {
    try {
      const response = await apiClient.post(`/table/complaints/${complaintId}/summary`);
      const data = parseLambdaResponse(response.data);
      return data.summary || data.data || data;
    } catch (error) {
      console.error(`Error creating summary for complaint ${complaintId}:`, error);
      throw error;
    }
  },

  // ============= Categories API =============

  // ดึง categories ทั้งหมด
  getCategories: async () => {
    try {
      const response = await apiClient.get('/table/categories');
      const data = parseLambdaResponse(response.data);
      return data.categories || data.data || data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // ดึง category ตาม ID
  getCategoryById: async (id) => {
    try {
      const response = await apiClient.get(`/table/categories/${id}`);
      const data = parseLambdaResponse(response.data);
      return data.category || data.data || data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  // สร้าง category ใหม่
  createCategory: async (categoryData) => {
    try {
      const response = await apiClient.post('/table/categories', categoryData);
      const data = parseLambdaResponse(response.data);
      return data.category || data.data || data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // อัพเดท category
  updateCategory: async (id, categoryData) => {
    try {
      const response = await apiClient.put(`/table/categories/${id}`, categoryData);
      const data = parseLambdaResponse(response.data);
      return data.category || data.data || data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  // ลบ category
  deleteCategory: async (id) => {
    try {
      const response = await apiClient.delete(`/table/categories/${id}`);
      const data = parseLambdaResponse(response.data);
      return data;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }
};