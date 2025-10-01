const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * WebSocket Configuration for Emergency Dispatch System
 * Handles real-time communication between dispatchers and field units
 */

module.exports = (io) => {
  console.log("🔌 WebSocket server initialized");

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("❌ WebSocket connection rejected: No token provided");
        return next(new Error("Authentication error"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and populate role information (JWT contains 'id', not 'userId')
      const user = await User.findById(decoded.id).populate("auth.role");

      if (!user) {
        console.log("❌ WebSocket connection rejected: User not found");
        return next(new Error("Authentication error"));
      }

      // Attach user info to socket
      socket.userId = user._id;
      socket.userRole = user.auth.role;
      socket.userName = `${user.personal.firstName} ${user.personal.lastName}`;

      console.log(
        `✅ WebSocket authenticated: ${socket.userName} (${socket.userRole})`
      );
      next();
    } catch (error) {
      console.log("❌ WebSocket authentication failed:", error.message);
      next(new Error("Authentication error"));
    }
  });

  // Handle client connections
  io.on("connection", (socket) => {
    console.log(`🔗 Client connected: ${socket.userName} (${socket.userRole})`);

    // Join role-based rooms for targeted messaging
    const roleRoom = `role-${socket.userRole.toLowerCase().replace(" ", "-")}`;
    socket.join(roleRoom);
    socket.join(`user-${socket.userId}`);

    // Send welcome message
    socket.emit("connected", {
      message: "Connected to Emergency Dispatch System",
      timestamp: new Date().toISOString(),
      role: socket.userRole,
    });

    // Handle client ping for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() });
    });

    // Handle joining specific incident rooms
    socket.on("join-incident", (incidentId) => {
      socket.join(`incident-${incidentId}`);
      console.log(`👥 ${socket.userName} joined incident room: ${incidentId}`);
    });

    // Handle leaving incident rooms
    socket.on("leave-incident", (incidentId) => {
      socket.leave(`incident-${incidentId}`);
      console.log(`👋 ${socket.userName} left incident room: ${incidentId}`);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(
        `❌ Client disconnected: ${socket.userName} - Reason: ${reason}`
      );
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`🚨 Socket error for ${socket.userName}:`, error);
    });
  });

  // Global functions for emitting events (used by controllers)
  global.emitIncidentCreated = (incident) => {
    console.log(`📢 Broadcasting incident created: ${incident.incidentId}`);
    io.emit("incident_created", incident);
  };

  global.emitIncidentUpdated = (incident) => {
    console.log(`📢 Broadcasting incident updated: ${incident.incidentId}`);
    io.emit("incident_update", incident);
    // Also emit to specific incident room
    io.to(`incident-${incident._id}`).emit(
      "incident_detailed_update",
      incident
    );
  };

  global.emitIncidentDeleted = (incidentId) => {
    console.log(`📢 Broadcasting incident deleted: ${incidentId}`);
    io.emit("incident_deleted", incidentId);
  };

  global.emitResourceAssigned = (incident, resource) => {
    console.log(
      `📢 Broadcasting resource assigned to incident: ${incident.incidentId}`
    );
    io.emit("resource_assigned", { incident, resource });
    io.to(`incident-${incident._id}`).emit("incident_resource_update", {
      incident,
      resource,
    });
  };

  global.emitResourceStatusUpdate = (resourceId, status, incidentId) => {
    console.log(
      `📢 Broadcasting resource status update: ${resourceId} -> ${status}`
    );
    io.emit("resource_update", { resourceId, status, incidentId });
    if (incidentId) {
      io.to(`incident-${incidentId}`).emit("incident_resource_status", {
        resourceId,
        status,
      });
    }
  };

  // Utility function to send message to specific roles
  global.emitToRole = (role, event, data) => {
    const roleRoom = `role-${role.toLowerCase().replace(" ", "-")}`;
    io.to(roleRoom).emit(event, data);
    console.log(`📢 Message sent to ${role}s: ${event}`);
  };

  // Utility function to send message to specific user
  global.emitToUser = (userId, event, data) => {
    io.to(`user-${userId}`).emit(event, data);
    console.log(`📢 Message sent to user ${userId}: ${event}`);
  };

  console.log("🎯 WebSocket event handlers configured");
};
