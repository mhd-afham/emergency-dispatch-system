const Assignment = require("../models/Assignment");
const Incident = require("../models/Incident");
const Vehicle = require("../models/Vehicle");
const Crew = require("../models/Crew");

/**
 * Assignment History Controller
 * Handles fetching assignment history with search, filters, and statistics
 */
class AssignmentHistoryController {
  /**
   * Get assignment history with search and filters
   * GET /api/assignments/history
   */
  static async getAssignmentHistory(req, res) {
    try {
      const {
        search,
        assignmentId,
        incidentId,
        vehiclePlateNumber,
        crewLeaderName,
        status,
        priority,
        incidentType,
        vehicleType,
        dateFrom,
        dateTo,
        responseTimeMin,
        responseTimeMax,
        totalDurationMin,
        totalDurationMax,
        page = 1,
        limit = 20,
        sortBy = "dispatch.assignedAt",
        sortOrder = "desc",
      } = req.query;

      console.log("📊 Fetching assignment history with filters:", req.query);

      // Build query
      const query = {};

      // Only show completed, cancelled, declined, or returned assignments
      query["response.status"] = {
        $in: ["completed", "cancelled", "declined", "returned"],
      };

      // Search across multiple fields
      if (search) {
        const searchRegex = new RegExp(search, "i");
        const searchConditions = [
          { assignmentId: searchRegex },
          // Will search incident ID and crew name after population
        ];
        query.$or = searchConditions;
      }

      // Assignment ID filter
      if (assignmentId) {
        query.assignmentId = new RegExp(assignmentId, "i");
      }

      // Status filter (multi-select)
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        query["response.status"] = { $in: statusArray };
      }

      // Priority filter (multi-select)
      if (priority) {
        const priorityArray = Array.isArray(priority) ? priority : [priority];
        query["dispatch.priority"] = { $in: priorityArray };
      }

      // Date range filter
      if (dateFrom || dateTo) {
        query["dispatch.assignedAt"] = {};
        if (dateFrom) {
          query["dispatch.assignedAt"].$gte = new Date(dateFrom);
        }
        if (dateTo) {
          // Include the entire day
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          query["dispatch.assignedAt"].$lte = endDate;
        }
      }

      // Performance filters
      if (responseTimeMin !== undefined || responseTimeMax !== undefined) {
        query["performance.responseTime"] = {};
        if (responseTimeMin !== undefined) {
          query["performance.responseTime"].$gte = parseInt(responseTimeMin);
        }
        if (responseTimeMax !== undefined) {
          query["performance.responseTime"].$lte = parseInt(responseTimeMax);
        }
      }

      if (totalDurationMin !== undefined || totalDurationMax !== undefined) {
        query["performance.totalDuration"] = {};
        if (totalDurationMin !== undefined) {
          query["performance.totalDuration"].$gte = parseInt(totalDurationMin);
        }
        if (totalDurationMax !== undefined) {
          query["performance.totalDuration"].$lte = parseInt(totalDurationMax);
        }
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with population
      let assignments = await Assignment.find(query)
        .populate({
          path: "incident.incidentId",
          select:
            "incidentId incidentType incidentCategory severity description location",
        })
        .populate({
          path: "resource.vehicleId",
          select: "registration.plateNumber registration.vehicleType",
        })
        .populate({
          path: "resource.primaryCrewId",
          select: "personal.firstName personal.lastName employeeId",
        })
        .populate({
          path: "dispatch.assignedBy",
          select: "firstName lastName",
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Post-query filtering for fields that require population
      if (incidentId) {
        const incidentIdRegex = new RegExp(incidentId, "i");
        assignments = assignments.filter((a) =>
          a.incident?.incidentId?.incidentId?.match(incidentIdRegex)
        );
      }

      if (vehiclePlateNumber) {
        const plateRegex = new RegExp(vehiclePlateNumber, "i");
        assignments = assignments.filter((a) =>
          a.resource?.vehicleId?.registration?.plateNumber?.match(plateRegex)
        );
      }

      if (crewLeaderName) {
        const nameRegex = new RegExp(crewLeaderName, "i");
        assignments = assignments.filter((a) => {
          const crew = a.resource?.primaryCrewId;
          if (!crew) return false;
          const fullName = `${crew.personal?.firstName || ""} ${
            crew.personal?.lastName || ""
          }`;
          return fullName.match(nameRegex);
        });
      }

      if (incidentType) {
        const typeArray = Array.isArray(incidentType)
          ? incidentType
          : [incidentType];
        assignments = assignments.filter(
          (a) =>
            a.incident?.incidentId?.incidentType &&
            typeArray.includes(a.incident.incidentId.incidentType)
        );
      }

      if (vehicleType) {
        const vTypeArray = Array.isArray(vehicleType)
          ? vehicleType
          : [vehicleType];
        assignments = assignments.filter(
          (a) =>
            a.resource?.vehicleId?.registration?.vehicleType &&
            vTypeArray.includes(a.resource.vehicleId.registration.vehicleType)
        );
      }

      // Get total count for pagination (with same filters)
      const totalRecords = await Assignment.countDocuments(query);

      console.log(
        `✅ Found ${assignments.length} assignments (Total: ${totalRecords})`
      );

      res.status(200).json({
        success: true,
        data: {
          assignments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRecords / parseInt(limit)),
            totalRecords,
            limit: parseInt(limit),
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
   */
  static async getStatistics(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      console.log("📈 Calculating assignment statistics");

      // Build date filter
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter["dispatch.assignedAt"] = {};
        if (dateFrom) {
          dateFilter["dispatch.assignedAt"].$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          dateFilter["dispatch.assignedAt"].$lte = endDate;
        }
      }

      // Only include completed, cancelled, declined, returned assignments
      dateFilter["response.status"] = {
        $in: ["completed", "cancelled", "declined", "returned"],
      };

      // Get total assignments
      const totalAssignments = await Assignment.countDocuments(dateFilter);

      // Get assignments by status
      const byStatus = await Assignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$response.status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get assignments by priority
      const byPriority = await Assignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$dispatch.priority",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get assignments with populated incident data for type grouping
      const assignmentsWithIncidents = await Assignment.find(dateFilter)
        .populate("incident.incidentId", "incidentType")
        .lean();

      // Group by incident type
      const byIncidentType = {};
      assignmentsWithIncidents.forEach((assignment) => {
        const type = assignment.incident?.incidentId?.incidentType || "unknown";
        byIncidentType[type] = (byIncidentType[type] || 0) + 1;
      });

      // Get assignments with populated vehicle data for type grouping
      const assignmentsWithVehicles = await Assignment.find(dateFilter)
        .populate("resource.vehicleId", "registration.vehicleType")
        .lean();

      // Group by vehicle type
      const byVehicleType = {};
      assignmentsWithVehicles.forEach((assignment) => {
        const type =
          assignment.resource?.vehicleId?.registration?.vehicleType ||
          "unknown";
        byVehicleType[type] = (byVehicleType[type] || 0) + 1;
      });

      // Get performance metrics (only for completed assignments)
      const performanceFilter = {
        ...dateFilter,
        "response.status": "completed",
      };

      const performanceStats = await Assignment.aggregate([
        { $match: performanceFilter },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$performance.responseTime" },
            avgArrivalTime: { $avg: "$performance.arrivalTime" },
            avgOnSceneTime: { $avg: "$performance.onSceneTime" },
            avgTotalDuration: { $avg: "$performance.totalDuration" },
            minResponseTime: { $min: "$performance.responseTime" },
            maxResponseTime: { $max: "$performance.responseTime" },
          },
        },
      ]);

      // Calculate resolution rate
      const completedCount =
        byStatus.find((s) => s._id === "completed")?.count || 0;
      const resolutionRate =
        totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0;

      // Get daily trends
      const dailyTrends = await Assignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$dispatch.assignedAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      // Get hourly distribution
      const hourlyDistribution = await Assignment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $hour: "$dispatch.assignedAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            hour: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      // Format results
      const statusMap = {};
      byStatus.forEach((item) => {
        statusMap[item._id] = item.count;
      });

      const priorityMap = {};
      byPriority.forEach((item) => {
        priorityMap[item._id] = item.count;
      });

      console.log("✅ Statistics calculated successfully");

      res.status(200).json({
        success: true,
        data: {
          totalAssignments,
          byStatus: statusMap,
          byPriority: priorityMap,
          byIncidentType,
          byVehicleType,
          performance: performanceStats[0] || {
            avgResponseTime: null,
            avgArrivalTime: null,
            avgOnSceneTime: null,
            avgTotalDuration: null,
            minResponseTime: null,
            maxResponseTime: null,
          },
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          dailyTrends,
          hourlyDistribution,
        },
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

module.exports = AssignmentHistoryController;
