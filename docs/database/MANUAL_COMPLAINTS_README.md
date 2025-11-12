# Manual Complaints - ข้อมูลผู้ร้องเรียนที่เพิ่มเอง

## 📋 ภาพรวม

ตารางนี้เก็บข้อมูลผู้ร้องเรียนที่ **Admin หรือ Journalist เพิ่มเอง** หลังจากจัดการกับปัญหาเสร็จแล้ว

**ความแตกต่างจากตาราง `complaints`:**
- ตาราง `complaints` = ข้อมูลจาก LINE Bot (อัตโนมัติ)
- ตาราง `manual_complaints` = ข้อมูลที่เพิ่มด้วยตนเอง (Manual)

---

## 🗄️ โครงสร้างตาราง

### ฟิลด์หลัก

| ฟิลด์ | ชนิดข้อมูล | คำอธิบาย | ตัวอย่าง |
|-------|-----------|----------|---------|
| `id` | UUID | Primary Key | `uuid` |
| `complaint_number` | VARCHAR(50) | รหัสอ้างอิงอัตโนมัติ | `MAN-256701-1234` |
| `date` | DATE | วันที่เกิดเหตุ | `2024-01-02` |
| `province` | VARCHAR(100) | จังหวัด | `กรุงเทพมหานคร` |
| `month_name` | VARCHAR(50) | เดือน | `มกราคม` |
| `description` | TEXT | รายละเอียดประเด็น | `มิจฉาชีพหลอกลงทุน 50,000 บาท` |
| `issue_type` | VARCHAR(100) | ประเภทประเด็น | `ปัญหาภัยออนไลน์` |

### ข้อมูลผู้เสียหาย

| ฟิลด์ | ชนิดข้อมูล | คำอธิบาย |
|-------|-----------|----------|
| `gender` | VARCHAR(20) | เพศ (ชาย/หญิง/ไม่ระบุ) |
| `age` | INTEGER | อายุ |
| `occupation` | VARCHAR(100) | อาชีพ |
| `financial_damage` | DECIMAL(15,2) | ยอดเงินที่สูญเสีย (บาท) |

### ผลลัพธ์และประโยชน์

| ฟิลด์ | ชนิดข้อมูล | คำอธิบาย |
|-------|-----------|----------|
| `benefit_received` | VARCHAR(200) | ประโยชน์ที่ได้รับ |
| `beneficiary_status` | VARCHAR(200) | สถานะของผู้ได้รับประโยชน์ |

### กรณีเป็นตัวแทน

| ฟิลด์ | ชนิดข้อมูล | คำอธิบาย |
|-------|-----------|----------|
| `is_representative` | BOOLEAN | เป็นตัวแทนหรือไม่ |
| `organization_name` | VARCHAR(200) | ชื่อชุมชน/หน่วยงาน |
| `beneficiary_count` | INTEGER | จำนวนผู้ได้รับประโยชน์ |

---

## 🚀 วิธีใช้งาน

### 1. สร้างตารางใน DBeaver

```sql
-- เปิดไฟล์: create_manual_complaints_table.sql
-- แล้วรันทั้งหมด
```

หรือรันทีละส่วน:

**Step 1: สร้างตาราง**
```sql
CREATE TABLE IF NOT EXISTS manual_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    province VARCHAR(100),
    month_name VARCHAR(50),
    description TEXT NOT NULL,
    issue_type VARCHAR(100),
    gender VARCHAR(20),
    age INTEGER,
    occupation VARCHAR(100),
    financial_damage DECIMAL(15,2),
    benefit_received VARCHAR(200),
    beneficiary_status VARCHAR(200),
    is_representative BOOLEAN DEFAULT false,
    organization_name VARCHAR(200),
    beneficiary_count INTEGER DEFAULT 1,
    year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Step 2: สร้าง Indexes**
```sql
CREATE INDEX idx_manual_complaints_date ON manual_complaints(date DESC);
CREATE INDEX idx_manual_complaints_province ON manual_complaints(province);
CREATE INDEX idx_manual_complaints_issue_type ON manual_complaints(issue_type);
CREATE INDEX idx_manual_complaints_status ON manual_complaints(status);
CREATE INDEX idx_manual_complaints_year ON manual_complaints(year);
CREATE INDEX idx_manual_complaints_created_at ON manual_complaints(created_at DESC);
```

**Step 3: สร้าง Triggers**
```sql
-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_manual_complaints_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manual_complaints_timestamp
    BEFORE UPDATE ON manual_complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_manual_complaints_timestamp();

-- Auto-generate complaint number
CREATE OR REPLACE FUNCTION generate_manual_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
    new_number VARCHAR(50);
    year_be INTEGER;
    month_num VARCHAR(2);
    random_digits VARCHAR(4);
BEGIN
    year_be := EXTRACT(YEAR FROM CURRENT_DATE) + 543;
    month_num := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    random_digits := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    new_number := 'MAN-' || year_be || month_num || '-' || random_digits;

    WHILE EXISTS (SELECT 1 FROM manual_complaints WHERE complaint_number = new_number) LOOP
        random_digits := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        new_number := 'MAN-' || year_be || month_num || '-' || random_digits;
    END LOOP;

    NEW.complaint_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_manual_complaint_number
    BEFORE INSERT ON manual_complaints
    FOR EACH ROW
    WHEN (NEW.complaint_number IS NULL)
    EXECUTE FUNCTION generate_manual_complaint_number();
```

### 2. เพิ่มข้อมูลตัวอย่าง

```sql
INSERT INTO manual_complaints (
    date, province, month_name, description, issue_type,
    gender, age, occupation, financial_damage,
    benefit_received, beneficiary_status, year, status
) VALUES
(
    '2024-01-02',
    'กรุงเทพมหานคร',
    'มกราคม',
    'มิจฉาชีพหลอกลงทุน 50,000 บาท',
    'ปัญหาภัยออนไลน์',
    'ชาย',
    20,
    'นักศึกษา',
    50000.00,
    'ได้รับคำแนะนำ',
    'รับประโยชน์ด้วยตัวเอง',
    2567,
    'verified'
);
```

### 3. ตรวจสอบข้อมูล

```sql
-- ดูข้อมูลทั้งหมด
SELECT * FROM manual_complaints ORDER BY created_at DESC;

-- ดูเฉพาะข้อมูลสำคัญ
SELECT
    complaint_number,
    date,
    province,
    description,
    financial_damage,
    status,
    created_at
FROM manual_complaints
ORDER BY created_at DESC
LIMIT 10;

-- สรุปตามจังหวัด
SELECT
    province,
    COUNT(*) as total_cases,
    SUM(financial_damage) as total_damage
FROM manual_complaints
GROUP BY province
ORDER BY total_cases DESC;
```

---

## 🔄 Integration กับ Frontend

### API Endpoints ที่ต้องเพิ่ม

```javascript
// Lambda Function - Add to handler

// GET /table/manual-complaints - ดึงข้อมูลทั้งหมด
if (path === '/table/manual-complaints' && httpMethod === 'GET') {
  const limit = parseInt(queryParams.limit) || 100;
  const offset = parseInt(queryParams.offset) || 0;

  const query = `
    SELECT * FROM manual_complaints
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await conn.query(query, [limit, offset]);

  return response(200, {
    data: result.rows,
    count: result.rowCount
  }, origin);
}

// POST /table/manual-complaints - เพิ่มข้อมูลใหม่
if (path === '/table/manual-complaints' && httpMethod === 'POST') {
  const body = JSON.parse(event.body || '{}');

  const query = `
    INSERT INTO manual_complaints (
      date, province, month_name, description, issue_type,
      gender, age, occupation, financial_damage,
      benefit_received, beneficiary_status,
      is_representative, organization_name, beneficiary_count,
      year, status, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  const values = [
    body.date,
    body.province,
    body.month_name,
    body.description,
    body.issue_type,
    body.gender,
    body.age,
    body.occupation,
    body.financial_damage,
    body.benefit_received,
    body.beneficiary_status,
    body.is_representative || false,
    body.organization_name,
    body.beneficiary_count || 1,
    body.year,
    body.status || 'pending',
    body.created_by
  ];

  const result = await conn.query(query, values);

  return response(201, {
    data: result.rows[0],
    message: 'Manual complaint created successfully'
  }, origin);
}
```

### Frontend Component - Form เพิ่มข้อมูล

```jsx
// src/pages/admin/AddManualComplaint.jsx

const AddManualComplaint = () => {
  const [formData, setFormData] = useState({
    date: '',
    province: '',
    month_name: '',
    description: '',
    issue_type: 'ปัญหาภัยออนไลน์',
    gender: '',
    age: '',
    occupation: '',
    financial_damage: '',
    benefit_received: 'ได้รับคำแนะนำ',
    beneficiary_status: 'รับประโยชน์ด้วยตัวเอง',
    is_representative: false,
    organization_name: '',
    beneficiary_count: 1,
    year: new Date().getFullYear() + 543,
    status: 'verified'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/table/manual-complaints', formData);
      console.log('Created:', response.data);
      // แสดง success message และ redirect
    } catch (error) {
      console.error('Error:', error);
      // แสดง error message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields ตามโครงสร้างตาราง */}
    </form>
  );
};
```

---

## 📊 Queries ที่มีประโยชน์

### สถิติรายเดือน
```sql
SELECT
    month_name,
    COUNT(*) as total_cases,
    SUM(financial_damage) as total_damage,
    AVG(financial_damage) as avg_damage
FROM manual_complaints
WHERE year = 2567
GROUP BY month_name
ORDER BY
    CASE month_name
        WHEN 'มกราคม' THEN 1
        WHEN 'กุมภาพันธ์' THEN 2
        WHEN 'มีนาคม' THEN 3
        WHEN 'เมษายน' THEN 4
        WHEN 'พฤษภาคม' THEN 5
        WHEN 'มิถุนายน' THEN 6
        WHEN 'กรกฎาคม' THEN 7
        WHEN 'สิงหาคม' THEN 8
        WHEN 'กันยายน' THEN 9
        WHEN 'ตุลาคม' THEN 10
        WHEN 'พฤศจิกายน' THEN 11
        WHEN 'ธันวาคม' THEN 12
    END;
```

### Top 10 จังหวัดที่มีการร้องเรียนมากที่สุด
```sql
SELECT
    province,
    COUNT(*) as total_cases,
    SUM(financial_damage) as total_damage
FROM manual_complaints
GROUP BY province
ORDER BY total_cases DESC
LIMIT 10;
```

### รายการล่าสุด 20 รายการ
```sql
SELECT
    complaint_number,
    date,
    province,
    description,
    financial_damage,
    status,
    created_at
FROM manual_complaints
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔒 Permissions

```sql
-- Grant สิทธิ์ให้ app user (แทน your_app_user ด้วย username จริง)
GRANT SELECT, INSERT, UPDATE, DELETE ON manual_complaints TO your_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
```

---

## 📝 Notes

1. **รหัสอ้างอิง (complaint_number)** จะถูกสร้างอัตโนมัติในรูปแบบ `MAN-YYYYMM-XXXX`
   - `MAN` = Manual
   - `YYYYMM` = ปี พ.ศ. + เดือน
   - `XXXX` = เลขสุ่ม 4 หลัก

2. **Auto-update timestamp** จะอัปเดต `updated_at` อัตโนมัติทุกครั้งที่มีการ UPDATE

3. **Foreign Keys** ไปที่ตาราง `users` จะถูก SET NULL ถ้า user ถูกลบ

4. **View `v_manual_complaints_with_users`** แสดงข้อมูลพร้อม username และ email ของผู้สร้าง/แก้ไข

---

**สร้างโดย:** Claude Code
**วันที่:** 2025-11-12
**Version:** 1.0
