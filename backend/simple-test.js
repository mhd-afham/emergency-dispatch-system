const axios = require('axios');

async function simpleTest() {
  try {
    console.log('Testing basic server connectivity...');
    const response = await axios.get('http://localhost:5000');
    console.log('✅ Server responded:', response.data);
  } catch (error) {
    console.log('❌ Server test failed:');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
  }

  try {
    console.log('\nTesting auth endpoint...');
    const authData = {
      personal: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test2@example.com'
      },
      auth: {
        password: 'password123',
        role: 'Call Taker'
      }
    };
    
    const response = await axios.post('http://localhost:5000/api/auth/register', authData);
    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
  }
}

simpleTest();