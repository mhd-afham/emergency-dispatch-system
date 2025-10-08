const express = require("express");
const router = express.Router();
const Crew = require("../models/Crew");
const { authenticate, authorize } = require("../middleware/auth");

// @route   GET /api/crew
// @desc    Get all crew members with optional filtering
// @access  Private (Supervisor, Admin)
router.get("/", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const {
      role,
      certificationLevel,
      availability,
      isActive,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let query = {};

    // Build query based on filters
    if (role) {
      query["professional.role"] = role;
    }

    if (certificationLevel) {
      query["professional.certificationLevel"] = certificationLevel;
    }

    if (availability) {
      query["currentStatus.availability"] = availability;
    }

    if (isActive !== undefined) {
      query["settings.isActive"] = isActive === "true";
    }

    if (search) {
      query.$or = [
        { "personal.firstName": { $regex: search, $options: "i" } },
        { "personal.lastName": { $regex: search, $options: "i" } },
        { "personal.email": { $regex: search, $options: "i" } },
        { "personal.employeeId": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const crew = await Crew.find(query)
      .select("personal professional currentStatus settings")
      .sort({ "personal.lastName": 1, "personal.firstName": 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Crew.countDocuments(query);

    res.json({
      success: true,
      data: crew,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching crew:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching crew members",
      error: error.message,
    });
  }
});

// @route   GET /api/crew/available
// @desc    Get available crew members for shift assignment
// @access  Private (Supervisor, Admin)
router.get("/available", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const { date, startTime, endTime, role, certificationLevel } = req.query;

    let query = {
      "settings.isActive": true,
      "currentStatus.availability": { $in: ["available", "off_duty"] },
      "professional.certifications": {
        $elemMatch: {
          isActive: true,
          expiryDate: { $gt: new Date() },
        },
      },
    };

    if (role) {
      query["professional.role"] = role;
    }

    if (certificationLevel) {
      const certLevels = ["Basic", "Intermediate", "Advanced", "Expert"];
      const minIndex = certLevels.indexOf(certificationLevel);
      const allowedLevels = certLevels.slice(minIndex);
      query["professional.certificationLevel"] = { $in: allowedLevels };
    }

    // If date and time are provided, check for conflicts
    if (date && startTime && endTime) {
      const Shift = require("../models/Shift");
      
      const conflictingShifts = await Shift.find({
        "schedule.date": new Date(date),
        "status.current": { $in: ["planned", "active"] },
        $or: [
          {
            $and: [
              { "schedule.startTime": { $lte: startTime } },
              { "schedule.endTime": { $gte: startTime } },
            ],
          },
          {
            $and: [
              { "schedule.startTime": { $lte: endTime } },
              { "schedule.endTime": { $gte: endTime } },
            ],
          },
          {
            $and: [
              { "schedule.startTime": { $gte: startTime } },
              { "schedule.endTime": { $lte: endTime } },
            ],
          },
        ],
      });

      const conflictingCrewIds = [];
      conflictingShifts.forEach(shift => {
        shift.staffing.assignedCrew.forEach(crew => {
          conflictingCrewIds.push(crew.crewId.toString());
        });
      });

      if (conflictingCrewIds.length > 0) {
        query._id = { $nin: conflictingCrewIds };
      }
    }

    const availableCrew = await Crew.find(query)
      .select("personal professional currentStatus")
      .sort({ "personal.lastName": 1, "personal.firstName": 1 });

    // Group by role
    const crewByRole = {};
    const roles = ["EMT", "Paramedic", "Firefighter", "Driver", "Supervisor"];
    
    roles.forEach(role => {
      crewByRole[role] = availableCrew.filter(crew => crew.professional.role === role);
    });

    res.json({
      success: true,
      data: {
        availableCrew,
        crewByRole,
        totalAvailable: availableCrew.length,
      },
    });
  } catch (error) {
    console.error("Error fetching available crew:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available crew",
      error: error.message,
    });
  }
});

// @route   GET /api/crew/:id
// @desc    Get a specific crew member by ID
// @access  Private
router.get("/:id", authenticate, async (req, res) => {
  try {
    const crew = await Crew.findById(req.params.id)
      .populate("currentStatus.shiftId", "shift schedule status")
      .populate("audit.createdBy", "firstName lastName");

    if (!crew) {
      return res.status(404).json({
        success: false,
        message: "Crew member not found",
      });
    }

    res.json({
      success: true,
      data: crew,
    });
  } catch (error) {
    console.error("Error fetching crew member:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching crew member",
      error: error.message,
    });
  }
});

// @route   PUT /api/crew/:id/availability
// @desc    Update crew member availability status
// @access  Private (Supervisor, Admin)
router.put("/:id/availability", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: "Availability status is required",
      });
    }

    const validStatuses = ["available", "on_duty", "off_duty", "on_leave", "training"];
    if (!validStatuses.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: `Invalid availability status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const crew = await Crew.findByIdAndUpdate(
      req.params.id,
      { 
        "currentStatus.availability": availability,
        "audit.updatedAt": new Date(),
      },
      { new: true }
    ).select("personal professional currentStatus");

    if (!crew) {
      return res.status(404).json({
        success: false,
        message: "Crew member not found",
      });
    }

    res.json({
      success: true,
      message: "Crew availability updated successfully",
      data: crew,
    });
  } catch (error) {
    console.error("Error updating crew availability:", error);
    res.status(500).json({
      success: false,
      message: "Error updating crew availability",
      error: error.message,
    });
  }
});

// @route   GET /api/crew/statistics/overview
// @desc    Get crew statistics overview
// @access  Private (Supervisor, Admin)
router.get("/statistics/overview", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const totalCrew = await Crew.countDocuments({ "settings.isActive": true });
    
    const availabilityStats = await Crew.aggregate([
      { $match: { "settings.isActive": true } },
      { $group: { _id: "$currentStatus.availability", count: { $sum: 1 } } }
    ]);

    const roleStats = await Crew.aggregate([
      { $match: { "settings.isActive": true } },
      { $group: { _id: "$professional.role", count: { $sum: 1 } } }
    ]);

    const certificationStats = await Crew.aggregate([
      { $match: { "settings.isActive": true } },
      { $group: { _id: "$professional.certificationLevel", count: { $sum: 1 } } }
    ]);

    // Get crew with expiring certifications
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 30);

    const expiringCertifications = await Crew.find({
      "settings.isActive": true,
      "professional.certifications": {
        $elemMatch: {
          isActive: true,
          expiryDate: { $lte: expiringDate, $gt: new Date() },
        },
      },
    }).countDocuments();

    res.json({
      success: true,
      data: {
        totalCrew,
        availabilityStats: availabilityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        roleStats: roleStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        certificationStats: certificationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        expiringCertifications,
      },
    });
  } catch (error) {
    console.error("Error fetching crew statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching crew statistics",
      error: error.message,
    });
  }
});

module.exports = router;