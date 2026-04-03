// Test script for Cloudinary signed upload
// Run with: node test-upload-signature.js

const axios = require('axios');

const API_BASE = 'https://profconnect-43u9.onrender.com/api';

// Replace with a valid JWT token from your login
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testSignatureEndpoint() {
  console.log('🧪 Testing /api/upload/signature endpoint...\n');

  try {
    const response = await axios.post(
      `${API_BASE}/upload/signature`,
      {},
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );

    console.log('✅ SUCCESS! Signature endpoint working.\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📋 Signature Details:');
    console.log('  - Cloud Name:', response.data.cloud_name);
    console.log('  - API Key:', response.data.api_key);
    console.log('  - Folder:', response.data.folder);
    console.log('  - Timestamp:', response.data.timestamp);
    console.log('  - Signature:', response.data.signature.substring(0, 20) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

async function testOldEndpoint() {
  console.log('\n🧪 Testing old /api/upload/media endpoint (should 404)...\n');

  try {
    const response = await axios.post(
      `${API_BASE}/upload/media`,
      {},
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );

    console.log('⚠️  Old endpoint still exists! This should not happen.');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ SUCCESS! Old endpoint correctly returns 404.\n');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Cloudinary Signed Upload - Endpoint Test');
  console.log('═══════════════════════════════════════════════════════\n');

  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Please update JWT_TOKEN in this script first!');
    console.log('   1. Login to the app');
    console.log('   2. Open browser DevTools > Application > Local Storage');
    console.log('   3. Copy the value of "profconnect_access_token"');
    console.log('   4. Replace JWT_TOKEN in this script\n');
    return;
  }

  const test1 = await testSignatureEndpoint();
  const test2 = await testOldEndpoint();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test Results');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Signature endpoint: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Old endpoint 404:   ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (!test1 || !test2) {
    process.exit(1);
  }
}

runTests();
