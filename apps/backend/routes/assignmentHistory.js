const express = require("express");
const router = express.Router();
const AssignmentHistoryController = require("../controllers/assignmentHistoryController");
const { authenticate } = require("../middleware/auth");

/**
 * Assignment History Routes
 * All routes require authentication
 */

// Apply authentication middleware
router.use(authenticate);

/**
 * @route   GET /api/assignments/history
 * @desc    Get assignment history with search and filters
 * @access  All authenticated users
 * @query   search, assignmentId, incidentId, vehiclePlateNumber, crewLeaderName,
 *          status, priority, incidentType, vehicleType, dateFrom, dateTo,
 *          responseTimeMin, responseTimeMax, totalDurationMin, totalDurationMax,
 *          page, limit, sortBy, sortOrder
 */
router.get("/history", (req, res, next) => {
  AssignmentHistoryController.getAssignmentHistory(req, res, next);
});

/**
 * @route   GET /api/assignments/statistics
 * @desc    Get assignment statistics for dashboard
 * @access  All authenticated users
 * @query   dateFrom, dateTo
 */
router.get("/statistics", (req, res, next) => {
  AssignmentHistoryController.getStatistics(req, res, next);
});

module.exports = router;
