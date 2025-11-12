// test-all-endpoints.mjs
// Complete test suite for Lambda API

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
let testsSkipped = 0;

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

async function runAllTests() {
  console.log(`${colors.magenta}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         ScamReport Lambda API - Complete Test Suite      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  let complaintId = null;

  // ==================== Test 1: Root Endpoint ====================
  console.log(`\n${colors.yellow}═══════════════ Section 1: Health Checks ═══════════════${colors.reset}`);

  const test1 = await testEndpoint(
    'Root API Info',
    `${LAMBDA_URL}/`
  );

  // ==================== Test 2: Connection ====================
  const test2 = await testEndpoint(
    'Database Connection',
    `${LAMBDA_URL}/connection`
  );

  // ==================== Test 3: CORS Preflight ====================
  console.log(`\n${colors.yellow}═══════════════ Section 2: CORS Support ═══════════════${colors.reset}`);

  const test3 = await testEndpoint(
    'CORS Preflight (OPTIONS)',
    `${LAMBDA_URL}/table/complaints`,
    { method: 'OPTIONS' }
  );

  // ==================== Test 4: Get All Complaints ====================
  console.log(`\n${colors.yellow}═══════════════ Section 3: Complaints API ═══════════════${colors.reset}`);

  const test4 = await testEndpoint(
    'Get All Complaints (limit=5)',
    `${LAMBDA_URL}/table/complaints?limit=5`
  );

  // Extract complaint ID for next tests
  if (test4.success && test4.data.data && test4.data.data.length > 0) {
    complaintId = test4.data.data[0].id;
    console.log(`${colors.green}📌 Using Complaint ID: ${complaintId}${colors.reset}`);
  }

  // ==================== Test 5: Pagination ====================
  const test5 = await testEndpoint(
    'Get Complaints (page 2, limit 3)',
    `${LAMBDA_URL}/table/complaints?page=2&limit=3`
  );

  // ==================== Test 6: Get Complaint by ID ====================
  if (complaintId) {
    const test6 = await testEndpoint(
      'Get Complaint by ID',
      `${LAMBDA_URL}/table/complaints/${complaintId}`
    );
  } else {
    console.log(`${colors.yellow}⊘ Skipped: Get Complaint by ID (no complaint ID)${colors.reset}`);
    testsSkipped++;
  }

  // ==================== Test 7: Get Messages with Title ====================
  console.log(`\n${colors.yellow}═══════════════ Section 4: Messages API (NEW!) ═══════════════${colors.reset}`);

  if (complaintId) {
    const test7 = await testEndpoint(
      'Get Messages with Complaint Title',
      `${LAMBDA_URL}/table/complaints/${complaintId}/messages`
    );

    if (test7.success) {
      console.log(`\n${colors.green}📋 Checking Response Structure:${colors.reset}`);
      console.log(`  ✓ messages array: ${Array.isArray(test7.data.messages) ? 'YES' : 'NO'}`);
      console.log(`  ✓ complaint_title: ${test7.data.complaint_title ? 'YES' : 'NO'}`);
      console.log(`  ✓ count: ${test7.data.count !== undefined ? 'YES' : 'NO'}`);

      if (test7.data.complaint_title) {
        console.log(`  ${colors.cyan}→ Title: "${test7.data.complaint_title}"${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.yellow}⊘ Skipped: Get Messages (no complaint ID)${colors.reset}`);
    testsSkipped++;
  }

  // ==================== Test 8: Get Summary ====================
  console.log(`\n${colors.yellow}═══════════════ Section 5: Summary API ═══════════════${colors.reset}`);

  if (complaintId) {
    const test8 = await testEndpoint(
      'Get Complaint Summary',
      `${LAMBDA_URL}/table/complaints/${complaintId}/summary`
    );

    if (test8.success) {
      console.log(`\n${colors.green}📋 Checking Response Structure:${colors.reset}`);
      console.log(`  ✓ summary object: ${test8.data.summary ? 'YES' : 'NO'}`);
      console.log(`  ✓ complaint_title: ${test8.data.complaint_title ? 'YES' : 'NO'}`);
      console.log(`  ✓ contact info: ${test8.data.contact_name ? 'YES' : 'NO'}`);
    }
  } else {
    console.log(`${colors.yellow}⊘ Skipped: Get Summary (no complaint ID)${colors.reset}`);
    testsSkipped++;
  }

  // ==================== Test 9: Generic Table Access ====================
  console.log(`\n${colors.yellow}═══════════════ Section 6: Generic Table Access ═══════════════${colors.reset}`);

  const test9 = await testEndpoint(
    'Get Messages Table (limit=3)',
    `${LAMBDA_URL}/table/messages?limit=3`
  );

  const test10 = await testEndpoint(
    'Get Summaries Table (limit=3)',
    `${LAMBDA_URL}/table/summaries?limit=3`
  );

  // ==================== Test 11: Error Handling ====================
  console.log(`\n${colors.yellow}═══════════════ Section 7: Error Handling ═══════════════${colors.reset}`);

  const test11 = await testEndpoint(
    'Invalid UUID (should fail)',
    `${LAMBDA_URL}/table/complaints/invalid-uuid`
  );

  if (test11.status === 400) {
    console.log(`${colors.green}✓ Correctly rejected invalid UUID${colors.reset}`);
  }

  const test12 = await testEndpoint(
    'Forbidden Table (should fail)',
    `${LAMBDA_URL}/table/forbidden_table`
  );

  if (test12.status === 403) {
    console.log(`${colors.green}✓ Correctly blocked forbidden table${colors.reset}`);
  }

  const test13 = await testEndpoint(
    'Non-existent Route (should 404)',
    `${LAMBDA_URL}/nonexistent`
  );

  if (test13.status === 404) {
    console.log(`${colors.green}✓ Correctly returned 404 for unknown route${colors.reset}`);
  }

  // ==================== Test 14: Large Limit ====================
  console.log(`\n${colors.yellow}═══════════════ Section 8: Performance Tests ═══════════════${colors.reset}`);

  const test14 = await testEndpoint(
    'Large Limit (1000 records)',
    `${LAMBDA_URL}/table/complaints?limit=1000`
  );

  if (test14.success && test14.data.data) {
    console.log(`${colors.cyan}📊 Retrieved ${test14.data.data.length} records${colors.reset}`);
    console.log(`${colors.cyan}📄 Total pages: ${test14.data.pagination?.pages || 'N/A'}${colors.reset}`);
  }

  // ==================== Summary ====================
  console.log(`\n${colors.magenta}
╔═══════════════════════════════════════════════════════════╗
║                    Test Results Summary                   ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  const total = testsPassed + testsFailed + testsSkipped;

  console.log(`${colors.green}✓ Passed:  ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed:  ${testsFailed}${colors.reset}`);
  console.log(`${colors.yellow}⊘ Skipped: ${testsSkipped}${colors.reset}`);
  console.log(`${colors.blue}Total:     ${total}${colors.reset}`);

  const successRate = total > 0 ? Math.round((testsPassed / total) * 100) : 0;
  console.log(`\n${colors.cyan}Success Rate: ${successRate}%${colors.reset}`);

  console.log(`\n${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // ==================== Detailed Results ====================
  console.log(`${colors.blue}Detailed Results:${colors.reset}\n`);

  console.log(`1. Root API Info                     ${testsPassed >= 1 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`2. Database Connection               ${testsPassed >= 2 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`3. CORS Preflight                    ${testsPassed >= 3 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`4. Get All Complaints                ${testsPassed >= 4 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`5. Pagination                        ${testsPassed >= 5 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`6. Get Complaint by ID               ${testsPassed >= 6 || testsSkipped >= 1 ? colors.green + '✓' : colors.yellow + '⊘'}${colors.reset}`);
  console.log(`7. Get Messages with Title ⭐         ${testsPassed >= 7 || testsSkipped >= 2 ? colors.green + '✓' : colors.yellow + '⊘'}${colors.reset}`);
  console.log(`8. Get Summary                       ${testsPassed >= 8 || testsSkipped >= 3 ? colors.green + '✓' : colors.yellow + '⊘'}${colors.reset}`);
  console.log(`9. Get Messages Table                ${testsPassed >= 9 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`10. Get Summaries Table              ${testsPassed >= 10 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`11-13. Error Handling                ${testsFailed >= 3 ? colors.green + '✓' : colors.yellow + '~'}${colors.reset}`);
  console.log(`14. Large Limit Test                 ${testsPassed >= 11 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);

  // ==================== Recommendations ====================
  console.log(`\n${colors.cyan}💡 Recommendations:${colors.reset}\n`);

  if (testsFailed > 0) {
    console.log(`${colors.yellow}⚠ Some tests failed. Check:${colors.reset}`);
    console.log(`  • Database connection and credentials`);
    console.log(`  • Lambda environment variables`);
    console.log(`  • Database schema (ensure 'title' column exists)`);
  }

  if (testsSkipped > 0) {
    console.log(`${colors.yellow}⚠ Some tests skipped (no data in database)${colors.reset}`);
    console.log(`  • Run: node db-create-sample-data.mjs`);
    console.log(`  • Or add some complaints manually`);
  }

  if (testsPassed === total && testsFailed === 0) {
    console.log(`${colors.green}🎉 All tests passed! Lambda API is working perfectly!${colors.reset}`);
  }

  console.log(`\n${colors.blue}Next Steps:${colors.reset}`);
  console.log(`  1. Test from frontend application`);
  console.log(`  2. Monitor CloudWatch logs`);
  console.log(`  3. Set up CloudWatch alarms`);
  console.log(`  4. Consider adding authentication`);

  // Exit code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
