#!/usr/bin/env node

/**
 * Simple Model Validation Test
 * Basic validation test for all created models
 */

require("dotenv").config();

// Import all models to test they load correctly
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

console.log("🧪 Simple Model Validation Test");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

function test(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

try {
  // Test that all models can be imported
  test("User model loads correctly", !!User);
  test("Incident model loads correctly", !!Incident);
  test("Vehicle model loads correctly", !!Vehicle);
  test("Crew model loads correctly", !!Crew);
  test("Station model loads correctly", !!Station);
  test("Shift model loads correctly", !!Shift);
  test("Assignment model loads correctly", !!Assignment);
  test("Communication model loads correctly", !!Communication);
  test(
    "EquipmentChecklistTemplate model loads correctly",
    !!EquipmentChecklistTemplate
  );
  test("EquipmentCheck model loads correctly", !!EquipmentCheck);
  test("AuditLog model loads correctly", !!AuditLog);
  test("Report model loads correctly", !!Report);

  // Test basic validation without database connection
  try {
    const testVehicle = new Vehicle({
      registration: {
        plateNumber: "CAB-1234",
        vehicleType: "Fire Engine",
        make: "Test Make",
        model: "Test Model",
        year: 2020,
        registrationDate: new Date("2020-01-01"),
        expiryDate: new Date("2025-01-01"),
        registrationAuthority: "Test Authority",
        approvedBy: "60507f1f77bcf86cd799439f",
      },
      specifications: {
        engineNumber: "ENG123",
        chassisNumber: "CHASSIS123",
        fuelType: "diesel",
        capacity: { crew: 4, waterTank: 2000, equipment: 300 },
        dimensions: { length: 8.0, width: 2.5, height: 3.0, weight: 10000 },
      },
      equipment: { standard: [], specialized: [], safety: [] },
      status: {
        operational: "active",
        fuelLevel: 80,
        mileage: 1000,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        currentLocation: { type: "Point", coordinates: [79.8612, 6.9271] },
        lastUpdate: new Date(),
      },
      assignment: {
        currentStation: null,
        assignedCrewId: [],
        currentShift: null,
        assignmentDate: new Date(),
      },
      station: {
        homeStationId: "60507f1f77bcf86cd799439e",
      },
      audit: {
        createdBy: "60507f1f77bcf86cd799439d",
      },
    });

    const vehicleValidation = testVehicle.validateSync();
    test("Vehicle model basic validation passes", !vehicleValidation);

    // Test coordinate validation
    const invalidVehicle = new Vehicle({
      registration: {
        plateNumber: "CAB-5678",
        vehicleType: "Ambulance",
        make: "Test",
        model: "Test",
        year: 2020,
        registrationDate: new Date("2020-01-01"),
        expiryDate: new Date("2025-01-01"),
        registrationAuthority: "Test Authority",
        approvedBy: "60507f1f77bcf86cd799439f",
      },
      specifications: {
        engineNumber: "ENG",
        chassisNumber: "CHASSIS",
        fuelType: "diesel",
        capacity: { crew: 4, waterTank: 2000, equipment: 300 },
        dimensions: { length: 8.0, width: 2.5, height: 3.0, weight: 10000 },
      },
      equipment: { standard: [], specialized: [], safety: [] },
      status: {
        operational: "active",
        fuelLevel: 80,
        mileage: 1000,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        currentLocation: { type: "Point", coordinates: [200, 200] }, // Invalid
        lastUpdate: new Date(),
      },
      assignment: {
        currentStation: null,
        assignedCrewId: [],
        currentShift: null,
        assignmentDate: new Date(),
      },
      station: {
        homeStationId: "60507f1f77bcf86cd799439e",
      },
      audit: {
        createdBy: "60507f1f77bcf86cd799439d",
      },
    });

    const invalidValidation = invalidVehicle.validateSync();
    test(
      "Vehicle coordinate validation works",
      !!invalidValidation &&
        invalidValidation.errors["status.currentLocation.coordinates"]
    );
  } catch (error) {
    test("Vehicle model validation test", false);
    console.log(`   Error: ${error.message}`);
  }

  // Test User model validation
  try {
    const testUser = new User({
      personal: {
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        phone: "+94771234567",
      },
      auth: {
        password: "hashedpassword123",
        role: "Admin",
      },
    });

    const userValidation = testUser.validateSync();
    test("User model basic validation passes", !userValidation);

    // Test invalid phone
    const invalidUser = new User({
      personal: {
        firstName: "Test",
        lastName: "Invalid",
        email: "testinvalid@test.com",
        phone: "invalid-phone",
      },
      auth: {
        password: "hashedpassword123",
        role: "Admin",
      },
    });

    const phoneValidation = invalidUser.validateSync();
    test(
      "User phone validation works",
      !!phoneValidation && phoneValidation.errors["personal.phone"]
    );
  } catch (error) {
    test("User model validation test", false);
    console.log(`   Error: ${error.message}`);
  }

  // Test that schemas have indexes defined
  test("User model has indexes", User.schema.indexes().length > 0);
  test("Vehicle model has indexes", Vehicle.schema.indexes().length > 0);
  test("Station model has indexes", Station.schema.indexes().length > 0);
  test("Incident model has indexes", Incident.schema.indexes().length > 0);

  // Test geospatial index
  const vehicleIndexes = Vehicle.schema.indexes();
  const hasGeoIndex = vehicleIndexes.some(
    (idx) => idx[0] && idx[0]["status.currentLocation"] === "2dsphere"
  );
  test("Vehicle model has geospatial index", hasGeoIndex);

  console.log("");
  console.log("=".repeat(50));
  console.log("📊 Test Results Summary");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log("");
    console.log("🎉 All validation tests passed!");
    console.log("🚀 Models are properly structured and ready for use.");
  } else {
    console.log("");
    console.log("⚠️  Some validation tests failed.");
  }

  process.exit(failed > 0 ? 1 : 0);
} catch (error) {
  console.error("❌ Test execution failed:", error.message);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}
