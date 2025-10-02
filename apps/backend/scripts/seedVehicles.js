const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
require('dotenv').config();

const testVehicles = [
  {
    registration: {
      plateNumber: 'AMB-001',
      vehicleType: 'Ambulance',
      make: 'Toyota',
      model: 'Hiace',
      year: 2020
    },
    specifications: {
      engineType: 'Diesel',
      fuelCapacity: 70,
      seatingCapacity: 8,
      model: 'Hiace'
    },
    operationalStatus: {
      status: 'available',
      reason: 'Ready for service',
      lastUpdated: new Date()
    },
    stationId: new mongoose.Types.ObjectId(), // Placeholder
    audit: {
      createdBy: new mongoose.Types.ObjectId(), // Placeholder
      createdAt: new Date(),
      lastModifiedBy: new mongoose.Types.ObjectId(), // Placeholder
      lastModifiedAt: new Date()
    }
  },
  {
    registration: {
      plateNumber: 'FIRE-001',
      vehicleType: 'Fire Engine',
      make: 'Isuzu',
      model: 'FTR',
      year: 2019
    },
    specifications: {
      engineType: 'Diesel',
      fuelCapacity: 200,
      seatingCapacity: 6,
      model: 'FTR'
    },
    operationalStatus: {
      status: 'available',
      reason: 'Ready for service',
      lastUpdated: new Date()
    },
    stationId: new mongoose.Types.ObjectId(), // Placeholder
    audit: {
      createdBy: new mongoose.Types.ObjectId(), // Placeholder
      createdAt: new Date(),
      lastModifiedBy: new mongoose.Types.ObjectId(), // Placeholder
      lastModifiedAt: new Date()
    }
  },
  {
    registration: {
      plateNumber: 'RES-001',
      vehicleType: 'Rescue Vehicle',
      make: 'Ford',
      model: 'Transit',
      year: 2021
    },
    specifications: {
      engineType: 'Diesel',
      fuelCapacity: 80,
      seatingCapacity: 6,
      model: 'Transit'
    },
    operationalStatus: {
      status: 'available',
      reason: 'Ready for service',
      lastUpdated: new Date()
    },
    stationId: new mongoose.Types.ObjectId(), // Placeholder
    audit: {
      createdBy: new mongoose.Types.ObjectId(), // Placeholder
      createdAt: new Date(),
      lastModifiedBy: new mongoose.Types.ObjectId(), // Placeholder
      lastModifiedAt: new Date()
    }
  }
];

async function seedVehicles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if vehicles already exist
    const existingVehicles = await Vehicle.find({});
    if (existingVehicles.length > 0) {
      console.log(`📋 Found ${existingVehicles.length} existing vehicles:`);
      existingVehicles.forEach(vehicle => {
        console.log(`  - ${vehicle.registration.plateNumber} (${vehicle.registration.vehicleType})`);
      });
      return;
    }

    // Create test vehicles
    console.log('🚗 Creating test vehicles...');
    const createdVehicles = await Vehicle.insertMany(testVehicles);
    
    console.log(`✅ Successfully created ${createdVehicles.length} test vehicles:`);
    createdVehicles.forEach(vehicle => {
      console.log(`  - ${vehicle.registration.plateNumber} (${vehicle.registration.vehicleType}) - ID: ${vehicle._id}`);
    });

  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedVehicles();