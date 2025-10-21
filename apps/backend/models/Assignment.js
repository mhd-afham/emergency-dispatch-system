const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    // Incident Reference
    incident: {
      incidentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
        required: [true, "Incident ID is required"],
      },
    },

    // Resource Assignment
    resource: {
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: [true, "Vehicle ID is required"],
      },
      primaryCrewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crew",
        required: [true, "Primary crew member is required"],
      },
      additionalCrew: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Crew",
        },
      ],
    },

    // Dispatch Information
    dispatch: {
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Assigning dispatcher is required"],
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
      },
      estimatedArrivalTime: Date,
      dispatchNotes: {
        type: String,
        maxlength: [500, "Dispatch notes cannot exceed 500 characters"],
      },
    },

    // Response Timeline
    response: {
      status: {
        type: String,
        enum: [
          "assigned",
          "accepted",
          "declined",
          "en_route",
          "on_scene",
          "completed",
          "returned", // October 21, 2025 - When crew marks vehicle as returned to station
          "cancelled",
        ],
        default: "assigned",
      },
      acceptedAt: Date,
      acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crew",
      },
      declinedAt: Date,
      declineReason: {
        type: String,
        maxlength: [200, "Decline reason cannot exceed 200 characters"],
      },
      enRouteAt: Date,
      onSceneAt: Date,
      completedAt: Date,
      returningAt: Date, // NEW - When vehicle starts returning to station
      returnedAt: Date, // NEW - When vehicle arrives back at station
      cancelledAt: Date,
      cancellationReason: {
        type: String,
        maxlength: [200, "Cancellation reason cannot exceed 200 characters"],
      },
    },

    // Performance Metrics
    performance: {
      responseTime: {
        type: Number, // in seconds from assignment to en_route
        default: null,
      },
      arrivalTime: {
        type: Number, // in seconds from assignment to on_scene
        default: null,
      },
      onSceneTime: {
        type: Number, // in seconds from on_scene to completed
        default: null,
      },
      totalDuration: {
        type: Number, // in seconds from assignment to completed
        default: null,
      },
    },

    // Location Tracking
    location: {
      dispatchLocation: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          validate: {
            validator: function (coords) {
              if (!coords || coords.length !== 2) return false;
              const [lng, lat] = coords;
              return lng >= 79.5 && lng <= 81.9 && lat >= 5.9 && lat <= 9.9;
            },
            message: "Coordinates must be within Sri Lankan boundaries",
          },
        },
      },
      arrivalLocation: {
        type: {
          type: String,
          enum: ["Point"],
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
    },

    // Communication Log
    communication: {
      notifications: [
        {
          type: {
            type: String,
            enum: ["sms", "push", "radio", "email"],
            required: true,
          },
          message: {
            type: String,
            required: true,
          },
          sentAt: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["pending", "sent", "delivered", "failed"],
            default: "pending",
          },
          recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "communication.notifications.recipientType",
          },
          recipientType: {
            type: String,
            enum: ["User", "Crew"],
            default: "Crew",
          },
        },
      ],
      updates: [
        {
          message: {
            type: String,
            required: true,
            maxlength: [200, "Update message cannot exceed 200 characters"],
          },
          addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          type: {
            type: String,
            enum: ["status_update", "location_update", "general", "urgent"],
            default: "general",
          },
        },
      ],
    },

    // Audit Fields
    audit: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    collection: "assignments",
  }
);

// Indexes for performance
assignmentSchema.index({ "incident.incidentId": 1 });
assignmentSchema.index({ "resource.vehicleId": 1 });
assignmentSchema.index({ "resource.primaryCrewId": 1 });
assignmentSchema.index({ "dispatch.assignedBy": 1 });
assignmentSchema.index({ "dispatch.assignedAt": -1 });
assignmentSchema.index({ "response.status": 1 });
assignmentSchema.index({ "dispatch.priority": 1 });
assignmentSchema.index({ "location.dispatchLocation": "2dsphere" });

// Compound indexes
assignmentSchema.index({ "response.status": 1, "dispatch.assignedAt": -1 });
assignmentSchema.index({ "resource.vehicleId": 1, "response.status": 1 });

// Pre-save middleware to calculate performance metrics and update timestamps
assignmentSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();

  // Calculate response time (assignment to en_route)
  if (
    this.response.enRouteAt &&
    this.dispatch.assignedAt &&
    !this.performance.responseTime
  ) {
    this.performance.responseTime = Math.round(
      (this.response.enRouteAt - this.dispatch.assignedAt) / 1000
    );
  }

  // Calculate arrival time (assignment to on_scene)
  if (
    this.response.onSceneAt &&
    this.dispatch.assignedAt &&
    !this.performance.arrivalTime
  ) {
    this.performance.arrivalTime = Math.round(
      (this.response.onSceneAt - this.dispatch.assignedAt) / 1000
    );
  }

  // Calculate on-scene time (on_scene to completed)
  if (
    this.response.completedAt &&
    this.response.onSceneAt &&
    !this.performance.onSceneTime
  ) {
    this.performance.onSceneTime = Math.round(
      (this.response.completedAt - this.response.onSceneAt) / 1000
    );
  }

  // Calculate total duration (assignment to completed)
  if (
    this.response.completedAt &&
    this.dispatch.assignedAt &&
    !this.performance.totalDuration
  ) {
    this.performance.totalDuration = Math.round(
      (this.response.completedAt - this.dispatch.assignedAt) / 1000
    );
  }

  next();
});

// Virtual for response time in minutes
assignmentSchema.virtual("responseTimeMinutes").get(function () {
  return this.performance.responseTime
    ? Math.round(this.performance.responseTime / 60)
    : null;
});

// Virtual for arrival time in minutes
assignmentSchema.virtual("arrivalTimeMinutes").get(function () {
  return this.performance.arrivalTime
    ? Math.round(this.performance.arrivalTime / 60)
    : null;
});

// Method to accept assignment
assignmentSchema.methods.acceptAssignment = function (crewId) {
  if (this.response.status !== "assigned") {
    throw new Error("Assignment cannot be accepted in current status");
  }

  this.response.status = "accepted";
  this.response.acceptedAt = new Date();
  this.response.acceptedBy = crewId;

  return this.save();
};

// Method to decline assignment
assignmentSchema.methods.declineAssignment = function (reason) {
  if (this.response.status !== "assigned") {
    throw new Error("Assignment cannot be declined in current status");
  }

  this.response.status = "declined";
  this.response.declinedAt = new Date();
  this.response.declineReason = reason;

  return this.save();
};

// Method to update status
assignmentSchema.methods.updateStatus = function (newStatus, userId) {
  const validTransitions = {
    assigned: ["accepted", "declined", "cancelled"],
    accepted: ["en_route", "cancelled"],
    en_route: ["on_scene", "cancelled"],
    on_scene: ["completed", "cancelled"],
    completed: [],
    declined: [],
    cancelled: [],
  };

  if (!validTransitions[this.response.status].includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${this.response.status} to ${newStatus}`
    );
  }

  const timestamp = new Date();
  this.response.status = newStatus;

  switch (newStatus) {
    case "en_route":
      this.response.enRouteAt = timestamp;
      break;
    case "on_scene":
      this.response.onSceneAt = timestamp;
      break;
    case "completed":
      this.response.completedAt = timestamp;
      break;
    case "cancelled":
      this.response.cancelledAt = timestamp;
      break;
  }

  // Add update to communication log
  this.communication.updates.push({
    message: `Status updated to ${newStatus}`,
    addedBy: userId,
    type: "status_update",
  });

  return this.save();
};

// Static method to find active assignments
assignmentSchema.statics.findActiveAssignments = function () {
  return this.find({
    "response.status": {
      $in: ["assigned", "accepted", "en_route", "on_scene"],
    },
  })
    .populate(
      "incident.incidentId resource.vehicleId resource.primaryCrewId resource.additionalCrew"
    )
    .sort({ "dispatch.assignedAt": -1 });
};

// Static method to find assignments by vehicle
assignmentSchema.statics.findByVehicle = function (vehicleId) {
  return this.find({
    "resource.vehicleId": vehicleId,
  })
    .populate("incident.incidentId")
    .sort({ "dispatch.assignedAt": -1 });
};

// Static method to get performance statistics
assignmentSchema.statics.getPerformanceStats = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        "response.status": "completed",
        "dispatch.assignedAt": {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: "$performance.responseTime" },
        avgArrivalTime: { $avg: "$performance.arrivalTime" },
        totalAssignments: { $sum: 1 },
        minResponseTime: { $min: "$performance.responseTime" },
        maxResponseTime: { $max: "$performance.responseTime" },
      },
    },
  ]);
};

module.exports = mongoose.model("Assignment", assignmentSchema);
