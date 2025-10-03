const express = require('express');
const router = express.Router();
const CrewController = require('../controllers/crewController');
const { authenticate, authorize, selfOrAdmin } = require('../middleware/auth');

/**
 * Crew Registration Routes for Emergency Dispatch System
 * Implements Inusha Nawanjana's responsibilities (US-012)
 * All routes require authentication and appropriate role permissions
 */

// Apply authentication middleware to all crew routes
router.use(authenticate);

/**
 * @route   POST /api/crew
 * @desc    Register a new crew member (US-012: Crew Registration)
 * @access  Admins, Supervisors
 */
router.post('/', (req, res, next) => {
  const allowedRoles = ['Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to register crew members',
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role
    });
  }

  CrewController.registerCrewMember(req, res, next);
});

/**
 * @route   GET /api/crew
 * @desc    Get all crew members with filtering and pagination
 * @access  All authenticated users (filtered by role permissions)
 * @query   page, limit, status, role, certificationLevel, stationId, search, sortBy, sortOrder
 */
router.get('/', CrewController.getAllCrewMembers);

/**
 * @route   GET /api/crew/pending-approval
 * @desc    Get crew members pending approval
 * @access  Supervisors, Admins
 */
router.get('/pending-approval', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view pending crew approvals',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getPendingApprovals(req, res, next);
});

/**
 * @route   GET /api/crew/approved
 * @desc    Get all approved crew members
 * @access  Admins, Supervisors
 */
router.get('/approved', (req, res, next) => {
  const allowedRoles = ['Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view approved crew members',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getApprovedCrew(req, res, next);
});

/**
 * @route   GET /api/crew/rejected
 * @desc    Get all rejected crew members
 * @access  Admins, Supervisors
 */
router.get('/rejected', (req, res, next) => {
  const allowedRoles = ['Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view rejected crew members',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getRejectedCrew(req, res, next);
});

/**
 * @route   GET /api/crew/available/:role
 * @desc    Get available crew members by role for assignment
 * @access  Dispatchers, Supervisors, Admins
 * @param   role - The professional role (EMT, Paramedic, Firefighter, Driver, Supervisor)
 */
router.get('/available/:role', (req, res, next) => {
  const allowedRoles = ['Dispatcher', 'Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view available crew members',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getAvailableCrewByRole(req, res, next);
});

/**
 * @route   GET /api/crew/expiring-certifications
 * @desc    Get crew members with certifications expiring soon
 * @access  Supervisors, Admins
 * @query   days - Number of days ahead to check (default: 30)
 */
router.get('/expiring-certifications', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view certification status',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getExpiringCertifications(req, res, next);
});

/**
 * @route   POST /api/crew/validate-employee-id
 * @desc    Validate employee ID uniqueness (real-time validation)
 * @access  Admins, Supervisors
 */
router.post('/validate-employee-id', (req, res, next) => {
  const allowedRoles = ['Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to validate employee IDs',
      requiredRoles: allowedRoles
    });
  }

  CrewController.validateEmployeeId(req, res, next);
});

/**
 * @route   POST /api/crew/validate-email
 * @desc    Validate email uniqueness (real-time validation)
 * @access  Admins, Supervisors
 */
router.post('/validate-email', (req, res, next) => {
  const allowedRoles = ['Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to validate email addresses',
      requiredRoles: allowedRoles
    });
  }

  CrewController.validateEmail(req, res, next);
});

/**
 * @route   GET /api/crew/statistics
 * @desc    Get crew statistics for dashboard analytics
 * @access  Supervisors, Admins, Data Analysts
 * @query   timeframe (today, week, month)
 */
router.get('/statistics', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin', 'Data Analyst'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view crew statistics',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getCrewStatistics(req, res, next);
});

/**
 * @route   GET /api/crew/:id
 * @desc    Get a specific crew member by ID
 * @access  Self, Supervisors, Admins, Dispatchers (assignment needs)
 */
router.get('/:id', (req, res, next) => {
  // Allow self-access, supervisors, admins, and dispatchers for assignment purposes
  const allowedRoles = ['Supervisor', 'Admin', 'Dispatcher'];
  const isSelf = req.user._id.toString() === req.params.id || 
                 (req.user.auth.employeeId && req.params.id.includes(req.user.auth.employeeId));

  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view crew member details',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getCrewMemberById(req, res, next);
});

/**
 * @route   PUT /api/crew/:id
 * @desc    Update crew member information
 * @access  Self (limited fields), Supervisors, Admins
 */
router.put('/:id', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  const isSelf = req.user._id.toString() === req.params.id ||
                 (req.user.auth.employeeId && req.params.id.includes(req.user.auth.employeeId));

  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to update crew member',
      requiredRoles: allowedRoles
    });
  }

  CrewController.updateCrewMember(req, res, next);
});

/**
 * @route   POST /api/crew/:id/approve
 * @desc    Approve a crew member registration
 * @access  Supervisors, Admins
 */
router.post('/:id/approve', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to approve crew members',
      requiredRoles: allowedRoles
    });
  }

  CrewController.approveCrew(req, res, next);
});

/**
 * @route   POST /api/crew/:id/reject
 * @desc    Reject a crew member registration
 * @access  Supervisors, Admins
 */
router.post('/:id/reject', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to reject crew members',
      requiredRoles: allowedRoles
    });
  }

  CrewController.rejectCrew(req, res, next);
});

/**
 * @route   PUT /api/crew/:id/status
 * @desc    Update crew member availability status
 * @access  Self, Dispatchers, Supervisors, Admins
 */
router.put('/:id/status', (req, res, next) => {
  const allowedRoles = ['Dispatcher', 'Supervisor', 'Admin'];
  const isSelf = req.user._id.toString() === req.params.id ||
                 (req.user.auth.employeeId && req.params.id.includes(req.user.auth.employeeId));

  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to update crew status',
      requiredRoles: allowedRoles
    });
  }

  CrewController.updateCrewStatus(req, res, next);
});

/**
 * @route   PUT /api/crew/:id/location
 * @desc    Update crew member location (GPS tracking)
 * @access  Self, Supervisors, Admins
 */
router.put('/:id/location', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  const isSelf = req.user._id.toString() === req.params.id ||
                 (req.user.auth.employeeId && req.params.id.includes(req.user.auth.employeeId));

  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to update location',
      requiredRoles: allowedRoles
    });
  }

  CrewController.updateCrewLocation(req, res, next);
});

/**
 * @route   POST /api/crew/:id/certifications
 * @desc    Add a new certification to crew member
 * @access  Supervisors, Admins
 */
router.post('/:id/certifications', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to add certifications',
      requiredRoles: allowedRoles
    });
  }

  CrewController.addCertification(req, res, next);
});

/**
 * @route   PUT /api/crew/:id/certifications/:certId
 * @desc    Update a certification
 * @access  Supervisors, Admins
 */
router.put('/:id/certifications/:certId', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to update certifications',
      requiredRoles: allowedRoles
    });
  }

  CrewController.updateCertification(req, res, next);
});

/**
 * @route   DELETE /api/crew/:id/certifications/:certId
 * @desc    Deactivate a certification
 * @access  Supervisors, Admins
 */
router.delete('/:id/certifications/:certId', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to deactivate certifications',
      requiredRoles: allowedRoles
    });
  }

  CrewController.deactivateCertification(req, res, next);
});

/**
 * @route   DELETE /api/crew/:id
 * @desc    Deactivate a crew member (soft delete)
 * @access  Admins only
 */
router.delete('/:id', (req, res, next) => {
  const allowedRoles = ['Admin'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to deactivate crew members',
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role
    });
  }

  CrewController.deactivateCrewMember(req, res, next);
});

/**
 * @route   GET /api/crew/:id/history
 * @desc    Get crew member assignment and status history
 * @access  Self, Supervisors, Admins, Dispatchers
 */
router.get('/:id/history', (req, res, next) => {
  const allowedRoles = ['Supervisor', 'Admin', 'Dispatcher'];
  const isSelf = req.user._id.toString() === req.params.id ||
                 (req.user.auth.employeeId && req.params.id.includes(req.user.auth.employeeId));

  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to view crew history',
      requiredRoles: allowedRoles
    });
  }

  CrewController.getCrewHistory(req, res, next);
});

/**
 * Error handling middleware specific to crew routes
 */
router.use((error, req, res, next) => {
  console.error('🚨 Crew route error:', error);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Crew member validation failed',
      errors: error.errors
    });
  }

  if (error.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Crew member with this ${field} already exists`,
      field: field,
      value: error.keyValue[field]
    });
  }

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid crew member ID format'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error in crew operations',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;