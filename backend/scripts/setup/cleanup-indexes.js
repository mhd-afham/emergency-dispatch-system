require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../../models/User");

const cleanupIndexes = async () => {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    console.log("🗑️  Dropping all indexes...");
    await User.collection.dropIndexes();
    console.log("✅ All indexes dropped");

    console.log("🔄 Recreating default indexes...");
    await User.collection.createIndex(
      { "personal.email": 1 },
      { unique: true }
    );
    await User.collection.createIndex(
      { "auth.employeeId": 1 },
      { unique: true, sparse: true }
    );
    console.log("✅ Indexes recreated");

    console.log("🧹 Clearing all existing users...");
    await User.deleteMany({});
    console.log("✅ All users cleared");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    console.log("🔌 Disconnecting from MongoDB");
    await mongoose.disconnect();
  }
};

cleanupIndexes();
