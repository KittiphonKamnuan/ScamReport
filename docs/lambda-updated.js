const { Client } = require('pg');

// ===================== ENV =====================
const DB_HOST = process.env.DB_HOST;
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASSWORD;
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';

let _conn_pool = null;

// ===================== Database Connection =====================
async function getDbConnection() {
    if (_conn_pool !== null) {
        try {
            await _conn_pool.query('SELECT 1');
            return _conn_pool;
        } catch (err) {
            _conn_pool = null;
        }
    }

    _conn_pool = new Client({
        user: DB_USER,
        password: DB_PASS,
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000
    });

    await _conn_pool.connect();
    await _conn_pool.query(`SET search_path TO ${DB_SCHEMA}, public`);
    return _conn_pool;
}

// ===================== Response Helper =====================
function response(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify(body)
    };
}

// ===================== Lambda Handler =====================
exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const rawPath = event.path || event.rawPath || event.requestContext?.http?.path || '/';

    // ตัด stage prefix ถ้ามี (เช่น /prod, /dev)
    let path = rawPath;
    if (path.startsWith('/prod')) {
        path = path.slice(5);
    } else if (path.startsWith('/dev')) {
        path = path.slice(4);
    }

    // ถ้า path ว่าง ให้เป็น /
    if (!path || path === '') {
        path = '/';
    }

    console.log('Method:', httpMethod, 'Path:', path);

    let body = event.body || '{}';
    const queryParams = event.queryStringParameters || {};

    // Handle OPTIONS for CORS
    if (httpMethod === 'OPTIONS') {
        return response(200, { message: 'OK' });
    }

    // Parse body if it's a string
    if (typeof body === 'string') {
        try {
            body = body ? JSON.parse(body) : {};
        } catch (err) {
            body = {};
        }
    }

    try {
        const conn = await getDbConnection();

        // ================= ROUTES =================
        // Test DB Connection
        if (httpMethod === 'GET' && path === '/connection') {
            return await testConnection(conn);
        }

        // Complaint Messages - NEW ENDPOINT
        else if (httpMethod === 'GET' && path.match(/^\/table\/complaints\/[^\/]+\/messages$/)) {
            const complaintId = path.split('/')[3];
            return await getComplaintMessages(conn, complaintId);
        }

        // Complaint Summary - NEW ENDPOINT
        else if (httpMethod === 'GET' && path.match(/^\/table\/complaints\/[^\/]+\/summary$/)) {
            const complaintId = path.split('/')[3];
            return await getComplaintSummary(conn, complaintId);
        }

        // Create Complaint Summary - NEW ENDPOINT
        else if (httpMethod === 'POST' && path.match(/^\/table\/complaints\/[^\/]+\/summary$/)) {
            const complaintId = path.split('/')[3];
            return await createComplaintSummary(conn, complaintId);
        }

        // GET all records from a table
        else if (httpMethod === 'GET' && path.startsWith('/table/')) {
            const parts = path.split('/').filter(p => p);
            if (parts.length === 2) {
                const tableName = parts[1];
                return await getTableRecords(conn, tableName, queryParams);
            } else if (parts.length === 3) {
                const tableName = parts[1];
                const recordId = parts[2];
                return await getTableRecordById(conn, tableName, recordId);
            }
        }

        // User routes
        else if (httpMethod === 'GET' && path === '/users') {
            return await getUsers(conn, queryParams);
        }
        else if (httpMethod === 'GET' && path.startsWith('/user/')) {
            const userId = path.split('/').filter(p => p).pop();
            return await getUserById(conn, userId);
        }
        else if (httpMethod === 'POST' && path === '/user') {
            return await createUser(conn, body);
        }
        else if (httpMethod === 'PUT' && path.startsWith('/user/')) {
            const userId = path.split('/').filter(p => p).pop();
            return await updateUser(conn, userId, body);
        }
        else if (httpMethod === 'DELETE' && path.startsWith('/user/')) {
            const userId = path.split('/').filter(p => p).pop();
            return await deleteUser(conn, userId);
        }

        // Root path - API info
        else if (httpMethod === 'GET' && path === '/') {
            return response(200, {
                message: 'API is running',
                endpoints: {
                    connection: 'GET /connection',
                    users: 'GET /users',
                    user: 'GET /user/:id',
                    createUser: 'POST /user',
                    updateUser: 'PUT /user/:id',
                    deleteUser: 'DELETE /user/:id',
                    table: 'GET /table/:tableName',
                    tableRecord: 'GET /table/:tableName/:id',
                    complaintMessages: 'GET /table/complaints/:id/messages',
                    complaintSummary: 'GET /table/complaints/:id/summary',
                    createComplaintSummary: 'POST /table/complaints/:id/summary'
                }
            });
        }

        else {
            return response(404, {
                error: `Route not found: ${httpMethod} ${path}`,
                rawPath: rawPath
            });
        }

    } catch (err) {
        console.error('Error:', err);
        return response(500, {
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// ===================== NEW: Complaint Messages with Title =====================
async function getComplaintMessages(conn, complaintId) {
    if (!isValidUUID(complaintId)) {
        return response(400, { error: 'Invalid UUID' });
    }

    // Query to get messages with complaint title
    const query = `
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
    `;

    const result = await conn.query(query, [complaintId]);

    if (result.rows.length === 0) {
        // Check if complaint exists
        const complaintCheck = await conn.query('SELECT id, title FROM complaints WHERE id = $1', [complaintId]);
        if (complaintCheck.rows.length === 0) {
            return response(404, { error: 'Complaint not found' });
        }
        // Complaint exists but no messages
        return response(200, {
            messages: [],
            complaint_title: complaintCheck.rows[0].title,
            complaint_id: complaintId
        });
    }

    // Format messages
    const messages = result.rows.map(row => ({
        id: row.id,
        complaint_id: row.complaint_id,
        sender_id: row.sender_id,
        sender_type: row.sender_type,
        sender_name: row.sender_name,
        message: row.message,
        content: row.message, // alias for compatibility
        timestamp: row.timestamp || row.created_at,
        sent_at: row.timestamp || row.created_at, // alias for compatibility
        created_at: row.created_at,
        complaint_title: row.complaint_title
    }));

    return response(200, {
        messages: messages,
        complaint_title: result.rows[0].complaint_title,
        complaint_description: result.rows[0].complaint_description,
        complaint_status: result.rows[0].complaint_status,
        complaint_id: complaintId,
        count: messages.length
    });
}

// ===================== NEW: Get Complaint Summary =====================
async function getComplaintSummary(conn, complaintId) {
    if (!isValidUUID(complaintId)) {
        return response(400, { error: 'Invalid UUID' });
    }

    // Query to get summary with complaint info
    const query = `
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
    `;

    const result = await conn.query(query, [complaintId]);

    if (result.rows.length === 0) {
        // Check if complaint exists
        const complaintCheck = await conn.query(
            'SELECT id, title, description, contact_name, contact_phone, line_display_name, line_id, total_loss_amount FROM complaints WHERE id = $1',
            [complaintId]
        );
        if (complaintCheck.rows.length === 0) {
            return response(404, { error: 'Complaint not found' });
        }

        // Return complaint info without summary
        const complaint = complaintCheck.rows[0];
        return response(200, {
            summary: null,
            complaint_title: complaint.title,
            complaint_description: complaint.description,
            contact_name: complaint.contact_name,
            contact_phone: complaint.contact_phone,
            line_display_name: complaint.line_display_name,
            line_id: complaint.line_id,
            amount: complaint.total_loss_amount,
            complaint_id: complaintId,
            message: 'No summary found for this complaint'
        });
    }

    const row = result.rows[0];
    return response(200, {
        summary: {
            id: row.id,
            summary: row.summary,
            ai_summary: row.summary, // alias for compatibility
            text: row.summary, // alias for compatibility
            category: row.category,
            scam_type: row.category, // alias for compatibility
            keywords: row.keywords || [],
            tags: row.keywords || [], // alias for compatibility
            created_at: row.created_at,
            updated_at: row.updated_at
        },
        complaint_title: row.complaint_title,
        complaint_description: row.complaint_description,
        contact_name: row.contact_name,
        contact_phone: row.contact_phone,
        line_display_name: row.line_display_name,
        line_id: row.line_id,
        amount: row.total_loss_amount,
        loss_amount: row.total_loss_amount, // alias for compatibility
        complaint_id: complaintId
    });
}

// ===================== NEW: Create Complaint Summary =====================
async function createComplaintSummary(conn, complaintId) {
    if (!isValidUUID(complaintId)) {
        return response(400, { error: 'Invalid UUID' });
    }

    // Check if complaint exists
    const complaintCheck = await conn.query('SELECT id, title FROM complaints WHERE id = $1', [complaintId]);
    if (complaintCheck.rows.length === 0) {
        return response(404, { error: 'Complaint not found' });
    }

    // For now, create a placeholder summary
    // In production, this would call an AI service to generate the summary
    const insertQuery = `
        INSERT INTO summaries (complaint_id, summary, category, keywords, created_at, updated_at)
        VALUES ($1, $2, $3, $4, now(), now())
        RETURNING id, summary, category, keywords, created_at
    `;

    const placeholderSummary = 'Summary is being generated...';
    const placeholderCategory = 'Pending Analysis';
    const placeholderKeywords = ['pending'];

    const result = await conn.query(insertQuery, [
        complaintId,
        placeholderSummary,
        placeholderCategory,
        placeholderKeywords
    ]);

    const row = result.rows[0];
    return response(201, {
        message: 'Summary created successfully',
        summary: {
            id: row.id,
            complaint_id: complaintId,
            summary: row.summary,
            category: row.category,
            keywords: row.keywords,
            created_at: row.created_at
        }
    });
}

// ===================== CRUD Users =====================
async function testConnection(conn) {
    const result = await conn.query('SELECT current_database(), current_user, version(), now()');
    const row = result.rows[0];
    return response(200, {
        message: '✅ Connection successful!',
        database: row.current_database,
        user: row.current_user,
        version: row.version.substring(0, 50) + '...',
        timestamp: row.now.toISOString()
    });
}

async function getUsers(conn, params) {
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '10');
    const offset = (page - 1) * limit;
    const search = params.search || '';
    const role = params.role || '';
    const isActive = params.is_active || '';

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (search) {
        conditions.push(`(email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`);
        values.push(`%${search}%`);
        paramCount++;
    }
    if (role) {
        conditions.push(`role = $${paramCount}`);
        values.push(role);
        paramCount++;
    }
    if (isActive) {
        conditions.push(`is_active = $${paramCount}`);
        values.push(isActive.toLowerCase() === 'true');
        paramCount++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const query = `
        SELECT id, cognito_user_id, email, full_name, role, is_active, created_at, updated_at
        FROM users ${where}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const usersResult = await conn.query(query, values);

    const totalResult = await conn.query(`SELECT COUNT(*) FROM users ${where}`, values.slice(0, -2));
    const total = parseInt(totalResult.rows[0].count);

    const data = usersResult.rows.map(row => ({
        id: row.id,
        cognito_user_id: row.cognito_user_id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
    }));

    return response(200, {
        data: data,
        pagination: { page, limit, total }
    });
}

async function getUserById(conn, userId) {
    const query = `
        SELECT id, cognito_user_id, email, full_name, role, is_active, created_at, updated_at
        FROM users WHERE id = $1
    `;

    if (!isValidUUID(userId)) {
        return response(400, { error: 'Invalid UUID' });
    }

    const result = await conn.query(query, [userId]);
    if (result.rows.length === 0) {
        return response(404, { message: 'User not found' });
    }

    const row = result.rows[0];
    return response(200, {
        data: {
            id: row.id,
            cognito_user_id: row.cognito_user_id,
            email: row.email,
            full_name: row.full_name,
            role: row.role,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at
        }
    });
}

async function createUser(conn, data) {
    const required = ['cognito_user_id', 'email', 'full_name', 'role'];
    const missing = required.filter(f => !(f in data));
    if (missing.length > 0) {
        return response(400, { message: `Missing: ${missing.join(', ')}` });
    }

    const query = `
        INSERT INTO users (cognito_user_id, email, full_name, role, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id
    `;

    const result = await conn.query(query, [
        data.cognito_user_id,
        data.email,
        data.full_name,
        data.role
    ]);

    return response(201, {
        message: 'User created',
        user_id: result.rows[0].id
    });
}

async function updateUser(conn, userId, data) {
    if (!isValidUUID(userId)) {
        return response(400, { error: 'Invalid UUID' });
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const key of ['email', 'full_name', 'role', 'is_active']) {
        if (key in data) {
            if (key === 'is_active') {
                values.push(String(data[key]).toLowerCase() === 'true');
            } else {
                values.push(data[key]);
            }
            fields.push(`${key} = $${paramCount}`);
            paramCount++;
        }
    }

    if (fields.length === 0) {
        return response(400, { message: 'No fields to update' });
    }

    values.push(userId);
    const query = `
        UPDATE users SET ${fields.join(', ')}, updated_at = now()
        WHERE id = $${paramCount}
    `;

    await conn.query(query, values);
    return response(200, { message: 'User updated' });
}

async function deleteUser(conn, userId) {
    if (!isValidUUID(userId)) {
        return response(400, { error: 'Invalid UUID' });
    }

    await conn.query('DELETE FROM users WHERE id = $1', [userId]);
    return response(200, { message: 'User deleted', user_id: userId });
}

// ===================== Generic Table Functions =====================
async function getTableRecords(conn, tableName, params) {
    const allowedTables = [
        'ai_analysis', 'attachments', 'audit_logs', 'complaints',
        'messages', 'notifications', 'pattern_matches', 'patterns',
        'statistics', 'summaries', 'text_to_summarize', 'users'
    ];

    if (!allowedTables.includes(tableName)) {
        return response(400, { error: 'Table not allowed' });
    }

    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '10');
    const offset = (page - 1) * limit;

    // ดึง column names ของ table
    const colQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
    `;
    const cols = await conn.query(colQuery, [tableName]);
    const colNames = cols.rows.map(c => c.column_name);

    const query = `SELECT * FROM ${tableName} ORDER BY 1 LIMIT $1 OFFSET $2`;
    const records = await conn.query(query, [limit, offset]);

    const totalResult = await conn.query(`SELECT COUNT(*) FROM ${tableName}`);
    const total = parseInt(totalResult.rows[0].count);

    // map column names กับค่า
    const data = records.rows.map(row => {
        const rowDict = {};
        colNames.forEach((col, i) => {
            rowDict[col] = row[col];
        });
        return rowDict;
    });

    return response(200, {
        columns: colNames,
        data: data,
        pagination: { page, limit, total }
    });
}

async function getTableRecordById(conn, tableName, recordId) {
    const allowedTables = [
        'ai_analysis', 'attachments', 'audit_logs', 'complaints',
        'messages', 'notifications', 'pattern_matches', 'patterns',
        'statistics', 'summaries', 'text_to_summarize', 'users'
    ];

    if (!allowedTables.includes(tableName)) {
        return response(400, { error: 'Table not allowed' });
    }

    if (!isValidUUID(recordId)) {
        return response(400, { error: 'Invalid UUID' });
    }

    // ดึง column names ของ table
    const colQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
    `;
    const cols = await conn.query(colQuery, [tableName]);
    const colNames = cols.rows.map(c => c.column_name);

    const query = `SELECT * FROM ${tableName} WHERE id = $1`;
    const result = await conn.query(query, [recordId]);

    if (result.rows.length === 0) {
        return response(404, { message: 'Record not found' });
    }

    const rowDict = {};
    colNames.forEach((col, i) => {
        rowDict[col] = result.rows[0][col];
    });

    return response(200, { columns: colNames, data: rowDict });
}

// ===================== Helper Functions =====================
function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}
