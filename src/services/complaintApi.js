// src/services/complaintApi.js
import axios from 'axios';

// ==============================
// API Base URL
// ==============================

// ใช้ค่าเดียวกับที่ใช้ใน frontend ส่วนอื่น ๆ
// (.env มี VITE_API_BASE_URL=https://ezwsun6v5h.execute-api.us-east-1.amazonaws.com/dev)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_ADMIN_API_URL ||
  '';

console.log(
  'API_BASE_URL (complaintApi):',
  API_BASE_URL || '(EMPTY)',
  'Mode:',
  import.meta.env.MODE
);

if (!API_BASE_URL) {
  console.warn(
    '[complaintApi] API_BASE_URL is empty. Please set VITE_API_BASE_URL in your .env file.'
  );
}

// ==============================
// Axios instance
// ==============================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ถ้าอนาคตต้องใช้ JWT ก็เปิด interceptor นี้ได้
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// ==============================
// Helper: parse Lambda response
// (กันเผื่อกรณีบาง endpoint ยังห่อ { statusCode, body })
// ==============================
const parseLambdaResponse = (data) => {
  if (data && typeof data === 'object' && 'body' in data && typeof data.body === 'string') {
    try {
      return JSON.parse(data.body);
    } catch (e) {
      console.error('[complaintApi] Failed to parse Lambda body JSON:', e);
      return data;
    }
  }
  return data;
};

// ==============================
// Public API
// ==============================

export const complaintApi = {
  // ------- Complaints -------

  // ดึงรายการร้องเรียนทั้งหมด
  getComplaints: async (params = {}) => {
    try {
      const response = await apiClient.get('/table/complaints', { params });
      const data = parseLambdaResponse(response.data);
      // ถ้า backend ห่อเป็น { data: [...] } ก็ใช้ .data, ถ้าไม่ห่อก็คืนทั้งก้อน
      return data.data || data;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  },

  // ดึงร้องเรียนตาม ID
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

  // ------- Messages / Summary -------

  // ดึงข้อความ/แชททั้งหมดของ complaint (พร้อม complaint_title, status ฯลฯ)
  getComplaintMessages: async (complaintId) => {
    try {
      const response = await apiClient.get(
        `/table/complaints/${complaintId}/messages`
      );
      const data = parseLambdaResponse(response.data);
      // data ควรมี { messages, complaint_title, complaint_status, ... }
      return data;
    } catch (error) {
      console.error(
        `Error fetching messages for complaint ${complaintId}:`,
        error
      );
      throw error;
    }
  },

  // ดึง summary ของแชท
  getComplaintSummary: async (complaintId) => {
    try {
      const response = await apiClient.get(
        `/table/complaints/${complaintId}/summary`
      );
      const data = parseLambdaResponse(response.data);
      return data.summary || data.data || data;
    } catch (error) {
      console.error(`Error fetching summary for complaint ${complaintId}:`, error);
      throw error;
    }
  },

  // สร้าง summary ใหม่
  createComplaintSummary: async (complaintId) => {
    try {
      const response = await apiClient.post(
        `/table/complaints/${complaintId}/summary`
      );
      const data = parseLambdaResponse(response.data);
      return data.summary || data.data || data;
    } catch (error) {
      console.error(
        `Error creating summary for complaint ${complaintId}:`,
        error
      );
      throw error;
    }
  },

  // ------- Categories -------

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

  // อัปเดต category
  updateCategory: async (id, categoryData) => {
    try {
      const response = await apiClient.put(
        `/table/categories/${id}`,
        categoryData
      );
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
  },
};
