const EquipmentCheck = require('../models/EquipmentCheck');
const EquipmentChecklistTemplate = require('../models/EquipmentChecklistTemplate');
const Vehicle = require('../models/Vehicle');
const Crew = require('../models/Crew');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const mongoose = require('mongoose');

/**
 * Equipment Controller for Emergency Dispatch System
 * Handles equipment readiness, maintenance workflows, and digital checklists
 * Implements the core functionality for US-013, US-014, US-015
 */
class EquipmentController {
  
  /**
   * Get equipment checklist template for a specific vehicle
   * GET /api/equipment/templates/:vehicleId
   */
  static async getChecklistTemplate(req, res) {
    try {
      console.log('📋 Getting checklist template for vehicle:', req.params.vehicleId);
      
      const { vehicleId } = req.params;
      
      // Validate vehicle ID
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format'
        });
      }

      // Find the vehicle to get its type
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      console.log('🚗 Vehicle found:', vehicle.registration.plateNumber, '- Type:', vehicle.type);

      // Find the appropriate template for this vehicle type
      const template = await EquipmentChecklistTemplate.findOne({
        vehicleType: vehicle.type,
        'status': 'active'
      }).sort({ 'template.version': -1 });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: `No active checklist template found for vehicle type: ${vehicle.type}`
        });
      }

      console.log('📋 Template found:', template.template.name, 'v' + template.template.version);

      res.status(200).json({
        success: true,
        message: 'Checklist template retrieved successfully',
        data: {
          template: template,
          vehicle: {
            id: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
            type: vehicle.type,
            model: vehicle.specifications.model,
            year: vehicle.specifications.year
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting checklist template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve checklist template',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create a new equipment check (Digital Equipment Readiness - US-013)
   * POST /api/equipment/checks
   */
  static async createEquipmentCheck(req, res) {
    try {
      console.log('🔍 Creating equipment check - Inspected by:', req.user.personal.firstName, req.user.personal.lastName);
      console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
      
      const {
        vehicleId,
        templateId,
        checkResults,
        location,
        notes
      } = req.body;

      // Validate required fields
      const requiredFields = ['vehicleId', 'templateId', 'checkResults'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${field}`,
            field: field
          });
        }
      }

      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(vehicleId) || !mongoose.Types.ObjectId.isValid(templateId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID or template ID format'
        });
      }

      // Find crew member by user ID
      const crew = await Crew.findOne({ userId: req.user._id });
      if (!crew) {
        return res.status(404).json({
          success: false,
          message: 'Crew member profile not found for current user'
        });
      }

      // Verify vehicle and template exist
      const vehicle = await Vehicle.findById(vehicleId);
      const template = await EquipmentChecklistTemplate.findById(templateId);
      
      if (!vehicle || !template) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle or template not found'
        });
      }

      console.log('🚗 Vehicle:', vehicle.registration.plateNumber);
      console.log('📋 Template:', template.template.name);
      console.log('👤 Inspector:', crew.personal.firstName, crew.personal.lastName);

      // Create equipment check
      const equipmentCheck = new EquipmentCheck({
        vehicleId: vehicleId,
        crewId: crew._id,
        templateId: templateId,
        inspection: {
          checkResults: checkResults,
          overallStatus: 'pending', // Will be calculated
          criticalFailures: [],
          warningCount: 0,
          passCount: 0,
          failCount: 0,
          location: location || {
            coordinates: [0, 0], // Default coordinates
            address: 'Unknown',
            capturedAt: new Date()
          },
          notes: notes || ''
        },
        workflow: {
          status: 'completed',
          completedAt: new Date(),
          submittedBy: req.user._id
        },
        audit: {
          createdBy: req.user._id,
          createdAt: new Date(),
          lastModifiedBy: req.user._id,
          lastModifiedAt: new Date()
        }
      });

      // Calculate check results and overall status
      let passCount = 0;
      let failCount = 0;
      let warningCount = 0;
      let criticalFailures = [];

      checkResults.forEach(result => {
        switch (result.status) {
          case 'pass':
            passCount++;
            break;
          case 'fail':
            failCount++;
            // Check if this is a critical item
            if (result.isCritical) {
              criticalFailures.push({
                categoryName: result.categoryName,
                itemName: result.itemName,
                notes: result.notes,
                photos: result.photos || []
              });
            }
            break;
          case 'warning':
            warningCount++;
            break;
        }
      });

      // Update counts
      equipmentCheck.inspection.passCount = passCount;
      equipmentCheck.inspection.failCount = failCount;
      equipmentCheck.inspection.warningCount = warningCount;
      equipmentCheck.inspection.criticalFailures = criticalFailures;

      // Determine overall status
      if (criticalFailures.length > 0) {
        equipmentCheck.inspection.overallStatus = 'critical_failure';
        // Update vehicle status to out of service
        await Vehicle.findByIdAndUpdate(vehicleId, {
          'operationalStatus.status': 'out_of_service',
          'operationalStatus.reason': 'Critical equipment failure detected',
          'operationalStatus.lastUpdated': new Date()
        });
      } else if (failCount > 0) {
        equipmentCheck.inspection.overallStatus = 'minor_issues';
        // Update vehicle status to available with restrictions
        await Vehicle.findByIdAndUpdate(vehicleId, {
          'operationalStatus.status': 'available_with_restrictions',
          'operationalStatus.reason': 'Minor equipment issues detected',
          'operationalStatus.lastUpdated': new Date()
        });
      } else {
        equipmentCheck.inspection.overallStatus = 'passed';
        // Update vehicle status to available
        await Vehicle.findByIdAndUpdate(vehicleId, {
          'operationalStatus.status': 'available',
          'operationalStatus.reason': 'Equipment check passed',
          'operationalStatus.lastUpdated': new Date()
        });
      }

      // Save the equipment check
      const savedCheck = await equipmentCheck.save();

      console.log('✅ Equipment check created:', savedCheck._id);
      console.log('📊 Results - Pass:', passCount, 'Fail:', failCount, 'Warning:', warningCount);
      console.log('🚨 Critical failures:', criticalFailures.length);

      // Populate the response
      const populatedCheck = await EquipmentCheck.findById(savedCheck._id)
        .populate('vehicleId', 'registration.plateNumber type specifications.model')
        .populate('crewId', 'personal.firstName personal.lastName professional.role')
        .populate('templateId', 'template.name template.version');

      res.status(201).json({
        success: true,
        message: 'Equipment check completed successfully',
        data: {
          equipmentCheck: populatedCheck,
          summary: {
            overallStatus: equipmentCheck.inspection.overallStatus,
            totalItems: checkResults.length,
            passCount: passCount,
            failCount: failCount,
            warningCount: warningCount,
            criticalFailures: criticalFailures.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creating equipment check:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create equipment check',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get equipment checks for a vehicle with filtering
   * GET /api/equipment/checks/vehicle/:vehicleId
   */
  static async getVehicleEquipmentChecks(req, res) {
    try {
      const { vehicleId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        status, 
        startDate, 
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate vehicle ID
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format'
        });
      }

      // Build query
      const query = { vehicleId: vehicleId };
      
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

      console.log('🔍 Querying equipment checks with filters:', query);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query with pagination
      const equipmentChecks = await EquipmentCheck.find(query)
        .populate('crewId', 'personal.firstName personal.lastName professional.role')
        .populate('templateId', 'template.name template.version')
        .populate('vehicleId', 'registration.plateNumber type specifications.model')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

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
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting vehicle equipment checks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment checks',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get latest equipment check for a vehicle
   * GET /api/equipment/checks/vehicle/:vehicleId/latest
   */
  static async getLatestEquipmentCheck(req, res) {
    try {
      const { vehicleId } = req.params;

      // Validate vehicle ID
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format'
        });
      }

      const latestCheck = await EquipmentCheck.findOne({ vehicleId: vehicleId })
        .sort({ 'audit.createdAt': -1 })
        .populate('crewId', 'personal.firstName personal.lastName professional.role')
        .populate('templateId', 'template.name template.version')
        .populate('vehicleId', 'registration.plateNumber type specifications.model operationalStatus');

      if (!latestCheck) {
        return res.status(404).json({
          success: false,
          message: 'No equipment checks found for this vehicle'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Latest equipment check retrieved successfully',
        data: {
          equipmentCheck: latestCheck
        }
      });

    } catch (error) {
      console.error('❌ Error getting latest equipment check:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest equipment check',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get equipment check statistics for dashboard
   * GET /api/equipment/statistics
   */
  static async getEquipmentStatistics(req, res) {
    try {
      const { timeframe = 'week' } = req.query;
      
      // Calculate date range
      let startDate = new Date();
      switch (timeframe) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      console.log('📊 Getting equipment statistics from:', startDate);

      // Aggregate equipment check statistics
      const stats = await EquipmentCheck.aggregate([
        {
          $match: {
            'audit.createdAt': { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalChecks: { $sum: 1 },
            passedChecks: {
              $sum: {
                $cond: [{ $eq: ['$inspection.overallStatus', 'passed'] }, 1, 0]
              }
            },
            criticalFailures: {
              $sum: {
                $cond: [{ $eq: ['$inspection.overallStatus', 'critical_failure'] }, 1, 0]
              }
            },
            minorIssues: {
              $sum: {
                $cond: [{ $eq: ['$inspection.overallStatus', 'minor_issues'] }, 1, 0]
              }
            },
            avgPassCount: { $avg: '$inspection.passCount' },
            avgFailCount: { $avg: '$inspection.failCount' },
            avgWarningCount: { $avg: '$inspection.warningCount' }
          }
        }
      ]);

      const statistics = stats.length > 0 ? stats[0] : {
        totalChecks: 0,
        passedChecks: 0,
        criticalFailures: 0,
        minorIssues: 0,
        avgPassCount: 0,
        avgFailCount: 0,
        avgWarningCount: 0
      };

      // Calculate percentages
      const totalChecks = statistics.totalChecks || 1; // Avoid division by zero
      statistics.passRate = ((statistics.passedChecks / totalChecks) * 100).toFixed(2);
      statistics.failureRate = (((statistics.criticalFailures + statistics.minorIssues) / totalChecks) * 100).toFixed(2);

      res.status(200).json({
        success: true,
        message: 'Equipment statistics retrieved successfully',
        data: {
          timeframe: timeframe,
          dateRange: {
            from: startDate,
            to: new Date()
          },
          statistics: statistics
        }
      });

    } catch (error) {
      console.error('❌ Error getting equipment statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get equipment status overview for supervisor dashboard (UC-005)
   * GET /api/equipment/status
   */
  static async getEquipmentStatus(req, res) {
    try {
      console.log('📊 Getting equipment status overview for supervisor dashboard');

      // Get all vehicles with their latest equipment check status
      const vehicles = await EquipmentCheck.aggregate([
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicle'
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: '$vehicleId',
            latestCheck: { $first: '$$ROOT' },
            vehicle: { $first: { $arrayElemAt: ['$vehicle', 0] } }
          }
        }
      ]);

      // Get maintenance records
      const maintenanceRecords = await MaintenanceRecord.find()
        .populate('vehicleId', 'registration type')
        .sort({ createdAt: -1 })
        .limit(10);

      // Process vehicles according to UC-005 status logic
      const processedVehicles = vehicles.map(v => {
        const latestCheck = v.latestCheck;
        let status = 'PENDING_INSPECTION';
        let readinessScore = 0;
        let criticalIssues = 0;
        let nonCriticalIssues = 0;

        if (latestCheck && latestCheck.checkResults) {
          const results = latestCheck.checkResults;
          const criticalFails = results.filter(item => item.isCritical && item.status === 'FAIL');
          const nonCriticalFails = results.filter(item => !item.isCritical && item.status === 'FAIL');
          const totalItems = results.length;
          const passedItems = results.filter(item => item.status === 'PASS').length;

          criticalIssues = criticalFails.length;
          nonCriticalIssues = nonCriticalFails.length;
          readinessScore = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

          // UC-005 Status Logic:
          // All critical items pass = READY
          // Critical items fail = OUT OF SERVICE  
          // Only non-critical items fail = AVAILABLE WITH RESTRICTIONS
          if (criticalFails.length > 0) {
            status = 'OUT_OF_SERVICE';
          } else if (nonCriticalFails.length > 0) {
            status = 'AVAILABLE_WITH_RESTRICTIONS';
          } else if (results.length > 0) {
            status = 'READY';
          }
        }

        return {
          id: v._id,
          vehicleNumber: v.vehicle?.registration?.plateNumber || 'Unknown',
          type: v.vehicle?.type || 'unknown',
          status,
          lastCheck: latestCheck?.timestamp ? new Date(latestCheck.timestamp).toLocaleDateString() : 'Never',
          readinessScore,
          location: latestCheck?.gpsLocation || 'Unknown',
          assignedCrewLeader: latestCheck?.crewLeaderId || null,
          criticalIssues,
          nonCriticalIssues
        };
      });

      res.json({
        success: true,
        message: 'Equipment status retrieved successfully',
        data: {
          vehicles: processedVehicles,
          maintenanceRecords: maintenanceRecords.map(record => ({
            id: record._id,
            vehicleId: record.vehicleId?._id,
            vehicleNumber: record.vehicleId?.registration?.plateNumber || 'Unknown',
            recordType: record.recordType,
            description: record.description,
            priority: record.priority,
            createdBy: record.createdBy,
            createdAt: new Date(record.createdAt).toLocaleDateString(),
            status: record.status
          }))
        }
      });

    } catch (error) {
      console.error('❌ Equipment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = EquipmentController;