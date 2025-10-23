# Report Generation Troubleshooting Guide

## Issue: "Failed to generate report" Error

### ✅ Fixes Applied:

#### 1. **Backend Validation Added** (`reportController.js`)
Added validation to check for required fields:
- Sections array must not be empty
- Status array must not be empty
- Time period is required

#### 2. **Status Filter Logic Fixed** (`reportController.js`)
Updated to handle any number of status values:
```javascript
// Before (only handled 1 or 2):
if (status.length === 1) { ... }
else if (status.length === 2) { ... }

// After (handles any number):
if (status && status.length > 0) {
  if (status.length === 1) { ... }
  else { ... }
}
```

#### 3. **Enhanced Error Logging**
- Frontend: Added detailed console logging
- Backend: Added error stack trace logging

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console
Open your browser's Developer Tools (F12) and look for these logs:

**Before clicking Generate:**
- Nothing special

**After clicking Generate:**
```
🔍 Generating report with payload: {...}
🔍 API URL: http://localhost:5000/api
```

**On Success:**
```
✅ Report response: {...}
✅ Report generated successfully
```

**On Error:**
```
❌ Error generating report: ...
❌ Error response: {...}
❌ Error status: 400/401/500
❌ Error message: ...
```

### Step 2: Check Backend Console
Look for these logs in your backend terminal:

**On Request:**
```
📊 Generating report with filters: {...}
📅 Date range: { startDate: ..., endDate: ... }
```

**On Success:**
```
📊 Vehicle data: X records
📊 Crew data: Y records
✅ Report generated successfully
```

**On Error:**
```
❌ Report generation error: ...
❌ Error stack: ...
```

---

## 🐛 Common Issues and Solutions

### Issue 1: "Network Error" or "Failed to generate report"
**Cause:** Backend server is not running or wrong API URL

**Solution:**
1. Check if backend is running: `http://localhost:5000`
2. Check browser console for the API URL
3. Verify `.env` file has correct `REACT_APP_API_URL`

### Issue 2: "401 Unauthorized"
**Cause:** Not logged in or token expired

**Solution:**
1. Log out and log back in as Admin
2. Check localStorage for token: `localStorage.getItem('token')`
3. Verify you're logged in as Admin role

### Issue 3: "Please select at least one section"
**Cause:** No sections selected (both checkboxes unchecked)

**Solution:**
- Check at least one: ☑ Vehicles or ☑ Crew

### Issue 4: "Please select at least one status"
**Cause:** No status selected (both checkboxes unchecked)

**Solution:**
- Check at least one: ☑ Approved or ☑ Rejected

### Issue 5: "No data found" (but not an error)
**Cause:** No registrations match the filters

**Solution:**
- Try a longer time period (year instead of day)
- Select "Both" for status
- Check if database has any registrations

### Issue 6: Server crashes or 500 error
**Cause:** Database connection issue or data format problem

**Solution:**
1. Check MongoDB connection in backend logs
2. Verify Vehicle and Crew models exist
3. Check if data has correct schema structure

---

## 🧪 Testing the API

### Option 1: Use the Test Script
```bash
# Get your JWT token from browser localStorage
# Then run:
cd apps/backend
node test-report-api.js YOUR_JWT_TOKEN_HERE
```

### Option 2: Use Thunder Client / Postman

**1. Get Summary:**
```
GET http://localhost:5000/api/reports/summary
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

**2. Generate Report:**
```
POST http://localhost:5000/api/reports/generate
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "timePeriod": "month",
  "sections": ["vehicle", "crew"],
  "status": ["approved", "rejected"]
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "generatedAt": "2024-10-21T...",
    "filters": {...},
    "data": {
      "vehicles": [...],
      "crew": [...],
      "vehicleCount": 5,
      "crewCount": 10,
      "vehicleStats": {...},
      "crewStats": {...}
    }
  }
}
```

---

## 📋 Quick Checklist

Before reporting an issue, verify:

- [ ] Backend server is running (check terminal)
- [ ] Frontend is running (check browser)
- [ ] Logged in as Admin user
- [ ] At least one section selected (Vehicle or Crew)
- [ ] At least one status selected (Approved or Rejected)
- [ ] Time period is selected
- [ ] Browser console shows detailed error logs
- [ ] Backend terminal shows request logs
- [ ] Database has some vehicle/crew registrations

---

## 🔧 Manual Testing Steps

1. **Start Backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```
   Should see: "Connected to MongoDB" and "Server running on port 5000"

2. **Start Frontend:**
   ```bash
   cd apps/web
   npm start
   ```
   Should open browser at `http://localhost:3000`

3. **Login as Admin:**
   - Use admin credentials
   - Verify role is "Admin" in navbar

4. **Navigate to Report Tab:**
   - Admin Dashboard → "Report Generate" tab

5. **Generate Simple Report:**
   - Keep defaults (Month, Both sections, Both status)
   - Click "Generate Report"
   - Check console for logs

6. **If Successful:**
   - Preview tables should appear
   - "Download PDF" button should be green
   - Click to download and verify PDF

7. **If Failed:**
   - Check browser console for error details
   - Check backend terminal for error logs
   - Follow troubleshooting steps above

---

## 📞 Need More Help?

If the issue persists after following all steps:

1. **Collect Information:**
   - Browser console logs (full error)
   - Backend terminal logs (full error)
   - Filter values you're using
   - Your JWT token role (Admin?)

2. **Check Documentation:**
   - `docs/REPORT_GENERATION_FEATURE.md`
   - `docs/REPORT_TESTING_GUIDE.md`

3. **Common Solutions:**
   - Restart both backend and frontend
   - Clear browser cache and localStorage
   - Re-login as Admin
   - Check if database has any data

---

## ✅ Summary of Changes

**Files Modified:**
1. `apps/backend/controllers/reportController.js`
   - Added validation for sections, status, and timePeriod
   - Fixed status filter to handle any number of values
   - Enhanced error logging

2. `apps/web/src/components/admin/ReportGenerationSection.tsx`
   - Added detailed console logging
   - Better error message display

**Files Created:**
1. `apps/backend/test-report-api.js`
   - API testing script

2. `docs/REPORT_TROUBLESHOOTING.md`
   - This file

---

**Last Updated:** October 21, 2025  
**Status:** Ready for testing
