/**
 * Simple Vehicle WebSocket Test
 * Tests vehicle location and status updates via direct database changes
 * This bypasses API authentication to focus on WebSocket functionality
 */

const mongoose = require("mongoose");
require("dotenv").config();
const Vehicle = require("../models/Vehicle");

async function testVehicleWebSocket() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // Get first vehicle for testing
    const vehicle = await Vehicle.findOne();
    if (!vehicle) {
      console.log("❌ No vehicles found in database");
      return;
    }

    console.log(
      `\n🚗 Testing with vehicle: ${vehicle.registration.plateNumber}`
    );
    console.log(
      "📱 Open DispatchWorkspace in browser and watch for real-time updates"
    );
    console.log("⏱️  Will make 3 updates with 5-second intervals...\n");

    // Test 1: Status Update
    console.log("📊 Test 1: Updating vehicle status...");
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      "status.currentStatus": "en_route",
    });
    console.log("✅ Status changed to: en_route");
    await sleep(5000);

    // Test 2: Location Update
    console.log("\n📍 Test 2: Updating vehicle location...");
    const newCoords = [79.85, 6.92]; // Slightly different Colombo coordinates
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      "status.currentLocation": {
        type: "Point",
        coordinates: newCoords,
      },
      "status.lastLocationUpdate": new Date().toISOString(),
    });
    console.log(`✅ Location updated to: [${newCoords[0]}, ${newCoords[1]}]`);
    await sleep(5000);

    // Test 3: Status + Location Update
    console.log("\n🔄 Test 3: Updating both status and location...");
    const finalCoords = [79.8612, 6.9271]; // Back to original Colombo center
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      "status.currentStatus": "on_scene",
      "status.currentLocation": {
        type: "Point",
        coordinates: finalCoords,
      },
      "status.lastLocationUpdate": new Date().toISOString(),
    });
    console.log("✅ Status changed to: on_scene");
    console.log(
      `✅ Location updated to: [${finalCoords[0]}, ${finalCoords[1]}]`
    );

    console.log("\n🎉 WebSocket test completed!");
    console.log(
      "📱 Check DispatchWorkspace - vehicle should have updated in real-time"
    );

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Test failed:", error);
    mongoose.connection.close();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the test
if (require.main === module) {
  console.log("🧪 Simple Vehicle WebSocket Test");
  console.log("================================");
  testVehicleWebSocket();
}

module.exports = testVehicleWebSocket;
