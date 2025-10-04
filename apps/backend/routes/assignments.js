const express = require("express");
const router = express.Router();
const AssignmentController = require("../controllers/assignmentController");
const { authenticate } = require("../middleware/auth");

/**
 * Assignment Routes for Emergency Dispatch System
 * All routes require authentication and appropriate role permissions
 * Implements routing for resource dispatch and assignment management
 */

// Apply authentication middleware to all assignment routes
router.use(authenticate);

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment (Dispatch vehicle to incident)
 * @access  Dispatchers, Supervisors, Admins
 */
router.post("/", (req, res, next) => {
  // Verify user has permission to create assignments
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to create assignments",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  AssignmentController.createAssignment(req, res, next);
});

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments with optional filtering
 * @access  Dispatchers, Supervisors, Admins, Responders
 * @query   status, vehicleId, incidentId, limit
 */
router.get("/", (req, res, next) => {
  // All authenticated users can view assignments
  AssignmentController.getAllAssignments(req, res, next);
});

/**
 * @route   GET /api/assignments/:id
 * @desc    Get assignment by ID
 * @access  All authenticated users
 */
router.get("/:id", (req, res, next) => {
  AssignmentController.getAssignmentById(req, res, next);
});

/**
 * @route   GET /api/assignments/incident/:incidentId
 * @desc    Get all assignments for a specific incident
 * @access  All authenticated users
 */
router.get("/incident/:incidentId", (req, res, next) => {
  AssignmentController.getIncidentAssignments(req, res, next);
});

/**
 * @route   PUT /api/assignments/:id/status
 * @desc    Update assignment status (Accept, Decline, En Route, On Scene, Complete)
 * @access  Dispatchers, Responders, Admins, Supervisors
 */
router.put("/:id/status", (req, res, next) => {
  // Dispatchers, responders, field crew, admins, and supervisors can update assignment status
  const allowedRoles = [
    "Dispatcher",
    "Responder",
    "Field Crew",
    "Admin",
    "Supervisor",
  ];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update assignment status",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  AssignmentController.updateAssignmentStatus(req, res, next);
});

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Cancel/Recall an assignment (sets status to cancelled)
 * @access  Dispatchers, Supervisors, Admins
 * @body    reason (optional) - Cancellation reason
 */
router.delete("/:id", (req, res, next) => {
  // Only dispatchers, supervisors, and admins can cancel assignments
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to cancel assignments",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  AssignmentController.cancelAssignment(req, res, next);
});

module.exports = router;
