// src/services/complaintApi.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-lambda-url.amazonaws.com';

export const complaintApi = {
  // ดึงรายการร้องเรียนทั้งหมด
  getComplaints: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/complaints?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // เพิ่ม Authorization ถ้ามี
        // 'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch complaints');
    }
    
    return response.json();
  },

  // ดึงรายการตาม ID
  getComplaintById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch complaint');
    }
    return response.json();
  },

  // สถิติ Dashboard
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  }
};