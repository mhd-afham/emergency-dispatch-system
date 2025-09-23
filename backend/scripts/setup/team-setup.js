#!/usr/bin/env node
// Team Member Setup Script for MongoDB Atlas
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../../models/User");

async function setupTeamMember() {
  try {
    console.log("🚀 Emergency Dispatch System - Team Setup");
    console.log("========================================");

    // Test database connection
    console.log("🔗 Testing MongoDB Atlas connection...");

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI not found in .env file");
    }

    if (mongoURI.includes("localhost")) {
      console.error("❌ Still using local MongoDB!");
      console.log(
        "   Please update MONGODB_URI in .env with Atlas connection string"
      );
      console.log("   Contact Afham for the connection string");
      return;
    }

    const conn = await mongoose.connect(mongoURI);
    console.log("✅ Connected to Atlas successfully!");
    console.log(`🗄️  Database: ${conn.connection.name}`);

    // Check if User model works
    console.log("\n📝 Testing User model...");
    const userCount = await User.countDocuments();
    console.log(`👥 Current users in database: ${userCount}`);

    // Test creating a sample user (won't actually save, just validate)
    console.log("\n🧪 Testing user creation (validation only)...");
    const testUser = new User({
      personal: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      },
      auth: {
        password: "TestPassword123!",
        role: "Dispatcher",
      },
    });

    const validationError = testUser.validateSync();
    if (validationError) {
      console.error(
        "❌ User model validation failed:",
        validationError.message
      );
    } else {
      console.log("✅ User model validation passed!");
    }

    await mongoose.connection.close();
    console.log("\n🎉 Setup complete! You're ready to start development.");
    console.log("📖 Next steps:");
    console.log("   1. Run: npm run dev");
    console.log("   2. Test authentication endpoints");
    console.log("   3. Start building your features!");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Check your internet connection");
    console.log("   2. Verify connection string in .env");
    console.log("   3. Contact Afham to whitelist your IP");
    console.log("   4. Get your IP from: https://whatismyipaddress.com/");
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTeamMember();
}

module.exports = setupTeamMember;
