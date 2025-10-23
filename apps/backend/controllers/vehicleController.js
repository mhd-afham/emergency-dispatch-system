const Vehicle = require("../models/Vehicle");
const Crew = require("../models/Crew");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

/**
 * Vehicle Controller for Emergency Dispatch System
 * Handles vehicle tracking, management, registration, and approval operations
 * Implements Phase 3 Vehicle Tracking + US-010, US-011 (Vehicle Registration & Approval)
 */
class VehicleController {
  /**
   * Register a new vehicle (US-010: Vehicle Registration)
   * POST /api/vehicles
   */
  static async registerVehicle(req, res) {
    try {
      console.log(
        "🚛 Registering new vehicle - Registered by:",
        req.user.personal.firstName,
        req.user.personal.lastName
      );
      console.log(
        "🔍 Vehicle registration data:",
        JSON.stringify(req.body, null, 2)
      );

      const {
        plateNumber,
        vehicleType,
        make,
        model,
        year,
        homeStationId,
        equipmentItems,
      } = req.body;

      // Validate required fields
      const requiredFields = [
        "plateNumber",
        "vehicleType",
        "make",
        "model",
        "year",
        "homeStationId",
      ];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${field}`,
            field: field,
          });
        }
      }

      // Validate plate number format (Sri Lankan format)
      const plateRegex = /^[A-Z]{2,3}-[0-9]{4}$/;
      if (!plateRegex.test(plateNumber.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid plate number format. Use format like CAB-1234",
          field: "plateNumber",
        });
      }

      // Check if plate number already exists
      const existingVehicle = await Vehicle.findOne({
        "registration.plateNumber": plateNumber.toUpperCase(),
      });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message: "Vehicle with this plate number already exists",
          field: "plateNumber",
          existingVehicleId: existingVehicle._id,
        });
      }

      // Validate vehicle type
      const validVehicleTypes = [
        "Ambulance",
        "Fire Engine",
        "Rescue Vehicle",
        "Support Vehicle",
      ];
      if (!validVehicleTypes.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle type",
          field: "vehicleType",
          validTypes: validVehicleTypes,
        });
      }

      // Validate year
      const currentYear = new Date().getFullYear();
      if (year < 1990 || year > currentYear + 1) {
        return res.status(400).json({
          success: false,
          message: `Vehicle year must be between 1990 and ${currentYear + 1}`,
          field: "year",
        });
      }

      // Validate station exists (basic check)
      if (!mongoose.Types.ObjectId.isValid(homeStationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid station ID format",
          field: "homeStationId",
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
          approvedBy: req.user._id, // Will be updated when approved
        },
        status: {
          operational: "maintenance", // Start in maintenance until approved
          currentStatus: "available",
          currentLocation: {
            type: "Point",
            coordinates: [79.8612, 6.9271], // Default to Colombo coordinates
          },
          lastLocationUpdate: new Date(),
        },
        assignment: {
          currentIncidentId: null,
          crew: [],
        },
        equipment: {
          items: equipmentItems || [],
        },
        station: {
          homeStationId: homeStationId,
          currentStationId: homeStationId,
        },
        isActive: false, // Inactive until approved
        audit: {
          createdBy: req.user._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const savedVehicle = await newVehicle.save();

      // Log the registration action
      await AuditLog.logAction({
        actionType: "create",
        description: `Vehicle registration submitted: ${vehicleType} ${plateNumber}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Vehicle",
        entityId: savedVehicle._id,
        entityName: `${vehicleType} - ${plateNumber}`,
        module: "vehicle_management",
        feature: "vehicle_registration",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        riskLevel: "medium",
        isPrivileged: true,
      });

      // Populate the response with referenced data
      const populatedVehicle = await Vehicle.findById(savedVehicle._id)
        .populate("audit.createdBy", "personal.firstName personal.lastName")
        .populate(
          "registrationStatus.approvedBy",
          "personal.firstName personal.lastName auth.role"
        )
        .populate(
          "registrationStatus.rejectedBy",
          "personal.firstName personal.lastName auth.role"
        );

      console.log("✅ Vehicle registration successful:", plateNumber);

      res.status(201).json({
        success: true,
        message:
          "Vehicle registration submitted successfully. Pending approval.",
        data: {
          vehicle: populatedVehicle,
          status: "pending_approval",
          nextSteps: [
            "Vehicle will be reviewed by a supervisor",
            "Email notification will be sent upon approval decision",
            "Vehicle will be available for dispatch once approved",
          ],
        },
      });
    } catch (error) {
      console.error("❌ Vehicle registration error:", error);

      // Log the failed action (wrapped in try-catch to prevent secondary failures)
      if (req.user) {
        try {
          await AuditLog.logAction({
            actionType: "create",
            description: `Failed vehicle registration attempt`,
            outcome: "failure",
            userId: req.user._id,
            username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
            entityType: "Vehicle",
            module: "vehicle_management",
            feature: "vehicle_registration",
            error: {
              code: error.code || "REGISTRATION_ERROR",
              message: error.message,
              category: "system",
            },
            riskLevel: "low",
          });
        } catch (auditError) {
          console.error(
            "⚠️ Failed to log audit (non-critical):",
            auditError.message
          );
        }
      }

      if (error.name === "ValidationError") {
        const validationErrors = Object.keys(error.errors).reduce(
          (acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
          },
          {}
        );

        return res.status(400).json({
          success: false,
          message: "Vehicle validation failed",
          errors: validationErrors,
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Vehicle with this information already exists",
          duplicateField: Object.keys(error.keyValue)[0],
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to register vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get all vehicles with filtering and pagination
   * GET /api/vehicles
   */
  static async getAllVehicles(req, res) {
    try {
      console.log(
        "🚗 Fetching all vehicles - Requested by:",
        req.user.personal?.firstName || req.user.firstName,
        req.user.personal?.lastName || req.user.lastName
      );

      // Extract query parameters for filtering (merged from both implementations)
      const {
        page = 1,
        limit = 50,
        status, // operational status or combined status
        currentStatus, // specific current status
        vehicleType,
        assignedIncident,
        stationId,
        search,
        populate, // populate crew data
        registrationStatus, // filter by registration status
        sortBy = "status.lastLocationUpdate",
        sortOrder = "desc",
      } = req.query;

      // Build filter object
      const filter = {};

      // Always exclude out_of_service vehicles from listings (October 22, 2025)
      // Out-of-service vehicles should not appear in any operational views
      filter["status.operational"] = { $ne: "out_of_service" };

      // Only show active vehicles for non-admin users
      if (req.user.auth?.role !== "Admin") {
        filter.isActive = true;
        filter["registrationStatus.status"] = "approved";
      } else if (registrationStatus) {
        // Allow admin to view all registration statuses
        filter["registrationStatus.status"] = registrationStatus;
      } else {
        // Default to approved for admin too unless specified
        filter["registrationStatus.status"] = "approved";
      }

      // Handle status filtering (merged logic)
      if (status) {
        if (status === "available") {
          // Override the default $ne filter when explicitly requesting available
          filter["status.operational"] = "active";
          filter["status.currentStatus"] = "available";
        } else if (status === "assigned") {
          filter["status.currentStatus"] = {
            $in: ["assigned", "en_route", "on_scene"],
          };
        } else if (status === "active" || status === "maintenance") {
          // Allow filtering by operational status (but still exclude out_of_service)
          filter["status.operational"] = status;
        }
      }

      if (currentStatus) {
        filter["status.currentStatus"] = currentStatus;
      }

      if (vehicleType) {
        filter["registration.vehicleType"] = vehicleType;
      }

      if (assignedIncident) {
        filter["assignment.currentIncidentId"] = assignedIncident;
      }

      if (stationId) {
        filter["station.homeStationId"] = stationId;
      }

      if (search) {
        filter.$or = [
          { "registration.plateNumber": { $regex: search, $options: "i" } },
          { "registration.make": { $regex: search, $options: "i" } },
          { "registration.model": { $regex: search, $options: "i" } },
        ];
      }

      console.log("🔍 Applied filters:", filter);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortDirection = sortOrder === "desc" ? -1 : 1;
      const sortObject = { [sortBy]: sortDirection };

      // Build query with proper population
      let query = Vehicle.find(filter)
        .populate(
          "registrationStatus.approvedBy",
          "personal.firstName personal.lastName"
        )
        .populate(
          "registrationStatus.rejectedBy",
          "personal.firstName personal.lastName"
        )
        .populate("station.homeStationId", "name location")
        .sort(sortObject)
        .limit(parseInt(limit))
        .skip(skip);

      // Populate crew data if requested
      if (populate === "crew") {
        query = query.populate({
          path: "assignment.crew",
          model: "Crew",
          select: "employeeId personal professional",
        });
        console.log("👥 Populating crew data with leader information");
      } else {
        query = query.populate(
          "assignment.crew",
          "personal.firstName personal.lastName professional.role"
        );
      }

      // Fetch vehicles with pagination
      const [vehicles, totalCount] = await Promise.all([
        query.exec(),
        Vehicle.countDocuments(filter),
      ]);

      console.log(
        `📊 Found ${
          vehicles.length
        } vehicles (${totalCount} total matching filters)${
          populate === "crew" ? " with crew data" : ""
        }`
      );

      res.status(200).json({
        success: true,
        message: `Successfully retrieved ${vehicles.length} vehicles`,
        data: vehicles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          totalVehicles: totalCount,
          hasNextPage: skip + vehicles.length < totalCount,
          hasPreviousPage: parseInt(page) > 1,
          hasNext: skip + vehicles.length < totalCount,
          hasPrev: parseInt(page) > 1,
        },
        filters: {
          status,
          currentStatus,
          vehicleType,
          stationId,
          search,
          sortBy,
          sortOrder,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vehicles",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get vehicles pending approval (US-011: Vehicle Registration Approval)
   * GET /api/vehicles/pending-approval
   */
  static async getPendingApprovals(req, res) {
    try {
      console.log(
        "📋 Fetching vehicles pending approval for:",
        req.user.personal.firstName
      );
      console.log("🔍 User role:", req.user.auth.role);

      // Query for pending vehicles
      const query = {
        isActive: false,
        "status.operational": "maintenance",
        "registrationStatus.status": "pending",
      };

      console.log("🔎 Query:", JSON.stringify(query, null, 2));

      const pendingVehicles = await Vehicle.find(query)
        .populate("station.homeStationId", "name location")
        .populate(
          "audit.createdBy",
          "personal.firstName personal.lastName auth.role"
        )
        .sort({ "audit.createdAt": -1 });

      console.log(`📊 Found ${pendingVehicles.length} pending vehicles`);

      const processedVehicles = pendingVehicles.map((vehicle) => ({
        ...vehicle.toObject(),
        pendingSince: vehicle.audit.createdAt,
        daysPending: Math.floor(
          (new Date() - vehicle.audit.createdAt) / (1000 * 60 * 60 * 24)
        ),
      }));

      res.status(200).json({
        success: true,
        message:
          pendingVehicles.length > 0
            ? "Pending vehicle approvals retrieved successfully"
            : "No pending vehicle approvals found",
        data: {
          pendingVehicles: processedVehicles,
          count: processedVehicles.length,
          summary: {
            total: processedVehicles.length,
            overdue: processedVehicles.filter((v) => v.daysPending > 7).length,
            urgent: processedVehicles.filter(
              (v) => v.daysPending > 3 && v.daysPending <= 7
            ).length,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get pending approvals error:", error);
      console.error("❌ Error stack:", error.stack);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve pending approvals",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? {
                stack: error.stack,
                name: error.name,
              }
            : undefined,
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
          message: "Plate number is required",
          field: "plateNumber",
        });
      }

      // Validate format
      const plateRegex = /^[A-Z]{2,3}-[0-9]{4}$/;
      const normalizedPlate = plateNumber.toUpperCase().trim();

      if (!plateRegex.test(normalizedPlate)) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Invalid plate number format. Use format like CAB-1234",
          suggestions: [
            "Format: 2-3 letters, hyphen, 4 digits (e.g., CAB-1234)",
          ],
        });
      }

      // Check uniqueness
      let query = { "registration.plateNumber": normalizedPlate };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingVehicle = await Vehicle.findOne(query);

      if (existingVehicle) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Plate number already exists",
          conflict: {
            vehicleId: existingVehicle._id,
            vehicleType: existingVehicle.registration.vehicleType,
            make: existingVehicle.registration.make,
            model: existingVehicle.registration.model,
          },
        });
      }

      res.status(200).json({
        success: true,
        valid: true,
        message: "Plate number is available",
        normalizedPlate,
      });
    } catch (error) {
      console.error("❌ Plate validation error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to validate plate number",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
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
        .populate("station.homeStationId", "name location coordinates")
        .populate(
          "assignment.crew",
          "personal.firstName personal.lastName professional.role"
        );

      const processedVehicles = availableVehicles.map((vehicle) => {
        const vehicleData = vehicle.toObject();

        if (includeLocation === "true") {
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
          vehicleType,
        },
      });
    } catch (error) {
      console.error("❌ Get available vehicles error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve available vehicles",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
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
          message: "Invalid coordinates provided",
        });
      }

      // Build query for nearby vehicles
      let query = {
        "status.currentLocation": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
            $maxDistance: parseInt(maxDistance),
          },
        },
        isActive: true,
        "status.operational": "active",
      };

      if (vehicleType) {
        query["registration.vehicleType"] = vehicleType;
      }

      const nearbyVehicles = await Vehicle.find(query)
        .limit(parseInt(limit))
        .populate("station.homeStationId", "name")
        .populate(
          "assignment.crew",
          "personal.firstName personal.lastName professional.role"
        );

      // Calculate distances and add to response
      const vehiclesWithDistance = nearbyVehicles.map((vehicle) => {
        const vehicleCoords = vehicle.status.currentLocation.coordinates;
        const distance = calculateDistance(
          lat,
          lon,
          vehicleCoords[1],
          vehicleCoords[0]
        );

        return {
          ...vehicle.toObject(),
          distance: {
            meters: Math.round(distance),
            kilometers: Math.round(distance / 10) / 100,
          },
        };
      });

      res.status(200).json({
        success: true,
        message: "Nearby vehicles retrieved successfully",
        data: {
          vehicles: vehiclesWithDistance,
          count: vehiclesWithDistance.length,
          searchCriteria: {
            location: { longitude: lon, latitude: lat },
            maxDistance: parseInt(maxDistance),
            vehicleType: vehicleType || "all",
          },
        },
      });
    } catch (error) {
      console.error("❌ Get nearby vehicles error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve nearby vehicles",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
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
      const { comments } = req.body || {};

      console.log(
        `✅ Approving vehicle ${id} by:`,
        req.user.personal.firstName,
        req.user.personal.lastName
      );

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      if (vehicle.isActive) {
        return res.status(400).json({
          success: false,
          message: "Vehicle is already approved and active",
        });
      }

      // Update vehicle status and registration status
      vehicle.isActive = true;
      vehicle.status.operational = "active";
      vehicle.registrationStatus.status = "approved";
      vehicle.registrationStatus.approvedBy = req.user._id;
      vehicle.registrationStatus.approvedAt = new Date();
      if (comments) {
        vehicle.registrationStatus.notes = comments;
      }
      vehicle.audit.updatedAt = new Date();

      await vehicle.save();

      // Log the approval action
      await AuditLog.logAction({
        actionType: "approve",
        description: `Vehicle approved: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Vehicle",
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: "vehicle_management",
        feature: "vehicle_approval",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        riskLevel: "medium",
        isPrivileged: true,
        metadata: {
          comments,
          approvalDate: new Date(),
        },
      });

      const approvedVehicle = await Vehicle.findById(id)
        .populate(
          "registrationStatus.approvedBy",
          "personal.firstName personal.lastName"
        )
        .populate("station.homeStationId", "name location");

      console.log(
        `✅ Vehicle approved successfully:`,
        vehicle.registration.plateNumber
      );

      res.status(200).json({
        success: true,
        message: "Vehicle approved successfully",
        data: {
          vehicle: approvedVehicle,
          approvalDetails: {
            approvedBy: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            approvedAt: new Date(),
            comments: comments || "No comments provided",
          },
        },
      });

      // TODO: Send email notification to the original registrant
      // This would be implemented with the email service
    } catch (error) {
      console.error("❌ Vehicle approval error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to approve vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
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
          message: "Rejection reason is required",
          field: "reason",
        });
      }

      console.log(
        `❌ Rejecting vehicle ${id} by:`,
        req.user.personal.firstName,
        req.user.personal.lastName
      );

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      if (vehicle.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot reject an already approved vehicle",
        });
      }

      // Mark vehicle as rejected instead of deleting (for history tracking)
      vehicle.isActive = false;
      vehicle.registrationStatus.status = "rejected";
      vehicle.registrationStatus.rejectedBy = req.user._id;
      vehicle.registrationStatus.rejectedAt = new Date();
      vehicle.registrationStatus.rejectionReason = reason;

      await vehicle.save();

      // Log the rejection action
      await AuditLog.logAction({
        actionType: "reject",
        description: `Vehicle rejected: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Vehicle",
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: "vehicle_management",
        feature: "vehicle_approval",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        riskLevel: "medium",
        isPrivileged: true,
        metadata: {
          rejectionReason: reason,
          rejectionDate: new Date(),
          originalRegistration: {
            plateNumber: vehicle.registration.plateNumber,
            vehicleType: vehicle.registration.vehicleType,
            make: vehicle.registration.make,
            model: vehicle.registration.model,
            year: vehicle.registration.year,
          },
        },
      });

      console.log(
        `❌ Vehicle marked as rejected (preserved for history):`,
        vehicle.registration.plateNumber
      );

      res.status(200).json({
        success: true,
        message: "Vehicle registration rejected",
        data: {
          rejectionDetails: {
            rejectedBy: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            rejectedAt: new Date(),
            reason: reason,
            vehicleInfo: {
              plateNumber: vehicle.registration.plateNumber,
              vehicleType: vehicle.registration.vehicleType,
              make: vehicle.registration.make,
              model: vehicle.registration.model,
            },
          },
        },
      });

      // TODO: Send email notification to the original registrant with rejection reason
      // This would be implemented with the email service
    } catch (error) {
      console.error("❌ Vehicle rejection error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to reject vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Clear rejection status and allow resubmission
   * PATCH /api/vehicles/:id/clear-rejection
   */
  static async clearRejection(req, res) {
    try {
      const { id } = req.params;

      console.log(
        `🔄 Clearing rejection status for vehicle ${id} by:`,
        req.user.personal.firstName,
        req.user.personal.lastName
      );

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      if (vehicle.registrationStatus.status !== "rejected") {
        return res.status(400).json({
          success: false,
          message: "Vehicle is not rejected",
        });
      }

      // Store rejection info for audit log before clearing
      const previousRejection = {
        reason: vehicle.registrationStatus.rejectionReason,
        rejectedAt: vehicle.registrationStatus.rejectedAt,
        rejectedBy: vehicle.registrationStatus.rejectedBy,
      };

      // Clear rejection details and set back to pending
      vehicle.registrationStatus.status = "pending";
      vehicle.registrationStatus.rejectedBy = undefined;
      vehicle.registrationStatus.rejectedAt = undefined;
      vehicle.registrationStatus.rejectionReason = undefined;
      vehicle.isActive = false;
      vehicle.status.operational = "maintenance";

      await vehicle.save();

      // Log the clear rejection action
      await AuditLog.logAction({
        actionType: "update",
        description: `Rejection cleared for vehicle: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Vehicle",
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: "vehicle_management",
        feature: "vehicle_resubmission",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        riskLevel: "medium",
        isPrivileged: true,
        metadata: {
          previousRejection,
          clearedBy: {
            firstName: req.user.personal.firstName,
            lastName: req.user.personal.lastName,
            role: req.user.auth.role,
          },
          clearedAt: new Date(),
        },
      });

      console.log(
        `✅ Rejection cleared for vehicle:`,
        vehicle.registration.plateNumber
      );

      res.status(200).json({
        success: true,
        message: "Rejection status cleared successfully",
        data: vehicle,
      });
    } catch (error) {
      console.error("❌ Clear rejection error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to clear rejection status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get a specific vehicle by ID
   * GET /api/vehicles/:id
   */
  static async getVehicleById(req, res) {
    try {
      const { id } = req.params;
      console.log(
        `🚗 Fetching vehicle ${id} - Requested by:`,
        req.user.personal?.firstName || req.user.firstName,
        req.user.personal?.lastName || req.user.lastName
      );

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID format",
        });
      }

      const vehicle = await Vehicle.findById(id)
        .populate(
          "registrationStatus.approvedBy",
          "personal.firstName personal.lastName auth.role"
        )
        .populate(
          "registrationStatus.rejectedBy",
          "personal.firstName personal.lastName auth.role"
        )
        .populate("station.homeStationId", "name location coordinates")
        .populate("station.currentStationId", "name location")
        .populate(
          "assignment.crew",
          "personal.firstName personal.lastName professional.role"
        )
        .populate(
          "assignment.currentIncidentId",
          "incidentId incidentType status"
        )
        .populate("audit.createdBy", "personal.firstName personal.lastName");

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Check access permissions - non-admin users can only see active vehicles
      if (req.user.auth?.role !== "Admin" && !vehicle.isActive) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      console.log(
        `✅ Vehicle found: ${vehicle.registration.plateNumber} (${vehicle.registration.vehicleType})`
      );

      const vehicleData = vehicle.toObject();
      vehicleData.identifier = vehicle.identifier;
      vehicleData.isAvailableForDispatch = vehicle.isAvailableForDispatch();

      res.status(200).json({
        success: true,
        message: "Vehicle retrieved successfully",
        data: {
          vehicle: vehicleData,
        },
      });
    } catch (error) {
      console.error("❌ Get vehicle by ID error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
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
          message: "Vehicle not found",
        });
      }

      // Store original data for audit log
      const originalData = vehicle.toObject();

      // Update allowed fields
      const allowedUpdates = [
        "make",
        "model",
        "year",
        "homeStationId",
        "equipmentItems",
      ];
      const filteredUpdates = {};

      allowedUpdates.forEach((field) => {
        if (updateData[field] !== undefined) {
          if (field === "homeStationId") {
            filteredUpdates["station.homeStationId"] = updateData[field];
          } else if (field === "equipmentItems") {
            filteredUpdates["equipment.items"] = updateData[field];
          } else {
            filteredUpdates[`registration.${field}`] = updateData[field];
          }
        }
      });

      filteredUpdates["audit.updatedAt"] = new Date();

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { $set: filteredUpdates },
        { new: true, runValidators: true }
      )
        .populate(
          "registrationStatus.approvedBy",
          "personal.firstName personal.lastName"
        )
        .populate(
          "registrationStatus.rejectedBy",
          "personal.firstName personal.lastName"
        );

      // Log the update action
      await AuditLog.logAction({
        actionType: "update",
        description: `Vehicle updated: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Vehicle",
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: "vehicle_management",
        feature: "vehicle_update",
        changes: {
          before: originalData,
          after: updatedVehicle.toObject(),
        },
        riskLevel: "medium",
      });

      res.status(200).json({
        success: true,
        message: "Vehicle updated successfully",
        data: {
          vehicle: updatedVehicle,
        },
      });
    } catch (error) {
      console.error("❌ Update vehicle error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
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

      console.log(
        `🚗 Updating vehicle ${id} status - Requested by:`,
        req.user.personal?.firstName || req.user.firstName,
        req.user.personal?.lastName || req.user.lastName
      );
      console.log("📝 Status update:", { operational, currentStatus });

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID format",
        });
      }

      // Validate status values
      const validOperationalStatuses = [
        "active",
        "maintenance",
        "out_of_service",
      ];
      const validCurrentStatuses = [
        "available",
        "assigned",
        "en_route",
        "on_scene",
        "returning",
      ];

      if (operational && !validOperationalStatuses.includes(operational)) {
        return res.status(400).json({
          success: false,
          message: `Invalid operational status. Must be one of: ${validOperationalStatuses.join(
            ", "
          )}`,
        });
      }

      if (currentStatus && !validCurrentStatuses.includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid current status. Must be one of: ${validCurrentStatuses.join(
            ", "
          )}`,
        });
      }

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Build update object
      const updateData = {};
      if (operational) updateData["status.operational"] = operational;
      if (currentStatus) updateData["status.currentStatus"] = currentStatus;
      updateData["audit.updatedAt"] = new Date();

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log(
        `✅ Vehicle status updated: ${updatedVehicle.registration.plateNumber}`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_status_update", {
          vehicleId: updatedVehicle._id,
          status: currentStatus,
          operational: operational,
          assignedIncidentId: updatedVehicle.assignment?.currentIncidentId,
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_status_update");
      }

      res.status(200).json({
        success: true,
        message: "Vehicle status updated successfully",
        data: {
          vehicle: updatedVehicle,
        },
      });
    } catch (error) {
      console.error("❌ Update vehicle status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Update vehicle location (GPS coordinates)
   * PUT /api/vehicles/:id/location
   */
  static async updateVehicleLocation(req, res) {
    try {
      const { id } = req.params;
      const { coordinates, longitude, latitude } = req.body; // Support both formats

      console.log(
        `🚗 Updating vehicle ${id} location - Requested by:`,
        req.user.personal?.firstName || req.user.firstName,
        req.user.personal?.lastName || req.user.lastName
      );

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID format",
        });
      }

      let lon, lat;

      // Support both coordinate formats
      if (
        coordinates &&
        Array.isArray(coordinates) &&
        coordinates.length === 2
      ) {
        [lon, lat] = coordinates;
      } else if (longitude !== undefined && latitude !== undefined) {
        lon = parseFloat(longitude);
        lat = parseFloat(latitude);
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Coordinates must be provided as [longitude, latitude] array or as separate longitude and latitude fields",
        });
      }

      // Validate coordinate values
      if (
        typeof lon !== "number" ||
        typeof lat !== "number" ||
        isNaN(lon) ||
        isNaN(lat)
      ) {
        return res.status(400).json({
          success: false,
          message: "Coordinates must be numeric values",
        });
      }

      // Validate coordinate ranges
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid coordinate values. Longitude: -180 to 180, Latitude: -90 to 90",
        });
      }

      console.log("📍 Location update:", [lon, lat]);

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      const updateData = {
        "status.currentLocation": {
          type: "Point",
          coordinates: [lon, lat],
        },
        "status.lastLocationUpdate": new Date(),
        "audit.updatedAt": new Date(),
      };

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log(
        `✅ Vehicle location updated: ${updatedVehicle.registration.plateNumber} at [${lon}, ${lat}]`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_location_update", {
          vehicleId: updatedVehicle._id,
          location: {
            type: "Point",
            coordinates: [lon, lat],
          },
          status: updatedVehicle.status.currentStatus,
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_location_update");
      }

      res.status(200).json({
        success: true,
        message: "Vehicle location updated successfully",
        data: {
          vehicle: updatedVehicle,
        },
      });
    } catch (error) {
      console.error("❌ Update vehicle location error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle location",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Update vehicle readiness status (October 20, 2025)
   * PUT /api/vehicles/:id/readiness
   * Crew leader control - separate from GPS tracking
   */
  static async updateVehicleReadiness(req, res) {
    try {
      const { id } = req.params;
      const { isReady, notReadyReason } = req.body;

      console.log(
        `🚗 Updating vehicle ${id} readiness - Requested by:`,
        req.user.personal?.firstName || req.user.firstName,
        req.user.personal?.lastName || req.user.lastName
      );

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID format",
        });
      }

      // Validate isReady is boolean
      if (typeof isReady !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isReady must be a boolean value",
        });
      }

      // If marking not ready, reason should be provided
      if (!isReady && !notReadyReason) {
        return res.status(400).json({
          success: false,
          message: "notReadyReason is required when marking vehicle not ready",
        });
      }

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      const updateData = {
        "readiness.isReady": isReady,
        "readiness.lastReadyUpdate": new Date(),
        "readiness.updatedBy": req.user._id,
        "readiness.notReadyReason": isReady ? null : notReadyReason,
        "audit.updatedAt": new Date(),
      };

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("readiness.updatedBy", "firstName lastName");

      console.log(
        `✅ Vehicle readiness updated: ${
          updatedVehicle.registration.plateNumber
        } - ${isReady ? "READY" : "NOT READY"}${
          !isReady ? ` (${notReadyReason})` : ""
        }`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_readiness_update", {
          vehicleId: updatedVehicle._id,
          plateNumber: updatedVehicle.registration.plateNumber,
          isReady: isReady,
          notReadyReason: notReadyReason || null,
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_readiness_update");
      }

      res.status(200).json({
        success: true,
        message: `Vehicle marked ${
          isReady ? "ready" : "not ready"
        } successfully`,
        data: {
          vehicle: updatedVehicle,
        },
      });
    } catch (error) {
      console.error("❌ Update vehicle readiness error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle readiness",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Assign or unassign vehicle to/from an incident
   * PUT /api/vehicles/:id/assignment
   */
  static async updateVehicleAssignment(req, res) {
    try {
      const { id } = req.params;
      const { incidentId, crew } = req.body; // incidentId can be null to unassign

      console.log(
        `🚗 Updating vehicle ${id} assignment - Requested by:`,
        req.user.personal?.firstName || req.user.firstName,
        req.user.personal?.lastName || req.user.lastName
      );
      console.log("📋 Assignment update:", { incidentId, crew });

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID format",
        });
      }

      // Validate incident ID if provided
      if (incidentId && !mongoose.Types.ObjectId.isValid(incidentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid incident ID format",
        });
      }

      // Build assignment update
      const updateData = {};
      if (incidentId) {
        updateData["assignment.currentIncidentId"] = incidentId;
        updateData["assignment.assignedAt"] = new Date().toISOString();
        if (crew && Array.isArray(crew)) {
          updateData["assignment.crew"] = crew;
        }
        // Auto-update status when assigned
        updateData["status.currentStatus"] = "assigned";
      } else {
        // Unassign vehicle
        updateData["assignment.currentIncidentId"] = null;
        updateData["assignment.assignedAt"] = null;
        updateData["assignment.crew"] = [];
        // Auto-update status when unassigned
        updateData["status.currentStatus"] = "available";
      }

      const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      const action = incidentId ? "assigned to" : "unassigned from";
      console.log(
        `✅ Vehicle ${action} incident: ${vehicle.registration.plateNumber}`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_assignment_update", {
          vehicleId: vehicle._id,
          incidentId: incidentId,
          status: vehicle.status.currentStatus,
          assignedAt: vehicle.assignment?.assignedAt,
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_assignment_update");
      }

      res.status(200).json({
        success: true,
        message: `Vehicle ${action} incident successfully`,
        data: vehicle,
      });
    } catch (error) {
      console.error("❌ Error updating vehicle assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle assignment",
        error: error.message,
      });
    }
  }

  /**
   * Assign crew members to a vehicle
   * POST /api/vehicles/:vehicleId/assign-crew
   */
  static async assignCrewToVehicle(req, res) {
    try {
      const { vehicleId } = req.params;
      const { crewIds } = req.body; // Array of crew member IDs

      console.log(
        `👥 Assigning crew to vehicle ${vehicleId} - Supervisor: ${
          req.user.personal?.firstName || req.user.firstName
        } ${req.user.personal?.lastName || req.user.lastName}`
      );

      // Validate required fields
      if (!crewIds || !Array.isArray(crewIds) || crewIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "crewIds must be a non-empty array",
        });
      }

      // Verify vehicle exists
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Verify all crew members exist
      const crewMembers = await Crew.find({ _id: { $in: crewIds } });
      if (crewMembers.length !== crewIds.length) {
        return res.status(404).json({
          success: false,
          message: "One or more crew members not found",
        });
      }

      // Validate that exactly one crew member is a leader
      const leaders = crewMembers.filter(
        (crew) => crew.professional && crew.professional.isLeader
      );

      if (leaders.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one crew member must be a leader (isLeader=true)",
        });
      }

      if (leaders.length > 1) {
        return res.status(400).json({
          success: false,
          message:
            "Only one crew member can be designated as leader per vehicle",
          leaders: leaders.map((l) => ({
            employeeId: l.employeeId,
            name: `${l.personal.firstName} ${l.personal.lastName}`,
          })),
        });
      }

      // Check if any crew member is already assigned to another vehicle
      const alreadyAssigned = await Vehicle.find({
        "assignment.crew": { $in: crewIds },
        _id: { $ne: vehicleId },
      });

      if (alreadyAssigned.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "One or more crew members are already assigned to another vehicle",
          conflicts: alreadyAssigned.map((v) => ({
            vehicleId: v._id,
            plateNumber: v.registration.plateNumber,
          })),
        });
      }

      // Assign crew to vehicle
      vehicle.assignment.crew = crewIds;
      await vehicle.save();

      // Update crew members' assigned vehicle reference
      await Crew.updateMany(
        { _id: { $in: crewIds } },
        {
          $set: {
            "currentStatus.assignedVehicleId": vehicleId,
            "currentStatus.status": "on_duty",
          },
        }
      );

      console.log(
        `✅ Crew assigned to vehicle: ${vehicle.registration.plateNumber} - ${crewMembers.length} members including leader ${leaders[0].personal.firstName} ${leaders[0].personal.lastName}`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_crew_assigned", {
          vehicleId: vehicle._id,
          plateNumber: vehicle.registration.plateNumber,
          crewCount: crewIds.length,
          leader: {
            employeeId: leaders[0].employeeId,
            name: `${leaders[0].personal.firstName} ${leaders[0].personal.lastName}`,
          },
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_crew_assigned");
      }

      // Populate and return updated vehicle
      const populatedVehicle = await Vehicle.findById(vehicleId).populate(
        "assignment.crew"
      );

      res.status(200).json({
        success: true,
        message: "Crew assigned to vehicle successfully",
        data: populatedVehicle,
        crewSummary: {
          total: crewMembers.length,
          leader: {
            employeeId: leaders[0].employeeId,
            name: `${leaders[0].personal.firstName} ${leaders[0].personal.lastName}`,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error assigning crew to vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign crew to vehicle",
        error: error.message,
      });
    }
  }

  /**
   * Unassign crew members from a vehicle
   * PUT /api/vehicles/:vehicleId/unassign-crew
   */
  static async unassignCrewFromVehicle(req, res) {
    try {
      const { vehicleId } = req.params;

      console.log(
        `👥 Unassigning crew from vehicle ${vehicleId} - Supervisor: ${
          req.user.personal?.firstName || req.user.firstName
        } ${req.user.personal?.lastName || req.user.lastName}`
      );

      // Verify vehicle exists
      const vehicle = await Vehicle.findById(vehicleId).populate(
        "assignment.crew"
      );
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Check if vehicle is currently assigned to an incident
      if (vehicle.assignment.currentIncidentId) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot unassign crew while vehicle is assigned to an incident. Complete or cancel the assignment first.",
          currentIncident: vehicle.assignment.currentIncidentId,
        });
      }

      const crewIds = vehicle.assignment.crew.map((crew) => crew._id);

      if (crewIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Vehicle has no assigned crew",
        });
      }

      // Unassign crew from vehicle
      vehicle.assignment.crew = [];
      await vehicle.save();

      // Update crew members' status
      await Crew.updateMany(
        { _id: { $in: crewIds } },
        {
          $set: {
            "currentStatus.assignedVehicleId": null,
            "currentStatus.status": "off_duty",
          },
        }
      );

      console.log(
        `✅ Crew unassigned from vehicle: ${vehicle.registration.plateNumber} - ${crewIds.length} members removed`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_crew_unassigned", {
          vehicleId: vehicle._id,
          plateNumber: vehicle.registration.plateNumber,
          crewCount: crewIds.length,
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_crew_unassigned");
      }

      res.status(200).json({
        success: true,
        message: "Crew unassigned from vehicle successfully",
        data: vehicle,
        unassignedCrewCount: crewIds.length,
      });
    } catch (error) {
      console.error("❌ Error unassigning crew from vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to unassign crew from vehicle",
        error: error.message,
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
          message: "Vehicle not found",
        });
      }

      if (!vehicle.isActive) {
        return res.status(400).json({
          success: false,
          message: "Vehicle is already deactivated",
        });
      }

      vehicle.isActive = false;
      vehicle.status.operational = "out_of_service";
      vehicle.audit.updatedAt = new Date();

      await vehicle.save();

      // Log the deactivation action
      await AuditLog.logAction({
        actionType: "delete",
        description: `Vehicle deactivated: ${vehicle.registration.vehicleType} ${vehicle.registration.plateNumber}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Vehicle",
        entityId: vehicle._id,
        entityName: `${vehicle.registration.vehicleType} - ${vehicle.registration.plateNumber}`,
        module: "vehicle_management",
        feature: "vehicle_deactivation",
        metadata: {
          deactivationReason: reason || "No reason provided",
        },
        riskLevel: "high",
        isPrivileged: true,
      });

      res.status(200).json({
        success: true,
        message: "Vehicle deactivated successfully",
        data: {
          vehicle,
          deactivationDetails: {
            deactivatedBy: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            deactivatedAt: new Date(),
            reason: reason || "No reason provided",
          },
        },
      });
    } catch (error) {
      console.error("❌ Deactivate vehicle error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to deactivate vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get all pending vehicle registrations
   * GET /api/vehicles/registrations/pending
   * @access Private (Admin/Supervisor)
   */
  static async getPendingVehicleRegistrations(req, res) {
    try {
      console.log(
        `📋 Fetching pending vehicle registrations - Requested by: ${
          req.user.personal?.firstName || req.user.firstName
        } ${req.user.personal?.lastName || req.user.lastName}`
      );

      const pendingVehicles = await Vehicle.findPendingRegistrations();

      console.log(
        `✅ Found ${pendingVehicles.length} pending vehicle registrations`
      );

      res.status(200).json({
        success: true,
        count: pendingVehicles.length,
        data: pendingVehicles,
      });
    } catch (error) {
      console.error("❌ Error fetching pending vehicle registrations:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching pending vehicle registrations",
        error: error.message,
      });
    }
  }

  /**
   * Approve vehicle registration
   * PUT /api/vehicles/:id/approve
   * @access Private (Admin/Supervisor)
   */
  static async approveVehicleRegistration(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      console.log(
        `✅ Approving vehicle registration ${id} by ${
          req.user.personal?.firstName || req.user.firstName
        } ${req.user.personal?.lastName || req.user.lastName}`
      );

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      if (vehicle.registrationStatus.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Vehicle registration is already approved",
        });
      }

      vehicle.registrationStatus = {
        status: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
        notes: notes || "Approved by supervisor",
      };

      await vehicle.save();

      console.log(
        `✅ Vehicle ${vehicle.registration.plateNumber} approved successfully`
      );

      res.status(200).json({
        success: true,
        message: "Vehicle registration approved successfully",
        data: vehicle,
      });
    } catch (error) {
      console.error("❌ Error approving vehicle registration:", error);
      res.status(500).json({
        success: false,
        message: "Error approving vehicle registration",
        error: error.message,
      });
    }
  }

  /**
   * Permanently delete a vehicle (only for rejected registrations)
   * DELETE /api/vehicles/:id/permanent
   */
  static async deleteVehiclePermanently(req, res) {
    try {
      const { id } = req.params;

      console.log(
        `🗑️ Permanently deleting vehicle ${id} by:`,
        req.user.personal?.firstName || req.user.firstName,
        req.user.personal?.lastName || req.user.lastName
      );

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Only allow permanent deletion of rejected vehicles
      if (vehicle.registrationStatus.status !== "rejected") {
        return res.status(400).json({
          success: false,
          message:
            "Only rejected vehicles can be permanently deleted. Use deactivate for active vehicles.",
        });
      }

      const vehicleInfo = {
        plateNumber: vehicle.registration.plateNumber,
        vehicleType: vehicle.registration.vehicleType,
        make: vehicle.registration.make,
        model: vehicle.registration.model,
      };

      // Log the permanent deletion before removing
      await AuditLog.logAction({
        actionType: "delete",
        description: `Vehicle permanently deleted: ${vehicleInfo.vehicleType} ${vehicleInfo.plateNumber}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal?.firstName || req.user.firstName} ${
          req.user.personal?.lastName || req.user.lastName
        }`,
        userRole:
          req.user.auth?.role?.toLowerCase().replace(" ", "_") || "unknown",
        entityType: "Vehicle",
        entityId: vehicle._id,
        entityName: `${vehicleInfo.vehicleType} - ${vehicleInfo.plateNumber}`,
        module: "vehicle_management",
        feature: "vehicle_permanent_deletion",
        metadata: {
          wasRejected: true,
          rejectionReason: vehicle.registrationStatus.rejectionReason,
          originalRegistration: vehicleInfo,
        },
        riskLevel: "critical",
        isPrivileged: true,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Permanently delete from database
      await Vehicle.findByIdAndDelete(id);

      console.log("✅ Vehicle permanently deleted:", vehicleInfo.plateNumber);

      res.status(200).json({
        success: true,
        message: "Vehicle permanently deleted from database",
        data: {
          deletedVehicle: vehicleInfo,
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("❌ Permanent delete vehicle error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to permanently delete vehicle",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
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
          message: "Vehicle not found",
        });
      }

      // Get audit log history for this vehicle
      const history = await AuditLog.findByEntity("Vehicle", id, {
        limit: parseInt(limit),
        actionTypes: [
          "create",
          "update",
          "approve",
          "reject",
          "assign",
          "unassign",
        ],
      });

      res.status(200).json({
        success: true,
        message: "Vehicle history retrieved successfully",
        data: {
          vehicle: {
            id: vehicle._id,
            identifier: vehicle.identifier,
            plateNumber: vehicle.registration.plateNumber,
            vehicleType: vehicle.registration.vehicleType,
          },
          history,
        },
      });
    } catch (error) {
      console.error("❌ Get vehicle history error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve vehicle history",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get all approved vehicles
   * GET /api/vehicles/approved
   */
  static async getApprovedVehicles(req, res) {
    try {
      console.log("📋 Fetching approved vehicles");

      const approvedVehicles = await Vehicle.find({
        isActive: true,
        "registrationStatus.status": "approved",
      })
        .populate(
          "registrationStatus.approvedBy",
          "personal.firstName personal.lastName auth.role"
        )
        .populate("station.homeStationId", "name location")
        .sort({ "registrationStatus.approvedAt": -1 });

      res.status(200).json({
        success: true,
        count: approvedVehicles.length,
        data: {
          approvedVehicles: approvedVehicles,
        },
      });
    } catch (error) {
      console.error("❌ Get approved vehicles error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve approved vehicles",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get all rejected vehicles
   * GET /api/vehicles/rejected
   */
  static async getRejectedVehicles(req, res) {
    try {
      console.log("📋 Fetching rejected vehicles");

      const rejectedVehicles = await Vehicle.find({
        "registrationStatus.status": "rejected",
      })
        .populate(
          "registrationStatus.rejectedBy",
          "personal.firstName personal.lastName auth.role"
        )
        .populate("station.homeStationId", "name location")
        .sort({ "registrationStatus.rejectedAt": -1 });

      res.status(200).json({
        success: true,
        count: rejectedVehicles.length,
        data: {
          rejectedVehicles: rejectedVehicles,
        },
      });
    } catch (error) {
      console.error("❌ Get rejected vehicles error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve rejected vehicles",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = VehicleController;
