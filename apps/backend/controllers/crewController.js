const Crew = require("../models/Crew");
const Vehicle = require("../models/Vehicle");
const Assignment = require("../models/Assignment");

/**
 * @desc    Get crew member by employee ID
 * @route   GET /api/crews/by-employee/:employeeId
 * @access  Private (Field Crew)
 * @returns Crew profile with isLeader validation
 */
const getCrewByEmployeeId = async (req, res) => {
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
};

/**
 * @desc    Get crew member's active assignments
 * @route   GET /api/crews/:crewId/assignments
 * @access  Private (Field Crew)
 * @returns List of active assignments for the crew member
 */
const getCrewAssignments = async (req, res) => {
  try {
    const { crewId } = req.params;

    console.log(`📱 [CrewController] Fetching assignments for crew: ${crewId}`);

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
      "response.status": { $nin: ["completed", "cancelled"] }, // Exclude completed/cancelled
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
};

/**
 * @desc    Get crew member's assigned vehicle details
 * @route   GET /api/crews/:crewId/vehicle
 * @access  Private (Field Crew)
 * @returns Details of the vehicle assigned to the crew member
 */
const getCrewVehicle = async (req, res) => {
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
};

/**
 * @desc    Update crew member's GPS location
 * @route   PUT /api/crews/:crewId/location
 * @access  Private (Field Crew)
 * @returns Updated crew location
 */
const updateCrewLocation = async (req, res) => {
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
};

/**
 * @desc    Get available crew leaders for shift scheduling
 * @route   GET /api/crews/leaders/available
 * @access  Private (Supervisor, Admin)
 * @returns List of crew leaders who are available (not currently assigned)
 */
const getAvailableLeaders = async (req, res) => {
  try {
    console.log(`📱 [CrewController] Fetching available crew leaders`);

    // Find crew members who are leaders and not currently assigned to a vehicle
    const availableLeaders = await Crew.find({
      "professional.isLeader": true,
      "currentStatus.assignedVehicleId": null,
      "settings.isActive": true,
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
};

module.exports = {
  getCrewByEmployeeId,
  getCrewAssignments,
  getCrewVehicle,
  updateCrewLocation,
  getAvailableLeaders,
};
