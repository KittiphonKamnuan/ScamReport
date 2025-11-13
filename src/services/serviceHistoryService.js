// src/services/serviceHistoryService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('Service History Service - API_BASE_URL:', API_BASE_URL);

// สร้าง axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function สำหรับ parse Lambda response
const parseLambdaResponse = (data) => {
  if (data.body && typeof data.body === 'string') {
    return JSON.parse(data.body);
  }
  return data;
};

export const serviceHistoryService = {
  /**
   * ดึงรายการ Service History ทั้งหมด
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} รายการ service history
   */
  getServiceHistory: async (params = {}) => {
    try {
      console.log('📥 Fetching service history...', params);

      const response = await apiClient.get('/table/service_history', { params });
      const data = parseLambdaResponse(response.data);

      console.log('✅ Service history data:', data);
      return data.data || data;

    } catch (error) {
      console.error('❌ Error fetching service history:', error);
      throw error;
    }
  },

  /**
   * ดึง Service History ตาม ID
   * @param {string} id - Record ID (UUID)
   * @returns {Promise<Object>} service history record
   */
  getServiceHistoryById: async (id) => {
    try {
      console.log(`📥 Fetching service history: ${id}`);

      const response = await apiClient.get(`/table/service_history/${id}`);
      const data = parseLambdaResponse(response.data);

      return data.data || data;

    } catch (error) {
      console.error(`❌ Error fetching service history ${id}:`, error);
      throw error;
    }
  },

  /**
   * ดึง Service History ตาม Record Number (HIS-YYYYMM-XXXX)
   * @param {string} recordNumber - Record number
   * @returns {Promise<Object>} service history record
   */
  getServiceHistoryByRecordNumber: async (recordNumber) => {
    try {
      console.log(`📥 Fetching service history by record number: ${recordNumber}`);

      const response = await apiClient.get(`/table/service_history/record/${recordNumber}`);
      const data = parseLambdaResponse(response.data);

      return data.data || data;

    } catch (error) {
      console.error(`❌ Error fetching service history by record number:`, error);
      throw error;
    }
  },

  /**
   * ดึงสถิติ Service History
   * @param {Object} params - Query parameters (year, etc.)
   * @returns {Promise<Object>} statistics
   */
  getServiceHistoryStats: async (params = {}) => {
    try {
      console.log('📊 Fetching service history stats...', params);

      const response = await apiClient.get('/table/service_history/stats', { params });
      const data = parseLambdaResponse(response.data);

      return data;

    } catch (error) {
      console.error('❌ Error fetching service history stats:', error);
      throw error;
    }
  },

  /**
   * สร้าง Service History ใหม่
   * @param {Object} serviceData - Service history data
   * @returns {Promise<Object>} created record
   */
  createServiceHistory: async (serviceData) => {
    try {
      console.log('📝 Creating service history...', serviceData);

      const response = await apiClient.post('/table/service_history', serviceData);
      const data = parseLambdaResponse(response.data);

      console.log('✅ Service history created:', data.record_number);
      return data.data || data;

    } catch (error) {
      console.error('❌ Error creating service history:', error);
      throw error;
    }
  },

  /**
   * อัพเดท Service History
   * @param {string} id - Record ID
   * @param {Object} serviceData - Updated data
   * @returns {Promise<Object>} updated record
   */
  updateServiceHistory: async (id, serviceData) => {
    try {
      console.log(`📝 Updating service history ${id}...`, serviceData);

      const response = await apiClient.put(`/table/service_history/${id}`, serviceData);
      const data = parseLambdaResponse(response.data);

      console.log('✅ Service history updated');
      return data.data || data;

    } catch (error) {
      console.error(`❌ Error updating service history ${id}:`, error);
      throw error;
    }
  },

  /**
   * ลบ Service History
   * @param {string} id - Record ID
   * @returns {Promise<Object>} deleted record
   */
  deleteServiceHistory: async (id) => {
    try {
      console.log(`🗑️  Deleting service history ${id}...`);

      const response = await apiClient.delete(`/table/service_history/${id}`);
      const data = parseLambdaResponse(response.data);

      console.log('✅ Service history deleted');
      return data.data || data;

    } catch (error) {
      console.error(`❌ Error deleting service history ${id}:`, error);
      throw error;
    }
  }
};

export default serviceHistoryService;
