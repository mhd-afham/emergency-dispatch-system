const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema(
  {
    // Station Basic Information
    stationName: {
      type: String,
      required: [true, "Station name is required"],
      trim: true,
      maxlength: [100, "Station name cannot exceed 100 characters"],
    },

    // Location Information
    address: {
      type: String,
      required: [true, "Station address is required"],
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Station coordinates are required"],
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

    province: {
      type: String,
      required: [true, "Province is required"],
      enum: [
        "Western",
        "Central",
        "Southern",
        "Northern",
        "Eastern",
        "North Western",
        "North Central",
        "Uva",
        "Sabaragamuwa",
      ],
    },

    // Contact Information
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      match: [
        /^\+94[0-9]{9}$/,
        "Please enter a valid Sri Lankan phone number (+94xxxxxxxxx)",
      ],
    },

    contactEmail: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },

    // Station Details
    stationType: {
      type: String,
      required: [true, "Station type is required"],
      enum: {
        values: [
          "Fire Station",
          "Ambulance Station",
          "Rescue Station",
          "Multi-Purpose",
        ],
        message:
          "Invalid station type. Allowed types: Fire Station, Ambulance Station, Rescue Station, Multi-Purpose",
      },
    },

    capacity: {
      vehicleCapacity: {
        type: Number,
        required: [true, "Vehicle capacity is required"],
        min: [1, "Vehicle capacity must be at least 1"],
      },
      crewCapacity: {
        type: Number,
        required: [true, "Crew capacity is required"],
        min: [1, "Crew capacity must be at least 1"],
      },
    },

    // Operational Information
    operatingHours: {
      is24Hours: {
        type: Boolean,
        default: true,
      },
      openTime: {
        type: String,
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Please enter time in HH:MM format",
        ],
        default: "00:00",
      },
      closeTime: {
        type: String,
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Please enter time in HH:MM format",
        ],
        default: "23:59",
      },
    },

    // Coverage Area
    coverageArea: {
      radius: {
        type: Number, // in kilometers
        required: [true, "Coverage radius is required"],
        min: [1, "Coverage radius must be at least 1 km"],
        max: [100, "Coverage radius cannot exceed 100 km"],
      },
      districts: [
        {
          type: String,
          trim: true,
        },
      ],
      cities: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    // Station Commander/Manager
    stationCommander: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Station commander is required"],
    },

    // Current Resources
    currentResources: {
      vehicles: [
        {
          vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
          },
          status: {
            type: String,
            enum: ["stationed", "dispatched", "maintenance"],
            default: "stationed",
          },
        },
      ],
      crew: [
        {
          crewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crew",
          },
          status: {
            type: String,
            enum: ["on_duty", "off_duty", "dispatched"],
            default: "off_duty",
          },
        },
      ],
    },

    // System Fields
    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
    collection: "stations",
  }
);

// Indexes for performance
stationSchema.index({ stationName: 1 });
stationSchema.index({ province: 1 });
stationSchema.index({ stationType: 1 });
stationSchema.index({ coordinates: "2dsphere" }); // Geospatial index for location queries
stationSchema.index({ isActive: 1 });
stationSchema.index({ stationCommander: 1 });

// Pre-save middleware to update timestamps
stationSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();
  next();
});

// Virtual for available vehicles count
stationSchema.virtual("availableVehiclesCount").get(function () {
  return this.currentResources.vehicles.filter(
    (vehicle) => vehicle.status === "stationed"
  ).length;
});

// Virtual for on-duty crew count
stationSchema.virtual("onDutyCrewCount").get(function () {
  return this.currentResources.crew.filter(
    (crew) => crew.status === "on_duty"
  ).length;
});

// Method to check if station can handle new incident
stationSchema.methods.canHandleIncident = function () {
  const availableVehicles = this.availableVehiclesCount;
  const onDutyCrew = this.onDutyCrewCount;

  return this.isActive && availableVehicles > 0 && onDutyCrew > 0;
};

// Static method to find stations near location
stationSchema.statics.findNearLocation = function (
  longitude,
  latitude,
  maxDistance = 25000
) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    isActive: true,
  });
};

// Static method to find stations by type
stationSchema.statics.findByType = function (stationType) {
  return this.find({
    stationType: stationType,
    isActive: true,
  });
};

// Static method to find stations with available resources
stationSchema.statics.findWithAvailableResources = function () {
  return this.find({
    isActive: true,
    $and: [
      { "currentResources.vehicles.status": "stationed" },
      { "currentResources.crew.status": "on_duty" },
    ],
  });
};

module.exports = mongoose.model("Station", stationSchema);
