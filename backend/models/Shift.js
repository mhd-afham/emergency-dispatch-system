const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    // Shift Basic Information
    shift: {
      name: {
        type: String,
        required: [true, "Shift name is required"],
        trim: true,
        maxlength: [100, "Shift name cannot exceed 100 characters"],
      },
      type: {
        type: String,
        required: [true, "Shift type is required"],
        enum: {
          values: ["regular", "overtime", "emergency"],
          message:
            "Invalid shift type. Allowed types: regular, overtime, emergency",
        },
      },
    },

    // Schedule Information
    schedule: {
      startTime: {
        type: String,
        required: [true, "Start time is required"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Please enter time in HH:MM format",
        ],
      },
      endTime: {
        type: String,
        required: [true, "End time is required"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Please enter time in HH:MM format",
        ],
      },
      date: {
        type: Date,
        required: [true, "Shift date is required"],
      },
      duration: {
        type: Number, // in hours
        required: [true, "Shift duration is required"],
        min: [1, "Shift duration must be at least 1 hour"],
        max: [24, "Shift duration cannot exceed 24 hours"],
      },
      recurrence: {
        type: String,
        enum: ["none", "daily", "weekly", "custom"],
        default: "none",
      },
    },

    // Staffing Requirements
    staffing: {
      requiredCrewCount: {
        type: Number,
        required: [true, "Required crew count is required"],
        min: [1, "At least 1 crew member is required"],
      },
      requiredRoles: [
        {
          type: String,
          enum: ["EMT", "Paramedic", "Firefighter", "Driver", "Supervisor"],
        },
      ],
      minimumCertificationLevel: {
        type: String,
        enum: ["Basic", "Intermediate", "Advanced", "Expert"],
        default: "Basic",
      },
      assignedCrew: [
        {
          crewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crew",
            required: true,
          },
          role: {
            type: String,
            enum: ["EMT", "Paramedic", "Firefighter", "Driver", "Supervisor"],
            required: true,
          },
          assignedAt: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["assigned", "confirmed", "completed", "absent", "cancelled"],
            default: "assigned",
          },
          assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
        },
      ],
      vehicleAssignments: [
        {
          vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
          },
          primaryCrewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crew",
            required: true,
          },
          additionalCrew: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Crew",
            },
          ],
          assignedAt: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["assigned", "active", "completed", "cancelled"],
            default: "assigned",
          },
        },
      ],
    },

    // Supervision
    supervision: {
      supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Supervisor is required"],
      },
      supervisorNotes: {
        type: String,
        maxlength: [500, "Supervisor notes cannot exceed 500 characters"],
      },
      backupSupervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // Status Information
    status: {
      current: {
        type: String,
        enum: ["planned", "active", "completed", "cancelled"],
        default: "planned",
      },
      actualStartTime: Date,
      actualEndTime: Date,
      cancelledReason: {
        type: String,
        maxlength: [200, "Cancellation reason cannot exceed 200 characters"],
      },
    },

    // Station Assignment
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: [true, "Station assignment is required"],
    },

    // Performance Metrics
    metrics: {
      incidentsHandled: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number, // in minutes
        default: 0,
      },
      crewAttendanceRate: {
        type: Number, // percentage
        default: 100,
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
  },
  {
    timestamps: true,
    collection: "shifts",
  }
);

// Indexes for performance
shiftSchema.index({ "schedule.date": 1 });
shiftSchema.index({ "shift.type": 1 });
shiftSchema.index({ "status.current": 1 });
shiftSchema.index({ stationId: 1 });
shiftSchema.index({ "supervision.supervisorId": 1 });
shiftSchema.index({ "staffing.assignedCrew.crewId": 1 });
shiftSchema.index({ "staffing.vehicleAssignments.vehicleId": 1 });

// Compound indexes
shiftSchema.index({ "schedule.date": 1, "status.current": 1 });
shiftSchema.index({ stationId: 1, "schedule.date": 1 });

// Pre-save middleware to update timestamps
shiftSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();

  // Calculate duration if not provided
  if (
    !this.schedule.duration &&
    this.schedule.startTime &&
    this.schedule.endTime
  ) {
    const [startHour, startMin] = this.schedule.startTime
      .split(":")
      .map(Number);
    const [endHour, endMin] = this.schedule.endTime.split(":").map(Number);

    let duration = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (duration < 0) duration += 24 * 60; // Handle overnight shifts

    this.schedule.duration = Math.round((duration / 60) * 100) / 100; // Round to 2 decimal places
  }

  next();
});

// Virtual for staffing percentage
shiftSchema.virtual("staffingPercentage").get(function () {
  if (this.staffing.requiredCrewCount === 0) return 0;
  const confirmedCrew = this.staffing.assignedCrew.filter(
    (crew) => crew.status === "confirmed" || crew.status === "completed"
  ).length;
  return Math.round((confirmedCrew / this.staffing.requiredCrewCount) * 100);
});

// Virtual for shift duration in readable format
shiftSchema.virtual("durationFormatted").get(function () {
  const hours = Math.floor(this.schedule.duration);
  const minutes = Math.round((this.schedule.duration - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Method to check if shift is fully staffed
shiftSchema.methods.isFullyStaffed = function () {
  const confirmedCrew = this.staffing.assignedCrew.filter(
    (crew) => crew.status === "confirmed" || crew.status === "completed"
  ).length;
  return confirmedCrew >= this.staffing.requiredCrewCount;
};

// Method to check if shift can be activated
shiftSchema.methods.canActivate = function () {
  return (
    this.status.current === "planned" &&
    this.staffingPercentage >= 80 && // At least 80% staffed
    new Date() >= new Date(this.schedule.date)
  );
};

// Method to add crew member to shift
shiftSchema.methods.addCrewMember = function (crewId, role, assignedBy) {
  if (this.staffing.assignedCrew.length >= this.staffing.requiredCrewCount) {
    throw new Error("Shift is already fully staffed");
  }

  // Check if crew member is already assigned
  const isAlreadyAssigned = this.staffing.assignedCrew.some(
    (crew) => crew.crewId.toString() === crewId.toString()
  );

  if (isAlreadyAssigned) {
    throw new Error("Crew member is already assigned to this shift");
  }

  this.staffing.assignedCrew.push({
    crewId: crewId,
    role: role,
    assignedBy: assignedBy,
    status: "assigned",
  });

  return this.save();
};

// Static method to find active shifts
shiftSchema.statics.findActiveShifts = function () {
  return this.find({
    "status.current": "active",
  }).populate(
    "staffing.assignedCrew.crewId staffing.vehicleAssignments.vehicleId"
  );
};

// Static method to find shifts by date range
shiftSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    "schedule.date": {
      $gte: startDate,
      $lte: endDate,
    },
  }).populate("stationId supervision.supervisorId");
};

// Static method to find understaffed shifts
shiftSchema.statics.findUnderstaffed = function (threshold = 80) {
  return this.aggregate([
    {
      $match: {
        "status.current": { $in: ["planned", "active"] },
      },
    },
    {
      $addFields: {
        confirmedCrewCount: {
          $size: {
            $filter: {
              input: "$staffing.assignedCrew",
              cond: { $in: ["$$this.status", ["confirmed", "completed"]] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        staffingPercentage: {
          $multiply: [
            { $divide: ["$confirmedCrewCount", "$staffing.requiredCrewCount"] },
            100,
          ],
        },
      },
    },
    {
      $match: {
        staffingPercentage: { $lt: threshold },
      },
    },
  ]);
};

module.exports = mongoose.model("Shift", shiftSchema);
