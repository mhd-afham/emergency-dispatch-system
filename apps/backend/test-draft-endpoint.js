/**
 * Test Draft Endpoint
 * 
 * This script tests the /api/drafts endpoint directly
 * Run with: node test-draft-endpoint.js
 */

const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:5000/api';
const TEST_USER = {
  login: 'admin@respondr.lk',
  password: 'AdminPass123!'
};

async function testDraftEndpoint() {
  console.log('🧪 Testing Draft Endpoint\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('   User:', loginData.user.personal.firstName, loginData.user.personal.lastName);
    console.log('   Role:', loginData.user.auth.role);

    // Step 2: Test Draft Save
    console.log('\n📝 Step 2: Saving draft...');
    const draftData = {
      registrationType: 'crew',
      draftTitle: 'Test Crew Draft - ' + new Date().toLocaleString(),
      formData: {
        personal: {
          firstName: 'John',
          lastName: 'Test',
          employeeId: 'EMP123456',
          email: 'john.test@example.com',
          phone: '+94771234567'
        },
        professional: {
          role: 'Paramedic',
          certificationLevel: 'Advanced',
          hireDate: new Date().toISOString(),
          certifications: [],
          specializations: []
        },
        emergencyContact: {
          name: 'Jane Test',
          relationship: 'Spouse',
          phone: '+94771234568',
          email: 'jane.test@example.com'
        }
      },
      currentStep: 1
    };

    console.log('   Draft data:', JSON.stringify(draftData, null, 2));

    const draftResponse = await fetch(`${API_URL}/drafts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(draftData),
    });

    console.log('\n   Response status:', draftResponse.status);
    console.log('   Response headers:', Object.fromEntries(draftResponse.headers.entries()));

    const responseText = await draftResponse.text();
    console.log('   Response body (raw):', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('   Response body (parsed):', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.error('   ❌ Response is not valid JSON');
    }

    if (draftResponse.ok) {
      console.log('\n✅ Draft saved successfully!');
      console.log('   Draft ID:', responseData.data.draft._id);
      console.log('   Draft title:', responseData.data.draft.draftTitle);
    } else {
      console.log('\n❌ Draft save failed!');
      console.log('   Status:', draftResponse.status);
      console.log('   Message:', responseData ? responseData.message : 'Unknown error');
    }

    // Step 3: Fetch drafts
    console.log('\n📝 Step 3: Fetching drafts...');
    const fetchResponse = await fetch(`${API_URL}/drafts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (fetchResponse.ok) {
      const fetchData = await fetchResponse.json();
      console.log('✅ Fetched', fetchData.count, 'drafts');
      if (fetchData.data.drafts.length > 0) {
        console.log('   Latest draft:', fetchData.data.drafts[0].draftTitle);
      }
    } else {
      console.log('❌ Failed to fetch drafts');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test complete\n');
}

// Run the test
testDraftEndpoint();
