const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const httpServer = createServer(app);

// Helper function to build CORS origins
const buildCorsOrigins = () => {
  const origins = [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3001", // Frontend dev server
    // Universal regex patterns for common network ranges
    /^http:\/\/192\.168\.\d+\.\d+:(8081|19000|19001|19002)$/, // Local network (192.168.x.x)
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:(8081|19000|19001|19002)$/, // Private network (172.16-31.x.x)
    /^http:\/\/10\.\d+\.\d+\.\d+:(8081|19000|19001|19002)$/, // Private network (10.x.x.x)
    /^http:\/\/localhost:(8081|19000|19001|19002)$/, // Localhost with different ports
  ];

  // Add specific IPs from environment variable
  if (process.env.MOBILE_IPS) {
    const mobileIps = process.env.MOBILE_IPS.split(",").map((ip) => ip.trim());
    mobileIps.forEach((ip) => {
      origins.push(`http://${ip}:8081`); // Expo Dev Server
      origins.push(`http://${ip}:19000`); // Expo Metro bundler
      origins.push(`http://${ip}:19001`); // Expo Metro bundler (alternative)
      origins.push(`http://${ip}:19002`); // Expo Dev Tools
    });
  }

  return origins;
};

const corsOrigins = buildCorsOrigins();

// Log allowed origins on startup
console.log("🌐 CORS Configuration:");
console.log("   Allowed origins:", corsOrigins.length, "patterns");
if (process.env.MOBILE_IPS) {
  console.log("   📱 Mobile IPs:", process.env.MOBILE_IPS);
}

// Middleware
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
const { connectDB } = require("./config/database");
connectDB();

// Socket.io setup (reuse the same CORS origins)
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io configuration
require("./config/websocket")(io);

// Register all models (ensures they're available for populate)
require("./models/Station");
require("./models/Vehicle");
require("./models/Crew");
require("./models/User");

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Emergency Dispatch System API",
    version: "1.0.0",
    status: "Server is running successfully!",
  });
});

// Import routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/incidents", require("./routes/incidents"));
app.use("/api/equipment", require("./routes/equipment"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/assignments", require("./routes/assignments"));
app.use("/api/crews", require("./routes/crews"));
app.use("/api/shifts", require("./routes/shifts"));
app.use("/api/crew", require("./routes/crew"));
app.use("/api/drafts", require("./routes/drafts"));
app.use("/api/analytics", require("./routes/analytics"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Listen on all network interfaces (IPv4)

// Make io available globally for use in controllers
global.io = io;
app.set("io", io);

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Emergency Dispatch Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📱 Network URL: http://192.168.1.101:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://192.168.1.101:${PORT}`);
  console.log(`✅ CORS enabled for mobile devices on local network`);
  console.log(`🌐 Listening on all network interfaces (${HOST})`);
});
