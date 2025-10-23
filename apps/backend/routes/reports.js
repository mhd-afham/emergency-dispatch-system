const express = require('express');
const router = express.Router();
const { generateReport, getReportSummary } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Report Routes for Emergency Dispatch System
 * All routes require authentication and admin authorization
 * 
 * Author: Inusha Nawanjana
 * Date: October 21, 2025
 */

/**
 * @route   POST /api/reports/generate
 * @desc    Generate report based on filters
 * @access  Private (Admin only)
 */
router.post(
  '/generate',
  authenticate,
  authorize('Admin'),
  generateReport
);

/**
 * @route   GET /api/reports/summary
 * @desc    Get report statistics summary
 * @access  Private (Admin only)
 */
router.get(
  '/summary',
  authenticate,
  authorize('Admin'),
  getReportSummary
);

module.exports = router;
