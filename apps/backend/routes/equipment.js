const express = require('express');
const router = express.Router();
const EquipmentController = require('../controllers/equipmentController');
const { authenticate, auditLog } = require('../middleware/auth');

/**
 * Equipment Routes for Emergency Dispatch System
 * All routes require authentication and appropriate role permissions
 * Implements routing for equipment readiness, maintenance, and digital checklists
 * Covers US-013: Digital Equipment Readiness, US-014: Maintenance Workflow
 */

// Apply authentication middleware to all equipment routes
router.use(authenticate);

/**
 * @route   GET /api/equipment/templates/:vehicleId
 * @desc    Get equipment checklist template for a specific vehicle
 * @access  Field Crews, Supervisors, Admins
 * @param   vehicleId - MongoDB ObjectId of the vehicle
 */
router.get('/templates/:vehicleId', 
  auditLog('GET_CHECKLIST_TEMPLATE', 'EQUIPMENT_MANAGEMENT'),
  (req, res, next) => {
    // Verify user has permission to access equipment templates
    const allowedRoles = ['Field Crew', 'Crew Leader', 'Supervisor', 'Admin'];
    
    if (!allowedRoles.includes(req.user.auth.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access equipment templates',
        requiredRoles: allowedRoles,
        currentRole: req.user.auth.role
      });
    }

    EquipmentController.getChecklistTemplate(req, res, next);
  }
);

/**
 * @route   POST /api/equipment/checks
 * @desc    Create a new equipment check (Digital Equipment Readiness - US-013)
 * @access  Field Crews, Crew Leaders, Supervisors, Admins
 * @body    { vehicleId, templateId, checkResults, location, notes }
 */
router.post('/checks', 
  auditLog('CREATE_EQUIPMENT_CHECK', 'EQUIPMENT_READINESS'),
  (req, res, next) => {
    // Verify user has permission to create equipment checks
    const allowedRoles = ['Field Crew', 'Crew Leader', 'Supervisor', 'Admin'];
    
    if (!allowedRoles.includes(req.user.auth.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create equipment checks',
        requiredRoles: allowedRoles,
        currentRole: req.user.auth.role
      });
    }

    EquipmentController.createEquipmentCheck(req, res, next);
  }
);

/**
 * @route   GET /api/equipment/checks/vehicle/:vehicleId
 * @desc    Get equipment checks for a specific vehicle with filtering and pagination
 * @access  All authenticated users (filtered by role permissions)
 * @param   vehicleId - MongoDB ObjectId of the vehicle
 * @query   page, limit, status, startDate, endDate, sortBy, sortOrder
 */
router.get('/checks/vehicle/:vehicleId',
  auditLog('VIEW_VEHICLE_EQUIPMENT_CHECKS', 'EQUIPMENT_HISTORY'),
  (req, res, next) => {
    // All authenticated users can view equipment checks for vehicles they have access to
    EquipmentController.getVehicleEquipmentChecks(req, res, next);
  }
);

/**
 * @route   GET /api/equipment/checks/vehicle/:vehicleId/latest
 * @desc    Get the latest equipment check for a specific vehicle
 * @access  All authenticated users
 * @param   vehicleId - MongoDB ObjectId of the vehicle
 */
router.get('/checks/vehicle/:vehicleId/latest',
  auditLog('VIEW_LATEST_EQUIPMENT_CHECK', 'EQUIPMENT_STATUS'),
  (req, res, next) => {
    // All authenticated users can view latest equipment status
    EquipmentController.getLatestEquipmentCheck(req, res, next);
  }
);

/**
 * @route   GET /api/equipment/statistics
 * @desc    Get equipment check statistics for dashboard analytics
 * @access  Supervisors, Admins, Data Analysts
 * @query   timeframe (today, week, month)
 */
router.get('/statistics',
  auditLog('VIEW_EQUIPMENT_STATISTICS', 'ANALYTICS'),
  (req, res, next) => {
    const allowedRoles = ['Supervisor', 'Admin', 'Data Analyst', 'Dispatcher'];
    
    if (!allowedRoles.includes(req.user.auth.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view equipment statistics',
        requiredRoles: allowedRoles,
        currentRole: req.user.auth.role
      });
    }

    EquipmentController.getEquipmentStatistics(req, res, next);
  }
);

/**
 * @route   GET /api/equipment/checks/:checkId
 * @desc    Get a specific equipment check by ID
 * @access  All authenticated users
 * @param   checkId - MongoDB ObjectId of the equipment check
 */
router.get('/checks/:checkId',
  auditLog('VIEW_EQUIPMENT_CHECK', 'EQUIPMENT_DETAILS'),
  async (req, res, next) => {
    try {
      const { checkId } = req.params;
      
      // Validate check ID
      if (!require('mongoose').Types.ObjectId.isValid(checkId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid equipment check ID format'
        });
      }

      const EquipmentCheck = require('../models/EquipmentCheck');
      
      const equipmentCheck = await EquipmentCheck.findById(checkId)
        .populate('vehicleId', 'registration.plateNumber type specifications.model operationalStatus')
        .populate('crewId', 'personal.firstName personal.lastName professional.role')
        .populate('templateId', 'template.name template.version');

      if (!equipmentCheck) {
        return res.status(404).json({
          success: false,
          message: 'Equipment check not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Equipment check retrieved successfully',
        data: {
          equipmentCheck: equipmentCheck
        }
      });

    } catch (error) {
      console.error('❌ Error getting equipment check:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment check',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/equipment/checks
 * @desc    Get all equipment checks with filtering and pagination (for supervisors/admins)
 * @access  Supervisors, Admins, Data Analysts
 * @query   page, limit, status, vehicleType, startDate, endDate, sortBy, sortOrder, search
 */
router.get('/checks',
  auditLog('VIEW_ALL_EQUIPMENT_CHECKS', 'EQUIPMENT_MANAGEMENT'),
  async (req, res, next) => {
    try {
      // Verify user has permission to view all equipment checks
      const allowedRoles = ['Supervisor', 'Admin', 'Data Analyst'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view all equipment checks',
          requiredRoles: allowedRoles,
          currentRole: req.user.auth.role
        });
      }

      const { 
        page = 1, 
        limit = 20, 
        status, 
        vehicleType,
        startDate, 
        endDate,
        sortBy = 'audit.createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      const EquipmentCheck = require('../models/EquipmentCheck');

      // Build query
      const query = {};
      
      if (status) {
        query['inspection.overallStatus'] = status;
      }

      if (startDate || endDate) {
        query['audit.createdAt'] = {};
        if (startDate) {
          query['audit.createdAt'].$gte = new Date(startDate);
        }
        if (endDate) {
          query['audit.createdAt'].$lte = new Date(endDate);
        }
      }

      console.log('🔍 Querying all equipment checks with filters:', query);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query with pagination
      let equipmentChecks = await EquipmentCheck.find(query)
        .populate('crewId', 'personal.firstName personal.lastName professional.role')
        .populate('templateId', 'template.name template.version')
        .populate('vehicleId', 'registration.plateNumber type specifications.model operationalStatus')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Filter out results where vehicle match failed (if vehicleType filter was applied)
      if (vehicleType) {
        equipmentChecks = equipmentChecks.filter(doc => 
          doc.vehicleId && doc.vehicleId.type === vehicleType
        );
      }

      // Get total count for pagination
      const total = await EquipmentCheck.countDocuments(query);

      res.status(200).json({
        success: true,
        message: 'Equipment checks retrieved successfully',
        data: {
          equipmentChecks: equipmentChecks,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalChecks: total,
            hasNextPage: skip + equipmentChecks.length < total,
            hasPrevPage: parseInt(page) > 1
          },
          filters: {
            status,
            vehicleType,
            dateRange: { startDate, endDate }
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting all equipment checks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment checks',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;