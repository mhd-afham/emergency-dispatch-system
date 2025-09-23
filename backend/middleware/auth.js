const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT Token and Authenticate User
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists in cookies (for web app)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (without password)
      const user = await User.findById(decoded.id).select("-auth.password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Access denied. User not found.",
        });
      }

      // Check if user is active
      if (!user.settings.isActive) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Account is deactivated.",
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

      // Add user to request object
      req.user = user;
      next();
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access denied. Token has expired.",
        });
      } else if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Access denied. Invalid token.",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Access denied. Token verification failed.",
        });
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

// Role-based Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please authenticate first.",
      });
    }

    if (!roles.includes(req.user.auth.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${
          req.user.auth.role
        }' is not authorized to access this resource. Required roles: ${roles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

// Admin Only Authorization
const adminOnly = authorize("Admin");

// Dispatcher and Admin Authorization
const dispatcherAndAdmin = authorize("Dispatcher", "Admin");

// Field Crew Authorization (including supervisors)
const fieldCrew = authorize("Field Crew", "Supervisor", "Admin");

// Call Taker and Above Authorization
const callTakerAndAbove = authorize(
  "Call Taker",
  "Dispatcher",
  "Supervisor",
  "Admin"
);

// All Internal Staff (excluding Citizens)
const internalStaff = authorize(
  "Call Taker",
  "Dispatcher",
  "Field Crew",
  "Supervisor",
  "Admin"
);

// Self or Admin Authorization (user can access own data or admin can access any)
const selfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Please authenticate first.",
    });
  }

  const isAdmin = req.user.auth.role === "Admin";
  const isSelf = req.user._id.toString() === req.params.id;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
    });
  }

  next();
};

// Optional Authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-auth.password");

        if (user && user.settings.isActive && !user.isLocked) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
        console.log("Optional auth failed:", error.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Audit Middleware (logs user actions)
const auditLog = (action, resource) => {
  return (req, res, next) => {
    // Store audit info in request for later logging
    req.auditInfo = {
      action,
      resource,
      userId: req.user ? req.user._id : null,
      userRole: req.user ? req.user.auth.role : "Anonymous",
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      timestamp: new Date(),
    };

    // Log the action
    console.log(
      `🔍 [AUDIT] ${req.auditInfo.userRole} (${req.auditInfo.userId}) performed ${action} on ${resource}`
    );

    next();
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // This is a basic implementation - in production, use redis or similar
  // For now, we'll rely on the User model's login attempt tracking
  next();
};

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  dispatcherAndAdmin,
  fieldCrew,
  callTakerAndAbove,
  internalStaff,
  selfOrAdmin,
  optionalAuth,
  auditLog,
  authRateLimit,
};
