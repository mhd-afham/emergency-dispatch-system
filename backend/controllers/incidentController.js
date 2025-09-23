const Incident = require("../models/Incident");
const User = require("../models/User");

// Helper function to extract coordinates from address using a mock geocoding service
// In production, this would integrate with Google Maps Geocoding API
const geocodeAddress = async (address) => {
  // Mock geocoding for demonstration - in production use Google Maps API
  // For now, return coordinates for Colombo area as default
  const defaultCoordinates = [79.8612, 6.9271]; // Colombo, Sri Lanka
  
  // Simple address matching for demo purposes
  const addressLower = address.toLowerCase();
  
  if (addressLower.includes("kandy")) {
    return [80.6337, 7.2906];
  } else if (addressLower.includes("galle")) {
    return [80.2170, 6.0535];
  } else if (addressLower.includes("negombo")) {
    return [79.8358, 7.2083];
  } else if (addressLower.includes("jaffna")) {
    return [80.0074, 9.6615];
  }
  
  return defaultCoordinates;
};

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private (Call Takers, Dispatchers)
const createIncident = async (req, res) => {
  try {
    const {
      caller,
      classification,
      location,
      details,
      source = "Web",
    } = req.body;

    // Validate required fields
    if (!caller?.phone || !classification?.type || !classification?.severity || 
        !location?.address?.fullAddress || !details?.description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: caller phone, classification, location, and description",
      });
    }

    // Geocode the address to get coordinates
    let coordinates = location.coordinates?.coordinates;
    if (!coordinates || coordinates.length !== 2) {
      coordinates = await geocodeAddress(location.address.fullAddress);
    }

    // Create the incident object
    const incidentData = {
      caller: {
        name: caller.name?.trim(),
        phone: caller.phone.trim(),
        email: caller.email?.trim(),
        isCallback: caller.isCallback || false,
      },
      classification: {
        type: classification.type,
        subType: classification.subType?.trim(),
        severity: classification.severity,
        priority: classification.priority || 3,
      },
      location: {
        address: {
          street: location.address.street?.trim(),
          city: location.address.city?.trim(),
          district: location.address.district?.trim(),
          postalCode: location.address.postalCode?.trim(),
          fullAddress: location.address.fullAddress.trim(),
        },
        coordinates: {
          type: "Point",
          coordinates: coordinates,
        },
        accuracy: location.accuracy || 50,
        isVerified: location.isVerified || false,
        verificationMethod: location.verificationMethod || "Address",
      },
      details: {
        description: details.description.trim(),
        additionalInfo: details.additionalInfo?.trim(),
        hazards: details.hazards || [],
        accessNotes: details.accessNotes?.trim(),
        landmarksNearby: details.landmarksNearby || [],
      },
      audit: {
        createdBy: req.user.id,
        source: source,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    };

    // Check for potential duplicates before creating
    const nearbyIncidents = await Incident.findNearbyIncidents(
      coordinates,
      1000, // 1km radius
      30    // 30 minutes
    );

    let duplicateWarnings = [];
    for (const nearbyIncident of nearbyIncidents) {
      // Create a temporary incident object to calculate duplicate score
      const tempIncident = new Incident(incidentData);
      const score = tempIncident.calculateDuplicateScore(nearbyIncident);
      
      if (score > 0.6) { // High similarity threshold
        duplicateWarnings.push({
          incidentId: nearbyIncident.incidentId,
          score: score,
          distance: tempIncident.getDistanceTo(nearbyIncident),
          timeDiff: Math.abs(new Date() - nearbyIncident.audit.createdAt) / (1000 * 60), // minutes
          type: nearbyIncident.classification.type,
          severity: nearbyIncident.classification.severity,
        });
      }
    }

    // Create the incident
    const incident = await Incident.create(incidentData);

    // Populate references for response
    await incident.populate([
      { path: "audit.createdBy", select: "personal.firstName personal.lastName auth.role" }
    ]);

    res.status(201).json({
      success: true,
      message: "Incident created successfully",
      data: {
        incident: incident,
        duplicateWarnings: duplicateWarnings,
      },
    });

  } catch (error) {
    console.error("Create incident error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating incident",
    });
  }
};

// @desc    Get all incidents with filtering and pagination
// @route   GET /api/incidents
// @access  Private (All authenticated users)
const getIncidents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      severity,
      startDate,
      endDate,
      search,
      sortBy = "audit.createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) {
      filter["status.current"] = status;
    }

    if (type) {
      filter["classification.type"] = type;
    }

    if (severity) {
      filter["classification.severity"] = severity;
    }

    if (startDate || endDate) {
      filter["audit.createdAt"] = {};
      if (startDate) {
        filter["audit.createdAt"].$gte = new Date(startDate);
      }
      if (endDate) {
        filter["audit.createdAt"].$lte = new Date(endDate);
      }
    }

    if (search) {
      filter.$or = [
        { incidentId: { $regex: search, $options: "i" } },
        { "caller.name": { $regex: search, $options: "i" } },
        { "caller.phone": { $regex: search, $options: "i" } },
        { "details.description": { $regex: search, $options: "i" } },
        { "location.address.fullAddress": { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
      populate: [
        { path: "audit.createdBy", select: "personal.firstName personal.lastName auth.role" },
        { path: "audit.updatedBy", select: "personal.firstName personal.lastName auth.role" },
        { path: "dispatch.dispatchedBy", select: "personal.firstName personal.lastName auth.role" },
      ],
    };

    const incidents = await Incident.find(filter)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();

    const totalIncidents = await Incident.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: incidents.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalIncidents / limit),
        totalIncidents: totalIncidents,
        hasNextPage: page * limit < totalIncidents,
        hasPrevPage: page > 1,
      },
      data: incidents,
    });

  } catch (error) {
    console.error("Get incidents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving incidents",
    });
  }
};

// @desc    Get incident by ID
// @route   GET /api/incidents/:id
// @access  Private (All authenticated users)
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate([
        { path: "audit.createdBy", select: "personal.firstName personal.lastName auth.role" },
        { path: "audit.updatedBy", select: "personal.firstName personal.lastName auth.role" },
        { path: "dispatch.dispatchedBy", select: "personal.firstName personal.lastName auth.role" },
        { path: "duplicateInfo.originalIncident", select: "incidentId classification status" },
        { path: "duplicateInfo.relatedIncidents", select: "incidentId classification status" },
      ]);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
    });

  } catch (error) {
    console.error("Get incident by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving incident",
    });
  }
};

// @desc    Update incident
// @route   PUT /api/incidents/:id
// @access  Private (Call Takers, Dispatchers, Supervisors)
const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    // Check if incident is already completed or cancelled
    if (["Completed", "Cancelled"].includes(incident.status.current)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update completed or cancelled incident",
      });
    }

    // Extract updateable fields
    const {
      caller,
      classification,
      location,
      details,
      status,
    } = req.body;

    // Update fields if provided
    if (caller) {
      incident.caller = { ...incident.caller, ...caller };
    }

    if (classification) {
      incident.classification = { ...incident.classification, ...classification };
    }

    if (location) {
      if (location.address) {
        incident.location.address = { ...incident.location.address, ...location.address };
      }
      if (location.coordinates) {
        incident.location.coordinates = location.coordinates;
      }
      if (location.accuracy !== undefined) {
        incident.location.accuracy = location.accuracy;
      }
      if (location.isVerified !== undefined) {
        incident.location.isVerified = location.isVerified;
      }
    }

    if (details) {
      incident.details = { ...incident.details, ...details };
    }

    if (status && status !== incident.status.current) {
      incident.status.current = status;
    }

    // Update audit information
    incident.audit.updatedBy = req.user.id;
    incident.audit.updatedAt = new Date();

    await incident.save();

    // Populate references for response
    await incident.populate([
      { path: "audit.createdBy", select: "personal.firstName personal.lastName auth.role" },
      { path: "audit.updatedBy", select: "personal.firstName personal.lastName auth.role" },
    ]);

    res.status(200).json({
      success: true,
      message: "Incident updated successfully",
      data: incident,
    });

  } catch (error) {
    console.error("Update incident error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating incident",
    });
  }
};

// @desc    Merge duplicate incidents
// @route   POST /api/incidents/:id/merge
// @access  Private (Call Takers, Dispatchers, Supervisors)
const mergeIncidents = async (req, res) => {
  try {
    const { originalIncidentId } = req.body;

    if (!originalIncidentId) {
      return res.status(400).json({
        success: false,
        message: "Original incident ID is required",
      });
    }

    const duplicateIncident = await Incident.findById(req.params.id);
    const originalIncident = await Incident.findById(originalIncidentId);

    if (!duplicateIncident || !originalIncident) {
      return res.status(404).json({
        success: false,
        message: "One or both incidents not found",
      });
    }

    if (duplicateIncident._id.equals(originalIncident._id)) {
      return res.status(400).json({
        success: false,
        message: "Cannot merge incident with itself",
      });
    }

    // Perform the merge
    await duplicateIncident.mergeWith(originalIncident);

    res.status(200).json({
      success: true,
      message: "Incidents merged successfully",
      data: {
        originalIncident: originalIncident,
        mergedIncident: duplicateIncident,
      },
    });

  } catch (error) {
    console.error("Merge incidents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error merging incidents",
    });
  }
};

// @desc    Get incident statistics
// @route   GET /api/incidents/stats
// @access  Private (Dispatchers, Supervisors, Admins)
const getIncidentStats = async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
    } = req.query;

    const stats = await Incident.getStatistics(new Date(startDate), new Date(endDate));

    // Get current active incidents
    const activeIncidents = await Incident.countDocuments({
      "status.current": { $nin: ["Completed", "Cancelled"] },
    });

    // Get incidents by hour for the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyStats = await Incident.aggregate([
      {
        $match: {
          "audit.createdAt": { $gte: last24Hours },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$audit.createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.hour": 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalIncidents: 0,
          avgResponseTime: 0,
          avgResolutionTime: 0,
        },
        activeIncidents: activeIncidents,
        hourlyDistribution: hourlyStats,
        dateRange: {
          startDate: startDate,
          endDate: endDate,
        },
      },
    });

  } catch (error) {
    console.error("Get incident stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving statistics",
    });
  }
};

// @desc    Search for potential duplicates
// @route   POST /api/incidents/check-duplicates
// @access  Private (Call Takers, Dispatchers)
const checkDuplicates = async (req, res) => {
  try {
    const { coordinates, timeWindowMinutes = 30, radiusMeters = 1000 } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Valid coordinates [longitude, latitude] are required",
      });
    }

    const nearbyIncidents = await Incident.findNearbyIncidents(
      coordinates,
      radiusMeters,
      timeWindowMinutes
    );

    const potentialDuplicates = nearbyIncidents.map(incident => ({
      incidentId: incident.incidentId,
      type: incident.classification.type,
      severity: incident.classification.severity,
      distance: 0, // Would calculate actual distance in production
      timeDiff: Math.abs(new Date() - incident.audit.createdAt) / (1000 * 60), // minutes
      status: incident.status.current,
      location: incident.location.address.fullAddress,
    }));

    res.status(200).json({
      success: true,
      data: {
        count: potentialDuplicates.length,
        incidents: potentialDuplicates,
        searchCriteria: {
          coordinates: coordinates,
          radiusMeters: radiusMeters,
          timeWindowMinutes: timeWindowMinutes,
        },
      },
    });

  } catch (error) {
    console.error("Check duplicates error:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking for duplicates",
    });
  }
};

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  mergeIncidents,
  getIncidentStats,
  checkDuplicates,
};