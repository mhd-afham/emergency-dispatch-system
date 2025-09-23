// Test MongoDB Atlas connection
require("dotenv").config();
const mongoose = require("mongoose");

async function testAtlasConnection() {
  try {
    console.log("🔗 Testing MongoDB Atlas connection...");

    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI not found in .env file");
    }

    if (mongoURI.includes("localhost")) {
      console.log("⚠️  You're still using local MongoDB connection");
      console.log(
        "   Please update MONGODB_URI in .env with your Atlas connection string"
      );
      return;
    }

    console.log("📡 Connecting to Atlas...");

    const conn = await mongoose.connect(mongoURI);

    console.log("✅ MongoDB Atlas connection successful!");
    console.log(`🌐 Connected to: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);

    // Test creating a sample document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model("Test", testSchema);

    const testDoc = new TestModel({ test: "Atlas connection working!" });
    await testDoc.save();

    console.log("✅ Test document created successfully!");

    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log("🧹 Test document cleaned up");

    await mongoose.connection.close();
    console.log("🔌 Connection closed successfully");
  } catch (error) {
    console.error("❌ Atlas connection failed:", error.message);

    if (error.message.includes("authentication failed")) {
      console.error("💡 Authentication Error - Check:");
      console.error("   - Database username and password in connection string");
      console.error("   - User exists in Database Access section");
      console.error("   - User has proper permissions");
    }

    if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("getaddrinfo")
    ) {
      console.error("💡 Network Error - Check:");
      console.error("   - Your internet connection");
      console.error("   - Cluster URL is correct");
      console.error("   - Your IP is whitelisted in Network Access");
    }

    if (error.message.includes("MONGODB_URI")) {
      console.error("💡 Configuration Error:");
      console.error("   - Add your Atlas connection string to .env file");
    }
  }
}

testAtlasConnection();
