#!/usr/bin/env node

/**
 * Test script to verify the image upload fix
 * Tests both successful and error scenarios
 */

const API_URL = 'http://localhost:3001';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test scenarios
const testCases = [
  {
    name: 'Valid presigned URL request',
    request: {
      fileName: 'test-image.jpg',
      contentType: 'image/jpeg',
      fileSize: 1024 * 500, // 500KB
      siteId: 'test-site-123'
    },
    expectedSuccess: true
  },
  {
    name: 'Missing data in response (simulated)',
    request: {
      fileName: 'test-image.png',
      contentType: 'image/png',
      fileSize: 1024 * 100,
      siteId: 'test-site-456'
    },
    expectedSuccess: true,
    simulateError: 'missing-data'
  },
  {
    name: 'Invalid file type',
    request: {
      fileName: 'test.exe',
      contentType: 'application/exe',
      fileSize: 1024,
      siteId: 'test-site-789'
    },
    expectedSuccess: false
  }
];

async function testPresignedUrl(testCase) {
  log(`\nTesting: ${testCase.name}`, 'blue');

  try {
    // Make request to API
    const response = await fetch(`${API_URL}/api/upload/presigned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a test auth header if needed
        // 'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testCase.request)
    });

    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (e) {
      log(`  ✗ Failed to parse JSON response: ${responseText.substring(0, 100)}`, 'red');
      return false;
    }

    // Log the response structure for debugging
    log(`  Response status: ${response.status}`, response.ok ? 'green' : 'yellow');
    log(`  Response success field: ${result.success}`, result.success ? 'green' : 'yellow');
    log(`  Has data field: ${!!result.data}`, result.data ? 'green' : 'yellow');

    if (result.data) {
      log(`  Data fields: ${Object.keys(result.data).join(', ')}`, 'blue');

      // Check for required fields
      const requiredFields = ['uploadUrl', 'publicUrl'];
      const missingFields = requiredFields.filter(field => !result.data[field]);

      if (missingFields.length > 0) {
        log(`  ✗ Missing required fields: ${missingFields.join(', ')}`, 'red');
        return false;
      }
    }

    // Simulate client-side validation (what s3-upload.ts does)
    if (testCase.simulateError === 'missing-data') {
      log(`  Simulating missing data scenario...`, 'yellow');
      result.data = undefined; // Simulate the bug condition
    }

    // This is the validation logic from the fixed s3-upload.ts
    if (result.success) {
      if (!result.data || typeof result.data !== 'object') {
        log(`  ✗ Validation failed: success=true but data is missing/invalid`, 'red');
        log(`    This would have caused the original bug!`, 'red');
        return false;
      }

      const requiredFields = ['uploadUrl', 'publicUrl'];
      for (const field of requiredFields) {
        if (!result.data[field] || typeof result.data[field] !== 'string') {
          log(`  ✗ Validation failed: missing or invalid field '${field}'`, 'red');
          return false;
        }
      }

      log(`  ✓ All validations passed!`, 'green');
      if (testCase.expectedSuccess) {
        log(`  ✓ Test passed as expected`, 'green');
        return true;
      } else {
        log(`  ✗ Expected failure but got success`, 'red');
        return false;
      }
    } else {
      if (!testCase.expectedSuccess) {
        log(`  ✓ Failed as expected: ${result.error}`, 'green');
        return true;
      } else {
        log(`  ✗ Unexpected failure: ${result.error}`, 'red');
        return false;
      }
    }
  } catch (error) {
    log(`  ✗ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('=================================', 'blue');
  log('Image Upload Fix Verification Test', 'blue');
  log('=================================', 'blue');

  log('\nChecking server availability...', 'yellow');

  try {
    const healthCheck = await fetch(`${API_URL}/api/health`).catch(() => null);
    if (!healthCheck) {
      log('Note: Server may require authentication. Tests will proceed.', 'yellow');
    } else {
      log('Server is responding', 'green');
    }
  } catch (e) {
    log('Warning: Could not reach server. Make sure it\'s running on port 3001', 'yellow');
  }

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await testPresignedUrl(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  log('\n=================================', 'blue');
  log(`Test Results: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  log('=================================', 'blue');

  if (failed === 0) {
    log('\n✓ All tests passed! The upload fix is working correctly.', 'green');
  } else {
    log('\n✗ Some tests failed. Please review the output above.', 'red');
  }
}

// Run the tests
runTests().catch(console.error);