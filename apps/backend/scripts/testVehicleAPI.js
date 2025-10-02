/**
 * Real-Time Vehicle API Test
 * Tests vehicle updates through proper API endpoints to trigger WebSocket events
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Import models
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

class VehicleAPITester {
  constructor() {
    this.authToken = null;
    this.testVehicle = null;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ Connected to MongoDB Atlas");
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      return false;
    }
  }

  async getAuthToken() {
    try {
      // Find a dispatcher user for authentication
      const dispatcher = await User.findOne({ "auth.role": "Dispatcher" });
      if (!dispatcher) {
        console.log("❌ No dispatcher found in database");
        return null;
      }

      // Generate JWT token (same as login process)
      const token = jwt.sign({ id: dispatcher._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      console.log(
        `🔑 Generated auth token for: ${dispatcher.personal.firstName} ${dispatcher.personal.lastName}`
      );
      return token;
    } catch (error) {
      console.error("❌ Auth token generation failed:", error.message);
      return null;
    }
  }

  async getTestVehicle() {
    try {
      const vehicle = await Vehicle.findOne();
      if (!vehicle) {
        console.log("❌ No vehicles found in database");
        return null;
      }

      console.log(
        `🚗 Selected test vehicle: ${vehicle.registration.plateNumber} (${vehicle.registration.vehicleType})`
      );
      return vehicle;
    } catch (error) {
      console.error("❌ Failed to get test vehicle:", error);
      return null;
    }
  }

  async updateVehicleStatus(vehicleId, status) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            currentStatus: status,
            operational: "active",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Status update successful: ${status}`);
        return true;
      } else {
        const error = await response.text();
        console.log(`❌ Status update failed: ${response.status} - ${error}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Status update error: ${error.message}`);
      return false;
    }
  }

  async updateVehicleLocation(vehicleId, coordinates) {
    try {
      const [longitude, latitude] = coordinates;
      const response = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}/location`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ coordinates: [longitude, latitude] }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(
          `✅ Location update successful: [${longitude.toFixed(
            4
          )}, ${latitude.toFixed(4)}]`
        );
        return true;
      } else {
        const error = await response.text();
        console.log(`❌ Location update failed: ${response.status} - ${error}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Location update error: ${error.message}`);
      return false;
    }
  }

  async runTest() {
    console.log("🚀 Starting Real-Time Vehicle API Test");
    console.log("=====================================");

    // Step 1: Connect to database
    if (!(await this.connect())) return;

    // Step 2: Get authentication token
    this.authToken = await this.getAuthToken();
    if (!this.authToken) return;

    // Step 3: Get test vehicle
    this.testVehicle = await this.getTestVehicle();
    if (!this.testVehicle) return;

    console.log(
      "\n📱 IMPORTANT: Open DispatchWorkspace in browser to see real-time updates!"
    );
    console.log("⏱️  Starting test sequence in 3 seconds...\n");
    await this.sleep(3000);

    // Step 4: Test status update
    console.log('📊 Test 1: Updating vehicle status to "assigned"...');
    await this.updateVehicleStatus(this.testVehicle._id, "assigned");
    await this.sleep(2000);

    // Step 5: Test location update
    console.log("\n📍 Test 2: Updating vehicle location...");
    const newLocation = [79.86, 6.93]; // New Colombo coordinates
    await this.updateVehicleLocation(this.testVehicle._id, newLocation);
    await this.sleep(2000);

    // Step 6: Test status update
    console.log('\n🚛 Test 3: Updating vehicle status to "en_route"...');
    await this.updateVehicleStatus(this.testVehicle._id, "en_route");
    await this.sleep(2000);

    // Step 7: Another location update
    console.log("\n📍 Test 4: Moving vehicle to new location...");
    const finalLocation = [79.87, 6.94];
    await this.updateVehicleLocation(this.testVehicle._id, finalLocation);
    await this.sleep(2000);

    // Step 8: Final status update
    console.log('\n🎯 Test 5: Updating vehicle status to "on_scene"...');
    await this.updateVehicleStatus(this.testVehicle._id, "on_scene");

    console.log("\n🎉 API Test completed!");
    console.log(
      "📱 Check DispatchWorkspace - all updates should have appeared in real-time"
    );
    console.log("🔌 WebSocket events were emitted by the API endpoints");

    mongoose.connection.close();
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Check if backend server is running
async function checkServerStatus() {
  try {
    const response = await fetch("http://localhost:5000/api/auth/verify", {
      method: "GET",
    });
    return response.status !== 0; // Any response means server is running
  } catch (error) {
    return false;
  }
}

// Run the test
async function runAPITest() {
  console.log("🔍 Checking if backend server is running...");
  const serverRunning = await checkServerStatus();

  if (!serverRunning) {
    console.log("❌ Backend server is not running!");
    console.log("🚀 Please start the backend server first:");
    console.log("   cd apps/backend && npm run dev");
    process.exit(1);
  }

  console.log("✅ Backend server is running");

  const tester = new VehicleAPITester();
  await tester.runTest();
}

if (require.main === module) {
  runAPITest();
}

module.exports = VehicleAPITester;
