import pg from 'pg';
const { Client } = pg;

// RDS Configuration
const DB_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // สำหรับ RDS
  },
  connectionTimeoutMillis: 5000
};

/**
 * Create database connection
 */
function createConnection() {
  return new Client(DB_CONFIG);
}

/**
 * Generate complaint number
 * Format: SCR-YYYYMM-XXXX (random 4 digits)
 */
function generateComplaintNumber() {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `SCR-${yearMonth}-${random}`;
}

/**
 * Create new complaint in RDS
 * Return: { id, complaint_number }
 */
export async function createComplaintInRDS(data) {
  const {
    lineUserId,
    displayName,
    messages,
    entities,
    categoryResult,
    urgencyResult,
    geminiSummary
  } = data;

  const client = createConnection();

  try {
    await client.connect();
    await client.query('BEGIN');

    // Generate complaint number
    const complaintNumber = generateComplaintNumber();
    const title =
      geminiSummary?.title ||
      messages[0]?.text?.substring(0, 100) ||
      'เรื่องร้องเรียน';
    const firstMessageTime = new Date(messages[0].timestamp);

    // ป้องกัน error ถ้า entities หรือ amounts ไม่มี
    const totalAmount = entities?.amounts?.[0] ?? null;

    // ดึงเบอร์โทรจาก entities
    const contactPhone = entities?.phones?.[0] ?? null;

    // ตรวจว่ามีไฟล์แนบไหม (ดูจาก message.media)
    const hasAttachments = messages.some(m => !!m.media);

    // Insert complaint
    const complaintResult = await client.query(
      `INSERT INTO complaints (
        complaint_number,
        line_user_id,
        line_display_name,
        title,
        category,
        urgency_level,
        status,
        ai_confidence_score,
        total_messages,
        has_attachments,
        first_message_at,
        last_message_at,
        total_loss_amount,
        contact_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, complaint_number`,
      [
        complaintNumber,
        lineUserId,
        displayName,
        title,
        categoryResult.category,
        urgencyResult.urgencyLevel,
        'pending',
        categoryResult.confidence,
        messages.length,
        hasAttachments,
        firstMessageTime,
        firstMessageTime,
        totalAmount,
        contactPhone
      ]
    );

    const complaint = complaintResult.rows[0];
    console.log('Created complaint:', complaint);

    // Insert messages
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      await client.query(
        `INSERT INTO messages (
          complaint_id,
          line_message_id,
          message_type,
          content,
          raw_content,
          sequence_number,
          sent_at,
          is_from_user
        ) VALUES ($1, $2, $3::message_type, $4, $5, $6, $7, $8)
        ON CONFLICT (line_message_id) DO NOTHING`,
        [
          complaint.id,
          msg.message_id,
          msg.type,
          msg.text,
          JSON.stringify(msg),
          i + 1,
          new Date(msg.timestamp),
          true
        ]
      );
    }

    // Insert AI analysis
    await client.query(
      `INSERT INTO ai_analysis (
        complaint_id,
        predicted_category,
        confidence_score,
        urgency_score,
        model_name,
        entities,
        keywords
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        complaint.id,
        categoryResult.category,
        categoryResult.confidence,
        urgencyResult.urgencyScore,
        'gemini-ai',
        JSON.stringify(entities),
        JSON.stringify(categoryResult.keywords || [])
      ]
    );

    // Insert summary if available
    if (geminiSummary) {
      await client.query(
        `INSERT INTO summaries (
          complaint_id,
          summary_text,
          summary_type,
          key_points,
          word_count
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          complaint.id,
          geminiSummary.summary,
          'auto',
          JSON.stringify(geminiSummary.keyPoints || []),
          geminiSummary.summary.length
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Complaint saved to RDS');

    // คืนทั้ง id และ complaint_number แบบชัดเจน
    return {
      id: complaint.id,
      complaint_number: complaint.complaint_number
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error during ROLLBACK:', rollbackErr);
    }
    console.error('Error creating complaint in RDS:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Append message to existing complaint
 */
export async function appendMessageToComplaint(complaintId, message, analysis) {
  const client = createConnection();

  try {
    await client.connect();
    await client.query('BEGIN');

    // Get current message count
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM messages WHERE complaint_id = $1',
      [complaintId]
    );
    const sequenceNumber = parseInt(countResult.rows[0].count, 10) + 1;

    // Insert new message (เพิ่ม raw_content ด้วย)
    await client.query(
      `INSERT INTO messages (
        complaint_id,
        line_message_id,
        message_type,
        content,
        raw_content,
        sequence_number,
        sent_at,
        is_from_user
      ) VALUES ($1, $2, $3::message_type, $4, $5, $6, $7, $8)
      ON CONFLICT (line_message_id) DO NOTHING`,
      [
        complaintId,
        message.message_id,
        message.type,
        message.text,
        JSON.stringify(message),
        sequenceNumber,
        new Date(message.timestamp),
        true
      ]
    );

    // Update complaint basic fields
    await client.query(
      `UPDATE complaints
       SET total_messages = total_messages + 1,
           last_message_at = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [new Date(message.timestamp), complaintId]
    );

    // Update contact_phone if exists and not already set
    if (analysis.entities?.phones?.[0]) {
      await client.query(
        `UPDATE complaints
         SET contact_phone = $1
         WHERE id = $2 AND contact_phone IS NULL`,
        [analysis.entities.phones[0], complaintId]
      );
    }

    // Update urgency if changed (ถ้า logic เทียบ enum/text ใช้งานได้)
    if (analysis.urgencyResult) {
      await client.query(
        `UPDATE complaints
         SET urgency_level = $1
         WHERE id = $2 AND urgency_level::text < $1::text`,
        [analysis.urgencyResult.urgencyLevel, complaintId]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Message appended to complaint');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error during ROLLBACK:', rollbackErr);
    }
    console.error('Error appending message:', error);
    throw error;
  } finally {
    await client.end();
  }
}