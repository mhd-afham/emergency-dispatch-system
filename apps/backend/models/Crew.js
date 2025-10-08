const mongoose = require("mongoose");

const crewSchema = new mongoose.Schema(
  {
    // Personal Information
    personal: {
      employeeId: {
        type: String,
        required: [true, "Employee ID is required"],
        unique: true,
        match: [/^EMP[0-9]{6}$/, "Employee ID must be in format EMP123456"],
      },
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [100, "First name cannot exceed 100 characters"],
      },
      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [100, "Last name cannot exceed 100 characters"],
      },
      email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email address",
        ],
      },
      phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [
          /^\+94[0-9]{9}$/,
          "Please enter a valid Sri Lankan phone number (+94xxxxxxxxx)",
        ],
      },
    },

    // Professional Information
    professional: {
      role: {
        type: String,
        required: [true, "Professional role is required"],
        enum: {
          values: ["EMT", "Paramedic", "Firefighter", "Driver", "Supervisor"],
          message:
            "Invalid role. Allowed roles: EMT, Paramedic, Firefighter, Driver, Supervisor",
        },
      },
      isLeader: {
        type: Boolean,
        default: false,
        required: [true, "Leader status is required"],
      },
      certificationLevel: {
        type: String,
        required: [true, "Certification level is required"],
        enum: {
          values: ["Basic", "Intermediate", "Advanced", "Expert"],
          message:
            "Invalid certification level. Allowed levels: Basic, Intermediate, Advanced, Expert",
        },
      },
      certifications: [
        {
          type: {
            type: String,
            required: true,
            trim: true,
          },
          number: {
            type: String,
            required: true,
            trim: true,
          },
          issuedBy: {
            type: String,
            required: true,
            trim: true,
          },
          issueDate: {
            type: Date,
            required: true,
          },
          expiryDate: {
            type: Date,
            required: true,
            validate: {
              validator: function (expiryDate) {
                return expiryDate > this.issueDate;
              },
              message: "Expiry date must be after issue date",
            },
          },
          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],
      specializations: [
        {
          type: String,
          enum: [
            "cardiac_care",
            "trauma",
            "pediatric",
            "respiratory",
            "hazmat",
            "rescue_operations",
            "fire_suppression",
            "medical_transport",
            "emergency_medicine",
            "other",
          ],
        },
      ],
      hireDate: {
        type: Date,
        required: [true, "Hire date is required"],
        validate: {
          validator: function (hireDate) {
            return hireDate <= Date.now();
          },
          message: "Hire date cannot be in the future",
        },
      },
    },

    // Current Status Information
    currentStatus: {
      availability: {
        type: String,
        enum: ["available", "on_duty", "off_duty", "on_leave", "training"],
        default: "off_duty",
      },
      shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
        default: null,
      },
      assignedVehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        default: null,
      },
      location: {
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
              if (!coords || coords.length !== 2) return true; // Optional field
              const [lng, lat] = coords;
              return lng >= 79.5 && lng <= 81.9 && lat >= 5.9 && lat <= 9.9;
            },
            message: "Coordinates must be within Sri Lankan boundaries",
          },
        },
      },
      lastLocationUpdate: Date,
    },

    // Settings and Emergency Contact
    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      emergencyContact: {
        name: {
          type: String,
          required: [true, "Emergency contact name is required"],
          trim: true,
        },
        relationship: {
          type: String,
          required: [true, "Emergency contact relationship is required"],
          enum: ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"],
        },
        phone: {
          type: String,
          required: [true, "Emergency contact phone is required"],
          match: [
            /^\+94[0-9]{9}$/,
            "Please enter a valid Sri Lankan phone number for emergency contact",
          ],
        },
      },
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
  },
  {
    timestamps: true,
    collection: "crews",
  }
);

// Indexes for performance
crewSchema.index({ "personal.employeeId": 1 });
crewSchema.index({ "personal.email": 1 });
crewSchema.index({ "professional.role": 1 });
crewSchema.index({ "professional.certificationLevel": 1 });
crewSchema.index({ "currentStatus.availability": 1 });
crewSchema.index({ "currentStatus.shiftId": 1 });
crewSchema.index({ "currentStatus.assignedVehicleId": 1 });
crewSchema.index({ "currentStatus.location": "2dsphere" }); // Geospatial index
crewSchema.index({ "settings.isActive": 1 });
crewSchema.index({ "registrationStatus.status": 1 }); // Registration status index

// Pre-save middleware to update timestamps
crewSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();
  next();
});

// Virtual for full name
crewSchema.virtual("fullName").get(function () {
  return `${this.personal.firstName} ${this.personal.lastName}`;
});

// Virtual for active certifications
crewSchema.virtual("activeCertifications").get(function () {
  return this.professional.certifications.filter(
    (cert) => cert.isActive && cert.expiryDate > Date.now()
  );
});

// Method to check if crew member is available for assignment
crewSchema.methods.isAvailableForAssignment = function () {
  return (
    this.settings.isActive &&
    this.currentStatus.availability === "available" &&
    this.activeCertifications.length > 0
  );
};

// Method to check if crew member has valid certifications
crewSchema.methods.hasValidCertifications = function () {
  const activeCerts = this.professional.certifications.filter(
    (cert) => cert.isActive && cert.expiryDate > Date.now()
  );
  return activeCerts.length > 0;
};

// Static method to find available crew by role
crewSchema.statics.findAvailableByRole = function (role) {
  return this.find({
    "professional.role": role,
    "settings.isActive": true,
    "currentStatus.availability": "available",
    "professional.certifications": {
      $elemMatch: {
        isActive: true,
        expiryDate: { $gt: new Date() },
      },
    },
  });
};

// Static method to find crew members with expiring certifications
crewSchema.statics.findExpiringCertifications = function (daysAhead = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysAhead);

  return this.find({
    "professional.certifications": {
      $elemMatch: {
        isActive: true,
        expiryDate: { $lte: expiryDate, $gt: new Date() },
      },
    },
  });
};

// Static method to find pending crew registrations
crewSchema.statics.findPendingRegistrations = function () {
  return this.find({
    "registrationStatus.status": "pending",
  })
    .populate("audit.createdBy", "firstName lastName email")
    .sort({ "audit.createdAt": -1 });
};

module.exports = mongoose.model("Crew", crewSchema);
