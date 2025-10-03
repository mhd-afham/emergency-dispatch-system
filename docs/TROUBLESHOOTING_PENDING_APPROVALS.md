# Troubleshooting: "Failed to retrieve pending approvals" Error

## 🔍 Enhanced Debugging Guide

I've added extensive logging to both frontend and backend to help diagnose the exact issue. Follow these steps:

## ✅ What I've Fixed

### 1. **Enhanced Frontend Logging**
Added detailed console logging in `SupervisorPendingApprovals.tsx`:
- API URL being called
- Authentication token presence
- HTTP response status
- Response data structure
- Which data format is being used

### 2. **Enhanced Backend Logging**  
Added detailed console logging in `vehicleController.js`:
- User information making the request
- MongoDB query being executed
- Number of vehicles found
- Full error details including stack trace

### 3. **Improved Error Handling**
- Better response format handling
- More descriptive error messages
- Graceful handling of empty results

## 🧪 Debugging Steps

### Step 1: Open Browser Console

1. Open your browser (Chrome/Edge recommended)
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Clear any existing messages

### Step 2: Login and Navigate

1. Login as supervisor:
   - Email: `supervisor@respondr.lk`
   - Password: `supervisor123`

2. Navigate to **Pending Approvals** tab

### Step 3: Check Console Logs

Look for these specific log messages in the **browser console**:

#### Expected Logs (Frontend):
```
🔍 Fetching pending approvals from: http://localhost:5000/api/vehicles/pending-approval
🔑 Token exists: true
📡 Response status: 200 OK
📦 Response data: {success: true, data: {...}}
✅ Format: data.pendingVehicles X items
```

#### Possible Error Scenarios:

**Scenario A: Authentication Error**
```
📡 Response status: 401 Unauthorized
❌ Response not OK: 401 {...}
```
**Solution:** Token expired or invalid. Logout and login again.

**Scenario B: Permission Error**
```
📡 Response status: 403 Forbidden
❌ Response not OK: 403 {...}
```
**Solution:** User doesn't have Supervisor role. Check user account.

**Scenario C: Server Not Running**
```
❌ Error fetching vehicle approvals: TypeError: Failed to fetch
```
**Solution:** Backend server is not running. Check backend terminal.

**Scenario D: Empty Results**
```
📡 Response status: 200 OK
✅ Format: data.pendingVehicles 0 items
```
**Solution:** No pending vehicles in database. Register a new vehicle first.

### Step 4: Check Backend Logs

Look at the **backend server terminal** for:

#### Expected Logs (Backend):
```
📋 Fetching vehicles pending approval for: [Name]
🔍 User role: Supervisor
🔎 Query: {"isActive":false,"status.operational":"maintenance"}
📊 Found X pending vehicles
```

#### Possible Backend Errors:

**Error 1: Database Connection Issue**
```
❌ Get pending approvals error: MongooseError: ...
```
**Solution:** Check database connection in `config/database.js`

**Error 2: Authentication Middleware Failing**
```
Error: User not authenticated
```
**Solution:** Check auth middleware and token validity

**Error 3: Populate Error**
```
❌ Get pending approvals error: Error: Cannot populate path...
```
**Solution:** Referenced document doesn't exist (station/user)

## 🔧 Quick Fixes

### Fix 1: Clear Local Storage and Re-login
```javascript
// In browser console, run:
localStorage.clear();
// Then login again
```

### Fix 2: Verify Backend is Running
```powershell
# Check if backend is running on port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

### Fix 3: Test API Directly with curl
```powershell
# Get your token (from browser console after login):
# localStorage.getItem('token')

# Test the endpoint:
curl -X GET http://localhost:5000/api/vehicles/pending-approval `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -H "Content-Type: application/json"
```

### Fix 4: Register a Test Vehicle First
If there are no pending vehicles in the database:

1. Login as **Admin** (`admin@respondr.lk` / `admin123`)
2. Go to **Registration Management** tab
3. Click **Start Registration** on Vehicle card
4. Fill in the form and submit
5. Now login as **Supervisor** and check Pending Approvals

## 🎯 Common Root Causes

### 1. **No Pending Vehicles**
- **Symptom:** Page loads but shows "No pending approvals"
- **Cause:** Database has no vehicles with `isActive: false`
- **Fix:** Register a new vehicle through Admin dashboard

### 2. **Token Expired**
- **Symptom:** 401 Unauthorized error
- **Cause:** JWT token expired (default: 24 hours)
- **Fix:** Logout and login again

### 3. **Wrong User Role**
- **Symptom:** 403 Forbidden error
- **Cause:** Logged in as wrong user type (not Supervisor/Admin)
- **Fix:** Login with supervisor or admin credentials

### 4. **Backend Not Running**
- **Symptom:** "Failed to fetch" or "Network error"
- **Cause:** Backend server stopped or crashed
- **Fix:** Restart backend: `cd apps/backend && node server.js`

### 5. **CORS Issue**
- **Symptom:** CORS policy error in console
- **Cause:** Frontend and backend on different origins
- **Fix:** Check CORS configuration in `server.js`

### 6. **Database Connection Lost**
- **Symptom:** 500 Internal Server Error
- **Cause:** MongoDB Atlas connection failed
- **Fix:** Check `.env` file and network connection

## 📊 Test Data Setup

If you need test data, run this in MongoDB:

```javascript
// Connect to your MongoDB and run:
db.vehicles.insertOne({
  registration: {
    plateNumber: "TEST-1234",
    vehicleType: "Ambulance",
    make: "Toyota",
    model: "Hiace",
    year: 2023,
    registrationDate: new Date()
  },
  status: {
    operational: "maintenance",  // <-- This marks it as pending
    currentStatus: "available",
    currentLocation: {
      type: "Point",
      coordinates: [79.8612, 6.9271]
    },
    lastLocationUpdate: new Date()
  },
  equipment: { items: [] },
  station: {
    homeStationId: ObjectId("YOUR_STATION_ID"),
    currentStationId: ObjectId("YOUR_STATION_ID")
  },
  isActive: false,  // <-- This marks it as pending approval
  audit: {
    createdBy: ObjectId("YOUR_ADMIN_USER_ID"),
    createdAt: new Date(),
    updatedAt: new Date()
  }
});
```

## 🚀 After Debugging

Once you've identified the issue, please share:

1. **What you saw in the browser console** (copy the exact error messages)
2. **What you saw in the backend terminal** (copy the log messages)
3. **Which scenario matched** your situation

This will help me provide a more specific fix!

## 📝 Files Modified

### Frontend:
```
apps/web/src/components/supervisor/SupervisorPendingApprovals.tsx
```
- Added detailed console logging
- Enhanced error messages
- Improved response format handling

### Backend:
```
apps/backend/controllers/vehicleController.js
```
- Added detailed console logging
- Enhanced error details
- Improved query logging

## ✅ Next Steps

1. **Open browser console** (F12)
2. **Login as supervisor**
3. **Go to Pending Approvals tab**
4. **Copy the console output** and share it with me
5. **Copy the backend terminal output** and share it with me

With this information, I can provide a precise fix! 🎯

---

**Updated:** October 3, 2025  
**Status:** Enhanced logging deployed  
**Both servers:** Running (backend: port 5000, frontend: port 3000)
