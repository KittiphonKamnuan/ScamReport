// test-service-history.mjs
// Test suite for Service History API

const LAMBDA_URL = 'https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

let testsPassed = 0;
let testsFailed = 0;
let createdRecordId = null;

async function testEndpoint(name, url, options = {}) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}Testing: ${name}${colors.reset}`);
  console.log(`${colors.blue}URL: ${url}${colors.reset}`);

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`${colors.green}✓ Success (${response.status})${colors.reset}`);
      console.log(`Response:`, JSON.stringify(data, null, 2).substring(0, 500));
      testsPassed++;
      return { success: true, data, status: response.status };
    } else {
      console.log(`${colors.red}✗ Failed (${response.status})${colors.reset}`);
      console.log(`Error:`, JSON.stringify(data, null, 2));
      testsFailed++;
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    testsFailed++;
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.magenta}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      Service History API - Complete Test Suite           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`${colors.yellow}═══════════════ Section 1: GET Tests ═══════════════${colors.reset}`);

  // Test 1: Get all records
  const getAll = await testEndpoint(
    'Get All Service History Records',
    `${LAMBDA_URL}/table/service-history?limit=10`
  );

  // Test 2: Get with filters
  await testEndpoint(
    'Get with Province Filter',
    `${LAMBDA_URL}/table/service-history?province=กรุงเทพมหานคร&limit=5`
  );

  // Test 3: Get with year filter
  await testEndpoint(
    'Get with Year Filter',
    `${LAMBDA_URL}/table/service-history?year=2567&limit=5`
  );

  // Test 4: Get statistics
  await testEndpoint(
    'Get Statistics',
    `${LAMBDA_URL}/table/service-history/stats`
  );

  // Test 5: Get statistics with year filter
  await testEndpoint(
    'Get Statistics (Year 2567)',
    `${LAMBDA_URL}/table/service-history/stats?year=2567`
  );

  console.log(`${colors.yellow}═══════════════ Section 2: POST Tests ═══════════════${colors.reset}`);

  // Test 6: Create new record
  const createResult = await testEndpoint(
    'Create New Record',
    `${LAMBDA_URL}/table/service-history`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-01-20',
        province: 'เชียงใหม่',
        month_name: 'มกราคม',
        description: 'ทดสอบระบบ - โดนหลอกซื้อของออนไลน์',
        issue_type: 'ปัญหาภัยออนไลน์',
        gender: 'หญิง',
        age: 28,
        occupation: 'พนักงานบริษัท',
        financial_damage: 7500,
        benefit_received: 'ได้รับคำแนะนำ',
        beneficiary_status: 'รับประโยชน์ด้วยตัวเอง',
        is_representative: false,
        beneficiary_count: 1,
        year: 2567,
        status: 'completed',
        recorded_by: 'test-script'
      })
    }
  );

  if (createResult.success && createResult.data.data) {
    createdRecordId = createResult.data.data.id;
    console.log(`${colors.green}📝 Created Record ID: ${createdRecordId}${colors.reset}`);
  }

  // Test 7: Create with missing fields (should fail)
  await testEndpoint(
    'Create with Missing Required Fields (Should Fail)',
    `${LAMBDA_URL}/table/service-history`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        province: 'กรุงเทพมหานคร'
        // Missing: date, description, year
      })
    }
  );

  console.log(`${colors.yellow}═══════════════ Section 3: GET by ID Tests ═══════════════${colors.reset}`);

  if (createdRecordId) {
    // Test 8: Get by ID
    await testEndpoint(
      'Get Record by ID',
      `${LAMBDA_URL}/table/service-history/${createdRecordId}`
    );
  } else {
    console.log(`${colors.yellow}⊘ Skipped: No record ID available${colors.reset}`);
  }

  // Test 9: Get by invalid ID (should fail)
  await testEndpoint(
    'Get by Invalid ID (Should Fail)',
    `${LAMBDA_URL}/table/service-history/invalid-uuid`
  );

  console.log(`${colors.yellow}═══════════════ Section 4: PUT Tests ═══════════════${colors.reset}`);

  if (createdRecordId) {
    // Test 10: Update record
    await testEndpoint(
      'Update Record',
      `${LAMBDA_URL}/table/service-history/${createdRecordId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'ทดสอบระบบ - โดนหลอกซื้อของออนไลน์ (แก้ไขแล้ว)',
          financial_damage: 8000,
          updated_by: 'test-script-updater'
        })
      }
    );

    // Test 11: Verify update
    const verifyUpdate = await testEndpoint(
      'Verify Update',
      `${LAMBDA_URL}/table/service-history/${createdRecordId}`
    );

    if (verifyUpdate.success) {
      const record = verifyUpdate.data.data;
      if (record.financial_damage === '8000.00' || record.financial_damage === 8000) {
        console.log(`${colors.green}✓ Update verified: financial_damage = ${record.financial_damage}${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Update failed: financial_damage = ${record.financial_damage}${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.yellow}⊘ Skipped: No record ID available${colors.reset}`);
  }

  console.log(`${colors.yellow}═══════════════ Section 5: DELETE Tests ═══════════════${colors.reset}`);

  if (createdRecordId) {
    // Test 12: Delete record
    await testEndpoint(
      'Delete Record',
      `${LAMBDA_URL}/table/service-history/${createdRecordId}`,
      {
        method: 'DELETE'
      }
    );

    // Test 13: Verify deletion
    const verifyDelete = await testEndpoint(
      'Verify Deletion (Should Fail 404)',
      `${LAMBDA_URL}/table/service-history/${createdRecordId}`
    );

    if (verifyDelete.status === 404) {
      console.log(`${colors.green}✓ Deletion verified: Record not found (404)${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⊘ Skipped: No record ID available${colors.reset}`);
  }

  // Summary
  console.log(`${colors.magenta}
╔═══════════════════════════════════════════════════════════╗
║                    Test Results Summary                   ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`${colors.green}✓ Passed:  ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed:  ${testsFailed}${colors.reset}`);
  console.log(`${colors.blue}Total:     ${testsPassed + testsFailed}${colors.reset}`);

  const successRate = Math.round((testsPassed / (testsPassed + testsFailed)) * 100);
  console.log(`${colors.cyan}Success Rate: ${successRate}%${colors.reset}`);

  if (successRate === 100) {
    console.log(`${colors.green}
🎉 All tests passed! Service History API is working correctly.
${colors.reset}`);
  } else if (successRate >= 80) {
    console.log(`${colors.yellow}
⚠️  Most tests passed, but some failed. Check the errors above.
${colors.reset}`);
  } else {
    console.log(`${colors.red}
❌ Many tests failed. Please check your Lambda deployment.
${colors.reset}`);
  }

  console.log(`${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
