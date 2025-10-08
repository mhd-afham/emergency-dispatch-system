// Unlock all locked accounts
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function unlockAccounts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    // Find all locked accounts
    const lockedUsers = await User.find({
      'settings.lockUntil': { $exists: true, $ne: null }
    });
    
    console.log(`\nFound ${lockedUsers.length} locked accounts`);
    
    if (lockedUsers.length > 0) {
      // Unlock all accounts
      const result = await User.updateMany(
        {},
        {
          $set: {
            'settings.loginAttempts': 0,
            'settings.lockUntil': undefined
          }
        }
      );
      
      console.log(`✅ Unlocked ${result.modifiedCount} accounts`);
      console.log('\nAll accounts are now unlocked and login attempts reset!');
    } else {
      console.log('✅ No locked accounts found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

unlockAccounts();