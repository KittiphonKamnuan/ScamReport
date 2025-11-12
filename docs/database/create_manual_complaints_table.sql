-- =====================================================
-- ตาราง: manual_complaints
-- วัตถุประสงค์: เก็บข้อมูลผู้ร้องเรียนที่ Admin/Journalist เพิ่มเอง
-- หลังจากจัดการเสร็จแล้ว (ไม่ได้มาจาก LINE Bot)
-- =====================================================

CREATE TABLE IF NOT EXISTS manual_complaints (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- รหัสอ้างอิง
    complaint_number VARCHAR(50) UNIQUE NOT NULL,

    -- ข้อมูลเบื้องต้น
    date DATE NOT NULL,                          -- วันที่เกิดเหตุ
    province VARCHAR(100),                       -- จังหวัด (เช่น "กรุงเทพมหานคร")
    month_name VARCHAR(50),                      -- เดือน (เช่น "มกราคม")
    description TEXT NOT NULL,                   -- รายละเอียดประเด็น
    issue_type VARCHAR(100),                     -- ประเภทประเด็น (เช่น "ปัญหาภัยออนไลน์")

    -- ข้อมูลผู้เสียหาย
    gender VARCHAR(20),                          -- เพศ (ชาย/หญิง/ไม่ระบุ)
    age INTEGER,                                 -- อายุ
    occupation VARCHAR(100),                     -- อาชีพ

    -- ความเสียหาย
    financial_damage DECIMAL(15,2),              -- ยอดเงินที่สูญเสีย (บาท)

    -- ประโยชน์และผลลัพธ์
    benefit_received VARCHAR(200),               -- ประโยชน์ที่ได้รับ (เช่น "ได้รับคำแนะนำ")
    beneficiary_status VARCHAR(200),             -- สถานะของผู้ได้รับประโยชน์ (เช่น "รับประโยชน์ด้วยตัวเอง")

    -- กรณีเป็นตัวแทน
    is_representative BOOLEAN DEFAULT false,     -- เป็นตัวแทนหรือไม่
    organization_name VARCHAR(200),              -- ชื่อชุมชน/หน่วยงาน (ถ้าเป็นตัวแทน)
    beneficiary_count INTEGER DEFAULT 1,        -- จำนวนผู้ที่ได้รับประโยชน์

    -- ข้อมูลเพิ่มเติม
    year INTEGER NOT NULL,                       -- ปี พ.ศ.
    status VARCHAR(50) DEFAULT 'pending',        -- สถานะ (pending/verified/published)

    -- ผู้สร้างและแก้ไข
    created_by VARCHAR(100),                     -- Username ของผู้สร้าง (Admin/Journalist)
    updated_by VARCHAR(100),                     -- Username ของผู้แก้ไข

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Indexes สำหรับ Performance
-- =====================================================

-- Index สำหรับค้นหาตามวันที่
CREATE INDEX idx_manual_complaints_date ON manual_complaints(date DESC);

-- Index สำหรับค้นหาตามจังหวัด
CREATE INDEX idx_manual_complaints_province ON manual_complaints(province);

-- Index สำหรับค้นหาตามประเภทประเด็น
CREATE INDEX idx_manual_complaints_issue_type ON manual_complaints(issue_type);

-- Index สำหรับค้นหาตามสถานะ
CREATE INDEX idx_manual_complaints_status ON manual_complaints(status);

-- Index สำหรับค้นหาตามปี
CREATE INDEX idx_manual_complaints_year ON manual_complaints(year);

-- Index สำหรับเรียงลำดับตามวันที่สร้าง
CREATE INDEX idx_manual_complaints_created_at ON manual_complaints(created_at DESC);

-- =====================================================
-- Trigger สำหรับ Auto-update updated_at
-- =====================================================

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

-- =====================================================
-- Function สำหรับสร้างรหัสอ้างอิงอัตโนมัติ
-- =====================================================

CREATE OR REPLACE FUNCTION generate_manual_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
    new_number VARCHAR(50);
    year_be INTEGER;
    month_num VARCHAR(2);
    random_digits VARCHAR(4);
BEGIN
    -- แปลงปี ค.ศ. เป็น พ.ศ.
    year_be := EXTRACT(YEAR FROM CURRENT_DATE) + 543;
    month_num := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    random_digits := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- สร้างรหัส: MAN-YYYYMM-XXXX (MAN = Manual)
    new_number := 'MAN-' || year_be || month_num || '-' || random_digits;

    -- ตรวจสอบว่ามีอยู่แล้วหรือไม่ ถ้ามีให้สร้างใหม่
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

-- =====================================================
-- ข้อมูลตัวอย่าง (Sample Data)
-- =====================================================

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
),
(
    '2024-01-03',
    'กรุงเทพมหานคร',
    'มกราคม',
    'โดนหลอกเงินจาก call center 100,000 บาท',
    'ปัญหาภัยออนไลน์',
    'หญิง',
    29,
    'พนักงานบริษัท',
    100000.00,
    'ได้รับคำแนะนำ',
    'รับประโยชน์ด้วยตัวเอง',
    2567,
    'verified'
);

-- =====================================================
-- Grant Permissions (ปรับตาม User ของคุณ)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON manual_complaints TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE manual_complaints IS 'ข้อมูลผู้ร้องเรียนที่ Admin/Journalist เพิ่มเอง';
COMMENT ON COLUMN manual_complaints.complaint_number IS 'รหัสอ้างอิง เช่น MAN-256701-1234';
COMMENT ON COLUMN manual_complaints.is_representative IS 'true ถ้าเป็นตัวแทนของชุมชน/หน่วยงาน';
COMMENT ON COLUMN manual_complaints.beneficiary_count IS 'จำนวนผู้ได้รับประโยชน์ (ถ้าเป็นตัวแทน)';
