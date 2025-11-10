// test-endpoints.mjs
// Test script for new Lambda endpoints

const LAMBDA_URL = 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`URL: ${url}`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`${colors.green}✓ Success (${response.status})${colors.reset}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log(`${colors.red}✗ Failed (${response.status})${colors.reset}`);
      console.log('Error:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.blue}=====================================`);
  console.log('Lambda Endpoints Test Suite');
  console.log(`=====================================${colors.reset}\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Root endpoint
  console.log(`\n${colors.yellow}--- Test 1: Root Endpoint ---${colors.reset}`);
  const test1 = await testEndpoint('Root API Info', `${LAMBDA_URL}/`);
  results.tests.push({ name: 'Root', ...test1 });
  test1.success ? results.passed++ : results.failed++;

  // Test 2: Connection test
  console.log(`\n${colors.yellow}--- Test 2: Database Connection ---${colors.reset}`);
  const test2 = await testEndpoint('DB Connection', `${LAMBDA_URL}/connection`);
  results.tests.push({ name: 'Connection', ...test2 });
  test2.success ? results.passed++ : results.failed++;

  // Test 3: Get all complaints
  console.log(`\n${colors.yellow}--- Test 3: Get All Complaints ---${colors.reset}`);
  const test3 = await testEndpoint('Get Complaints', `${LAMBDA_URL}/table/complaints?limit=5`);
  results.tests.push({ name: 'Get Complaints', ...test3 });
  test3.success ? results.passed++ : results.failed++;

  // Extract a complaint ID for further tests
  let complaintId = null;
  if (test3.success && test3.data.data && test3.data.data.length > 0) {
    complaintId = test3.data.data[0].id;
    console.log(`${colors.green}Found complaint ID: ${complaintId}${colors.reset}`);
  }

  if (complaintId) {
    // Test 4: Get specific complaint
    console.log(`\n${colors.yellow}--- Test 4: Get Specific Complaint ---${colors.reset}`);
    const test4 = await testEndpoint(
      'Get Complaint by ID',
      `${LAMBDA_URL}/table/complaints/${complaintId}`
    );
    results.tests.push({ name: 'Get Complaint by ID', ...test4 });
    test4.success ? results.passed++ : results.failed++;

    // Test 5: Get complaint messages (NEW ENDPOINT)
    console.log(`\n${colors.yellow}--- Test 5: Get Complaint Messages (WITH TITLE) ---${colors.reset}`);
    const test5 = await testEndpoint(
      'Get Messages with Title',
      `${LAMBDA_URL}/table/complaints/${complaintId}/messages`
    );
    results.tests.push({ name: 'Get Messages', ...test5 });
    test5.success ? results.passed++ : results.failed++;

    // Verify complaint_title is included
    if (test5.success && test5.data.complaint_title) {
      console.log(`${colors.green}✓ complaint_title found: "${test5.data.complaint_title}"${colors.reset}`);
    } else if (test5.success) {
      console.log(`${colors.yellow}⚠ complaint_title not found in response${colors.reset}`);
    }

    // Test 6: Get complaint summary (NEW ENDPOINT)
    console.log(`\n${colors.yellow}--- Test 6: Get Complaint Summary ---${colors.reset}`);
    const test6 = await testEndpoint(
      'Get Summary',
      `${LAMBDA_URL}/table/complaints/${complaintId}/summary`
    );
    results.tests.push({ name: 'Get Summary', ...test6 });
    test6.success ? results.passed++ : results.failed++;

    // Test 7: Create complaint summary (NEW ENDPOINT)
    console.log(`\n${colors.yellow}--- Test 7: Create Complaint Summary ---${colors.reset}`);
    console.log(`${colors.yellow}(This will create a new summary record)${colors.reset}`);
    const test7 = await testEndpoint(
      'Create Summary',
      `${LAMBDA_URL}/table/complaints/${complaintId}/summary`,
      'POST'
    );
    results.tests.push({ name: 'Create Summary', ...test7 });
    test7.success ? results.passed++ : results.failed++;
  } else {
    console.log(`${colors.yellow}⚠ Skipping tests 4-7 (no complaint ID found)${colors.reset}`);
    results.tests.push(
      { name: 'Get Complaint by ID', success: false, error: 'No complaint ID' },
      { name: 'Get Messages', success: false, error: 'No complaint ID' },
      { name: 'Get Summary', success: false, error: 'No complaint ID' },
      { name: 'Create Summary', success: false, error: 'No complaint ID' }
    );
    results.failed += 4;
  }

  // Test 8: Get users
  console.log(`\n${colors.yellow}--- Test 8: Get Users ---${colors.reset}`);
  const test8 = await testEndpoint('Get Users', `${LAMBDA_URL}/users?limit=5`);
  results.tests.push({ name: 'Get Users', ...test8 });
  test8.success ? results.passed++ : results.failed++;

  // Test 9: Get messages table
  console.log(`\n${colors.yellow}--- Test 9: Get Messages Table ---${colors.reset}`);
  const test9 = await testEndpoint('Get Messages Table', `${LAMBDA_URL}/table/messages?limit=5`);
  results.tests.push({ name: 'Get Messages Table', ...test9 });
  test9.success ? results.passed++ : results.failed++;

  // Test 10: Get summaries table
  console.log(`\n${colors.yellow}--- Test 10: Get Summaries Table ---${colors.reset}`);
  const test10 = await testEndpoint('Get Summaries Table', `${LAMBDA_URL}/table/summaries?limit=5`);
  results.tests.push({ name: 'Get Summaries Table', ...test10 });
  test10.success ? results.passed++ : results.failed++;

  // Print summary
  console.log(`\n${colors.blue}=====================================`);
  console.log('Test Results Summary');
  console.log(`=====================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Total: ${results.passed + results.failed}`);

  console.log(`\n${colors.blue}Detailed Results:${colors.reset}`);
  results.tests.forEach((test, index) => {
    const icon = test.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${index + 1}. ${icon} ${test.name}`);
  });

  // Return exit code
  if (results.failed === 0) {
    console.log(`\n${colors.green}All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}Some tests failed.${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
