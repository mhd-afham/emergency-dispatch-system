const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  console.log('🔧 Testing Authentication System');
  console.log('================================\n');

  try {
    // Test 1: Try to register a test user
    console.log('1. Testing user registration...');
    const registerData = {
      personal: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1234567890'
      },
      auth: {
        password: 'password123',
        role: 'Call Taker',
        employeeId: 'CT001'
      }
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
      console.log('✅ User registration successful!');
      console.log('User ID:', registerResponse.data.user.id);
      console.log('Token received:', registerResponse.data.token ? 'Yes' : 'No');
    } catch (regError) {
      if (regError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ User already exists, proceeding with login test...');
      } else {
        console.log('❌ Registration failed:', regError.response?.data?.message || regError.message);
        console.log('Full error details:', JSON.stringify(regError.response?.data || regError.message, null, 2));
        return;
      }
    }

    console.log('\n2. Testing user login...');
    const loginData = {
      login: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
    console.log('Role:', loginResponse.data.user.role);
    console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');

    console.log('\n3. Testing protected route access...');
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Protected route access successful!');
    console.log('Profile email:', profileResponse.data.user.personal.email);

    console.log('\n🎯 Authentication system is working correctly!');
    console.log('You can now use these credentials to login:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAuth();