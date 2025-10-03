/**
 * Unlock User Account Script
 * 
 * This script unlocks a user account that has been locked due to
 * multiple failed login attempts.
 * 
 * Usage:
 *   node unlockUser.js <email>
 * 
 * Example:
 *   node unlockUser.js supervisor@test.com
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const unlockUser = async (email) => {
  try {
    console.log('🔓 Account Unlock Utility');
    console.log('========================\n');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/emergency-dispatch';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    console.log(`🔍 Looking for user: ${email}`);
    const user = await User.findOne({ 'personal.email': email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('   Available users:');
      const allUsers = await User.find({}, { 'personal.email': 1, 'auth.role': 1 });
      allUsers.forEach(u => {
        console.log(`   - ${u.personal.email} (${u.auth.role})`);
      });
      process.exit(1);
    }

    console.log(`✅ User found: ${user.personal.firstName} ${user.personal.lastName}\n`);

    // Show current state
    console.log('📋 Current Account State:');
    console.log(`   Email: ${user.personal.email}`);
    console.log(`   Role: ${user.auth.role}`);
    console.log(`   Login Attempts: ${user.settings.loginAttempts || 0}`);
    console.log(`   Lock Until: ${user.settings.lockUntil || 'Not locked'}`);
    console.log(`   Is Locked: ${user.isLocked ? '🔒 YES' : '🔓 NO'}`);
    console.log(`   Is Active: ${user.settings.isActive ? '✅ YES' : '❌ NO'}\n`);

    // Check if already unlocked
    if (!user.isLocked && user.settings.loginAttempts === 0) {
      console.log('ℹ️  Account is already unlocked!');
      process.exit(0);
    }

    // Unlock the account
    console.log('🔓 Unlocking account...');
    user.settings.loginAttempts = 0;
    user.settings.lockUntil = undefined;
    await user.save();

    console.log('✅ Account unlocked successfully!\n');
    
    // Show new state
    console.log('📋 New Account State:');
    console.log(`   Login Attempts: ${user.settings.loginAttempts}`);
    console.log(`   Lock Until: ${user.settings.lockUntil || 'None'}`);
    console.log(`   Is Locked: ${user.isLocked ? '🔒 YES' : '🔓 NO'}\n`);
    
    console.log('✅ Done! You can now login with this account.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node unlockUser.js <email>');
  console.log('Example: node unlockUser.js supervisor@test.com');
  process.exit(1);
}

unlockUser(email);
