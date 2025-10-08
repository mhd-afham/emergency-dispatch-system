const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const MaintenanceRecord = require('../models/MaintenanceRecord');
require('dotenv').config();

async function testMaintenanceRecord() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a vehicle to test with
    const vehicle = await Vehicle.findOne({});
    if (!vehicle) {
      console.log('❌ No vehicles found in database');
      return;
    }

    console.log(`🚗 Using vehicle: ${vehicle.registration.plateNumber} (ID: ${vehicle._id})`);

    // Create a test maintenance record
    const testRecord = new MaintenanceRecord({
      vehicleId: vehicle._id,
      recordType: 'ROUTINE',
      description: 'Test maintenance record creation',
      priority: 'MEDIUM',
      createdBy: 'Test Script'
    });

    const savedRecord = await testRecord.save();
    console.log('✅ Maintenance record created successfully:');
    console.log(`   - Record ID: ${savedRecord._id}`);
    console.log(`   - Vehicle ID: ${savedRecord.vehicleId}`);
    console.log(`   - Type: ${savedRecord.recordType}`);
    console.log(`   - Priority: ${savedRecord.priority}`);
    console.log(`   - Description: ${savedRecord.description}`);

    // Verify by fetching it back
    const fetchedRecord = await MaintenanceRecord.findById(savedRecord._id)
      .populate('vehicleId', 'registration.plateNumber registration.vehicleType');
    
    console.log('✅ Record verification:');
    console.log(`   - Vehicle: ${fetchedRecord.vehicleId.registration.plateNumber}`);
    console.log(`   - Type: ${fetchedRecord.vehicleId.registration.vehicleType}`);

    // Clean up - delete the test record
    await MaintenanceRecord.findByIdAndDelete(savedRecord._id);
    console.log('🧹 Test record cleaned up');

  } catch (error) {
    console.error('❌ Error testing maintenance record:', error);
    console.error('Error details:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

testMaintenanceRecord();