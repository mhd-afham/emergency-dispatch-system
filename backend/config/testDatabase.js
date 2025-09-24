const mongoose = require("mongoose");

// Simplified database configuration for testing
const testMongooseOptions = {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    console.log("Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(mongoURI, testMongooseOptions);

    console.log("✅ MongoDB Atlas Connected Successfully");
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`💾 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:", error.message);
    throw error;
  }
};

const healthCheck = () => {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

module.exports = {
  connectDB,
  healthCheck,
};
