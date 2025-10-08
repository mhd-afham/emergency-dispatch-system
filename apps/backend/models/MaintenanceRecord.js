const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  recordType: {
    type: String,
    enum: ['ROUTINE', 'CORRECTIVE', 'EMERGENCY'],
    required: true
  },
  description: { 
    type: String, 
    required: true 
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  createdBy: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  }
});

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);