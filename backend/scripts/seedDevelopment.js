#!/usr/bin/env node

/**
 * Development Data Seeder
 * Creates minimal test data for quick development cycles
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Import all 12 models
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

const connectDB = require("../config/database").connectDB;

/**
 * Minimal development dataset for quick testing
 */
const createDevData = async () => {
  console.log("🔧 Creating development dataset...");

  try {
    // Create a test admin user
    const adminUser = new User({
      username: "dev.admin",
      email: "admin@test.dev",
      password: "$2a$12$LQv3c1yqBwEHFx6Zt1LgXO5UVKPvJrC5C2jN4kXJm7H8XPKqp5mCe",
      personal: {
        firstName: "Dev",
        lastName: "Admin",
        dateOfBirth: new Date("1990-01-01"),
        gender: "male",
        address: {
          street: "123 Test Street",
          city: "Colombo",
          province: "Western Province",
          postalCode: "10100",
          country: "Sri Lanka",
        },
        phone: "+94771000001",
        emergencyContact: {
          name: "Test Contact",
          phone: "+94771000002",
          relationship: "Emergency",
        },
      },
      auth: {
        role: "admin",
        permissions: [
          "manage_users",
          "manage_incidents",
          "manage_resources",
          "view_reports",
        ],
        isActive: true,
      },
      settings: {
        notifications: { email: true, sms: true, push: true },
        dashboard: { defaultView: "incidents", refreshInterval: 30 },
        language: "en",
        timezone: "Asia/Colombo",
      },
    });

    const savedAdmin = await adminUser.save();
    console.log("✅ Created admin user");

    // Create a test dispatcher
    const dispatcherUser = new User({
      username: "dev.dispatcher",
      email: "dispatcher@test.dev",
      password: "$2a$12$LQv3c1yqBwEHFx6Zt1LgXO5UVKPvJrC5C2jN4kXJm7H8XPKqp5mCe",
      personal: {
        firstName: "Dev",
        lastName: "Dispatcher",
        dateOfBirth: new Date("1988-05-15"),
        gender: "female",
        address: {
          street: "456 Test Avenue",
          city: "Colombo",
          province: "Western Province",
          postalCode: "10200",
          country: "Sri Lanka",
        },
        phone: "+94771000003",
        emergencyContact: {
          name: "Test Contact 2",
          phone: "+94771000004",
          relationship: "Emergency",
        },
      },
      auth: {
        role: "dispatcher",
        permissions: [
          "manage_incidents",
          "dispatch_resources",
          "view_resources",
        ],
        isActive: true,
      },
      settings: {
        notifications: { email: true, sms: true, push: true },
        dashboard: { defaultView: "dispatch", refreshInterval: 15 },
        language: "en",
        timezone: "Asia/Colombo",
      },
    });

    const savedDispatcher = await dispatcherUser.save();
    console.log("✅ Created dispatcher user");

    // Create a test station
    const testStation = new Station({
      stationInfo: {
        stationId: "DEV-STN-001",
        name: "Test Development Station",
        type: "fire_rescue",
        established: new Date("2020-01-01"),
        commander: savedAdmin._id,
        contactInfo: {
          phone: "+94112000001",
          email: "test.station@dev.test",
          emergencyLine: "110",
        },
      },
      location: {
        coordinates: {
          type: "Point",
          coordinates: [79.8612, 6.9271], // Colombo coordinates
        },
        address: "Test Station Address, Colombo",
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
        personnel: { onDutyCapacity: 10, currentOnDuty: 6, totalCapacity: 20 },
        vehicles: { totalBays: 4, occupiedBays: 2, availableBays: 2 },
        equipment: {
          totalValue: 5000000,
          lastInventory: new Date(),
          criticalEquipment: ["pumper"],
        },
      },
      resources: {
        vehicles: [],
        equipment: [
          { name: "Test Equipment 1", quantity: 5, status: "operational" },
        ],
        specialCapabilities: ["fire_suppression"],
      },
      operational: {
        status: "active",
        operationalHours: "24/7",
        lastInspection: new Date(),
        nextInspection: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        certifications: ["TEST_CERT"],
      },
      statistics: {
        totalResponses: 50,
        avgResponseTime: 5.5,
        successRate: 98.0,
        lastUpdated: new Date(),
      },
    });

    const savedStation = await testStation.save();
    console.log("✅ Created test station");

    // Create a test vehicle
    const testVehicle = new Vehicle({
      registration: {
        plateNumber: "DEV-001",
        vehicleType: "fire_truck",
        registrationDate: new Date("2022-01-01"),
        expiryDate: new Date("2027-01-01"),
        registrationAuthority: "Test Authority",
      },
      specifications: {
        make: "Test Make",
        model: "Test Model",
        year: 2022,
        engineNumber: "TEST-ENG-001",
        chassisNumber: "TEST-CHASSIS-001",
        fuelType: "diesel",
        capacity: { crew: 4, waterTank: 2000, equipment: 300 },
        dimensions: { length: 8.0, width: 2.5, height: 3.0, weight: 10000 },
      },
      equipment: {
        standard: [
          { name: "Test Pump", quantity: 1, status: "operational" },
          { name: "Test Hoses", quantity: 4, status: "operational" },
        ],
        specialized: [
          { name: "Test Ladder", quantity: 1, status: "operational" },
        ],
        safety: [{ name: "Test Helmets", quantity: 4, status: "operational" }],
      },
      status: {
        operational: "Available",
        fuelLevel: 80,
        mileage: 15000,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        currentLocation: {
          type: "Point",
          coordinates: [79.8612, 6.9271],
        },
        lastUpdate: new Date(),
      },
      assignment: {
        currentStation: savedStation._id,
        assignedCrewId: [],
        currentShift: null,
        assignmentDate: new Date(),
      },
    });

    const savedVehicle = await testVehicle.save();
    console.log("✅ Created test vehicle");

    // Create a test crew member
    const testCrew = new Crew({
      personal: {
        firstName: "Dev",
        lastName: "Crew",
        dateOfBirth: new Date("1985-06-15"),
        gender: "male",
        nationalId: "198518501234V",
        address: {
          street: "789 Crew Street",
          city: "Colombo",
          province: "Western Province",
          postalCode: "10300",
          country: "Sri Lanka",
        },
        phone: "+94771000005",
        email: "crew@test.dev",
        emergencyContact: [
          {
            name: "Crew Emergency Contact",
            phone: "+94771000006",
            relationship: "Family",
          },
        ],
      },
      professional: {
        employeeId: "DEV-CREW-001",
        role: "crew_chief",
        department: "Fire Department",
        rank: "Test Firefighter",
        hireDate: new Date("2010-01-01"),
        experienceYears: 14,
        salary: { basic: 75000, allowances: 20000, currency: "LKR" },
        certifications: [
          {
            name: "Test Fire Safety Certificate",
            issuedBy: "Test Authority",
            issuedDate: new Date("2020-01-01"),
            expiryDate: new Date("2025-01-01"),
            isActive: true,
          },
        ],
        specializations: ["fire_suppression", "rescue_operations"],
        performanceRating: 4.5,
      },
      currentStatus: {
        availability: "available",
        location: { type: "Point", coordinates: [79.8612, 6.9271] },
        shiftId: null,
        lastUpdate: new Date(),
      },
      assignment: {
        currentStation: savedStation._id,
        assignedVehicles: [savedVehicle._id],
        currentIncidents: [],
      },
      settings: {
        notifications: { sms: true, email: true, push: true },
        preferences: { language: "en", timezone: "Asia/Colombo" },
      },
    });

    const savedCrew = await testCrew.save();
    console.log("✅ Created test crew member");

    // Create a test incident
    const testIncident = new Incident({
      incidentNumber: "DEV-INC-001",
      caller: {
        name: "Test Caller",
        phone: "+94771000010",
        location: {
          coordinates: { type: "Point", coordinates: [79.865, 6.92] },
          address: "123 Test Emergency Location",
        },
        relationship: "witness",
      },
      incident: {
        type: "fire",
        subType: "building_fire",
        severity: 3,
        description: "Test emergency incident for development",
        hazards: ["electrical"],
        estimatedLoss: 500000,
      },
      location: {
        coordinates: { type: "Point", coordinates: [79.865, 6.92] },
        address: "123 Test Emergency Location, Colombo",
        landmarks: "Near Test Landmark",
        accessNotes: "Test access notes",
      },
      status: {
        current: "Assigned",
        priority: "medium",
        history: [
          {
            status: "Received",
            timestamp: new Date(Date.now() - 600000),
            updatedBy: savedDispatcher._id,
            notes: "Test incident received",
          },
          {
            status: "Assigned",
            timestamp: new Date(Date.now() - 300000),
            updatedBy: savedDispatcher._id,
            notes: "Test assignment",
          },
        ],
      },
      timeline: {
        reportedAt: new Date(Date.now() - 600000),
        dispatchedAt: new Date(Date.now() - 300000),
        enRouteAt: null,
        arrivedAt: null,
        controlledAt: null,
        clearedAt: null,
      },
      assignment: {
        vehicleId: savedVehicle._id,
        primaryCrewId: savedCrew._id,
        additionalCrew: [],
        assignedBy: savedDispatcher._id,
        assignedAt: new Date(Date.now() - 300000),
      },
      communication: {
        initialCall: {
          duration: 120,
          callerId: "+94771000010",
          operatorId: savedDispatcher._id,
        },
        updates: [
          {
            timestamp: new Date(Date.now() - 300000),
            message: "Test assignment made",
            priority: "medium",
          },
        ],
      },
      resources: {
        required: { vehicles: 1, personnel: 4, specialEquipment: [] },
        deployed: { vehicles: 1, personnel: 4, specialEquipment: [] },
      },
    });

    const savedIncident = await testIncident.save();
    console.log("✅ Created test incident");

    // Create a test assignment
    const testAssignment = new Assignment({
      incident: { incidentId: savedIncident._id },
      resource: {
        vehicleId: savedVehicle._id,
        primaryCrewId: savedCrew._id,
        additionalCrew: [],
      },
      dispatch: {
        assignedBy: savedDispatcher._id,
        assignedAt: new Date(Date.now() - 300000),
        priority: "routine",
        estimatedArrivalTime: new Date(Date.now() + 300000),
      },
      response: {
        status: "assigned",
        acceptedAt: new Date(Date.now() - 240000),
        declinedAt: null,
        declineReason: null,
        enRouteAt: null,
        onSceneAt: null,
        completedAt: null,
      },
      performance: {
        responseTime: 60,
        arrivalTime: null,
        onSceneTime: null,
        totalDuration: null,
      },
      location: {
        dispatchLocation: { type: "Point", coordinates: [79.8612, 6.9271] },
        arrivalLocation: null,
      },
      communication: {
        notifications: [
          {
            type: "assignment",
            sentAt: new Date(Date.now() - 300000),
            deliveryStatus: "delivered",
          },
        ],
        updates: [
          {
            status: "accepted",
            timestamp: new Date(Date.now() - 240000),
            notes: "Test assignment accepted",
          },
        ],
      },
    });

    const savedAssignment = await testAssignment.save();
    console.log("✅ Created test assignment");

    // Update station with vehicle reference
    await Station.findByIdAndUpdate(savedStation._id, {
      $push: { "resources.vehicles": savedVehicle._id },
    });

    console.log("");
    console.log("🎉 Development dataset created successfully!");
    console.log("=".repeat(50));
    console.log("📊 Created:");
    console.log("   2 Users (admin + dispatcher)");
    console.log("   1 Station");
    console.log("   1 Vehicle");
    console.log("   1 Crew Member");
    console.log("   1 Incident");
    console.log("   1 Assignment");
    console.log("");
    console.log("🔑 Test Credentials:");
    console.log("   Admin: dev.admin / Admin123!");
    console.log("   Dispatcher: dev.dispatcher / Dispatch123!");
    console.log("");

    return {
      users: [savedAdmin, savedDispatcher],
      station: savedStation,
      vehicle: savedVehicle,
      crew: savedCrew,
      incident: savedIncident,
      assignment: savedAssignment,
    };
  } catch (error) {
    console.error("❌ Error creating development data:", error.message);
    throw error;
  }
};

// Clear development data
const clearDevData = async () => {
  console.log("🧹 Clearing development data...");

  const collections = [
    User,
    Station,
    Vehicle,
    Crew,
    Incident,
    Assignment,
    Communication,
    EquipmentCheck,
    EquipmentChecklistTemplate,
    AuditLog,
    Report,
  ];

  for (const Model of collections) {
    await Model.deleteMany({});
  }

  console.log("✅ Development data cleared");
};

// Main function
async function main() {
  const command = process.argv[2] || "create";

  try {
    await connectDB();
    console.log("🔗 Connected to database");
    console.log("");

    switch (command) {
      case "clear":
        await clearDevData();
        break;
      case "create":
      default:
        await clearDevData();
        await createDevData();
        break;
    }

    console.log("✅ Operation completed successfully");
  } catch (error) {
    console.error("❌ Operation failed:", error.message);
    if (process.env.NODE_ENV === "development") {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔐 Database connection closed");
    }
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createDevData, clearDevData };
