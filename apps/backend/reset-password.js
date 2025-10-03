// Reset password for existing user
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function resetPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    const email = 'supervisor@respondr.lk';
    const newPassword = 'password123';
    
    // Find the user
    const user = await User.findOne({ 'personal.email': email });
    
    if (!user) {
      console.log('User not found:', email);
      return;
    }
    
    console.log('Found user:', user.personal.firstName, user.personal.lastName);
    
    // Update password
    user.auth.password = newPassword;
    await user.save();
    
    console.log('✅ Password reset successfully!');
    console.log('You can now login with:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();