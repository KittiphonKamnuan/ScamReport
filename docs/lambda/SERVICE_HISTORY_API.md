# Service History API Endpoints

## 📋 ภาพรวม

API endpoints สำหรับจัดการประวัติการให้บริการ (service_history)

**Base URL:** `https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws`

---

## 🔌 Endpoints

### 1. GET /table/service-history
**ดึงข้อมูลประวัติการให้บริการทั้งหมด**

**Query Parameters:**
```
limit       - จำนวนรายการต่อหน้า (default: 100)
page        - หน้าที่ต้องการ (default: 1)
offset      - เริ่มจากรายการที่ (ใช้แทน page)
province    - กรองตามจังหวัด
year        - กรองตามปี พ.ศ.
issue_type  - กรองตามประเภทประเด็น
status      - กรองตามสถานะ (completed/archived)
```

**ตัวอย่าง Request:**
```bash
# ดึงข้อมูล 20 รายการแรก
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history?limit=20"

# กรองตามจังหวัดและปี
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history?province=กรุงเทพมหานคร&year=2567"

# หน้าที่ 2
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history?page=2&limit=20"
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "record_number": "HIS-256711-1234",
      "date": "2024-01-02",
      "province": "กรุงเทพมหานคร",
      "month_name": "มกราคม",
      "description": "มิจฉาชีพหลอกลงทุน 50,000 บาท",
      "issue_type": "ปัญหาภัยออนไลน์",
      "gender": "ชาย",
      "age": 20,
      "occupation": "นักศึกษา",
      "financial_damage": 50000.00,
      "benefit_received": "ได้รับคำแนะนำ",
      "beneficiary_status": "รับประโยชน์ด้วยตัวเอง",
      "is_representative": false,
      "organization_name": null,
      "beneficiary_count": 1,
      "year": 2567,
      "status": "completed",
      "recorded_by": "admin",
      "updated_by": null,
      "created_at": "2024-11-12T10:00:00Z",
      "updated_at": "2024-11-12T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasMore": true
  }
}
```

---

### 2. GET /table/service-history/:id
**ดึงข้อมูลประวัติการให้บริการตาม ID**

**ตัวอย่าง Request:**
```bash
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history/84615346-cebb-4ed4-844f-20eaeec3f7f8"
```

**Response:**
```json
{
  "data": {
    "id": "84615346-cebb-4ed4-844f-20eaeec3f7f8",
    "record_number": "HIS-256711-1234",
    "date": "2024-01-02",
    "province": "กรุงเทพมหานคร",
    ...
  }
}
```

**Error Response (404):**
```json
{
  "error": "Record not found"
}
```

---

### 3. POST /table/service-history
**เพิ่มข้อมูลประวัติการให้บริการใหม่**

**Required Fields:**
- `date` - วันที่ (YYYY-MM-DD)
- `description` - รายละเอียด
- `year` - ปี พ.ศ.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "province": "กรุงเทพมหานคร",
  "month_name": "มกราคม",
  "description": "โดนหลอกซื้อของออนไลน์ 5,000 บาท",
  "issue_type": "ปัญหาภัยออนไลน์",
  "gender": "หญิง",
  "age": 25,
  "occupation": "พนักงานบริษัท",
  "financial_damage": 5000,
  "benefit_received": "ได้รับคำแนะนำ",
  "beneficiary_status": "รับประโยชน์ด้วยตัวเอง",
  "is_representative": false,
  "organization_name": null,
  "beneficiary_count": 1,
  "year": 2567,
  "status": "completed",
  "recorded_by": "admin"
}
```

**ตัวอย่าง Request:**
```bash
curl -X POST "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "province": "กรุงเทพมหานคร",
    "month_name": "มกราคม",
    "description": "โดนหลอกซื้อของออนไลน์ 5,000 บาท",
    "issue_type": "ปัญหาภัยออนไลน์",
    "gender": "หญิง",
    "age": 25,
    "occupation": "พนักงานบริษัท",
    "financial_damage": 5000,
    "benefit_received": "ได้รับคำแนะนำ",
    "beneficiary_status": "รับประโยชน์ด้วยตัวเอง",
    "year": 2567,
    "status": "completed",
    "recorded_by": "admin"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "new-uuid",
    "record_number": "HIS-256711-5678",
    "date": "2024-01-15",
    ...
  },
  "message": "Service history record created successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields",
  "required": ["date", "description", "year"]
}
```

---

### 4. PUT /table/service-history/:id
**แก้ไขข้อมูลประวัติการให้บริการ**

**Request Body:** (ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข)
```json
{
  "description": "โดนหลอกซื้อของออนไลน์ 5,500 บาท (แก้ไข)",
  "financial_damage": 5500,
  "updated_by": "admin2"
}
```

**ตัวอย่าง Request:**
```bash
curl -X PUT "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history/84615346-cebb-4ed4-844f-20eaeec3f7f8" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "โดนหลอกซื้อของออนไลน์ 5,500 บาท (แก้ไข)",
    "financial_damage": 5500,
    "updated_by": "admin2"
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "84615346-cebb-4ed4-844f-20eaeec3f7f8",
    "record_number": "HIS-256711-1234",
    "description": "โดนหลอกซื้อของออนไลน์ 5,500 บาท (แก้ไข)",
    "financial_damage": 5500.00,
    "updated_by": "admin2",
    "updated_at": "2024-11-12T11:30:00Z",
    ...
  },
  "message": "Service history record updated successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Record not found"
}
```

---

### 5. DELETE /table/service-history/:id
**ลบข้อมูลประวัติการให้บริการ**

**ตัวอย่าง Request:**
```bash
curl -X DELETE "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history/84615346-cebb-4ed4-844f-20eaeec3f7f8"
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "84615346-cebb-4ed4-844f-20eaeec3f7f8",
    "record_number": "HIS-256711-1234",
    ...
  },
  "message": "Service history record deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Record not found"
}
```

---

### 6. GET /table/service-history/stats
**ดึงสถิติประวัติการให้บริการ**

**Query Parameters:**
```
year - กรองตามปี พ.ศ. (optional)
```

**ตัวอย่าง Request:**
```bash
# สถิติทั้งหมด
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history/stats"

# สถิติของปี 2567
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history/stats?year=2567"
```

**Response:**
```json
{
  "overall": {
    "total_records": 150,
    "total_damage": 15000000.00,
    "avg_damage": 100000.00,
    "total_beneficiaries": 200,
    "provinces_count": 15,
    "representative_cases": 20
  },
  "by_province": [
    {
      "province": "กรุงเทพมหานคร",
      "count": 50,
      "total_damage": 5000000.00
    },
    {
      "province": "เชียงใหม่",
      "count": 20,
      "total_damage": 1500000.00
    }
  ],
  "by_issue_type": [
    {
      "issue_type": "ปัญหาภัยออนไลน์",
      "count": 100,
      "total_damage": 10000000.00
    },
    {
      "issue_type": "ปัญหาอื่นๆ",
      "count": 50,
      "total_damage": 5000000.00
    }
  ]
}
```

---

## 🔧 การติดตั้งใน Lambda

### 1. เปิดไฟล์ Lambda
ใน AWS Lambda Console:
1. เปิด function `scamreport-api`
2. ไปที่แท็บ **Code**

### 2. เพิ่ม Code
เปิดไฟล์ `service-history-endpoints.js` และ copy code ทั้งหมด

**วาง code ที่:**
```javascript
// ใน exports.handler = async (event) => {
//   ...
//   try {
//     const conn = await getDbConnection();

      // วาง code service history endpoints ตรงนี้
      // ก่อน return response(404, ...)

//     return response(404, { error: 'Route not found' }, origin);
//   } catch (error) {
//     ...
//   }
// }
```

### 3. Deploy
1. คลิก **Deploy** (ปุ่มสีส้ม)
2. รอให้ขึ้น "Successfully updated the function..."

---

## 🧪 ทดสอบ API

### ทดสอบด้วย curl:
```bash
# 1. ดึงข้อมูลทั้งหมด
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history?limit=10"

# 2. เพิ่มข้อมูลใหม่
curl -X POST "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history" \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-20","description":"Test","year":2567}'

# 3. ดูสถิติ
curl "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history/stats"
```

### ทดสอบด้วย JavaScript:
```javascript
// GET - ดึงข้อมูล
const response = await fetch('https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history?limit=20');
const data = await response.json();
console.log(data);

// POST - เพิ่มข้อมูล
const response = await fetch('https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/service-history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2024-01-20',
    province: 'กรุงเทพมหานคร',
    description: 'ทดสอบเพิ่มข้อมูล',
    year: 2567
  })
});
const data = await response.json();
console.log(data);
```

---

## 📝 Error Codes

| Code | Description |
|------|-------------|
| 200 | สำเร็จ (GET, PUT, DELETE) |
| 201 | สร้างสำเร็จ (POST) |
| 400 | ข้อมูลไม่ถูกต้อง / ขาดฟิลด์ที่จำเป็น |
| 404 | ไม่พบข้อมูล |
| 500 | Server Error |

---

## 🔐 Security Notes

1. **Validation:** Lambda ตรวจสอบ UUID format และ required fields
2. **SQL Injection:** ใช้ parameterized queries
3. **CORS:** กำหนด allowed origins ใน Lambda
4. **Rate Limiting:** ควรเพิ่มใน production

---

**Created:** 2024-11-12
**Last Updated:** 2024-11-12
**Version:** 1.0
