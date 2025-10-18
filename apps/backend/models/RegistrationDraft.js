const mongoose = require("mongoose");

/**
 * RegistrationDraft Schema
 * 
 * This is a NEW model created to support draft functionality
 * without modifying existing Vehicle or Crew models.
 * 
 * Stores incomplete registration forms that can be:
 * - Saved and resumed later
 * - Edited before submission
 * - Deleted if no longer needed
 * 
 * NOTE: This is a separate collection and does NOT modify
 * existing Vehicle or Crew schemas.
 */

const registrationDraftSchema = new mongoose.Schema(
  {
    // Type of registration
    registrationType: {
      type: String,
      enum: ["vehicle", "crew"],
      required: [true, "Registration type is required"],
    },

    // Draft title/name for easy identification
    draftTitle: {
      type: String,
      required: [true, "Draft title is required"],
      trim: true,
      maxlength: [200, "Draft title cannot exceed 200 characters"],
    },

    // Form data (stored as JSON - flexible structure)
    formData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Form data is required"],
    },

    // Current step in the wizard (for resuming)
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },

    // Completion percentage
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft",
    },

    // Audit fields
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
      lastEditedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    collection: "registration_drafts",
  }
);

// Indexes for performance
registrationDraftSchema.index({ registrationType: 1 });
registrationDraftSchema.index({ "audit.createdBy": 1 });
registrationDraftSchema.index({ status: 1 });
registrationDraftSchema.index({ "audit.createdAt": -1 });

// Pre-save middleware to update timestamps
registrationDraftSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();
  this.audit.lastEditedAt = Date.now();
  next();
});

// Virtual for days since creation
registrationDraftSchema.virtual("daysSinceCreation").get(function () {
  return Math.floor((new Date() - this.audit.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to calculate completion percentage based on filled fields
registrationDraftSchema.methods.calculateCompletion = function () {
  if (!this.formData) return 0;

  let totalFields = 0;
  let filledFields = 0;

  const countFields = (obj) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        countFields(obj[key]);
      } else {
        totalFields++;
        if (
          obj[key] !== null &&
          obj[key] !== undefined &&
          obj[key] !== "" &&
          !(Array.isArray(obj[key]) && obj[key].length === 0)
        ) {
          filledFields++;
        }
      }
    });
  };

  countFields(this.formData);

  const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  this.completionPercentage = percentage;
  return percentage;
};

// Static method to find drafts by user
registrationDraftSchema.statics.findByUser = function (userId) {
  return this.find({
    "audit.createdBy": userId,
    status: "draft",
  }).sort({ "audit.updatedAt": -1 });
};

// Static method to find drafts by type and user
registrationDraftSchema.statics.findByTypeAndUser = function (type, userId) {
  return this.find({
    registrationType: type,
    "audit.createdBy": userId,
    status: "draft",
  }).sort({ "audit.updatedAt": -1 });
};

// Static method to clean up old drafts (older than 30 days)
registrationDraftSchema.statics.cleanupOldDrafts = function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    "audit.createdAt": { $lt: cutoffDate },
    status: "draft",
  });
};

module.exports = mongoose.model("RegistrationDraft", registrationDraftSchema);
