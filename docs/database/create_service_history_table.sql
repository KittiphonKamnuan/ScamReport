-- =====================================================
-- ตาราง: service_history
-- วัตถุประสงค์: เก็บประวัติการให้บริการ/ช่วยเหลือทั้งหมด
-- ที่ Admin/Journalist บันทึกไว้
-- =====================================================

CREATE TABLE IF NOT EXISTS service_history (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- รหัสอ้างอิง
    record_number VARCHAR(50) UNIQUE NOT NULL,

    -- ข้อมูลเบื้องต้น
    date DATE NOT NULL,                          -- วันที่ให้บริการ/เกิดเหตุ
    province VARCHAR(100),                       -- จังหวัด (เช่น "กรุงเทพมหานคร")
    month_name VARCHAR(50),                      -- เดือน (เช่น "มกราคม")
    description TEXT NOT NULL,                   -- รายละเอียดเรื่อง
    issue_type VARCHAR(100),                     -- ประเภทประเด็น (เช่น "ปัญหาภัยออนไลน์")

    -- ข้อมูลผู้รับบริการ
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
    status VARCHAR(50) DEFAULT 'completed',      -- สถานะ (completed/archived)

    -- ผู้บันทึก
    recorded_by VARCHAR(100),                    -- Username ของผู้บันทึก
    updated_by VARCHAR(100),                     -- Username ของผู้แก้ไขล่าสุด

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Indexes สำหรับ Performance
-- =====================================================

-- Index สำหรับค้นหาตามวันที่
CREATE INDEX idx_service_history_date ON service_history(date DESC);

-- Index สำหรับค้นหาตามจังหวัด
CREATE INDEX idx_service_history_province ON service_history(province);

-- Index สำหรับค้นหาตามประเภทประเด็น
CREATE INDEX idx_service_history_issue_type ON service_history(issue_type);

-- Index สำหรับค้นหาตามสถานะ
CREATE INDEX idx_service_history_status ON service_history(status);

-- Index สำหรับค้นหาตามปี
CREATE INDEX idx_service_history_year ON service_history(year);

-- Index สำหรับเรียงลำดับตามวันที่สร้าง
CREATE INDEX idx_service_history_created_at ON service_history(created_at DESC);

-- =====================================================
-- Trigger สำหรับ Auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_service_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_history_timestamp
    BEFORE UPDATE ON service_history
    FOR EACH ROW
    EXECUTE FUNCTION update_service_history_timestamp();

-- =====================================================
-- Function สำหรับสร้างรหัสอ้างอิงอัตโนมัติ
-- =====================================================

CREATE OR REPLACE FUNCTION generate_history_record_number()
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

    -- สร้างรหัส: HIS-YYYYMM-XXXX (HIS = History)
    new_number := 'HIS-' || year_be || month_num || '-' || random_digits;

    -- ตรวจสอบว่ามีอยู่แล้วหรือไม่ ถ้ามีให้สร้างใหม่
    WHILE EXISTS (SELECT 1 FROM service_history WHERE record_number = new_number) LOOP
        random_digits := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        new_number := 'HIS-' || year_be || month_num || '-' || random_digits;
    END LOOP;

    NEW.record_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_history_record_number
    BEFORE INSERT ON service_history
    FOR EACH ROW
    WHEN (NEW.record_number IS NULL)
    EXECUTE FUNCTION generate_history_record_number();

-- =====================================================
-- ข้อมูลตัวอย่าง (Sample Data)
-- =====================================================

INSERT INTO service_history (
    date, province, month_name, description, issue_type,
    gender, age, occupation, financial_damage,
    benefit_received, beneficiary_status, year, status, recorded_by
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
    'completed',
    'admin'
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
    'completed',
    'admin'
),
(
    '2024-01-05',
    'เชียงใหม่',
    'มกราคม',
    'หนุ่มโดนหลอกขายนก 2,500 บาท',
    'ปัญหาภัยออนไลน์',
    'ชาย',
    35,
    'ค้าขาย',
    2500.00,
    'ได้รับคำแนะนำ',
    'รับประโยชน์ด้วยตัวเอง',
    2567,
    'completed',
    'journalist'
);

-- =====================================================
-- Grant Permissions (ปรับตาม User ของคุณ)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON service_history TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE service_history IS 'ประวัติการให้บริการ/ช่วยเหลือทั้งหมดที่บันทึกโดย Admin/Journalist';
COMMENT ON COLUMN service_history.record_number IS 'รหัสอ้างอิง เช่น HIS-256701-1234 (HIS = History)';
COMMENT ON COLUMN service_history.is_representative IS 'true ถ้าเป็นตัวแทนของชุมชน/หน่วยงาน';
COMMENT ON COLUMN service_history.beneficiary_count IS 'จำนวนผู้ได้รับประโยชน์ (ถ้าเป็นตัวแทน)';
COMMENT ON COLUMN service_history.recorded_by IS 'ผู้บันทึกข้อมูล (Admin/Journalist)';
