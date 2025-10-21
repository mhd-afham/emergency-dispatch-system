const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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

// Add pagination plugin
maintenanceRecordSchema.plugin(mongoosePaginate);

// Add indexes for search performance
maintenanceRecordSchema.index({ vehicleId: 1 });
maintenanceRecordSchema.index({ recordType: 1 });
maintenanceRecordSchema.index({ priority: 1 });
maintenanceRecordSchema.index({ status: 1 });
maintenanceRecordSchema.index({ createdBy: 1 });
maintenanceRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);