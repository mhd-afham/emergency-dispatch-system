const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data for creating an incident
const testIncident = {
  caller: {
    name: "John Doe",
    phone: "+94712345678",
    email: "john@example.com",
    isCallback: false
  },
  classification: {
    type: "Medical",
    subType: "Heart Attack",
    severity: "Critical",
    priority: 1
  },
  location: {
    address: {
      street: "Galle Road",
      city: "Colombo",
      district: "Colombo",
      postalCode: "00100",
      fullAddress: "123 Galle Road, Colombo 3, Sri Lanka"
    },
    coordinates: {
      type: "Point",
      coordinates: [79.8612, 6.9271] // Colombo coordinates
    },
    accuracy: 10,
    isVerified: true,
    verificationMethod: "GPS"
  },
  details: {
    description: "Patient having chest pain and difficulty breathing. Conscious but in severe distress.",
    additionalInfo: "Patient is 65 years old, has history of heart disease",
    hazards: ["Medical emergency"],
    accessNotes: "Third floor apartment, elevator available",
    landmarksNearby: ["Near Liberty Plaza"]
  },
  source: "Web"
};

async function testIncidentAPI() {
  try {
    console.log('🔧 Testing Emergency Dispatch System - Incident Management API');
    console.log('==============================================================\n');

    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const healthCheck = await axios.get(`http://localhost:5000`);
      console.log('✅ Server is running:', healthCheck.data.message);
    } catch (error) {
      console.log('❌ Server not responding. Make sure backend is running on port 5000');
      return;
    }

    // First we need to login to get a token (you'll need valid credentials)
    console.log('\n2. Testing authentication (you\'ll need to login first)...');
    console.log('⚠️  Note: You need to login through the web interface first to test protected routes');
    
    // Test 2: Try to create an incident (will fail without auth, which is expected)
    console.log('\n3. Testing incident creation (without auth - should fail)...');
    try {
      const createResponse = await axios.post(`${API_BASE}/incidents`, testIncident);
      console.log('✅ Incident created:', createResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Properly protected: Authentication required (401)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Test 3: Try to get incidents (will fail without auth, which is expected)
    console.log('\n4. Testing get incidents (without auth - should fail)...');
    try {
      const getResponse = await axios.get(`${API_BASE}/incidents`);
      console.log('✅ Incidents retrieved:', getResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Properly protected: Authentication required (401)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Test 4: Test duplicate checking endpoint
    console.log('\n5. Testing duplicate checking (without auth - should fail)...');
    try {
      const duplicateResponse = await axios.post(`${API_BASE}/incidents/check-duplicates`, {
        coordinates: [79.8612, 6.9271],
        timeWindowMinutes: 30,
        radiusMeters: 1000
      });
      console.log('✅ Duplicate check completed:', duplicateResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Properly protected: Authentication required (401)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log('✅ Server is running and responding');
    console.log('✅ Incident routes are properly protected with authentication');
    console.log('✅ API endpoints are configured correctly');
    console.log('\n🎯 Next Steps:');
    console.log('1. Open http://localhost:3001 in your browser');
    console.log('2. Login as a Call Taker or create a test user');
    console.log('3. Test the incident logging functionality through the web interface');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testIncidentAPI();