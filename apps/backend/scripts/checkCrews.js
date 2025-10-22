require('dotenv').config();
const mongoose = require('mongoose');
const Crew = require('../models/Crew');

async function checkCrews() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency-dispatch';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Count all crews
    const allCrews = await Crew.countDocuments({});
    console.log('📊 Total crews in database:', allCrews);

    // Count active crews
    const activeCrews = await Crew.countDocuments({ 'settings.isActive': true });
    console.log('📊 Active crews (settings.isActive=true):', activeCrews);

    // Count by availability status
    const crewsByAvailability = await Crew.aggregate([
      {
        $group: {
          _id: '$currentStatus.availability',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\n📊 Crews by availability status:');
    crewsByAvailability.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    // Count active crews by availability
    const activeCrewsByAvailability = await Crew.aggregate([
      {
        $match: { 'settings.isActive': true }
      },
      {
        $group: {
          _id: '$currentStatus.availability',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\n📊 Active crews (isActive=true) by availability:');
    activeCrewsByAvailability.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    // Sample crews
    const sampleCrews = await Crew.find({})
      .limit(5)
      .select('personal.firstName personal.lastName settings.isActive currentStatus.availability professional.role');
    
    console.log('\n📋 Sample crews:');
    sampleCrews.forEach((crew, idx) => {
      console.log(`  [${idx + 1}] ${crew.personal.firstName} ${crew.personal.lastName}`);
      console.log(`      Role: ${crew.professional.role}`);
      console.log(`      Active: ${crew.settings.isActive}`);
      console.log(`      Availability: ${crew.currentStatus.availability}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCrews();
