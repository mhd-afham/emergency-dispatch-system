const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/incidentController');
const { authenticate } = require('../middleware/auth');

/**
 * Incident Routes for Emergency Dispatch System
 * All routes require authentication and appropriate role permissions
 * Implements routing for incident intake, triage, and management
 */

// Apply authentication middleware to all incident routes
router.use(authenticate);

/**
 * @route   POST /api/incidents
 * @desc    Create a new emergency incident (US-002: Emergency Call Logging)
 * @access  Call Takers, Dispatchers, Admins
 */
router.post('/', (req, res, next) => {
  // Verify user has permission to create incidents
  const allowedRoles = ['Call Taker', 'Dispatcher', 'Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to create incidents',
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role
    });
  }

  IncidentController.createIncident(req, res, next);
});

/**
 * @route   GET /api/incidents
 * @desc    Get all incidents with filtering and pagination
 * @access  All authenticated users (filtered by role permissions)
 * @query   page, limit, status, incidentType, severity, search, sortBy, sortOrder, startDate, endDate
 */
router.get('/', (req, res, next) => {
  // All authenticated users can view incidents, but may have filtered results based on role
  IncidentController.getAllIncidents(req, res, next);
});

/**
 * @route   GET /api/incidents/statistics
 * @desc    Get incident statistics for dashboard analytics (US-020: Analytics Dashboard)
 * @access  Dispatchers, Supervisors, Admins, Data Analysts
 * @query   timeframe (today, week, month)
 */
router.get('/statistics', (req, res, next) => {
  const allowedRoles = ['Dispatcher', 'Supervisor', 'Admin', 'Data Analyst'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view incident statistics',
      requiredRoles: allowedRoles
    });
  }

  IncidentController.getIncidentStatistics(req, res, next);
});

/**
 * @route   POST /api/incidents/find-duplicates
 * @desc    Find potential duplicate incidents based on location and time (US-004: Duplicate Detection)
 * @access  Call Takers, Dispatchers, Admins
 */
router.post('/find-duplicates', (req, res, next) => {
  const allowedRoles = ['Call Taker', 'Dispatcher', 'Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to search for duplicates',
      requiredRoles: allowedRoles
    });
  }

  IncidentController.findPotentialDuplicates(req, res, next);
});

/**
 * @route   GET /api/incidents/categories/:type
 * @desc    Get available incident categories for a specific incident type
 * @access  All authenticated users
 * @param   type - The incident type (medical, fire, rescue, hazmat, traffic, other)
 */
router.get('/categories/:type', (req, res, next) => {
  // All authenticated users can access category information
  IncidentController.getIncidentCategories(req, res, next);
});

/**
 * @route   GET /api/incidents/:id
 * @desc    Get a specific incident by ID (supports both MongoDB ObjectId and custom incidentId)
 * @access  All authenticated users (may be filtered by incident visibility rules)
 */
router.get('/:id', (req, res, next) => {
  // All authenticated users can view incident details
  // Additional filtering based on role can be implemented in the controller
  IncidentController.getIncidentById(req, res, next);
});

/**
 * @route   PUT /api/incidents/:id
 * @desc    Update incident details
 * @access  Call Takers (own incidents), Dispatchers, Supervisors, Admins
 */
router.put('/:id', (req, res, next) => {
  const allowedRoles = ['Call Taker', 'Dispatcher', 'Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to update incidents',
      requiredRoles: allowedRoles
    });
  }

  // Note: Additional logic in controller can restrict Call Takers to only update their own incidents
  IncidentController.updateIncident(req, res, next);
});

/**
 * @route   POST /api/incidents/:id/notes
 * @desc    Add a note to an incident
 * @access  All authenticated users who can view the incident
 */
router.post('/:id/notes', (req, res, next) => {
  // All authenticated users can add notes to incidents they can view
  IncidentController.addIncidentNote(req, res, next);
});

/**
 * @route   POST /api/incidents/:id/merge/:targetId
 * @desc    Merge duplicate incidents (US-004: Duplicate Detection)
 * @access  Dispatchers, Supervisors, Admins
 */
router.post('/:id/merge/:targetId', (req, res, next) => {
  const allowedRoles = ['Dispatcher', 'Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to merge incidents',
      requiredRoles: allowedRoles
    });
  }

  IncidentController.mergeIncidents(req, res, next);
});

/**
 * Error handling middleware specific to incident routes
 */
router.use((error, req, res, next) => {
  console.error('🚨 Incident route error:', error);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid incident ID format'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error in incident operations',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;