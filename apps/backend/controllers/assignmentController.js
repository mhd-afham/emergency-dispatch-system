const Assignment = require("../models/Assignment");
const Incident = require("../models/Incident");
const Vehicle = require("../models/Vehicle");
const Crew = require("../models/Crew");
const mongoose = require("mongoose");

/**
 * Assignment Controller for Emergency Dispatch System
 * Handles resource dispatch, assignment management, and status tracking
 * Implements Phase 4a - Assignment Logic
 */
class AssignmentController {
  /**
   * Create a new assignment (Dispatch vehicle to incident)
   * POST /api/assignments
   */
  static async createAssignment(req, res) {
    try {
      console.log(
        "🚨 Creating new assignment - Dispatched by:",
        req.user.firstName,
        req.user.lastName
      );
      console.log("🔍 Assignment request:", JSON.stringify(req.body, null, 2));

      const { incidentId, vehicleId, additionalCrew, priority } = req.body;

      // Validate required fields
      if (!incidentId || !vehicleId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          required: ["incidentId", "vehicleId"],
        });
      }

      // Verify incident exists
      const incident = await Incident.findById(incidentId);
      if (!incident) {
        return res.status(404).json({
          success: false,
          message: `Incident not found: ${incidentId}`,
        });
      }

      // Verify vehicle exists and is available
      const vehicle = await Vehicle.findById(vehicleId).populate(
        "assignment.crew"
      );
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: `Vehicle not found: ${vehicleId}`,
        });
      }

      // Auto-find crew leader from vehicle's assigned crew
      let primaryCrewId = null;
      if (vehicle.assignment.crew && vehicle.assignment.crew.length > 0) {
        const crewLeader = vehicle.assignment.crew.find(
          (crewMember) =>
            crewMember.professional && crewMember.professional.isLeader
        );

        if (crewLeader) {
          primaryCrewId = crewLeader._id;
          console.log(
            `✅ Auto-detected crew leader: ${crewLeader.personal.firstName} ${crewLeader.personal.lastName} (${crewLeader.employeeId})`
          );
        } else {
          return res.status(400).json({
            success: false,
            message:
              "No crew leader found in vehicle's assigned crew. Vehicle must have at least one crew member with isLeader=true.",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Vehicle has no assigned crew. Please assign crew to vehicle before creating assignment.",
        });
      }

      // Check if vehicle is already assigned
      if (
        vehicle.status.currentStatus !== "available" &&
        vehicle.status.currentStatus !== "returning"
      ) {
        return res.status(400).json({
          success: false,
          message: `Vehicle is not available. Current status: ${vehicle.status.currentStatus}`,
        });
      }

      // Check if vehicle is already assigned to this incident
      const existingAssignment = await Assignment.findOne({
        "incident.incidentId": incidentId,
        "resource.vehicleId": vehicleId,
        "response.status": { $nin: ["completed", "cancelled"] },
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: "Vehicle is already assigned to this incident",
        });
      }

      // Create assignment
      const assignment = new Assignment({
        incident: {
          incidentId: incidentId,
        },
        resource: {
          vehicleId: vehicleId,
          primaryCrewId: primaryCrewId,
          additionalCrew: additionalCrew || [],
        },
        dispatch: {
          assignedBy: req.user._id,
          assignedAt: new Date(),
          priority: priority || "urgent",
        },
        response: {
          status: "assigned",
        },
      });

      await assignment.save();
      console.log("✅ Assignment created:", assignment._id);

      // Update vehicle status to assigned
      vehicle.status.currentStatus = "assigned";
      vehicle.assignment = {
        currentIncidentId: incidentId,
        assignedAt: new Date(),
      };
      await vehicle.save();
      console.log("✅ Vehicle status updated to assigned:", vehicle._id);

      // Update incident with assigned resource
      incident.assignedResources.push({
        resourceId: vehicleId,
        assignedAt: new Date(),
        status: "assigned",
      });
      incident.status = "assigned";
      await incident.save();
      console.log("✅ Incident updated with assigned resource:", incident._id);

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        // Notify all dispatchers about the assignment
        io.emit("assignment_created", {
          assignment: assignment,
          incident: {
            _id: incident._id,
            incidentId: incident.incidentId,
            incidentType: incident.incidentType,
            severity: incident.severity,
            location: incident.location,
          },
          vehicle: {
            _id: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
            vehicleType: vehicle.registration.vehicleType,
          },
          timestamp: new Date().toISOString(),
        });

        // Notify the specific vehicle crew (they will receive this on mobile app)
        io.to(`vehicle-${vehicleId}`).emit("assignment_notification", {
          assignmentId: assignment._id,
          incident: {
            incidentId: incident.incidentId,
            incidentType: incident.incidentType,
            severity: incident.severity,
            location: incident.location,
            description: incident.description,
          },
          timeoutSeconds: 30, // 30-second acceptance timer
          timestamp: new Date().toISOString(),
        });

        console.log(
          "📡 WebSocket events emitted: assignment_created, assignment_notification"
        );
      }

      // Populate the assignment with full details before sending response
      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate("incident.incidentId")
        .populate("resource.vehicleId")
        .populate("dispatch.assignedBy", "firstName lastName auth.role");

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        data: populatedAssignment,
      });
    } catch (error) {
      console.error("❌ Error creating assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create assignment",
        error: error.message,
      });
    }
  }

  /**
   * Update assignment status (Accept, Decline, En Route, On Scene, Complete)
   * PUT /api/assignments/:id/status
   */
  static async updateAssignmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, declineReason, notes } = req.body;

      console.log(
        `🔄 Updating assignment ${id} status to: ${status} by ${req.user.firstName} ${req.user.lastName}`
      );

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      // Validate status value
      const validStatuses = [
        "assigned",
        "accepted",
        "declined",
        "en_route",
        "on_scene",
        "completed",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      const assignment = await Assignment.findById(id)
        .populate("incident.incidentId")
        .populate("resource.vehicleId");

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: `Assignment not found: ${id}`,
        });
      }

      // Update assignment status based on the new status
      assignment.response.status = status;

      switch (status) {
        case "accepted":
          assignment.response.acceptedAt = new Date();
          assignment.response.acceptedBy = req.user._id;
          break;
        case "declined":
          assignment.response.declinedAt = new Date();
          assignment.response.declineReason =
            declineReason || "No reason provided";
          break;
        case "en_route":
          assignment.response.enRouteAt = new Date();
          break;
        case "on_scene":
          assignment.response.onSceneAt = new Date();
          break;
        case "completed":
          assignment.response.completedAt = new Date();
          break;
        case "cancelled":
          assignment.response.cancelledAt = new Date();
          assignment.response.cancellationReason =
            notes || "Cancelled by dispatcher";
          break;
      }

      await assignment.save();
      console.log("✅ Assignment status updated:", assignment._id);

      // Update vehicle status
      const vehicle = assignment.resource.vehicleId;
      if (vehicle) {
        switch (status) {
          case "accepted":
          case "assigned":
            vehicle.status.currentStatus = "assigned";
            break;
          case "en_route":
            vehicle.status.currentStatus = "en_route";
            break;
          case "on_scene":
            vehicle.status.currentStatus = "on_scene";
            break;
          case "completed":
          case "declined":
          case "cancelled":
            vehicle.status.currentStatus = "available";
            vehicle.assignment = {
              currentIncidentId: null,
              assignedAt: null,
            };
            break;
        }
        await vehicle.save();
        console.log("✅ Vehicle status updated:", vehicle._id);
      }

      // Update incident status
      const incident = assignment.incident.incidentId;
      if (incident) {
        // Update the assigned resource status in incident
        const resourceIndex = incident.assignedResources.findIndex(
          (r) => r.resourceId.toString() === vehicle._id.toString()
        );

        if (resourceIndex !== -1) {
          incident.assignedResources[resourceIndex].status = status;
        }

        // Update incident status based on assignment status
        if (status === "en_route" && incident.status === "assigned") {
          incident.status = "en_route";
        } else if (status === "on_scene") {
          incident.status = "on_scene";
        } else if (status === "completed") {
          // Check if all assigned resources are completed
          const allCompleted = incident.assignedResources.every(
            (r) => r.status === "completed"
          );
          if (allCompleted) {
            incident.status = "resolved";
          }
        } else if (status === "declined" || status === "cancelled") {
          // Remove the resource from assigned resources
          incident.assignedResources = incident.assignedResources.filter(
            (r) => r.resourceId.toString() !== vehicle._id.toString()
          );

          // If no resources left, set back to pending
          if (incident.assignedResources.length === 0) {
            incident.status = "pending";
          }
        }

        await incident.save();
        console.log("✅ Incident status updated:", incident._id);
      }

      // Emit WebSocket event for real-time updates
      const io = req.app.get("io");
      if (io) {
        io.emit("assignment_status_update", {
          assignmentId: assignment._id,
          status: status,
          incident: {
            _id: incident._id,
            incidentId: incident.incidentId,
            status: incident.status,
          },
          vehicle: {
            _id: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
            status: vehicle.status.currentStatus,
          },
          timestamp: new Date().toISOString(),
        });

        // If declined or timeout, notify dispatcher for reassignment
        if (status === "declined") {
          io.emit("assignment_declined", {
            assignmentId: assignment._id,
            incidentId: incident.incidentId,
            vehicleId: vehicle._id,
            reason: declineReason,
            timestamp: new Date().toISOString(),
          });
        }

        console.log("📡 WebSocket event emitted: assignment_status_update");
      }

      res.status(200).json({
        success: true,
        message: `Assignment status updated to ${status}`,
        data: assignment,
      });
    } catch (error) {
      console.error("❌ Error updating assignment status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update assignment status",
        error: error.message,
      });
    }
  }

  /**
   * Get assignments for a specific incident
   * GET /api/assignments/incident/:incidentId
   */
  static async getIncidentAssignments(req, res) {
    try {
      const { incidentId } = req.params;

      console.log(`📋 Fetching assignments for incident: ${incidentId}`);

      const assignments = await Assignment.find({
        "incident.incidentId": incidentId,
      })
        .populate("incident.incidentId")
        .populate("resource.vehicleId")
        .populate("resource.primaryCrewId")
        .populate("dispatch.assignedBy", "firstName lastName auth.role")
        .sort({ "dispatch.assignedAt": -1 });

      res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
      });
    } catch (error) {
      console.error("❌ Error fetching incident assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch incident assignments",
        error: error.message,
      });
    }
  }

  /**
   * Get all assignments (with optional filtering)
   * GET /api/assignments
   */
  static async getAllAssignments(req, res) {
    try {
      const { status, vehicleId, incidentId, limit = 50 } = req.query;

      console.log("📋 Fetching assignments with filters:", {
        status,
        vehicleId,
        incidentId,
      });

      const query = {};

      if (status) {
        query["response.status"] = status;
      }

      if (vehicleId) {
        query["resource.vehicleId"] = vehicleId;
      }

      if (incidentId) {
        query["incident.incidentId"] = incidentId;
      }

      const assignments = await Assignment.find(query)
        .populate("incident.incidentId")
        .populate("resource.vehicleId")
        .populate("resource.primaryCrewId")
        .populate("dispatch.assignedBy", "firstName lastName auth.role")
        .sort({ "dispatch.assignedAt": -1 })
        .limit(parseInt(limit));

      res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
      });
    } catch (error) {
      console.error("❌ Error fetching assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  }

  /**
   * Get assignment by ID
   * GET /api/assignments/:id
   */
  static async getAssignmentById(req, res) {
    try {
      const { id } = req.params;

      console.log(`📋 Fetching assignment: ${id}`);

      const assignment = await Assignment.findById(id)
        .populate("incident.incidentId")
        .populate("resource.vehicleId")
        .populate("resource.primaryCrewId")
        .populate("resource.additionalCrew")
        .populate("dispatch.assignedBy", "firstName lastName auth.role");

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: `Assignment not found: ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      console.error("❌ Error fetching assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignment",
        error: error.message,
      });
    }
  }
}

module.exports = AssignmentController;
