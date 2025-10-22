const mongoose = require("mongoose");

const equipmentCheckSchema = new mongoose.Schema(
  {
    // Associated Vehicle and Crew
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle ID is required"],
    },
    crewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
      required: false, // Optional - may not exist for admin/supervisor users
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EquipmentChecklistTemplate",
      required: false, // Optional - may not exist for manual checklists
    },

    // Inspection Details
    inspection: {
      checkResults: [
        {
          categoryName: {
            type: String,
            required: true,
            trim: true,
          },
          itemName: {
            type: String,
            required: true,
            trim: true,
          },
          status: {
            type: String,
            required: true,
            enum: ["pass", "fail", "warning", "not_applicable", "skipped"],
          },
          actualValue: {
            type: String,
            trim: true,
          },
          notes: {
            type: String,
            maxlength: [500, "Notes cannot exceed 500 characters"],
          },
          photos: [
            {
              filename: {
                type: String,
                required: true,
              },
              url: {
                type: String,
                required: true,
              },
              caption: String,
              timestamp: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          checkedAt: {
            type: Date,
            default: Date.now,
          },
          checkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crew",
            required: false, // Optional - may not exist for admin/supervisor users
          },
        },
      ],
      overallStatus: {
        type: String,
        required: true,
        enum: ["pass", "fail", "conditional"],
      },
      criticalIssues: [
        {
          itemName: String,
          issue: String,
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
          },
        },
      ],
      recommendedActions: [
        {
          action: {
            type: String,
            required: true,
            maxlength: [200, "Action cannot exceed 200 characters"],
          },
          priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
          },
          dueDate: Date,
          assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          completed: {
            type: Boolean,
            default: false,
          },
          completedAt: Date,
        },
      ],
    },

    // Location and Timing
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
      stationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
      },
    },

    timing: {
      startedAt: {
        type: Date,
        required: [true, "Start time is required"],
      },
      completedAt: Date,
      duration: {
        type: Number, // in minutes
        min: 0,
      },
    },

    // Signatures and Approvals
    signatures: {
      crewMember: {
        signedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Crew",
          required: true,
        },
        signedAt: {
          type: Date,
          default: Date.now,
        },
        signature: String, // Base64 encoded signature or signature file path
      },
      supervisor: {
        signedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        signedAt: Date,
        signature: String,
        comments: {
          type: String,
          maxlength: [500, "Supervisor comments cannot exceed 500 characters"],
        },
      },
    },

    // Status and Workflow
    status: {
      current: {
        type: String,
        enum: [
          "in_progress",
          "completed",
          "approved",
          "rejected",
          "requires_review",
        ],
        default: "in_progress",
      },
      submittedAt: Date,
      reviewedAt: Date,
      approvedAt: Date,
      rejectionReason: {
        type: String,
        maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      },
    },

    // Audit Fields
    audit: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crew",
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
    collection: "equipment_checks",
  }
);

// Indexes for performance
equipmentCheckSchema.index({ vehicleId: 1 });
equipmentCheckSchema.index({ crewId: 1 });
equipmentCheckSchema.index({ templateId: 1 });
equipmentCheckSchema.index({ "timing.startedAt": -1 });
equipmentCheckSchema.index({ "timing.completedAt": -1 });
equipmentCheckSchema.index({ "inspection.overallStatus": 1 });
equipmentCheckSchema.index({ "status.current": 1 });
equipmentCheckSchema.index({ "location.coordinates": "2dsphere" });

// Compound indexes
equipmentCheckSchema.index({ vehicleId: 1, "timing.startedAt": -1 });
equipmentCheckSchema.index({ crewId: 1, "timing.startedAt": -1 });
equipmentCheckSchema.index({ "status.current": 1, "timing.startedAt": -1 });

// Pre-save middleware to calculate duration and update timestamps
equipmentCheckSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();

  // Calculate duration if completed
  if (
    this.timing.completedAt &&
    this.timing.startedAt &&
    !this.timing.duration
  ) {
    const durationMs = this.timing.completedAt - this.timing.startedAt;
    this.timing.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }

  // Auto-determine overall status based on check results
  if (this.inspection.checkResults.length > 0) {
    const hasFailures = this.inspection.checkResults.some(
      (result) => result.status === "fail"
    );
    const hasWarnings = this.inspection.checkResults.some(
      (result) => result.status === "warning"
    );

    if (hasFailures) {
      this.inspection.overallStatus = "fail";
    } else if (hasWarnings) {
      this.inspection.overallStatus = "conditional";
    } else {
      this.inspection.overallStatus = "pass";
    }
  }

  next();
});

// Virtual for completion percentage
equipmentCheckSchema.virtual("completionPercentage").get(function () {
  if (
    !this.inspection.checkResults ||
    this.inspection.checkResults.length === 0
  ) {
    return 0;
  }

  const completedResults = this.inspection.checkResults.filter(
    (result) => result.status !== "skipped"
  );

  return Math.round(
    (completedResults.length / this.inspection.checkResults.length) * 100
  );
});

// Virtual for pass rate
equipmentCheckSchema.virtual("passRate").get(function () {
  if (
    !this.inspection.checkResults ||
    this.inspection.checkResults.length === 0
  ) {
    return 0;
  }

  const passedResults = this.inspection.checkResults.filter(
    (result) => result.status === "pass"
  );

  return Math.round(
    (passedResults.length / this.inspection.checkResults.length) * 100
  );
});

// Method to add check result
equipmentCheckSchema.methods.addCheckResult = function (
  categoryName,
  itemName,
  status,
  checkedBy,
  actualValue,
  notes
) {
  this.inspection.checkResults.push({
    categoryName,
    itemName,
    status,
    checkedBy,
    actualValue,
    notes,
    checkedAt: new Date(),
  });

  return this.save();
};

// Method to complete inspection
equipmentCheckSchema.methods.completeInspection = function (crewMemberId) {
  if (this.status.current !== "in_progress") {
    throw new Error("Inspection is not in progress");
  }

  this.timing.completedAt = new Date();
  this.status.current = "completed";
  this.status.submittedAt = new Date();

  // Ensure crew member signature
  if (!this.signatures.crewMember.signedBy) {
    this.signatures.crewMember.signedBy = crewMemberId;
    this.signatures.crewMember.signedAt = new Date();
  }

  return this.save();
};

// Method to approve inspection
equipmentCheckSchema.methods.approveInspection = function (
  supervisorId,
  comments
) {
  if (
    this.status.current !== "completed" &&
    this.status.current !== "requires_review"
  ) {
    throw new Error("Inspection must be completed before approval");
  }

  this.status.current = "approved";
  this.status.approvedAt = new Date();
  this.signatures.supervisor = {
    signedBy: supervisorId,
    signedAt: new Date(),
    comments: comments,
  };

  return this.save();
};

// Method to reject inspection
equipmentCheckSchema.methods.rejectInspection = function (
  supervisorId,
  reason
) {
  if (
    this.status.current !== "completed" &&
    this.status.current !== "requires_review"
  ) {
    throw new Error("Inspection must be completed before rejection");
  }

  this.status.current = "rejected";
  this.status.rejectionReason = reason;
  this.signatures.supervisor = {
    signedBy: supervisorId,
    signedAt: new Date(),
    comments: reason,
  };

  return this.save();
};

// Static method to find recent checks by vehicle
equipmentCheckSchema.statics.findRecentByVehicle = function (
  vehicleId,
  days = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    vehicleId: vehicleId,
    "timing.startedAt": { $gte: startDate },
  })
    .populate("crewId templateId")
    .sort({ "timing.startedAt": -1 });
};

// Static method to find checks requiring review
equipmentCheckSchema.statics.findRequiringReview = function () {
  return this.find({
    "status.current": { $in: ["completed", "requires_review"] },
    "inspection.overallStatus": { $in: ["fail", "conditional"] },
  })
    .populate("vehicleId crewId templateId")
    .sort({ "status.submittedAt": 1 });
};

// Static method to get vehicle inspection statistics
equipmentCheckSchema.statics.getVehicleStats = function (
  vehicleId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        vehicleId: mongoose.Types.ObjectId(vehicleId),
        "timing.startedAt": {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$inspection.overallStatus",
        count: { $sum: 1 },
        avgDuration: { $avg: "$timing.duration" },
      },
    },
  ]);
};

module.exports = mongoose.model("EquipmentCheck", equipmentCheckSchema);
