const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const EquipmentController = require('../controllers/equipmentController');
const MaintenanceRecord = require('../models/MaintenanceRecord');
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

/**
 * @route   GET /api/equipment/status
 * @desc    Get equipment status overview for supervisor dashboard (UC-005)
 * @access  Supervisors, Admins
 */
router.get('/status', 
  auditLog('VIEW_EQUIPMENT_STATUS', 'ANALYTICS'),
  async (req, res) => {
    try {
      const result = await EquipmentController.getEquipmentStatus(req, res);
      return result;
    } catch (error) {
      console.error('❌ Equipment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get equipment status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/equipment/checklist-templates
 * @desc    Get all checklist templates with optional vehicle type filter
 * @access  Field Crews, Supervisors, Admins
 */
router.get('/checklist-templates',
  auditLog('GET_CHECKLIST_TEMPLATES', 'EQUIPMENT'),
  async (req, res) => {
    try {
      console.log('📋 Fetching checklist templates with filters:', req.query);
      
      const allowedRoles = ['Field Crew', 'Crew Leader', 'Supervisor', 'Admin'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view checklist templates'
        });
      }

      const { vehicleType, isActive } = req.query;

      const EquipmentChecklistTemplate = require('../models/EquipmentChecklistTemplate');
      
      // Build query
      const query = {};
      
      if (vehicleType) {
        query.vehicleType = vehicleType;
      }
      
      if (isActive !== undefined) {
        query['settings.isActive'] = isActive === 'true';
      }

      const templates = await EquipmentChecklistTemplate.find(query)
        .populate('audit.createdBy', 'personal.firstName personal.lastName')
        .sort({ 'template.version': -1 });

      console.log(`✅ Found ${templates.length} checklist templates`);

      res.json({
        success: true,
        message: 'Checklist templates retrieved successfully',
        data: {
          templates: templates,
          count: templates.length
        }
      });
    } catch (error) {
      console.error('❌ Error fetching checklist templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve checklist templates',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/equipment/test-vehicles
 * @desc    Get all vehicles for testing maintenance record creation
 * @access  Supervisors, Maintenance Technicians, Admins
 */
router.get('/test-vehicles',     
  auditLog('GET_TEST_VEHICLES', 'MAINTENANCE'),
  async (req, res) => {
    try {
      const Vehicle = require('../models/Vehicle');
      const vehicles = await Vehicle.find({}, 'registration._id registration.plateNumber registration.vehicleType');
      
      console.log('🚗 Found vehicles for testing:', vehicles.length);
      
      res.json({
        success: true,
        message: 'Test vehicles retrieved successfully',
        data: vehicles.map(v => ({
          id: v._id,
          plateNumber: v.registration?.plateNumber || 'Unknown',
          vehicleType: v.registration?.vehicleType || 'Unknown'
        }))
      });
    } catch (error) {
      console.error('❌ Error getting test vehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test vehicles',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/equipment/maintenance/summary
 * @desc    Get maintenance summary statistics including count of vehicles in maintenance
 * @access  Supervisors, Admins
 */
router.get('/maintenance/summary',
  auditLog('GET_MAINTENANCE_SUMMARY', 'MAINTENANCE'),
  async (req, res) => {
    try {
      console.log('📊 Getting maintenance summary statistics');
      
      const allowedRoles = ['Supervisor', 'Admin', 'Data Analyst'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view maintenance summary'
        });
      }

      const Vehicle = require('../models/Vehicle');
      const MaintenanceRecord = require('../models/MaintenanceRecord');
      
      // Count UNIQUE vehicles with active maintenance records (PENDING or IN_PROGRESS)
      // This is the correct way - count from maintenance records, not vehicle status
      const activeMaintenanceRecords = await MaintenanceRecord.find({
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      }).select('vehicleId');
      
      // Get unique vehicle IDs from active maintenance records
      const uniqueVehicleIds = [...new Set(activeMaintenanceRecords.map(record => record.vehicleId.toString()))];
      const maintenanceVehiclesCount = uniqueVehicleIds.length;
      
      // Total count of active maintenance records (can be multiple per vehicle)
      const totalActiveMaintenanceRecords = activeMaintenanceRecords.length;
      
      // Get count of completed maintenance records this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const completedThisWeek = await MaintenanceRecord.countDocuments({
        status: 'COMPLETED',
        createdAt: { $gte: weekAgo }
      });
      
      // Get count by priority for active records
      const highPriorityCount = await MaintenanceRecord.countDocuments({
        priority: 'HIGH',
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      });
      
      console.log('✅ Maintenance summary calculated:', {
        maintenanceVehiclesCount,
        totalActiveMaintenanceRecords,
        completedThisWeek,
        highPriorityCount,
        uniqueVehicleIds
      });
      
      res.json({
        success: true,
        message: 'Maintenance summary retrieved successfully',
        data: {
          maintenanceVehiclesCount,
          activeMaintenanceRecords: totalActiveMaintenanceRecords,
          completedThisWeek,
          highPriorityCount
        }
      });
    } catch (error) {
      console.error('❌ Error getting maintenance summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve maintenance summary',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/equipment/maintenance
 * @desc    Get all maintenance records with filtering
 * @access  Supervisors, Maintenance Technicians, Admins
 */
router.get('/maintenance',
  auditLog('GET_MAINTENANCE_RECORDS', 'MAINTENANCE'),
  async (req, res) => {
    try {
      console.log('🔍 Fetching maintenance records with filters:', req.query);
      
      const allowedRoles = ['Supervisor', 'Maintenance Technician', 'Admin', 'Field Crew', 'Crew Leader'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view maintenance records'
        });
      }

      const { 
        page = 1, 
        limit = 10,
        vehicleId,
        recordType,
        priority,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = {};
      
      if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
        query.vehicleId = vehicleId;
      }
      
      if (recordType) {
        query.recordType = recordType;
      }
      
      if (priority) {
        query.priority = priority;
      }
      
      if (status) {
        query.status = status;
      }
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      console.log('🔍 Query:', JSON.stringify(query, null, 2));

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query with pagination
      const maintenanceRecords = await MaintenanceRecord.find(query)
        .populate('vehicleId', 'registration.plateNumber registration.vehicleType type specifications.model')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await MaintenanceRecord.countDocuments(query);

      console.log(`✅ Found ${maintenanceRecords.length} maintenance records (total: ${total})`);

      res.json({
        success: true,
        message: 'Maintenance records retrieved successfully',
        data: {
          maintenanceRecords: maintenanceRecords,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalRecords: total,
            hasNextPage: skip + maintenanceRecords.length < total,
            hasPrevPage: parseInt(page) > 1
          },
          filters: {
            vehicleId,
            recordType,
            priority,
            status,
            dateRange: { startDate, endDate }
          }
        }
      });
    } catch (error) {
      console.error('❌ Error fetching maintenance records:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve maintenance records',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/equipment/maintenance
 * @desc    Add manual maintenance record (Supervisor function)
 * @access  Supervisors, Maintenance Technicians, Admins
 */
router.post('/maintenance',
  auditLog('CREATE_MAINTENANCE_RECORD', 'MAINTENANCE'),
  async (req, res) => {
    try {
      console.log('🔧 Creating maintenance record:', JSON.stringify(req.body, null, 2));
      console.log('👤 User:', req.user?.auth?.role, req.user?.email);
      
      const allowedRoles = ['Supervisor', 'Maintenance Technician', 'Admin'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create maintenance records'
        });
      }

      const { vehicleId, recordType, description, priority } = req.body;
      
      // Validate required fields
      if (!vehicleId || !recordType || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: vehicleId, recordType, and description are required'
        });
      }

      // Validate vehicleId format
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format'
        });
      }

      // Check if vehicle exists
      const Vehicle = require('../models/Vehicle');
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      const maintenanceRecord = new MaintenanceRecord({
        vehicleId,
        recordType,
        description,
        priority: priority || 'MEDIUM',
        createdBy: req.user.email || req.user.username || 'Unknown',
        createdAt: new Date()
      });
      
      const savedRecord = await maintenanceRecord.save();
      await savedRecord.populate('vehicleId', 'registration.plateNumber registration.vehicleType');
      
      // Update vehicle status to maintenance when maintenance record is created
      await Vehicle.findByIdAndUpdate(vehicleId, {
        'status.operational': 'maintenance'
      });
      
      console.log('✅ Maintenance record created successfully:', savedRecord._id);
      console.log('🔧 Vehicle status updated to maintenance for vehicle:', vehicleId);
      
      res.status(201).json({
        success: true,
        message: 'Maintenance record created successfully',
        data: {
          id: savedRecord._id,
          vehicleId: savedRecord.vehicleId._id,
          vehicleNumber: savedRecord.vehicleId.registration?.plateNumber || 'Unknown',
          vehicleType: savedRecord.vehicleId.registration?.vehicleType || 'Unknown',
          recordType: savedRecord.recordType,
          description: savedRecord.description,
          priority: savedRecord.priority,
          createdBy: savedRecord.createdBy,
          createdAt: savedRecord.createdAt.toISOString(),
          status: savedRecord.status
        }
      });
    } catch (error) {
      console.error('❌ Maintenance record creation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create maintenance record',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   PUT /api/equipment/maintenance/:id
 * @desc    Update maintenance record
 * @access  Supervisors, Maintenance Technicians, Admins
 */
router.put('/maintenance/:id',
  auditLog('UPDATE_MAINTENANCE_RECORD', 'MAINTENANCE'),
  async (req, res) => {
    try {
      console.log('🔧 Updating maintenance record:', req.params.id, JSON.stringify(req.body, null, 2));
      
      const allowedRoles = ['Supervisor', 'Maintenance Technician', 'Admin'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update maintenance records'
        });
      }

      const { id } = req.params;
      const { vehicleId, recordType, description, priority, status } = req.body;
      
      // Validate record ID format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid maintenance record ID format'
        });
      }

      // Validate required fields
      if (!vehicleId || !recordType || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: vehicleId, recordType, and description are required'
        });
      }

      // Validate vehicleId format
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format'
        });
      }

      // Check if maintenance record exists
      const existingRecord = await MaintenanceRecord.findById(id);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance record not found'
        });
      }

      // Check if vehicle exists
      const Vehicle = require('../models/Vehicle');
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Update the maintenance record
      const updateData = {
        vehicleId,
        recordType,
        description,
        priority: priority || 'MEDIUM',
        updatedAt: new Date()
      };

      // If status is provided, include it in the update
      if (status) {
        updateData.status = status;
        
        // If maintenance is completed or cancelled, change vehicle status back to active
        if (status === 'COMPLETED' || status === 'CANCELLED') {
          await Vehicle.findByIdAndUpdate(vehicleId, {
            'status.operational': 'active'
          });
          console.log('🔧 Vehicle status updated to active for vehicle:', vehicleId);
        }
      }

      const updatedRecord = await MaintenanceRecord.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('vehicleId', 'registration.plateNumber registration.vehicleType');
      
      console.log('✅ Maintenance record updated successfully:', updatedRecord._id);
      
      res.json({
        success: true,
        message: 'Maintenance record updated successfully',
        data: {
          id: updatedRecord._id,
          vehicleId: updatedRecord.vehicleId._id,
          vehicleNumber: updatedRecord.vehicleId.registration?.plateNumber || 'Unknown',
          vehicleType: updatedRecord.vehicleId.registration?.vehicleType || 'Unknown',
          recordType: updatedRecord.recordType,
          description: updatedRecord.description,
          priority: updatedRecord.priority,
          createdBy: updatedRecord.createdBy,
          createdAt: updatedRecord.createdAt.toISOString(),
          updatedAt: updatedRecord.updatedAt?.toISOString(),
          status: updatedRecord.status
        }
      });
    } catch (error) {
      console.error('❌ Maintenance record update error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        body: req.body,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update maintenance record',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   DELETE /api/equipment/maintenance/:id
 * @desc    Delete maintenance record
 * @access  Supervisors, Maintenance Technicians, Admins
 */
router.delete('/maintenance/:id',
  auditLog('DELETE_MAINTENANCE_RECORD', 'MAINTENANCE'),
  async (req, res) => {
    try {
      console.log('🗑️ Deleting maintenance record:', req.params.id);
      
      const allowedRoles = ['Supervisor', 'Maintenance Technician', 'Admin'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete maintenance records'
        });
      }

      const { id } = req.params;
      
      // Validate record ID format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid maintenance record ID format'
        });
      }

      // Check if maintenance record exists
      const existingRecord = await MaintenanceRecord.findById(id)
        .populate('vehicleId', 'registration.plateNumber registration.vehicleType');
      
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance record not found'
        });
      }

      // Delete the maintenance record
      await MaintenanceRecord.findByIdAndDelete(id);
      
      console.log('✅ Maintenance record deleted successfully:', id);
      
      res.json({
        success: true,
        message: 'Maintenance record deleted successfully',
        data: {
          deletedRecord: {
            id: existingRecord._id,
            vehicleNumber: existingRecord.vehicleId.registration?.plateNumber || 'Unknown',
            recordType: existingRecord.recordType,
            description: existingRecord.description
          }
        }
      });
    } catch (error) {
      console.error('❌ Maintenance record deletion error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        params: req.params
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintenance record',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/equipment/maintenance/search
 * @desc    Search maintenance records with filters and pagination
 * @access  Supervisors, Maintenance Technicians, Admins
 */
router.post('/maintenance/search',
  auditLog('SEARCH_MAINTENANCE_RECORDS', 'MAINTENANCE'),
  async (req, res) => {
    try {
      console.log('🔍 Searching maintenance records:', JSON.stringify(req.body, null, 2));
      
      const allowedRoles = ['Supervisor', 'Maintenance Technician', 'Admin', 'Field Crew', 'Crew Leader'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to search maintenance records'
        });
      }

      const { 
        vehicleNumber, 
        recordType, 
        priority, 
        status, 
        createdBy,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.body;

      // Build search query
      const query = {};

      // Search by vehicle number (requires lookup)
      if (vehicleNumber) {
        const Vehicle = require('../models/Vehicle');
        const vehicles = await Vehicle.find({
          'registration.plateNumber': { $regex: vehicleNumber, $options: 'i' }
        }).select('_id');
        
        if (vehicles.length > 0) {
          query.vehicleId = { $in: vehicles.map(v => v._id) };
        } else {
          // No matching vehicles found
          return res.json({
            success: true,
            data: {
              records: [],
              pagination: {
                total: 0,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: 0
              }
            }
          });
        }
      }

      // Filter by record type
      if (recordType && ['ROUTINE', 'CORRECTIVE', 'EMERGENCY'].includes(recordType)) {
        query.recordType = recordType;
      }

      // Filter by priority
      if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
        query.priority = priority;
      }

      // Filter by status
      if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
        query.status = status;
      }

      // Filter by creator
      if (createdBy) {
        query.createdBy = { $regex: createdBy, $options: 'i' };
      }

      // Date range filter
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.createdAt.$lte = new Date(dateTo);
        }
      }

      // Pagination options
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
        populate: {
          path: 'vehicleId',
          select: 'registration.plateNumber registration.vehicleType'
        }
      };

      console.log('📋 Search query:', JSON.stringify(query, null, 2));
      console.log('⚙️ Search options:', JSON.stringify(options, null, 2));

      const result = await MaintenanceRecord.paginate(query, options);

      // Transform results for frontend
      const records = result.docs.map(record => ({
        id: record._id,
        vehicleId: record.vehicleId._id,
        vehicleNumber: record.vehicleId.registration?.plateNumber || 'Unknown',
        vehicleType: record.vehicleId.registration?.vehicleType || 'Unknown',
        recordType: record.recordType,
        description: record.description,
        priority: record.priority,
        createdBy: record.createdBy,
        createdAt: record.createdAt.toISOString(),
        status: record.status
      }));

      res.json({
        success: true,
        data: {
          records,
          pagination: {
            total: result.totalDocs,
            page: result.page,
            limit: result.limit,
            pages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
          },
          searchCriteria: {
            vehicleNumber,
            recordType,
            priority,
            status,
            createdBy,
            dateFrom,
            dateTo
          }
        }
      });

    } catch (error) {
      console.error('❌ Maintenance record search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search maintenance records',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/equipment/maintenance/:id/pdf
 * @desc    Generate PDF report for a specific maintenance record
 * @access  Supervisors, Maintenance Technicians, Admins
 */
router.get('/maintenance/:id/pdf',
  auditLog('GENERATE_MAINTENANCE_PDF', 'MAINTENANCE'),
  async (req, res) => {
    try {
      console.log('📄 Generating PDF for maintenance record:', req.params.id);
      
      const allowedRoles = ['Supervisor', 'Maintenance Technician', 'Admin'];
      
      if (!allowedRoles.includes(req.user.auth.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to generate maintenance PDF'
        });
      }

      // Validate record ID
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid maintenance record ID format'
        });
      }

      // Fetch maintenance record with vehicle details
      const record = await MaintenanceRecord.findById(req.params.id)
        .populate({
          path: 'vehicleId',
          select: 'registration specifications status'
        });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance record not found'
        });
      }

      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=maintenance-record-${record._id}.pdf`);

      // Pipe PDF to response
      doc.pipe(res);

      // Add header
      doc.fontSize(20).text('Maintenance Record Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown(2);

      // Record Information
      doc.fontSize(16).text('Record Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Record ID: ${record._id}`);
      doc.text(`Record Type: ${record.recordType}`);
      doc.text(`Priority: ${record.priority}`);
      doc.text(`Status: ${record.status}`);
      doc.text(`Created By: ${record.createdBy}`);
      doc.text(`Created At: ${new Date(record.createdAt).toLocaleString()}`);
      doc.moveDown(2);

      // Vehicle Information
      doc.fontSize(16).text('Vehicle Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Vehicle Number: ${record.vehicleId.registration?.plateNumber || 'N/A'}`);
      doc.text(`Vehicle Type: ${record.vehicleId.registration?.vehicleType || 'N/A'}`);
      doc.text(`Make/Model: ${record.vehicleId.registration?.make || 'N/A'} ${record.vehicleId.registration?.model || 'N/A'}`);
      doc.text(`Operational Status: ${record.vehicleId.status?.operational || 'N/A'}`);
      doc.moveDown(2);

      // Maintenance Details
      doc.fontSize(16).text('Maintenance Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text('Description:', { continued: false });
      doc.moveDown(0.3);
      doc.fontSize(11);
      doc.text(record.description, { align: 'justify' });
      doc.moveDown(2);

      // Priority Badge
      const priorityColors = {
        HIGH: '#EF4444',
        MEDIUM: '#F59E0B',
        LOW: '#10B981'
      };
      doc.fontSize(14).fillColor(priorityColors[record.priority] || '#6B7280');
      doc.text(`Priority Level: ${record.priority}`, { align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(2);

      // Status Badge
      const statusColors = {
        PENDING: '#F59E0B',
        IN_PROGRESS: '#3B82F6',
        COMPLETED: '#10B981',
        CANCELLED: '#6B7280'
      };
      doc.fontSize(14).fillColor(statusColors[record.status] || '#6B7280');
      doc.text(`Current Status: ${record.status}`, { align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(3);

      // Footer
      doc.fontSize(10).text('_'.repeat(80), { align: 'center' });
      doc.moveDown(0.5);
      doc.text('Emergency Dispatch System - UC-005 Digital Equipment Readiness', { align: 'center' });
      doc.text('This is an official maintenance record document', { align: 'center' });
      doc.moveDown(2);

      // Signature Section
      doc.fontSize(12);
      doc.text('Supervisor Signature: _______________________     Date: __________', { align: 'left' });
      doc.moveDown();
      doc.text('Technician Signature: _______________________     Date: __________', { align: 'left' });

      // Finalize PDF
      doc.end();

      console.log('✅ PDF generated successfully for record:', record._id);

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;