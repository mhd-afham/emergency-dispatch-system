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
  assignments,
  communications,
  equipmentChecks,
  auditLogs,
  reports,
  shifts,
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
      "shifts",
    ];
  }

  async seedUsers() {
    console.log("🔹 Seeding users...");
    try {
      await User.deleteMany({});

      // Create users individually to trigger password hashing middleware
      const createdUsers = [];
      for (const userData of users) {
        const user = new User(userData);
        const savedUser = await user.save();
        createdUsers.push(savedUser);
      }

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

      // Assign commanders and audit fields to stations
      const stationsWithCommanders = stations.map((station, index) => ({
        ...station,
        stationCommander: createdUsers[index % createdUsers.length]._id,
        audit: {
          createdBy: createdUsers[0]._id, // Admin user creates all stations
          createdAt: new Date(),
          updatedAt: new Date(),
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

  async seedVehicles(createdStations, createdUsers) {
    console.log("🔹 Seeding vehicles...");
    try {
      await Vehicle.deleteMany({});

      // Assign vehicles to stations and populate required fields
      const vehiclesWithRequiredFields = vehicles.map((vehicle, index) => ({
        ...vehicle,
        registration: {
          ...vehicle.registration,
          approvedBy: createdUsers[0]._id, // Admin approves all vehicles
        },
        station: {
          homeStationId: createdStations[index % createdStations.length]._id,
          currentStationId: createdStations[index % createdStations.length]._id,
        },
        audit: {
          createdBy: createdUsers[0]._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }));

      const createdVehicles = await Vehicle.insertMany(
        vehiclesWithRequiredFields
      );
      console.log(`✅ Created ${createdVehicles.length} vehicles`);

      console.log("✅ Vehicle assignments completed");
      return createdVehicles;
    } catch (error) {
      console.error("❌ Error seeding vehicles:", error.message);
      throw error;
    }
  }

  async seedCrew(createdStations, createdUsers) {
    console.log("🔹 Seeding crew members...");
    try {
      await Crew.deleteMany({});

      // Assign crew to stations and populate required fields
      const crewWithStations = crew.map((member, index) => ({
        ...member,
        audit: {
          createdBy: createdUsers[0]._id, // Admin user creates all crew
          createdAt: new Date(),
          updatedAt: new Date(),
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

      const dispatcher = createdUsers.find((u) => u.auth.role === "Dispatcher");
      if (!dispatcher) {
        throw new Error("No dispatcher user found to log incidents");
      }

      const incidentsWithLogger = incidents.map((incident) => ({
        ...incident,
        loggedBy: dispatcher._id,
        assignedDispatcher: dispatcher._id,
        audit: {
          createdBy: dispatcher._id,
          updatedBy: dispatcher._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }));

      const createdIncidents = await Incident.insertMany(incidentsWithLogger);
      console.log(`✅ Created ${createdIncidents.length} sample incidents`);
      return createdIncidents;
    } catch (error) {
      console.error("❌ Error seeding incidents:", error.message);
      throw error;
    }
  }

  async seedAssignments(
    createdIncidents,
    createdVehicles,
    createdCrew,
    createdUsers
  ) {
    console.log("🔹 Seeding assignments...");
    try {
      await Assignment.deleteMany({});

      const dispatcher = createdUsers.find((u) => u.auth.role === "Dispatcher");
      if (!dispatcher) {
        throw new Error("No dispatcher user found to create assignments");
      }

      const assignmentsWithReferences = assignments.map(
        (assignment, index) => ({
          ...assignment,
          incident: {
            incidentId: createdIncidents[0]._id, // Link to first incident
          },
          resource: {
            vehicleId: createdVehicles[0]._id,
            primaryCrewId: createdCrew[0]._id,
            additionalCrew: [createdCrew[1]._id],
          },
          dispatch: {
            ...assignment.dispatch,
            assignedBy: dispatcher._id,
          },
          status: {
            ...assignment.status,
            history: assignment.status.history.map((h) => ({
              ...h,
              updatedBy: dispatcher._id,
            })),
          },
          audit: {
            createdBy: dispatcher._id,
            updatedBy: dispatcher._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );

      const createdAssignments = await Assignment.insertMany(
        assignmentsWithReferences
      );
      console.log(`✅ Created ${createdAssignments.length} assignments`);
      return createdAssignments;
    } catch (error) {
      console.error("❌ Error seeding assignments:", error.message);
      throw error;
    }
  }

  async seedCommunications(createdIncidents, createdUsers, createdCrew) {
    console.log("🔹 Seeding communications...");
    try {
      await Communication.deleteMany({});

      const dispatcher = createdUsers.find((u) => u.auth.role === "Dispatcher");
      if (!dispatcher) {
        throw new Error("No dispatcher user found to create communications");
      }

      const communicationsWithReferences = communications.map(
        (comm, index) => ({
          ...comm,
          sender: {
            ...comm.sender,
            userId: dispatcher._id,
          },
          recipient: {
            ...comm.recipient,
            recipientIds: [createdCrew[index % createdCrew.length]._id],
          },
          incident: {
            incidentId: createdIncidents[index % createdIncidents.length]._id,
            incidentNumber:
              createdIncidents[index % createdIncidents.length].incidentId,
          },
          audit: {
            createdBy: dispatcher._id,
            updatedBy: dispatcher._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );

      const createdCommunications = await Communication.insertMany(
        communicationsWithReferences
      );
      console.log(`✅ Created ${createdCommunications.length} communications`);
      return createdCommunications;
    } catch (error) {
      console.error("❌ Error seeding communications:", error.message);
      throw error;
    }
  }

  async seedEquipmentChecks(
    createdVehicles,
    createdCrew,
    createdTemplates,
    createdUsers,
    createdStations
  ) {
    console.log("🔹 Seeding equipment checks...");
    try {
      await EquipmentCheck.deleteMany({});

      const dispatcher = createdUsers.find((u) => u.auth.role === "Dispatcher");
      if (!dispatcher) {
        throw new Error("No dispatcher user found to create equipment checks");
      }

      const equipmentChecksWithReferences = equipmentChecks.map(
        (check, index) => ({
          ...check,
          vehicleId: createdVehicles[0]._id, // Link to fire engine
          crewId: createdCrew[0]._id, // Link to first crew member
          templateId: createdTemplates[0]._id, // Link to fire engine template
          inspection: {
            ...check.inspection,
            checkResults: check.inspection.checkResults.map((result) => ({
              ...result,
              checkedBy: createdCrew[0]._id, // Populate checkedBy for each result
            })),
            inspectedBy: createdCrew[0]._id,
            supervisorApproval: {
              approvedBy: dispatcher._id,
              approvedAt: new Date(),
              approved: true,
              notes: "Inspection completed satisfactorily",
            },
          },
          signatures: {
            ...check.signatures,
            crewMember: {
              ...check.signatures.crewMember,
              signedBy: createdCrew[0]._id,
            },
            supervisor: {
              ...check.signatures.supervisor,
              signedBy: dispatcher._id,
            },
          },
          location: {
            ...check.location,
            stationId: createdStations[0]._id,
          },
          audit: {
            createdBy: createdCrew[0]._id,
            updatedBy: dispatcher._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );

      const createdEquipmentChecks = await EquipmentCheck.insertMany(
        equipmentChecksWithReferences
      );
      console.log(
        `✅ Created ${createdEquipmentChecks.length} equipment checks`
      );
      return createdEquipmentChecks;
    } catch (error) {
      console.error("❌ Error seeding equipment checks:", error.message);
      throw error;
    }
  }

  async seedAuditLogs(createdUsers, createdIncidents) {
    console.log("🔹 Seeding audit logs...");
    try {
      await AuditLog.deleteMany({});

      const dispatcher = createdUsers.find((u) => u.auth.role === "Dispatcher");
      if (!dispatcher) {
        throw new Error("No dispatcher user found to create audit logs");
      }

      const auditLogsWithReferences = auditLogs.map((log, index) => ({
        ...log,
        actor: {
          ...log.actor,
          userId: dispatcher._id,
        },
        target: {
          ...log.target,
          entityId:
            index === 0
              ? createdIncidents[0]._id
              : new mongoose.Types.ObjectId(),
        },
        timestamp: new Date(Date.now() - (auditLogs.length - index) * 300000), // 5 minutes apart
      }));

      const createdAuditLogs = await AuditLog.insertMany(
        auditLogsWithReferences
      );
      console.log(`✅ Created ${createdAuditLogs.length} audit logs`);
      return createdAuditLogs;
    } catch (error) {
      console.error("❌ Error seeding audit logs:", error.message);
      throw error;
    }
  }

  async seedReports(createdUsers) {
    console.log("🔹 Seeding reports...");
    try {
      await Report.deleteMany({});

      const admin = createdUsers.find((u) => u.auth.role === "Admin");
      const dispatcher = createdUsers.find((u) => u.auth.role === "Dispatcher");

      if (!admin || !dispatcher) {
        throw new Error("Required users not found to create reports");
      }

      const reportsWithReferences = reports.map((report) => ({
        ...report,
        metadata: {
          ...report.metadata,
          generatedBy: dispatcher._id,
          approvedBy: admin._id,
        },
        audit: {
          createdBy: dispatcher._id,
          updatedBy: admin._id,
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          updatedAt: new Date(Date.now() - 86400000), // 1 day ago
        },
      }));

      const createdReports = await Report.insertMany(reportsWithReferences);
      console.log(`✅ Created ${createdReports.length} reports`);
      return createdReports;
    } catch (error) {
      console.error("❌ Error seeding reports:", error.message);
      throw error;
    }
  }

  async seedShifts(
    createdStations,
    createdCrew,
    createdVehicles,
    createdUsers
  ) {
    console.log("🔹 Seeding shifts...");
    try {
      await Shift.deleteMany({});

      const dispatcher = createdUsers.find((u) => u.auth.role === "Dispatcher");
      if (!dispatcher) {
        throw new Error("No dispatcher user found to create shifts");
      }

      const shiftsWithReferences = shifts.map((shift, index) => ({
        ...shift,
        stationId: createdStations[0]._id, // Assign to first station
        supervision: {
          ...shift.supervision,
          supervisorId: dispatcher._id, // Assign dispatcher as supervisor
        },
        staffing: {
          ...shift.staffing,
          assignedCrew: createdCrew
            .slice(0, shift.staffing.requiredCrewCount)
            .map((crew, crewIndex) => ({
              crewId: crew._id,
              role: shift.staffing.requiredRoles[crewIndex] || "Firefighter",
              assignedAt: new Date(),
              status: "assigned",
              assignedBy: dispatcher._id,
            })),
        },
        audit: {
          ...shift.audit,
          createdBy: dispatcher._id, // Assign dispatcher as creator
        },
      }));

      const createdShifts = await Shift.insertMany(shiftsWithReferences);
      console.log(`✅ Created ${createdShifts.length} shifts`);
      return createdShifts;
    } catch (error) {
      console.error("❌ Error seeding shifts:", error.message);
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

  async updateCircularDependencies(
    createdStations,
    createdVehicles,
    createdCrew,
    createdIncidents,
    createdShifts
  ) {
    console.log(
      "🔹 Phase 2: Updating circular dependencies following documented strategy..."
    );

    try {
      // 1. Update Crew → Vehicle assignments (assign each crew leader to a vehicle)
      console.log("   • Assigning crew leaders to vehicles...");
      for (
        let i = 0;
        i < Math.min(createdCrew.length, createdVehicles.length);
        i++
      ) {
        const crewMember = createdCrew[i];
        const vehicle = createdVehicles[i];

        // Update crew's assigned vehicle
        await Crew.findByIdAndUpdate(crewMember._id, {
          "currentStatus.assignedVehicleId": vehicle._id,
          "currentStatus.availability": "on_duty",
        });

        // Update vehicle's crew assignment
        await Vehicle.findByIdAndUpdate(vehicle._id, {
          "assignment.crew": [crewMember._id],
        });
      }

      // 2. Update Station → Vehicle/Crew references
      console.log("   • Updating station resource tracking...");
      for (const station of createdStations) {
        // Find vehicles assigned to this station
        const stationVehicles = createdVehicles.filter(
          (v) => v.station.homeStationId.toString() === station._id.toString()
        );

        // Find crew assigned to vehicles at this station
        const stationCrew = [];
        for (const vehicle of stationVehicles) {
          const vehicleCrew = createdCrew.filter(
            (c) =>
              c.currentStatus.assignedVehicleId &&
              c.currentStatus.assignedVehicleId.toString() ===
                vehicle._id.toString()
          );
          stationCrew.push(...vehicleCrew);
        }

        // Update station's current resources
        await Station.findByIdAndUpdate(station._id, {
          "currentResources.vehicles": stationVehicles.map((v) => ({
            vehicleId: v._id,
            status: "stationed",
          })),
          "currentResources.crew": stationCrew.map((c) => ({
            crewId: c._id,
            status: "on_duty",
          })),
        });
      }

      // 3. Update Crew → Shift assignments
      console.log("   • Assigning crew to shifts...");
      for (let i = 0; i < createdShifts.length && i < createdCrew.length; i++) {
        const shift = createdShifts[i];
        const assignedCrew = createdCrew.slice(i * 3, (i + 1) * 3); // 3 crew per shift

        // Update shift with assigned crew
        await Shift.findByIdAndUpdate(shift._id, {
          "staffing.assignedCrew": assignedCrew.map((c) => ({
            crewId: c._id,
            role: c.professional.role,
            assignedAt: new Date(),
            status: "assigned",
            assignedBy: createdStations[0].stationCommander,
          })),
        });

        // Update crew with shift assignment
        for (const crewMember of assignedCrew) {
          await Crew.findByIdAndUpdate(crewMember._id, {
            "currentStatus.shiftId": shift._id,
          });
        }
      }

      console.log("✅ Phase 2: Circular dependencies updated successfully");

      // Log assignment summary
      console.log("📋 Assignment Summary:");
      console.log(
        `   • ${Math.min(
          createdCrew.length,
          createdVehicles.length
        )} crew leaders assigned to vehicles`
      );
      console.log(
        `   • ${createdStations.length} stations updated with resource tracking`
      );
      console.log(
        `   • ${createdShifts.length} shifts populated with crew assignments`
      );
    } catch (error) {
      console.error("❌ Error updating circular dependencies:", error.message);
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
      const createdVehicles = await this.seedVehicles(
        createdStations,
        createdUsers
      );
      const createdCrew = await this.seedCrew(createdStations, createdUsers);
      const createdTemplates = await this.seedEquipmentTemplates(createdUsers);
      const createdIncidents = await this.seedIncidents(
        createdUsers,
        createdVehicles,
        createdCrew
      );

      // Seed additional models that depend on the core models above
      const createdAssignments = await this.seedAssignments(
        createdIncidents,
        createdVehicles,
        createdCrew,
        createdUsers
      );
      const createdCommunications = await this.seedCommunications(
        createdIncidents,
        createdUsers,
        createdCrew
      );
      const createdEquipmentChecks = await this.seedEquipmentChecks(
        createdVehicles,
        createdCrew,
        createdTemplates,
        createdUsers,
        createdStations
      );
      const createdAuditLogs = await this.seedAuditLogs(
        createdUsers,
        createdIncidents
      );
      const createdReports = await this.seedReports(createdUsers);
      const createdShifts = await this.seedShifts(
        createdStations,
        createdCrew,
        createdVehicles,
        createdUsers
      );

      // PHASE 2: Handle Circular Dependencies
      console.log("🔄 Phase 2: Updating circular dependencies...");
      await this.updateCircularDependencies(
        createdStations,
        createdVehicles,
        createdCrew,
        createdIncidents,
        createdShifts
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
      console.log(`   Assignments: ${createdAssignments.length}`);
      console.log(`   Communications: ${createdCommunications.length}`);
      console.log(`   Equipment Checks: ${createdEquipmentChecks.length}`);
      console.log(`   Audit Logs: ${createdAuditLogs.length}`);
      console.log(`   Reports: ${createdReports.length}`);
      console.log(`   Shifts: ${createdShifts.length}`);
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
      // Count all 12 models
      const counts = {
        users: await User.countDocuments(),
        stations: await Station.countDocuments(),
        vehicles: await Vehicle.countDocuments(),
        crew: await Crew.countDocuments(),
        templates: await EquipmentChecklistTemplate.countDocuments(),
        incidents: await Incident.countDocuments(),
        assignments: await Assignment.countDocuments(),
        communications: await Communication.countDocuments(),
        equipmentChecks: await EquipmentCheck.countDocuments(),
        auditLogs: await AuditLog.countDocuments(),
        reports: await Report.countDocuments(),
        shifts: await Shift.countDocuments(),
      };

      console.log("📊 Current database counts:");
      Object.entries(counts).forEach(([collection, count]) => {
        console.log(`   ${collection}: ${count}`);
      });

      // Basic validation tests with correct queries
      const adminUser = await User.findOne({ "auth.role": "Admin" }); // Capital A
      const activeStation = await Station.findOne({ isActive: true });
      const availableVehicle = await Vehicle.findOne({
        "status.operational": "active",
      });

      // Validation results
      const validationResults = [];
      if (!adminUser) validationResults.push("⚠️  No admin user found");
      if (!activeStation)
        validationResults.push("⚠️  No active stations found");
      if (!availableVehicle)
        validationResults.push("⚠️  No available vehicles found");

      // Show validation results
      if (validationResults.length > 0) {
        validationResults.forEach((warning) => console.warn(warning));
      } else {
        console.log("✅ All validation checks passed");
      }

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
        console.log("✅ Database cleared successfully");
        break;
      case "users":
        await seeder.seedUsers();
        console.log("✅ Users seeded successfully");
        break;
      case "stations":
        const users = await User.find();
        await seeder.seedStations(users);
        console.log("✅ Stations seeded successfully");
        break;
      case "validate":
        await seeder.validateSeed();
        break;
      case "all":
      default:
        await seeder.seedAll();
        await seeder.validateSeed();
        console.log("✅ Operation completed successfully");
        break;
    }
  } catch (error) {
    console.error("❌ Operation failed:", error.message);
    if (process.env.NODE_ENV === "development") {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  } finally {
    // Clean up event listeners to prevent automatic reconnection messages
    mongoose.connection.removeAllListeners("disconnected");
    mongoose.connection.removeAllListeners("reconnected");

    // Close database connection gracefully
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
