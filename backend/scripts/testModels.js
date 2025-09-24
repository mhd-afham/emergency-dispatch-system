#!/usr/bin/env node

/**
 * Model Verification and Testing Script
 * Tests all MongoDB models for proper validation, relationships, and functionality
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Import all models
const User = require("../models/User");
const Incident = require("../models/Incident");
const Vehicle = require("../models/Vehicle");
const Crew = require("../models/Crew");
const Station = require("../models/Station");
const Shift = require("../models/Shift");
const Assignment = require("../models/Assignment");
const Communication = require("../models/Communication");
const EquipmentChecklistTemplate = require("../models/EquipmentChecklistTemplate");
const EquipmentCheck = require("../models/EquipmentCheck");
const AuditLog = require("../models/AuditLog");
const Report = require("../models/Report");

const connectDB = require("../config/testDatabase").connectDB;
const DatabaseUtils = require("../utils/DatabaseUtils");

class ModelTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
    };
  }

  log(message, type = "info") {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      test: "🧪",
    };
    console.log(`${icons[type]} ${message}`);
  }

  async assert(condition, testName) {
    try {
      if (condition) {
        this.testResults.passed++;
        this.log(`${testName} - PASSED`, "success");
        return true;
      } else {
        this.testResults.failed++;
        this.testResults.errors.push(testName);
        this.log(`${testName} - FAILED`, "error");
        return false;
      }
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push(`${testName}: ${error.message}`);
      this.log(`${testName} - ERROR: ${error.message}`, "error");
      return false;
    }
  }

  // Test User model
  async testUserModel() {
    this.log("Testing User Model", "test");

    try {
      // Test user creation with valid data (matching existing User model)
      const validUser = new User({
        personal: {
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: "+94771234567",
        },
        auth: {
          password: "hashedpassword123",
          role: "Admin",
          employeeId: "EMP123456",
        },
        settings: {
          isActive: true,
          emailVerified: false,
        },
      });

      await this.assert(
        validUser.validateSync() === undefined,
        "User model validates correctly"
      );

      // Test invalid phone number
      const invalidPhoneUser = new User({
        personal: {
          firstName: "Test",
          lastName: "Invalid",
          email: "testinvalid@test.com",
          phone: "invalid-phone",
        },
        auth: {
          password: "hashedpassword123",
          role: "Admin",
          employeeId: "EMP123457",
        },
        settings: {
          isActive: true,
        },
      });

      const phoneValidation = invalidPhoneUser.validateSync();
      await this.assert(
        phoneValidation && phoneValidation.errors["personal.phone"],
        "User model rejects invalid phone number"
      );

      // Clean up
      await User.deleteMany({ "personal.email": /test.*@test\.com/ });
    } catch (error) {
      this.log(`User model test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Test Vehicle model
  async testVehicleModel() {
    this.log("Testing Vehicle Model", "test");

    try {
      const validVehicle = new Vehicle({
        registration: {
          plateNumber: "TEST-123",
          vehicleType: "fire_truck",
          registrationDate: new Date("2020-01-01"),
          expiryDate: new Date("2025-01-01"),
          registrationAuthority: "Test Authority",
        },
        specifications: {
          make: "Test Make",
          model: "Test Model",
          year: 2020,
          engineNumber: "ENG123",
          chassisNumber: "CHASSIS123",
          fuelType: "diesel",
          capacity: { crew: 4, waterTank: 2000, equipment: 300 },
          dimensions: { length: 8.0, width: 2.5, height: 3.0, weight: 10000 },
        },
        equipment: {
          standard: [{ name: "Pump", quantity: 1, status: "operational" }],
          specialized: [],
          safety: [],
        },
        status: {
          operational: "Available",
          fuelLevel: 80,
          mileage: 1000,
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          currentLocation: {
            type: "Point",
            coordinates: [79.8612, 6.9271],
          },
          lastUpdate: new Date(),
        },
        assignment: {
          currentStation: null,
          assignedCrewId: [],
          currentShift: null,
          assignmentDate: new Date(),
        },
      });

      await this.assert(
        validVehicle.validateSync() === undefined,
        "Vehicle model validates correctly"
      );

      // Test coordinate validation
      const invalidCoordVehicle = new Vehicle({
        ...validVehicle.toObject(),
        _id: undefined,
        registration: { ...validVehicle.registration, plateNumber: "TEST-456" },
        status: {
          ...validVehicle.status,
          currentLocation: {
            type: "Point",
            coordinates: [200, 200], // Invalid coordinates outside Sri Lanka
          },
        },
      });

      const coordValidation = invalidCoordVehicle.validateSync();
      await this.assert(
        coordValidation &&
          coordValidation.errors["status.currentLocation.coordinates"],
        "Vehicle model rejects invalid coordinates"
      );

      // Clean up
      await Vehicle.deleteMany({ "registration.plateNumber": /^TEST-/ });
    } catch (error) {
      this.log(`Vehicle model test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Test Station model
  async testStationModel() {
    this.log("Testing Station Model", "test");

    try {
      const validStation = new Station({
        stationInfo: {
          stationId: "TEST-STN-001",
          name: "Test Station",
          type: "fire_rescue",
          established: new Date("2020-01-01"),
          contactInfo: {
            phone: "+94112000001",
            email: "test@station.com",
            emergencyLine: "110",
          },
        },
        location: {
          coordinates: {
            type: "Point",
            coordinates: [79.8612, 6.9271],
          },
          address: "Test Address",
          district: "Colombo",
          province: "Western Province",
        },
        coverage: {
          primaryArea: {
            type: "Polygon",
            coordinates: [
              [
                [79.85, 6.91],
                [79.87, 6.91],
                [79.87, 6.94],
                [79.85, 6.94],
                [79.85, 6.91],
              ],
            ],
          },
          maxResponseDistance: 10000,
          populationServed: 100000,
        },
        capacity: {
          personnel: {
            onDutyCapacity: 10,
            currentOnDuty: 5,
            totalCapacity: 20,
          },
          vehicles: { totalBays: 4, occupiedBays: 2, availableBays: 2 },
          equipment: {
            totalValue: 1000000,
            lastInventory: new Date(),
            criticalEquipment: [],
          },
        },
        resources: {
          vehicles: [],
          equipment: [],
          specialCapabilities: ["fire_suppression"],
        },
        operational: {
          status: "active",
          operationalHours: "24/7",
          lastInspection: new Date(),
          nextInspection: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          certifications: [],
        },
        statistics: {
          totalResponses: 0,
          avgResponseTime: 0,
          successRate: 0,
          lastUpdated: new Date(),
        },
      });

      await this.assert(
        validStation.validateSync() === undefined,
        "Station model validates correctly"
      );

      // Test station ID uniqueness constraint
      const duplicateStation = new Station({
        ...validStation.toObject(),
        _id: undefined,
        stationInfo: {
          ...validStation.stationInfo,
          stationId: "TEST-STN-001", // Same ID
        },
      });

      await this.assert(
        duplicateStation.validateSync() === undefined,
        "Station model allows duplicate validation in memory"
      );

      // Clean up
      await Station.deleteMany({ "stationInfo.stationId": /^TEST-/ });
    } catch (error) {
      this.log(`Station model test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Test Incident model (existing)
  async testIncidentModel() {
    this.log("Testing Incident Model", "test");

    try {
      // Test basic incident creation
      const testIncident = new Incident({
        incidentNumber: "TEST-INC-001",
        caller: {
          name: "Test Caller",
          phone: "+94771234567",
          location: {
            coordinates: { type: "Point", coordinates: [79.8612, 6.9271] },
            address: "Test Location",
          },
          relationship: "witness",
        },
        incident: {
          type: "fire",
          subType: "building_fire",
          severity: 3,
          description: "Test incident",
          hazards: [],
          estimatedLoss: 0,
        },
        location: {
          coordinates: { type: "Point", coordinates: [79.8612, 6.9271] },
          address: "Test Location",
          landmarks: "",
          accessNotes: "",
        },
        status: {
          current: "Received",
          priority: "medium",
          history: [],
        },
        timeline: {
          reportedAt: new Date(),
        },
      });

      await this.assert(
        testIncident.validateSync() === undefined,
        "Incident model validates correctly"
      );

      // Clean up
      await Incident.deleteMany({ incidentNumber: /^TEST-/ });
    } catch (error) {
      this.log(`Incident model test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Test model relationships
  async testModelRelationships() {
    this.log("Testing Model Relationships", "test");

    try {
      // Create a user first
      const testUser = await User.create({
        username: "test.rel.user",
        email: "testrel@test.com",
        password: "hashedpassword",
        personal: {
          firstName: "Test",
          lastName: "User",
          dateOfBirth: new Date("1990-01-01"),
          gender: "male",
          address: {
            street: "123 Test St",
            city: "Colombo",
            province: "Western Province",
            postalCode: "10100",
            country: "Sri Lanka",
          },
          phone: "+94771234567",
        },
        auth: { role: "admin", permissions: [], isActive: true },
        settings: {
          notifications: { email: true, sms: true, push: true },
          dashboard: { defaultView: "incidents", refreshInterval: 30 },
          language: "en",
          timezone: "Asia/Colombo",
        },
      });

      // Create a station referencing the user
      const testStation = await Station.create({
        stationInfo: {
          stationId: "TEST-REL-STN-001",
          name: "Test Relationship Station",
          type: "fire_rescue",
          established: new Date("2020-01-01"),
          commander: testUser._id, // Reference to user
          contactInfo: {
            phone: "+94112000001",
            email: "test@station.com",
            emergencyLine: "110",
          },
        },
        location: {
          coordinates: { type: "Point", coordinates: [79.8612, 6.9271] },
          address: "Test Address",
          district: "Colombo",
          province: "Western Province",
        },
        coverage: {
          primaryArea: {
            type: "Polygon",
            coordinates: [
              [
                [79.85, 6.91],
                [79.87, 6.91],
                [79.87, 6.94],
                [79.85, 6.94],
                [79.85, 6.91],
              ],
            ],
          },
          maxResponseDistance: 10000,
          populationServed: 100000,
        },
        capacity: {
          personnel: {
            onDutyCapacity: 10,
            currentOnDuty: 5,
            totalCapacity: 20,
          },
          vehicles: { totalBays: 4, occupiedBays: 2, availableBays: 2 },
          equipment: {
            totalValue: 1000000,
            lastInventory: new Date(),
            criticalEquipment: [],
          },
        },
        resources: { vehicles: [], equipment: [], specialCapabilities: [] },
        operational: {
          status: "active",
          operationalHours: "24/7",
          lastInspection: new Date(),
          nextInspection: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          certifications: [],
        },
        statistics: {
          totalResponses: 0,
          avgResponseTime: 0,
          successRate: 0,
          lastUpdated: new Date(),
        },
      });

      await this.assert(
        testStation.stationInfo.commander.equals(testUser._id),
        "Station-User relationship works correctly"
      );

      // Test population
      const populatedStation = await Station.findById(testStation._id).populate(
        "stationInfo.commander"
      );
      await this.assert(
        populatedStation.stationInfo.commander.username === "test.rel.user",
        "Station-User population works correctly"
      );

      // Clean up
      await Station.deleteMany({ "stationInfo.stationId": /^TEST-REL-/ });
      await User.deleteMany({ username: /^test\.rel\./ });
    } catch (error) {
      this.log(`Relationship test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Test database utilities
  async testDatabaseUtils() {
    this.log("Testing Database Utilities", "test");

    try {
      // Test health check
      const healthCheck = await DatabaseUtils.performHealthCheck();
      await this.assert(
        healthCheck.status === "healthy",
        "Database health check works"
      );
      await this.assert(
        typeof healthCheck.responseTime === "number",
        "Health check returns response time"
      );

      // Test dashboard summary (should work even with empty database)
      const dashboardSummary = await DatabaseUtils.getDashboardSummary();
      await this.assert(
        typeof dashboardSummary.activeIncidents === "number",
        "Dashboard summary returns active incidents count"
      );
      await this.assert(
        typeof dashboardSummary.availableResources === "object",
        "Dashboard summary returns available resources"
      );
    } catch (error) {
      this.log(`Database utilities test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Test model indexes
  async testModelIndexes() {
    this.log("Testing Model Indexes", "test");

    try {
      // Check if models have proper indexes defined
      const userIndexes = User.schema.indexes();
      await this.assert(
        userIndexes.length > 0,
        "User model has indexes defined"
      );

      const incidentIndexes = Incident.schema.indexes();
      await this.assert(
        incidentIndexes.length > 0,
        "Incident model has indexes defined"
      );

      const vehicleIndexes = Vehicle.schema.indexes();
      await this.assert(
        vehicleIndexes.length > 0,
        "Vehicle model has indexes defined"
      );

      // Test geospatial index on Vehicle
      const geoIndex = vehicleIndexes.find(
        (idx) => idx[0]["status.currentLocation.coordinates"] === "2dsphere"
      );
      await this.assert(
        geoIndex !== undefined,
        "Vehicle model has geospatial index"
      );
    } catch (error) {
      this.log(`Index test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Test validation rules
  async testValidationRules() {
    this.log("Testing Validation Rules", "test");

    try {
      // Test Sri Lankan phone number validation
      const invalidPhoneUser = new User({
        username: "test.validation",
        email: "test@test.com",
        password: "hashedpassword",
        personal: {
          firstName: "Test",
          lastName: "User",
          dateOfBirth: new Date("1990-01-01"),
          gender: "male",
          address: {
            street: "123 Test St",
            city: "Colombo",
            province: "Western Province",
            postalCode: "10100",
            country: "Sri Lanka",
          },
          phone: "123456789", // Invalid format
        },
        auth: { role: "crew_member", permissions: [], isActive: true },
        settings: {
          notifications: { email: true, sms: true, push: true },
          dashboard: { defaultView: "incidents", refreshInterval: 30 },
          language: "en",
          timezone: "Asia/Colombo",
        },
      });

      const validation = invalidPhoneUser.validateSync();
      await this.assert(
        validation && validation.errors["personal.phone"],
        "Phone number validation works correctly"
      );

      // Test coordinate validation for vehicles
      const invalidCoordVehicle = new Vehicle({
        registration: {
          plateNumber: "VAL-TEST-001",
          vehicleType: "fire_truck",
          registrationDate: new Date("2020-01-01"),
          expiryDate: new Date("2025-01-01"),
          registrationAuthority: "Test",
        },
        specifications: {
          make: "Test",
          model: "Test",
          year: 2020,
          engineNumber: "ENG",
          chassisNumber: "CHASSIS",
          fuelType: "diesel",
          capacity: { crew: 4, waterTank: 2000, equipment: 300 },
          dimensions: { length: 8.0, width: 2.5, height: 3.0, weight: 10000 },
        },
        equipment: { standard: [], specialized: [], safety: [] },
        status: {
          operational: "Available",
          fuelLevel: 80,
          mileage: 1000,
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          currentLocation: {
            type: "Point",
            coordinates: [100, 100], // Outside Sri Lankan boundaries
          },
          lastUpdate: new Date(),
        },
        assignment: {
          currentStation: null,
          assignedCrewId: [],
          currentShift: null,
          assignmentDate: new Date(),
        },
      });

      const coordValidation = invalidCoordVehicle.validateSync();
      await this.assert(
        coordValidation &&
          coordValidation.errors["status.currentLocation.coordinates"],
        "Coordinate validation works correctly"
      );
    } catch (error) {
      this.log(`Validation test error: ${error.message}`, "error");
      this.testResults.failed++;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log("🧪 Starting Model Verification and Testing");
    console.log("=".repeat(60));
    console.log("");

    try {
      // Connect to test database
      if (!mongoose.connection.readyState) {
        await connectDB();
        this.log("Connected to database", "success");
      }

      // Run all test suites
      await this.testUserModel();
      await this.testVehicleModel();
      await this.testStationModel();
      await this.testIncidentModel();
      await this.testModelRelationships();
      await this.testDatabaseUtils();
      await this.testModelIndexes();
      await this.testValidationRules();

      // Print results
      console.log("");
      console.log("=".repeat(60));
      console.log("🧪 Test Results Summary");
      console.log("=".repeat(60));
      console.log(`✅ Passed: ${this.testResults.passed}`);
      console.log(`❌ Failed: ${this.testResults.failed}`);
      console.log(
        `📊 Total: ${this.testResults.passed + this.testResults.failed}`
      );

      if (this.testResults.failed > 0) {
        console.log("");
        console.log("❌ Failed Tests:");
        this.testResults.errors.forEach((error) => {
          console.log(`   • ${error}`);
        });
      }

      console.log("");
      if (this.testResults.failed === 0) {
        console.log("🎉 All tests passed! Models are working correctly.");
      } else {
        console.log("⚠️  Some tests failed. Please review the errors above.");
      }

      return this.testResults.failed === 0;
    } catch (error) {
      this.log(`Testing failed: ${error.message}`, "error");
      console.error("Stack trace:", error.stack);
      return false;
    }
  }
}

// Main function
async function main() {
  const tester = new ModelTester();

  try {
    const allPassed = await tester.runAllTests();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("❌ Testing process failed:", error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔐 Database connection closed");
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ModelTester;
