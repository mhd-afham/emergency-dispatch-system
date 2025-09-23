const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ 'personal.email': 'test@example.com' });
    
    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log('Email: test@example.com');
      console.log('Password: password123');
      console.log('Role:', existingUser.auth.role);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create test user
    const testUser = new User({
      personal: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1234567890'
      },
      auth: {
        password: hashedPassword,
        role: 'Call Taker',
        employeeId: 'CT001'
      },
      profile: {
        department: 'Emergency Services',
        shift: 'Day',
        supervisor: null,
        certifications: ['Emergency Call Handling'],
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1987654321'
        }
      },
      settings: {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'America/New_York'
        }
      },
      status: {
        isActive: true,
        lastLogin: null,
        loginAttempts: 0,
        accountLocked: false
      }
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('Role: Call Taker');
    console.log('Employee ID: CT001');
    console.log('\nYou can now login to the system!');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

createTestUser();