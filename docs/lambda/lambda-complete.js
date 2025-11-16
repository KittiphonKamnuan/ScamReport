const { Pool } = require('pg');

// ===================== ENVIRONMENT VARIABLES =====================
const DB_HOST = process.env.DB_HOST;
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASSWORD;
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
const NODE_ENV = process.env.NODE_ENV || 'production';

let pool = null;

// ===================== IN-MEMORY CACHE =====================
const cache = {
    data: new Map(),

    // Get cached data if valid
    get(key) {
        const cached = this.data.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            // Cache expired
            this.data.delete(key);
            return null;
        }

        return cached.value;
    },

    // Set cache with TTL
    set(key, value, ttl = 60000) {
        this.data.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    },

    // Clear cache by key or pattern
    clear(pattern) {
        if (!pattern) {
            this.data.clear();
            return;
        }

        for (const key of this.data.keys()) {
            if (key.includes(pattern)) {
                this.data.delete(key);
            }
        }
    },

    // Get cache stats
    stats() {
        return {
            size: this.data.size,
            keys: Array.from(this.data.keys())
        };
    }
};

// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
    complaints_list: 60000,      // 60 seconds - high traffic
    complaint_detail: 300000,    // 5 minutes - less frequent updates
    statistics: 600000,          // 10 minutes - rarely changes
    messages: 300000,            // 5 minutes
    summaries: 300000            // 5 minutes
};

// ===================== DATABASE CONNECTION POOL =====================
function getDbConnection() {
    if (pool) return pool;

    pool = new Pool({
        user: DB_USER,
        password: DB_PASS,
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        ssl: { rejectUnauthorized: false },

        // Pool configuration
        max: 1,                    // Max connections per Lambda instance
        min: 0,                    // Don't keep idle connections
        idleTimeoutMillis: 30000,  // Close idle connections after 30s
        connectionTimeoutMillis: 10000,
        allowExitOnIdle: false
    });

    // Set search_path on each new connection
    pool.on('connect', async (client) => {
        try {
            await client.query(`SET search_path TO ${DB_SCHEMA}, public`);
        } catch (err) {
            console.error('Error setting search_path:', err);
        }
    });

    // Log pool errors
    pool.on('error', (err, client) => {
        console.error('Unexpected pool error:', err);
    });

    return pool;
}

// ===================== SECURITY HELPERS =====================
function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function sanitizeTableName(tableName) {
    const allowedTables = [
        'complaints', 'messages', 'summaries', 'attachments',
        'users', 'patterns', 'pattern_matches', 'notifications',
        'ai_analysis', 'audit_logs', 'journalist_followups',
        'service_history'
    ];
    return allowedTables.includes(tableName) ? tableName : null;
}

function getCorsHeaders(origin) {
    const allowedOriginsList = ALLOWED_ORIGINS.split(',').map(o => o.trim());
    const allowedOrigin = allowedOriginsList.includes('*')
        ? '*'
        : (allowedOriginsList.includes(origin) ? origin : allowedOriginsList[0]);

    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '3600'
    };
}

// ===================== RESPONSE HELPER =====================
function response(statusCode, body, origin = '*') {
    return {
        statusCode,
        headers: getCorsHeaders(origin),
        body: JSON.stringify(body)
    };
}

// ===================== LAMBDA HANDLER =====================
exports.handler = async (event) => {
    console.log('📥 Request:', event.httpMethod, event.path);

    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const rawPath = event.path || event.rawPath || event.requestContext?.http?.path || '/';
    const origin = event.headers?.origin || event.headers?.Origin || '*';

    // Remove stage prefix (prod, dev, staging)
    let path = rawPath.replace(/^\/(prod|dev|staging)/, '') || '/';

    // ==================== CORS PREFLIGHT ====================
    if (httpMethod === 'OPTIONS') {
        return response(200, { message: 'CORS preflight OK' }, origin);
    }

    const queryParams = event.queryStringParameters || {};

    try {
        const conn = getDbConnection();

        // ==================== ROUTES ====================

        // Root - API Info
        if (httpMethod === 'GET' && path === '/') {
            return response(200, {
                name: 'ScamReport API',
                version: '1.0.0',
                status: 'healthy',
                endpoints: {
                    complaints: 'GET /table/complaints',
                    complaintById: 'GET /table/complaints/:id',
                    messages: 'GET /table/complaints/:id/messages',
                    summary: 'GET /table/complaints/:id/summary',
                    genericTable: 'GET /table/:tableName',
                    connection: 'GET /connection'
                }
            }, origin);
        }

        // Connection Test
        if (httpMethod === 'GET' && path === '/connection') {
            return await testConnection(conn, origin);
        }

        // Complaint Messages with Title
        if (httpMethod === 'GET' && /^\/table\/complaints\/[^/]+\/messages$/.test(path)) {
            const complaintId = path.split('/')[3];
            return await getComplaintMessages(conn, complaintId, origin);
        }

        // Complaint Summary - GET
        if (httpMethod === 'GET' && /^\/table\/complaints\/[^/]+\/summary$/.test(path)) {
            const complaintId = path.split('/')[3];
            return await getComplaintSummary(conn, complaintId, origin);
        }

        // Complaint Summary - POST (Create new summary with AI)
        if (httpMethod === 'POST' && /^\/table\/complaints\/[^/]+\/summary$/.test(path)) {
            const complaintId = path.split('/')[3];
            return await createComplaintSummary(conn, complaintId, origin);
        }

        // ==================== SERVICE HISTORY ROUTES ====================

        // GET /table/service_history/stats
        if (httpMethod === 'GET' && path === '/table/service_history/stats') {
            return await getServiceHistoryStats(conn, queryParams, origin);
        }

        // POST /table/service_history
        if (httpMethod === 'POST' && path === '/table/service_history') {
            return await createServiceHistory(conn, event.body, origin);
        }

        // PUT /table/service_history/:id
        if (httpMethod === 'PUT' && /^\/table\/service_history\/[^/]+$/.test(path)) {
            const recordId = path.split('/')[3];
            return await updateServiceHistory(conn, recordId, event.body, origin);
        }

        // DELETE /table/service_history/:id
        if (httpMethod === 'DELETE' && /^\/table\/service_history\/[^/]+$/.test(path)) {
            const recordId = path.split('/')[3];
            return await deleteServiceHistory(conn, recordId, origin);
        }

        // GET /table/service_history/record/:recordNumber
        if (httpMethod === 'GET' && /^\/table\/service_history\/record\/[^/]+$/.test(path)) {
            const recordNumber = path.split('/')[4];
            return await getServiceHistoryByRecordNumber(conn, recordNumber, origin);
        }

        // Generic Table Access
        if (httpMethod === 'GET' && path.startsWith('/table/')) {
            const parts = path.split('/').filter(p => p);

            // GET /table/:tableName
            if (parts.length === 2) {
                return await getTableRecords(conn, parts[1], queryParams, origin);
            }

            // GET /table/:tableName/:id
            if (parts.length === 3) {
                return await getTableRecordById(conn, parts[1], parts[2], origin);
            }
        }

        // 404 - Not Found
        return response(404, {
            error: 'Route not found',
            path: path,
            method: httpMethod
        }, origin);

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);

        return response(500, {
            error: 'Internal server error',
            message: NODE_ENV === 'development' ? err.message : 'An error occurred processing your request'
        }, origin);
    }
};

// ===================== COMPLAINT MESSAGES WITH TITLE =====================
async function getComplaintMessages(conn, complaintId, origin) {
    if (!isValidUUID(complaintId)) {
        return response(400, { error: 'Invalid complaint ID format' }, origin);
    }

    const query = `
        SELECT
            m.id,
            m.complaint_id,
            m.line_message_id,
            m.message_type,
            m.content,
            m.raw_content,
            m.sequence_number,
            m.is_from_user,
            m.sent_at,
            m.received_at,
            m.created_at,
            c.title,
            c.status
        FROM messages m
        INNER JOIN complaints c ON m.complaint_id = c.id
        WHERE m.complaint_id = $1
        ORDER BY m.sent_at ASC, m.created_at ASC
        LIMIT 1000
    `;

    const result = await conn.query(query, [complaintId]);

    if (result.rows.length === 0) {
        // Check if complaint exists
        const complaintCheck = await conn.query(
            'SELECT id, title FROM complaints WHERE id = $1',
            [complaintId]
        );

        if (complaintCheck.rows.length === 0) {
            return response(404, { error: 'Complaint not found' }, origin);
        }

        return response(200, {
            messages: [],
            complaint_title: complaintCheck.rows[0].title,
            complaint_id: complaintId,
            count: 0
        }, origin);
    }

    const messages = result.rows.map(row => ({
        id: row.id,
        complaint_id: row.complaint_id,
        line_message_id: row.line_message_id,
        message_type: row.message_type,
        content: row.content,
        message: row.content, // Backward compatibility
        raw_content: row.raw_content,
        sequence_number: row.sequence_number,
        is_from_user: row.is_from_user,
        sender_type: row.is_from_user ? 'user' : 'system', // Backward compatibility
        sender_name: row.is_from_user ? 'User' : 'System', // Backward compatibility
        sent_at: row.sent_at,
        timestamp: row.sent_at, // Backward compatibility
        received_at: row.received_at,
        created_at: row.created_at,
        complaint_title: row.title
    }));

    return response(200, {
        messages,
        complaint_title: result.rows[0].title,
        complaint_status: result.rows[0].status,
        complaint_id: complaintId,
        count: messages.length
    }, origin);
}

// ===================== COMPLAINT SUMMARY =====================
async function getComplaintSummary(conn, complaintId, origin) {
    if (!isValidUUID(complaintId)) {
        return response(400, { error: 'Invalid complaint ID format' }, origin);
    }

    const query = `
        SELECT
            s.*,
            c.title,
            c.contact_name,
            c.contact_phone,
            c.line_display_name,
            c.line_user_id,
            c.financial_damage,
            c.total_loss_amount,
            c.category
        FROM summaries s
        INNER JOIN complaints c ON s.complaint_id = c.id
        WHERE s.complaint_id = $1
        ORDER BY s.created_at DESC
        LIMIT 1
    `;

    const result = await conn.query(query, [complaintId]);

    if (result.rows.length === 0) {
        // Return complaint info without summary
        const complaintCheck = await conn.query(`
            SELECT id, title, contact_name, contact_phone,
                   line_display_name, line_user_id, financial_damage,
                   total_loss_amount, category
            FROM complaints
            WHERE id = $1
        `, [complaintId]);

        if (complaintCheck.rows.length === 0) {
            return response(404, { error: 'Complaint not found' }, origin);
        }

        const complaint = complaintCheck.rows[0];
        return response(200, {
            summary: null,
            complaint_title: complaint.title,
            contact_name: complaint.contact_name,
            contact_phone: complaint.contact_phone,
            line_display_name: complaint.line_display_name,
            line_id: complaint.line_user_id,
            amount: complaint.total_loss_amount || complaint.financial_damage,
            total_loss_amount: complaint.total_loss_amount,
            loss_amount: complaint.financial_damage,
            category: complaint.category,
            complaint_id: complaintId,
            message: 'No summary available for this complaint'
        }, origin);
    }

    const row = result.rows[0];

    // Build summary object with available fields
    const summaryObj = {
        id: row.id,
        complaint_id: row.complaint_id,
        created_at: row.created_at,
        updated_at: row.updated_at
    };

    // Add summary text (with multiple field name support)
    if (row.summary_text) {
        summaryObj.summary = row.summary_text;
        summaryObj.ai_summary = row.summary_text;
        summaryObj.text = row.summary_text;
    }

    // Add other available fields
    if (row.key_points) summaryObj.key_points = row.key_points;
    if (row.timeline) summaryObj.timeline = row.timeline;
    if (row.summary_type) summaryObj.summary_type = row.summary_type;
    if (row.word_count) summaryObj.word_count = row.word_count;
    if (row.generated_by) summaryObj.generated_by = row.generated_by;

    // Category fields
    if (row.category) {
        summaryObj.category = row.category;
        summaryObj.scam_type = row.category;
    } else if (row.scam_type) {
        summaryObj.scam_type = row.scam_type;
    }

    // Keywords/tags
    if (row.keywords) {
        summaryObj.keywords = row.keywords;
        summaryObj.tags = row.keywords;
    }

    return response(200, {
        summary: summaryObj,
        complaint_title: row.title,
        contact_name: row.contact_name,
        contact_phone: row.contact_phone,
        line_display_name: row.line_display_name,
        line_id: row.line_user_id,
        amount: row.total_loss_amount || row.financial_damage,
        total_loss_amount: row.total_loss_amount,
        loss_amount: row.financial_damage,
        category: row.category,
        complaint_id: complaintId
    }, origin);
}

// ===================== CREATE COMPLAINT SUMMARY WITH AI =====================
async function createComplaintSummary(conn, complaintId, origin) {
    if (!isValidUUID(complaintId)) {
        return response(400, { error: 'Invalid complaint ID format' }, origin);
    }

    try {
        console.log(`🤖 Generating AI summary for complaint: ${complaintId}`);

        // 1. Fetch all messages for this complaint
        const messagesQuery = `
            SELECT content, sent_at, is_from_user
            FROM messages
            WHERE complaint_id = $1
            ORDER BY sent_at ASC
        `;
        const messagesResult = await conn.query(messagesQuery, [complaintId]);

        if (messagesResult.rows.length === 0) {
            return response(404, { error: 'No messages found for this complaint' }, origin);
        }

        // 2. Combine messages into text
        const fullText = messagesResult.rows
            .filter(m => m.content && m.content.trim())
            .map(m => m.content)
            .join('\n\n');

        if (!fullText || fullText.trim().length < 10) {
            return response(400, { error: 'Insufficient message content for summarization' }, origin);
        }

        console.log(`📝 Full text length: ${fullText.length} characters`);

        // 3. Extract entities from text (phone, amount, etc.)
        const entities = extractEntities(fullText);
        console.log('📋 Extracted entities:', entities);

        // 4. Call Gemini AI to generate summary and categorize
        const aiSummary = await analyzeWithGemini(fullText, entities);

        if (!aiSummary || !aiSummary.summary) {
            return response(500, { error: 'Failed to generate AI summary' }, origin);
        }

        console.log('✅ AI summary generated successfully');

        // 5. Update complaint with extracted information
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        // Update contact phone (prefer AI result, fallback to entities)
        const contactPhone = aiSummary.contactPhone || (entities.phones && entities.phones.length > 0 ? entities.phones[0] : null);
        if (contactPhone) {
            updateFields.push(`contact_phone = $${paramIndex++}`);
            updateValues.push(contactPhone);
        }

        // Update contact name from AI
        if (aiSummary.victimName) {
            updateFields.push(`contact_name = $${paramIndex++}`);
            updateValues.push(aiSummary.victimName);
        }

        // Update total loss amount (prefer AI result, fallback to entities)
        const lossAmount = aiSummary.lossAmount || (entities.amounts && entities.amounts.length > 0 ? Math.max(...entities.amounts) : null);
        if (lossAmount) {
            updateFields.push(`total_loss_amount = $${paramIndex++}`);
            updateValues.push(lossAmount);
        }

        // Update category based on AI analysis
        if (aiSummary.category) {
            const categoryMap = {
                'การโกง': 'fraud',
                'การหลอกลวง': 'fraud',
                'ฉ้อโกง': 'fraud',
                'คดีความ': 'legal_issue',
                'ทนายความ': 'legal_issue',
                'แจ้งเบาะแส': 'tip_off',
                'เตือนภัย': 'tip_off'
            };
            const category = categoryMap[aiSummary.category] || aiSummary.category;
            if (['fraud', 'legal_issue', 'tip_off'].includes(category)) {
                updateFields.push(`category = $${paramIndex++}::complaint_category`);
                updateValues.push(category);
            }
        }

        // Update complaint if we have any fields to update
        let updatedComplaintData = null;
        if (updateFields.length > 0) {
            updateValues.push(complaintId);
            const updateQuery = `
                UPDATE complaints
                SET ${updateFields.join(', ')}, updated_at = NOW()
                WHERE id = $${paramIndex}
                RETURNING id, contact_phone, contact_name, total_loss_amount, category
            `;
            const updateResult = await conn.query(updateQuery, updateValues);
            updatedComplaintData = updateResult.rows[0];
            console.log('✅ Complaint updated with extracted data:', updatedComplaintData);
        }

        // 4. Save summary to database
        const insertQuery = `
            INSERT INTO summaries (
                complaint_id,
                summary_text,
                summary_type,
                key_points,
                word_count,
                generated_by
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const summaryValues = [
            complaintId,
            aiSummary.summary || aiSummary.title,
            'auto',
            JSON.stringify(aiSummary.keyPoints || []),
            aiSummary.summary ? aiSummary.summary.length : 0,
            null  // generated_by is UUID, set to NULL for AI-generated summaries
        ];

        const insertResult = await conn.query(insertQuery, summaryValues);
        const savedSummary = insertResult.rows[0];

        // 5. Invalidate cache
        cache.clear(`summary_${complaintId}`);
        console.log(`🗑️  Cleared cache: summary_${complaintId}`);

        console.log('✅ Summary saved successfully');

        // 6. Return complete data including updated complaint info
        const responseData = {
            // Summary data
            id: savedSummary.id,
            complaint_id: savedSummary.complaint_id,
            summary: savedSummary.summary_text,
            summary_text: savedSummary.summary_text,
            key_points: savedSummary.key_points,
            word_count: savedSummary.word_count,
            created_at: savedSummary.created_at,
            updated_at: savedSummary.updated_at,

            // Updated complaint data
            contact_phone: updatedComplaintData?.contact_phone || null,
            contact_name: updatedComplaintData?.contact_name || null,
            total_loss_amount: updatedComplaintData?.total_loss_amount || null,
            amount: updatedComplaintData?.total_loss_amount || null,
            category: updatedComplaintData?.category || null,

            // AI analysis details
            scam_type: aiSummary.scamType || null,
            timeline: aiSummary.timeline || null,

            message: 'Summary generated and saved successfully'
        };

        console.log('📤 Response data:', JSON.stringify(responseData, null, 2));

        return response(201, responseData, origin);

    } catch (error) {
        console.error('❌ Error creating complaint summary:', error);
        return response(500, {
            error: 'Failed to create summary',
            message: error.message
        }, origin);
    }
}

// ===================== ENTITY EXTRACTOR =====================
function extractEntities(text) {
    if (!text) {
        return {
            amounts: [],
            phones: [],
            urls: [],
            bankAccounts: [],
            lineIds: []
        };
    }

    const entities = {
        amounts: [],
        phones: [],
        urls: [],
        bankAccounts: [],
        lineIds: []
    };

    // Extract amounts
    const amountPatterns = [
        /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท|baht|THB|฿)/gi,
        /฿\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(\d+)\s*(?:ล้าน)/gi,
        /(\d+)\s*(?:แสน)/gi,
        /(\d+)\s*(?:หมื่น)/gi,
        /(\d+)\s*(?:พัน)/gi
    ];

    amountPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            let amount = parseFloat(match[1].replace(/,/g, ''));

            // Convert Thai number words
            if (text.includes('ล้าน')) amount *= 1000000;
            else if (text.includes('แสน')) amount *= 100000;
            else if (text.includes('หมื่น')) amount *= 10000;
            else if (text.includes('พัน')) amount *= 1000;

            if (amount > 0) {
                entities.amounts.push(amount);
            }
        }
    });

    // Extract phone numbers
    const phonePattern = /0[689]\d{8}/g;
    const phoneMatches = text.match(phonePattern);
    if (phoneMatches) {
        entities.phones.push(...phoneMatches);
    }

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urlMatches = text.match(urlPattern);
    if (urlMatches) {
        entities.urls.push(...urlMatches);
    }

    // Extract LINE IDs
    const lineIdPattern = /(?:LINE ID|ไลน์)\s*[:：]?\s*([a-zA-Z0-9._-]+)/gi;
    const lineIdMatches = text.matchAll(lineIdPattern);
    for (const match of lineIdMatches) {
        entities.lineIds.push(match[1]);
    }

    // Deduplicate
    entities.amounts = [...new Set(entities.amounts)];
    entities.phones = [...new Set(entities.phones)];
    entities.urls = [...new Set(entities.urls)];
    entities.lineIds = [...new Set(entities.lineIds)];

    return entities;
}

// ===================== GEMINI AI HELPER =====================
async function analyzeWithGemini(text, entities = {}) {
    try {
        // Check if Gemini API key is configured
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.warn('⚠️ GEMINI_API_KEY not configured, using mock summary');
            return {
                summary: 'สรุปโดยระบบ: ' + text.substring(0, 200) + '...',
                title: 'สรุปอัตโนมัติ',
                keyPoints: ['ต้องการการตั้งค่า Gemini API Key'],
                scamType: 'ไม่สามารถระบุได้',
                urgencyAssessment: 'ปานกลาง',
                recommendedAction: 'ตรวจสอบและติดตามเรื่อง'
            };
        }

        const entitiesInfo = entities ? `
ข้อมูลที่สกัดได้:
- เบอร์โทร: ${entities.phones?.join(', ') || 'ไม่มี'}
- จำนวนเงิน: ${entities.amounts?.join(', ') || 'ไม่มี'} บาท
- URLs: ${entities.urls?.join(', ') || 'ไม่มี'}
- LINE ID: ${entities.lineIds?.join(', ') || 'ไม่มี'}
` : '';

        const prompt = `คุณคือ AI ผู้ช่วยวิเคราะห์เรื่องร้องเรียนสำหรับนักข่าว

ข้อความร้องเรียน:
${text}
${entitiesInfo}

กรุณาวิเคราะห์และสรุปในรูปแบบ JSON:
{
  "summary": "สรุปสั้นๆ 3-5 ประโยค",
  "title": "หัวข้อข่าว (ไม่เกิน 100 ตัวอักษร)",
  "keyPoints": ["จุดสำคัญ 1", "จุดสำคัญ 2", "จุดสำคัญ 3"],
  "category": "ประเภทการร้องเรียน: การโกง, การหลอกลวง, คดีความ, ทนายความ, แจ้งเบาะแส, หรือ เตือนภัย",
  "scamType": "ประเภทการหลอกลวงโดยละเอียด (เช่น Call Center, ลงทุนปลอม, Love Scam)",
  "victimName": "ชื่อผู้เสียหาย (ถ้าพบในข้อความ)",
  "contactPhone": "เบอร์โทรผู้เสียหาย (ถ้าพบในข้อความ)",
  "lossAmount": จำนวนเงินที่สูญเสีย (ตัวเลข, null ถ้าไม่มี),
  "urgencyAssessment": "ประเมินความเร่งด่วน",
  "recommendedAction": "คำแนะนำเบื้องต้น"
}

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม`;

        // Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        console.log('🤖 Calling Gemini API...');

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            throw new Error(`Gemini API returned ${response.status}`);
        }

        const data = await response.json();

        // Extract text from Gemini response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error('No response from Gemini AI');
        }

        console.log('✅ Gemini response received');

        // Extract JSON from response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Gemini AI analysis parsed successfully');
            return analysis;
        }

        throw new Error('Could not extract JSON from Gemini response');

    } catch (error) {
        console.error('❌ Gemini AI error:', error);
        // Return fallback summary
        return {
            summary: 'ไม่สามารถสร้างสรุปอัตโนมัติได้ กรุณาตรวจสอบการตั้งค่า API',
            title: 'สรุปอัตโนมัติ',
            keyPoints: ['ตรวจสอบข้อมูลเพิ่มเติม'],
            scamType: 'ไม่สามารถระบุได้',
            urgencyAssessment: 'ปานกลาง',
            recommendedAction: 'ตรวจสอบรายละเอียดเพิ่มเติม'
        };
    }
}

// ===================== SERVICE HISTORY HANDLERS =====================

// GET /table/service_history/stats
async function getServiceHistoryStats(conn, queryParams, origin) {
    try {
        const year = queryParams.year;

        // ========== CACHE CHECK ==========
        const cacheKey = `stats_service_history${year ? `_y${year}` : '_all'}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log(`✅ Cache HIT: ${cacheKey}`);
            return response(200, cached, origin);
        }
        console.log(`❌ Cache MISS: ${cacheKey}`);

        const whereClause = year ? `WHERE year = ${parseInt(year)}` : '';

        const statsQuery = `
            SELECT
                COUNT(*) as total_records,
                COALESCE(SUM(financial_damage), 0) as total_damage,
                COALESCE(AVG(financial_damage), 0) as avg_damage,
                SUM(beneficiary_count) as total_beneficiaries,
                COUNT(DISTINCT province) as provinces_count,
                COUNT(CASE WHEN is_representative = true THEN 1 END) as representative_cases
            FROM service_history
            ${whereClause}
        `;

        const statsResult = await conn.query(statsQuery);

        // Stats by province
        const provinceQuery = `
            SELECT
                province,
                COUNT(*) as count,
                COALESCE(SUM(financial_damage), 0) as total_damage
            FROM service_history
            ${whereClause}
            GROUP BY province
            ORDER BY count DESC
            LIMIT 10
        `;

        const provinceResult = await conn.query(provinceQuery);

        // Stats by issue type
        const issueQuery = `
            SELECT
                issue_type,
                COUNT(*) as count,
                COALESCE(SUM(financial_damage), 0) as total_damage
            FROM service_history
            ${whereClause}
            GROUP BY issue_type
            ORDER BY count DESC
        `;

        const issueResult = await conn.query(issueQuery);

        const result = {
            overall: statsResult.rows[0],
            by_province: provinceResult.rows,
            by_issue_type: issueResult.rows
        };

        // ========== CACHE SAVE ==========
        cache.set(cacheKey, result, CACHE_TTL.statistics);
        console.log(`💾 Cached: ${cacheKey} (TTL: ${CACHE_TTL.statistics}ms)`);

        return response(200, result, origin);
    } catch (error) {
        console.error('Error fetching service history stats:', error);
        return response(500, {
            error: 'Failed to fetch statistics',
            message: error.message
        }, origin);
    }
}

// POST /table/service_history
async function createServiceHistory(conn, body, origin) {
    try {
        const data = JSON.parse(body || '{}');

        // Validate required fields
        if (!data.date || !data.description || !data.year) {
            return response(400, {
                error: 'Missing required fields',
                required: ['date', 'description', 'year']
            }, origin);
        }

        // Note: record_number จะถูก auto-generate โดย trigger
        const query = `
            INSERT INTO service_history (
                date, province, month_name, description, issue_type,
                gender, age, occupation, financial_damage,
                benefit_received, beneficiary_status,
                is_representative, organization_name, beneficiary_count,
                year, status, recorded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `;

        const values = [
            data.date,
            data.province || null,
            data.month_name || null,
            data.description,
            data.issue_type || null,
            data.gender || null,
            data.age ? parseInt(data.age) : null,
            data.occupation || null,
            data.financial_damage ? parseFloat(data.financial_damage) : null,
            data.benefit_received || null,
            data.beneficiary_status || null,
            data.is_representative || false,
            data.organization_name || null,
            data.beneficiary_count ? parseInt(data.beneficiary_count) : 1,
            parseInt(data.year),
            data.status || 'completed',
            data.recorded_by || 'admin'
        ];

        const result = await conn.query(query, values);

        // ========== CACHE INVALIDATION ==========
        cache.clear('stats_service_history');
        cache.clear('table_service_history');
        console.log('🗑️  Cleared cache: stats_service_history* & table_service_history*');

        console.log(`✅ Created service history: ${result.rows[0].record_number}`);

        return response(201, {
            data: result.rows[0],
            message: 'Service history record created successfully',
            record_number: result.rows[0].record_number
        }, origin);
    } catch (error) {
        console.error('Error creating service history:', error);
        return response(500, {
            error: 'Failed to create service history record',
            message: error.message
        }, origin);
    }
}

// PUT /table/service_history/:id
async function updateServiceHistory(conn, recordId, body, origin) {
    if (!isValidUUID(recordId)) {
        return response(400, { error: 'Invalid record ID format' }, origin);
    }

    try {
        const data = JSON.parse(body || '{}');

        // Check if record exists
        const checkQuery = 'SELECT id FROM service_history WHERE id = $1';
        const checkResult = await conn.query(checkQuery, [recordId]);

        if (checkResult.rows.length === 0) {
            return response(404, { error: 'Record not found' }, origin);
        }

        const query = `
            UPDATE service_history SET
                date = COALESCE($1, date),
                province = COALESCE($2, province),
                month_name = COALESCE($3, month_name),
                description = COALESCE($4, description),
                issue_type = COALESCE($5, issue_type),
                gender = COALESCE($6, gender),
                age = COALESCE($7, age),
                occupation = COALESCE($8, occupation),
                financial_damage = COALESCE($9, financial_damage),
                benefit_received = COALESCE($10, benefit_received),
                beneficiary_status = COALESCE($11, beneficiary_status),
                is_representative = COALESCE($12, is_representative),
                organization_name = COALESCE($13, organization_name),
                beneficiary_count = COALESCE($14, beneficiary_count),
                year = COALESCE($15, year),
                status = COALESCE($16, status),
                updated_by = COALESCE($17, updated_by)
            WHERE id = $18
            RETURNING *
        `;

        const values = [
            data.date || null,
            data.province || null,
            data.month_name || null,
            data.description || null,
            data.issue_type || null,
            data.gender || null,
            data.age ? parseInt(data.age) : null,
            data.occupation || null,
            data.financial_damage ? parseFloat(data.financial_damage) : null,
            data.benefit_received || null,
            data.beneficiary_status || null,
            data.is_representative !== undefined ? data.is_representative : null,
            data.organization_name || null,
            data.beneficiary_count ? parseInt(data.beneficiary_count) : null,
            data.year ? parseInt(data.year) : null,
            data.status || null,
            data.updated_by || null,
            recordId
        ];

        const result = await conn.query(query, values);

        // ========== CACHE INVALIDATION ==========
        cache.clear('stats_service_history');
        cache.clear(`detail_service_history_${recordId}`);
        console.log(`🗑️  Cleared cache: stats & detail for ${recordId}`);

        return response(200, {
            data: result.rows[0],
            message: 'Service history record updated successfully'
        }, origin);
    } catch (error) {
        console.error(`Error updating service history ${recordId}:`, error);
        return response(500, {
            error: 'Failed to update service history record',
            message: error.message
        }, origin);
    }
}

// DELETE /table/service_history/:id
async function deleteServiceHistory(conn, recordId, origin) {
    if (!isValidUUID(recordId)) {
        return response(400, { error: 'Invalid record ID format' }, origin);
    }

    try {
        // Check if record exists
        const checkQuery = 'SELECT id FROM service_history WHERE id = $1';
        const checkResult = await conn.query(checkQuery, [recordId]);

        if (checkResult.rows.length === 0) {
            return response(404, { error: 'Record not found' }, origin);
        }

        const query = 'DELETE FROM service_history WHERE id = $1 RETURNING *';
        const result = await conn.query(query, [recordId]);

        // ========== CACHE INVALIDATION ==========
        cache.clear('stats_service_history');
        cache.clear(`detail_service_history_${recordId}`);
        console.log(`🗑️  Cleared cache: stats & detail for ${recordId}`);

        return response(200, {
            data: result.rows[0],
            message: 'Service history record deleted successfully'
        }, origin);
    } catch (error) {
        console.error(`Error deleting service history ${recordId}:`, error);
        return response(500, {
            error: 'Failed to delete service history record',
            message: error.message
        }, origin);
    }
}

// GET /table/service_history/record/:recordNumber
async function getServiceHistoryByRecordNumber(conn, recordNumber, origin) {
    try {
        // Validate record number format (HIS-YYYYMM-XXXX)
        if (!recordNumber || !recordNumber.startsWith('HIS-')) {
            return response(400, {
                error: 'Invalid record number format',
                expected: 'HIS-YYYYMM-XXXX'
            }, origin);
        }

        // ========== CACHE CHECK ==========
        const cacheKey = `service_history_record_${recordNumber}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log(`✅ Cache HIT: ${cacheKey}`);
            return response(200, cached, origin);
        }
        console.log(`❌ Cache MISS: ${cacheKey}`);

        const query = 'SELECT * FROM service_history WHERE record_number = $1';
        const result = await conn.query(query, [recordNumber]);

        if (result.rows.length === 0) {
            return response(404, {
                error: 'Record not found',
                record_number: recordNumber
            }, origin);
        }

        const data = {
            data: result.rows[0]
        };

        // ========== CACHE SAVE ==========
        cache.set(cacheKey, data, CACHE_TTL.complaint_detail);
        console.log(`💾 Cached: ${cacheKey} (TTL: ${CACHE_TTL.complaint_detail}ms)`);

        return response(200, data, origin);

    } catch (error) {
        console.error(`Error fetching service history by record number ${recordNumber}:`, error);
        return response(500, {
            error: 'Failed to fetch service history record',
            message: error.message
        }, origin);
    }
}

// ===================== GENERIC TABLE ACCESS =====================
async function getTableRecords(conn, tableName, params, origin) {
    const sanitized = sanitizeTableName(tableName);
    if (!sanitized) {
        return response(403, { error: 'Access to this table is not allowed' }, origin);
    }

    const page = Math.max(1, parseInt(params.page || '1'));
    const limit = Math.min(10000, Math.max(1, parseInt(params.limit || '10')));
    const offset = (page - 1) * limit;

    // ========== CACHE CHECK ==========
    const cacheKey = `table_${sanitized}_p${page}_l${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return response(200, cached, origin);
    }
    console.log(`❌ Cache MISS: ${cacheKey}`);

    // Get column names
    const colQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = $2
        ORDER BY ordinal_position
    `;
    const cols = await conn.query(colQuery, [sanitized, DB_SCHEMA || 'public']);
    const colNames = cols.rows.map(c => c.column_name);

    if (colNames.length === 0) {
        return response(404, { error: 'Table not found or has no columns' }, origin);
    }

    // Get data with proper ordering
    let orderBy = 'created_at DESC';
    if (!colNames.includes('created_at')) {
        orderBy = '1 DESC'; // Fallback to first column
    }

    const dataQuery = `SELECT * FROM ${sanitized} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`;
    const records = await conn.query(dataQuery, [limit, offset]);

    // Get total count
    const totalResult = await conn.query(`SELECT COUNT(*) FROM ${sanitized}`);
    const total = parseInt(totalResult.rows[0].count);

    const data = records.rows.map(row => {
        const obj = {};
        colNames.forEach(col => {
            obj[col] = row[col];
        });
        return obj;
    });

    const result = {
        columns: colNames,
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasMore: (page * limit) < total
        }
    };

    // ========== CACHE SAVE ==========
    // Use different TTL based on table
    const ttl = sanitized === 'complaints' ? CACHE_TTL.complaints_list : CACHE_TTL.messages;
    cache.set(cacheKey, result, ttl);
    console.log(`💾 Cached: ${cacheKey} (TTL: ${ttl}ms)`);

    return response(200, result, origin);
}

async function getTableRecordById(conn, tableName, recordId, origin) {
    const sanitized = sanitizeTableName(tableName);
    if (!sanitized) {
        return response(403, { error: 'Access to this table is not allowed' }, origin);
    }

    if (!isValidUUID(recordId)) {
        return response(400, { error: 'Invalid record ID format' }, origin);
    }

    // ========== CACHE CHECK ==========
    const cacheKey = `detail_${sanitized}_${recordId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return response(200, cached, origin);
    }
    console.log(`❌ Cache MISS: ${cacheKey}`);

    // Get column names
    const colQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = $2
        ORDER BY ordinal_position
    `;
    const cols = await conn.query(colQuery, [sanitized, DB_SCHEMA || 'public']);
    const colNames = cols.rows.map(c => c.column_name);

    if (colNames.length === 0) {
        return response(404, { error: 'Table not found or has no columns' }, origin);
    }

    // Get record
    const dataQuery = `SELECT * FROM ${sanitized} WHERE id = $1`;
    const result = await conn.query(dataQuery, [recordId]);

    if (result.rows.length === 0) {
        return response(404, { error: 'Record not found' }, origin);
    }

    const obj = {};
    colNames.forEach(col => {
        obj[col] = result.rows[0][col];
    });

    const resultData = {
        columns: colNames,
        data: obj
    };

    // ========== CACHE SAVE ==========
    cache.set(cacheKey, resultData, CACHE_TTL.complaint_detail);
    console.log(`💾 Cached: ${cacheKey} (TTL: ${CACHE_TTL.complaint_detail}ms)`);

    return response(200, resultData, origin);
}

// ===================== CONNECTION TEST =====================
async function testConnection(conn, origin) {
    const result = await conn.query('SELECT current_database(), current_user, now(), version()');
    const row = result.rows[0];

    return response(200, {
        status: 'connected',
        database: row.current_database,
        user: row.current_user,
        timestamp: row.now,
        server_version: row.version.substring(0, 50) + '...'
    }, origin);
}
