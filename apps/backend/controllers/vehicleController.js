const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * Vehicle Controller for Emergency Dispatch System
 * Implements Inusha Nawanjana's responsibilities (US-010, US-011)
 * Handles vehicle registration, approval workflow, and management operations
 */
class VehicleController {

  /**
   * Register a new vehicle (US-010: Vehicle Registration)
   * POST /api/vehicles
   */
  static async registerVehicle(req, res) {
    try {
      console.log('🚛 Registering new vehicle - Registered by:', req.user.personal.firstName, req.user.personal.lastName);
      console.log('🔍 Vehicle registration data:', JSON.stringify(req.body, null, 2));

      const {
        plateNumber,
        vehicleType,
        make,
        model,
        year,
        homeStationId,
        equipmentItems
      } = req.body;

      // Validate required fields
      const requiredFields = ['plateNumber', 'vehicleType', 'make', 'model', 'year', 'homeStationId'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${field}`,
            field: field
          });
        }
      }

      // Validate plate number format (Sri Lankan format)
      const plateRegex = /^[A-Z]{2,3}-[0-9]{4}$/;
      if (!plateRegex.test(plateNumber.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plate number format. Use format like CAB-1234',
          field: 'plateNumber'
        });
      }

      // Check if plate number already exists
      const existingVehicle = await Vehicle.findOne({ 
        'registration.plateNumber': plateNumber.toUpperCase() 
      });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle with this plate number already exists',
          field: 'plateNumber',
          existingVehicleId: existingVehicle._id
        });
      }

      // Validate vehicle type
      const validVehicleTypes = ['Ambulance', 'Fire Engine', 'Rescue Vehicle', 'Support Vehicle'];
      if (!validVehicleTypes.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle type',
          field: 'vehicleType',
          validTypes: validVehicleTypes
        });
      }

      // Validate year
      const currentYear = new Date().getFullYear();
      if (year < 1990 || year > currentYear + 1) {
        return res.status(400).json({
          success: false,
          message: `Vehicle year must be between 1990 and ${currentYear + 1}`,
          field: 'year'
        });
      }

      // Validate station exists (basic check)
      if (!mongoose.Types.ObjectId.isValid(homeStationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid station ID format',
          field: 'homeStationId'
        });
      }

      // Create new vehicle with pending approval status
      const newVehicle = new Vehicle({
        registration: {
          plateNumber: plateNumber.toUpperCase(),
          vehicleType,
          make: make.trim(),
          model: model.trim(),
          year,
          registrationDate: new Date(),
          approvedBy: req.user._id // Will be updated when approved
        },
        status: {
          operational: 'maintenance', // Start in maintenance until approved
          currentStatus: 'available',
          currentLocation: {
            type: 'Point',
            coordinates: [79.8612, 6.9271] // Default to Colombo coordinates
          },
          lastLocationUpdate: new Date()
        },
        assignment: {
          currentIncidentId: null,
          crew: []
        },
        equipment: {
          items: equipmentItems || []
        },
        station: {
          homeStationId: homeStationId,
          currentStationId: homeStationId
        },
        isActive: false, // Inactive until approved
        audit: {
          createdBy: req.user._id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const savedVehicle = await newVehicle.save();

      // Log the registration action
      await AuditLog.logAction({
        actionType: 'create',
        description: `Vehicle registration submitted: ${vehicleType} ${plateNumber}`,
        outcome: 'success',
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(' ', '_'),
        entityType: 'Vehicle',
        entityId: savedVehicle._id,
        entityName: `${vehicleType} - ${plateNumber}`,
        module: 'vehicle_management',
        feature: 'vehicle_registration',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'medium',
        isPrivileged: true
      });

      // Populate the response with referenced data
      const populatedVehicle = await Vehicle.findById(savedVehicle._id)
        .populate('registration.approvedBy', 'personal.firstName personal.lastName auth.role')
        .populate('audit.createdBy', 'personal.firstName personal.lastName');

      console.log('✅ Vehicle registration successful:', plateNumber);

      res.status(201).json({
        success: true,
        message: 'Vehicle registration submitted successfully. Pending approval.',
        data: {
          vehicle: populatedVehicle,
          status: 'pending_approval',
          nextSteps: [
            'Vehicle will be reviewed by a supervisor',
            'Email notification will be sent upon approval decision',
            'Vehicle will be available for dispatch once approved'
          ]
        }
      });

    } catch (error) {
      console.error('❌ Vehicle registration error:', error);

      // Log the failed action
      if (req.user) {
        await AuditLog.logAction({
          actionType: 'create',
          description: `Failed vehicle registration attempt`,
          outcome: 'failure',
          userId: req.user._id,
          username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
          userRole: req.user.auth.role.toLowerCase().replace(' ', '_'),
          entityType: 'Vehicle',
          module: 'vehicle_management',
          feature: 'vehicle_registration',
          error: {
            code: error.code || 'REGISTRATION_ERROR',
            message: error.message,
            category: 'system'
          },
          riskLevel: 'low'
        });
      }

      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {});

        return res.status(400).json({
          success: false,
          message: 'Vehicle validation failed',
          errors: validationErrors
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle with this information already exists',
          duplicateField: Object.keys(error.keyValue)[0]
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to register vehicle',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all vehicles with filtering and pagination
   * GET /api/vehicles
   */
  static async getAllVehicles(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        vehicleType,
        stationId,
        search,
        sortBy = 'registration.registrationDate',
        sortOrder = 'desc'
      } = req.query;

      // Build query based on filters
      let query = {};

      // Only show active vehicles for non-admin users
      if (req.user.auth.role !== 'Admin') {
        query.isActive = true;
      }

      if (status) {
        if (status === 'available') {
          query['status.operational'] = 'active';
          query['status.currentStatus'] = 'available';
        } else if (status === 'assigned') {
          query['status.currentStatus'] = { $in: ['assigned', 'en_route', 'on_scene'] };
        } else {
          query['status.operational'] = status;
        }
      }

      if (vehicleType) {
        query['registration.vehicleType'] = vehicleType;
      }

      if (stationId) {
        query['station.homeStationId'] = stationId;
      }

      if (search) {
        query.$or = [
          { 'registration.plateNumber': { $regex: search, $options: 'i' } },
          { 'registration.make': { $regex: search, $options: 'i' } },
          { 'registration.model': { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      const sortObject = { [sortBy]: sortDirection };

      const [vehicles, total] = await Promise.all([
        Vehicle.find(query)
          .populate('registration.approvedBy', 'personal.firstName personal.lastName')
          .populate('station.homeStationId', 'name location')
          .populate('assignment.crew', 'personal.firstName personal.lastName professional.role')
          .sort(sortObject)
          .skip(skip)
          .limit(parseInt(limit)),
        Vehicle.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Vehicles retrieved successfully',
        data: {
          vehicles,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalVehicles: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            status,
            vehicleType,
            stationId,
            search,
            sortBy,
            sortOrder
          }
        }
      });

    } catch (error) {
      console.error('❌ Get vehicles error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicles',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get vehicles pending approval (US-011: Vehicle Registration Approval)
   * GET /api/vehicles/pending-approval
   */
  static async getPendingApprovals(req, res) {
    try {
      console.log('📋 Fetching vehicles pending approval for:', req.user.personal.firstName);
      console.log('🔍 User role:', req.user.auth.role);

      // Query for pending vehicles
      const query = {
        isActive: false,
        'status.operational': 'maintenance'
      };
      
      console.log('🔎 Query:', JSON.stringify(query, null, 2));

      const pendingVehicles = await Vehicle.find(query)
        .populate('registration.approvedBy', 'personal.firstName personal.lastName')
        .populate('station.homeStationId', 'name location')
        .populate('audit.createdBy', 'personal.firstName personal.lastName auth.role')
        .sort({ 'audit.createdAt': -1 });

      console.log(`📊 Found ${pendingVehicles.length} pending vehicles`);

      const processedVehicles = pendingVehicles.map(vehicle => ({
        ...vehicle.toObject(),
        pendingSince: vehicle.audit.createdAt,
        daysPending: Math.floor((new Date() - vehicle.audit.createdAt) / (1000 * 60 * 60 * 24))
      }));

      res.status(200).json({
        success: true,
        message: pendingVehicles.length > 0 
          ? 'Pending vehicle approvals retrieved successfully'
          : 'No pending vehicle approvals found',
        data: {
          pendingVehicles: processedVehicles,
          count: processedVehicles.length,
          summary: {
            total: processedVehicles.length,
            overdue: processedVehicles.filter(v => v.daysPending > 7).length,
            urgent: processedVehicles.filter(v => v.daysPending > 3 && v.daysPending <= 7).length
          }
        }
      });

    } catch (error) {
      console.error('❌ Get pending approvals error:', error);
      console.error('❌ Error stack:', error.stack);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending approvals',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name
        } : undefined
      });
    }
  }

  /**
   * Validate plate number uniqueness
   * POST /api/vehicles/validate-plate
   */
  static async validatePlateNumber(req, res) {
    try {
      const { plateNumber, excludeId } = req.body;

      if (!plateNumber) {
        return res.status(400).json({
          success: false,
          message: 'Plate number is required',
          field: 'plateNumber'
        });
      }

      // Validate format
      const plateRegex = /^[A-Z]{2,3}-[0-9]{4}$/;
      const normalizedPlate = plateNumber.toUpperCase().trim();

      if (!plateRegex.test(normalizedPlate)) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Invalid plate number format. Use format like CAB-1234',
          suggestions: ['Format: 2-3 letters, hyphen, 4 digits (e.g., CAB-1234)']
        });
      }

      // Check uniqueness
      let query = { 'registration.plateNumber': normalizedPlate };
      
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingVehicle = await Vehicle.findOne(query);

      if (existingVehicle) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Plate number already exists',
          conflict: {
            vehicleId: existingVehicle._id,
            vehicleType: existingVehicle.registration.vehicleType,
            make: existingVehicle.registration.make,
            model: existingVehicle.registration.model
          }
        });
      }

      res.status(200).json({
        success: true,
        valid: true,
        message: 'Plate number is available',
        normalizedPlate
      });

    } catch (error) {
      console.error('❌ Plate validation error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to validate plate number',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get available vehicles by type for dispatch
   * GET /api/vehicles/available/:vehicleType
   */
  static async getAvailableVehiclesByType(req, res) {
    try {
      const { vehicleType } = req.params;
      const { includeLocation = false } = req.query;

      const availableVehicles = await Vehicle.findAvailableByType(vehicleType)
        .populate('station.homeStationId', 'name location coordinates')
        .populate('assignment.crew', 'personal.firstName personal.lastName professional.role');

      const processedVehicles = availableVehicles.map(vehicle => {
        const vehicleData = vehicle.toObject();
        
        if (includeLocation === 'true') {
          return vehicleData;
        } else {
          // Remove sensitive location data for basic queries
          delete vehicleData.status.currentLocation;
          return vehicleData;
        }
      });

      res.status(200).json({
        success: true,
        message: `Available ${vehicleType.toLowerCase()}s retrieved successfully`,
        data: {
          vehicles: processedVehicles,
          count: processedVehicles.length,
          vehicleType
        }
      });

    } catch (error) {
      console.error('❌ Get available vehicles error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve available vehicles',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get vehicles near a location for dispatch optimization
   * GET /api/vehicles/near/:longitude/:latitude
   */
  static async getVehiclesNearLocation(req, res) {
    try {
      const { longitude, latitude } = req.params;
      const { maxDistance = 10000, vehicleType, limit = 10 } = req.query;

      const lon = parseFloat(longitude);
      const lat = parseFloat(latitude);

      if (isNaN(lon) || isNaN(lat)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates provided'
        });
      }

      // Build query for nearby vehicles
      let query = {
        'status.currentLocation': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            },
            $maxDistance: parseInt(maxDistance)
          }
        },
        isActive: true,
        'status.operational': 'active'
      };

      if (vehicleType) {
        query['registration.vehicleType'] = vehicleType;
      }

      const nearbyVehicles = await Vehicle.find(query)
        .limit(parseInt(limit))
        .populate('station.homeStationId', 'name')
        .populate('assignment.crew', 'personal.firstName personal.lastName professional.role');

      // Calculate distances and add to response
      const vehiclesWithDistance = nearbyVehicles.map(vehicle => {
        const vehicleCoords = vehicle.status.currentLocation.coordinates;
        const distance = calculateDistance(lat, lon, vehicleCoords[1], vehicleCoords[0]);
        
        return {
          ...vehicle.toObject(),
          distance: {
            meters: Math.round(distance),
            kilometers: Math.round(distance / 10) / 100
          }
        };
      });

      res.status(200).json({
        success: true,
        message: 'Nearby vehicles retrieved successfully',
        data: {
          vehicles: vehiclesWithDistance,
          count: vehiclesWithDistance.length,
          searchCriteria: {
            location: { longitude: lon, latitude: lat },
            maxDistance: parseInt(maxDistance),
            vehicleType: vehicleType || 'all'
          }
        }
      });

    } catch (error) {
      console.error('❌ Get nearby vehicles error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve nearby vehicles',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Approve a vehicle registration (US-011: Vehicle Registration Approval)
   * POST /api/vehicles/:id/approve
   */
  static async approveVehicle(req, res) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      console.log(`✅ Approving vehicle ${id} by:`, req.user.personal.firstName, req.user.personal.lastName);

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      if (vehicle.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is already approved and active'
        });
      }

      // Update vehicle status
      vehicle.isActive = true;
      vehicle.status.operational = 'active';
      vehicle.registration.approvedBy = req.user._id;
      vehicle.audit.updatedAt = new Date();

      await vehicle.save();

      // Log the approval action
      await AuditLog.logAction({
        actionType: 'approve',
        description: `Vehicle approved: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: 'success',
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(' ', '_'),
        entityType: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: 'vehicle_management',
        feature: 'vehicle_approval',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'medium',
        isPrivileged: true,
        metadata: {
          comments,
          approvalDate: new Date()
        }
      });

      const approvedVehicle = await Vehicle.findById(id)
        .populate('registration.approvedBy', 'personal.firstName personal.lastName')
        .populate('station.homeStationId', 'name location');

      console.log(`✅ Vehicle approved successfully:`, vehicle.registration.plateNumber);

      res.status(200).json({
        success: true,
        message: 'Vehicle approved successfully',
        data: {
          vehicle: approvedVehicle,
          approvalDetails: {
            approvedBy: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            approvedAt: new Date(),
            comments: comments || 'No comments provided'
          }
        }
      });

      // TODO: Send email notification to the original registrant
      // This would be implemented with the email service

    } catch (error) {
      console.error('❌ Vehicle approval error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to approve vehicle',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Reject a vehicle registration (US-011: Vehicle Registration Approval)
   * POST /api/vehicles/:id/reject
   */
  static async rejectVehicle(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
          field: 'reason'
        });
      }

      console.log(`❌ Rejecting vehicle ${id} by:`, req.user.personal.firstName, req.user.personal.lastName);

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      if (vehicle.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reject an already approved vehicle'
        });
      }

      // Mark vehicle as rejected instead of deleting (for history tracking)
      vehicle.isActive = false;
      vehicle.rejectionDetails = {
        rejectedBy: req.user._id,
        rejectedAt: new Date(),
        reason: reason,
        status: 'rejected'
      };
      
      await vehicle.save();

      // Log the rejection action
      await AuditLog.logAction({
        actionType: 'reject',
        description: `Vehicle rejected: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: 'success',
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(' ', '_'),
        entityType: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: 'vehicle_management',
        feature: 'vehicle_approval',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'medium',
        isPrivileged: true,
        metadata: {
          rejectionReason: reason,
          rejectionDate: new Date(),
          originalRegistration: {
            plateNumber: vehicle.registration.plateNumber,
            vehicleType: vehicle.registration.vehicleType,
            make: vehicle.registration.make,
            model: vehicle.registration.model,
            year: vehicle.registration.year
          }
        }
      });

      console.log(`❌ Vehicle marked as rejected (preserved for history):`, vehicle.registration.plateNumber);

      res.status(200).json({
        success: true,
        message: 'Vehicle registration rejected',
        data: {
          rejectionDetails: {
            rejectedBy: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            rejectedAt: new Date(),
            reason: reason,
            vehicleInfo: {
              plateNumber: vehicle.registration.plateNumber,
              vehicleType: vehicle.registration.vehicleType,
              make: vehicle.registration.make,
              model: vehicle.registration.model
            }
          }
        }
      });

      // TODO: Send email notification to the original registrant with rejection reason
      // This would be implemented with the email service

    } catch (error) {
      console.error('❌ Vehicle rejection error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to reject vehicle',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Additional methods would be implemented here...
  // updateVehicleStatus, updateVehicleLocation, getVehicleById, etc.

  /**
   * Get a specific vehicle by ID
   * GET /api/vehicles/:id
   */
  static async getVehicleById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format'
        });
      }

      const vehicle = await Vehicle.findById(id)
        .populate('registration.approvedBy', 'personal.firstName personal.lastName auth.role')
        .populate('station.homeStationId', 'name location coordinates')
        .populate('station.currentStationId', 'name location')
        .populate('assignment.crew', 'personal.firstName personal.lastName professional.role')
        .populate('assignment.currentIncidentId', 'incidentId incidentType status')
        .populate('audit.createdBy', 'personal.firstName personal.lastName');

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Check access permissions - non-admin users can only see active vehicles
      if (req.user.auth.role !== 'Admin' && !vehicle.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      const vehicleData = vehicle.toObject();
      vehicleData.identifier = vehicle.identifier;
      vehicleData.isAvailableForDispatch = vehicle.isAvailableForDispatch();

      res.status(200).json({
        success: true,
        message: 'Vehicle retrieved successfully',
        data: {
          vehicle: vehicleData
        }
      });

    } catch (error) {
      console.error('❌ Get vehicle by ID error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicle',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update vehicle information
   * PUT /api/vehicles/:id
   */
  static async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Store original data for audit log
      const originalData = vehicle.toObject();

      // Update allowed fields
      const allowedUpdates = ['make', 'model', 'year', 'homeStationId', 'equipmentItems'];
      const filteredUpdates = {};

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'homeStationId') {
            filteredUpdates['station.homeStationId'] = updateData[field];
          } else if (field === 'equipmentItems') {
            filteredUpdates['equipment.items'] = updateData[field];
          } else {
            filteredUpdates[`registration.${field}`] = updateData[field];
          }
        }
      });

      filteredUpdates['audit.updatedAt'] = new Date();

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { $set: filteredUpdates },
        { new: true, runValidators: true }
      ).populate('registration.approvedBy', 'personal.firstName personal.lastName');

      // Log the update action
      await AuditLog.logAction({
        actionType: 'update',
        description: `Vehicle updated: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: 'success',
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(' ', '_'),
        entityType: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: 'vehicle_management',
        feature: 'vehicle_update',
        changes: {
          before: originalData,
          after: updatedVehicle.toObject()
        },
        riskLevel: 'medium'
      });

      res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: {
          vehicle: updatedVehicle
        }
      });

    } catch (error) {
      console.error('❌ Update vehicle error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update vehicle operational status
   * PUT /api/vehicles/:id/status
   */
  static async updateVehicleStatus(req, res) {
    try {
      const { id } = req.params;
      const { operational, currentStatus } = req.body;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      const updateData = {};
      if (operational) updateData['status.operational'] = operational;
      if (currentStatus) updateData['status.currentStatus'] = currentStatus;
      updateData['audit.updatedAt'] = new Date();

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Vehicle status updated successfully',
        data: {
          vehicle: updatedVehicle
        }
      });

    } catch (error) {
      console.error('❌ Update vehicle status error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update vehicle location (GPS tracking)
   * PUT /api/vehicles/:id/location
   */
  static async updateVehicleLocation(req, res) {
    try {
      const { id } = req.params;
      const { longitude, latitude } = req.body;

      if (!longitude || !latitude) {
        return res.status(400).json({
          success: false,
          message: 'Longitude and latitude are required'
        });
      }

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      const updateData = {
        'status.currentLocation': {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        'status.lastLocationUpdate': new Date(),
        'audit.updatedAt': new Date()
      };

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Vehicle location updated successfully',
        data: {
          vehicle: updatedVehicle
        }
      });

    } catch (error) {
      console.error('❌ Update vehicle location error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle location',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Deactivate a vehicle (soft delete)
   * DELETE /api/vehicles/:id
   */
  static async deactivateVehicle(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      if (!vehicle.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is already deactivated'
        });
      }

      vehicle.isActive = false;
      vehicle.status.operational = 'out_of_service';
      vehicle.audit.updatedAt = new Date();

      await vehicle.save();

      // Log the deactivation action
      await AuditLog.logAction({
        actionType: 'delete',
        description: `Vehicle deactivated: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: 'success',
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(' ', '_'),
        entityType: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: 'vehicle_management',
        feature: 'vehicle_deactivation',
        metadata: {
          deactivationReason: reason || 'No reason provided'
        },
        riskLevel: 'high',
        isPrivileged: true
      });

      res.status(200).json({
        success: true,
        message: 'Vehicle deactivated successfully',
        data: {
          vehicle,
          deactivationDetails: {
            deactivatedBy: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            deactivatedAt: new Date(),
            reason: reason || 'No reason provided'
          }
        }
      });

    } catch (error) {
      console.error('❌ Deactivate vehicle error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to deactivate vehicle',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get vehicle assignment and status history
   * GET /api/vehicles/:id/history
   */
  static async getVehicleHistory(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Get audit log history for this vehicle
      const history = await AuditLog.findByEntity('Vehicle', id, {
        limit: parseInt(limit),
        actionTypes: ['create', 'update', 'approve', 'reject', 'assign', 'unassign']
      });

      res.status(200).json({
        success: true,
        message: 'Vehicle history retrieved successfully',
        data: {
          vehicle: {
            id: vehicle._id,
            identifier: vehicle.identifier,
            plateNumber: vehicle.registration.plateNumber,
            vehicleType: vehicle.registration.vehicleType
          },
          history
        }
      });

    } catch (error) {
      console.error('❌ Get vehicle history error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicle history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all approved vehicles
   * GET /api/vehicles/approved
   */
  static async getApprovedVehicles(req, res) {
    try {
      console.log('📋 Fetching approved vehicles');

      const approvedVehicles = await Vehicle.find({ 
        isActive: true,
        rejectionDetails: { $exists: false }
      })
        .populate('registration.approvedBy', 'personal.firstName personal.lastName auth.role')
        .populate('station.homeStationId', 'name location')
        .sort({ 'registration.approvalDate': -1 });

      res.status(200).json({
        success: true,
        count: approvedVehicles.length,
        data: {
          approvedVehicles: approvedVehicles
        }
      });

    } catch (error) {
      console.error('❌ Get approved vehicles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve approved vehicles',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all rejected vehicles
   * GET /api/vehicles/rejected
   */
  static async getRejectedVehicles(req, res) {
    try {
      console.log('📋 Fetching rejected vehicles');

      const rejectedVehicles = await Vehicle.find({ 
        'rejectionDetails.status': 'rejected'
      })
        .populate('rejectionDetails.rejectedBy', 'personal.firstName personal.lastName auth.role')
        .populate('station.homeStationId', 'name location')
        .sort({ 'rejectionDetails.rejectedAt': -1 });

      res.status(200).json({
        success: true,
        count: rejectedVehicles.length,
        data: {
          rejectedVehicles: rejectedVehicles
        }
      });

    } catch (error) {
      console.error('❌ Get rejected vehicles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve rejected vehicles',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = VehicleController;