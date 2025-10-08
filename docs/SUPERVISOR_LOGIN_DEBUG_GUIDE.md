# Supervisor Login Debug Guide

## 🔍 Troubleshooting Steps

### Step 1: Check Browser Console

1. **Open Developer Tools**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **Go to Console tab**
3. **Look for error messages** - they will be in red
4. **Look for debug logs**:
   - `ModularSupervisorDashboard - User:` - Should show your user object
   - `ModularSupervisorDashboard - Active Section:` - Should show "overview"
   - `SupervisorPendingApprovals - Mounted` - Should appear when you click Pending Approvals

### Step 2: Check Network Tab

1. **Open Developer Tools**: Press `F12`
2. **Go to Network tab**
3. **Try to login again**
4. **Look for**:
   - `POST /api/auth/login` - Should return status 200
   - Response should include `token` and `user` object with `role: "Supervisor"`

### Step 3: Check LocalStorage

1. **Open Developer Tools**: Press `F12`
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Click on Local Storage** → `http://localhost:3000`
4. **Verify these keys exist**:
   - `token`: Should have a long JWT string
   - `user`: Should be a JSON string with your user data

### Step 4: Verify User Role

1. In the Console tab, type:
```javascript
JSON.parse(localStorage.getItem('user'))
```
2. **Press Enter**
3. **Check the output** - the `role` field should be exactly `"Supervisor"` (case-sensitive!)

## 🐛 Common Issues & Solutions

### Issue 1: "Access Denied" Message

**Cause**: User role doesn't match "Supervisor" exactly

**Solution**:
1. Check if role is "supervisor" (lowercase) instead of "Supervisor"
2. Update in database to match exactly: `"Supervisor"`

**Quick Fix** (run in browser console):
```javascript
const user = JSON.parse(localStorage.getItem('user'));
user.role = 'Supervisor';
localStorage.setItem('user', JSON.stringify(user));
location.reload();
```

### Issue 2: Blank Screen / Loading Forever

**Cause**: User object is null or authentication failed

**Solution**:
1. Clear browser cache and localStorage
2. Login again

**Quick Fix** (run in browser console):
```javascript
localStorage.clear();
location.reload();
```

### Issue 3: "vehicleApprovals.map is not a function"

**Cause**: Already fixed! But if you see this:

**Solution**:
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard reload: `Ctrl+F5` or `Ctrl+Shift+R`
3. The fix ensures arrays are always initialized properly

### Issue 4: 401 Unauthorized Error

**Cause**: Token expired or invalid

**Solution**:
1. Logout and login again
2. Check backend is running on port 5000

### Issue 5: Cannot Read Property of Undefined

**Cause**: Component trying to access user properties before loaded

**Solution**:
- Already added safety checks in the code
- Component now shows loading state until user is available

## 📋 Backend Checklist

Make sure backend is running properly:

```powershell
# Navigate to backend
cd apps\backend

# Start the server
npm start
```

**Expected output**:
```
Server running on port 5000
MongoDB connected successfully
```

## 🔐 Test Credentials

Try logging in with a test supervisor account. If you don't have one, create it:

### Option 1: Using Postman/Thunder Client

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "personal": {
    "firstName": "Test",
    "lastName": "Supervisor",
    "email": "supervisor@test.com",
    "phone": "1234567890"
  },
  "authentication": {
    "username": "supervisor",
    "password": "Test123!",
    "role": "Supervisor"
  }
}
```

### Option 2: Using MongoDB Compass

1. Connect to your MongoDB database
2. Find the `users` collection
3. Check existing supervisor user or create one
4. Ensure `role` field is exactly `"Supervisor"`

## 🧪 Quick Test Sequence

1. **Clear everything**:
   ```javascript
   localStorage.clear();
   ```

2. **Reload page**: `Ctrl+F5`

3. **Login as Supervisor**

4. **Check console for debug logs**:
   - Should see user object logged
   - No error messages in red

5. **Click through tabs**:
   - Overview ✓
   - Equipment Management ✓
   - Shift Management ✓
   - Pending Approvals ✓

## 🔧 Manual Fix Script

If login still doesn't work, run this in browser console AFTER logging in:

```javascript
// Check authentication state
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;

console.log('Token exists:', !!token);
console.log('User exists:', !!user);
console.log('User role:', user?.role);
console.log('Is Supervisor:', user?.role === 'Supervisor');

// If role is wrong, fix it
if (user && user.role !== 'Supervisor') {
  console.warn('Fixing role from', user.role, 'to Supervisor');
  user.role = 'Supervisor';
  localStorage.setItem('user', JSON.stringify(user));
  console.log('Role fixed! Reloading page...');
  setTimeout(() => location.reload(), 1000);
}
```

## 📱 What to Send Me for Further Debug

If issue persists, please send:

1. **Console output** (screenshot or copy text)
2. **Network tab** - Login request/response
3. **User object** from localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('user'))
   ```
4. **Exact error message** you see
5. **What happens** when you try to login:
   - Redirects to dashboard? → Yes/No
   - Shows error message? → What message?
   - Blank screen? → Yes/No
   - Access denied? → Yes/No

## ✅ Expected Behavior

**Successful login flow**:

1. Enter credentials on `/login`
2. Click "Login" button
3. **Console logs**:
   ```
   POST http://localhost:5000/api/auth/login 200 OK
   AuthContext initialized
   ModularSupervisorDashboard - User: {role: "Supervisor", ...}
   ModularSupervisorDashboard - Active Section: overview
   ```
4. **Page redirects** to `/dashboard`
5. **Sees Supervisor Dashboard** with 4 tabs:
   - 📊 Overview
   - ⚙️ Equipment Management
   - 📅 Shift Management
   - ✓ Pending Approvals
6. **Can click between tabs** without errors

---

**Need Help?**
Run the diagnostic script above and share the output!
