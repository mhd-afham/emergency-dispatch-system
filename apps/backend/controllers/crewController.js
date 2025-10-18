const Crew = require("../models/Crew");
const Vehicle = require("../models/Vehicle");
const Assignment = require("../models/Assignment");
const Station = require("../models/Station");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

/**
 * Crew Controller for Emergency Dispatch System
 * Combines crew management (Afham) with crew registration (Inusha)
 * Handles crew operations, tracking, and registration workflows
 */
class CrewController {
  /**
   * @desc    Get crew member by employee ID
   * @route   GET /api/crews/by-employee/:employeeId
   * @access  Private (Field Crew)
   * @returns Crew profile with isLeader validation
   */
  static async getCrewByEmployeeId(req, res) {
    try {
      const { employeeId } = req.params;

      console.log(
        `📱 [CrewController] Fetching crew by employeeId: ${employeeId}`
      );

      // Find crew by employeeId
      const crew = await Crew.findOne({ "personal.employeeId": employeeId })
        .populate(
          "currentStatus.assignedVehicleId",
          "registration.plateNumber registration.vehicleType status"
        )
        .select("-audit");

      if (!crew) {
        return res.status(404).json({
          success: false,
          message: `No crew member found with employee ID: ${employeeId}`,
        });
      }

      // Validate if crew member is a leader
      if (!crew.professional.isLeader) {
        console.log(
          `⚠️ [CrewController] Access denied - ${employeeId} is not a crew leader`
        );
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Mobile app is restricted to crew leaders only.",
          isLeader: false,
        });
      }

      console.log(
        `✅ [CrewController] Crew leader found: ${crew.personal.firstName} ${crew.personal.lastName}`
      );

      res.status(200).json({
        success: true,
        data: crew,
        isLeader: true,
      });
    } catch (error) {
      console.error(
        `❌ [CrewController] Error fetching crew by employeeId:`,
        error.message
      );
      res.status(500).json({
        success: false,
        message: "Error fetching crew member",
        error: error.message,
      });
    }
  }

  /**
   * @desc    Get crew member's active assignments
   * @route   GET /api/crews/:crewId/assignments
   * @access  Private (Field Crew)
   * @returns List of active assignments for the crew member
   */
  static async getCrewAssignments(req, res) {
    try {
      const { crewId } = req.params;

      console.log(
        `📱 [CrewController] Fetching assignments for crew: ${crewId}`
      );

      // Verify crew exists
      const crew = await Crew.findById(crewId);
      if (!crew) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      // Find active assignments where crew is primary crew leader
      const assignments = await Assignment.find({
        "resource.primaryCrewId": crewId,
        "response.status": { $nin: ["completed", "cancelled", "declined"] }, // Exclude completed/cancelled/declined
      })
        .populate(
          "incident.incidentId",
          "incidentId classification location caller status priority"
        )
        .populate(
          "resource.vehicleId",
          "registration.plateNumber registration.vehicleType status"
        )
        .populate("dispatch.assignedBy", "personal.firstName personal.lastName")
        .sort({ "dispatch.assignedAt": -1 });

      console.log(
        `✅ [CrewController] Found ${assignments.length} active assignments`
      );

      res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
      });
    } catch (error) {
      console.error(
        `❌ [CrewController] Error fetching crew assignments:`,
        error.message
      );
      res.status(500).json({
        success: false,
        message: "Error fetching crew assignments",
        error: error.message,
      });
    }
  }

  /**
   * @desc    Get crew member's assigned vehicle details
   * @route   GET /api/crews/:crewId/vehicle
   * @access  Private (Field Crew)
   * @returns Details of the vehicle assigned to the crew member
   */
  static async getCrewVehicle(req, res) {
    try {
      const { crewId } = req.params;

      console.log(
        `📱 [CrewController] Fetching assigned vehicle for crew: ${crewId}`
      );

      // Find crew with populated vehicle
      const crew = await Crew.findById(crewId)
        .populate({
          path: "currentStatus.assignedVehicleId",
          select: "registration status equipment station assignment",
          populate: [
            {
              path: "assignment.crew",
              select:
                "personal.firstName personal.lastName professional.role professional.isLeader",
            },
            {
              path: "station.homeStationId",
              select: "stationName address province",
            },
          ],
        })
        .select("currentStatus.assignedVehicleId");

      if (!crew) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      if (!crew.currentStatus.assignedVehicleId) {
        return res.status(404).json({
          success: false,
          message: "No vehicle assigned to this crew member",
        });
      }

      console.log(
        `✅ [CrewController] Vehicle found: ${crew.currentStatus.assignedVehicleId.registration.plateNumber}`
      );

      res.status(200).json({
        success: true,
        data: crew.currentStatus.assignedVehicleId,
      });
    } catch (error) {
      console.error(
        `❌ [CrewController] Error fetching crew vehicle:`,
        error.message
      );
      res.status(500).json({
        success: false,
        message: "Error fetching crew vehicle",
        error: error.message,
      });
    }
  }

  /**
   * @desc    Update crew member's GPS location (Afham's GPS tracking)
   * @route   PUT /api/crews/:crewId/location
   * @access  Private (Field Crew)
   * @returns Updated crew location
   */
  static async updateCrewLocationLegacy(req, res) {
    try {
      const { crewId } = req.params;
      const { coordinates } = req.body;

      // Validate coordinates
      if (
        !coordinates ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates format. Expected [longitude, latitude]",
        });
      }

      const [lng, lat] = coordinates;

      // Validate coordinates are within Sri Lankan boundaries
      if (lng < 79.5 || lng > 81.9 || lat < 5.9 || lat > 9.9) {
        return res.status(400).json({
          success: false,
          message: "Coordinates must be within Sri Lankan boundaries",
        });
      }

      console.log(
        `📍 [CrewController] Updating location for crew: ${crewId} to [${lng}, ${lat}]`
      );

      // Update crew location
      const crew = await Crew.findByIdAndUpdate(
        crewId,
        {
          "currentStatus.location": {
            type: "Point",
            coordinates: [lng, lat],
          },
          "currentStatus.lastLocationUpdate": new Date(),
        },
        { new: true, runValidators: true }
      ).select(
        "currentStatus.location currentStatus.lastLocationUpdate personal.firstName personal.lastName"
      );

      if (!crew) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      console.log(`✅ [CrewController] Location updated successfully`);

      // Emit WebSocket event for real-time GPS tracking on dispatcher map
      const io = req.app.get("io");
      if (io) {
        io.emit("crew_location_update", {
          crewId: crew._id,
          crewName: `${crew.personal.firstName} ${crew.personal.lastName}`,
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: crew_location_update");
      }

      res.status(200).json({
        success: true,
        message: "Location updated successfully",
        data: {
          crewId: crew._id,
          name: `${crew.personal.firstName} ${crew.personal.lastName}`,
          location: crew.currentStatus.location,
          lastUpdate: crew.currentStatus.lastLocationUpdate,
        },
      });
    } catch (error) {
      console.error(
        `❌ [CrewController] Error updating crew location:`,
        error.message
      );
      res.status(500).json({
        success: false,
        message: "Error updating crew location",
        error: error.message,
      });
    }
  }

  /**
   * @desc    Get available crew leaders for shift scheduling
   * @route   GET /api/crews/leaders/available
   * @access  Private (Supervisor, Admin)
   * @returns List of crew leaders who are available (not currently assigned)
   */
  static async getAvailableLeaders(req, res) {
    try {
      console.log(`📱 [CrewController] Fetching available crew leaders`);

      // Find crew members who are leaders and not currently assigned to a vehicle
      const availableLeaders = await Crew.find({
        "professional.isLeader": true,
        "currentStatus.assignedVehicleId": null,
        "settings.isActive": true,
        "registrationStatus.status": "approved", // Only approved crew
      })
        .select(
          "personal professional.role professional.certificationLevel professional.specializations currentStatus.availability"
        )
        .sort("personal.lastName personal.firstName");

      console.log(
        `✅ [CrewController] Found ${availableLeaders.length} available crew leaders`
      );

      res.status(200).json({
        success: true,
        count: availableLeaders.length,
        data: availableLeaders,
      });
    } catch (error) {
      console.error(
        `❌ [CrewController] Error fetching available leaders:`,
        error.message
      );
      res.status(500).json({
        success: false,
        message: "Error fetching available crew leaders",
        error: error.message,
      });
    }
  }

  /**
   * @desc    Get all pending crew registrations (Afham's version)
   * @route   GET /api/crews/registrations/pending
   * @access  Private (Admin/Supervisor)
   */
  static async getPendingCrewRegistrationsLegacy(req, res) {
    try {
      console.log(
        `📋 [CrewController] Fetching pending crew registrations - Requested by: ${req.user.firstName} ${req.user.lastName}`
      );

      const pendingCrew = await Crew.findPendingRegistrations();

      console.log(
        `✅ [CrewController] Found ${pendingCrew.length} pending crew registrations`
      );

      res.status(200).json({
        success: true,
        count: pendingCrew.length,
        data: pendingCrew,
      });
    } catch (error) {
      console.error(
        "❌ [CrewController] Error fetching pending registrations:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Error fetching pending crew registrations",
        error: error.message,
      });
    }
  }

  /**
   * @desc    Approve crew registration (Afham's version)
   * @route   PUT /api/crews/:id/approve
   * @access  Private (Admin/Supervisor)
   */
  static async approveCrewRegistrationLegacy(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      console.log(
        `✅ [CrewController] Approving crew registration ${id} by ${req.user.firstName} ${req.user.lastName}`
      );

      const crew = await Crew.findById(id);
      if (!crew) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      if (crew.registrationStatus.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Crew registration is already approved",
        });
      }

      crew.registrationStatus = {
        status: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
        notes: notes || "Approved by supervisor",
      };

      await crew.save();

      console.log(
        `✅ [CrewController] Crew ${crew.personal.firstName} ${crew.personal.lastName} approved successfully`
      );

      res.status(200).json({
        success: true,
        message: "Crew registration approved successfully",
        data: crew,
      });
    } catch (error) {
      console.error(
        "❌ [CrewController] Error approving crew registration:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Error approving crew registration",
        error: error.message,
      });
    }
  }

  /**
   * @desc    Reject crew registration (Afham's version)
   * @route   PUT /api/crews/:id/reject
   * @access  Private (Admin/Supervisor)
   */
  static async rejectCrewRegistrationLegacy(req, res) {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;

      console.log(
        `❌ [CrewController] Rejecting crew registration ${id} by ${req.user.firstName} ${req.user.lastName}`
      );

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const crew = await Crew.findById(id);
      if (!crew) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      if (crew.registrationStatus.status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Crew registration is already rejected",
        });
      }

      crew.registrationStatus = {
        status: "rejected",
        rejectedBy: req.user._id,
        rejectedAt: new Date(),
        rejectionReason: reason,
        notes: notes || "",
      };

      await crew.save();

      console.log(
        `❌ [CrewController] Crew ${crew.personal.firstName} ${crew.personal.lastName} rejected: ${reason}`
      );

      res.status(200).json({
        success: true,
        message: "Crew registration rejected",
        data: crew,
      });
    } catch (error) {
      console.error(
        "❌ [CrewController] Error rejecting crew registration:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Error rejecting crew registration",
        error: error.message,
      });
    }
  }

  /**
   * Register a new crew member (US-012: Crew Registration)
   * POST /api/crew
   */
  static async registerCrewMember(req, res) {
    try {
      console.log(
        "👥 Registering new crew member - Registered by:",
        req.user.personal.firstName,
        req.user.personal.lastName
      );
      console.log(
        "🔍 Crew registration data:",
        JSON.stringify(req.body, null, 2)
      );

      const {
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        role,
        certificationLevel,
        certifications,
        specializations,
        hireDate,
        emergencyContact,
      } = req.body;

      // Validate required fields
      const requiredFields = [
        "employeeId",
        "firstName",
        "lastName",
        "email",
        "phone",
        "role",
        "certificationLevel",
        "hireDate",
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

      // Validate employee ID format
      const employeeIdRegex = /^EMP[0-9]{6}$/;
      if (!employeeIdRegex.test(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID format. Use format EMP123456",
          field: "employeeId",
        });
      }

      // Check if employee ID already exists
      const existingCrew = await Crew.findOne({
        "personal.employeeId": employeeId,
      });

      if (existingCrew) {
        return res.status(409).json({
          success: false,
          message: "Crew member with this employee ID already exists",
          field: "employeeId",
          existingCrewId: existingCrew._id,
        });
      }

      // Check if email already exists
      const existingEmail = await Crew.findOne({
        "personal.email": email.toLowerCase(),
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Crew member with this email already exists",
          field: "email",
          existingCrewId: existingEmail._id,
        });
      }

      // Validate role
      const validRoles = [
        "EMT",
        "Paramedic",
        "Firefighter",
        "Driver",
        "Supervisor",
      ];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid professional role",
          field: "role",
          validRoles,
        });
      }

      // Validate certification level
      const validLevels = ["Basic", "Intermediate", "Advanced", "Expert"];
      if (!validLevels.includes(certificationLevel)) {
        return res.status(400).json({
          success: false,
          message: "Invalid certification level",
          field: "certificationLevel",
          validLevels,
        });
      }

      // Validate email format
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          field: "email",
        });
      }

      // Validate phone format (Sri Lankan)
      const phoneRegex = /^\+94[0-9]{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format. Use +94xxxxxxxxx",
          field: "phone",
        });
      }

      // Validate hire date
      const hireDateObj = new Date(hireDate);
      if (hireDateObj > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Hire date cannot be in the future",
          field: "hireDate",
        });
      }

      // Validate emergency contact if provided
      if (emergencyContact) {
        if (
          !emergencyContact.name ||
          !emergencyContact.relationship ||
          !emergencyContact.phone
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Emergency contact must include name, relationship, and phone",
            field: "emergencyContact",
          });
        }

        if (!phoneRegex.test(emergencyContact.phone)) {
          return res.status(400).json({
            success: false,
            message: "Invalid emergency contact phone format. Use +94xxxxxxxxx",
            field: "emergencyContact.phone",
          });
        }
      }

      // Process certifications if provided
      const processedCertifications = [];
      if (certifications && Array.isArray(certifications)) {
        for (const cert of certifications) {
          if (
            !cert.type ||
            !cert.number ||
            !cert.issuedBy ||
            !cert.issueDate ||
            !cert.expiryDate
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Each certification must include type, number, issuedBy, issueDate, and expiryDate",
              field: "certifications",
            });
          }

          const issueDate = new Date(cert.issueDate);
          const expiryDate = new Date(cert.expiryDate);

          if (expiryDate <= issueDate) {
            return res.status(400).json({
              success: false,
              message: "Certification expiry date must be after issue date",
              field: "certifications",
            });
          }

          processedCertifications.push({
            type: cert.type.trim(),
            number: cert.number.trim(),
            issuedBy: cert.issuedBy.trim(),
            issueDate: issueDate,
            expiryDate: expiryDate,
            isActive: true,
          });
        }
      }

      // Create new crew member
      const newCrew = new Crew({
        personal: {
          employeeId: employeeId.toUpperCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
        },
        professional: {
          role,
          certificationLevel,
          certifications: processedCertifications,
          specializations: specializations || [],
          hireDate: hireDateObj,
        },
        currentStatus: {
          availability: "off_duty",
          shiftId: null,
          assignedVehicleId: null,
          location: {
            type: "Point",
            coordinates: [79.8612, 6.9271], // Default to Colombo, Sri Lanka (will be updated via mobile app)
          },
        },
        settings: {
          isActive: false, // Changed to false - requires supervisor approval
          emergencyContact: emergencyContact || {
            name: "Not Provided",
            relationship: "Other",
            phone: "+94000000000",
          },
        },
        audit: {
          createdBy: req.user._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const savedCrew = await newCrew.save();

      // Log the registration action
      await AuditLog.logAction({
        actionType: "create",
        description: `Crew member registration: ${role} ${firstName} ${lastName} (${employeeId})`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Crew",
        entityId: savedCrew._id,
        entityName: `${firstName} ${lastName} (${employeeId})`,
        module: "crew_management",
        feature: "crew_registration",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        riskLevel: "medium",
        isPrivileged: true,
      });

      // Populate the response with referenced data
      const populatedCrew = await Crew.findById(savedCrew._id).populate(
        "audit.createdBy",
        "personal.firstName personal.lastName"
      );

      console.log("✅ Crew member registration successful:", employeeId);

      res.status(201).json({
        success: true,
        message:
          "Crew member registration submitted successfully. Pending approval.",
        data: {
          crew: populatedCrew,
          status: "pending_approval",
          summary: {
            employeeId: employeeId,
            fullName: `${firstName} ${lastName}`,
            role: role,
            certificationLevel: certificationLevel,
            certificationsCount: processedCertifications.length,
            isActive: false,
          },
          nextSteps: [
            "Crew member will be reviewed by a supervisor",
            "Notification will be sent upon approval decision",
            "Crew member will be available for assignments once approved",
          ],
        },
      });
    } catch (error) {
      console.error("❌ Crew registration error:", error);

      // Log the failed action
      if (req.user) {
        try {
          await AuditLog.logAction({
            actionType: "create",
            description: `Failed crew member registration attempt`,
            outcome: "failure",
            userId: req.user._id,
            username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
            userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
            entityType: "Crew",
            module: "crew_management",
            feature: "crew_registration",
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
          message: "Crew member validation failed",
          errors: validationErrors,
        });
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
          success: false,
          message: `Crew member with this ${field} already exists`,
          duplicateField: field,
          value: error.keyValue[field],
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to register crew member",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get all crew members with filtering and pagination
   * GET /api/crew
   */
  static async getAllCrewMembers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        role,
        certificationLevel,
        stationId,
        search,
        sortBy = "personal.firstName",
        sortOrder = "asc",
      } = req.query;

      // Build query based on filters
      let query = {};

      // Only show active crew members for non-admin users
      if (req.user.auth.role !== "Admin") {
        query["settings.isActive"] = true;
      }

      if (status) {
        query["currentStatus.availability"] = status;
      }

      if (role) {
        query["professional.role"] = role;
      }

      if (certificationLevel) {
        query["professional.certificationLevel"] = certificationLevel;
      }

      if (search) {
        query.$or = [
          { "personal.firstName": { $regex: search, $options: "i" } },
          { "personal.lastName": { $regex: search, $options: "i" } },
          { "personal.employeeId": { $regex: search, $options: "i" } },
          { "personal.email": { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortDirection = sortOrder === "desc" ? -1 : 1;
      const sortObject = { [sortBy]: sortDirection };

      const [crewMembers, total] = await Promise.all([
        Crew.find(query)
          .populate(
            "currentStatus.assignedVehicleId",
            "registration.plateNumber registration.vehicleType"
          )
          .sort(sortObject)
          .skip(skip)
          .limit(parseInt(limit)),
        Crew.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      // Add computed fields to crew members
      const processedCrewMembers = crewMembers.map((crew) => {
        const crewData = crew.toObject();

        // Add active certification count
        crewData.activeCertificationsCount = crew.activeCertifications.length;

        // Add full name virtual
        crewData.fullName = crew.fullName;

        // Add availability status
        crewData.isAvailableForAssignment = crew.isAvailableForAssignment();

        return crewData;
      });

      res.status(200).json({
        success: true,
        message: "Crew members retrieved successfully",
        data: {
          crewMembers: processedCrewMembers,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCrewMembers: total,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
          filters: {
            status,
            role,
            certificationLevel,
            stationId,
            search,
            sortBy,
            sortOrder,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get crew members error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve crew members",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get available crew members by role for assignment
   * GET /api/crew/available/:role
   */
  static async getAvailableCrewByRole(req, res) {
    try {
      const { role } = req.params;
      const { includeLocation = false } = req.query;

      const availableCrew = await Crew.findAvailableByRole(role);

      const processedCrew = availableCrew.map((crew) => {
        const crewData = crew.toObject();

        // Add computed fields
        crewData.fullName = crew.fullName;
        crewData.activeCertificationsCount = crew.activeCertifications.length;
        crewData.isAvailableForAssignment = crew.isAvailableForAssignment();

        if (includeLocation !== "true") {
          delete crewData.currentStatus.location;
        }

        return crewData;
      });

      res.status(200).json({
        success: true,
        message: `Available ${role.toLowerCase()}s retrieved successfully`,
        data: {
          crewMembers: processedCrew,
          count: processedCrew.length,
          role,
        },
      });
    } catch (error) {
      console.error("❌ Get available crew by role error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve available crew members",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get crew members with expiring certifications
   * GET /api/crew/expiring-certifications
   */
  static async getExpiringCertifications(req, res) {
    try {
      const { days = 30 } = req.query;

      const crewWithExpiringCerts = await Crew.findExpiringCertifications(
        parseInt(days)
      ).populate("audit.createdBy", "personal.firstName personal.lastName");

      const processedResults = crewWithExpiringCerts.map((crew) => {
        const crewData = crew.toObject();

        // Filter to only show expiring certifications
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(days));

        const expiringCerts = crew.professional.certifications.filter(
          (cert) =>
            cert.isActive &&
            cert.expiryDate <= expiryDate &&
            cert.expiryDate > new Date()
        );

        return {
          ...crewData,
          fullName: crew.fullName,
          expiringCertifications: expiringCerts.map((cert) => ({
            ...cert.toObject(),
            daysUntilExpiry: Math.ceil(
              (cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24)
            ),
          })),
        };
      });

      const summary = {
        total: processedResults.length,
        expiredSoon: processedResults.filter((crew) =>
          crew.expiringCertifications.some((cert) => cert.daysUntilExpiry <= 7)
        ).length,
        critical: processedResults.filter((crew) =>
          crew.expiringCertifications.some((cert) => cert.daysUntilExpiry <= 3)
        ).length,
      };

      res.status(200).json({
        success: true,
        message:
          "Crew members with expiring certifications retrieved successfully",
        data: {
          crewMembers: processedResults,
          summary,
          searchCriteria: {
            daysAhead: parseInt(days),
          },
        },
      });
    } catch (error) {
      console.error("❌ Get expiring certifications error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve expiring certifications",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Validate employee ID uniqueness
   * POST /api/crew/validate-employee-id
   */
  static async validateEmployeeId(req, res) {
    try {
      const { employeeId, excludeId } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required",
          field: "employeeId",
        });
      }

      // Validate format
      const employeeIdRegex = /^EMP[0-9]{6}$/;
      const normalizedId = employeeId.toUpperCase().trim();

      if (!employeeIdRegex.test(normalizedId)) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Invalid employee ID format. Use format EMP123456",
          suggestions: ["Format: EMP followed by 6 digits (e.g., EMP123456)"],
        });
      }

      // Check uniqueness
      let query = { "personal.employeeId": normalizedId };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingCrew = await Crew.findOne(query);

      if (existingCrew) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Employee ID already exists",
          conflict: {
            crewId: existingCrew._id,
            fullName: existingCrew.fullName,
            role: existingCrew.professional.role,
            email: existingCrew.personal.email,
          },
        });
      }

      res.status(200).json({
        success: true,
        valid: true,
        message: "Employee ID is available",
        normalizedId,
      });
    } catch (error) {
      console.error("❌ Employee ID validation error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to validate employee ID",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Validate email uniqueness
   * POST /api/crew/validate-email
   */
  static async validateEmail(req, res) {
    try {
      const { email, excludeId } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
          field: "email",
        });
      }

      // Validate format
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      const normalizedEmail = email.toLowerCase().trim();

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Invalid email format",
          suggestions: ["Use a valid email format (e.g., user@domain.com)"],
        });
      }

      // Check uniqueness
      let query = { "personal.email": normalizedEmail };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingCrew = await Crew.findOne(query);

      if (existingCrew) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Email already exists",
          conflict: {
            crewId: existingCrew._id,
            fullName: existingCrew.fullName,
            employeeId: existingCrew.personal.employeeId,
            role: existingCrew.professional.role,
          },
        });
      }

      res.status(200).json({
        success: true,
        valid: true,
        message: "Email is available",
        normalizedEmail,
      });
    } catch (error) {
      console.error("❌ Email validation error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to validate email",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Additional methods would be implemented here...
  // getCrewMemberById, updateCrewMember, addCertification, etc.

  /**
   * Get crew member statistics for dashboard
   * GET /api/crew/statistics
   */
  static async getCrewStatistics(req, res) {
    try {
      const { timeframe = "month" } = req.query;

      const totalCrew = await Crew.countDocuments({
        "settings.isActive": true,
      });
      const availableCrew = await Crew.countDocuments({
        "settings.isActive": true,
        "currentStatus.availability": "available",
      });
      const onDutyCrew = await Crew.countDocuments({
        "settings.isActive": true,
        "currentStatus.availability": "on_duty",
      });

      // Get crew by role
      const crewByRole = await Crew.aggregate([
        { $match: { "settings.isActive": true } },
        { $group: { _id: "$professional.role", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Get crew by certification level
      const crewByCertLevel = await Crew.aggregate([
        { $match: { "settings.isActive": true } },
        {
          $group: {
            _id: "$professional.certificationLevel",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      res.status(200).json({
        success: true,
        message: "Crew statistics retrieved successfully",
        data: {
          summary: {
            total: totalCrew,
            available: availableCrew,
            onDuty: onDutyCrew,
            unavailable: totalCrew - availableCrew - onDutyCrew,
          },
          breakdown: {
            byRole: crewByRole,
            byCertificationLevel: crewByCertLevel,
          },
          timeframe,
        },
      });
    } catch (error) {
      console.error("❌ Get crew statistics error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve crew statistics",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get a specific crew member by ID
   * GET /api/crew/:id
   */
  static async getCrewMemberById(req, res) {
    try {
      const { id } = req.params;

      // Handle both ObjectId and employeeId lookup
      let query;
      if (mongoose.Types.ObjectId.isValid(id)) {
        query = { _id: id };
      } else if (id.startsWith("EMP")) {
        query = { "personal.employeeId": id.toUpperCase() };
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid crew member ID format",
        });
      }

      const crewMember = await Crew.findOne(query)
        .populate(
          "currentStatus.assignedVehicleId",
          "registration.plateNumber registration.vehicleType"
        )
        .populate("currentStatus.shiftId", "name startTime endTime")
        .populate("audit.createdBy", "personal.firstName personal.lastName");

      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      // Check access permissions - non-admin users can only see active crew members
      if (req.user.auth.role !== "Admin" && !crewMember.settings.isActive) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      const crewData = crewMember.toObject();
      crewData.fullName = crewMember.fullName;
      crewData.activeCertifications = crewMember.activeCertifications;
      crewData.isAvailableForAssignment = crewMember.isAvailableForAssignment();
      crewData.hasValidCertifications = crewMember.hasValidCertifications();

      res.status(200).json({
        success: true,
        message: "Crew member retrieved successfully",
        data: {
          crewMember: crewData,
        },
      });
    } catch (error) {
      console.error("❌ Get crew member by ID error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve crew member",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Update crew member information
   * PUT /api/crew/:id
   */
  static async updateCrewMember(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const crewMember = await Crew.findById(id);
      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      // Different update permissions for different roles
      const isSelf =
        req.user._id.toString() === id ||
        (req.user.auth.employeeId && id.includes(req.user.auth.employeeId));

      let allowedUpdates;
      if (
        req.user.auth.role === "Admin" ||
        req.user.auth.role === "Supervisor"
      ) {
        // Supervisors and admins can update most fields
        allowedUpdates = [
          "firstName",
          "lastName",
          "phone",
          "role",
          "certificationLevel",
          "specializations",
          "emergencyContact",
        ];
      } else if (isSelf) {
        // Crew members can only update limited fields
        allowedUpdates = ["phone", "emergencyContact"];
      } else {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions to update this crew member",
        });
      }

      // Store original data for audit log
      const originalData = crewMember.toObject();

      // Apply updates
      const filteredUpdates = {};
      allowedUpdates.forEach((field) => {
        if (updateData[field] !== undefined) {
          if (field === "emergencyContact") {
            filteredUpdates["settings.emergencyContact"] = updateData[field];
          } else if (["firstName", "lastName", "phone"].includes(field)) {
            filteredUpdates[`personal.${field}`] = updateData[field];
          } else if (
            ["role", "certificationLevel", "specializations"].includes(field)
          ) {
            filteredUpdates[`professional.${field}`] = updateData[field];
          }
        }
      });

      filteredUpdates["audit.updatedAt"] = new Date();

      const updatedCrewMember = await Crew.findByIdAndUpdate(
        id,
        { $set: filteredUpdates },
        { new: true, runValidators: true }
      );

      // Log the update action
      await AuditLog.logAction({
        actionType: "update",
        description: `Crew member updated: ${crewMember.personal.firstName} ${crewMember.personal.lastName} (${crewMember.personal.employeeId})`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Crew",
        entityId: crewMember._id,
        entityName: `${crewMember.personal.firstName} ${crewMember.personal.lastName} (${crewMember.personal.employeeId})`,
        module: "crew_management",
        feature: "crew_update",
        changes: {
          before: originalData,
          after: updatedCrewMember.toObject(),
        },
        riskLevel: isSelf ? "low" : "medium",
      });

      res.status(200).json({
        success: true,
        message: "Crew member updated successfully",
        data: {
          crewMember: updatedCrewMember,
        },
      });
    } catch (error) {
      console.error("❌ Update crew member error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update crew member",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Update crew member availability status
   * PUT /api/crew/:id/status
   */
  static async updateCrewStatus(req, res) {
    try {
      const { id } = req.params;
      const { availability, shiftId, assignedVehicleId } = req.body;

      const crewMember = await Crew.findById(id);
      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      const updateData = {};
      if (availability) updateData["currentStatus.availability"] = availability;
      if (shiftId !== undefined) updateData["currentStatus.shiftId"] = shiftId;
      if (assignedVehicleId !== undefined)
        updateData["currentStatus.assignedVehicleId"] = assignedVehicleId;
      updateData["audit.updatedAt"] = new Date();

      const updatedCrewMember = await Crew.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Crew member status updated successfully",
        data: {
          crewMember: updatedCrewMember,
        },
      });
    } catch (error) {
      console.error("❌ Update crew status error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update crew member status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Update crew member location (GPS tracking)
   * PUT /api/crew/:id/location
   */
  static async updateCrewLocation(req, res) {
    try {
      const { id } = req.params;
      const { longitude, latitude } = req.body;

      if (!longitude || !latitude) {
        return res.status(400).json({
          success: false,
          message: "Longitude and latitude are required",
        });
      }

      const crewMember = await Crew.findById(id);
      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      const updateData = {
        "currentStatus.location": {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        "currentStatus.lastLocationUpdate": new Date(),
        "audit.updatedAt": new Date(),
      };

      const updatedCrewMember = await Crew.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Crew member location updated successfully",
        data: {
          crewMember: updatedCrewMember,
        },
      });
    } catch (error) {
      console.error("❌ Update crew location error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update crew member location",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Placeholder methods for certification management
  static async addCertification(req, res) {
    res.status(501).json({
      success: false,
      message: "Certification management not yet implemented",
    });
  }

  static async updateCertification(req, res) {
    res.status(501).json({
      success: false,
      message: "Certification management not yet implemented",
    });
  }

  static async deactivateCertification(req, res) {
    res.status(501).json({
      success: false,
      message: "Certification management not yet implemented",
    });
  }

  static async deactivateCrewMember(req, res) {
    res.status(501).json({
      success: false,
      message: "Crew member deactivation not yet implemented",
    });
  }

  static async getCrewHistory(req, res) {
    res.status(501).json({
      success: false,
      message: "Crew history not yet implemented",
    });
  }

  /**
   * Get crew members pending approval
   * GET /api/crew/pending-approval
   */
  static async getPendingApprovals(req, res) {
    try {
      console.log(
        "📋 Fetching crew members pending approval for:",
        req.user.personal.firstName
      );
      console.log("🔍 User role:", req.user.auth.role);

      // Query for pending crew members
      const query = {
        "settings.isActive": false,
        "registrationStatus.status": "pending",
      };

      console.log("🔎 Query:", JSON.stringify(query, null, 2));

      const pendingCrew = await Crew.find(query)
        .populate(
          "audit.createdBy",
          "personal.firstName personal.lastName auth.role"
        )
        .sort({ "audit.createdAt": -1 });

      console.log(`📊 Found ${pendingCrew.length} pending crew members`);

      const processedCrew = pendingCrew.map((crew) => ({
        ...crew.toObject(),
        pendingSince: crew.audit.createdAt,
        daysPending: Math.floor(
          (new Date() - crew.audit.createdAt) / (1000 * 60 * 60 * 24)
        ),
      }));

      res.status(200).json({
        success: true,
        message:
          pendingCrew.length > 0
            ? "Pending crew approvals retrieved successfully"
            : "No pending crew approvals found",
        data: {
          pendingCrew: processedCrew,
          count: processedCrew.length,
          summary: {
            total: processedCrew.length,
            overdue: processedCrew.filter((c) => c.daysPending > 7).length,
            urgent: processedCrew.filter(
              (c) => c.daysPending > 3 && c.daysPending <= 7
            ).length,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get pending crew approvals error:", error);
      console.error("❌ Error stack:", error.stack);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve pending crew approvals",
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
   * Approve crew member registration
   * POST /api/crew/:id/approve
   */
  static async approveCrew(req, res) {
    try {
      const { id } = req.params;
      console.log(
        `✅ Approving crew member ${id} by:`,
        req.user.personal.firstName,
        req.user.personal.lastName
      );

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid crew member ID format",
        });
      }

      const crewMember = await Crew.findById(id);

      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      if (crewMember.settings.isActive) {
        return res.status(400).json({
          success: false,
          message: "Crew member is already active",
        });
      }

      // Activate the crew member and update registration status
      crewMember.settings.isActive = true;
      crewMember.registrationStatus.status = "approved";
      crewMember.registrationStatus.approvedBy = req.user._id;
      crewMember.registrationStatus.approvedAt = new Date();
      crewMember.audit.updatedAt = new Date();
      await crewMember.save();

      // Log the approval action
      await AuditLog.logAction({
        actionType: "approve",
        description: `Crew member approved: ${crewMember.professional.role} ${crewMember.personal.firstName} ${crewMember.personal.lastName}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Crew",
        entityId: crewMember._id,
        entityName: `${crewMember.personal.firstName} ${crewMember.personal.lastName}`,
        module: "crew_management",
        feature: "crew_approval",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        riskLevel: "high",
        isPrivileged: true,
      });

      console.log(
        "✅ Crew member approved successfully:",
        crewMember.personal.employeeId
      );

      res.status(200).json({
        success: true,
        message: "Crew member approved successfully",
        data: {
          crewMember: await Crew.findById(id).populate(
            "audit.createdBy",
            "personal.firstName personal.lastName"
          ),
        },
      });
    } catch (error) {
      console.error("❌ Approve crew member error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to approve crew member",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Reject crew member registration
   * POST /api/crew/:id/reject
   */
  static async rejectCrew(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      console.log(
        `❌ Rejecting crew member ${id} by:`,
        req.user.personal.firstName,
        req.user.personal.lastName
      );

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid crew member ID format",
        });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
          field: "reason",
        });
      }

      const crewMember = await Crew.findById(id);

      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      if (crewMember.settings.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot reject an already active crew member",
        });
      }

      const crewInfo = {
        employeeId: crewMember.personal.employeeId,
        fullName: `${crewMember.personal.firstName} ${crewMember.personal.lastName}`,
        role: crewMember.professional.role,
      };

      // Mark crew member as rejected instead of deleting (for history tracking)
      crewMember.settings.isActive = false;
      crewMember.registrationStatus.status = "rejected";
      crewMember.registrationStatus.rejectedBy = req.user._id;
      crewMember.registrationStatus.rejectedAt = new Date();
      crewMember.registrationStatus.rejectionReason = reason;

      await crewMember.save();

      // Log the rejection action
      await AuditLog.logAction({
        actionType: "reject",
        description: `Crew member rejected: ${crewInfo.role} ${crewInfo.fullName} - Reason: ${reason}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Crew",
        entityId: crewMember._id,
        entityName: crewInfo.fullName,
        module: "crew_management",
        feature: "crew_rejection",
        metadata: { rejectionReason: reason },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        riskLevel: "high",
        isPrivileged: true,
      });

      // TODO: Send email notification to admin who registered the crew member
      console.log("📧 TODO: Send rejection notification email");

      console.log(
        "✅ Crew member marked as rejected (preserved for history):",
        crewInfo.employeeId
      );

      res.status(200).json({
        success: true,
        message: "Crew member registration rejected successfully",
        data: {
          rejectedCrew: crewInfo,
          rejectionReason: reason,
        },
      });
    } catch (error) {
      console.error("❌ Reject crew member error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to reject crew member",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Clear rejection status and allow resubmission
   * PATCH /api/crew/:id/clear-rejection
   */
  static async clearRejection(req, res) {
    try {
      const { id } = req.params;

      console.log(
        `🔄 Clearing rejection status for crew member ${id} by:`,
        req.user.personal.firstName,
        req.user.personal.lastName
      );

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid crew member ID format",
        });
      }

      const crewMember = await Crew.findById(id);

      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      if (crewMember.registrationStatus.status !== "rejected") {
        return res.status(400).json({
          success: false,
          message: "Crew member is not rejected",
        });
      }

      const crewInfo = {
        employeeId: crewMember.personal.employeeId,
        fullName: `${crewMember.personal.firstName} ${crewMember.personal.lastName}`,
        role: crewMember.professional.role,
      };

      // Store rejection info for audit log before clearing
      const previousRejection = {
        reason: crewMember.registrationStatus.rejectionReason,
        rejectedAt: crewMember.registrationStatus.rejectedAt,
        rejectedBy: crewMember.registrationStatus.rejectedBy,
      };

      // Clear rejection details and set back to pending
      crewMember.registrationStatus.status = "pending";
      crewMember.registrationStatus.rejectedBy = undefined;
      crewMember.registrationStatus.rejectedAt = undefined;
      crewMember.registrationStatus.rejectionReason = undefined;
      crewMember.settings.isActive = false;

      await crewMember.save();

      // Log the clear rejection action
      await AuditLog.logAction({
        actionType: "update",
        description: `Rejection cleared for crew member: ${crewInfo.role} ${crewInfo.fullName}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Crew",
        entityId: crewMember._id,
        entityName: crewInfo.fullName,
        module: "crew_management",
        feature: "crew_resubmission",
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

      console.log(`✅ Rejection cleared for crew member:`, crewInfo.employeeId);

      res.status(200).json({
        success: true,
        message: "Rejection status cleared successfully",
        data: crewMember,
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
   * Permanently delete a crew member (only for rejected registrations)
   * DELETE /api/crew/:id/permanent
   */
  static async deleteCrewPermanently(req, res) {
    try {
      const { id } = req.params;

      console.log(
        `🗑️ Permanently deleting crew member ${id} by:`,
        req.user.personal.firstName,
        req.user.personal.lastName
      );

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid crew member ID format",
        });
      }

      const crewMember = await Crew.findById(id);

      if (!crewMember) {
        return res.status(404).json({
          success: false,
          message: "Crew member not found",
        });
      }

      // Only allow permanent deletion of rejected crew members
      if (crewMember.registrationStatus.status !== "rejected") {
        return res.status(400).json({
          success: false,
          message:
            "Only rejected crew members can be permanently deleted. Use deactivate for active crew.",
        });
      }

      const crewInfo = {
        employeeId: crewMember.personal.employeeId,
        fullName: `${crewMember.personal.firstName} ${crewMember.personal.lastName}`,
        role: crewMember.professional.role,
      };

      // Log the permanent deletion before removing
      await AuditLog.logAction({
        actionType: "delete",
        description: `Crew member permanently deleted: ${crewInfo.role} ${crewInfo.fullName}`,
        outcome: "success",
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: req.user.auth.role.toLowerCase().replace(" ", "_"),
        entityType: "Crew",
        entityId: crewMember._id,
        entityName: crewInfo.fullName,
        module: "crew_management",
        feature: "crew_permanent_deletion",
        metadata: {
          wasRejected: true,
          rejectionReason: crewMember.registrationStatus.rejectionReason,
          originalRegistration: crewInfo,
        },
        riskLevel: "critical",
        isPrivileged: true,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Permanently delete from database
      await Crew.findByIdAndDelete(id);

      console.log("✅ Crew member permanently deleted:", crewInfo.employeeId);

      res.status(200).json({
        success: true,
        message: "Crew member permanently deleted from database",
        data: {
          deletedCrew: crewInfo,
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("❌ Permanent delete crew member error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to permanently delete crew member",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get all approved crew members
   * GET /api/crew/approved
   */
  static async getApprovedCrew(req, res) {
    try {
      console.log("📋 Fetching approved crew members");

      const approvedCrew = await Crew.find({
        "settings.isActive": true,
        "registrationStatus.status": "approved",
      })
        .populate(
          "registrationStatus.approvedBy",
          "personal.firstName personal.lastName auth.role"
        )
        .populate("audit.createdBy", "personal.firstName personal.lastName")
        .sort({ "registrationStatus.approvedAt": -1 });

      res.status(200).json({
        success: true,
        count: approvedCrew.length,
        data: {
          approvedCrew: approvedCrew,
        },
      });
    } catch (error) {
      console.error("❌ Get approved crew error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve approved crew members",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get all rejected crew members
   * GET /api/crew/rejected
   */
  static async getRejectedCrew(req, res) {
    try {
      console.log("📋 Fetching rejected crew members");

      const rejectedCrew = await Crew.find({
        "registrationStatus.status": "rejected",
      })
        .populate(
          "registrationStatus.rejectedBy",
          "personal.firstName personal.lastName auth.role"
        )
        .populate("audit.createdBy", "personal.firstName personal.lastName")
        .sort({ "registrationStatus.rejectedAt": -1 });

      res.status(200).json({
        success: true,
        count: rejectedCrew.length,
        data: {
          rejectedCrew: rejectedCrew,
        },
      });
    } catch (error) {
      console.error("❌ Get rejected crew error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve rejected crew members",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
}

module.exports = CrewController;
