// Test Authentication System
const axios = require("axios");

const baseURL = "http://localhost:5000/api";

async function testAuth() {
  console.log("🧪 Testing Emergency Dispatch Authentication System\n");

  try {
    // Test 1: Server Health Check
    console.log("1️⃣  Testing server health...");
    const health = await axios.get("http://localhost:5000/");
    console.log("✅ Server is running:", health.data.message);
    console.log("");

    // Test 2: User Registration
    console.log("2️⃣  Testing user registration...");
    const registerData = {
      email: "test@example.com",
      username: "testuser",
      password: "password123",
      confirmPassword: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "1234567890",
    };

    const registerResponse = await axios.post(
      `${baseURL}/auth/register`,
      registerData
    );
    console.log("✅ User registration successful!");
    console.log("User ID:", registerResponse.data.user.id);
    console.log("Role:", registerResponse.data.user.role);
    console.log("Token received:", registerResponse.data.token ? "Yes" : "No");
    console.log("");

    const userToken = registerResponse.data.token;

    // Test 3: User Login
    console.log("3️⃣  Testing user login...");
    const loginData = {
      login: "test@example.com",
      password: "password123",
    };

    const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
    console.log("✅ User login successful!");
    console.log("Last Login:", loginResponse.data.user.lastLogin);
    console.log("");

    // Test 4: Get User Profile (Protected Route)
    console.log("4️⃣  Testing protected route access...");
    const profileResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });
    console.log("✅ Protected route access successful!");
    console.log(
      "Profile:",
      `${profileResponse.data.user.firstName} ${profileResponse.data.user.lastName}`
    );
    console.log("");

    // Test 5: Unauthorized Access
    console.log("5️⃣  Testing unauthorized access...");
    try {
      await axios.get(`${baseURL}/auth/me`);
    } catch (error) {
      console.log(
        "✅ Unauthorized access properly blocked:",
        error.response.data.message
      );
    }
    console.log("");

    // Test 6: Update Profile
    console.log("6️⃣  Testing profile update...");
    const updateData = {
      firstName: "Updated",
      lastName: "Name",
      phone: "9876543210",
    };

    const updateResponse = await axios.put(
      `${baseURL}/auth/profile`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    console.log("✅ Profile update successful!");
    console.log(
      "Updated name:",
      `${updateResponse.data.user.firstName} ${updateResponse.data.user.lastName}`
    );
    console.log("");

    // Test 7: Logout
    console.log("7️⃣  Testing logout...");
    const logoutResponse = await axios.post(`${baseURL}/auth/logout`);
    console.log("✅ Logout successful:", logoutResponse.data.message);
    console.log("");

    console.log("🎉 All authentication tests passed!");
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.error("Response data:", error.response.data);
    }
  }
}

// Run tests
testAuth();
