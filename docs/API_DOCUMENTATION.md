# API Documentation - ScamReport System

## สรุปการอัพเดท

ระบบได้รับการปรับปรุงให้ดึงข้อมูลจาก API จริง พร้อมการแสดงผลแชท, สรุปข้อมูล และ categories

---

## 📋 API Endpoints ทั้งหมด

### Base URLs
```
VITE_API_BASE_URL=https://clri55iabcwyy7763456lqxhl40owzlg.lambda-url.us-east-1.on.aws
VITE_ADMIN_API_URL=[จะใช้สำหรับ admin endpoints]
```

---

## 🔹 1. Complaints API

### GET /table/complaints
ดึงรายการร้องเรียนทั้งหมด

**Query Parameters:**
- `limit` (optional): จำนวนข้อมูลที่ต้องการดึง

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2/1/2024",
      "category": "กรุงเทพมหานคร",
      "subCategory": "มกราคม",
      "description": "มิจฉาชีพหลอกลงทุน 50,000 บาท",
      "status": "ปัญหาภัยออนไลน์",
      "gender": "ชาย",
      "age": 20,
      "utility": "ได้รับคำแนะนำ",
      "occupation": "นักศึกษา",
      "type": "รับประโยชน์ด้วยตัวเอง",
      "count1": 1,
      "count2": 1,
      "year": 2567
    }
  ]
}
```

**วิธีเรียกใช้:**
```javascript
import { complaintApi } from '../../services/complaintApi';

const complaints = await complaintApi.getComplaints({ limit: 1000 });
```

---

### GET /table/complaints/:id
ดึงรายการร้องเรียนตาม ID

**Response:**
```json
{
  "data": {
    "id": 1,
    "description": "...",
    ...
  }
}
```

**วิธีเรียกใช้:**
```javascript
const complaint = await complaintApi.getComplaintById(1);
```

---

### GET /table/complaints/stats
ดึงสถิติ Dashboard

**Response:**
```json
{
  "totalCases": 100,
  "totalAmount": 5000000,
  "victimCount": 100
}
```

**วิธีเรียกใช้:**
```javascript
const stats = await complaintApi.getStats();
```

---

## 🔹 2. Messages API (ข้อความแชท)

### GET /table/complaints/:id/messages
ดึงข้อความสนทนาทั้งหมดของเรื่องร้องเรียน

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "sender": "ผู้ร้องเรียน",
      "message": "ถูกหลอกลงทุน 50,000 บาท",
      "timestamp": "2024-01-02T10:30:00Z",
      "type": "user"
    },
    {
      "id": 2,
      "sender": "เจ้าหน้าที่",
      "message": "ขอบคุณสำหรับข้อมูล เราจะดำเนินการตรวจสอบ",
      "timestamp": "2024-01-02T11:00:00Z",
      "type": "admin"
    }
  ]
}
```

**วิธีเรียกใช้:**
```javascript
const messages = await complaintApi.getComplaintMessages(complaintId);
```

---

## 🔹 3. Summary API (สรุปข้อมูล)

### GET /table/complaints/:id/summary
ดึงข้อมูลสรุปของเรื่องร้องเรียน

**Response:**
```json
{
  "summary": {
    "summary": "ผู้ร้องเรียนถูกหลอกลงทุนในโครงการคริปโต โอนเงินไป 50,000 บาท",
    "category": "การฉ้อโกงออนไลน์",
    "amount": "฿50,000",
    "keywords": ["การฉ้อโกง", "ออนไลน์", "คริปโต"]
  }
}
```

**วิธีเรียกใช้:**
```javascript
const summary = await complaintApi.getComplaintSummary(complaintId);
```

---

### POST /table/complaints/:id/summary
สร้างสรุปข้อมูลใหม่ (AI-generated)

**Response:**
```json
{
  "summary": {
    "summary": "...",
    "category": "...",
    "amount": "...",
    "keywords": [...]
  }
}
```

**วิธีเรียกใช้:**
```javascript
const newSummary = await complaintApi.createComplaintSummary(complaintId);
```

---

## 🔹 4. Categories API

### GET /table/categories
ดึง categories ทั้งหมด

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "การฉ้อโกงออนไลน์",
      "description": "การหลอกลวงผ่านช่องทางออนไลน์",
      "count": 150,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**วิธีเรียกใช้:**
```javascript
const categories = await complaintApi.getCategories();
```

---

### GET /table/categories/:id
ดึง category ตาม ID

**วิธีเรียกใช้:**
```javascript
const category = await complaintApi.getCategoryById(1);
```

---

### POST /table/categories
สร้าง category ใหม่

**Request Body:**
```json
{
  "name": "การฉ้อโกงออนไลน์",
  "description": "การหลอกลวงผ่านช่องทางออนไลน์"
}
```

**วิธีเรียกใช้:**
```javascript
const newCategory = await complaintApi.createCategory({
  name: "การฉ้อโกงออนไลน์",
  description: "การหลอกลวงผ่านช่องทางออนไลน์"
});
```

---

### PUT /table/categories/:id
อัพเดท category

**Request Body:**
```json
{
  "name": "การฉ้อโกงออนไลน์ (อัพเดท)",
  "description": "..."
}
```

**วิธีเรียกใช้:**
```javascript
const updated = await complaintApi.updateCategory(1, {
  name: "การฉ้อโกงออนไลน์ (อัพเดท)"
});
```

---

### DELETE /table/categories/:id
ลบ category

**วิธีเรียกใช้:**
```javascript
await complaintApi.deleteCategory(1);
```

---

## 📄 หน้าที่ได้รับการอัพเดท

### 1. AdminComplaints (src/pages/admin/AdminComplaints.jsx)

**ฟีเจอร์ใหม่:**
- ✅ ดึงข้อมูลจาก API จริง (พร้อม fallback เป็น mock data)
- ✅ Modal แสดงรายละเอียดแชทเมื่อคลิกปุ่ม "แชท"
- ✅ แสดงสรุปข้อมูล (Summary) พร้อม category และ keywords
- ✅ แสดงข้อความสนทนาแบบ chat interface
- ✅ Loading state และ error handling

**การใช้งาน:**
1. หน้าจะโหลดข้อมูลจาก API อัตโนมัติ
2. คลิกปุ่ม "แชท" ในแต่ละแถวเพื่อดูรายละเอียด
3. Modal จะแสดง:
   - สรุปเรื่องร้องเรียน (AI-generated)
   - ประเภท, มูลค่าความเสียหาย, คำสำคัญ
   - ข้อความสนทนาแบบแชท

---

### 2. ComplaintsPage (src/pages/journalist/ComplaintsPage.jsx)

**ฟีเจอร์ใหม่:**
- ✅ ดึงข้อมูลจาก API จริง
- ✅ Modal แสดงรายละเอียดเต็มรูปแบบ
- ✅ แสดงข้อมูลครบถ้วน: ผู้แจ้ง, มูลค่า, วันที่, ประเภท
- ✅ Loading state
- ✅ หมายเหตุพิเศษสำหรับนักข่าว

**การใช้งาน:**
1. นักข่าวสามารถกรองข้อมูลตามความเร่งด่วน
2. คลิก "ดูรายละเอียด →" เพื่อดูข้อมูลเต็ม
3. Modal จะแสดงข้อมูลที่สามารถนำไปใช้ทำข่าวได้

---

## 🔧 Configuration

### Environment Variables (.env)
```env
# Cognito Configuration
VITE_USER_POOL_ID=us-east-1_HLIRkxHcy
VITE_CLIENT_ID=655kqsglcp5ggp6ciffvgckc9h
VITE_REGION=us-east-1

# API Configuration
VITE_API_ENDPOINT=https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_WS_ENDPOINT=wss://xxxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_API_BASE_URL=https://clri55iabcwyy7763456lqxhl40owzlg.lambda-url.us-east-1.on.aws
```

---

## 🎨 UI Components

### Chat Modal Structure
```
┌─────────────────────────────────────┐
│ Header (Orange)                      │
│ - Title                              │
│ - Description                        │
│ - Close Button                       │
├─────────────────────────────────────┤
│ Content                              │
│ ┌─────────────────────────────────┐ │
│ │ Summary Section (Orange BG)     │ │
│ │ - สรุปเรื่องร้องเรียน           │ │
│ │ - ประเภท | มูลค่า | คำสำคัญ    │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Chat Messages (Gray BG)         │ │
│ │ - ข้อความสนทนา                  │ │
│ │ - แยกสีตาม sender               │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Footer                               │
│ [ปิด] [ส่งออกข้อมูล]                │
└─────────────────────────────────────┘
```

---

## 📊 Data Flow

### Admin Workflow
```
1. AdminComplaints โหลด
   ↓
2. เรียก complaintApi.getComplaints()
   ↓
3. แสดงข้อมูลในตาราง
   ↓
4. User คลิก "แชท"
   ↓
5. เรียก complaintApi.getComplaintMessages(id)
   และ complaintApi.getComplaintSummary(id)
   ↓
6. แสดง Modal พร้อมข้อมูลแชทและสรุป
```

### Journalist Workflow
```
1. ComplaintsPage โหลด
   ↓
2. เรียก complaintApi.getComplaints()
   ↓
3. แสดงรายการร้องเรียน
   ↓
4. User คลิก "ดูรายละเอียด"
   ↓
5. แสดง Modal พร้อมข้อมูลเต็ม
```

---

## 🚀 Next Steps (แนะนำ)

### Backend API ที่ต้องสร้าง:
1. ✅ `/table/complaints` - มีอยู่แล้ว
2. ⚠️ `/table/complaints/:id/messages` - ต้องสร้างใหม่
3. ⚠️ `/table/complaints/:id/summary` - ต้องสร้างใหม่
4. ⚠️ `/table/categories` - ต้องสร้างใหม่

### Features ที่ควรเพิ่ม:
1. ระบบส่งออกข้อมูล (Export PDF/CSV)
2. ระบบแจ้งเตือน (Real-time notifications)
3. ระบบค้นหาขั้นสูง (Advanced search)
4. Dashboard analytics
5. การจัดการ categories แบบ CRUD ใน UI

---

## 📝 Notes

### Fallback Mechanism
- ระบบจะใช้ Mock Data เมื่อ API ไม่พร้อม
- ช่วยให้การพัฒนาและทดสอบทำได้ง่ายขึ้น

### Error Handling
- ทุก API call มี try-catch
- แสดง error ใน console
- ไม่ให้แอพ crash เมื่อ API มีปัญหา

### Authentication
- ใช้ AWS Cognito
- Token ถูกส่งอัตโนมัติใน headers
- Auto-redirect เมื่อ session หมดอายุ

---

## 📞 Support

หากมีปัญหาหรือข้อสงสัย สามารถตรวจสอบ:
- Console logs สำหรับ API responses
- Network tab ใน Browser DevTools
- Error messages ที่แสดงในหน้าจอ
