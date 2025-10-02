/**
 * Continuous Vehicle Update Simulator
 * Simulates realistic vehicle movement and status changes for multi-window testing
 * Run this while having multiple DispatchWorkspace windows open to test synchronization
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

class ContinuousVehicleSimulator {
  constructor() {
    this.authToken = null;
    this.vehicles = [];
    this.isRunning = false;
    this.updateCount = 0;
  }

  async initialize() {
    try {
      // Connect to database
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ Connected to MongoDB Atlas");

      // Get auth token
      const dispatcher = await User.findOne({ "auth.role": "Dispatcher" });
      if (!dispatcher) throw new Error("No dispatcher found");

      this.authToken = jwt.sign(
        { id: dispatcher._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Get 3 test vehicles
      this.vehicles = await Vehicle.find({}).limit(3);

      console.log(`🚗 Loaded ${this.vehicles.length} vehicles for simulation:`);
      this.vehicles.forEach((v) => {
        console.log(
          `  - ${v.registration.plateNumber} (${v.registration.vehicleType})`
        );
      });

      return true;
    } catch (error) {
      console.error("❌ Initialization failed:", error.message);
      return false;
    }
  }

  async updateVehicle(vehicle, updateType) {
    try {
      const baseUrl = "http://localhost:5000/api/vehicles";

      if (updateType === "status") {
        const statuses = [
          "available",
          "assigned",
          "en_route",
          "on_scene",
          "returning",
        ];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

        const response = await fetch(`${baseUrl}/${vehicle._id}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            currentStatus: newStatus,
            operational: "active",
          }),
        });

        if (response.ok) {
          console.log(
            `📊 ${vehicle.registration.plateNumber}: Status → ${newStatus}`
          );
        }
      } else if (updateType === "location") {
        // Generate random movement within Colombo area
        const baseCoords = vehicle.status.currentLocation.coordinates;
        const newLng = baseCoords[0] + (Math.random() - 0.5) * 0.02;
        const newLat = baseCoords[1] + (Math.random() - 0.5) * 0.02;

        const response = await fetch(`${baseUrl}/${vehicle._id}/location`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ coordinates: [newLng, newLat] }),
        });

        if (response.ok) {
          console.log(
            `📍 ${
              vehicle.registration.plateNumber
            }: Location → [${newLng.toFixed(4)}, ${newLat.toFixed(4)}]`
          );
          // Update local cache
          vehicle.status.currentLocation.coordinates = [newLng, newLat];
        }
      }
    } catch (error) {
      console.log(
        `❌ Update failed for ${vehicle.registration.plateNumber}: ${error.message}`
      );
    }
  }

  async startSimulation() {
    if (!this.vehicles.length) {
      console.log("❌ No vehicles available for simulation");
      return;
    }

    this.isRunning = true;
    console.log("\n🚀 Starting continuous vehicle simulation...");
    console.log(
      "📱 OPEN MULTIPLE BROWSER WINDOWS with DispatchWorkspace to test synchronization"
    );
    console.log("⏱️  Updates every 4 seconds - Press Ctrl+C to stop\n");

    const simulationInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(simulationInterval);
        return;
      }

      this.updateCount++;
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n🔄 Update Round ${this.updateCount} - ${timestamp}`);

      // Update each vehicle randomly
      const updatePromises = this.vehicles.map(async (vehicle) => {
        const updateType = Math.random() > 0.5 ? "location" : "status";
        await this.updateVehicle(vehicle, updateType);
      });

      await Promise.all(updatePromises);

      // Show periodic instruction
      if (this.updateCount % 5 === 0) {
        console.log(
          "\n📱 TIP: Open multiple browser tabs/windows to see real-time synchronization"
        );
      }
    }, 4000); // Every 4 seconds

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n\n⏹️  Stopping vehicle simulation...");
      this.isRunning = false;
      clearInterval(simulationInterval);
      console.log(`📊 Total updates completed: ${this.updateCount}`);
      console.log("👋 Simulation stopped - Database connection closing...");
      mongoose.connection.close();
      process.exit(0);
    });
  }
}

// Main execution
async function runSimulation() {
  console.log("🎭 Continuous Vehicle Update Simulator");
  console.log("=====================================");
  console.log("🎯 Purpose: Test multi-window real-time synchronization");
  console.log("📱 Instructions:");
  console.log("   1. Start this simulator");
  console.log("   2. Open multiple browser windows/tabs");
  console.log("   3. Navigate to DispatchWorkspace in each");
  console.log("   4. Watch vehicles update simultaneously\n");

  // Check server status
  try {
    await fetch("http://localhost:5000/api/auth/verify");
  } catch {
    console.log("❌ Backend server is not running!");
    console.log("🚀 Start it first: cd apps/backend && npm run dev");
    process.exit(1);
  }

  const simulator = new ContinuousVehicleSimulator();
  if (await simulator.initialize()) {
    await simulator.startSimulation();
  }
}

if (require.main === module) {
  runSimulation();
}

module.exports = ContinuousVehicleSimulator;
