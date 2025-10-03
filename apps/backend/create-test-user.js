// Quick script to check existing users and create a test user
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    // Check existing users
    const users = await User.find({}, 'personal.email personal.firstName personal.lastName auth.role');
    console.log('\nExisting users:');
    users.forEach(user => {
      console.log(`- ${user.personal.email} (${user.personal.firstName} ${user.personal.lastName}) - Role: ${user.auth.role}`);
    });
    
    // Create a test supervisor user
    console.log('\nCreating test supervisor...');
    const testUser = new User({
      personal: {
        firstName: 'Test',
        lastName: 'Supervisor',
        email: 'testsupervisor@emergency.gov',
        phone: '+94771234999'
      },
      auth: {
        password: 'password123',
        role: 'Supervisor',
        employeeId: 'EMP999999'
      },
      settings: {
        isActive: true,
        emailVerified: true
      }
    });
    
    const savedUser = await testUser.save();
    console.log('Test supervisor created:', savedUser.personal.email);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();