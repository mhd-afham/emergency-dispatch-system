const mongoose = require("mongoose");

// MongoDB connection configuration based on design document specifications
const mongooseOptions = {
  // Connection pooling for optimal resource utilization
  maxPoolSize: process.env.NODE_ENV === "production" ? 20 : 10, // Maximum number of connections
  minPoolSize: process.env.NODE_ENV === "production" ? 5 : 2, // Minimum number of connections

  // Timeout configurations for emergency response requirements
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive can take
  connectTimeoutMS: 10000, // How long to wait for connection to be established

  // Additional connection settings
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  heartbeatFrequencyMS: 10000, // Heartbeat frequency for connection health
  retryWrites: true, // Automatically retry writes on transient network errors

  // Replica set configuration
  readPreference: "primaryPreferred", // Read from primary when available
  readConcern: { level: "local" }, // Read concern for emergency operations
};

// Connection state management
let isConnected = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 5;

const connectDB = async () => {
  // Avoid multiple connection attempts
  if (isConnected) {
    console.log("MongoDB connection already established");
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    console.log("Connecting to MongoDB Atlas...");
    console.log(
      `Connection attempt: ${connectionAttempts + 1}/${maxConnectionAttempts}`
    );

    // Establish connection with enhanced configuration
    const conn = await mongoose.connect(mongoURI, mongooseOptions);

    // Connection success logging
    console.log("✅ MongoDB Atlas Connected Successfully");
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`💾 Database: ${conn.connection.name}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `🔗 Connection Pool - Max: ${mongooseOptions.maxPoolSize}, Min: ${mongooseOptions.minPoolSize}`
    );

    isConnected = true;
    connectionAttempts = 0;

    // Set up connection event listeners
    setupConnectionEventListeners();

    return conn;
  } catch (error) {
    connectionAttempts++;
    console.error("❌ MongoDB Atlas connection failed:");
    console.error(`🔍 Error: ${error.message}`);

    if (error.name === "MongooseServerSelectionError") {
      console.error(
        "🚨 Server selection failed - check network connectivity and MongoDB Atlas configuration"
      );
    } else if (error.name === "MongoNetworkError") {
      console.error("🚨 Network error - check internet connectivity");
    } else if (error.name === "MongooseError") {
      console.error(
        "🚨 Mongoose configuration error - check connection options"
      );
    }

    // Retry logic for emergency system resilience
    if (connectionAttempts < maxConnectionAttempts) {
      const retryDelay = Math.min(
        1000 * Math.pow(2, connectionAttempts),
        30000
      ); // Exponential backoff
      console.log(`⏱️  Retrying connection in ${retryDelay / 1000} seconds...`);

      setTimeout(() => {
        connectDB();
      }, retryDelay);
    } else {
      console.error(
        "🚫 Maximum connection attempts exceeded. Exiting application."
      );
      process.exit(1);
    }
  }
};

// Enhanced connection event listeners for monitoring
const setupConnectionEventListeners = () => {
  const connection = mongoose.connection;

  // Connection opened
  connection.on("connected", () => {
    console.log("🔗 Mongoose connected to MongoDB Atlas");
    isConnected = true;
  });

  // Connection error
  connection.on("error", (error) => {
    console.error("❌ Mongoose connection error:", error.message);
    isConnected = false;
  });

  // Connection disconnected
  connection.on("disconnected", () => {
    console.warn("⚠️  Mongoose disconnected from MongoDB Atlas");
    isConnected = false;

    // Attempt reconnection for emergency system availability
    if (connectionAttempts < maxConnectionAttempts) {
      console.log("🔄 Attempting automatic reconnection...");
      setTimeout(connectDB, 5000);
    }
  });

  // Connection reconnected
  connection.on("reconnected", () => {
    console.log("✅ Mongoose reconnected to MongoDB Atlas");
    isConnected = true;
    connectionAttempts = 0;
  });

  // Application termination
  process.on("SIGINT", async () => {
    console.log("⚠️  Application termination signal received");
    await gracefulDisconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("⚠️  Application termination signal received");
    await gracefulDisconnect();
    process.exit(0);
  });

  // Unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
  });
};

// Graceful disconnection for application shutdown
const gracefulDisconnect = async () => {
  try {
    if (isConnected) {
      console.log("🔐 Closing MongoDB connection gracefully...");
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed gracefully");
      isConnected = false;
    }
  } catch (error) {
    console.error("❌ Error during graceful disconnection:", error.message);
  }
};

// Health check function for emergency system monitoring
const healthCheck = () => {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    connectionAttempts,
    uptime: process.uptime(),
  };
};

// Database performance monitoring
const getConnectionStats = () => {
  const stats = {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    db: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections).length,
  };

  // Add connection pool information if available
  if (mongoose.connection.client) {
    const poolStats = mongoose.connection.client.topology?.s?.pool?.stats;
    if (poolStats) {
      stats.pool = {
        totalConnectionCount: poolStats.totalConnectionCount,
        availableConnectionCount: poolStats.availableConnectionCount,
        checkedOutConnectionCount: poolStats.checkedOutConnectionCount,
      };
    }
  }

  return stats;
};

module.exports = {
  connectDB,
  healthCheck,
  getConnectionStats,
  gracefulDisconnect,
};
