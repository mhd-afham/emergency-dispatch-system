const express = require("express");
const router = express.Router();
const VehicleController = require("../controllers/vehicleController");
const { authenticate } = require("../middleware/auth");

/**
 * Vehicle Routes for Emergency Dispatch System
 * All routes require authentication and appropriate role permissions
 * Implements routing for vehicle tracking, management, and status updates
 */

// Apply authentication middleware to all vehicle routes
router.use(authenticate);

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with their current status and location
 * @access  Dispatchers, Supervisors, Admins
 */
router.get("/", (req, res, next) => {
  // Verify user has permission to view vehicles
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view vehicles",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.getAllVehicles(req, res, next);
});

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get a specific vehicle by ID
 * @access  Dispatchers, Supervisors, Admins
 */
router.get("/:id", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view vehicle details",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.getVehicleById(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:id/status
 * @desc    Update vehicle status (operational status and current status)
 * @access  Dispatchers, Vehicle Operators, Supervisors, Admins
 */
router.put("/:id/status", (req, res, next) => {
  const allowedRoles = [
    "Dispatcher",
    "Vehicle Operator",
    "Admin",
    "Supervisor",
  ];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update vehicle status",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  VehicleController.updateVehicleStatus(req, res, next);
});

/**
 * @route   PUT /api/vehicles/:id/location
 * @desc    Update vehicle location (GPS coordinates)
 * @access  Vehicle Operators, Dispatchers, Supervisors, Admins
 */
router.put("/:id/location", (req, res, next) => {
  const allowedRoles = [
    "Vehicle Operator",
    "Dispatcher",
    "Admin",
    "Supervisor",
  ];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update vehicle location",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
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

module.exports = router;
