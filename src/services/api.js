import axios from 'axios';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL;

// สร้าง axios instance พร้อม config
const apiClient = axios.create({
  baseURL: ADMIN_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor สำหรับเพิ่ม token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor สำหรับจัดการ error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin API Functions
export const adminApi = {
  // GET - ดึงข้อมูล admin ทั้งหมด
  async getAllAdmins() {
    try {
      const response = await apiClient.get('/admin');
      return response.data;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },

  // GET - ดึงข้อมูล admin ตาม ID
  async getAdminById(adminId) {
    try {
      const response = await apiClient.get(`/admin/${adminId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching admin ${adminId}:`, error);
      throw error;
    }
  },

  // POST - สร้าง admin ใหม่
  async createAdmin(adminData) {
    try {
      const response = await apiClient.post('/admin', adminData);
      return response.data;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  },

  // PUT - อัพเดท admin
  async updateAdmin(adminId, adminData) {
    try {
      const response = await apiClient.put(`/admin/${adminId}`, adminData);
      return response.data;
    } catch (error) {
      console.error(`Error updating admin ${adminId}:`, error);
      throw error;
    }
  },

  // DELETE - ลบ admin
  async deleteAdmin(adminId) {
    try {
      const response = await apiClient.delete(`/admin/${adminId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting admin ${adminId}:`, error);
      throw error;
    }
  }
};

// Dashboard API Functions
export const dashboardApi = {
  // GET - ดึงสถิติ Dashboard จากตาราง complaints
  async getDashboardStats() {
    try {
      // ดึงข้อมูลทั้งหมดจากตาราง complaints
      const response = await apiClient.get('/table/complaints', {
        params: { limit: 10000 }
      });
      
      console.log('=== RAW API RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('=======================');
      
      // Lambda อาจ return body เป็น string ต้อง parse
      let responseData = response.data;
      
      // ถ้า Lambda ส่งมาเป็น { statusCode, body: "string" }
      if (responseData.body && typeof responseData.body === 'string') {
        responseData = JSON.parse(responseData.body);
      }
      
      const complaints = responseData.data || [];
      
      console.log('=== PARSED COMPLAINTS ===');
      console.log('Total complaints:', complaints.length);
      console.log('First complaint:', complaints[0]);
      console.log('========================');
      
      if (complaints.length === 0) {
        console.warn('⚠️ No complaints data found!');
        return { totalCases: 0, totalAmount: 0, victimCount: 0 };
      }
      
      // คำนวณสถิติ
      let totalAmount = 0;
      complaints.forEach(c => {
        // ลองหาค่ายอดเงินจาก fields ต่างๆ
        const amount = parseFloat(
          c.total_loss_amount || 
          0
        );
        totalAmount += amount;
      });
      
      const stats = {
        totalCases: complaints.length,
        totalAmount: Math.round(totalAmount),
        victimCount: complaints.length
      };
      
      console.log('=== CALCULATED STATS ===');
      console.log(stats);
      console.log('=======================');
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // GET - ดึงข้อมูล Chart ตามช่วงเวลา
  async getChartData(filter = 'month') {
    try {
      const response = await apiClient.get('/table/complaints', {
        params: { limit: 10000 }
      });
      
      console.log('=== CHART RAW RESPONSE ===');
      console.log('Response:', response.data);
      console.log('=========================');
      
      // Parse body ถ้าเป็น string
      let responseData = response.data;
      if (responseData.body && typeof responseData.body === 'string') {
        responseData = JSON.parse(responseData.body);
      }
      
      const complaints = responseData.data || [];
      
      console.log('Total complaints for chart:', complaints.length);
      
      if (complaints.length === 0) {
        console.warn('⚠️ No data for chart!');
        return { filter, chartData: [] };
      }
      
      // จัดกลุ่มข้อมูลตาม filter
      const chartData = dashboardApi.groupDataByFilter(complaints, filter);
      
      console.log('=== CHART DATA ===');
      console.log('Filter:', filter);
      console.log('Chart data:', chartData);
      console.log('==================');
      
      return { filter, chartData };
      
    } catch (error) {
      console.error('❌ Error fetching chart data:', error);
      throw error;
    }
  },

  // GET - ดึงกลโกงรูปแบบใหม่
  async getNewScamTypes(limit = 4) {
    try {
      const response = await apiClient.get('/table/complaints', {
        params: { limit: 20 } // ดึงมากกว่า limit เผื่อข้อมูลไม่ครบ
      });
      
      console.log('=== NEW SCAMS RAW RESPONSE ===');
      console.log('Response:', response.data);
      console.log('==============================');
      
      // Parse body ถ้าเป็น string
      let responseData = response.data;
      if (responseData.body && typeof responseData.body === 'string') {
        responseData = JSON.parse(responseData.body);
      }
      
      const complaints = responseData.data || [];
      
      console.log('Total complaints for new scams:', complaints.length);
      console.log('First complaint structure:', complaints[0]);
      
      if (complaints.length === 0) {
        console.warn('⚠️ No new scams data!');
        return { scamTypes: [] };
      }
      
      // แปลงข้อมูล - ลองหา fields ต่างๆ ที่อาจมี
      const scamTypes = complaints.slice(0, limit).map((c, index) => {
        console.log(`Processing complaint ${index}:`, c);
        
        return {
          name:
                c.category || 
                `กลโกง #${index + 1}`,
          contact: 
                   c.line_display_name || 
                   'ไม่ระบุชื่อ',
          phone:
                 c.contact_phone || 
                 '-',
          reportDate:
                     c.created_at
        };
      });
      
      console.log('=== PROCESSED SCAM TYPES ===');
      console.log(scamTypes);
      console.log('===========================');
      
      return { scamTypes };
      
    } catch (error) {
      console.error('❌ Error fetching new scam types:', error);
      throw error;
    }
  },

  // Helper: จัดกลุ่มข้อมูลตาม filter
  groupDataByFilter(complaints, filter) {
    const grouped = {};
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    
    complaints.forEach(complaint => {
      const dateStr = complaint.first_message_at ||
                complaint.last_message_at ||
                complaint.created_at ||
                complaint.updated_at ||
                complaint.report_date ||
                complaint.date ||
                complaint.timestamp ||
                complaint.datetime ||
                complaint.time ||
                complaint.report_time;
      if (!dateStr) {
        console.log('⚠️ Complaint without date:', complaint.id);
        return;
      }
      
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        console.log('⚠️ Invalid date:', dateStr);
        return;
      }
      
      let key;
      
      if (filter === 'day') {
        key = thaiDays[date.getDay()];
      } else if (filter === 'week') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `สัปดาห์ ${weekNum}`;
      } else if (filter === 'month') {
        key = thaiMonths[date.getMonth()];
      } else if (filter === 'year') {
        key = date.getFullYear().toString();
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    console.log('Grouped data:', grouped);
    
    // แปลงเป็น array format
    if (filter === 'day') {
      return thaiDays.map(day => ({ label: day, value: grouped[day] || 0 }));
    } else if (filter === 'week') {
      return [1, 2, 3, 4].map(w => ({ 
        label: `สัปดาห์ ${w}`, 
        value: grouped[`สัปดาห์ ${w}`] || 0 
      }));
    } else if (filter === 'month') {
      return thaiMonths.map(month => ({ 
        label: month, 
        value: grouped[month] || 0
      }));
    } else if (filter === 'year') {
      const years = Object.keys(grouped).sort();
      return years.map(year => ({ 
        label: year, 
        value: grouped[year] 
      }));
    }
    
    return [];
  }
};

export default apiClient;