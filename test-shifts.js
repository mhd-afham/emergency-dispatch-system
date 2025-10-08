// Test script to debug shift fetching error
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testShiftsFetching() {
  try {
    console.log('Testing shift fetching...');
    
    // First, try to fetch shifts without authentication
    console.log('\n1. Testing without authentication:');
    try {
      const response = await axios.get(`${BASE_URL}/api/shifts`);
      console.log('Success (unexpected):', response.data);
    } catch (error) {
      console.log('Expected error:', error.response?.data || error.message);
    }
    
    // Try to register a test user first
    console.log('\n2. Trying to register a test supervisor:');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'test.supervisor@emergency.gov',
        username: 'testsupervisor',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'Supervisor',
        phone: '+94771234999',
        role: 'Supervisor'
      });
      console.log('Registration success:', registerResponse.data);
    } catch (error) {
      console.log('Registration error:', error.response?.data || error.message);
    }
    
    // Try to login with existing supervisor
    console.log('\n3. Trying to login with existing supervisor:');
    let token = null;
    const credentials = [
      { login: 'supervisor@respondr.lk', password: 'password123' },
      { login: 'supervisor@respondr.lk', password: 'Password123!' },
      { login: 'testsupervisor@emergency.gov', password: 'password123' }
    ];
    
    for (const cred of credentials) {
      try {
        console.log(`Trying ${cred.login}...`);
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, cred);
        console.log('Login success:', loginResponse.data);
        token = loginResponse.data.token;
        break;
      } catch (error) {
        console.log(`Login failed for ${cred.login}:`, error.response?.data?.message || error.message);
      }
    }
    
    // Try fetching shifts with authentication
    if (token) {
      console.log('\n4. Testing with authentication:');
      try {
        const response = await axios.get(`${BASE_URL}/api/shifts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Shifts fetch success:', response.data);
      } catch (error) {
        console.log('Shifts fetch error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testShiftsFetching();