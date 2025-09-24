const mongoose = require('mongoose');

/**
 * Incident Schema for Emergency Dispatch System
 * This schema handles all emergency incident data including:
 * - Caller information
 * - Incident details and classification
 * - Location data with geospatial support
 * - Status tracking throughout incident lifecycle
 */
const IncidentSchema = new mongoose.Schema({
  // Unique incident identifier - auto-generated
  incidentId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Generate incident ID with format: INC-YYYYMMDD-XXXXX
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      return `INC-${year}${month}${day}-${random}`;
    }
  },

  // Caller Information Section
  callerInfo: {
    // Caller's full name
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Caller name must be at least 2 characters'],
      maxlength: [100, 'Caller name cannot exceed 100 characters']
    },
    
    // Primary contact number
    contactNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Sri Lankan phone number validation (supports mobile and landline)
          return /^(\+94|0)?[1-9]\d{8}$/.test(v);
        },
        message: 'Please provide a valid Sri Lankan phone number'
      }
    },
    
    // Alternative contact number (optional)
    alternateContact: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(\+94|0)?[1-9]\d{8}$/.test(v);
        },
        message: 'Please provide a valid alternate contact number'
      }
    },
    
    // How the caller reported the incident
    reportingMethod: {
      type: String,
      enum: ['phone_call', 'mobile_app', 'sms', 'walk_in', 'third_party'],
      default: 'phone_call'
    }
  },

  // Incident Classification Section
  incidentType: {
    type: String,
    enum: ['medical', 'fire', 'rescue', 'hazmat', 'traffic', 'other'],
    required: true
  },

  // Detailed incident category based on type
  incidentCategory: {
    type: String,
    required: true,
    validate: {
      validator: function() {
        // Ensure category matches the incident type
        const validCategories = {
          medical: ['cardiac_arrest', 'respiratory_emergency', 'trauma', 'unconscious', 'allergic_reaction', 'other_medical'],
          fire: ['structure_fire', 'vehicle_fire', 'wildfire', 'explosion', 'smoke_investigation', 'other_fire'],
          rescue: ['vehicle_accident', 'water_rescue', 'confined_space', 'height_rescue', 'animal_rescue', 'other_rescue'],
          hazmat: ['chemical_spill', 'gas_leak', 'toxic_exposure', 'environmental', 'other_hazmat'],
          traffic: ['collision', 'road_obstruction', 'traffic_control', 'other_traffic'],
          other: ['public_service', 'assist_police', 'false_alarm', 'other']
        };
        return validCategories[this.incidentType]?.includes(this.incidentCategory);
      },
      message: 'Incident category must match the selected incident type'
    }
  },

  // Priority/Severity Level
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true
  },

  // Detailed description of the incident
  description: {
    type: String,
    required: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },

  // Location Information Section
  location: {
    // Street address or location description
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    
    // City/Town
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    
    // Province/State
    province: {
      type: String,
      required: true,
      enum: ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa']
    },
    
    // GPS Coordinates - GeoJSON Point format for geospatial queries
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function(coords) {
            // Validate coordinates are within Sri Lankan boundaries
            const [lng, lat] = coords;
            return lng >= 79.5 && lng <= 81.9 && lat >= 5.9 && lat <= 9.9;
          },
          message: 'Coordinates must be within Sri Lankan boundaries'
        }
      }
    },
    
    // Location accuracy confidence level
    locationAccuracy: {
      type: String,
      enum: ['exact', 'approximate', 'general_area'],
      default: 'approximate'
    },
    
    // Any additional location landmarks or details
    landmarks: {
      type: String,
      maxlength: [200, 'Landmarks description cannot exceed 200 characters']
    }
  },

  // Incident Status and Workflow
  status: {
    type: String,
    enum: ['pending', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled'],
    default: 'pending'
  },

  // Call taker who logged the incident
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Dispatcher assigned to handle the incident
  assignedDispatcher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Resources assigned to this incident
  assignedResources: [{
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle' // Will be created later
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'en_route', 'on_scene', 'completed'],
      default: 'assigned'
    }
  }],

  // Duplicate Detection Fields
  possibleDuplicates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
  
  // If this incident was merged with another
  mergedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },

  // Additional Notes and Updates
  notes: [{
    note: {
      type: String,
      required: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Time when incident was resolved/closed
  resolvedAt: {
    type: Date
  },

  // Estimated response time (in minutes)
  estimatedResponseTime: {
    type: Number,
    min: [1, 'Response time must be at least 1 minute'],
    max: [120, 'Response time cannot exceed 120 minutes']
  },

  // Actual response time (in minutes) - calculated when first unit arrives
  actualResponseTime: {
    type: Number
  }
}, {
  // Add timestamps and version key
  timestamps: true,
  versionKey: false
});

// Geospatial Index for location-based queries (duplicate detection, nearest unit finding)
IncidentSchema.index({ "location.coordinates": "2dsphere" });

// Compound index for efficient querying by status and creation time
IncidentSchema.index({ status: 1, createdAt: -1 });

// Index for incident ID lookups
IncidentSchema.index({ incidentId: 1 });

// Index for call taker performance queries
IncidentSchema.index({ loggedBy: 1, createdAt: -1 });

// Pre-save middleware to update timestamp and perform validations
IncidentSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // Set resolved timestamp when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  
  next();
});

// Instance method to calculate response time
IncidentSchema.methods.calculateResponseTime = function() {
  if (this.resolvedAt) {
    const responseMinutes = Math.round((this.resolvedAt - this.createdAt) / (1000 * 60));
    this.actualResponseTime = responseMinutes;
    return responseMinutes;
  }
  return null;
};

// Instance method to add notes
IncidentSchema.methods.addNote = function(noteText, userId) {
  this.notes.push({
    note: noteText,
    addedBy: userId,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to find nearby incidents (for duplicate detection)
IncidentSchema.statics.findNearbyIncidents = function(longitude, latitude, radiusInKm = 1, timeWindowMinutes = 30) {
  const radiusInMeters = radiusInKm * 1000;
  const timeWindow = new Date(Date.now() - (timeWindowMinutes * 60 * 1000));
  
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInMeters
      }
    },
    createdAt: { $gte: timeWindow },
    status: { $ne: 'cancelled' }
  });
};

// Static method to get incidents by status
IncidentSchema.statics.getByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('loggedBy', 'firstName lastName')
    .populate('assignedDispatcher', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Virtual for full address
IncidentSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.province}`;
});

// Ensure virtual fields are included in JSON output
IncidentSchema.set('toJSON', { virtuals: true });
IncidentSchema.set('toObject', { virtuals: true });

const Incident = mongoose.model('Incident', IncidentSchema);

module.exports = Incident;