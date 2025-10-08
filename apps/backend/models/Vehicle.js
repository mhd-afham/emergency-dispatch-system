const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    // Vehicle Registration Information
    registration: {
      plateNumber: {
        type: String,
        required: [true, "Plate number is required"],
        unique: true,
        trim: true,
        uppercase: true,
        match: [
          /^[A-Z]{2,3}-[0-9]{4}$/,
          "Please enter a valid Sri Lankan plate number (e.g., CAB-1234)",
        ],
      },
      vehicleType: {
        type: String,
        required: [true, "Vehicle type is required"],
        enum: {
          values: [
            "Ambulance",
            "Fire Engine",
            "Rescue Vehicle",
            "Support Vehicle",
          ],
          message:
            "Invalid vehicle type. Allowed types: Ambulance, Fire Engine, Rescue Vehicle, Support Vehicle",
        },
      },
      make: {
        type: String,
        required: [true, "Vehicle make is required"],
        trim: true,
        maxlength: [50, "Make cannot exceed 50 characters"],
      },
      model: {
        type: String,
        required: [true, "Vehicle model is required"],
        trim: true,
        maxlength: [50, "Model cannot exceed 50 characters"],
      },
      year: {
        type: Number,
        required: [true, "Vehicle year is required"],
        min: [1990, "Vehicle year cannot be before 1990"],
        max: [
          new Date().getFullYear() + 1,
          "Vehicle year cannot be in the future",
        ],
      },
      registrationDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Current Status Information
    status: {
      operational: {
        type: String,
        enum: ["active", "maintenance", "out_of_service"],
        default: "active",
      },
      currentStatus: {
        type: String,
        enum: ["available", "assigned", "en_route", "on_scene", "returning"],
        default: "available",
      },
      currentLocation: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          validate: {
            validator: function (coords) {
              // Validate coordinates are within Sri Lankan boundaries
              if (!coords || coords.length !== 2) return false;
              const [lng, lat] = coords;
              return lng >= 79.5 && lng <= 81.9 && lat >= 5.9 && lat <= 9.9;
            },
            message: "Coordinates must be within Sri Lankan boundaries",
          },
        },
      },
      lastLocationUpdate: {
        type: Date,
        default: Date.now,
      },
    },

    // Current Assignment Information
    assignment: {
      currentIncidentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
        default: null,
      },
      assignedAt: Date,
      crew: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Crew",
        },
      ],
    },

    // Equipment Information
    equipment: {
      checklistTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EquipmentChecklistTemplate",
      },
      lastCheckDate: Date,
      nextMaintenanceDate: Date,
      items: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          type: {
            type: String,
            enum: [
              "medical_equipment",
              "medical_supply",
              "safety_equipment",
              "communication",
              "other",
            ],
            required: true,
          },
          serialNumber: {
            type: String,
            trim: true,
          },
          status: {
            type: String,
            enum: [
              "operational",
              "needs_maintenance",
              "out_of_order",
              "missing",
            ],
            default: "operational",
          },
          quantity: {
            type: Number,
            default: 1,
            min: 0,
          },
          lastChecked: Date,
        },
      ],
    },

    // Station Assignment
    station: {
      homeStationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
        required: [true, "Home station is required"],
      },
      currentStationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
      },
    },

    // System Fields
    isActive: {
      type: Boolean,
      default: true,
    },

    // Registration Status (for tracking registration lifecycle)
    registrationStatus: {
      status: {
        type: String,
        enum: {
          values: ["pending", "approved", "rejected"],
          message: "Status must be pending, approved, or rejected",
        },
        default: "pending",
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: {
        type: Date,
      },
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      rejectedAt: {
        type: Date,
      },
      rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [1000, "Registration notes cannot exceed 1000 characters"],
      },
    },

    // Audit Fields
    audit: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Registration Status (for tracking approval/rejection workflow)
    registrationStatus: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending", // ← Safe for your system!
      },
      // Separate fields (clear audit trail)
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvedAt: { type: Date },
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rejectedAt: { type: Date },
      rejectionReason: { type: String, maxlength: 500 },
      notes: { type: String, maxlength: 1000 },
    },
  },
  {
    timestamps: true,
    collection: "vehicles",
  }
);

// Indexes for performance
// Note: plateNumber already has unique: true, so no need for separate index
vehicleSchema.index({ "registration.vehicleType": 1 });
vehicleSchema.index({ "status.operational": 1 });
vehicleSchema.index({ "status.currentStatus": 1 });
vehicleSchema.index({ "status.currentLocation": "2dsphere" }); // Geospatial index
vehicleSchema.index({ "assignment.currentIncidentId": 1 });
vehicleSchema.index({ "station.homeStationId": 1 });
vehicleSchema.index({ isActive: 1 });
vehicleSchema.index({ "registrationStatus.status": 1 }); // Registration status index

// Pre-save middleware to update timestamps
vehicleSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();
  next();
});

// Virtual for full vehicle identifier
vehicleSchema.virtual("identifier").get(function () {
  return `${this.registration.vehicleType} - ${this.registration.plateNumber}`;
});

// Method to check if vehicle is available for dispatch
vehicleSchema.methods.isAvailableForDispatch = function () {
  return (
    this.isActive &&
    this.status.operational === "active" &&
    this.status.currentStatus === "available"
  );
};

// Static method to find available vehicles by type
vehicleSchema.statics.findAvailableByType = function (vehicleType) {
  return this.find({
    "registration.vehicleType": vehicleType,
    isActive: true,
    "status.operational": "active",
    "status.currentStatus": "available",
  });
};

// Static method to find vehicles near location
vehicleSchema.statics.findNearLocation = function (
  longitude,
  latitude,
  maxDistance = 10000
) {
  return this.find({
    "status.currentLocation": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    isActive: true,
    "status.operational": "active",
  });
};

// Static method to find pending vehicle registrations
vehicleSchema.statics.findPendingRegistrations = function () {
  return this.find({
    "registrationStatus.status": "pending",
  })
    .populate("audit.createdBy", "firstName lastName email")
    .populate("registration.approvedBy", "firstName lastName email")
    .sort({ "audit.createdAt": -1 });
};

module.exports = mongoose.model("Vehicle", vehicleSchema);
