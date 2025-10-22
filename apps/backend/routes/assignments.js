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
 * @route   GET /api/assignments/history
 * @desc    Get assignment history with advanced filtering and search
 * @access  Dispatchers, Supervisors, Admins
 */
router.get("/history", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view assignment history",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  AssignmentController.getAssignmentHistory(req, res, next);
});

/**
 * @route   GET /api/assignments/statistics
 * @desc    Get assignment statistics and analytics
 * @access  Dispatchers, Supervisors, Admins
 */
router.get("/statistics", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view assignment statistics",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }

  AssignmentController.getAssignmentStatistics(req, res, next);
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
 * @route   GET /api/assignments/:id
 * @desc    Get assignment by ID
 * @access  All authenticated users
 * @note    This route must be AFTER specific routes like /history, /statistics to avoid conflicts
 */
router.get("/:id", (req, res, next) => {
  AssignmentController.getAssignmentById(req, res, next);
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
 * @route   PATCH /api/assignments/:id/cancel
 * @desc    Cancel/Recall an assignment (sets status to cancelled)
 * @access  Dispatchers, Supervisors, Admins
 * @body    reason (optional) - Cancellation reason
 */
router.patch("/:id/cancel", (req, res, next) => {
  // Only dispatchers, supervisors, and admins can cancel assignments
  const allowedRoles = ["Dispatcher", "Admin", "Supervisor"];

  console.log(`🔐 Cancel assignment permission check:`, {
    user: req.user?.firstName + " " + req.user?.lastName,
    role: req.user?.auth?.role,
    allowedRoles,
    hasPermission: allowedRoles.includes(req.user?.auth?.role),
  });

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

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Permanently delete an assignment (only cancelled assignments)
 * @access  Admins only
 * @note    This is for CRUD demonstration. Only cancelled assignments can be deleted to preserve audit trail.
 */
router.delete("/:id", (req, res, next) => {
  // Only admins can permanently delete assignments
  const allowedRoles = ["Admin"];

  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to delete assignments",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
      note: "Only administrators can permanently delete assignments",
    });
  }

  AssignmentController.deleteAssignment(req, res, next);
});

module.exports = router;
