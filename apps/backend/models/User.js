const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    personal: {
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
        match: [
          /^\+94[0-9]{9}$/,
          "Please enter a valid Sri Lankan phone number (+94xxxxxxxxx)",
        ],
      },
    },

    // Authentication
    auth: {
      password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false, // Don't include password in queries by default
      },
      role: {
        type: String,
        required: [true, "Role is required"],
        enum: {
          values: [
            "Call Taker",
            "Dispatcher",
            "Field Crew",
            "Supervisor",
            "Admin",
            "Citizen",
          ],
          message:
            "Invalid role specified. Allowed roles: Call Taker, Dispatcher, Field Crew, Supervisor, Admin, Citizen",
        },
      },
      employeeId: {
        type: String,
        sparse: true, // Allow null but if present must be unique
        unique: true,
        match: [/^EMP[0-9]{6}$/, "Employee ID must be in format EMP123456"],
      },
    },

    // System Settings
    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      lastLogin: Date,
      loginAttempts: {
        type: Number,
        default: 0,
      },
      lockUntil: Date,
      emailVerified: {
        type: Boolean,
        default: false,
      },
      // Password reset functionality
      resetPasswordToken: String,
      resetPasswordExpire: Date,
      // Password history to prevent reuse
      passwordHistory: [
        {
          hash: String,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      preferences: {
        mapZoom: {
          type: Number,
          min: 8,
          max: 18,
          default: 12,
        },
        notificationSound: {
          type: Boolean,
          default: true,
        },
        theme: {
          type: String,
          enum: ["light", "dark", "system"],
          default: "system",
        },
      },
    },

    // Audit Fields
    audit: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      lastPasswordChange: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: "users",
  }
);

// Indexes for performance
// Note: email and employeeId already have unique indexes from schema definition
userSchema.index({ "auth.role": 1 });
userSchema.index({ "settings.isActive": 1 });

// Virtual for account locked status
userSchema.virtual("isLocked").get(function () {
  return !!(this.settings.lockUntil && this.settings.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("auth.password")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.auth.password = await bcrypt.hash(this.auth.password, salt);

    // Update last password change
    this.audit.lastPasswordChange = Date.now();

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.auth.password);
};

// Instance method to generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.personal.email,
      role: this.auth.role,
      employeeId: this.auth.employeeId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.settings.lockUntil && this.settings.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { "settings.lockUntil": 1 },
      $set: { "settings.loginAttempts": 1 },
    });
  }

  const updates = { $inc: { "settings.loginAttempts": 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.settings.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      "settings.lockUntil": Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      "settings.loginAttempts": 1,
      "settings.lockUntil": 1,
    },
  });
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = require("crypto").randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.settings.resetPasswordToken = require("crypto")
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  this.settings.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Check password strength
userSchema.methods.validatePasswordStrength = function (password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    strength:
      errors.length === 0 ? "strong" : errors.length <= 2 ? "medium" : "weak",
  };
};

// Check if password was used recently (prevent reuse)
userSchema.methods.isPasswordReused = async function (newPassword) {
  const maxHistory = 5; // Remember last 5 passwords

  if (
    !this.settings.passwordHistory ||
    this.settings.passwordHistory.length === 0
  ) {
    return false;
  }

  for (let historyEntry of this.settings.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, historyEntry.hash);
    if (isMatch) {
      return true;
    }
  }
  return false;
};

// Add current password to history
userSchema.methods.addPasswordToHistory = async function (password) {
  const maxHistory = 5;
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  if (!this.settings.passwordHistory) {
    this.settings.passwordHistory = [];
  }

  this.settings.passwordHistory.unshift({
    hash: hashedPassword,
    createdAt: new Date(),
  });

  // Keep only the most recent passwords
  if (this.settings.passwordHistory.length > maxHistory) {
    this.settings.passwordHistory = this.settings.passwordHistory.slice(
      0,
      maxHistory
    );
  }
};

// Static method to get users by role
userSchema.statics.getUsersByRole = function (role) {
  return this.find({
    "auth.role": role,
    "settings.isActive": true,
  }).select("-auth.password");
};

// Static method to create admin user (for seeding)
userSchema.statics.createAdminUser = async function () {
  const adminExists = await this.findOne({
    "auth.role": "Admin",
    "personal.email": "admin@respondr.lk",
  });

  if (!adminExists) {
    const adminUser = new this({
      personal: {
        firstName: "System",
        lastName: "Administrator",
        email: "admin@respondr.lk",
        phone: "+94701234567",
      },
      auth: {
        password: "AdminPass123!",
        role: "Admin",
        employeeId: "EMP000001",
      },
      settings: {
        emailVerified: true,
      },
    });

    await adminUser.save();
    console.log("✅ Admin user created: admin@respondr.lk / AdminPass123!");
    return adminUser;
  }

  return adminExists;
};

// Export the model
module.exports = mongoose.model("User", userSchema);
