/**
 * Test script for Report API
 * Run this to test if the report generation endpoint works
 * 
 * Usage: node test-report-api.js YOUR_JWT_TOKEN
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const token = process.argv[2];

if (!token) {
  console.error('❌ Please provide JWT token as argument');
  console.log('Usage: node test-report-api.js YOUR_JWT_TOKEN');
  process.exit(1);
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

async function testReportGeneration() {
  console.log('🧪 Testing Report Generation API...\n');

  // Test 1: Get Summary
  console.log('📊 Test 1: Get Report Summary');
  try {
    const summaryResponse = await apiClient.get('/reports/summary');
    console.log('✅ Summary Response:', JSON.stringify(summaryResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Summary Error:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 2: Generate Monthly Report (Both sections, Both status)
  console.log('📊 Test 2: Generate Monthly Report (Default)');
  try {
    const reportPayload = {
      timePeriod: 'month',
      sections: ['vehicle', 'crew'],
      status: ['approved', 'rejected']
    };
    
    console.log('Payload:', JSON.stringify(reportPayload, null, 2));
    
    const reportResponse = await apiClient.post('/reports/generate', reportPayload);
    console.log('✅ Report Generated!');
    console.log('Vehicle Count:', reportResponse.data.data?.data?.vehicleCount || 0);
    console.log('Crew Count:', reportResponse.data.data?.data?.crewCount || 0);
  } catch (error) {
    console.error('❌ Report Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }

  console.log('\n---\n');

  // Test 3: Generate Vehicle Only Report
  console.log('📊 Test 3: Generate Vehicle Only Report');
  try {
    const reportPayload = {
      timePeriod: 'week',
      sections: ['vehicle'],
      status: ['approved']
    };
    
    console.log('Payload:', JSON.stringify(reportPayload, null, 2));
    
    const reportResponse = await apiClient.post('/reports/generate', reportPayload);
    console.log('✅ Report Generated!');
    console.log('Vehicle Count:', reportResponse.data.data?.data?.vehicleCount || 0);
  } catch (error) {
    console.error('❌ Report Error:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 4: Generate Custom Date Range Report
  console.log('📊 Test 4: Generate Custom Date Range Report');
  try {
    const reportPayload = {
      timePeriod: 'custom',
      customStartDate: '2024-01-01',
      customEndDate: '2024-12-31',
      sections: ['vehicle', 'crew'],
      status: ['approved', 'rejected', 'pending']
    };
    
    console.log('Payload:', JSON.stringify(reportPayload, null, 2));
    
    const reportResponse = await apiClient.post('/reports/generate', reportPayload);
    console.log('✅ Report Generated!');
    console.log('Vehicle Count:', reportResponse.data.data?.data?.vehicleCount || 0);
    console.log('Crew Count:', reportResponse.data.data?.data?.crewCount || 0);
  } catch (error) {
    console.error('❌ Report Error:', error.response?.data || error.message);
  }

  console.log('\n✅ All tests completed!');
}

testReportGeneration();
