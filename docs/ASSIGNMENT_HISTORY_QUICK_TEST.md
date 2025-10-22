# Quick Start Guide - Assignment History Testing

## Prerequisites

✅ Backend server running on `http://localhost:5000`
✅ Web app running on `http://localhost:3000`
✅ Logged in as Dispatcher, Supervisor, or Admin

## Quick Test Steps

### 1. Start the Application

**Backend:**

```powershell
cd apps/backend
npm run dev
```

**Frontend (in new terminal):**

```powershell
cd apps/web
npm start
```

### 2. Access the Feature

1. Log in to the web app
2. Navigate to Dispatcher Dashboard
3. Click **"📊 Assignment History"** button in the top navigation bar
4. You should see the Assignment History & Reports page

### 3. Quick Feature Verification

#### Test 1: Page Loads Successfully

- [ ] Page displays without errors
- [ ] Statistics cards show (Total, Completed, Cancelled, Avg Response Time)
- [ ] Search bar is visible
- [ ] "Show Filters" button is present

#### Test 2: View Assignments (If Data Exists)

- [ ] Assignment cards display with all information
- [ ] Assignment ID shows in format: `ASG-YYYYMMDD-XXXXX`
- [ ] Status and Priority badges have correct colors
- [ ] Vehicle and crew information displays
- [ ] Performance metrics show

#### Test 3: Search Functionality

- [ ] Type in search bar (e.g., "ASG-" or incident ID)
- [ ] Results filter as you type
- [ ] Clear search shows all assignments again

#### Test 4: Filter Panel

- [ ] Click "Show Filters" - panel expands
- [ ] Click date presets (Today, Last 7 Days, etc.)
- [ ] Date inputs update correctly
- [ ] Select multiple statuses (Ctrl+Click in dropdown)
- [ ] Results update based on filters
- [ ] "Reset All Filters" clears everything

#### Test 5: Delete Operation (CRUD Demo)

**Note:** Only cancelled assignments can be deleted

1. Find a cancelled assignment (red "CANCELLED" badge)
2. Click the "🗑️ Delete" button
3. Modal appears with assignment details
4. Warning message displays
5. Click "Delete Permanently"
6. Toast notification shows success
7. Assignment removed from list
8. Statistics update

If no cancelled assignments exist:

```javascript
// Create one from Dispatcher Dashboard:
1. Create/select an incident
2. Assign resources
3. Cancel the assignment with a reason
4. Return to Assignment History
5. Now you can delete it
```

#### Test 6: Pagination (If >20 Assignments)

- [ ] Previous/Next buttons appear
- [ ] Page number displays
- [ ] Navigation works correctly
- [ ] Buttons disable appropriately

### 4. Test No Data State

If you see "No assignments found":

- This is correct if no historical assignments exist
- The page is working, just needs data
- Go create some assignments and cancel them!

### 5. Common Issues & Solutions

#### Issue: "Failed to fetch assignments"

**Solution:**

- Check backend is running on port 5000
- Check browser console for actual error
- Verify you're logged in (check localStorage token)
- Try logging out and back in

#### Issue: Empty statistics (all zeros)

**Solution:**

- No assignments in database yet
- Create some assignments from Dispatch Dashboard
- Complete or cancel them to add to history

#### Issue: Can't see Delete button

**Solution:**

- Delete button only shows for CANCELLED assignments
- Cancel an assignment first, then try deleting

#### Issue: Filter dropdown doesn't work

**Solution:**

- Hold Ctrl (Windows) or Cmd (Mac) to select multiple
- Or click one at a time and release
- Check browser console for errors

#### Issue: Page shows but data doesn't load

**Solution:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for `/api/assignments/history` request
5. Check if it returns 200 or error
6. Check Response tab for actual data

### 6. Create Test Data (If Needed)

You can create test assignments from the Dispatcher Dashboard:

1. Go to Dispatcher Dashboard
2. Select an incident (or create new one from Call Taker)
3. Assign resources (vehicle + crew)
4. Assignment gets created
5. Open assignment in mobile app or cancel it
6. Cancelled/completed assignments appear in history

**Quick Cancelled Assignment:**

1. Create assignment
2. Immediately cancel it with reason
3. Go to Assignment History
4. Should see it there with delete option

### 7. Viva Demonstration Checklist

When demonstrating for viva:

- [ ] Navigate from Dashboard to Assignment History (show button)
- [ ] Explain page purpose and features
- [ ] Point out statistics dashboard
- [ ] Show search bar functionality
- [ ] Demonstrate filters (expand panel, select filters)
- [ ] Show assignment card details
- [ ] **Demonstrate CRUD Delete:**
  - [ ] Find cancelled assignment
  - [ ] Click delete button
  - [ ] Show confirmation modal
  - [ ] Confirm deletion
  - [ ] Show success and removal
- [ ] Show pagination (if available)
- [ ] Explain report generation (future feature - button present)

### 8. Backend API Testing (Optional)

Test the API directly using browser or Postman:

**Get History (with auth token):**

```http
GET http://localhost:5000/api/assignments/history
Authorization: Bearer YOUR_TOKEN_HERE
```

**With Filters:**

```http
GET http://localhost:5000/api/assignments/history?status=completed&status=cancelled&page=1&limit=10
```

**Get Statistics:**

```http
GET http://localhost:5000/api/assignments/statistics?dateFrom=2025-01-01&dateTo=2025-12-31
```

### 9. Expected Results

**Successful Test Results:**

- ✅ Page loads without errors
- ✅ Statistics display (even if zeros)
- ✅ Assignment cards show all information
- ✅ Search works instantly
- ✅ Filters apply correctly
- ✅ Delete operation completes successfully
- ✅ Modal animations smooth
- ✅ Toast notifications appear
- ✅ Navigation works

**Backend Console (Expected Logs):**

```
GET /api/assignments/history 200 - Response time
GET /api/assignments/statistics 200 - Response time
DELETE /api/assignments/:id 200 - Response time
```

**Frontend Console (Should be clean):**

```
No red errors
Optional: "Failed to fetch statistics" if no data (this is OK)
```

## Quick Reference

### Keyboard Shortcuts

- **F12:** Open DevTools
- **Ctrl+Shift+R:** Hard refresh
- **Ctrl+Click:** Multi-select in filters

### Important URLs

- **Web App:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Assignment History:** http://localhost:3000/assignments/history
- **Dispatcher Dashboard:** http://localhost:3000/dashboard/dispatcher

### Key Roles with Access

- **Dispatcher:** ✅ Full access
- **Supervisor:** ✅ Full access
- **Admin:** ✅ Full access + Delete permission
- **Call Taker:** ❌ No access

### Important Notes

1. Only **cancelled** assignments can be deleted
2. Only **Admin** role can delete (enforced in backend)
3. Search works across multiple fields simultaneously
4. Filters are cumulative (AND logic)
5. Date range uses inclusive boundaries
6. Statistics recalculate on every filter change

## Success Criteria

Your implementation is working correctly if:

- ✅ No compilation errors in backend or frontend
- ✅ Page loads and displays UI correctly
- ✅ API endpoints return data (even if empty)
- ✅ Search input accepts text
- ✅ Filters can be opened and closed
- ✅ Delete button appears on cancelled assignments
- ✅ Delete confirmation modal works
- ✅ Statistics show numbers (or zeros if no data)

## Need More Data?

If you need to populate with test assignments quickly, you can:

1. Run the seeding script (if available)
2. Manually create via Dispatcher Dashboard
3. Use Postman to POST to `/api/assignments` endpoint
4. Import test data JSON (if prepared)

---

**Ready for Testing!** 🚀

If everything works as described above, Phase 1 is **COMPLETE** and ready for your viva demonstration.
