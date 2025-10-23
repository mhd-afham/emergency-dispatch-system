# Quick Testing Guide - Report Generation Feature

## Prerequisites
1. Backend server running on port 5000
2. Web app running on port 3000
3. MongoDB Atlas connected
4. Logged in as Admin user

---

## Test Scenarios

### 🧪 Test 1: Summary Statistics
**Steps:**
1. Navigate to Admin Dashboard
2. Click on "Report Generate" tab
3. Observe the 4 summary cards at the top

**Expected Result:**
- Total Vehicles count displayed
- Total Crew count displayed
- Total Approved count displayed
- Total Rejected count displayed

---

### 🧪 Test 2: Monthly Report (Default)
**Steps:**
1. Keep default selections:
   - Time Period: Month
   - Sections: Both (Vehicle + Crew)
   - Status: Both (Approved + Rejected)
2. Click "Generate Report"
3. Wait for loading to complete
4. Review the preview

**Expected Result:**
- Loading spinner appears
- Report preview shows:
  - Vehicle table with data
  - Crew table with data
  - Statistics for both sections
- "Download PDF" button appears

---

### 🧪 Test 3: Custom Date Range
**Steps:**
1. Select "Custom" time period
2. Enter Start Date: 2024-01-01
3. Enter End Date: 2024-12-31
4. Click "Generate Report"

**Expected Result:**
- Report shows registrations within date range
- Statistics reflect the filtered data

---

### 🧪 Test 4: Vehicle Only Report
**Steps:**
1. Time Period: Week
2. Uncheck "Crew" checkbox
3. Keep "Vehicle" checked
4. Status: Both
5. Click "Generate Report"

**Expected Result:**
- Only vehicle table displayed
- No crew table shown
- Vehicle statistics displayed
- Count shows correct number

---

### 🧪 Test 5: Crew Only Report
**Steps:**
1. Time Period: Month
2. Uncheck "Vehicle" checkbox
3. Keep "Crew" checked
4. Status: Both
5. Click "Generate Report"

**Expected Result:**
- Only crew table displayed
- No vehicle table shown
- Crew statistics displayed
- Count shows correct number

---

### 🧪 Test 6: Approved Only Report
**Steps:**
1. Time Period: Month
2. Sections: Both
3. Uncheck "Rejected" status
4. Keep "Approved" checked
5. Click "Generate Report"

**Expected Result:**
- Only approved registrations shown
- All status badges show "approved" (green)
- Statistics show only approved counts

---

### 🧪 Test 7: Rejected Only Report
**Steps:**
1. Time Period: Month
2. Sections: Both
3. Uncheck "Approved" status
4. Keep "Rejected" checked
5. Click "Generate Report"

**Expected Result:**
- Only rejected registrations shown
- All status badges show "rejected" (red)
- Statistics show only rejected counts

---

### 🧪 Test 8: Individual Vehicle Search
**Steps:**
1. Select "Individual Vehicle" report type
2. Enter a valid Plate Number (e.g., "CAB-1234")
3. Click "Generate Report"

**Expected Result:**
- Single vehicle record displayed (if exists)
- All details shown: plate, type, make/model, year, status
- Statistics for this vehicle

---

### 🧪 Test 9: Individual Crew Search
**Steps:**
1. Select "Individual Crew" report type
2. Enter a valid Employee ID (e.g., "EMP123456")
3. Click "Generate Report"

**Expected Result:**
- Single crew record displayed (if exists)
- All details shown: employee ID, name, role, level, status
- Statistics for this crew member

---

### 🧪 Test 10: PDF Download - General Report
**Steps:**
1. Generate any general report (e.g., monthly, both sections)
2. Wait for preview to load
3. Click "Download PDF" button
4. Check downloads folder

**Expected Result:**
- PDF file downloads successfully
- Filename: `registrations_report_[date].pdf`
- PDF contains:
  - Header with system name
  - Filter information
  - Vehicle table (if included)
  - Crew table (if included)
  - Statistics
  - Page numbers

---

### 🧪 Test 11: PDF Download - Individual Report
**Steps:**
1. Generate individual vehicle or crew report
2. Wait for preview to load
3. Click "Download PDF" button
4. Check downloads folder

**Expected Result:**
- PDF file downloads successfully
- Filename: `vehicle_[plate]_report.pdf` or `crew_[employeeId]_report.pdf`
- PDF contains individual record details

---

### 🧪 Test 12: Validation - No Sections Selected
**Steps:**
1. Select "General Report" type
2. Uncheck both "Vehicle" and "Crew"
3. Click "Generate Report"

**Expected Result:**
- Error message displayed
- Message: "Please select at least one section (Vehicle or Crew)"
- Report not generated

---

### 🧪 Test 13: Validation - No Status Selected
**Steps:**
1. Select "General Report" type
2. Sections: Both
3. Uncheck both "Approved" and "Rejected"
4. Click "Generate Report"

**Expected Result:**
- Error message displayed
- Message: "Please select at least one status (Approved or Rejected)"
- Report not generated

---

### 🧪 Test 14: Validation - Custom Date Invalid
**Steps:**
1. Select "Custom" time period
2. Leave Start Date empty OR End Date empty
3. Click "Generate Report"

**Expected Result:**
- Error message displayed
- Message: "Please select both start and end dates for custom range"
- Report not generated

---

### 🧪 Test 15: Validation - Start Date After End Date
**Steps:**
1. Select "Custom" time period
2. Start Date: 2024-12-31
3. End Date: 2024-01-01
4. Click "Generate Report"

**Expected Result:**
- Error message displayed
- Message: "Start date must be before end date"
- Report not generated

---

### 🧪 Test 16: Validation - Individual Search Empty
**Steps:**
1. Select "Individual Vehicle" type
2. Leave Plate Number field empty
3. Click "Generate Report"

**Expected Result:**
- Error message displayed
- Message: "Please enter a plate number for individual vehicle search"
- Report not generated

---

### 🧪 Test 17: No Data Found
**Steps:**
1. Select Custom date range: 2020-01-01 to 2020-01-31 (very old dates)
2. Sections: Both
3. Status: Approved
4. Click "Generate Report"

**Expected Result:**
- Preview shows "No data found" message
- Icon and message displayed
- No tables shown
- "Download PDF" button appears but PDF would be empty

---

### 🧪 Test 18: Clear Report
**Steps:**
1. Generate any report
2. Wait for preview
3. Click "Clear" button

**Expected Result:**
- Preview area disappears
- Button changes back to "Generate Report"
- Can generate new report with different filters

---

### 🧪 Test 19: Quick Actions from Overview
**Steps:**
1. Go to "Overview" tab
2. Scroll to "Quick Actions" section
3. Click "📊 Generate Reports"

**Expected Result:**
- Switches to "Report Generate" tab
- Filter form displayed
- Ready to generate report

---

### 🧪 Test 20: Tab Navigation
**Steps:**
1. Generate and preview a report
2. Switch to "Overview" tab
3. Switch back to "Report Generate" tab

**Expected Result:**
- Report preview is cleared (state reset)
- Back to filter form
- Can generate new report

---

## API Testing (Optional - Using Thunder Client/Postman)

### Test API 1: Generate Report
**Request:**
```
POST http://localhost:5000/api/reports/generate
Authorization: Bearer [your-jwt-token]
Content-Type: application/json

Body:
{
  "timePeriod": "month",
  "sections": ["vehicle", "crew"],
  "status": ["approved", "rejected"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "generatedAt": "...",
    "filters": {...},
    "data": {
      "vehicles": [...],
      "crew": [...],
      "vehicleStats": {...},
      "crewStats": {...}
    }
  }
}
```

---

### Test API 2: Get Summary
**Request:**
```
GET http://localhost:5000/api/reports/summary
Authorization: Bearer [your-jwt-token]
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "vehicles": {
      "total": 45,
      "approved": 38,
      "rejected": 5,
      "pending": 2
    },
    "crew": {
      "total": 67,
      "approved": 60,
      "rejected": 4,
      "pending": 3
    },
    "overall": {
      "approved": 98,
      "rejected": 9,
      "pending": 5
    }
  }
}
```

---

## Test Results Template

### Test Session Information
- **Date:** [Your Date]
- **Tester:** [Your Name]
- **Environment:** [Dev/Staging/Prod]
- **Browser:** [Chrome/Firefox/Edge/Safari]
- **Backend:** [Running/Not Running]
- **Database:** [Connected/Not Connected]

### Results Table

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Summary Statistics | ⬜ Pass / ⬜ Fail | |
| 2 | Monthly Report | ⬜ Pass / ⬜ Fail | |
| 3 | Custom Date Range | ⬜ Pass / ⬜ Fail | |
| 4 | Vehicle Only | ⬜ Pass / ⬜ Fail | |
| 5 | Crew Only | ⬜ Pass / ⬜ Fail | |
| 6 | Approved Only | ⬜ Pass / ⬜ Fail | |
| 7 | Rejected Only | ⬜ Pass / ⬜ Fail | |
| 8 | Individual Vehicle | ⬜ Pass / ⬜ Fail | |
| 9 | Individual Crew | ⬜ Pass / ⬜ Fail | |
| 10 | PDF Download General | ⬜ Pass / ⬜ Fail | |
| 11 | PDF Download Individual | ⬜ Pass / ⬜ Fail | |
| 12 | Validation No Sections | ⬜ Pass / ⬜ Fail | |
| 13 | Validation No Status | ⬜ Pass / ⬜ Fail | |
| 14 | Validation Custom Empty | ⬜ Pass / ⬜ Fail | |
| 15 | Validation Date Order | ⬜ Pass / ⬜ Fail | |
| 16 | Validation Individual Empty | ⬜ Pass / ⬜ Fail | |
| 17 | No Data Found | ⬜ Pass / ⬜ Fail | |
| 18 | Clear Report | ⬜ Pass / ⬜ Fail | |
| 19 | Quick Actions | ⬜ Pass / ⬜ Fail | |
| 20 | Tab Navigation | ⬜ Pass / ⬜ Fail | |

### Issues Found
1. [Issue description if any]
2. [Issue description if any]

### Overall Result
- [ ] All tests passed
- [ ] Some tests failed (see notes above)
- [ ] Ready for production
- [ ] Needs fixes

---

## Common Issues & Solutions

### Issue: Cannot log in as Admin
**Solution:** Use the seeded admin credentials or create admin user via backend

### Issue: No data displayed
**Solution:** Ensure database has vehicle/crew registrations with approved/rejected status

### Issue: PDF not downloading
**Solution:** Check browser permissions for downloads

### Issue: 401 Unauthorized error
**Solution:** Ensure JWT token is valid and user is Admin role

### Issue: 500 Server Error
**Solution:** Check backend console logs for detailed error message

### Issue: Summary cards show 0
**Solution:** Seed database with sample data or ensure registrations exist

---

**Happy Testing! 🧪✅**
