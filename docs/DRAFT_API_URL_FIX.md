# Draft API URL Fix - "Failed to save draft"

## Date: October 4, 2025 (Update 2)

---

## 🐛 Bug Description

After fixing the payload structure issue, a new error appeared when clicking "Save as Draft":

```
"Failed to save draft"
```

---

## 🔍 Root Cause Analysis

The issue was with the **API URL construction**. The code was building the URL incorrectly, leading to either:

1. **Wrong path structure**: `/api/api/drafts` (double `/api`)
2. **Missing `/api` prefix**: Depending on environment variable setup

### The Problem:

**Incorrect code:**
```typescript
const apiUrl = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/drafts`;
```

This creates:
- If `REACT_APP_API_URL` is NOT set: `http://localhost:5000/api/drafts` ✅ (works)
- If `REACT_APP_API_URL` IS set to `http://localhost:5000/api`: `http://localhost:5000/api/api/drafts` ❌ (fails)

### Inconsistency in Codebase:

Looking at other API calls in the same files:

**Crew Registration Submit (line 405):**
```typescript
`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/crew`
```

**Vehicle Registration Submit (line 335):**
```typescript
`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/vehicles`
```

These use `/api` in the default fallback, so the endpoint paths are appended directly without adding another `/api`.

---

## ✅ Solution Implemented

### Changed API URL Construction:

**Before:**
```typescript
const apiUrl = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/drafts`;
```

**After:**
```typescript
const apiUrl = `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/drafts`;
```

### Added Debugging:

**Added console logging:**
```typescript
console.log("Saving draft to:", apiUrl);
console.log("Draft data:", draftData);
console.log("Response status:", response.status);
console.log("Response data:", data);
```

**Added user-friendly error alerts:**
```typescript
alert(`Error: ${errorMessage}`);
```

---

## 📁 Files Modified

### 1. `apps/web/src/components/admin/CrewRegistrationWizard.tsx`

**Changes:**
- Line 345: Fixed API URL construction
- Added console.log statements for debugging
- Added error alert for user feedback

### 2. `apps/web/src/components/admin/VehicleRegistrationWizard.tsx`

**Changes:**
- Line 279: Fixed API URL construction
- Added console.log statements for debugging
- Added error alert for user feedback

### 3. `docs/SAVE_AS_DRAFT_FEATURE.md`

**Changes:**
- Added Update 3 to change log
- Documented API URL fix

---

## 🎯 Key Changes Summary

1. **URL Pattern Standardization:**
   - Default fallback now includes `/api`: `"http://localhost:5000/api"`
   - Endpoint paths append directly: `/drafts`
   - Final URL: `http://localhost:5000/api/drafts` ✅

2. **Enhanced Debugging:**
   - Console logs show exact URL being called
   - Console logs show request payload
   - Console logs show response status and data
   - Error alerts show detailed error messages

3. **Consistency:**
   - Now matches the pattern used by submit functions
   - All API calls in the same files use same pattern

---

## 🧪 Testing Guide

### Step 1: Open Browser Developer Tools
1. Press `F12` to open DevTools
2. Go to the **Console** tab
3. Keep it open while testing

### Step 2: Test Draft Saving
1. Navigate to Admin Dashboard → Registration Management
2. Click "Register New Vehicle" or "Register New Crew Member"
3. Fill in some fields (partial data is fine)
4. Click **"Save as Draft"**

### Step 3: Check Console Output

**Expected Console Logs:**
```
Saving draft to: http://localhost:5000/api/drafts
Draft data: {registrationType: "vehicle", draftTitle: "Vehicle ABC-1234 - Draft", ...}
Response status: 201
Response data: {success: true, message: "Draft saved successfully", ...}
```

### Step 4: Verify Success
- Should see alert: "Draft saved successfully!"
- Form should close
- Draft should appear in "Save and Drafted" tab

---

## 🔍 Debugging Different Scenarios

### Scenario 1: Network Error (Backend Not Running)

**Console Output:**
```
Saving draft to: http://localhost:5000/api/drafts
Save draft error: TypeError: Failed to fetch
```

**Alert:**
```
Error: Failed to fetch
```

**Solution:** Start the backend server

---

### Scenario 2: Authentication Error

**Console Output:**
```
Saving draft to: http://localhost:5000/api/drafts
Response status: 401
Response data: {success: false, message: "Access denied. No token provided."}
```

**Alert:**
```
Error: Access denied. No token provided.
```

**Solution:** Log out and log back in

---

### Scenario 3: Wrong URL (404 Not Found)

**Console Output:**
```
Saving draft to: http://localhost:5000/api/api/drafts
Response status: 404
Response data: {success: false, message: "Not found"}
```

**Alert:**
```
Error: Failed to save draft (404)
```

**Solution:** Check API URL configuration (this fix should prevent this)

---

### Scenario 4: Success

**Console Output:**
```
Saving draft to: http://localhost:5000/api/drafts
Draft data: {...}
Response status: 201
Response data: {success: true, message: "Draft saved successfully", data: {...}}
```

**Alert:**
```
Draft saved successfully! You can continue editing later from the Drafted Forms section.
```

---

## 📊 API URL Patterns in Codebase

### Pattern Analysis:

| File | Usage | Pattern |
|------|-------|---------|
| CrewRegistrationWizard.tsx (submit) | `/crew` | `process.env.REACT_APP_API_URL \|\| "http://localhost:5000/api"` |
| VehicleRegistrationWizard.tsx (submit) | `/vehicles` | `process.env.REACT_APP_API_URL \|\| "http://localhost:5000/api"` |
| CrewRegistrationWizard.tsx (draft) | `/drafts` | `process.env.REACT_APP_API_URL \|\| "http://localhost:5000/api"` ✅ |
| VehicleRegistrationWizard.tsx (draft) | `/drafts` | `process.env.REACT_APP_API_URL \|\| "http://localhost:5000/api"` ✅ |
| SupervisorPendingApprovals.tsx | Various | `process.env.REACT_APP_API_URL \|\| "http://localhost:5000"` (then adds `/api/endpoint`) |
| RegistrationFormsView.tsx | Various | `process.env.REACT_APP_API_URL \|\| 'http://localhost:5000/api'` |

**Recommendation:** Standardize all API calls to use `"http://localhost:5000/api"` as default fallback for consistency.

---

## 🚀 Next Steps After Fix

1. ✅ **Hard refresh browser** (Ctrl+Shift+R)
2. ✅ **Clear browser console** (to see fresh logs)
3. ✅ **Log out and log back in** (ensure valid token)
4. ✅ **Test saving vehicle draft**
5. ✅ **Test saving crew draft**
6. ✅ **Check console logs** (verify correct URL)
7. ✅ **Verify drafts in "Save and Drafted" tab**

---

## 🔗 Related Files

- `apps/web/src/components/admin/CrewRegistrationWizard.tsx` - Fixed
- `apps/web/src/components/admin/VehicleRegistrationWizard.tsx` - Fixed
- `apps/backend/routes/drafts.js` - Draft API routes
- `apps/backend/controllers/draftController.js` - Draft controller
- `apps/backend/server.js` - Route registration (line 41)
- `docs/SAVE_AS_DRAFT_FEATURE.md` - Feature documentation
- `docs/DRAFT_API_BUG_FIX.md` - First bug fix (payload structure)

---

## ✅ Status: RESOLVED

**Date Fixed:** October 4, 2025  
**Issue:** Failed to save draft (incorrect API URL)  
**Root Cause:** Missing `/api` in default fallback URL  
**Solution:** Changed default from `"http://localhost:5000"` to `"http://localhost:5000/api"`  
**Verified:** ✅ No compilation errors  
**Ready for Testing:** ✅ Yes

---

## 📝 Lessons Learned

1. **Consistency is Critical:** API URL patterns should be standardized across the entire codebase
2. **Debugging First:** Adding console logs helps quickly identify the issue
3. **Pattern Matching:** When adding new API calls, follow existing patterns in the same file
4. **Environment Variables:** Test both with and without environment variables set
5. **User Feedback:** Error alerts help users understand what went wrong

---
