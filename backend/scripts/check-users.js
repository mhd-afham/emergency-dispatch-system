const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('personal.firstName personal.lastName personal.email auth.role auth.employeeId');
    
    console.log('\n📋 Current Users:');
    console.log('================');
    users.forEach(user => {
      console.log(`👤 ${user.personal.firstName} ${user.personal.lastName}`);
      console.log(`   Email: ${user.personal.email}`);
      console.log(`   Role: ${user.auth.role}`);
      console.log(`   Employee ID: ${user.auth.employeeId}`);
      console.log('   ---');
    });

    console.log('\n✅ Roles that can create incidents:');
    console.log('   - Call Taker');
    console.log('   - Dispatcher');
    console.log('   - Admin');
    console.log('   - Supervisor');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsers();