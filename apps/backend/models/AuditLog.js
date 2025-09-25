const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Action Details
    action: {
      type: {
        type: String,
        required: [true, "Action type is required"],
        enum: [
          "create",
          "read",
          "update",
          "delete",
          "login",
          "logout",
          "assign",
          "unassign",
          "dispatch",
          "respond",
          "complete",
          "cancel",
          "approve",
          "reject",
          "escalate",
          "transfer",
          "archive",
          "restore",
          "configure",
          "import",
          "export",
        ],
      },
      description: {
        type: String,
        required: [true, "Action description is required"],
        trim: true,
        maxlength: [500, "Action description cannot exceed 500 characters"],
      },
      outcome: {
        type: String,
        required: [true, "Action outcome is required"],
        enum: ["success", "failure", "partial", "cancelled"],
        default: "success",
      },
    },

    // Actor (Who performed the action)
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Actor user ID is required"],
      },
      username: {
        type: String,
        required: true,
        trim: true,
      },
      role: {
        type: String,
        required: true,
        enum: ["admin", "dispatcher", "crew_chief", "crew_member"],
      },
      sessionId: String, // To track user sessions
    },

    // Target Entity (What was affected)
    target: {
      entityType: {
        type: String,
        required: [true, "Target entity type is required"],
        enum: [
          "User",
          "Incident",
          "Vehicle",
          "Crew",
          "Station",
          "Shift",
          "Assignment",
          "Communication",
          "EquipmentCheck",
          "EquipmentChecklistTemplate",
          "Report",
          "System",
        ],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () {
          return this.target.entityType !== "System";
        },
      },
      entityName: {
        type: String,
        trim: true,
        maxlength: [200, "Entity name cannot exceed 200 characters"],
      },
      entityDetails: {
        type: mongoose.Schema.Types.Mixed, // Flexible object to store relevant entity info
      },
    },

    // Context and Environment
    context: {
      module: {
        type: String,
        required: [true, "Module is required"],
        enum: [
          "authentication",
          "incident_management",
          "vehicle_management",
          "crew_management",
          "station_management",
          "shift_management",
          "assignment_management",
          "communication",
          "equipment_check",
          "reporting",
          "user_management",
          "system_configuration",
          "audit",
        ],
      },
      feature: {
        type: String,
        trim: true,
        maxlength: [100, "Feature name cannot exceed 100 characters"],
      },
      ipAddress: {
        type: String,
        validate: {
          validator: function (ip) {
            if (!ip) return true; // Optional field
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
            return ipv4Regex.test(ip) || ipv6Regex.test(ip);
          },
          message: "Invalid IP address format",
        },
      },
      userAgent: {
        type: String,
        maxlength: [500, "User agent cannot exceed 500 characters"],
      },
      location: {
        coordinates: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
            validate: {
              validator: function (coords) {
                if (!coords || coords.length !== 2) return true; // Optional field
                const [lng, lat] = coords;
                return lng >= 79.5 && lng <= 81.9 && lat >= 5.9 && lat <= 9.9;
              },
              message: "Coordinates must be within Sri Lankan boundaries",
            },
          },
        },
        address: {
          type: String,
          trim: true,
          maxlength: [200, "Address cannot exceed 200 characters"],
        },
      },
    },

    // Change Details (for update/modify actions)
    changes: {
      before: {
        type: mongoose.Schema.Types.Mixed, // Previous state
      },
      after: {
        type: mongoose.Schema.Types.Mixed, // New state
      },
      changedFields: [
        {
          field: {
            type: String,
            required: true,
          },
          oldValue: mongoose.Schema.Types.Mixed,
          newValue: mongoose.Schema.Types.Mixed,
          changeType: {
            type: String,
            enum: ["added", "modified", "removed"],
            required: true,
          },
        },
      ],
    },

    // Risk and Security
    security: {
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "low",
      },
      isPrivileged: {
        type: Boolean,
        default: false, // True for admin or sensitive operations
      },
      requiresApproval: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      flags: [
        {
          type: String,
          enum: [
            "suspicious_activity",
            "multiple_failures",
            "after_hours",
            "unusual_location",
            "privilege_escalation",
            "data_export",
            "system_configuration",
          ],
        },
      ],
    },

    // Performance and Technical Details
    technical: {
      duration: {
        type: Number, // in milliseconds
        min: 0,
      },
      httpMethod: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      },
      httpStatusCode: {
        type: Number,
        min: 100,
        max: 599,
      },
      endpoint: {
        type: String,
        maxlength: [200, "Endpoint cannot exceed 200 characters"],
      },
      requestSize: {
        type: Number, // in bytes
        min: 0,
      },
      responseSize: {
        type: Number, // in bytes
        min: 0,
      },
    },

    // Error Information (for failed actions)
    error: {
      code: String,
      message: {
        type: String,
        maxlength: [1000, "Error message cannot exceed 1000 characters"],
      },
      stack: String, // Stack trace for debugging
      category: {
        type: String,
        enum: [
          "validation",
          "authorization",
          "authentication",
          "system",
          "network",
          "database",
        ],
      },
    },

    // Metadata
    metadata: {
      tags: [
        {
          type: String,
          trim: true,
          maxlength: [50, "Tag cannot exceed 50 characters"],
        },
      ],
      customFields: {
        type: mongoose.Schema.Types.Mixed, // For additional application-specific data
      },
      correlationId: {
        type: String, // To link related audit entries
        trim: true,
      },
      transactionId: {
        type: String, // To group related operations
        trim: true,
      },
    },

    // Timing
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    serverTimestamp: {
      type: Date,
      default: Date.now,
    },

    // Data Retention
    retention: {
      expiresAt: Date, // For automatic cleanup
      archived: {
        type: Boolean,
        default: false,
      },
      archivedAt: Date,
    },
  },
  {
    timestamps: false, // Using custom timestamp field
    collection: "audit_logs",
  }
);

// Indexes for performance and queries
auditLogSchema.index({ timestamp: -1 }); // Most common query - recent first
auditLogSchema.index({ "actor.userId": 1, timestamp: -1 });
auditLogSchema.index({ "target.entityType": 1, "target.entityId": 1 });
auditLogSchema.index({ "action.type": 1, timestamp: -1 });
auditLogSchema.index({ "context.module": 1, timestamp: -1 });
auditLogSchema.index({ "security.riskLevel": 1, timestamp: -1 });
auditLogSchema.index({ "retention.expiresAt": 1 }); // For TTL cleanup

// Compound indexes
auditLogSchema.index({ "actor.userId": 1, "action.type": 1, timestamp: -1 });
auditLogSchema.index({
  "target.entityType": 1,
  "action.type": 1,
  timestamp: -1,
});
auditLogSchema.index({
  "context.module": 1,
  "action.outcome": 1,
  timestamp: -1,
});

// TTL index for automatic cleanup
auditLogSchema.index({ "retention.expiresAt": 1 }, { expireAfterSeconds: 0 });

// Static method to log an action
auditLogSchema.statics.logAction = function (actionData) {
  const auditEntry = new this({
    action: {
      type: actionData.actionType,
      description: actionData.description,
      outcome: actionData.outcome || "success",
    },
    actor: {
      userId: actionData.userId,
      username: actionData.username,
      role: actionData.userRole,
      sessionId: actionData.sessionId,
    },
    target: {
      entityType: actionData.entityType,
      entityId: actionData.entityId,
      entityName: actionData.entityName,
      entityDetails: actionData.entityDetails,
    },
    context: {
      module: actionData.module,
      feature: actionData.feature,
      ipAddress: actionData.ipAddress,
      userAgent: actionData.userAgent,
      location: actionData.location,
    },
    changes: actionData.changes,
    security: {
      riskLevel: actionData.riskLevel || "low",
      isPrivileged: actionData.isPrivileged || false,
      flags: actionData.securityFlags || [],
    },
    technical: actionData.technical || {},
    error: actionData.error,
    metadata: actionData.metadata || {},
  });

  // Set retention policy based on risk level
  if (actionData.retentionDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + actionData.retentionDays);
    auditEntry.retention.expiresAt = expirationDate;
  } else {
    // Default retention based on risk level
    const retentionDays = {
      low: 90,
      medium: 180,
      high: 365,
      critical: 2555, // 7 years
    };
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + retentionDays[auditEntry.security.riskLevel]
    );
    auditEntry.retention.expiresAt = expirationDate;
  }

  return auditEntry.save();
};

// Static method to find logs by user
auditLogSchema.statics.findByUser = function (userId, options = {}) {
  const query = { "actor.userId": userId };

  if (options.startDate && options.endDate) {
    query.timestamp = {
      $gte: options.startDate,
      $lte: options.endDate,
    };
  }

  if (options.actionType) {
    query["action.type"] = options.actionType;
  }

  if (options.module) {
    query["context.module"] = options.module;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

// Static method to find logs by entity
auditLogSchema.statics.findByEntity = function (
  entityType,
  entityId,
  options = {}
) {
  const query = {
    "target.entityType": entityType,
    "target.entityId": entityId,
  };

  if (options.actionTypes) {
    query["action.type"] = { $in: options.actionTypes };
  }

  return this.find(query)
    .populate("actor.userId")
    .sort({ timestamp: -1 })
    .limit(options.limit || 50);
};

// Static method to find suspicious activities
auditLogSchema.statics.findSuspiciousActivities = function (timeframe = 24) {
  const startTime = new Date(Date.now() - timeframe * 60 * 60 * 1000);

  return this.find({
    timestamp: { $gte: startTime },
    $or: [
      {
        "security.flags": {
          $in: [
            "suspicious_activity",
            "multiple_failures",
            "privilege_escalation",
          ],
        },
      },
      { "security.riskLevel": { $in: ["high", "critical"] } },
      { "action.outcome": "failure" },
    ],
  })
    .populate("actor.userId")
    .sort({ timestamp: -1 });
};

// Static method to generate activity summary
auditLogSchema.statics.getActivitySummary = function (
  startDate,
  endDate,
  groupBy = "day"
) {
  const groupFormat = {
    day: {
      $dateToString: {
        format: "%Y-%m-%d",
        date: "$timestamp",
      },
    },
    hour: {
      $dateToString: {
        format: "%Y-%m-%d %H:00",
        date: "$timestamp",
      },
    },
  };

  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          period: groupFormat[groupBy],
          actionType: "$action.type",
          outcome: "$action.outcome",
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.period": 1, "_id.actionType": 1 },
    },
  ]);
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
