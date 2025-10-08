const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001", // Frontend dev server (Julien's addition)
      "http://192.168.1.101:8081", // Expo Dev Server (old)
      "http://172.20.10.3:8081", // Expo Dev Server (WiFi/Hotspot)
      /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Allow any device on local network (Expo)
      /^http:\/\/192\.168\.\d+\.\d+:19000$/, // Expo Metro bundler
      /^http:\/\/172\.20\.\d+\.\d+:8081$/, // Hotspot network (Expo)
      /^http:\/\/172\.20\.\d+\.\d+:19000$/, // Hotspot network (Metro)
    ],
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

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://192.168.1.101:8081", // Expo Dev Server (old)
      "http://172.20.10.3:8081", // Expo Dev Server (WiFi/Hotspot)
      /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Allow any device on local network (Expo)
      /^http:\/\/192\.168\.\d+\.\d+:19000$/, // Expo Metro bundler
      /^http:\/\/172\.20\.\d+\.\d+:8081$/, // Hotspot network (Expo)
      /^http:\/\/172\.20\.\d+\.\d+:19000$/, // Hotspot network (Metro)
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io configuration
require("./config/websocket")(io);

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Emergency Dispatch System API",
    version: "1.0.0",
    status: "Server is running successfully!",
  });
});

// Import routes (will be added as we create them)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/incidents", require("./routes/incidents"));
app.use("/api/equipment", require("./routes/equipment"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/assignments", require("./routes/assignments"));
app.use("/api/crews", require("./routes/crews"));
app.use("/api/shifts", require("./routes/shifts")); // Julien's shift management
app.use("/api/crew", require("./routes/crew")); // Julien's crew routes

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
