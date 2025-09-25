const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendEmail, emailTemplates } = require("../utils/emailService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Set JWT Token Cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.personal.email,
        role: user.auth.role,
        firstName: user.personal.firstName,
        lastName: user.personal.lastName,
        isActive: user.settings.isActive,
        lastLogin: user.settings.lastLogin,
        employeeId: user.auth.employeeId,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      role = "Citizen",
    } = req.body;

    // Validate required fields
    if (!email || !username || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Create temporary user instance for password validation
    const tempUser = new User();
    const passwordValidation = tempUser.validatePasswordStrength(password);

    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      "personal.email": email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Restrict role assignment (only admin can assign non-citizen roles)
    const restrictedRoles = [
      "Admin",
      "Supervisor",
      "Dispatcher",
      "Call Taker",
      "Field Crew",
    ];
    if (restrictedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message:
          "Cannot self-register for restricted roles. Please contact administrator.",
      });
    }

    // Create user
    const user = await User.create({
      personal: {
        firstName,
        lastName,
        email,
        phone,
      },
      auth: {
        password,
        role,
      },
    });

    // Send success response with token
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Registration error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // Validate email/username and password
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/username and password",
      });
    }

    // Check for user (find by email)
    const user = await User.findOne({
      "personal.email": login,
    }).select("+auth.password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
      });
    }

    // Check if account is active
    if (!user.settings.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts and update last login
    user.settings.loginAttempts = 0;
    user.settings.lockUntil = undefined;
    user.settings.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.personal.email,
        role: user.auth.role,
        firstName: user.personal.firstName,
        lastName: user.personal.lastName,
        phone: user.personal.phone,
        isActive: user.settings.isActive,
        lastLogin: user.settings.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user data",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update profile fields
    if (firstName) user.personal.firstName = firstName;
    if (lastName) user.personal.lastName = lastName;
    if (phone) user.personal.phone = phone;
    if (preferences) {
      user.settings.preferences = {
        ...user.settings.preferences,
        ...preferences,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.personal.email,
        role: user.auth.role,
        firstName: user.personal.firstName,
        lastName: user.personal.lastName,
        phone: user.personal.phone,
        preferences: user.settings.preferences,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    const user = await User.findById(req.user.id).select("+auth.password");

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Validate password strength
    const passwordValidation = user.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }

    // Check if password was used recently
    const isReused = await user.isPasswordReused(newPassword);
    if (isReused) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot reuse a recently used password. Please choose a different password.",
      });
    }

    // Add current password to history before updating
    await user.addPasswordToHistory(currentPassword);

    // Update password
    user.auth.password = newPassword;
    user.auth.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      passwordStrength: passwordValidation.strength,
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating password",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email address",
      });
    }

    const user = await User.findOne({ "personal.email": email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address",
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset url for frontend
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;

    try {
      // Send password reset email
      const emailTemplate = emailTemplates.passwordReset(
        resetUrl,
        user.personal.firstName || user.personal.email
      );

      const emailResult = await sendEmail({
        to: user.personal.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      if (emailResult.success) {
        console.log("✅ Password reset email sent to:", email);
        if (emailResult.previewUrl) {
          console.log("📧 Preview URL:", emailResult.previewUrl);
        }

        res.status(200).json({
          success: true,
          message: "Password reset email sent successfully",
          // Include preview URL in development for testing
          ...(process.env.NODE_ENV !== "production" &&
            emailResult.previewUrl && {
              previewUrl: emailResult.previewUrl,
            }),
        });
      } else {
        throw new Error(emailResult.error || "Failed to send email");
      }
    } catch (error) {
      console.error("❌ Email send error:", error);
      user.settings.resetPasswordToken = undefined;
      user.settings.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing forgot password request",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, newPassword, token } = req.body;

    // Handle both old format (password, confirmPassword) and new format (newPassword, token)
    const finalPassword = newPassword || password;
    const finalConfirmPassword = confirmPassword;
    const resetToken = token || req.params.resettoken;

    if (!finalPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide password",
      });
    }

    // Only require confirmPassword if it's the old format
    if (finalConfirmPassword && finalPassword !== finalConfirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      "settings.resetPasswordToken": resetPasswordToken,
      "settings.resetPasswordExpire": { $gt: Date.now() },
    }).select("+auth.password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Validate password strength
    const passwordValidation = user.validatePasswordStrength(finalPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }

    // Check if password was used recently
    const isReused = await user.isPasswordReused(finalPassword);
    if (isReused) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot reuse a recently used password. Please choose a different password.",
      });
    }

    // Add current password to history before updating (if it exists)
    if (user.auth.password) {
      await user.addPasswordToHistory(user.auth.password);
    }

    // Set new password
    user.auth.password = finalPassword;
    user.auth.passwordChangedAt = new Date();
    user.settings.resetPasswordToken = undefined;
    user.settings.resetPasswordExpire = undefined;

    // Reset any login attempt restrictions
    user.settings.loginAttempts = 0;
    user.settings.lockUntil = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
    });
  }
};

// @desc    Verify reset password token
// @route   POST /api/auth/verify-reset-token
// @access  Public
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Please provide reset token",
        valid: false,
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      "settings.resetPasswordToken": resetPasswordToken,
      "settings.resetPasswordExpire": { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
        valid: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Reset token is valid",
      valid: true,
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error verifying reset token",
      valid: false,
    });
  }
};

// @desc    Validate password strength
// @route   POST /api/auth/validate-password
// @access  Public
const validatePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide password to validate",
      });
    }

    // Create a temporary user instance to use validation method
    const tempUser = new User();
    const validation = tempUser.validatePasswordStrength(password);

    res.status(200).json({
      success: true,
      validation: {
        isValid: validation.isValid,
        strength: validation.strength,
        errors: validation.errors,
        requirements: {
          minLength: password.length >= 8,
          hasUpperCase: /[A-Z]/.test(password),
          hasLowerCase: /[a-z]/.test(password),
          hasNumbers: /\d/.test(password),
          hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        },
      },
    });
  } catch (error) {
    console.error("Password validation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error validating password",
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      "auth.emailVerificationToken": token,
      "auth.emailVerificationExpire": { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.auth.isEmailVerified = true;
    user.auth.emailVerificationToken = undefined;
    user.auth.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error verifying email",
    });
  }
};

// @desc    Admin create user
// @route   POST /api/auth/admin/create-user
// @access  Private (Admin only)
const adminCreateUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      employeeId,
      role,
      department,
      phone,
      password,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !employeeId ||
      !role ||
      !department ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ "personal.email": email }, { "auth.employeeId": employeeId }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or employee ID already exists",
      });
    }

    // Validate password strength
    const tempUser = new User();
    const passwordValidation = tempUser.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
      });
    }

    // Create user
    const user = await User.create({
      personal: {
        firstName,
        lastName,
        email,
        phone,
      },
      auth: {
        employeeId,
        password,
        role,
      },
      work: {
        department,
      },
      settings: {
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    // Add password to history
    await user.addPasswordToHistory(password);
    await user.save();

    // Remove password from response
    const userResponse = await User.findById(user._id).select(
      "-auth.password -auth.passwordHistory"
    );

    res.status(201).json({
      success: true,
      message: "User account created successfully",
      data: userResponse,
    });

    // Log the action
    console.log(
      `✅ User created by admin ${req.user.personal.email}: ${email} (${role})`
    );
  } catch (error) {
    console.error("Admin create user error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${
          field.includes("email") ? "email" : "employee ID"
        } already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating user account",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  validatePassword,
  verifyEmail,
  adminCreateUser,
};
