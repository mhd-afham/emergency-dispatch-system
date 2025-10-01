const Vehicle = require("../models/Vehicle");
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
}

module.exports = VehicleController;
