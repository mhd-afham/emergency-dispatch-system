const mongoose = require("mongoose");

const equipmentChecklistTemplateSchema = new mongoose.Schema(
  {
    // Vehicle Type Association
    vehicleType: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: {
        values: [
          "ambulance",
          "fire_engine",
          "rescue_vehicle",
          "support_vehicle",
        ],
        message:
          "Invalid vehicle type. Allowed types: ambulance, fire_engine, rescue_vehicle, support_vehicle",
      },
    },

    // Template Information
    template: {
      name: {
        type: String,
        required: [true, "Template name is required"],
        trim: true,
        maxlength: [100, "Template name cannot exceed 100 characters"],
      },
      description: {
        type: String,
        required: [true, "Template description is required"],
        trim: true,
        maxlength: [500, "Template description cannot exceed 500 characters"],
      },
      version: {
        type: String,
        required: [true, "Template version is required"],
        match: [/^\d+\.\d+$/, "Version must be in format X.Y (e.g., 2.1)"],
      },
    },

    // Checklist Structure
    checklist: {
      categories: [
        {
          name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
          items: [
            {
              name: {
                type: String,
                required: [true, "Item name is required"],
                trim: true,
              },
              type: {
                type: String,
                required: [true, "Item type is required"],
                enum: [
                  "equipment",
                  "supply",
                  "system",
                  "safety",
                  "documentation",
                ],
              },
              description: {
                type: String,
                trim: true,
              },
              required: {
                type: Boolean,
                default: true,
              },
              critical: {
                type: Boolean,
                default: false,
              },
              checkType: {
                type: String,
                required: [true, "Check type is required"],
                enum: [
                  "visual_inspection",
                  "functional_test",
                  "quantity_check",
                  "pressure_check",
                  "expiry_check",
                  "documentation_review",
                  "calibration_check",
                  "other",
                ],
              },
              expectedValue: {
                type: String,
                trim: true,
              },
              instructions: {
                type: String,
                trim: true,
              },
              frequency: {
                type: String,
                enum: [
                  "daily",
                  "weekly",
                  "monthly",
                  "quarterly",
                  "annually",
                  "as_needed",
                ],
                default: "daily",
              },
            },
          ],
        },
      ],
      instructions: {
        type: String,
        required: [true, "General instructions are required"],
        maxlength: [1000, "Instructions cannot exceed 1000 characters"],
      },
      estimatedDuration: {
        type: Number, // in minutes
        min: [5, "Estimated duration must be at least 5 minutes"],
        max: [120, "Estimated duration cannot exceed 120 minutes"],
      },
    },

    // Template Settings
    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
      requireSupervisorSignature: {
        type: Boolean,
        default: false,
      },
      allowPartialCompletion: {
        type: Boolean,
        default: false,
      },
      photoRequired: {
        type: Boolean,
        default: false,
      },
    },

    // Usage Statistics
    usage: {
      timesUsed: {
        type: Number,
        default: 0,
      },
      lastUsed: Date,
      averageCompletionTime: {
        type: Number, // in minutes
        default: 0,
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
      lastReviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
    collection: "equipment_checklist_templates",
  }
);

// Indexes for performance
equipmentChecklistTemplateSchema.index({ vehicleType: 1 });
equipmentChecklistTemplateSchema.index({ "template.name": 1 });
equipmentChecklistTemplateSchema.index({ "settings.isActive": 1 });
equipmentChecklistTemplateSchema.index({ "settings.isDefault": 1 });
equipmentChecklistTemplateSchema.index({ "template.version": 1 });

// Compound indexes
equipmentChecklistTemplateSchema.index({
  vehicleType: 1,
  "settings.isActive": 1,
});
equipmentChecklistTemplateSchema.index({
  vehicleType: 1,
  "settings.isDefault": 1,
});

// Pre-save middleware to update timestamps
equipmentChecklistTemplateSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();
  next();
});

// Virtual for total items count
equipmentChecklistTemplateSchema.virtual("totalItemsCount").get(function () {
  return this.checklist.categories.reduce(
    (total, category) => total + category.items.length,
    0
  );
});

// Virtual for critical items count
equipmentChecklistTemplateSchema.virtual("criticalItemsCount").get(function () {
  return this.checklist.categories.reduce(
    (total, category) =>
      total + category.items.filter((item) => item.critical).length,
    0
  );
});

// Virtual for required items count
equipmentChecklistTemplateSchema.virtual("requiredItemsCount").get(function () {
  return this.checklist.categories.reduce(
    (total, category) =>
      total + category.items.filter((item) => item.required).length,
    0
  );
});

// Method to validate template completeness
equipmentChecklistTemplateSchema.methods.validateTemplate = function () {
  const errors = [];

  // Check if template has at least one category
  if (!this.checklist.categories || this.checklist.categories.length === 0) {
    errors.push("Template must have at least one category");
  }

  // Check if each category has at least one item
  this.checklist.categories.forEach((category, catIndex) => {
    if (!category.items || category.items.length === 0) {
      errors.push(`Category '${category.name}' must have at least one item`);
    }

    // Check for duplicate item names within category
    const itemNames = category.items.map((item) => item.name.toLowerCase());
    const duplicates = itemNames.filter(
      (name, index) => itemNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      errors.push(
        `Category '${category.name}' has duplicate items: ${duplicates.join(
          ", "
        )}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// Method to create new version
equipmentChecklistTemplateSchema.methods.createNewVersion = function (
  newVersionNumber,
  updatedBy
) {
  const newTemplate = new this.constructor(this.toObject());
  newTemplate._id = undefined;
  newTemplate.template.version = newVersionNumber;
  newTemplate.audit.createdBy = updatedBy;
  newTemplate.audit.createdAt = Date.now();
  newTemplate.audit.updatedAt = Date.now();
  newTemplate.usage.timesUsed = 0;
  newTemplate.usage.lastUsed = undefined;
  newTemplate.usage.averageCompletionTime = 0;

  return newTemplate;
};

// Static method to find default template for vehicle type
equipmentChecklistTemplateSchema.statics.findDefaultForVehicleType = function (
  vehicleType
) {
  return this.findOne({
    vehicleType: vehicleType,
    "settings.isActive": true,
    "settings.isDefault": true,
  });
};

// Static method to find active templates by vehicle type
equipmentChecklistTemplateSchema.statics.findActiveByVehicleType = function (
  vehicleType
) {
  return this.find({
    vehicleType: vehicleType,
    "settings.isActive": true,
  }).sort({ "template.version": -1 });
};

// Static method to update usage statistics
equipmentChecklistTemplateSchema.statics.updateUsageStats = function (
  templateId,
  completionTime
) {
  return this.findByIdAndUpdate(
    templateId,
    {
      $inc: { "usage.timesUsed": 1 },
      $set: { "usage.lastUsed": new Date() },
    },
    { new: true }
  ).then((template) => {
    if (template && completionTime) {
      // Calculate new average completion time
      const currentAvg = template.usage.averageCompletionTime || 0;
      const count = template.usage.timesUsed;
      const newAvg = (currentAvg * (count - 1) + completionTime) / count;

      return this.findByIdAndUpdate(
        templateId,
        { $set: { "usage.averageCompletionTime": Math.round(newAvg) } },
        { new: true }
      );
    }
    return template;
  });
};

module.exports = mongoose.model(
  "EquipmentChecklistTemplate",
  equipmentChecklistTemplateSchema
);
