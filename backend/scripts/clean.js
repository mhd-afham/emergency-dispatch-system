// Clean script to remove all data from database
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/database");

async function cleanDatabase() {
  try {
    console.log("🧹 Starting database cleanup...");

    // Connect to database
    await connectDB();

    // Clear all collections
    console.log("🗑️  Clearing all users...");
    await User.deleteMany({});

    console.log("✅ Database cleaned successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  }
}

cleanDatabase();
