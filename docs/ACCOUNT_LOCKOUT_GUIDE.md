# Account Lockout - Security Feature Explanation & Solutions

## 🔒 Why Your Account Is Locked

**This is a SECURITY FEATURE working correctly!**

Your account gets temporarily locked after **5 failed login attempts** to prevent:
- 🛡️ Brute-force password attacks
- 🚫 Unauthorized access attempts
- 🔐 Account security breaches

## ⏱️ Lockout Details

### Current Settings:
- **Failed Attempts Allowed:** 5 attempts
- **Lockout Duration:** 2 hours (120 minutes)
- **Status Code:** 423 (Locked)

### How It Works:
1. Enter wrong password → Counter increases
2. After 5 failed attempts → Account locks automatically
3. Wait 2 hours → Lock expires automatically
4. Successful login → Counter resets to 0

## ✅ Solutions (Choose One)

### Solution 1: Wait It Out (Recommended & Secure)
**⏰ Wait 2 hours** and the lock will automatically expire.

**Why wait?**
- Most secure option
- No manual intervention needed
- Security feature working as intended

---

### Solution 2: Manual Unlock via MongoDB (Quick Fix)

If you need immediate access for testing, manually unlock the account in the database:

#### Option A: Using MongoDB Compass (GUI)

1. **Open MongoDB Compass**
2. **Connect** to your database
3. **Navigate** to: `emergency-dispatch → users` collection
4. **Find** your user by email:
   ```json
   { "personal.email": "your-email@example.com" }
   ```
5. **Edit** the document and set:
   ```json
   {
     "settings.loginAttempts": 0,
     "settings.lockUntil": null
   }
   ```
6. **Save** the changes
7. **Try logging in again**

#### Option B: Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use emergency-dispatch

# Unlock a specific user by email
db.users.updateOne(
  { "personal.email": "supervisor@test.com" },
  { 
    $set: { "settings.loginAttempts": 0 },
    $unset: { "settings.lockUntil": "" }
  }
)

# Verify the update
db.users.findOne(
  { "personal.email": "supervisor@test.com" },
  { "personal.email": 1, "settings.loginAttempts": 1, "settings.lockUntil": 1 }
)
```

#### Option C: Using Node.js Script

Create a file: `apps/backend/scripts/unlockUser.js`

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../../.env' });

const unlockUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📊 Connected to MongoDB');

    const user = await User.findOne({ 'personal.email': email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    console.log('🔍 Current state:');
    console.log('  Login Attempts:', user.settings.loginAttempts);
    console.log('  Lock Until:', user.settings.lockUntil);
    console.log('  Is Locked:', user.isLocked);

    // Reset login attempts and unlock
    user.settings.loginAttempts = 0;
    user.settings.lockUntil = undefined;
    await user.save();

    console.log('✅ Account unlocked successfully!');
    console.log('  Login Attempts: 0');
    console.log('  Lock Until: undefined');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Usage: node unlockUser.js supervisor@test.com
const email = process.argv[2];
if (!email) {
  console.log('Usage: node unlockUser.js <email>');
  process.exit(1);
}

unlockUser(email);
```

**Run it:**
```powershell
cd apps/backend/scripts
node unlockUser.js supervisor@test.com
```

---

### Solution 3: Password Reset (If You Forgot Password)

If you're locked out because you **forgot your password**:

1. **Click "Forgot Password"** on login screen
2. **Enter your email**
3. **Check email** for reset link (or check terminal for preview URL in development)
4. **Reset password**
5. **Login with new password**

**Note:** Password reset automatically unlocks the account!

---

### Solution 4: Create New Admin API Endpoint (For Future)

Add an admin endpoint to unlock users:

**File:** `apps/backend/controllers/authController.js`

```javascript
// @desc    Admin unlock user account
// @route   PUT /api/auth/admin/unlock-user/:userId
// @access  Private (Admin only)
const adminUnlockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Reset login attempts and unlock
    user.settings.loginAttempts = 0;
    user.settings.lockUntil = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User account unlocked successfully',
      user: {
        id: user._id,
        email: user.personal.email,
        wasLocked: true,
        unlockedAt: new Date()
      }
    });

    console.log(`✅ User unlocked by admin: ${user.personal.email}`);
  } catch (error) {
    console.error('Admin unlock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unlocking user account'
    });
  }
};
```

---

## 🔍 Check Account Status

Want to see if your account is locked? Run this in browser console after trying to login:

```javascript
// The login response will tell you
// Status 423 = Locked
// Status 401 = Wrong password
// Status 200 = Success
```

Or check via MongoDB:

```javascript
db.users.findOne(
  { "personal.email": "your-email@test.com" },
  { 
    "personal.email": 1, 
    "settings.loginAttempts": 1, 
    "settings.lockUntil": 1 
  }
)
```

**Output Example:**
```json
{
  "_id": ObjectId("..."),
  "personal": {
    "email": "supervisor@test.com"
  },
  "settings": {
    "loginAttempts": 5,
    "lockUntil": ISODate("2025-10-03T16:30:00.000Z")
  }
}
```

If `lockUntil` is in the future → Account is locked  
If `lockUntil` is in the past or doesn't exist → Account is unlocked

---

## 🎯 Prevention Tips

### For Testing/Development:
1. **Use strong, memorable test passwords**
2. **Write them down** in a secure note (not production!)
3. **Use browser autofill** to avoid typos
4. **Keep a list** of test credentials

### For Production:
1. **Enable Password Reset** flow for users
2. **Add Admin Panel** to unlock accounts
3. **Notify users** via email when locked
4. **Consider increasing attempts** from 5 to 10 (optional)
5. **Add CAPTCHA** after 3 failed attempts (optional)

---

## ⚙️ Adjust Lockout Settings (Optional)

If you want to change the lockout behavior:

**File:** `apps/backend/models/User.js` (Line ~216)

### Current Settings:
```javascript
// Lock account after 5 failed attempts for 2 hours
if (this.settings.loginAttempts + 1 >= 5 && !this.isLocked) {
  updates.$set = {
    "settings.lockUntil": Date.now() + 2 * 60 * 60 * 1000, // 2 hours
  };
}
```

### Make It More Lenient (Development):
```javascript
// Lock after 10 attempts for 15 minutes
if (this.settings.loginAttempts + 1 >= 10 && !this.isLocked) {
  updates.$set = {
    "settings.lockUntil": Date.now() + 15 * 60 * 1000, // 15 minutes
  };
}
```

### Make It Stricter (Production):
```javascript
// Lock after 3 attempts for 24 hours
if (this.settings.loginAttempts + 1 >= 3 && !this.isLocked) {
  updates.$set = {
    "settings.lockUntil": Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
}
```

---

## 📊 Quick Reference

| Scenario | Failed Attempts | Lockout Duration | Action |
|----------|----------------|------------------|---------|
| Testing | 5 | 2 hours | Use Solution 2 (Manual unlock) |
| Production | 5 | 2 hours | Use Solution 3 (Password reset) |
| Very Strict | 3 | 24 hours | Contact admin |
| Lenient | 10 | 15 minutes | Wait it out |

---

## 🚨 Troubleshooting

### Issue: "Still locked after 2 hours"
**Check:** Server time vs your local time
```javascript
console.log('Server time:', Date.now());
console.log('Lock until:', user.settings.lockUntil.getTime());
```

### Issue: "Can't unlock via MongoDB"
**Solution:** Restart your backend after making changes
```powershell
cd apps/backend
npm start
```

### Issue: "Don't remember password"
**Solution:** Use forgot password flow or have admin reset it

---

## ✅ Summary

**Why it happened:** You entered wrong password 5 times  
**How long:** Locked for 2 hours  
**Quick fix:** Use MongoDB to manually unlock (Solution 2)  
**Best practice:** Wait 2 hours OR use password reset  
**For future:** Remember password or enable admin unlock panel

---

**This is GOOD security! 🔐**  
Don't disable this feature in production!

**Need immediate access for testing?**  
→ Use Solution 2 (MongoDB manual unlock)  
→ Remember the correct password  
→ Write it down in your development notes
