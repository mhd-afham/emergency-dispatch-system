const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = require("./config/database");
connectDB();

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Emergency Dispatch System API",
    version: "1.0.0",
    status: "Server is running successfully!",
  });
});

// Import routes (will be added as we create them)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/incidents', require('./routes/incidents'));
// app.use('/api/shifts', require('./routes/shifts'));
// app.use('/api/vehicles', require('./routes/vehicles'));
// app.use('/api/equipment', require('./routes/equipment'));

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

app.listen(PORT, () => {
  console.log(`🚀 Emergency Dispatch Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Server URL: http://localhost:${PORT}`);
});
