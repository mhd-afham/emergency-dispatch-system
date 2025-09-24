const Incident = require('../models/Incident');
const mongoose = require('mongoose');

/**
 * Incident Controller for Emergency Dispatch System
 * Handles all incident intake, triage, and management operations
 * Implements the core functionality for US-002, US-003, US-004
 */
class IncidentController {
  
  /**
   * Create a new incident (Emergency Call Logging - US-002)
   * POST /api/incidents
   */
  static async createIncident(req, res) {
    try {
      console.log('📞 Creating new incident - Call logged by:', req.user.firstName, req.user.lastName);
      console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
      
      const {
        callerInfo,
        incidentType,
        incidentCategory,
        severity,
        description,
        location,
        estimatedResponseTime
      } = req.body;

      console.log('🔍 Extracted fields:', {
        hasCallerInfo: !!callerInfo,
        hasIncidentType: !!incidentType,
        hasIncidentCategory: !!incidentCategory,
        hasDescription: !!description,
        hasLocation: !!location,
        callerInfo,
        incidentType,
        incidentCategory,
        severity,
        location
      });

      // Validate required fields
      const requiredFields = ['callerInfo', 'incidentType', 'incidentCategory', 'description', 'location'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${field}`,
            field: field
          });
        }
      }

      // Validate caller info required fields
      if (!callerInfo.name || !callerInfo.contactNumber) {
        return res.status(400).json({
          success: false,
          message: 'Caller name and contact number are required',
          field: 'callerInfo'
        });
      }

      // Validate location required fields
      if (!location.address || !location.city || !location.province) {
        return res.status(400).json({
          success: false,
          message: 'Address, city, and province are required',
          field: 'location'
        });
      }

      // Check for duplicate incidents if coordinates are provided
      let possibleDuplicates = [];
      if (location.coordinates && location.coordinates.coordinates) {
        const [longitude, latitude] = location.coordinates.coordinates;
        
        // Find nearby incidents within 1km and 30 minutes (US-004 - Duplicate Detection)
        possibleDuplicates = await Incident.findNearbyIncidents(longitude, latitude, 1, 30);
        console.log(`🔍 Found ${possibleDuplicates.length} potential duplicate incidents nearby`);
      }

      // Create the incident
      const incident = new Incident({
        callerInfo: {
          name: callerInfo.name.trim(),
          contactNumber: callerInfo.contactNumber.trim(),
          alternateContact: callerInfo.alternateContact?.trim(),
          reportingMethod: callerInfo.reportingMethod || 'phone_call'
        },
        incidentType,
        incidentCategory,
        severity: severity || 'medium',
        description: description.trim(),
        location: {
          address: location.address.trim(),
          city: location.city.trim(),
          province: location.province,
          coordinates: location.coordinates,
          locationAccuracy: location.locationAccuracy || 'approximate',
          landmarks: location.landmarks?.trim()
        },
        loggedBy: req.user._id,
        possibleDuplicates: possibleDuplicates.map(dup => dup._id),
        estimatedResponseTime,
        status: 'pending'
      });

      await incident.save();

      // Populate the logged by user info for response
      await incident.populate('loggedBy', 'firstName lastName role');

      console.log('✅ Incident created successfully:', incident.incidentId);

      res.status(201).json({
        success: true,
        message: 'Incident logged successfully',
        data: {
          incident,
          duplicateWarning: possibleDuplicates.length > 0,
          possibleDuplicatesCount: possibleDuplicates.length
        }
      });

    } catch (error) {
      console.error('❌ Error creating incident:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create incident',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all incidents with filtering and pagination
   * GET /api/incidents
   */
  static async getAllIncidents(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        incidentType,
        severity,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = req.query;

      console.log('📋 Fetching incidents with filters:', { status, incidentType, severity, search });

      // Build query object
      const query = {};

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by incident type
      if (incidentType) {
        query.incidentType = incidentType;
      }

      // Filter by severity
      if (severity) {
        query.severity = severity;
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      // Search in incident ID, caller name, or description
      if (search) {
        query.$or = [
          { incidentId: { $regex: search, $options: 'i' } },
          { 'callerInfo.name': { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query with pagination
      const incidents = await Incident.find(query)
        .populate('loggedBy', 'firstName lastName role')
        .populate('assignedDispatcher', 'firstName lastName role')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Incident.countDocuments(query);

      console.log(`📊 Found ${incidents.length} incidents out of ${total} total`);

      res.json({
        success: true,
        data: {
          incidents,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalIncidents: total,
            hasNextPage: skip + incidents.length < total,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching incidents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incidents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get a single incident by ID
   * GET /api/incidents/:id
   */
  static async getIncidentById(req, res) {
    try {
      const { id } = req.params;
      
      console.log('🔍 Fetching incident by ID:', id);

      // Support both MongoDB ObjectId and custom incident ID
      const query = mongoose.isValidObjectId(id) 
        ? { _id: id }
        : { incidentId: id };

      const incident = await Incident.findOne(query)
        .populate('loggedBy', 'firstName lastName role email')
        .populate('assignedDispatcher', 'firstName lastName role email')
        .populate('possibleDuplicates', 'incidentId callerInfo.name description location.address createdAt');

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
        });
      }

      console.log('✅ Incident found:', incident.incidentId);

      res.json({
        success: true,
        data: { incident }
      });

    } catch (error) {
      console.error('❌ Error fetching incident:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incident',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update incident details
   * PUT /api/incidents/:id
   */
  static async updateIncident(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.log('📝 Updating incident:', id);

      // Support both MongoDB ObjectId and custom incident ID
      const query = mongoose.isValidObjectId(id) 
        ? { _id: id }
        : { incidentId: id };

      const incident = await Incident.findOne(query);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
        });
      }

      // Update allowed fields
      const allowedUpdates = [
        'incidentType', 'incidentCategory', 'severity', 'description',
        'location', 'status', 'assignedDispatcher', 'estimatedResponseTime'
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          incident[field] = updates[field];
        }
      });

      await incident.save();
      await incident.populate('loggedBy', 'firstName lastName role');
      await incident.populate('assignedDispatcher', 'firstName lastName role');

      console.log('✅ Incident updated successfully');

      res.json({
        success: true,
        message: 'Incident updated successfully',
        data: { incident }
      });

    } catch (error) {
      console.error('❌ Error updating incident:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update incident',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Add a note to an incident
   * POST /api/incidents/:id/notes
   */
  static async addIncidentNote(req, res) {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!note || note.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Note content is required'
        });
      }

      console.log('📝 Adding note to incident:', id);

      const query = mongoose.isValidObjectId(id) 
        ? { _id: id }
        : { incidentId: id };

      const incident = await Incident.findOne(query);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
        });
      }

      await incident.addNote(note.trim(), req.user._id);
      await incident.populate('notes.addedBy', 'firstName lastName role');

      console.log('✅ Note added successfully');

      res.json({
        success: true,
        message: 'Note added successfully',
        data: { 
          incident,
          latestNote: incident.notes[incident.notes.length - 1]
        }
      });

    } catch (error) {
      console.error('❌ Error adding note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add note',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Find potential duplicate incidents (US-004)
   * POST /api/incidents/find-duplicates
   */
  static async findPotentialDuplicates(req, res) {
    try {
      const { longitude, latitude, radiusKm = 1, timeWindowMinutes = 30 } = req.body;

      if (!longitude || !latitude) {
        return res.status(400).json({
          success: false,
          message: 'Longitude and latitude are required'
        });
      }

      console.log('🔍 Searching for duplicate incidents near:', { longitude, latitude });

      const duplicates = await Incident.findNearbyIncidents(
        longitude, 
        latitude, 
        radiusKm, 
        timeWindowMinutes
      );

      res.json({
        success: true,
        data: {
          duplicates,
          count: duplicates.length,
          searchCriteria: {
            location: [longitude, latitude],
            radiusKm,
            timeWindowMinutes
          }
        }
      });

    } catch (error) {
      console.error('❌ Error finding duplicates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find potential duplicates',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Merge duplicate incidents
   * POST /api/incidents/:id/merge/:targetId
   */
  static async mergeIncidents(req, res) {
    try {
      const { id, targetId } = req.params;
      const { mergeNotes } = req.body;

      console.log('🔄 Merging incidents:', id, 'into', targetId);

      // Find both incidents
      const [sourceIncident, targetIncident] = await Promise.all([
        Incident.findById(id),
        Incident.findById(targetId)
      ]);

      if (!sourceIncident || !targetIncident) {
        return res.status(404).json({
          success: false,
          message: 'One or both incidents not found'
        });
      }

      // Merge notes if requested
      if (mergeNotes) {
        targetIncident.notes.push(...sourceIncident.notes);
      }

      // Add merge note
      await targetIncident.addNote(
        `Merged with incident ${sourceIncident.incidentId} by ${req.user.firstName} ${req.user.lastName}`,
        req.user._id
      );

      // Mark source incident as merged
      sourceIncident.status = 'cancelled';
      sourceIncident.mergedWith = targetIncident._id;

      await Promise.all([
        sourceIncident.save(),
        targetIncident.save()
      ]);

      console.log('✅ Incidents merged successfully');

      res.json({
        success: true,
        message: 'Incidents merged successfully',
        data: {
          mergedIncident: targetIncident,
          cancelledIncident: sourceIncident
        }
      });

    } catch (error) {
      console.error('❌ Error merging incidents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to merge incidents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get incident statistics for dashboard
   * GET /api/incidents/statistics
   */
  static async getIncidentStatistics(req, res) {
    try {
      const { timeframe = 'today' } = req.query;

      console.log('📊 Generating incident statistics for:', timeframe);

      let dateFilter = {};
      const now = new Date();

      switch (timeframe) {
        case 'today':
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          dateFilter = { createdAt: { $gte: startOfDay } };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          dateFilter = { createdAt: { $gte: monthAgo } };
          break;
      }

      // Aggregate statistics
      const [statusStats, typeStats, severityStats, totalCount] = await Promise.all([
        // Count by status
        Incident.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),

        // Count by incident type
        Incident.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$incidentType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),

        // Count by severity
        Incident.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),

        // Total count
        Incident.countDocuments(dateFilter)
      ]);

      const statistics = {
        totalIncidents: totalCount,
        statusBreakdown: statusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        typeBreakdown: typeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        severityBreakdown: severityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        timeframe
      };

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('❌ Error generating statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get incident categories based on type
   * GET /api/incidents/categories/:type
   */
  static getIncidentCategories(req, res) {
    const { type } = req.params;

    const categories = {
      medical: [
        { value: 'cardiac_arrest', label: 'Cardiac Arrest' },
        { value: 'respiratory_emergency', label: 'Respiratory Emergency' },
        { value: 'trauma', label: 'Trauma/Injury' },
        { value: 'unconscious', label: 'Unconscious Person' },
        { value: 'allergic_reaction', label: 'Allergic Reaction' },
        { value: 'other_medical', label: 'Other Medical Emergency' }
      ],
      fire: [
        { value: 'structure_fire', label: 'Structure Fire' },
        { value: 'vehicle_fire', label: 'Vehicle Fire' },
        { value: 'wildfire', label: 'Wildfire' },
        { value: 'explosion', label: 'Explosion' },
        { value: 'smoke_investigation', label: 'Smoke Investigation' },
        { value: 'other_fire', label: 'Other Fire Emergency' }
      ],
      rescue: [
        { value: 'vehicle_accident', label: 'Vehicle Accident' },
        { value: 'water_rescue', label: 'Water Rescue' },
        { value: 'confined_space', label: 'Confined Space Rescue' },
        { value: 'height_rescue', label: 'Height/Fall Rescue' },
        { value: 'animal_rescue', label: 'Animal Rescue' },
        { value: 'other_rescue', label: 'Other Rescue' }
      ],
      hazmat: [
        { value: 'chemical_spill', label: 'Chemical Spill' },
        { value: 'gas_leak', label: 'Gas Leak' },
        { value: 'toxic_exposure', label: 'Toxic Exposure' },
        { value: 'environmental', label: 'Environmental Hazard' },
        { value: 'other_hazmat', label: 'Other Hazmat' }
      ],
      traffic: [
        { value: 'collision', label: 'Traffic Collision' },
        { value: 'road_obstruction', label: 'Road Obstruction' },
        { value: 'traffic_control', label: 'Traffic Control' },
        { value: 'other_traffic', label: 'Other Traffic Issue' }
      ],
      other: [
        { value: 'public_service', label: 'Public Service' },
        { value: 'assist_police', label: 'Assist Police' },
        { value: 'false_alarm', label: 'False Alarm' },
        { value: 'other', label: 'Other' }
      ]
    };

    if (!categories[type]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident type'
      });
    }

    res.json({
      success: true,
      data: {
        type,
        categories: categories[type]
      }
    });
  }
}

module.exports = IncidentController;