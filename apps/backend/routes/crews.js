const express = require("express");
const router = express.Router();
const {
  getCrewByEmployeeId,
  getCrewAssignments,
  getCrewVehicle,
  updateCrewLocation,
  getAvailableLeaders,
} = require("../controllers/crewController");

// Import authentication middleware
const { protect, authorize } = require("../middleware/auth");

/**
 * Crew Routes
 * All routes require authentication
 * Some routes have role-based authorization
 */

// @route   GET /api/crews/by-employee/:employeeId
// @desc    Get crew member by employee ID (for mobile app login)
// @access  Private (Field Crew)
router.get(
  "/by-employee/:employeeId",
  protect,
  authorize("Field Crew", "Admin"),
  getCrewByEmployeeId
);

// @route   GET /api/crews/leaders/available
// @desc    Get available crew leaders for shift scheduling
// @access  Private (Supervisor, Admin)
router.get(
  "/leaders/available",
  protect,
  authorize("Supervisor", "Admin"),
  getAvailableLeaders
);

// @route   GET /api/crews/:crewId/assignments
// @desc    Get crew member's active assignments
// @access  Private (Field Crew, Dispatcher, Admin)
router.get(
  "/:crewId/assignments",
  protect,
  authorize("Field Crew", "Dispatcher", "Admin"),
  getCrewAssignments
);

// @route   GET /api/crews/:crewId/vehicle
// @desc    Get crew member's assigned vehicle
// @access  Private (Field Crew, Dispatcher, Admin)
router.get(
  "/:crewId/vehicle",
  protect,
  authorize("Field Crew", "Dispatcher", "Admin"),
  getCrewVehicle
);

// @route   PUT /api/crews/:crewId/location
// @desc    Update crew member's GPS location
// @access  Private (Field Crew)
router.put(
  "/:crewId/location",
  protect,
  authorize("Field Crew", "Admin"),
  updateCrewLocation
);

module.exports = router;
