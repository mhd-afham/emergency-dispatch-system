const mongoose = require("mongoose");

/**
 * Simplified Report Model for Emergency Dispatch System
 * Stores generated analytics reports (PDF) for history and tracking
 * Streamlined version - removed unnecessary complexity
 */

const reportSchema = new mongoose.Schema(
  {
    // Basic Report Information
    reportId: {
      type: String,
      required: true,
      unique: true,
      match: /^RPT-\d{4}-\d{6}$/,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "incident_summary",
        "performance_analysis",
        "resource_utilization",
        "response_time",
        "equipment_status",
        "crew_performance",
        "operational_metrics",
      ],
    },

    // Time Period
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      range: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly", "custom"],
        required: true,
      },
    },

    // Report Data & Metrics
    data: {
      // Summary metrics
      summary: {
        totalIncidents: Number,
        averageResponseTime: String,
        resolutionRate: String,
        activeUnits: String,
      },

      // Incident breakdown
      incidentStatus: {
        pending: Number,
        assigned: Number,
        en_route: Number,
        on_scene: Number,
        resolved: Number,
      },

      incidentTypes: {
        medical: Number,
        fire: Number,
        rescue: Number,
        hazmat: Number,
        traffic: Number,
        other: Number,
      },

      // Resource status
      vehicleStatus: {
        ready: Number,
        maintenance: Number,
        outOfService: Number,
        total: Number,
      },

      crewStatus: {
        available: Number,
        onDuty: Number,
        total: Number,
      },

      // Top locations
      topLocations: [
        {
          location: String,
          count: Number,
        },
      ],

      // Additional metrics (flexible)
      additionalMetrics: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
    },

    // Status
    status: {
      type: String,
      enum: ["generating", "generated", "failed"],
      default: "generating",
    },
    
    errorMessage: {
      type: String,
    },

    // PDF Output
    output: {
      filename: {
        type: String,
        required: true,
      },
      url: {
        type: String,
      },
      size: {
        type: Number,
        min: 0,
      },
      generatedAt: {
        type: Date,
      },
      downloadCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Access Control
    access: {
      visibility: {
        type: String,
        enum: ["internal", "restricted"],
        default: "internal",
      },
      authorizedRoles: [
        {
          type: String,
          enum: ["admin", "supervisor", "dispatcher"],
        },
      ],
    },

    // Audit Trail
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
    },
  },
  {
    timestamps: true,
    collection: "reports",
  }
);

// ============================================================================
// INDEXES
// ============================================================================

reportSchema.index({ reportId: 1 }, { unique: true });
reportSchema.index({ type: 1 });
reportSchema.index({ "period.startDate": 1, "period.endDate": 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ "audit.createdBy": 1 });
reportSchema.index({ "audit.createdAt": -1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

// File size in human-readable format
reportSchema.virtual("output.sizeFormatted").get(function () {
  if (!this.output.size) return "N/A";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (this.output.size === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(this.output.size) / Math.log(1024)));
  return Math.round(this.output.size / Math.pow(1024, i), 2) + " " + sizes[i];
});

// Report age in days
reportSchema.virtual("daysOld").get(function () {
  if (!this.audit.createdAt) return 0;
  const now = new Date();
  const created = new Date(this.audit.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Mark report as generated successfully
 */
reportSchema.methods.markAsGenerated = function (url, size) {
  this.status = "generated";
  this.output.url = url;
  this.output.size = size;
  this.output.generatedAt = new Date();
  return this.save();
};

/**
 * Mark report as failed
 */
reportSchema.methods.markAsFailed = function (errorMessage) {
  this.status = "failed";
  this.errorMessage = errorMessage;
  return this.save();
};

/**
 * Increment download count
 */
reportSchema.methods.incrementDownloadCount = function () {
  this.output.downloadCount += 1;
  return this.save();
};

/**
 * Check if report is accessible by user role
 */
reportSchema.methods.isAccessibleByRole = function (userRole) {
  if (this.access.visibility === "internal") {
    return ["admin", "supervisor", "dispatcher"].includes(userRole);
  }
  if (this.access.visibility === "restricted") {
    return this.access.authorizedRoles.includes(userRole);
  }
  return false;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find reports by type and date range
 */
reportSchema.statics.findByTypeAndDateRange = function (
  type,
  startDate,
  endDate
) {
  return this.find({
    type: type,
    "period.startDate": { $gte: startDate },
    "period.endDate": { $lte: endDate },
    status: "generated",
  }).sort({ "audit.createdAt": -1 });
};

/**
 * Find recent reports
 */
reportSchema.statics.findRecent = function (limit = 10) {
  return this.find({ status: "generated" })
    .sort({ "audit.createdAt": -1 })
    .limit(limit)
    .populate("audit.createdBy", "firstName lastName email");
};

/**
 * Get report statistics
 */
reportSchema.statics.getStatistics = async function (startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        "audit.createdAt": { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalDownloads: { $sum: "$output.downloadCount" },
        avgSize: { $avg: "$output.size" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
};

/**
 * Generate unique report ID
 */
reportSchema.statics.generateReportId = async function () {
  const year = new Date().getFullYear();
  const lastReport = await this.findOne({
    reportId: new RegExp(`^RPT-${year}-`),
  })
    .sort({ reportId: -1 })
    .select("reportId");

  let nextNumber = 1;
  if (lastReport) {
    const lastNumber = parseInt(lastReport.reportId.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  const paddedNumber = nextNumber.toString().padStart(6, "0");
  return `RPT-${year}-${paddedNumber}`;
};

/**
 * Clean up old failed reports (older than 7 days)
 */
reportSchema.statics.cleanupFailedReports = async function () {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await this.deleteMany({
    status: "failed",
    "audit.createdAt": { $lt: sevenDaysAgo },
  });

  return result.deletedCount;
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Pre-save validation
reportSchema.pre("save", function (next) {
  // Validate date range
  if (this.period.startDate && this.period.endDate) {
    if (this.period.startDate > this.period.endDate) {
      next(new Error("Start date must be before end date"));
    }
  }

  // Ensure download count is not negative
  if (this.output.downloadCount < 0) {
    this.output.downloadCount = 0;
  }

  next();
});

// Post-save logging
reportSchema.post("save", function (doc) {
  console.log(`Report saved: ${doc.reportId} - Status: ${doc.status}`);
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
