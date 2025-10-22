const Assignment = require("../models/Assignment");
const Incident = require("../models/Incident");
const Vehicle = require("../models/Vehicle");
const Crew = require("../models/Crew");
const mongoose = require("mongoose");

/**
 * Assignment Controller for Emergency Dispatch System
 * Handles resource dispatch, assignment management, and status tracking
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
      const vehicle = await Vehicle.findById(vehicleId).populate({
        path: "assignment.crew",
        model: "Crew",
        select: "personal professional employeeId",
      });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: `Vehicle not found: ${vehicleId}`,
        });
      }

      // Auto-find crew leader from vehicle's assigned crew
      let primaryCrewId = null;
      if (vehicle.assignment.crew && vehicle.assignment.crew.length > 0) {
        console.log(
          `🔍 Searching for crew leader in vehicle ${vehicle.registration.plateNumber}...`
        );
        console.log(
          `🔍 Vehicle has ${vehicle.assignment.crew.length} crew member(s)`
        );

        const crewLeader = vehicle.assignment.crew.find((crewMember) => {
          const hasLeaderFlag =
            crewMember.professional &&
            crewMember.professional.isLeader === true;
          console.log(
            `   - Checking crew member: ${
              crewMember.personal?.firstName || "Unknown"
            } ${crewMember.personal?.lastName || ""} (ID: ${
              crewMember._id
            }) - isLeader: ${hasLeaderFlag}`
          );
          return hasLeaderFlag;
        });

        if (crewLeader) {
          primaryCrewId = crewLeader._id;
          console.log(
            `✅ Auto-detected crew leader: ${crewLeader.personal.firstName} ${crewLeader.personal.lastName} (${crewLeader.employeeId}) - ID: ${primaryCrewId}`
          );
        } else {
          console.log(
            "❌ No crew leader found in vehicle's assigned crew. Crew details:"
          );
          vehicle.assignment.crew.forEach((c) => {
            console.log(
              `   - ${c.personal?.firstName} ${c.personal?.lastName} (${c.employeeId}): isLeader = ${c.professional?.isLeader}`
            );
          });

          return res.status(400).json({
            success: false,
            message:
              "No crew leader found in vehicle's assigned crew. Vehicle must have at least one crew member with isLeader=true.",
            debug: {
              vehicleId: vehicle._id,
              plateNumber: vehicle.registration.plateNumber,
              crewCount: vehicle.assignment.crew.length,
              crewMembers: vehicle.assignment.crew.map((c) => ({
                id: c._id,
                name: `${c.personal?.firstName} ${c.personal?.lastName}`,
                employeeId: c.employeeId,
                isLeader: c.professional?.isLeader,
              })),
            },
          });
        }
      } else {
        console.log(
          `❌ Vehicle ${vehicle.registration.plateNumber} has no assigned crew`
        );
        return res.status(400).json({
          success: false,
          message:
            "Vehicle has no assigned crew. Please assign crew to vehicle before creating assignment.",
          debug: {
            vehicleId: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
          },
        });
      }

      // Check if vehicle is busy with an active assignment
      const busyStatuses = ["assigned", "en_route", "on_scene"];
      if (busyStatuses.includes(vehicle.status.currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Vehicle is not available. Current status: ${vehicle.status.currentStatus}`,
        });
      }

      // Check if vehicle is operationally ready (October 22, 2025)
      if (vehicle.status.operational !== "active") {
        return res.status(400).json({
          success: false,
          message: `Vehicle cannot be assigned. Operational status: ${vehicle.status.operational}`,
          details: {
            vehicleId: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
            operational: vehicle.status.operational,
            currentStatus: vehicle.status.currentStatus,
          },
        });
      }

      // Check if crew has marked vehicle as ready (October 22, 2025)
      if (vehicle.readiness?.isReady === false) {
        return res.status(400).json({
          success: false,
          message:
            "Vehicle is not ready. Crew has marked vehicle as not ready.",
          details: {
            vehicleId: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
            notReadyReason: vehicle.readiness.notReadyReason,
            lastReadyUpdate: vehicle.readiness.lastReadyUpdate,
          },
        });
      }

      // Check if vehicle has any pending or active assignments (not declined/completed/cancelled/returned)
      const existingAssignment = await Assignment.findOne({
        "resource.vehicleId": vehicleId,
        "response.status": {
          $nin: ["completed", "cancelled", "declined", "returned"],
        },
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: `Vehicle already has an active or pending assignment (Status: ${existingAssignment.response.status})`,
          assignmentId: existingAssignment._id,
        });
      }

      // Validate incident has location coordinates
      if (
        !incident.location?.coordinates?.coordinates ||
        incident.location.coordinates.coordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Incident does not have valid location coordinates. Cannot create assignment.",
          debug: {
            incidentId: incident._id,
            incidentIdString: incident.incidentId,
            hasLocation: !!incident.location,
            hasCoordinates: !!incident.location?.coordinates,
            coordinates: incident.location?.coordinates?.coordinates,
          },
        });
      }

      // Create assignment with incident location (GeoJSON format)
      // Map incident severity to assignment priority (they use the same enum now)
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
          priority: priority || incident.severity || "medium", // Use incident severity as priority
        },
        response: {
          status: "assigned",
        },
        location: {
          dispatchLocation: {
            type: "Point",
            coordinates: incident.location.coordinates.coordinates, // [longitude, latitude]
          },
        },
      });

      await assignment.save();
      console.log("✅ Assignment created:", assignment._id);

      // Don't update vehicle status until crew accepts
      // Vehicle remains "available" but has a pending assignment
      console.log(
        "⏳ Assignment created, vehicle remains available until crew accepts"
      );

      // Update incident with assigned resource (pending crew acceptance)
      incident.assignedResources.push({
        resourceId: vehicleId,
        assignedAt: new Date(),
        status: "pending", // Assignment created but not yet accepted
      });
      // Don't change incident status yet - wait for crew acceptance
      try {
        await incident.save();
        console.log(
          "✅ Incident updated with pending assignment:",
          incident._id
        );
      } catch (incidentSaveError) {
        console.error("❌ Failed to save incident:", incidentSaveError.message);
        // Delete the assignment since we couldn't update the incident
        await Assignment.findByIdAndDelete(assignment._id);
        throw new Error(
          `Failed to update incident: ${incidentSaveError.message}`
        );
      }

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

        // Notify the specific crew leader (they will receive this on mobile app)
        // Mobile app joins room: crew-${crewId}, NOT vehicle-${vehicleId}
        io.to(`crew-${primaryCrewId}`).emit("assignment_notification", {
          assignmentId: assignment._id,
          incident: {
            incidentId: incident.incidentId,
            incidentType: incident.incidentType,
            severity: incident.severity,
            location: incident.location,
            description: incident.description,
          },
          vehicle: {
            _id: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
            vehicleType: vehicle.registration.vehicleType,
          },
          timeoutSeconds: 30, // 30-second acceptance timer
          timestamp: new Date().toISOString(),
        });

        console.log(
          `📡 WebSocket events emitted: assignment_created (all dispatchers), assignment_notification (crew-${primaryCrewId})`
        );
      }

      // Set up auto-decline timeout (30 seconds)
      setTimeout(async () => {
        try {
          // Check if assignment is still pending (not accepted/declined)
          const currentAssignment = await Assignment.findById(assignment._id)
            .populate("incident.incidentId")
            .populate("resource.vehicleId");

          if (
            currentAssignment &&
            currentAssignment.response.status === "assigned"
          ) {
            console.log(
              `⏰ Assignment ${assignment._id} timed out - auto-declining`
            );

            // Update assignment to declined with timeout reason
            currentAssignment.response.status = "declined";
            currentAssignment.response.declinedAt = new Date();
            currentAssignment.response.declineReason =
              "Crew did not respond within 30 seconds (timeout)";
            await currentAssignment.save();

            // Update vehicle status back to available
            const timeoutVehicle = currentAssignment.resource.vehicleId;
            if (timeoutVehicle) {
              timeoutVehicle.status.currentStatus = "available";
              timeoutVehicle.assignment.currentIncidentId = null;
              timeoutVehicle.assignment.assignedAt = null;
              await timeoutVehicle.save();
            }

            // Update incident - remove this resource from assignedResources
            const timeoutIncident = currentAssignment.incident.incidentId;
            if (timeoutIncident) {
              timeoutIncident.assignedResources =
                timeoutIncident.assignedResources.filter(
                  (r) =>
                    r.resourceId.toString() !== timeoutVehicle._id.toString()
                );

              // If no resources left, set incident back to pending
              if (timeoutIncident.assignedResources.length === 0) {
                timeoutIncident.status = "pending";
              }

              await timeoutIncident.save();
            }

            // Emit WebSocket events for timeout
            if (io) {
              io.emit("assignment_declined", {
                assignmentId: currentAssignment._id,
                incidentId: timeoutIncident.incidentId,
                vehicleId: timeoutVehicle._id,
                reason: "Crew did not respond within 30 seconds (timeout)",
                timestamp: new Date().toISOString(),
              });

              io.emit("assignment_status_update", {
                assignmentId: currentAssignment._id,
                status: "declined",
                incident: {
                  _id: timeoutIncident._id,
                  incidentId: timeoutIncident.incidentId,
                  status: timeoutIncident.status,
                },
                vehicle: {
                  _id: timeoutVehicle._id,
                  plateNumber: timeoutVehicle.registration.plateNumber,
                  status: timeoutVehicle.status.currentStatus,
                },
                timestamp: new Date().toISOString(),
              });

              console.log("📡 WebSocket events emitted for timeout");
            }
          }
        } catch (timeoutError) {
          console.error("❌ Error handling assignment timeout:", timeoutError);
        }
      }, 30000); // 30 seconds

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
        "returned", // NEW - When vehicle arrives back at station
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
          assignment.response.returningAt = new Date(); // Set returning timestamp
          break;
        case "returned":
          // Vehicle has arrived back at station
          assignment.response.returnedAt = new Date();
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
            // Vehicle is returning to station after completion
            vehicle.status.currentStatus = "returning";
            // Set readiness to true - vehicle available for new assignments (Oct 20, 2025)
            vehicle.readiness.isReady = true;
            vehicle.readiness.lastReadyUpdate = new Date();
            vehicle.readiness.notReadyReason = null;
            // Clear incident assignment but keep crew assigned to vehicle
            vehicle.assignment.currentIncidentId = null;
            vehicle.assignment.assignedAt = null;
            // Do NOT clear vehicle.assignment.crew - crew stays with vehicle
            break;
          case "returned":
            // Vehicle has arrived back at station - now available
            vehicle.status.currentStatus = "available";
            // Incident already cleared when status was "completed"

            // Reset vehicle location to home station coordinates (Issue #25 fix - Oct 22, 2025)
            // Need to populate station to get coordinates
            await vehicle.populate("station.homeStationId");
            if (vehicle.station?.homeStationId?.coordinates?.coordinates) {
              const stationCoords =
                vehicle.station.homeStationId.coordinates.coordinates;
              vehicle.status.currentLocation = {
                type: "Point",
                coordinates: stationCoords, // [longitude, latitude]
              };
              vehicle.status.lastLocationUpdate = new Date();
              console.log(
                `✅ Vehicle ${vehicle.registration.plateNumber} location reset to station: [${stationCoords}]`
              );
            } else {
              console.warn(
                `⚠️ Could not reset location for vehicle ${vehicle._id} - station coordinates not found`
              );
            }
            break;
          case "declined":
          case "cancelled":
            // Only change status to "available" if vehicle is not currently "returning"
            // If vehicle is returning from a previous assignment, preserve that status
            if (vehicle.status.currentStatus !== "returning") {
              vehicle.status.currentStatus = "available";

              // Reset location to station if vehicle was en_route or on_scene (Issue #25 - Oct 22, 2025)
              // If just assigned/declined before leaving, location should already be at station
              const wasInField = ["en_route", "on_scene"].includes(
                vehicle.status.currentStatus
              );
              if (wasInField) {
                await vehicle.populate("station.homeStationId");
                if (vehicle.station?.homeStationId?.coordinates?.coordinates) {
                  const stationCoords =
                    vehicle.station.homeStationId.coordinates.coordinates;
                  vehicle.status.currentLocation = {
                    type: "Point",
                    coordinates: stationCoords,
                  };
                  vehicle.status.lastLocationUpdate = new Date();
                  console.log(
                    `✅ Vehicle ${vehicle.registration.plateNumber} location reset to station after cancellation: [${stationCoords}]`
                  );
                }
              }
            }
            // Clear incident assignment but keep crew assigned to vehicle
            vehicle.assignment.currentIncidentId = null;
            vehicle.assignment.assignedAt = null;
            // Do NOT clear vehicle.assignment.crew - crew stays with vehicle
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
          // Map assignment status to incident resource status
          // Assignment statuses: assigned, accepted, declined, en_route, on_scene, completed, returned, cancelled
          // Incident resource statuses: pending, assigned, en_route, on_scene, completed, returned
          let incidentResourceStatus = status;

          if (status === "accepted") {
            // When crew accepts, change incident resource from "pending" to "assigned"
            incidentResourceStatus = "assigned";
          } else if (status === "returned") {
            // When crew returns to station, keep incident resource as "completed"
            // The incident is already resolved, we just track that the vehicle has returned
            incidentResourceStatus = "completed";
          } else if (status === "declined" || status === "cancelled") {
            // These will be removed from array below, no need to update status
            incidentResourceStatus = status; // doesn't matter, will be removed
          }

          incident.assignedResources[resourceIndex].status =
            incidentResourceStatus;
        }

        // Update incident status based on ALL assigned resources (multi-vehicle aware)
        if (status === "declined" || status === "cancelled") {
          // Remove the resource from assigned resources
          incident.assignedResources = incident.assignedResources.filter(
            (r) => r.resourceId.toString() !== vehicle._id.toString()
          );

          // If no resources left, set back to pending
          if (incident.assignedResources.length === 0) {
            incident.status = "pending";
          }
          // If still has resources, check their statuses to update incident status
          else {
            const remainingStatuses = incident.assignedResources.map(
              (r) => r.status
            );
            if (remainingStatuses.every((s) => s === "pending")) {
              incident.status = "pending";
            } else if (remainingStatuses.some((s) => s === "on_scene")) {
              incident.status = "on_scene";
            } else if (remainingStatuses.some((s) => s === "en_route")) {
              incident.status = "en_route";
            } else if (
              remainingStatuses.every(
                (s) => s === "assigned" || s === "accepted"
              )
            ) {
              incident.status = "assigned";
            }
          }
        } else if (status === "completed") {
          // Check if ALL assigned resources are completed
          const allCompleted = incident.assignedResources.every(
            (r) => r.status === "completed"
          );
          if (allCompleted) {
            incident.status = "resolved";
          }
          // If not all completed, keep incident in highest active status
          else {
            const activeStatuses = incident.assignedResources
              .filter((r) => r.status !== "completed")
              .map((r) => r.status);
            if (activeStatuses.some((s) => s === "on_scene")) {
              incident.status = "on_scene";
            } else if (activeStatuses.some((s) => s === "en_route")) {
              incident.status = "en_route";
            } else if (
              activeStatuses.some((s) => s === "assigned" || s === "accepted")
            ) {
              incident.status = "assigned";
            }
          }
        } else {
          // For accepted, en_route, on_scene: Use highest status among all resources
          const allStatuses = incident.assignedResources.map((r) => r.status);

          // Priority: on_scene > en_route > assigned/accepted > pending
          if (allStatuses.some((s) => s === "on_scene")) {
            incident.status = "on_scene";
          } else if (allStatuses.some((s) => s === "en_route")) {
            incident.status = "en_route";
          } else if (
            allStatuses.some((s) => s === "assigned" || s === "accepted")
          ) {
            incident.status = "assigned";
          } else if (allStatuses.every((s) => s === "pending")) {
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

        // Emit vehicle readiness update when assignment completed (October 21, 2025)
        if (status === "completed") {
          io.emit("vehicle_readiness_update", {
            vehicleId: vehicle._id,
            plateNumber: vehicle.registration.plateNumber,
            isReady: true,
            notReadyReason: null,
            timestamp: new Date().toISOString(),
          });
          console.log(
            "📡 WebSocket event emitted: vehicle_readiness_update (assignment completed)"
          );
        }

        // Emit vehicle status update for real-time mobile app updates (October 21, 2025)
        io.emit("vehicle_status_update", {
          vehicleId: vehicle._id,
          status: vehicle.status.currentStatus,
          operational: vehicle.status.operational,
          assignedIncidentId: vehicle.assignment?.currentIncidentId,
          timestamp: new Date().toISOString(),
        });
        console.log(
          `📡 WebSocket event emitted: vehicle_status_update (${vehicle.status.currentStatus})`
        );

        // Emit incident update event for real-time incident queue updates
        io.emit("incident:updated", {
          _id: incident._id,
          incidentId: incident.incidentId,
          status: incident.status,
          assignedResources: incident.assignedResources,
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
          console.log(
            "📡 WebSocket event emitted: assignment_status_update, assignment_declined, incident:updated"
          );
        } else {
          console.log(
            "📡 WebSocket event emitted: assignment_status_update, incident:updated"
          );
        }
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

      // Only fetch active assignments (exclude declined and cancelled)
      const assignments = await Assignment.find({
        "incident.incidentId": incidentId,
        "response.status": {
          $nin: ["declined", "cancelled"],
        },
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

  /**
   * Cancel/Recall an assignment
   * DELETE /api/assignments/:id
   * Business Rules:
   * - Can only cancel if status is: assigned, accepted, or en_route
   * - Cannot cancel if: on_scene, completed, or returned
   * - Vehicle returns to available status
   * - Incident assignment cleared from vehicle
   * - Real-time notification sent to mobile crew
   */
  static async cancelAssignment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      console.log(
        `🚫 Cancelling assignment: ${id} by ${req.user.firstName} ${req.user.lastName}`
      );
      console.log(`📝 Cancellation reason: ${reason || "No reason provided"}`);

      // Find assignment with populated data
      const assignment = await Assignment.findById(id)
        .populate("resource.vehicleId")
        .populate("resource.primaryCrewId")
        .populate("incident.incidentId");

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: `Assignment not found: ${id}`,
        });
      }

      // Check if assignment can be cancelled (business rule validation)
      const currentStatus = assignment.response?.status || assignment.status;
      const cancellableStatuses = ["assigned", "accepted", "en_route"];
      const nonCancellableStatuses = [
        "on_scene",
        "completed",
        "returned",
        "cancelled",
        "declined",
      ];

      if (!cancellableStatuses.includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel assignment with status: ${currentStatus}`,
          details: nonCancellableStatuses.includes(currentStatus)
            ? `Assignment is already ${currentStatus}. Only assignments that are assigned, accepted, or en_route can be cancelled.`
            : `Invalid status for cancellation`,
          currentStatus,
          cancellableStatuses,
        });
      }

      // Update assignment status to cancelled
      assignment.response.status = "cancelled";
      assignment.response.cancelledAt = new Date();
      assignment.response.cancellationReason =
        reason || `Cancelled by ${req.user.firstName} ${req.user.lastName}`;
      assignment.status = "cancelled"; // Update top-level status too

      await assignment.save();
      console.log("✅ Assignment status updated to cancelled");

      // Update vehicle status back to available
      const vehicle = assignment.resource.vehicleId;
      if (vehicle) {
        vehicle.status.currentStatus = "available";
        vehicle.assignment.currentIncidentId = null;
        vehicle.assignment.assignedAt = null;
        // Keep crew assigned to vehicle (they stay with vehicle)
        await vehicle.save();
        console.log("✅ Vehicle status updated to available:", vehicle._id);
      }

      // Update incident to recalculate status based on remaining assignments
      const incident = assignment.incident.incidentId;
      if (incident) {
        const remainingActiveAssignments = await Assignment.countDocuments({
          "incident.incidentId": incident._id,
          "response.status": { $nin: ["declined", "cancelled"] },
        });

        console.log(
          `📊 Incident ${incident.incidentId} has ${remainingActiveAssignments} remaining active assignments`
        );

        // If no active assignments remain, set incident back to pending
        if (remainingActiveAssignments === 0) {
          incident.status = "pending";
          incident.assignedResources = [];
          await incident.save();
          console.log(
            "✅ Incident status updated to pending (no active assignments)"
          );
        } else {
          // Recalculate incident status based on remaining active assignments
          const activeAssignments = await Assignment.find({
            "incident.incidentId": incident._id,
            "response.status": { $nin: ["declined", "cancelled"] },
          });

          const activeStatuses = activeAssignments.map(
            (a) => a.response?.status || a.status
          );

          // Priority: on_scene > en_route > accepted/assigned > pending
          if (activeStatuses.some((s) => s === "on_scene")) {
            incident.status = "on_scene";
          } else if (activeStatuses.some((s) => s === "en_route")) {
            incident.status = "en_route";
          } else if (
            activeStatuses.some((s) => s === "assigned" || s === "accepted")
          ) {
            incident.status = "assigned";
          } else {
            incident.status = "pending";
          }

          // Update assignedResources array
          incident.assignedResources = activeAssignments.map((a) => ({
            vehicleId: a.resource.vehicleId._id,
            assignmentId: a._id,
            status: a.response?.status || a.status,
          }));

          await incident.save();
          console.log(
            "✅ Incident status recalculated after cancellation:",
            incident.status
          );
        }
      }

      // Emit real-time events via WebSocket
      const io = req.app.get("io");
      if (io) {
        // Notify all dispatchers about the cancellation
        io.emit("assignment:cancelled", {
          assignmentId: assignment._id,
          incidentId: incident?._id,
          vehicleId: vehicle?._id,
          status: "cancelled",
          cancelledAt: assignment.response.cancelledAt,
          reason: assignment.response.cancellationReason,
          cancelledBy: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            role: req.user.auth.role,
          },
        });

        // Emit incident update event for real-time incident status updates
        if (incident) {
          io.emit("incident:updated", {
            _id: incident._id,
            incidentId: incident.incidentId,
            status: incident.status,
            assignedResources: incident.assignedResources,
            timestamp: new Date().toISOString(),
          });
          console.log(
            "✅ incident:updated event emitted after cancellation:",
            incident.incidentId
          );
        }

        // Notify the specific crew member about cancellation
        const crewId = assignment.resource.primaryCrewId?._id;
        if (crewId) {
          io.to(`crew-${crewId}`).emit("assignment:cancelled", {
            assignmentId: assignment._id,
            incidentId: incident?._id,
            status: "cancelled",
            cancelledAt: assignment.response.cancelledAt,
            reason: assignment.response.cancellationReason,
            message: "Your assignment has been cancelled by dispatch",
          });
          console.log(`📱 Cancellation notification sent to crew: ${crewId}`);
        }

        // Emit vehicle status update
        io.emit("vehicle:statusUpdate", {
          vehicleId: vehicle?._id,
          status: "available",
          updatedAt: new Date(),
        });
      }

      res.status(200).json({
        success: true,
        message: "Assignment cancelled successfully",
        data: {
          assignmentId: assignment._id,
          status: "cancelled",
          cancelledAt: assignment.response.cancelledAt,
          reason: assignment.response.cancellationReason,
          vehicle: {
            id: vehicle?._id,
            status: "available",
            plateNumber: vehicle?.registration?.plateNumber,
          },
          incident: {
            id: incident?._id,
            incidentId: incident?.incidentId,
            status: incident?.status,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error cancelling assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel assignment",
        error: error.message,
      });
    }
  }

  /**
   * Delete Assignment (CRUD - Delete Operation)
   * Permanently deletes an assignment from the database
   * Only cancelled assignments can be safely deleted to preserve audit trail
   */
  static async deleteAssignment(req, res) {
    try {
      const { id } = req.params;

      console.log(
        `🗑️  Attempting to delete assignment: ${id} by ${req.user.firstName} ${req.user.lastName}`
      );

      // Find assignment
      const assignment = await Assignment.findById(id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: `Assignment not found: ${id}`,
        });
      }

      // Safety check: Only allow deletion of cancelled assignments
      // This preserves audit trail for active/completed assignments
      const currentStatus = assignment.response?.status || assignment.status;

      if (currentStatus !== "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot delete assignment with status: ${currentStatus}`,
          details:
            "Only cancelled assignments can be deleted. Please cancel the assignment first if you need to remove it.",
          currentStatus,
          suggestion: "Cancel the assignment first, then delete it",
        });
      }

      // Store cancellation details before deletion (for response)
      const deletedData = {
        assignmentId: assignment._id,
        incidentId: assignment.incident?.incidentId,
        vehicleId: assignment.resource?.vehicleId,
        crewId: assignment.resource?.primaryCrewId,
        status: currentStatus,
        cancelledAt: assignment.response?.cancelledAt,
        cancellationReason: assignment.response?.cancellationReason,
        assignedAt: assignment.dispatch?.assignedAt,
      };

      // Perform deletion
      await Assignment.findByIdAndDelete(id);
      console.log("✅ Assignment deleted successfully:", id);

      // Emit real-time event for deletion
      const io = req.app.get("io");
      if (io) {
        io.emit("assignment:deleted", {
          assignmentId: id,
          deletedAt: new Date(),
          deletedBy: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            role: req.user.auth.role,
          },
        });
        console.log("📡 assignment:deleted event emitted");
      }

      res.status(200).json({
        success: true,
        message: "Assignment deleted successfully",
        data: deletedData,
      });
    } catch (error) {
      console.error("❌ Error deleting assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete assignment",
        error: error.message,
      });
    }
  }

  /**
   * Get assignment history with advanced filtering and search
   * GET /api/assignments/history
   * Supports: search, date range, status, priority, incident type filters
   */
  static async getAssignmentHistory(req, res) {
    try {
      const { search, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

      // Get array parameters (they come as ?status=completed&status=cancelled)
      const status = req.query.status
        ? Array.isArray(req.query.status)
          ? req.query.status
          : [req.query.status]
        : [];
      const priority = req.query.priority
        ? Array.isArray(req.query.priority)
          ? req.query.priority
          : [req.query.priority]
        : [];
      const incidentType = req.query.incidentType
        ? Array.isArray(req.query.incidentType)
          ? req.query.incidentType
          : [req.query.incidentType]
        : [];
      const vehicleType = req.query.vehicleType
        ? Array.isArray(req.query.vehicleType)
          ? req.query.vehicleType
          : [req.query.vehicleType]
        : [];

      console.log("📋 Fetching assignment history with filters:", {
        search,
        dateFrom,
        dateTo,
        status,
        priority,
        incidentType,
        vehicleType,
        page,
        limit,
      });

      // Build query
      const query = {};

      // Date range filter
      if (dateFrom || dateTo) {
        query["dispatch.assignedAt"] = {};
        if (dateFrom) {
          query["dispatch.assignedAt"].$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query["dispatch.assignedAt"].$lte = new Date(dateTo);
        }
      }

      // Status filter (can be queried directly as it's in Assignment model)
      if (status && status.length > 0) {
        query["response.status"] = { $in: status };
      }

      // NOTE: Priority and Incident Type are in the Incident model, not Assignment
      // They will be filtered after population (like vehicle type)

      // Search filter (searches across multiple fields)
      if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [
          { assignmentId: searchRegex },
          { "incident.incidentId": searchRegex },
          { "resource.vehicleCallSign": searchRegex },
          { "incident.location.address": searchRegex },
          { "incident.location.city": searchRegex },
        ];
      }

      // Execute query with population (get all matching documents for vehicle type filtering)
      let assignments = await Assignment.find(query)
        .populate("incident.incidentId")
        .populate("resource.vehicleId")
        .populate(
          "resource.primaryCrewId",
          "personal.firstName personal.lastName"
        )
        .populate("dispatch.assignedBy", "firstName lastName auth.role")
        .sort({ "dispatch.assignedAt": -1 });

      // Filter by vehicle type (after population since it's in the referenced document)
      if (vehicleType && vehicleType.length > 0) {
        assignments = assignments.filter((assignment) => {
          const vehicle = assignment.resource?.vehicleId;
          if (
            !vehicle ||
            !vehicle.registration ||
            !vehicle.registration.vehicleType
          ) {
            return false;
          }
          return vehicleType.includes(vehicle.registration.vehicleType);
        });
      }

      // Filter by priority (after population since it's in the Incident model as 'severity')
      if (priority && priority.length > 0) {
        assignments = assignments.filter((assignment) => {
          const incident = assignment.incident?.incidentId;
          if (!incident || !incident.severity) {
            return false;
          }
          return priority.includes(incident.severity);
        });
      }

      // Filter by incident type (after population since it's in the Incident model)
      if (incidentType && incidentType.length > 0) {
        assignments = assignments.filter((assignment) => {
          const incident = assignment.incident?.incidentId;
          if (!incident || !incident.incidentType) {
            return false;
          }
          return incidentType.includes(incident.incidentType);
        });
      }

      // Get total count after vehicle type filtering
      const total = assignments.length;

      // Apply pagination after filtering
      const skip = (parseInt(page) - 1) * parseInt(limit);
      assignments = assignments.slice(skip, skip + parseInt(limit));

      console.log(
        `📊 Found ${assignments.length} assignments out of ${total} total`
      );

      res.status(200).json({
        success: true,
        data: {
          assignments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("❌ Error fetching assignment history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignment history",
        error: error.message,
      });
    }
  }

  /**
   * Get assignment statistics
   * GET /api/assignments/statistics
   * Returns: comprehensive statistics for dashboard
   */
  static async getAssignmentStatistics(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      console.log("📊 Calculating assignment statistics", { dateFrom, dateTo });

      // Build date filter
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter["dispatch.assignedAt"] = {};
        if (dateFrom) {
          dateFilter["dispatch.assignedAt"].$gte = new Date(dateFrom);
        }
        if (dateTo) {
          dateFilter["dispatch.assignedAt"].$lte = new Date(dateTo);
        }
      }

      // Get all assignments for detailed analysis
      const allAssignments = await Assignment.find(dateFilter)
        .populate("incident.incidentId")
        .populate("resource.vehicleId");

      // Calculate statistics
      const totalAssignments = allAssignments.length;

      // By Status
      const byStatus = {};
      allAssignments.forEach((a) => {
        const status = a.response?.status || a.status || "pending";
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      // By Priority
      const byPriority = {};
      allAssignments.forEach((a) => {
        const priority = a.incident?.priority || "unknown";
        byPriority[priority] = (byPriority[priority] || 0) + 1;
      });

      // By Incident Type
      const byIncidentType = {};
      allAssignments.forEach((a) => {
        const type = a.incident?.type || "unknown";
        byIncidentType[type] = (byIncidentType[type] || 0) + 1;
      });

      // By Vehicle Type
      const byVehicleType = {};
      allAssignments.forEach((a) => {
        const vehicleType = a.resource?.vehicleId?.type || "unknown";
        byVehicleType[vehicleType] = (byVehicleType[vehicleType] || 0) + 1;
      });

      // Performance metrics
      // Include both "completed" and "returned" assignments for performance calculation
      const completedAssignments = allAssignments.filter(
        (a) =>
          a.response?.status === "completed" ||
          a.response?.status === "returned"
      );

      let avgResponseTime = null;
      let avgArrivalTime = null;
      let avgOnSceneTime = null;
      let avgTotalDuration = null;
      let minResponseTime = null;
      let maxResponseTime = null;

      if (completedAssignments.length > 0) {
        const responseTimes = [];
        const arrivalTimes = [];
        const onSceneTimes = [];
        const totalDurations = [];

        completedAssignments.forEach((a) => {
          // Use pre-calculated performance metrics from the database (in seconds)
          // These are calculated by the Assignment model's pre-save hook
          if (a.performance?.responseTime != null) {
            responseTimes.push(a.performance.responseTime);
          }

          if (a.performance?.arrivalTime != null) {
            arrivalTimes.push(a.performance.arrivalTime);
          }

          if (a.performance?.onSceneTime != null) {
            onSceneTimes.push(a.performance.onSceneTime);
          }

          if (a.performance?.totalDuration != null) {
            totalDurations.push(a.performance.totalDuration);
          }
        });

        if (responseTimes.length > 0) {
          avgResponseTime = Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          );
          minResponseTime = Math.round(Math.min(...responseTimes));
          maxResponseTime = Math.round(Math.max(...responseTimes));
        }

        if (arrivalTimes.length > 0) {
          avgArrivalTime = Math.round(
            arrivalTimes.reduce((a, b) => a + b, 0) / arrivalTimes.length
          );
        }

        if (onSceneTimes.length > 0) {
          avgOnSceneTime = Math.round(
            onSceneTimes.reduce((a, b) => a + b, 0) / onSceneTimes.length
          );
        }

        if (totalDurations.length > 0) {
          avgTotalDuration = Math.round(
            totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length
          );
        }
      }

      // Resolution rate
      const resolvedCount =
        (byStatus.completed || 0) + (byStatus.resolved || 0);
      const resolutionRate =
        totalAssignments > 0
          ? Math.round((resolvedCount / totalAssignments) * 100)
          : 0;

      // Daily trends (last 30 days or filtered range)
      const dailyTrends = [];
      const trendMap = {};
      allAssignments.forEach((a) => {
        const date = new Date(a.dispatch?.assignedAt)
          .toISOString()
          .split("T")[0];
        trendMap[date] = (trendMap[date] || 0) + 1;
      });
      Object.entries(trendMap).forEach(([date, count]) => {
        dailyTrends.push({ date, count });
      });
      dailyTrends.sort((a, b) => a.date.localeCompare(b.date));

      // Hourly distribution
      const hourlyDistribution = Array(24)
        .fill(0)
        .map((_, hour) => ({ hour, count: 0 }));
      allAssignments.forEach((a) => {
        const hour = new Date(a.dispatch?.assignedAt).getHours();
        hourlyDistribution[hour].count++;
      });

      const statistics = {
        totalAssignments,
        byStatus,
        byPriority,
        byIncidentType,
        byVehicleType,
        performance: {
          avgResponseTime,
          avgArrivalTime,
          avgOnSceneTime,
          avgTotalDuration,
          minResponseTime,
          maxResponseTime,
        },
        resolutionRate,
        dailyTrends,
        hourlyDistribution,
      };

      console.log("📈 Statistics calculated:", {
        totalAssignments,
        byStatus,
        resolutionRate,
        avgResponseTime,
      });

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("❌ Error calculating statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate statistics",
        error: error.message,
      });
    }
  }
}

module.exports = AssignmentController;
