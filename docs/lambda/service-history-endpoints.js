// =====================================================
// Lambda Function Handlers สำหรับ service_history
// เพิ่ม code นี้ใน lambda-complete.js
// =====================================================

// ============= SERVICE HISTORY API =============

// GET /table/service-history - ดึงข้อมูลทั้งหมด
if (path === '/table/service-history' && httpMethod === 'GET') {
    const limit = parseInt(queryParams.limit) || 100;
    const offset = parseInt(queryParams.offset) || 0;
    const page = parseInt(queryParams.page) || 1;
    const actualOffset = queryParams.page ? (page - 1) * limit : offset;

    // Filters
    const province = queryParams.province;
    const year = queryParams.year;
    const issueType = queryParams.issue_type;
    const status = queryParams.status;

    try {
        const conn = await getDbConnection();

        // Build WHERE clause
        let whereConditions = [];
        let queryValues = [];
        let valueIndex = 1;

        if (province) {
            whereConditions.push(`province = $${valueIndex++}`);
            queryValues.push(province);
        }
        if (year) {
            whereConditions.push(`year = $${valueIndex++}`);
            queryValues.push(parseInt(year));
        }
        if (issueType) {
            whereConditions.push(`issue_type = $${valueIndex++}`);
            queryValues.push(issueType);
        }
        if (status) {
            whereConditions.push(`status = $${valueIndex++}`);
            queryValues.push(status);
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Count total
        const countQuery = `SELECT COUNT(*) as total FROM service_history ${whereClause}`;
        const countResult = await conn.query(countQuery, queryValues);
        const total = parseInt(countResult.rows[0].total);

        // Get data
        const dataQuery = `
            SELECT * FROM service_history
            ${whereClause}
            ORDER BY created_at DESC, date DESC
            LIMIT $${valueIndex++} OFFSET $${valueIndex}
        `;
        queryValues.push(limit, actualOffset);

        const result = await conn.query(dataQuery, queryValues);

        return response(200, {
            data: result.rows,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit),
                hasMore: actualOffset + result.rows.length < total
            }
        }, origin);
    } catch (error) {
        console.error('Error fetching service history:', error);
        return response(500, {
            error: 'Failed to fetch service history',
            message: error.message
        }, origin);
    }
}

// GET /table/service-history/:id - ดึงข้อมูลตาม ID
const serviceHistoryByIdMatch = path.match(/^\/table\/service-history\/([a-f0-9-]+)$/);
if (serviceHistoryByIdMatch && httpMethod === 'GET') {
    const recordId = serviceHistoryByIdMatch[1];

    if (!isValidUUID(recordId)) {
        return response(400, { error: 'Invalid record ID format' }, origin);
    }

    try {
        const conn = await getDbConnection();
        const query = 'SELECT * FROM service_history WHERE id = $1';
        const result = await conn.query(query, [recordId]);

        if (result.rows.length === 0) {
            return response(404, { error: 'Record not found' }, origin);
        }

        return response(200, { data: result.rows[0] }, origin);
    } catch (error) {
        console.error(`Error fetching service history ${recordId}:`, error);
        return response(500, {
            error: 'Failed to fetch service history record',
            message: error.message
        }, origin);
    }
}

// POST /table/service-history - เพิ่มข้อมูลใหม่
if (path === '/table/service-history' && httpMethod === 'POST') {
    try {
        const body = JSON.parse(event.body || '{}');

        // Validate required fields
        if (!body.date || !body.description || !body.year) {
            return response(400, {
                error: 'Missing required fields',
                required: ['date', 'description', 'year']
            }, origin);
        }

        const conn = await getDbConnection();

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
            body.date,
            body.province || null,
            body.month_name || null,
            body.description,
            body.issue_type || null,
            body.gender || null,
            body.age ? parseInt(body.age) : null,
            body.occupation || null,
            body.financial_damage ? parseFloat(body.financial_damage) : null,
            body.benefit_received || null,
            body.beneficiary_status || null,
            body.is_representative || false,
            body.organization_name || null,
            body.beneficiary_count ? parseInt(body.beneficiary_count) : 1,
            parseInt(body.year),
            body.status || 'completed',
            body.recorded_by || 'admin'
        ];

        const result = await conn.query(query, values);

        return response(201, {
            data: result.rows[0],
            message: 'Service history record created successfully'
        }, origin);
    } catch (error) {
        console.error('Error creating service history:', error);
        return response(500, {
            error: 'Failed to create service history record',
            message: error.message
        }, origin);
    }
}

// PUT /table/service-history/:id - แก้ไขข้อมูล
const serviceHistoryUpdateMatch = path.match(/^\/table\/service-history\/([a-f0-9-]+)$/);
if (serviceHistoryUpdateMatch && httpMethod === 'PUT') {
    const recordId = serviceHistoryUpdateMatch[1];

    if (!isValidUUID(recordId)) {
        return response(400, { error: 'Invalid record ID format' }, origin);
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const conn = await getDbConnection();

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
            body.date || null,
            body.province || null,
            body.month_name || null,
            body.description || null,
            body.issue_type || null,
            body.gender || null,
            body.age ? parseInt(body.age) : null,
            body.occupation || null,
            body.financial_damage ? parseFloat(body.financial_damage) : null,
            body.benefit_received || null,
            body.beneficiary_status || null,
            body.is_representative !== undefined ? body.is_representative : null,
            body.organization_name || null,
            body.beneficiary_count ? parseInt(body.beneficiary_count) : null,
            body.year ? parseInt(body.year) : null,
            body.status || null,
            body.updated_by || null,
            recordId
        ];

        const result = await conn.query(query, values);

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

// DELETE /table/service-history/:id - ลบข้อมูล
const serviceHistoryDeleteMatch = path.match(/^\/table\/service-history\/([a-f0-9-]+)$/);
if (serviceHistoryDeleteMatch && httpMethod === 'DELETE') {
    const recordId = serviceHistoryDeleteMatch[1];

    if (!isValidUUID(recordId)) {
        return response(400, { error: 'Invalid record ID format' }, origin);
    }

    try {
        const conn = await getDbConnection();

        // Check if record exists
        const checkQuery = 'SELECT id FROM service_history WHERE id = $1';
        const checkResult = await conn.query(checkQuery, [recordId]);

        if (checkResult.rows.length === 0) {
            return response(404, { error: 'Record not found' }, origin);
        }

        const query = 'DELETE FROM service_history WHERE id = $1 RETURNING *';
        const result = await conn.query(query, [recordId]);

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

// GET /table/service-history/stats - สถิติ
if (path === '/table/service-history/stats' && httpMethod === 'GET') {
    try {
        const conn = await getDbConnection();

        const year = queryParams.year;
        const whereClause = year ? `WHERE year = ${parseInt(year)}` : '';

        const statsQuery = `
            SELECT
                COUNT(*) as total_records,
                SUM(financial_damage) as total_damage,
                AVG(financial_damage) as avg_damage,
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
                SUM(financial_damage) as total_damage
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
                SUM(financial_damage) as total_damage
            FROM service_history
            ${whereClause}
            GROUP BY issue_type
            ORDER BY count DESC
        `;

        const issueResult = await conn.query(issueQuery);

        return response(200, {
            overall: statsResult.rows[0],
            by_province: provinceResult.rows,
            by_issue_type: issueResult.rows
        }, origin);
    } catch (error) {
        console.error('Error fetching service history stats:', error);
        return response(500, {
            error: 'Failed to fetch statistics',
            message: error.message
        }, origin);
    }
}
