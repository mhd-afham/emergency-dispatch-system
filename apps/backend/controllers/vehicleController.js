const Vehicle = require("../models/Vehicle");
const Crew = require("../models/Crew");
const mongoose = require("mongoose");

/**
 * Vehicle Controller for Emergency Dispatch System
 * Handles all vehicle tracking, management, and status operations
 * Implements the core functionality for Phase 3 Vehicle Tracking
 */
class VehicleController {
  /**
   * Get all vehicles with current status and location
   * GET /api/vehicles
   */
  static async getAllVehicles(req, res) {
    try {
      console.log(
        "🚗 Fetching all vehicles - Requested by:",
        req.user.firstName,
        req.user.lastName
      );

      // Extract query parameters for filtering
      const {
        status, // operational status (active, maintenance, out_of_service)
        currentStatus, // current status (available, assigned, en_route, on_scene, returning)
        vehicleType, // vehicle type (Ambulance, Fire Engine, etc.)
        assignedIncident, // filter by assigned incident
        page = 1,
        limit = 50,
      } = req.query;

      // Build filter object
      const filter = {};

      if (status) {
        filter["status.operational"] = status;
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

      console.log("🔍 Applied filters:", filter);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Fetch vehicles with pagination
      const [vehicles, totalCount] = await Promise.all([
        Vehicle.find(filter)
          .sort({ "status.lastLocationUpdate": -1 })
          .limit(parseInt(limit))
          .skip(skip)
          .exec(),
        Vehicle.countDocuments(filter),
      ]);

      console.log(
        `📊 Found ${vehicles.length} vehicles (${totalCount} total matching filters)`
      );

      res.status(200).json({
        success: true,
        message: `Successfully retrieved ${vehicles.length} vehicles`,
        data: vehicles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + vehicles.length < totalCount,
          hasPreviousPage: parseInt(page) > 1,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vehicles",
        error: error.message,
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
        req.user.firstName,
        req.user.lastName
      );

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID format",
        });
      }

      const vehicle = await Vehicle.findById(id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      console.log(
        `✅ Vehicle found: ${vehicle.registration.plateNumber} (${vehicle.registration.vehicleType})`
      );

      res.status(200).json({
        success: true,
        message: "Vehicle retrieved successfully",
        data: vehicle,
      });
    } catch (error) {
      console.error("❌ Error fetching vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vehicle",
        error: error.message,
      });
    }
  }

  /**
   * Update vehicle status (operational and current status)
   * PUT /api/vehicles/:id/status
   */
  static async updateVehicleStatus(req, res) {
    try {
      const { id } = req.params;
      const { operational, currentStatus } = req.body;

      console.log(
        `🚗 Updating vehicle ${id} status - Requested by:`,
        req.user.firstName,
        req.user.lastName
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

      // Build update object
      const updateData = {};
      if (operational) updateData["status.operational"] = operational;
      if (currentStatus) updateData["status.currentStatus"] = currentStatus;

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

      console.log(
        `✅ Vehicle status updated: ${vehicle.registration.plateNumber}`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_status_update", {
          vehicleId: vehicle._id,
          status: currentStatus,
          operational: operational,
          assignedIncidentId: vehicle.assignment?.currentIncidentId,
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_status_update");
      }

      res.status(200).json({
        success: true,
        message: "Vehicle status updated successfully",
        data: vehicle,
      });
    } catch (error) {
      console.error("❌ Error updating vehicle status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle status",
        error: error.message,
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
      const { coordinates } = req.body; // Expected: [longitude, latitude]

      console.log(
        `🚗 Updating vehicle ${id} location - Requested by:`,
        req.user.firstName,
        req.user.lastName
      );
      console.log("📍 Location update:", coordinates);

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle ID format",
        });
      }

      // Validate coordinates
      if (
        !coordinates ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message: "Coordinates must be an array of [longitude, latitude]",
        });
      }

      const [longitude, latitude] = coordinates;
      if (typeof longitude !== "number" || typeof latitude !== "number") {
        return res.status(400).json({
          success: false,
          message: "Coordinates must be numeric values",
        });
      }

      // Validate coordinate ranges
      if (
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid coordinate values. Longitude: -180 to 180, Latitude: -90 to 90",
        });
      }

      const vehicle = await Vehicle.findByIdAndUpdate(
        id,
        {
          "status.currentLocation": {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          "status.lastLocationUpdate": new Date().toISOString(),
        },
        { new: true, runValidators: true }
      );

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      console.log(
        `✅ Vehicle location updated: ${vehicle.registration.plateNumber} at [${longitude}, ${latitude}]`
      );

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("vehicle_location_update", {
          vehicleId: vehicle._id,
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          status: vehicle.status.currentStatus,
          timestamp: new Date().toISOString(),
        });
        console.log("📡 WebSocket event emitted: vehicle_location_update");
      }

      res.status(200).json({
        success: true,
        message: "Vehicle location updated successfully",
        data: vehicle,
      });
    } catch (error) {
      console.error("❌ Error updating vehicle location:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle location",
        error: error.message,
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
        req.user.firstName,
        req.user.lastName
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
        `👥 Assigning crew to vehicle ${vehicleId} - Supervisor: ${req.user.firstName} ${req.user.lastName}`
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
        `👥 Unassigning crew from vehicle ${vehicleId} - Supervisor: ${req.user.firstName} ${req.user.lastName}`
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
}

module.exports = VehicleController;
