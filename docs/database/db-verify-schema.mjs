// db-verify-schema.mjs
// Verify database schema and check for required columns

import pg from 'pg';
const { Client } = pg;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Database configuration
const DB_CONFIG = {
  host: 'scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'scamreport',
  user: 'postgres',
  password: 'Password123!',
  ssl: {
    rejectUnauthorized: false
  }
};

async function verifySchema() {
  const client = new Client(DB_CONFIG);

  try {
    console.log(`${colors.blue}================================`);
    console.log('Database Schema Verification');
    console.log(`================================${colors.reset}\n`);

    await client.connect();
    console.log(`${colors.green}✓ Connected to database${colors.reset}\n`);

    // Check all tables
    console.log(`${colors.cyan}Checking tables...${colors.reset}`);
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables:\n`, tables.join(', '), '\n');

    // Check complaints table structure
    if (tables.includes('complaints')) {
      console.log(`${colors.cyan}Checking complaints table structure...${colors.reset}`);

      const columnsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'complaints'
        ORDER BY ordinal_position
      `);

      console.log('\nComplaints table columns:');
      console.log('─'.repeat(80));
      console.log('Column Name'.padEnd(30), 'Type'.padEnd(20), 'Nullable'.padEnd(10), 'Default');
      console.log('─'.repeat(80));

      const requiredColumns = ['id', 'title', 'description', 'contact_name', 'contact_phone',
                                'line_display_name', 'line_id', 'total_loss_amount',
                                'status', 'created_at', 'updated_at'];
      const foundColumns = [];

      columnsResult.rows.forEach(col => {
        const isRequired = requiredColumns.includes(col.column_name);
        const color = isRequired ? colors.green : colors.reset;
        console.log(
          `${color}${col.column_name.padEnd(30)}${colors.reset}`,
          col.data_type.padEnd(20),
          col.is_nullable.padEnd(10),
          (col.column_default || '').substring(0, 30)
        );
        if (isRequired) foundColumns.push(col.column_name);
      });

      console.log('─'.repeat(80));

      // Check for missing required columns
      const missingColumns = requiredColumns.filter(c => !foundColumns.includes(c));

      if (missingColumns.length > 0) {
        console.log(`\n${colors.red}✗ Missing required columns:${colors.reset}`);
        missingColumns.forEach(col => {
          console.log(`  ${colors.red}• ${col}${colors.reset}`);
        });

        // Generate ALTER TABLE statements
        console.log(`\n${colors.yellow}Run these SQL commands to add missing columns:${colors.reset}\n`);

        if (missingColumns.includes('title')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN title VARCHAR(255);${colors.reset}`);
        }
        if (missingColumns.includes('description')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN description TEXT;${colors.reset}`);
        }
        if (missingColumns.includes('contact_name')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN contact_name VARCHAR(255);${colors.reset}`);
        }
        if (missingColumns.includes('contact_phone')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN contact_phone VARCHAR(50);${colors.reset}`);
        }
        if (missingColumns.includes('line_display_name')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN line_display_name VARCHAR(255);${colors.reset}`);
        }
        if (missingColumns.includes('line_id')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN line_id VARCHAR(255);${colors.reset}`);
        }
        if (missingColumns.includes('total_loss_amount')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN total_loss_amount DECIMAL(15,2);${colors.reset}`);
        }
        if (missingColumns.includes('status')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN status VARCHAR(50) DEFAULT 'pending';${colors.reset}`);
        }
        if (missingColumns.includes('created_at')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN created_at TIMESTAMP DEFAULT NOW();${colors.reset}`);
        }
        if (missingColumns.includes('updated_at')) {
          console.log(`${colors.cyan}ALTER TABLE complaints ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();${colors.reset}`);
        }
      } else {
        console.log(`\n${colors.green}✓ All required columns present!${colors.reset}`);
      }

      // Check for sample data
      const countResult = await client.query('SELECT COUNT(*) FROM complaints');
      const count = parseInt(countResult.rows[0].count);
      console.log(`\n${colors.blue}Total complaints: ${count}${colors.reset}`);

      if (count > 0) {
        // Show sample record
        const sampleResult = await client.query(`
          SELECT id, title, contact_name, created_at
          FROM complaints
          LIMIT 1
        `);

        if (sampleResult.rows.length > 0) {
          console.log(`\n${colors.cyan}Sample record:${colors.reset}`);
          console.log(JSON.stringify(sampleResult.rows[0], null, 2));
        }
      }
    } else {
      console.log(`${colors.red}✗ complaints table not found!${colors.reset}`);
    }

    // Check messages table
    if (tables.includes('messages')) {
      console.log(`\n${colors.cyan}Checking messages table...${colors.reset}`);

      const msgCountResult = await client.query('SELECT COUNT(*) FROM messages');
      const msgCount = parseInt(msgCountResult.rows[0].count);
      console.log(`${colors.blue}Total messages: ${msgCount}${colors.reset}`);

      // Check for complaint_id foreign key
      const fkResult = await client.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'messages'
          AND kcu.column_name = 'complaint_id'
      `);

      if (fkResult.rows.length > 0) {
        console.log(`${colors.green}✓ Foreign key to complaints table exists${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ No foreign key constraint on complaint_id${colors.reset}`);
      }
    }

    // Check summaries table
    if (tables.includes('summaries')) {
      console.log(`\n${colors.cyan}Checking summaries table...${colors.reset}`);

      const sumCountResult = await client.query('SELECT COUNT(*) FROM summaries');
      const sumCount = parseInt(sumCountResult.rows[0].count);
      console.log(`${colors.blue}Total summaries: ${sumCount}${colors.reset}`);
    }

    // Test JOIN query
    if (tables.includes('complaints') && tables.includes('messages')) {
      console.log(`\n${colors.cyan}Testing JOIN query (messages with complaint title)...${colors.reset}`);

      const joinResult = await client.query(`
        SELECT
          m.id,
          m.message,
          c.title as complaint_title
        FROM messages m
        INNER JOIN complaints c ON m.complaint_id = c.id
        LIMIT 1
      `);

      if (joinResult.rows.length > 0) {
        console.log(`${colors.green}✓ JOIN query works!${colors.reset}`);
        console.log('Sample result:', JSON.stringify(joinResult.rows[0], null, 2));
      } else {
        console.log(`${colors.yellow}⚠ No data to test JOIN (tables exist but empty)${colors.reset}`);
      }
    }

    console.log(`\n${colors.blue}================================`);
    console.log('Verification Complete!');
    console.log(`================================${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run verification
verifySchema().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
