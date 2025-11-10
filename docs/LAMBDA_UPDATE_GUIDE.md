# Lambda Function Update Guide

## สรุปการแก้ไข

ได้ทำการอัพเดท Lambda function เพื่อเพิ่ม endpoints ใหม่ที่รองรับการดึงข้อมูล messages พร้อมกับ title จาก complaint table

## การเปลี่ยนแปลงหลัก

### 1. เพิ่ม Endpoint: GET /table/complaints/:id/messages

**วัตถุประสงค์:** ดึงข้อความทั้งหมดของ complaint พร้อมกับข้อมูล title จาก complaints table

**SQL Query:**
```sql
SELECT
    m.id,
    m.complaint_id,
    m.sender_id,
    m.sender_type,
    m.sender_name,
    m.message,
    m.timestamp,
    m.created_at,
    c.title as complaint_title,
    c.description as complaint_description,
    c.status as complaint_status
FROM messages m
INNER JOIN complaints c ON m.complaint_id = c.id
WHERE m.complaint_id = $1
ORDER BY m.timestamp ASC, m.created_at ASC
```

**Response Format:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "complaint_id": "uuid",
      "sender_id": "uuid",
      "sender_type": "user",
      "sender_name": "ชื่อผู้ส่ง",
      "message": "ข้อความ",
      "content": "ข้อความ",
      "timestamp": "2024-01-01T10:00:00Z",
      "sent_at": "2024-01-01T10:00:00Z",
      "created_at": "2024-01-01T10:00:00Z",
      "complaint_title": "หัวข้อเรื่องร้องเรียน"
    }
  ],
  "complaint_title": "หัวข้อเรื่องร้องเรียน",
  "complaint_description": "รายละเอียด",
  "complaint_status": "pending",
  "complaint_id": "uuid",
  "count": 10
}
```

**ฟีเจอร์:**
- JOIN กับ complaints table เพื่อดึง title มาด้วย
- รองรับหลาย field aliases สำหรับความเข้ากันได้ (message/content, timestamp/sent_at)
- ตรวจสอบว่า complaint มีอยู่จริงก่อนส่ง error
- ส่ง array ว่างถ้าไม่มี messages แต่ complaint มีอยู่

---

### 2. เพิ่ม Endpoint: GET /table/complaints/:id/summary

**วัตถุประสงค์:** ดึงข้อมูล summary ของ complaint พร้อมข้อมูลผู้ติดต่อ

**SQL Query:**
```sql
SELECT
    s.id,
    s.complaint_id,
    s.summary,
    s.category,
    s.keywords,
    s.created_at,
    s.updated_at,
    c.title as complaint_title,
    c.description as complaint_description,
    c.contact_name,
    c.contact_phone,
    c.line_display_name,
    c.line_id,
    c.total_loss_amount
FROM summaries s
INNER JOIN complaints c ON s.complaint_id = c.id
WHERE s.complaint_id = $1
ORDER BY s.created_at DESC
LIMIT 1
```

**Response Format:**
```json
{
  "summary": {
    "id": "uuid",
    "summary": "สรุปเรื่องร้องเรียน",
    "ai_summary": "สรุปเรื่องร้องเรียน",
    "text": "สรุปเรื่องร้องเรียน",
    "category": "การฉ้อโกงออนไลน์",
    "scam_type": "การฉ้อโกงออนไลน์",
    "keywords": ["คำสำคัญ1", "คำสำคัญ2"],
    "tags": ["คำสำคัญ1", "คำสำคัญ2"],
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  },
  "complaint_title": "หัวข้อเรื่องร้องเรียน",
  "complaint_description": "รายละเอียด",
  "contact_name": "ชื่อผู้ติดต่อ",
  "contact_phone": "เบอร์โทร",
  "line_display_name": "LINE Display Name",
  "line_id": "LINE ID",
  "amount": 50000,
  "loss_amount": 50000,
  "complaint_id": "uuid"
}
```

**ฟีเจอร์:**
- JOIN กับ complaints table เพื่อดึงข้อมูลผู้ติดต่อ
- รองรับหลาย field aliases
- ส่งข้อมูล complaint กลับมาแม้ไม่มี summary
- ดึง summary ล่าสุด (ORDER BY created_at DESC LIMIT 1)

---

### 3. เพิ่ม Endpoint: POST /table/complaints/:id/summary

**วัตถุประสงค์:** สร้าง summary ใหม่สำหรับ complaint (Placeholder สำหรับ AI integration ในอนาคต)

**Response Format:**
```json
{
  "message": "Summary created successfully",
  "summary": {
    "id": "uuid",
    "complaint_id": "uuid",
    "summary": "Summary is being generated...",
    "category": "Pending Analysis",
    "keywords": ["pending"],
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

---

## วิธีการ Deploy

### 1. อัพโหลดไฟล์ใหม่ไปยัง Lambda

```bash
# ถ้าใช้ AWS CLI
cd /path/to/lambda-function
zip -r function.zip .
aws lambda update-function-code \
  --function-name your-lambda-function-name \
  --zip-file fileb://function.zip
```

### 2. หรืออัพโหลดผ่าน AWS Console

1. เปิด AWS Lambda Console
2. เลือก function ที่ต้องการอัพเดท
3. ไปที่แท็บ "Code"
4. คัดลอกโค้ดจากไฟล์ `lambda-updated.js` ไปวาง
5. คลิก "Deploy"

---

## การทดสอบ

### ทดสอบ Messages Endpoint

```bash
# แทนที่ LAMBDA_URL และ COMPLAINT_ID ด้วยค่าจริง
curl https://your-lambda-url/table/complaints/COMPLAINT_ID/messages
```

**Expected Response:**
```json
{
  "messages": [...],
  "complaint_title": "หัวข้อเรื่อง",
  "complaint_id": "uuid",
  "count": 10
}
```

### ทดสอบ Summary Endpoint

```bash
curl https://your-lambda-url/table/complaints/COMPLAINT_ID/summary
```

**Expected Response:**
```json
{
  "summary": {...},
  "complaint_title": "หัวข้อเรื่อง",
  "contact_name": "ชื่อผู้ติดต่อ",
  ...
}
```

---

## Database Schema Requirements

ตรวจสอบว่า database มี tables และ columns ดังนี้:

### Table: complaints
- `id` (UUID, Primary Key)
- `title` (VARCHAR) - **จำเป็น**
- `description` (TEXT)
- `status` (VARCHAR)
- `contact_name` (VARCHAR)
- `contact_phone` (VARCHAR)
- `line_display_name` (VARCHAR)
- `line_id` (VARCHAR)
- `total_loss_amount` (NUMERIC)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Table: messages
- `id` (UUID, Primary Key)
- `complaint_id` (UUID, Foreign Key -> complaints.id) - **จำเป็น**
- `sender_id` (UUID)
- `sender_type` (VARCHAR)
- `sender_name` (VARCHAR)
- `message` (TEXT)
- `timestamp` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### Table: summaries
- `id` (UUID, Primary Key)
- `complaint_id` (UUID, Foreign Key -> complaints.id) - **จำเป็น**
- `summary` (TEXT)
- `category` (VARCHAR)
- `keywords` (TEXT[] or JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Breaking Changes

**ไม่มี Breaking Changes** - การอัพเดทนี้เป็นการเพิ่ม endpoints ใหม่เท่านั้น ไม่มีการแก้ไข endpoints เดิม

---

## Compatibility Notes

- รองรับ field aliases หลายรูปแบบเพื่อความเข้ากันได้กับ frontend เดิม
- Response format ตรงตาม API Documentation ที่มีอยู่แล้ว
- ถ้าไม่มีข้อมูลในบาง table จะส่ง fallback data กลับไป ไม่ให้เกิด error

---

## ขั้นตอนถัดไป (แนะนำ)

1. **ทดสอบกับ Database จริง** - ตรวจสอบว่า schema ตรงกับที่กำหนด
2. **อัพเดท Frontend** - ตรวจสอบว่า frontend รับ response ใหม่ได้ถูกต้อง
3. **เพิ่ม AI Integration** - สำหรับ POST /summary endpoint
4. **เพิ่ม Caching** - เพิ่ม Redis หรือ ElastiCache สำหรับ summary ที่ใช้บ่อย
5. **เพิ่ม Authentication/Authorization** - ตรวจสอบสิทธิ์การเข้าถึง messages

---

## Environment Variables

ตรวจสอบว่า Lambda function มี environment variables ดังนี้:

```
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SCHEMA=public
NODE_ENV=production
```

---

## สรุป

การอัพเดทนี้เพิ่มความสามารถในการดึงข้อมูล messages พร้อมกับ **complaint title** โดยใช้ INNER JOIN ระหว่าง messages และ complaints table ทำให้ frontend ไม่ต้องทำ request หลายครั้ง และได้ข้อมูลครบถ้วนในครั้งเดียว

**Key Benefits:**
- ลดจำนวน API calls
- ได้ข้อมูล complaint title ใน message response
- รองรับ backward compatibility
- มี error handling ที่ดีขึ้น
