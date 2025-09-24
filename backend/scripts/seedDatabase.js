#!/usr/bin/env node

/**
 * Database Seeding Script for Emergency Dispatch System
 * Populates the database with realistic Sri Lankan emergency service data
 *
 * Usage:
 *   npm run seed              - Seed all collections
 *   npm run seed:users        - Seed only users
 *   npm run seed:stations     - Seed only stations
 *   npm run seed:clear        - Clear all data
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

// Import seed data
const {
  users,
  stations,
  vehicles,
  crew,
  equipmentTemplates,
  incidents,
} = require("./seedData");

// Connect to database
const connectDB = require("../config/database").connectDB;

class DatabaseSeeder {
  constructor() {
    this.collections = [
      "users",
      "stations",
      "vehicles",
      "crews",
      "equipment_checklist_templates",
      "incidents",
      "assignments",
      "communications",
      "equipment_checks",
      "audit_logs",
      "reports",
    ];
  }

  async seedUsers() {
    console.log("🔹 Seeding users...");
    try {
      await User.deleteMany({});
      const createdUsers = await User.insertMany(users);
      console.log(`✅ Created ${createdUsers.length} users`);
      return createdUsers;
    } catch (error) {
      console.error("❌ Error seeding users:", error.message);
      throw error;
    }
  }

  async seedStations(createdUsers) {
    console.log("🔹 Seeding stations...");
    try {
      await Station.deleteMany({});

      // Assign commanders to stations
      const stationsWithCommanders = stations.map((station, index) => ({
        ...station,
        stationInfo: {
          ...station.stationInfo,
          commander: createdUsers[index % createdUsers.length]._id,
        },
      }));

      const createdStations = await Station.insertMany(stationsWithCommanders);
      console.log(`✅ Created ${createdStations.length} stations`);
      return createdStations;
    } catch (error) {
      console.error("❌ Error seeding stations:", error.message);
      throw error;
    }
  }

  async seedVehicles(createdStations) {
    console.log("🔹 Seeding vehicles...");
    try {
      await Vehicle.deleteMany({});

      // Assign vehicles to stations
      const vehiclesWithStations = vehicles.map((vehicle, index) => ({
        ...vehicle,
        assignment: {
          ...vehicle.assignment,
          currentStation: createdStations[index % createdStations.length]._id,
        },
      }));

      const createdVehicles = await Vehicle.insertMany(vehiclesWithStations);
      console.log(`✅ Created ${createdVehicles.length} vehicles`);

      // Update stations with vehicle references
      for (let i = 0; i < createdStations.length; i++) {
        const stationVehicles = createdVehicles.filter(
          (v) =>
            v.assignment.currentStation.toString() ===
            createdStations[i]._id.toString()
        );

        await Station.findByIdAndUpdate(createdStations[i]._id, {
          $set: {
            "resources.vehicles": stationVehicles.map((v) => v._id),
          },
        });
      }

      console.log("✅ Updated stations with vehicle references");
      return createdVehicles;
    } catch (error) {
      console.error("❌ Error seeding vehicles:", error.message);
      throw error;
    }
  }

  async seedCrew(createdStations) {
    console.log("🔹 Seeding crew members...");
    try {
      await Crew.deleteMany({});

      // Assign crew to stations
      const crewWithStations = crew.map((member, index) => ({
        ...member,
        assignment: {
          ...member.assignment,
          currentStation: createdStations[index % createdStations.length]._id,
        },
      }));

      const createdCrew = await Crew.insertMany(crewWithStations);
      console.log(`✅ Created ${createdCrew.length} crew members`);
      return createdCrew;
    } catch (error) {
      console.error("❌ Error seeding crew:", error.message);
      throw error;
    }
  }

  async seedEquipmentTemplates(createdUsers) {
    console.log("🔹 Seeding equipment checklist templates...");
    try {
      await EquipmentChecklistTemplate.deleteMany({});

      const templatesWithCreators = equipmentTemplates.map((template) => ({
        ...template,
        audit: {
          ...template.audit,
          createdBy: createdUsers[0]._id,
          updatedBy: createdUsers[0]._id,
        },
      }));

      const createdTemplates = await EquipmentChecklistTemplate.insertMany(
        templatesWithCreators
      );
      console.log(`✅ Created ${createdTemplates.length} equipment templates`);
      return createdTemplates;
    } catch (error) {
      console.error("❌ Error seeding equipment templates:", error.message);
      throw error;
    }
  }

  async seedIncidents(createdUsers, createdVehicles, createdCrew) {
    console.log("🔹 Seeding sample incidents...");
    try {
      await Incident.deleteMany({});

      const incidentsWithAssignments = incidents.map((incident) => ({
        ...incident,
        assignment: {
          ...incident.assignment,
          vehicleId: createdVehicles[0]._id,
          primaryCrewId: createdCrew[0]._id,
          additionalCrew: [createdCrew[1]._id],
          assignedBy: createdUsers.find((u) => u.auth.role === "dispatcher")
            ._id,
        },
        communication: {
          ...incident.communication,
          initialCall: {
            ...incident.communication.initialCall,
            operatorId: createdUsers.find((u) => u.auth.role === "dispatcher")
              ._id,
          },
        },
      }));

      const createdIncidents = await Incident.insertMany(
        incidentsWithAssignments
      );
      console.log(`✅ Created ${createdIncidents.length} sample incidents`);
      return createdIncidents;
    } catch (error) {
      console.error("❌ Error seeding incidents:", error.message);
      throw error;
    }
  }

  async clearDatabase() {
    console.log("🧹 Clearing database...");
    try {
      for (const collection of this.collections) {
        if (mongoose.connection.db.collection(collection)) {
          await mongoose.connection.db.collection(collection).deleteMany({});
          console.log(`✅ Cleared ${collection} collection`);
        }
      }
      console.log("🧹 Database cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing database:", error.message);
      throw error;
    }
  }

  async seedAll() {
    console.log("🌱 Starting database seeding process...");
    console.log("=".repeat(50));

    try {
      // Clear existing data first
      await this.clearDatabase();
      console.log("");

      // Seed in proper order due to dependencies
      const createdUsers = await this.seedUsers();
      const createdStations = await this.seedStations(createdUsers);
      const createdVehicles = await this.seedVehicles(createdStations);
      const createdCrew = await this.seedCrew(createdStations);
      const createdTemplates = await this.seedEquipmentTemplates(createdUsers);
      const createdIncidents = await this.seedIncidents(
        createdUsers,
        createdVehicles,
        createdCrew
      );

      console.log("");
      console.log("🎉 Database seeding completed successfully!");
      console.log("=".repeat(50));
      console.log("📊 Summary:");
      console.log(`   Users: ${createdUsers.length}`);
      console.log(`   Stations: ${createdStations.length}`);
      console.log(`   Vehicles: ${createdVehicles.length}`);
      console.log(`   Crew: ${createdCrew.length}`);
      console.log(`   Equipment Templates: ${createdTemplates.length}`);
      console.log(`   Incidents: ${createdIncidents.length}`);
      console.log("");
      console.log(
        "🚀 Emergency Dispatch System is ready for development/testing!"
      );
    } catch (error) {
      console.error("❌ Seeding process failed:", error.message);
      throw error;
    }
  }

  async validateSeed() {
    console.log("🔍 Validating seeded data...");
    try {
      const counts = {
        users: await User.countDocuments(),
        stations: await Station.countDocuments(),
        vehicles: await Vehicle.countDocuments(),
        crew: await Crew.countDocuments(),
        templates: await EquipmentChecklistTemplate.countDocuments(),
        incidents: await Incident.countDocuments(),
      };

      console.log("📊 Current database counts:");
      Object.entries(counts).forEach(([collection, count]) => {
        console.log(`   ${collection}: ${count}`);
      });

      // Basic validation tests
      const adminUser = await User.findOne({ "auth.role": "admin" });
      const activeStation = await Station.findOne({
        "operational.status": "active",
      });
      const availableVehicle = await Vehicle.findOne({
        "status.operational": "Available",
      });

      if (!adminUser) console.warn("⚠️  No admin user found");
      if (!activeStation) console.warn("⚠️  No active stations found");
      if (!availableVehicle) console.warn("⚠️  No available vehicles found");

      console.log("✅ Validation completed");
    } catch (error) {
      console.error("❌ Validation failed:", error.message);
      throw error;
    }
  }
}

// CLI handling
async function main() {
  const seeder = new DatabaseSeeder();
  const command = process.argv[2] || "all";

  try {
    // Connect to database
    await connectDB();
    console.log("🔗 Connected to database");
    console.log("");

    switch (command) {
      case "clear":
        await seeder.clearDatabase();
        break;
      case "users":
        await seeder.seedUsers();
        break;
      case "stations":
        const users = await User.find();
        await seeder.seedStations(users);
        break;
      case "validate":
        await seeder.validateSeed();
        break;
      case "all":
      default:
        await seeder.seedAll();
        await seeder.validateSeed();
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
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔐 Database connection closed");
    }
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error.message);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseSeeder;
