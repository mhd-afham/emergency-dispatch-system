const Incident = require("../models/Incident");
const Vehicle = require("../models/Vehicle");
const Assignment = require("../models/Assignment");
const Crew = require("../models/Crew");
const Station = require("../models/Station");

/**
 * Database utility functions for optimized queries and analytics
 * Based on design document Section 5.4 Performance Optimization
 */

class DatabaseUtils {
  /**
   * Efficient incident dashboard query for emergency operations
   * Optimized for sub-second response times
   */
  static async getActiveIncidents(limit = 50) {
    try {
      return await Incident.find({
        "status.current": {
          $in: ["Assigned", "En Route", "On Scene", "Dispatched"],
        },
      })
        .select(
          [
            "incidentNumber",
            "caller.name",
            "caller.phone",
            "incident.type",
            "incident.severity",
            "location.address",
            "location.coordinates",
            "status",
            "assignment",
            "timeline",
          ].join(" ")
        )
        .populate(
          "assignment.vehicleId",
          "registration.plateNumber registration.vehicleType status.operational"
        )
        .populate(
          "assignment.primaryCrewId",
          "personal.firstName personal.lastName professional.role"
        )
        .populate(
          "assignment.additionalCrew",
          "personal.firstName personal.lastName professional.role"
        )
        .sort({ "timeline.reportedAt": -1 })
        .limit(limit)
        .lean(); // Use lean() for faster queries when not modifying documents
    } catch (error) {
      console.error("Error fetching active incidents:", error);
      throw error;
    }
  }

  /**
   * Geospatial query for nearby available resources
   * Critical for emergency response resource allocation
   */
  static async getNearbyVehicles(
    longitude,
    latitude,
    maxDistance = 10000,
    limit = 10
  ) {
    try {
      // Validate Sri Lankan coordinates
      if (
        longitude < 79.5 ||
        longitude > 81.9 ||
        latitude < 5.9 ||
        latitude > 9.9
      ) {
        throw new Error("Coordinates must be within Sri Lankan boundaries");
      }

      return await Vehicle.find({
        "status.operational": "Available",
        "status.currentLocation.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
        .select(
          [
            "registration",
            "status.currentLocation",
            "status.operational",
            "assignment.assignedCrewId",
            "assignment.currentStation",
          ].join(" ")
        )
        .populate(
          "assignment.assignedCrewId",
          "personal.firstName personal.lastName professional.role professional.certifications"
        )
        .populate(
          "assignment.currentStation",
          "stationInfo.name location.address"
        )
        .limit(limit)
        .lean();
    } catch (error) {
      console.error("Error fetching nearby vehicles:", error);
      throw error;
    }
  }

  /**
   * Get available crew members by station and certification
   */
  static async getAvailableCrewByStation(
    stationId,
    requiredCertifications = [],
    limit = 20
  ) {
    try {
      const query = {
        "currentStatus.availability": "available",
        "assignment.currentStation": stationId,
      };

      // Add certification filter if specified
      if (requiredCertifications.length > 0) {
        query["professional.certifications"] = {
          $in: requiredCertifications,
        };
      }

      return await Crew.find(query)
        .select(
          [
            "personal.firstName",
            "personal.lastName",
            "professional.role",
            "professional.certifications",
            "currentStatus.availability",
            "currentStatus.location",
          ].join(" ")
        )
        .sort({ "professional.experienceYears": -1 }) // Prioritize experienced crew
        .limit(limit)
        .lean();
    } catch (error) {
      console.error("Error fetching available crew:", error);
      throw error;
    }
  }

  /**
   * Response time metrics aggregation pipeline
   * For performance analytics and reporting
   */
  static async getResponseTimeMetrics(startDate, endDate, groupBy = "day") {
    try {
      const groupFormat = {
        day: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timeline.reportedAt",
          },
        },
        hour: {
          $dateToString: {
            format: "%Y-%m-%d %H:00",
            date: "$timeline.reportedAt",
          },
        },
        week: {
          $dateToString: {
            format: "%Y-W%U",
            date: "$timeline.reportedAt",
          },
        },
      };

      return await Incident.aggregate([
        {
          $match: {
            "timeline.reportedAt": { $gte: startDate, $lte: endDate },
            "timeline.arrivedAt": { $exists: true },
          },
        },
        {
          $addFields: {
            responseTime: {
              $divide: [
                { $subtract: ["$timeline.arrivedAt", "$timeline.reportedAt"] },
                1000,
              ],
            },
            dispatchTime: {
              $divide: [
                {
                  $subtract: ["$timeline.dispatchedAt", "$timeline.reportedAt"],
                },
                1000,
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              period: groupFormat[groupBy],
              incidentType: "$incident.type",
              severity: "$incident.severity",
            },
            avgResponseTime: { $avg: "$responseTime" },
            minResponseTime: { $min: "$responseTime" },
            maxResponseTime: { $max: "$responseTime" },
            avgDispatchTime: { $avg: "$dispatchTime" },
            totalIncidents: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.period": 1, "_id.incidentType": 1 },
        },
      ]);
    } catch (error) {
      console.error("Error generating response time metrics:", error);
      throw error;
    }
  }

  /**
   * Vehicle utilization analytics
   */
  static async getVehicleUtilizationMetrics(startDate, endDate) {
    try {
      return await Assignment.aggregate([
        {
          $match: {
            "dispatch.assignedAt": { $gte: startDate, $lte: endDate },
            "response.completedAt": { $exists: true },
          },
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "resource.vehicleId",
            foreignField: "_id",
            as: "vehicle",
          },
        },
        {
          $unwind: "$vehicle",
        },
        {
          $addFields: {
            totalDuration: {
              $divide: [
                {
                  $subtract: ["$response.completedAt", "$dispatch.assignedAt"],
                },
                1000 * 60, // Convert to minutes
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              vehicleId: "$resource.vehicleId",
              plateNumber: "$vehicle.registration.plateNumber",
              vehicleType: "$vehicle.registration.vehicleType",
            },
            totalAssignments: { $sum: 1 },
            totalHours: { $sum: { $divide: ["$totalDuration", 60] } },
            avgAssignmentDuration: { $avg: "$totalDuration" },
            utilizationRate: {
              $avg: {
                $cond: [{ $gt: ["$totalDuration", 0] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { totalAssignments: -1 },
        },
      ]);
    } catch (error) {
      console.error("Error generating vehicle utilization metrics:", error);
      throw error;
    }
  }

  /**
   * Station performance analytics
   */
  static async getStationPerformanceMetrics(startDate, endDate) {
    try {
      return await Assignment.aggregate([
        {
          $match: {
            "dispatch.assignedAt": { $gte: startDate, $lte: endDate },
            "response.status": "completed",
          },
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "resource.vehicleId",
            foreignField: "_id",
            as: "vehicle",
          },
        },
        {
          $unwind: "$vehicle",
        },
        {
          $lookup: {
            from: "stations",
            localField: "vehicle.assignment.currentStation",
            foreignField: "_id",
            as: "station",
          },
        },
        {
          $unwind: "$station",
        },
        {
          $group: {
            _id: {
              stationId: "$station._id",
              stationName: "$station.stationInfo.name",
            },
            totalAssignments: { $sum: 1 },
            avgResponseTime: { $avg: "$performance.responseTime" },
            avgArrivalTime: { $avg: "$performance.arrivalTime" },
            completionRate: {
              $avg: {
                $cond: [{ $eq: ["$response.status", "completed"] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { totalAssignments: -1 },
        },
      ]);
    } catch (error) {
      console.error("Error generating station performance metrics:", error);
      throw error;
    }
  }

  /**
   * Real-time dashboard summary for emergency operations
   */
  static async getDashboardSummary() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const [
        activeIncidents,
        todayIncidents,
        availableVehicles,
        availableCrew,
        criticalIncidents,
      ] = await Promise.all([
        // Active incidents count
        Incident.countDocuments({
          "status.current": {
            $in: ["Assigned", "En Route", "On Scene", "Dispatched"],
          },
        }),

        // Today's incident statistics
        Incident.aggregate([
          {
            $match: {
              "timeline.reportedAt": { $gte: today, $lt: tomorrow },
            },
          },
          {
            $group: {
              _id: "$incident.type",
              count: { $sum: 1 },
              avgSeverity: { $avg: { $toInt: "$incident.severity" } },
            },
          },
        ]),

        // Available vehicle count
        Vehicle.countDocuments({
          "status.operational": "Available",
        }),

        // Available crew count
        Crew.countDocuments({
          "currentStatus.availability": "available",
        }),

        // Critical incidents
        Incident.countDocuments({
          "status.current": {
            $in: ["Assigned", "En Route", "On Scene", "Dispatched"],
          },
          "incident.severity": { $in: [4, 5] },
        }),
      ]);

      return {
        activeIncidents,
        todayIncidents,
        availableResources: {
          vehicles: availableVehicles,
          crew: availableCrew,
        },
        criticalIncidents,
        lastUpdated: now,
      };
    } catch (error) {
      console.error("Error generating dashboard summary:", error);
      throw error;
    }
  }

  /**
   * Database health check with performance metrics
   */
  static async performHealthCheck() {
    try {
      const start = Date.now();

      // Simple query to test database responsiveness
      await Incident.findOne().select("_id").lean();

      const responseTime = Date.now() - start;

      // Get collection statistics
      const stats = await Promise.all([
        Incident.estimatedDocumentCount(),
        Vehicle.estimatedDocumentCount(),
        Crew.estimatedDocumentCount(),
        Station.estimatedDocumentCount(),
        Assignment.estimatedDocumentCount(),
      ]);

      return {
        status: "healthy",
        responseTime,
        collections: {
          incidents: stats[0],
          vehicles: stats[1],
          crew: stats[2],
          stations: stats[3],
          assignments: stats[4],
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Database health check failed:", error);
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}

module.exports = DatabaseUtils;
