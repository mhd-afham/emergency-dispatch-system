// Seed script to create initial data for testing
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/database");

const seedUsers = [
  {
    personal: {
      firstName: "System",
      lastName: "Administrator",
      email: "admin@respondr.lk",
      phone: "+94701234567",
    },
    auth: {
      password: "Admin123!",
      role: "Admin",
      employeeId: "EMP000001",
    },
    settings: {
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "John",
      lastName: "Dispatcher",
      email: "dispatcher@respondr.lk",
      phone: "+94701234568",
    },
    auth: {
      password: "Dispatch123!",
      role: "Dispatcher",
      employeeId: "EMP000002",
    },
    settings: {
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Jane",
      lastName: "CallTaker",
      email: "calltaker@respondr.lk",
      phone: "+94701234569",
    },
    auth: {
      password: "CallTaker123!",
      role: "Call Taker",
      employeeId: "EMP000003",
    },
    settings: {
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Test",
      lastName: "Citizen",
      email: "citizen@test.com",
      phone: "+94701234570",
    },
    auth: {
      password: "Citizen123!",
      role: "Citizen",
    },
    settings: {
      emailVerified: true,
    },
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to database
    await connectDB();

    // Clear existing users
    console.log("🧹 Clearing existing users...");
    await User.deleteMany({});

    // Create new users
    console.log("👥 Creating seed users...");
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      console.log(
        `✅ Created user: ${user.personal.firstName} ${user.personal.lastName} (${user.auth.role})`
      );
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📝 Test Credentials:");
    console.log("Admin: admin@respondr.lk / Admin123!");
    console.log("Dispatcher: dispatcher@respondr.lk / Dispatch123!");
    console.log("Call Taker: calltaker@respondr.lk / CallTaker123!");
    console.log("Citizen: citizen@test.com / Citizen123!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();
