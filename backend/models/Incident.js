const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    // Basic Incident Information
    incidentId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    
    // Caller Information
    caller: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, "Caller name cannot exceed 100 characters"],
      },
      phone: {
        type: String,
        required: [true, "Caller phone number is required"],
        match: [
          /^(\+94|0)[0-9]{9}$/,
          "Please enter a valid Sri Lankan phone number",
        ],
      },
      email: {
        type: String,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email address",
        ],
      },
      isCallback: {
        type: Boolean,
        default: false,
      },
    },

    // Incident Classification
    classification: {
      type: {
        type: String,
        required: [true, "Incident type is required"],
        enum: {
          values: ["Medical", "Fire", "Rescue", "Police", "Other"],
          message: "Invalid incident type. Allowed types: Medical, Fire, Rescue, Police, Other",
        },
        index: true,
      },
      subType: {
        type: String,
        trim: true,
        maxlength: [50, "Sub-type cannot exceed 50 characters"],
      },
      severity: {
        type: String,
        required: [true, "Severity level is required"],
        enum: {
          values: ["Critical", "High", "Medium", "Low"],
          message: "Invalid severity level. Allowed levels: Critical, High, Medium, Low",
        },
        index: true,
      },
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
    },

    // Location Information with Geospatial Support
    location: {
      address: {
        street: String,
        city: String,
        district: String,
        postalCode: String,
        fullAddress: {
          type: String,
          required: [true, "Full address is required"],
          maxlength: [500, "Address cannot exceed 500 characters"],
        },
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
          validate: {
            validator: function(coordinates) {
              return coordinates.length === 2 && 
                     coordinates[1] >= 5.5 && coordinates[1] <= 10.0 && // Latitude range for Sri Lanka
                     coordinates[0] >= 79.0 && coordinates[0] <= 82.0;   // Longitude range for Sri Lanka
            },
            message: "Coordinates must be within Sri Lanka boundaries [longitude, latitude]",
          },
        },
      },
      accuracy: {
        type: Number,
        min: 0,
        max: 1000,
        default: 50, // meters
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verificationMethod: {
        type: String,
        enum: ["GPS", "Address", "Manual", "Landmark"],
        default: "Address",
      },
    },

    // Incident Details
    details: {
      description: {
        type: String,
        required: [true, "Incident description is required"],
        maxlength: [2000, "Description cannot exceed 2000 characters"],
      },
      additionalInfo: {
        type: String,
        maxlength: [1000, "Additional info cannot exceed 1000 characters"],
      },
      hazards: [String],
      accessNotes: {
        type: String,
        maxlength: [500, "Access notes cannot exceed 500 characters"],
      },
      landmarksNearby: [String],
    },

    // Status Tracking
    status: {
      current: {
        type: String,
        enum: ["Logged", "Dispatched", "En Route", "On Scene", "Completed", "Cancelled"],
        default: "Logged",
        index: true,
      },
      history: [{
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
      }],
    },

    // Duplicate Detection Fields
    duplicateInfo: {
      isDuplicate: {
        type: Boolean,
        default: false,
      },
      originalIncident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
      },
      relatedIncidents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
      }],
      duplicateScore: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    // Dispatch Information
    dispatch: {
      assignedUnits: [{
        unitId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vehicle",
        },
        unitType: String,
        assignedAt: Date,
        estimatedArrival: Date,
        actualArrival: Date,
        status: {
          type: String,
          enum: ["Assigned", "En Route", "On Scene", "Completed"],
          default: "Assigned",
        },
      }],
      dispatchedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      dispatchedAt: Date,
    },

    // Communication Logs
    communications: [{
      type: {
        type: String,
        enum: ["SMS", "Call", "Email", "Push Notification"],
      },
      recipient: String,
      message: String,
      sentAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["Sent", "Delivered", "Failed"],
        default: "Sent",
      },
    }],

    // Audit Information
    audit: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      source: {
        type: String,
        enum: ["Web", "Mobile", "SMS", "Phone", "API"],
        default: "Web",
      },
      ipAddress: String,
      userAgent: String,
    },

    // Response Metrics
    metrics: {
      callDuration: Number, // seconds
      responseTime: Number, // seconds from creation to dispatch
      resolutionTime: Number, // seconds from creation to completion
      customerSatisfaction: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        feedback: String,
      },
    },
  },
  {
    timestamps: true,
    collection: "incidents",
  }
);

// Indexes for performance optimization
incidentSchema.index({ incidentId: 1 });
incidentSchema.index({ "classification.type": 1, "classification.severity": 1 });
incidentSchema.index({ "status.current": 1 });
incidentSchema.index({ "audit.createdAt": -1 });
incidentSchema.index({ "caller.phone": 1 });
incidentSchema.index({ "location.coordinates": "2dsphere" });
incidentSchema.index({ 
  "audit.createdAt": 1, 
  "location.coordinates": "2dsphere" 
}, { 
  name: "duplicate_detection_index" 
});

// Pre-save middleware to generate incident ID
incidentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      
      // Get the count of incidents created today
      const startOfDay = new Date(year, date.getMonth(), date.getDate());
      const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
      
      const todayIncidentCount = await this.constructor.countDocuments({
        "audit.createdAt": {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });

      // Generate incident ID: INC-YYYYMMDD-XXXX
      const sequenceNumber = String(todayIncidentCount + 1).padStart(4, "0");
      this.incidentId = `INC-${year}${month}${day}-${sequenceNumber}`;
      
      // Initialize status history
      this.status.history = [{
        status: "Logged",
        timestamp: new Date(),
        updatedBy: this.audit.createdBy,
        notes: "Incident logged into system",
      }];
      
    } catch (error) {
      return next(error);
    }
  }
  
  // Update audit information
  this.audit.updatedAt = new Date();
  next();
});

// Pre-save middleware to update status history
incidentSchema.pre("save", function (next) {
  if (this.isModified("status.current") && !this.isNew) {
    this.status.history.push({
      status: this.status.current,
      timestamp: new Date(),
      updatedBy: this.audit.updatedBy,
    });
  }
  next();
});

// Static method to find incidents within radius for duplicate detection
incidentSchema.statics.findNearbyIncidents = function(coordinates, radiusInMeters = 1000, timeWindowMinutes = 30) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        $maxDistance: radiusInMeters,
      },
    },
    "audit.createdAt": { $gte: timeWindow },
    "status.current": { $nin: ["Cancelled", "Completed"] },
  });
};

// Static method to get incident statistics
incidentSchema.statics.getStatistics = function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        "audit.createdAt": {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalIncidents: { $sum: 1 },
        byType: {
          $push: "$classification.type",
        },
        bySeverity: {
          $push: "$classification.severity",
        },
        byStatus: {
          $push: "$status.current",
        },
        avgResponseTime: {
          $avg: "$metrics.responseTime",
        },
        avgResolutionTime: {
          $avg: "$metrics.resolutionTime",
        },
      },
    },
  ];
  
  return this.aggregate(pipeline);
};

// Instance method to calculate duplicate score with another incident
incidentSchema.methods.calculateDuplicateScore = function(otherIncident) {
  let score = 0;
  
  // Location similarity (40% weight)
  const distance = this.getDistanceTo(otherIncident);
  if (distance < 100) score += 0.4; // Within 100 meters
  else if (distance < 500) score += 0.3; // Within 500 meters
  else if (distance < 1000) score += 0.2; // Within 1km
  
  // Time similarity (30% weight)
  const timeDiff = Math.abs(this.audit.createdAt - otherIncident.audit.createdAt);
  const minutesDiff = timeDiff / (1000 * 60);
  if (minutesDiff < 5) score += 0.3; // Within 5 minutes
  else if (minutesDiff < 15) score += 0.2; // Within 15 minutes
  else if (minutesDiff < 30) score += 0.1; // Within 30 minutes
  
  // Type similarity (20% weight)
  if (this.classification.type === otherIncident.classification.type) {
    score += 0.2;
  }
  
  // Caller similarity (10% weight)
  if (this.caller.phone === otherIncident.caller.phone) {
    score += 0.1;
  }
  
  return score;
};

// Instance method to calculate distance between incidents
incidentSchema.methods.getDistanceTo = function(otherIncident) {
  const [lon1, lat1] = this.location.coordinates.coordinates;
  const [lon2, lat2] = otherIncident.location.coordinates.coordinates;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
};

// Instance method to merge with another incident
incidentSchema.methods.mergeWith = async function(originalIncident) {
  // Mark this incident as duplicate
  this.duplicateInfo.isDuplicate = true;
  this.duplicateInfo.originalIncident = originalIncident._id;
  this.status.current = "Cancelled";
  
  // Add this incident to the original's related incidents
  if (!originalIncident.duplicateInfo.relatedIncidents.includes(this._id)) {
    originalIncident.duplicateInfo.relatedIncidents.push(this._id);
    await originalIncident.save();
  }
  
  await this.save();
  
  return originalIncident;
};

module.exports = mongoose.model("Incident", incidentSchema);