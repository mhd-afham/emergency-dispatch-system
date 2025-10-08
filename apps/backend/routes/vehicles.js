const express = require("express");
const router = express.Router();
const VehicleController = require("../controllers/vehicleController");
const { authenticate, authorize, selfOrAdmin } = require("../middleware/auth");

/**
 * Vehicle Routes for Emergency Dispatch System
 * All routes require authentication and appropriate role permissions
 * Implements routing for vehicle tracking, management, registration, and approval
 * Includes vehicle tracking features (Afham) and registration/approval workflow (Inusha)
 */

// Apply authentication middleware to all vehicle routes
router.use(authenticate);

/**
 * @route   POST /api/vehicles
 * @desc    Register a new vehicle (US-010: Vehicle Registration)
 * @access  Admins, Supervisors
 */
router.post("/", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to register vehicles",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.registerVehicle(req, res, next);
});

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with filtering and pagination
 * @access  All authenticated users (filtered by role permissions)
 * @query   page, limit, status, vehicleType, stationId, search, sortBy, sortOrder
 */
router.get("/", VehicleController.getAllVehicles);

/**
 * @route   GET /api/vehicles/pending-approval
 * @desc    Get vehicles pending approval (US-011: Vehicle Registration Approval)
 * @access  Supervisors, Admins
 */
router.get("/pending-approval", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view pending approvals",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.getPendingApprovals(req, res, next);
});

/**
 * @route   GET /api/vehicles/approved
 * @desc    Get all approved vehicles
 * @access  Admins, Supervisors
 */
router.get("/approved", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view approved vehicles",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.getApprovedVehicles(req, res, next);
});

/**
 * @route   GET /api/vehicles/rejected
 * @desc    Get all rejected vehicles
 * @access  Admins, Supervisors
 */
router.get("/rejected", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view rejected vehicles",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.getRejectedVehicles(req, res, next);
});

/**
 * @route   POST /api/vehicles/validate-plate
 * @desc    Validate plate number uniqueness (real-time validation)
 * @access  Admins, Supervisors
 */
router.post("/validate-plate", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to validate plate numbers",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.validatePlateNumber(req, res, next);
});

/**
 * @route   GET /api/vehicles/available/:vehicleType
 * @desc    Get available vehicles by type for dispatch
 * @access  Dispatchers, Supervisors, Admins
 * @param   vehicleType - The type of vehicle (Ambulance, Fire Engine, Rescue Vehicle, Support Vehicle)
 */
router.get("/available/:vehicleType", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view available vehicles",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.getAvailableVehiclesByType(req, res, next);
});

/**
 * @route   GET /api/vehicles/near/:longitude/:latitude
 * @desc    Get vehicles near a location for dispatch optimization
 * @access  Dispatchers, Supervisors, Admins
 * @param   longitude - Longitude coordinate
 * @param   latitude - Latitude coordinate
 * @query   maxDistance - Maximum distance in meters (default: 10000)
 */
router.get("/near/:longitude/:latitude", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to search vehicles by location",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.getVehiclesNearLocation(req, res, next);
});

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get a specific vehicle by ID
 * @access  All authenticated users
 */
router.get("/:id", VehicleController.getVehicleById);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle information
 * @access  Admins, Supervisors (own station vehicles)
 */
router.put("/:id", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update vehicles",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.updateVehicle(req, res, next);
});

/**
 * @route   POST /api/vehicles/:id/approve
 * @desc    Approve a vehicle registration (US-011: Vehicle Registration Approval)
 * @access  Supervisors, Admins
 */
router.post("/:id/approve", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to approve vehicles",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.approveVehicle(req, res, next);
});

/**
 * @route   POST /api/vehicles/:id/reject
 * @desc    Reject a vehicle registration (US-011: Vehicle Registration Approval)
 * @access  Supervisors, Admins
 */
router.post("/:id/reject", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to reject vehicles",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.rejectVehicle(req, res, next);
});

/**
 * @route   PATCH /api/vehicles/:id/clear-rejection
 * @desc    Clear rejection status and allow resubmission
 * @access  Admins only
 */
router.patch("/:id/clear-rejection", (req, res, next) => {
  const allowedRoles = ["Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to clear rejection status",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.clearRejection(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:id/status
 * @desc    Update vehicle operational status
 * @access  Dispatchers, Field Crew, Supervisors, Admins
 */
router.put("/:id/status", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Field Crew", "Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update vehicle status",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.updateVehicleStatus(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:id/location
 * @desc    Update vehicle location (GPS tracking)
 * @access  Field Crew, Dispatchers, Supervisors, Admins
 */
router.put("/:id/location", (req, res, next) => {
  const allowedRoles = ["Field Crew", "Dispatcher", "Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update vehicle location",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.updateVehicleLocation(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:id/assignment
 * @desc    Assign or unassign vehicle to/from an incident
 * @access  Dispatchers, Supervisors, Admins
 */
router.put("/:id/assignment", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to assign vehicles",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.updateVehicleAssignment(req, res, next);
});

/**
 * @route   POST /api/vehicles/:vehicleId/assign-crew
 * @desc    Assign crew members to a vehicle (validates exactly one leader required)
 * @access  Supervisors, Admins
 */
router.post("/:vehicleId/assign-crew", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to assign crew to vehicles",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.assignCrewToVehicle(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:vehicleId/unassign-crew
 * @desc    Unassign crew members from a vehicle
 * @access  Supervisors, Admins
 */
router.put("/:vehicleId/unassign-crew", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to unassign crew from vehicles",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.unassignCrewFromVehicle(req, res, next);
});

// ===== REGISTRATION MANAGEMENT ROUTES =====

/**
 * @route   GET /api/vehicles/registrations/pending
 * @desc    Get all pending vehicle registrations
 * @access  Admins, Supervisors
 */
router.get("/registrations/pending", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view pending registrations",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.getPendingVehicleRegistrations(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:id/approve
 * @desc    Approve a vehicle registration (alternative endpoint)
 * @access  Admins, Supervisors
 */
router.put("/:id/approve", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to approve vehicle registrations",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.approveVehicleRegistration(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:id/reject
 * @desc    Reject a vehicle registration (alternative endpoint)
 * @access  Admins, Supervisors
 */
router.put("/:id/reject", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to reject vehicle registrations",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.rejectVehicleRegistration(req, res, next);
});

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Deactivate or permanently delete a vehicle
 * @access  Admins only
 */
router.delete("/:id", (req, res, next) => {
  const allowedRoles = ["Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to delete vehicles",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.deleteVehiclePermanently(req, res, next);
});

/**
 * @route   GET /api/vehicles/:id/history
 * @desc    Get vehicle assignment and status history
 * @access  Supervisors, Admins, Dispatchers
 */
router.get("/:id/history", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin", "Dispatcher"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view vehicle history",
      requiredRoles: allowedRoles,
    });
  }

  VehicleController.getVehicleHistory(req, res, next);
});

/**
 * Error handling middleware specific to vehicle routes
 */
router.use((error, req, res, next) => {
  console.error("🚨 Vehicle route error:", error);

  // Handle specific error types
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Vehicle validation failed",
      errors: error.errors,
    });
  }

  if (error.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Vehicle with this ${field} already exists`,
      field: field,
      value: error.keyValue[field],
    });
  }

  if (error.name === "CastError" && error.kind === "ObjectId") {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle ID format",
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: "Internal server error in vehicle operations",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

module.exports = router;
