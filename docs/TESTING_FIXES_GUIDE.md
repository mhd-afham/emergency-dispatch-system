# Testing Guide for Form & Data Flow Fixes

**Date:** October 4, 2025  
**Branch:** inusha/vehicle-registration  
**Issues Fixed:**
1. ✅ Delete confirmations now use custom notification modals
2. ✅ Forms should now close properly after success notification
3. 🔍 Data saving to database (needs testing)
4. 🔍 Data appearing in supervisor dashboard (needs testing)

---

## 🎯 What Was Changed

### 1. Delete Confirmation Modals (RegistrationFormsView.tsx)
- **Before:** Ugly browser `window.confirm()` and `alert()` dialogs
- **After:** Professional custom notification modals with yellow warning → green success/red error flow
- **Files Modified:** `apps/web/src/components/RegistrationFormsView.tsx`

### 2. Form Closing After Success (Both Wizards)
- **Before:** Success notification appeared but form stayed open
- **After:** Added `setTimeout` delay and console logging to ensure proper unmounting
- **Files Modified:** 
  - `apps/web/src/components/admin/VehicleRegistrationWizard.tsx`
  - `apps/web/src/components/admin/CrewRegistrationWizard.tsx`
  - `apps/web/src/components/admin/RegistrationManagement.tsx`

### 3. Console Logging for Debugging
- **Added:** Comprehensive logging to track:
  - Form submission data
  - API request URLs
  - Response status and data
  - Success/error callback execution
  - Form unmounting flow

---

## 🧪 Testing Instructions

### **Test 1: Delete Confirmations in Saved Drafts**

**Objective:** Verify delete confirmations now use custom modals

**Steps:**
1. Open your web app in the browser
2. Log in as Admin or Supervisor
3. Navigate to "Saved and Drafted" section (Registration Forms)
4. Click **Delete** button on any draft

**Expected Results:**
- ⚠️ **Yellow warning modal** appears asking "Are you sure you want to delete this draft?"
- Two buttons: **Confirm** and **Cancel**
- Click **Confirm**:
  - ✅ **Green success modal** appears: "Draft deleted successfully"
  - Click **OK** → modal closes, draft disappears from list
- Click **Cancel**:
  - Modal closes, draft remains in list

**If this works:** ✅ Issue #1 is FIXED!

---

### **Test 2: Form Closing After Registration**

**Objective:** Verify forms properly close after success notification

**Steps:**

#### **A. Vehicle Registration Test**
1. Log in as Admin or Supervisor
2. Navigate to Registration Management
3. Click **"Register New Vehicle"**
4. Fill out the form with valid data:
   - Plate Number: `CAB-1234`
   - Vehicle Type: Select any
   - Make: `Toyota`
   - Model: `Ambulance`
   - Year: `2023`
   - Home Station: Select any
   - Equipment: Add at least one item
5. Click **"Register"** button

**Expected Results:**
1. ✅ Green success notification appears
2. **OPEN BROWSER CONSOLE** (F12) and look for these logs:
   ```
   ✅ Vehicle registration successful, clearing form data...
   User clicked OK on success notification - calling onSuccess callback...
   Calling onSuccess() to close form...
   🎯 RegistrationManagement.handleSuccess called - switching to overview mode
   ```
3. Click **OK** on the success notification
4. **CRITICAL:** Form should **completely disappear** and you should see the "Registration Management" overview with two cards (Vehicle/Crew)

#### **B. Crew Registration Test**
1. From Registration Management overview
2. Click **"Register New Crew Member"**
3. Fill out the form with valid data:
   - Employee ID: `EMP001`
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Phone: `0771234567`
   - Role: Select any
   - Certification Level: Select any
   - Hire Date: Any valid date
   - Emergency Contact: Fill all fields
4. Click **"Register"** button

**Expected Results:**
1. ✅ Green success notification appears
2. **OPEN BROWSER CONSOLE** (F12) and look for these logs:
   ```
   ✅ Crew registration successful, clearing form data...
   User clicked OK on success notification - calling onSuccess callback...
   Calling onSuccess() to close form...
   🎯 RegistrationManagement.handleSuccess called - switching to overview mode
   ```
3. Click **OK** on the success notification
4. **CRITICAL:** Form should **completely disappear** and return to overview

**If forms close properly:** ✅ Issue #2 is FIXED!  
**If forms stay open:** ❌ Check browser console for errors and share screenshot

---

### **Test 3: Data Saving to Database**

**Objective:** Verify registration data is actually saved to MongoDB

#### **A. Frontend Check**
1. Complete a vehicle or crew registration (from Test 2 above)
2. **OPEN BROWSER CONSOLE** (F12)
3. Look for these logs:

**Vehicle Registration Logs:**
```javascript
🚀 Submitting vehicle registration: {plateNumber: "CAB-1234", vehicleType: "Ambulance", ...}
🌐 API URL: http://localhost:5000/api/vehicles
📡 Response status: 201 Created
📦 Response data: {success: true, message: "Vehicle registration submitted successfully...", data: {...}}
```

**Crew Registration Logs:**
```javascript
🚀 Submitting crew registration: {employeeId: "EMP001", firstName: "John", ...}
🌐 API URL: http://localhost:5000/api/crew
📡 Response status: 201 Created
📦 Response data: {success: true, message: "Crew member registered successfully...", data: {...}}
```

**Good Signs:**
- ✅ Status: `201 Created` or `200 OK`
- ✅ `success: true` in response
- ✅ Response data contains the created vehicle/crew object

**Bad Signs:**
- ❌ Status: `500 Internal Server Error`
- ❌ Status: `400 Bad Request`
- ❌ Status: `401 Unauthorized`
- ❌ `success: false` in response

#### **B. Backend Check**
1. Open the terminal where your backend is running
2. Look for logs like:
   ```
   🚛 Registering new vehicle - Registered by: [Your Name]
   ✅ Vehicle registration successful: CAB-1234
   ```
   OR
   ```
   👤 Registering new crew member - Registered by: [Your Name]
   ✅ Crew registration successful: EMP001
   ```

#### **C. Database Check (MongoDB Compass or CLI)**
1. Open MongoDB Compass or use MongoDB CLI
2. Connect to your database
3. Navigate to the `vehicles` or `crew` collections
4. Look for the newly created record
5. **Check these fields:**
   - Vehicle: `isActive: false` (pending approval)
   - Vehicle: `status.operational: "maintenance"`
   - Crew: `isActive: false` (pending approval)
   - Crew: Has `audit.createdBy` field

**If data appears in database:** ✅ Issue #3 is FIXED!  
**If data is missing:** ❌ Share backend console logs and browser console errors

---

### **Test 4: Data Appearing in Supervisor Dashboard**

**Objective:** Verify registered data shows in pending approvals

#### **Steps:**
1. Complete a vehicle or crew registration (from Test 2)
2. **Log out** from Admin account
3. **Log in as Supervisor** (or stay logged in if you're already a Supervisor)
4. Navigate to **Supervisor Dashboard**
5. Look for **"Pending Approvals"** section

**Expected Results:**
- You should see the newly registered vehicle/crew in the pending approvals list
- Vehicle should show: Plate Number, Type, Make, Model, Year
- Crew should show: Name, Employee ID, Role, Certification Level
- Each item should have **Approve** and **Reject** buttons

**Check Browser Console:**
```javascript
📋 Fetching vehicles pending approval for: [Supervisor Name]
📊 Found X pending vehicles
```
OR
```javascript
📋 Fetching crew pending approval for: [Supervisor Name]
📊 Found X pending crew members
```

**If data appears:** ✅ Issue #4 is FIXED!  
**If data is missing:**
1. Check backend logs for API errors
2. Check browser Network tab (F12 → Network)
3. Look for `/api/vehicles/pending-approval` or `/api/crew/pending-approval` requests
4. Check response: should return array with your data

---

## 🐛 Troubleshooting Guide

### **Issue: Form doesn't close after clicking OK**

**Check:**
1. Browser console for JavaScript errors
2. Make sure you see these logs:
   ```
   User clicked OK on success notification - calling onSuccess callback...
   Calling onSuccess() to close form...
   🎯 RegistrationManagement.handleSuccess called - switching to overview mode
   ```
3. If logs appear but form stays: The notification modal might be blocking the view
   - Try refreshing the page
   - Check if clicking outside the modal closes it

**If logs don't appear:**
- The `onConfirm` callback isn't firing
- Check browser console for errors

---

### **Issue: "Failed to register" error**

**Common Causes:**

1. **401 Unauthorized:**
   - Your JWT token expired
   - Solution: Log out and log back in

2. **400 Bad Request:**
   - Missing required fields
   - Invalid data format (e.g., wrong plate number format)
   - Check backend logs for specific error message

3. **500 Internal Server Error:**
   - Backend database connection issue
   - AuditLog validation error
   - Check backend terminal for error stack trace

4. **Network Error:**
   - Backend server not running
   - Solution: Restart backend with `npm start` in `apps/backend`

---

### **Issue: Data not appearing in database**

**Check:**
1. MongoDB server is running
2. Database connection string in `.env` is correct
3. Backend successfully connected to database (check startup logs)
4. You have the correct database name
5. Collection names: `vehicles` and `crew` (lowercase)

**MongoDB Connection Check:**
```javascript
// Backend startup should show:
✅ MongoDB Connected: emergency-dispatch-system
```

---

### **Issue: Data in database but not in dashboard**

**Check:**
1. API endpoint `/api/vehicles/pending-approval` returns data
   - Test in browser: http://localhost:5000/api/vehicles/pending-approval
   - Should return JSON array
2. Frontend is making the correct API call
   - Browser Network tab → Look for the API request
   - Check response status and data
3. Query logic: pending vehicles have `isActive: false` and `status.operational: "maintenance"`
4. Supervisor role has permission to view pending approvals

---

## 📊 Summary Checklist

After testing, mark what works:

- [ ] **Test 1:** Delete confirmations use custom modals
- [ ] **Test 2A:** Vehicle form closes after success
- [ ] **Test 2B:** Crew form closes after success
- [ ] **Test 3A:** Frontend logs show successful API response
- [ ] **Test 3B:** Backend logs show successful registration
- [ ] **Test 3C:** Data appears in MongoDB database
- [ ] **Test 4:** Pending approvals show in supervisor dashboard

---

## 🎯 Next Steps Based on Results

### **If ALL tests pass:** 🎉
You're done! Everything is working correctly.

### **If Test 1 fails:**
Share screenshot of what happens when you click delete.

### **If Test 2 fails (forms don't close):**
Share:
1. Screenshot of form after clicking OK
2. Browser console logs (full screenshot)
3. Any error messages

### **If Test 3 fails (data not saving):**
Share:
1. Browser console logs (full screenshot showing API request/response)
2. Backend terminal logs (copy/paste text)
3. MongoDB Compass screenshot showing collections

### **If Test 4 fails (data not in dashboard):**
Share:
1. Browser Network tab screenshot (filter by "pending")
2. API response body
3. Screenshot of supervisor dashboard

---

## 🔍 Quick Debug Commands

**Check if backend is running:**
```powershell
netstat -ano | findstr :5000
```

**Restart backend:**
```powershell
cd apps\backend
npm start
```

**Check MongoDB connection:**
```powershell
# In backend terminal, you should see:
MongoDB Connected: <database-name>
```

**Test API endpoint directly:**
Open browser: `http://localhost:5000/api/vehicles/pending-approval`
(You'll need to be logged in or use Postman with JWT token)

---

## 📝 Report Template

**Copy this and fill it out after testing:**

```
## Testing Results

**Test 1 - Delete Confirmations:**
- Status: [PASS/FAIL]
- Notes: 

**Test 2 - Form Closing:**
- Vehicle Registration: [PASS/FAIL]
- Crew Registration: [PASS/FAIL]
- Console Logs: [Include screenshot or text]

**Test 3 - Data Saving:**
- Frontend Response: [PASS/FAIL]
- Backend Logs: [PASS/FAIL]
- Database Check: [PASS/FAIL]
- Notes:

**Test 4 - Dashboard Display:**
- Status: [PASS/FAIL]
- Notes:

**Overall Status:** [ALL PASS / PARTIAL / ALL FAIL]
```

---

**Good luck with testing! 🚀**
