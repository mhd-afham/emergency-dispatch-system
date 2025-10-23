const express = require("express");
const router = express.Router();
const Shift = require("../models/Shift");
const Crew = require("../models/Crew");
const User = require("../models/User");
const Station = require("../models/Station");
const { authenticate, authorize } = require("../middleware/auth");

// @route   GET /api/shifts
// @desc    Get all shifts with optional filtering
// @access  Private (Supervisor, Admin)
router.get("/", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const {
      date,
      startDate,
      endDate,
      status,
      stationId,
      supervisorId,
      type,
      page = 1,
      limit = 50,
    } = req.query;

    let query = {};

    // Build query based on filters
    if (date) {
      const queryDate = new Date(date);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query["schedule.date"] = {
        $gte: queryDate,
        $lt: nextDay,
      };
    }

    if (startDate && endDate) {
      query["schedule.date"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      query["status.current"] = status;
    }

    if (stationId) {
      query.stationId = stationId;
    }

    if (supervisorId) {
      query["supervision.supervisorId"] = supervisorId;
    }

    if (type) {
      query["shift.type"] = type;
    }

    const skip = (page - 1) * limit;

    const shifts = await Shift.find(query)
      .populate("stationId", "stationName address province stationType")
      .populate("supervision.supervisorId", "firstName lastName email")
      .populate("staffing.assignedCrew.crewId", "personal professional currentStatus")
      .populate("staffing.vehicleAssignments.vehicleId", "registration specifications")
      .sort({ "schedule.date": 1, "schedule.startTime": 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Shift.countDocuments(query);

    res.json({
      success: true,
      data: shifts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching shifts",
      error: error.message,
    });
  }
});

// @route   GET /api/shifts/:id
// @desc    Get a specific shift by ID
// @access  Private (Supervisor, Admin)
router.get("/:id", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate("stationId", "stationName address province stationType")
      .populate("supervision.supervisorId", "firstName lastName email")
      .populate("supervision.backupSupervisorId", "firstName lastName email")
      .populate("staffing.assignedCrew.crewId", "personal professional currentStatus")
      .populate("staffing.vehicleAssignments.vehicleId", "registration specifications")
      .populate("audit.createdBy", "firstName lastName");

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    res.json({
      success: true,
      data: shift,
    });
  } catch (error) {
    console.error("Error fetching shift:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching shift",
      error: error.message,
    });
  }
});

// @route   POST /api/shifts
// @desc    Create a new shift
// @access  Private (Supervisor, Admin)
router.post("/", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const {
      name,
      type = "regular",
      date,
      startTime,
      endTime,
      requiredCrewCount,
      requiredRoles = [],
      minimumCertificationLevel = "Basic",
      stationId,
      supervisorNotes,
      recurrence = "none",
    } = req.body;

    // Validation
    if (!name || !date || !startTime || !endTime || !requiredCrewCount || !stationId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, date, startTime, endTime, requiredCrewCount, stationId",
      });
    }

    // Calculate duration
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    let duration = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (duration < 0) duration += 24 * 60; // Handle overnight shifts
    duration = Math.round((duration / 60) * 100) / 100;

    // Check for overlapping shifts for the same station
    const overlappingShifts = await Shift.find({
      stationId: stationId,
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

    if (overlappingShifts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "There is already a shift scheduled for this time slot at this station",
        overlappingShifts: overlappingShifts.map(shift => ({
          id: shift._id,
          name: shift.shift.name,
          startTime: shift.schedule.startTime,
          endTime: shift.schedule.endTime,
        })),
      });
    }

    const shift = new Shift({
      shift: {
        name,
        type,
      },
      schedule: {
        date: new Date(date),
        startTime,
        endTime,
        duration,
        recurrence,
      },
      staffing: {
        requiredCrewCount: parseInt(requiredCrewCount),
        requiredRoles,
        minimumCertificationLevel,
        assignedCrew: [],
        vehicleAssignments: [],
      },
      supervision: {
        supervisorId: req.user.id,
        supervisorNotes,
      },
      stationId: stationId,
      status: {
        current: "planned",
      },
      audit: {
        createdBy: req.user.id,
      },
    });

    await shift.save();

    // Populate the created shift for response
    await shift.populate("stationId", "stationName address province stationType");
    await shift.populate("supervision.supervisorId", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: shift,
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    res.status(500).json({
      success: false,
      message: "Error creating shift",
      error: error.message,
    });
  }
});

// @route   PUT /api/shifts/:id
// @desc    Update a shift
// @access  Private (Supervisor, Admin)
router.put("/:id", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Don't allow updates to active or completed shifts unless it's status or notes
    if (shift.status.current === "active" || shift.status.current === "completed") {
      const allowedFields = ["supervisorNotes", "status", "metrics"];
      const updateFields = Object.keys(req.body);
      const hasDisallowedFields = updateFields.some(field => !allowedFields.includes(field));
      
      if (hasDisallowedFields) {
        return res.status(400).json({
          success: false,
          message: "Cannot modify active or completed shifts except for notes, status, and metrics",
        });
      }
    }

    // Update fields
    const allowedUpdates = [
      "shift.name",
      "shift.type", 
      "schedule.startTime",
      "schedule.endTime",
      "schedule.recurrence",
      "staffing.requiredCrewCount",
      "staffing.requiredRoles",
      "staffing.minimumCertificationLevel",
      "supervision.supervisorNotes",
      "supervision.backupSupervisorId",
      "status.current",
      "status.cancelledReason",
    ];

    // Handle nested updates
    if (req.body.shift) {
      if (req.body.shift.name !== undefined) shift.shift.name = req.body.shift.name;
      if (req.body.shift.type !== undefined) shift.shift.type = req.body.shift.type;
    }

    if (req.body.schedule) {
      if (req.body.schedule.startTime !== undefined) shift.schedule.startTime = req.body.schedule.startTime;
      if (req.body.schedule.endTime !== undefined) shift.schedule.endTime = req.body.schedule.endTime;
      if (req.body.schedule.recurrence !== undefined) shift.schedule.recurrence = req.body.schedule.recurrence;
      
      // Recalculate duration if times changed
      if (req.body.schedule.startTime || req.body.schedule.endTime) {
        const [startHour, startMin] = shift.schedule.startTime.split(":").map(Number);
        const [endHour, endMin] = shift.schedule.endTime.split(":").map(Number);
        let duration = endHour * 60 + endMin - (startHour * 60 + startMin);
        if (duration < 0) duration += 24 * 60;
        shift.schedule.duration = Math.round((duration / 60) * 100) / 100;
      }
    }

    if (req.body.staffing) {
      if (req.body.staffing.requiredCrewCount !== undefined) {
        shift.staffing.requiredCrewCount = req.body.staffing.requiredCrewCount;
      }
      if (req.body.staffing.requiredRoles !== undefined) {
        shift.staffing.requiredRoles = req.body.staffing.requiredRoles;
      }
      if (req.body.staffing.minimumCertificationLevel !== undefined) {
        shift.staffing.minimumCertificationLevel = req.body.staffing.minimumCertificationLevel;
      }
    }

    if (req.body.supervision) {
      if (req.body.supervision.supervisorNotes !== undefined) {
        shift.supervision.supervisorNotes = req.body.supervision.supervisorNotes;
      }
      if (req.body.supervision.backupSupervisorId !== undefined) {
        shift.supervision.backupSupervisorId = req.body.supervision.backupSupervisorId;
      }
    }

    if (req.body.status) {
      if (req.body.status.current !== undefined) {
        shift.status.current = req.body.status.current;
        
        // Set timestamps based on status
        if (req.body.status.current === "active" && !shift.status.actualStartTime) {
          shift.status.actualStartTime = new Date();
        } else if (req.body.status.current === "completed" && !shift.status.actualEndTime) {
          shift.status.actualEndTime = new Date();
        }
      }
      if (req.body.status.cancelledReason !== undefined) {
        shift.status.cancelledReason = req.body.status.cancelledReason;
      }
    }

    await shift.save();

    // Populate for response
    await shift.populate("stationId", "stationName address province stationType");
    await shift.populate("supervision.supervisorId", "firstName lastName email");
    await shift.populate("staffing.assignedCrew.crewId", "personal professional");

    res.json({
      success: true,
      message: "Shift updated successfully",
      data: shift,
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    res.status(500).json({
      success: false,
      message: "Error updating shift",
      error: error.message,
    });
  }
});

// @route   DELETE /api/shifts/:id
// @desc    Delete a shift (only if not active or completed)
// @access  Private (Supervisor, Admin)
router.delete("/:id", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Don't allow deletion of active or completed shifts
    if (shift.status.current === "active" || shift.status.current === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete active or completed shifts. Cancel the shift instead.",
      });
    }

    // If the shift has assigned crew, we should notify them (implement notification later)
    if (shift.staffing.assignedCrew.length > 0) {
      // TODO: Send notifications to assigned crew about shift cancellation
      console.log(`Shift ${shift._id} with ${shift.staffing.assignedCrew.length} assigned crew members is being deleted`);
    }

    await Shift.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Shift deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shift:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting shift",
      error: error.message,
    });
  }
});

// @route   GET /api/shifts/available-crew/:shiftId
// @desc    Get available crew members for a specific shift
// @access  Private (Supervisor, Admin)
router.get("/available-crew/:shiftId", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.shiftId);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    const shiftDate = new Date(shift.schedule.date);
    const shiftStart = shift.schedule.startTime;
    const shiftEnd = shift.schedule.endTime;

    // Find crew members that are:
    // 1. Active and available
    // 2. Not already assigned to this shift
    // 3. Meet minimum certification requirements
    // 4. Don't have conflicting shifts on the same date

    const alreadyAssignedIds = shift.staffing.assignedCrew.map(crew => crew.crewId);

    // Find conflicting shifts
    const conflictingShifts = await Shift.find({
      "schedule.date": shiftDate,
      "status.current": { $in: ["planned", "active"] },
      _id: { $ne: shift._id },
    });

    const conflictingCrewIds = [];
    conflictingShifts.forEach(conflictShift => {
      // Check time overlap
      const conflictStart = conflictShift.schedule.startTime;
      const conflictEnd = conflictShift.schedule.endTime;
      
      if (
        (shiftStart <= conflictStart && shiftEnd >= conflictStart) ||
        (shiftStart <= conflictEnd && shiftEnd >= conflictEnd) ||
        (shiftStart >= conflictStart && shiftEnd <= conflictEnd)
      ) {
        conflictShift.staffing.assignedCrew.forEach(crew => {
          conflictingCrewIds.push(crew.crewId.toString());
        });
      }
    });

    let query = {
      "settings.isActive": true,
      "currentStatus.availability": { $in: ["available", "off_duty"] },
      _id: { 
        $nin: [...alreadyAssignedIds, ...conflictingCrewIds.map(id => id.toString())]
      },
    };

    // Filter by certification level if required
    if (shift.staffing.minimumCertificationLevel && shift.staffing.minimumCertificationLevel !== "Basic") {
      const certLevels = ["Basic", "Intermediate", "Advanced", "Expert"];
      const minIndex = certLevels.indexOf(shift.staffing.minimumCertificationLevel);
      const allowedLevels = certLevels.slice(minIndex);
      
      query["professional.certificationLevel"] = { $in: allowedLevels };
    }

    // Add active certification requirement
    query["professional.certifications"] = {
      $elemMatch: {
        isActive: true,
        expiryDate: { $gt: new Date() },
      },
    };

    const availableCrew = await Crew.find(query)
      .select("personal professional currentStatus")
      .sort({ "personal.lastName": 1, "personal.firstName": 1 });

    // Group by role if required roles are specified
    let crewByRole = {};
    if (shift.staffing.requiredRoles && shift.staffing.requiredRoles.length > 0) {
      shift.staffing.requiredRoles.forEach(role => {
        crewByRole[role] = availableCrew.filter(crew => crew.professional.role === role);
      });
    }

    res.json({
      success: true,
      data: {
        availableCrew,
        crewByRole,
        shiftInfo: {
          id: shift._id,
          name: shift.shift.name,
          date: shift.schedule.date,
          startTime: shift.schedule.startTime,
          endTime: shift.schedule.endTime,
          requiredCrewCount: shift.staffing.requiredCrewCount,
          requiredRoles: shift.staffing.requiredRoles,
          currentlyAssigned: shift.staffing.assignedCrew.length,
        },
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

// @route   POST /api/shifts/:id/assign-crew
// @desc    Assign crew members to a shift
// @access  Private (Supervisor, Admin)
router.post("/:id/assign-crew", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const { crewAssignments } = req.body;

    if (!crewAssignments || !Array.isArray(crewAssignments)) {
      return res.status(400).json({
        success: false,
        message: "crewAssignments array is required",
      });
    }

    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Validate crew members exist and are available
    const crewIds = crewAssignments.map(assignment => assignment.crewId);
    const crewMembers = await Crew.find({ _id: { $in: crewIds } });

    if (crewMembers.length !== crewIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more crew members not found",
      });
    }

    // Check if adding these crew members would exceed required count
    const currentAssignedCount = shift.staffing.assignedCrew.length;
    const newAssignmentsCount = crewAssignments.length;
    
    if (currentAssignedCount + newAssignmentsCount > shift.staffing.requiredCrewCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign ${newAssignmentsCount} crew members. Shift only needs ${shift.staffing.requiredCrewCount - currentAssignedCount} more crew members.`,
      });
    }

    // Check for conflicts (crew already assigned to this shift)
    const alreadyAssignedIds = shift.staffing.assignedCrew.map(crew => crew.crewId.toString());
    const duplicateAssignments = crewAssignments.filter(assignment => 
      alreadyAssignedIds.includes(assignment.crewId)
    );

    if (duplicateAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more crew members are already assigned to this shift",
        duplicateAssignments,
      });
    }

    // Check for time conflicts with other shifts
    const shiftDate = new Date(shift.schedule.date);
    const conflictingShifts = await Shift.find({
      "schedule.date": shiftDate,
      "status.current": { $in: ["planned", "active"] },
      _id: { $ne: shift._id },
      "staffing.assignedCrew.crewId": { $in: crewIds },
    });

    if (conflictingShifts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more crew members have conflicting shift assignments",
        conflictingShifts: conflictingShifts.map(conflictShift => ({
          shiftId: conflictShift._id,
          shiftName: conflictShift.shift.name,
          startTime: conflictShift.schedule.startTime,
          endTime: conflictShift.schedule.endTime,
        })),
      });
    }

    // Add crew assignments
    const newAssignments = crewAssignments.map(assignment => ({
      crewId: assignment.crewId,
      role: assignment.role,
      assignedAt: new Date(),
      status: "assigned",
      assignedBy: req.user.id,
    }));

    shift.staffing.assignedCrew.push(...newAssignments);
    await shift.save();

    // Update crew status if needed
    await Crew.updateMany(
      { _id: { $in: crewIds } },
      { 
        "currentStatus.shiftId": shift._id,
        "currentStatus.availability": "on_duty"
      }
    );

    // Populate for response with full details
    await shift.populate("stationId", "stationName address province stationType");
    await shift.populate("supervision.supervisorId", "firstName lastName email");
    await shift.populate("staffing.assignedCrew.crewId", "personal professional currentStatus");

    res.json({
      success: true,
      message: `Successfully assigned ${newAssignments.length} crew members to shift`,
      data: shift,
      meta: {
        newAssignments: newAssignments.length,
        totalAssigned: shift.staffing.assignedCrew.length,
        remainingNeeded: shift.staffing.requiredCrewCount - shift.staffing.assignedCrew.length,
      },
    });
  } catch (error) {
    console.error("Error assigning crew to shift:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning crew to shift",
      error: error.message,
    });
  }
});

// @route   DELETE /api/shifts/:id/remove-crew/:crewId
// @desc    Remove a crew member from a shift
// @access  Private (Supervisor, Admin)
router.delete("/:id/remove-crew/:crewId", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    const crewIndex = shift.staffing.assignedCrew.findIndex(
      crew => crew.crewId.toString() === req.params.crewId
    );

    if (crewIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Crew member not assigned to this shift",
      });
    }

    // Remove crew member from shift
    const removedCrew = shift.staffing.assignedCrew[crewIndex];
    shift.staffing.assignedCrew.splice(crewIndex, 1);
    await shift.save();

    // Update crew status
    await Crew.findByIdAndUpdate(req.params.crewId, {
      "currentStatus.shiftId": null,
      "currentStatus.availability": "available"
    });

    res.json({
      success: true,
      message: "Crew member removed from shift successfully",
      data: {
        removedCrew,
        remainingAssigned: shift.staffing.assignedCrew.length,
        stillNeeded: shift.staffing.requiredCrewCount - shift.staffing.assignedCrew.length,
      },
    });
  } catch (error) {
    console.error("Error removing crew from shift:", error);
    res.status(500).json({
      success: false,
      message: "Error removing crew from shift",
      error: error.message,
    });
  }
});

// @route   GET /api/shifts/calendar/:year/:month
// @desc    Get shifts for calendar view
// @access  Private (Supervisor, Admin)
router.get("/calendar", authenticate, authorize("Supervisor", "Admin"), async (req, res) => {
  try {
    const { year, month } = req.params;
    const { stationId } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let query = {
      "schedule.date": {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (stationId) {
      query.stationId = stationId;
    }

    const shifts = await Shift.find(query)
      .populate("stationId", "stationName")
      .populate("supervision.supervisorId", "firstName lastName")
      .select("shift schedule staffing status stationId supervision")
      .sort({ "schedule.date": 1, "schedule.startTime": 1 });

    // Group shifts by date for easier calendar rendering
    const shiftsByDate = {};
    shifts.forEach(shift => {
      const dateKey = shift.schedule.date.toISOString().split('T')[0];
      if (!shiftsByDate[dateKey]) {
        shiftsByDate[dateKey] = [];
      }
      shiftsByDate[dateKey].push({
        id: shift._id,
        name: shift.shift.name,
        type: shift.shift.type,
        startTime: shift.schedule.startTime,
        endTime: shift.schedule.endTime,
        status: shift.status.current,
        staffingPercentage: shift.staffingPercentage,
        assignedCount: shift.staffing.assignedCrew.length,
        requiredCount: shift.staffing.requiredCrewCount,
        station: shift.stationId?.name,
        supervisor: shift.supervision.supervisorId ? 
          `${shift.supervision.supervisorId.firstName} ${shift.supervision.supervisorId.lastName}` : null,
      });
    });

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        shifts: shiftsByDate,
        totalShifts: shifts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching calendar shifts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching calendar shifts",
      error: error.message,
    });
  }
});

module.exports = router;