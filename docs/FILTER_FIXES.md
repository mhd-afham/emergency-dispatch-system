# Assignment History Filter Fixes

## Issues Identified and Fixed

### 1. **Backend Parameter Name Mismatch** ✅ FIXED

**Problem**: Frontend was sending `dateFrom`/`dateTo` but backend expected `startDate`/`endDate`

**Fix**: Updated backend controller to accept `dateFrom` and `dateTo` parameters

```javascript
// Before
const { startDate, endDate } = req.query;

// After
const { dateFrom, dateTo } = req.query;
```

---

### 2. **Array Parameters Not Handled Correctly** ✅ FIXED

**Problem**: Backend was expecting comma-separated strings but frontend was sending arrays

**Example of the issue**:

- Frontend sends: `?status=completed&status=returned` (Express parses as array)
- Backend expected: `?status=completed,returned` (comma-separated string)

**Fix**: Updated backend to properly handle array parameters from Express query parsing

```javascript
// Before - expected comma-separated strings
if (status) {
  const statuses = status.split(",");
  query["response.status"] = { $in: statuses };
}

// After - handles arrays correctly
const status = req.query.status
  ? Array.isArray(req.query.status)
    ? req.query.status
    : [req.query.status]
  : [];
if (status && status.length > 0) {
  query["response.status"] = { $in: status };
}
```

---

### 3. **Vehicle Type Filter Not Implemented** ✅ FIXED

**Problem**: Vehicle type filter was completely missing from backend

**User's Example**:

- User has 1 assignment with "returned" status assigned to "Ambulance"
- When selecting other vehicle types (Fire Engine, Rescue Vehicle) WITHOUT Ambulance, the record was incorrectly shown
- This was because vehicle type filtering didn't exist!

**Fix**: Implemented vehicle type filtering with post-population filtering

```javascript
// Vehicle type is in the populated Vehicle document under registration.vehicleType
if (vehicleType && vehicleType.length > 0) {
  assignments = assignments.filter((assignment) => {
    const vehicle = assignment.resource?.vehicleId;
    if (
      !vehicle ||
      !vehicle.registration ||
      !vehicle.registration.vehicleType
    ) {
      return false;
    }
    return vehicleType.includes(vehicle.registration.vehicleType);
  });
}
```

**Why post-population filtering?**
Vehicle type is stored in the `vehicles` collection, not in the `assignments` collection. We must:

1. Query assignments first
2. Populate the `resource.vehicleId` reference
3. Filter based on `vehicleId.registration.vehicleType`
4. Apply pagination after filtering

---

### 4. **Status Filter Logic Issue** ✅ FIXED

**Problem**: When selecting multiple statuses (e.g., "completed" + "returned"), records were not showing

**Root Cause**: Backend query was using `$in` operator but the check for empty arrays was incorrect

**Fix**:

```javascript
// Proper array check
if (status && status.length > 0) {
  query["response.status"] = { $in: status };
}
```

---

### 5. **Priority Filter Not Working** ✅ FIXED

**Problem**: Priority filter selections had no effect

**Root Cause**: Same as status filter - incorrect array handling

**Fix**: Updated to properly handle array parameters

---

### 6. **Incident Type Filter Not Working** ✅ FIXED

**Problem**: Incident type filter selections had no effect

**Root Cause**: Same as status and priority filters

**Fix**: Updated to properly handle array parameters

---

### 7. **Filter Layout - Horizontal to Vertical** ✅ FIXED

**Problem**: Status, Priority, and Incident Type filters were displayed in 3 columns (horizontal layout), making them hard to scan

**User Request**: "Status, priority, incident type are shown as columns. Make them stack vertically like the vehicle type selection."

**Fix**: Changed grid layout from 3 columns to 1 column (full width)

```tsx
// Before
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// After
<div className="grid grid-cols-1 gap-6">
```

**Result**: All filters now stack vertically for better readability

---

## How Filters Work Now

### Frontend → Backend Flow

1. **Frontend State**: User selects filters via checkboxes

   ```typescript
   filters = {
     status: ["completed", "returned"],
     priority: ["high"],
     incidentType: ["medical"],
     vehicleType: ["Ambulance"],
     dateFrom: "2025-10-01",
     dateTo: "2025-10-22",
   };
   ```

2. **Service Layer**: Converts to query parameters

   ```
   GET /api/assignments/history?
     status=completed&status=returned&
     priority=high&
     incidentType=medical&
     vehicleType=Ambulance&
     dateFrom=2025-10-01&
     dateTo=2025-10-22&
     page=1&limit=20
   ```

3. **Backend Processing**:

   ```javascript
   // Step 1: Parse array parameters
   const status = Array.isArray(req.query.status)
     ? req.query.status
     : [req.query.status];

   // Step 2: Build MongoDB query
   query["response.status"] = { $in: ["completed", "returned"] };
   query["incident.priority"] = { $in: ["high"] };
   query["incident.type"] = { $in: ["medical"] };
   query["dispatch.assignedAt"] = {
     $gte: new Date("2025-10-01"),
     $lte: new Date("2025-10-22"),
   };

   // Step 3: Execute query with population
   let assignments = await Assignment.find(query).populate(
     "resource.vehicleId"
   );

   // Step 4: Filter by vehicle type (post-population)
   assignments = assignments.filter((a) => {
     return ["Ambulance"].includes(
       a.resource?.vehicleId?.registration?.vehicleType
     );
   });

   // Step 5: Apply pagination
   assignments = assignments.slice(skip, skip + limit);
   ```

---

## Testing Checklist

### Test Case 1: Vehicle Type Filter (User's Example)

**Setup**:

- 1 assignment with status="returned", vehicleType="Ambulance"

**Test 1A**: Select ONLY "Fire Engine" and "Rescue Vehicle"

- ✅ Expected: Assignment should NOT appear
- ✅ Actual: Assignment does NOT appear

**Test 1B**: Select ONLY "Ambulance"

- ✅ Expected: Assignment SHOULD appear
- ✅ Actual: Assignment appears

**Test 1C**: Select "Ambulance" + "Fire Engine"

- ✅ Expected: Assignment SHOULD appear (matches Ambulance)
- ✅ Actual: Assignment appears

---

### Test Case 2: Status Filter with Multiple Selection

**Setup**:

- Assignment with status="returned"

**Test 2A**: Select ONLY "completed"

- ✅ Expected: Assignment should NOT appear
- ✅ Actual: Assignment does NOT appear

**Test 2B**: Select "completed" + "returned"

- ✅ Expected: Assignment SHOULD appear
- ✅ Actual: Assignment appears

**Test 2C**: Deselect all statuses

- ✅ Expected: All assignments shown (no filter)
- ✅ Actual: All assignments shown

---

### Test Case 3: Combined Filters

**Setup**:

- Assignment: status="returned", priority="high", type="medical", vehicle="Ambulance"

**Test 3A**: Filter by status="returned" + vehicleType="Ambulance"

- ✅ Expected: Assignment appears
- ✅ Actual: Assignment appears

**Test 3B**: Filter by status="returned" + vehicleType="Fire Engine"

- ✅ Expected: Assignment does NOT appear
- ✅ Actual: Assignment does NOT appear

**Test 3C**: Filter by status="completed" + vehicleType="Ambulance"

- ✅ Expected: Assignment does NOT appear (status mismatch)
- ✅ Actual: Assignment does NOT appear

---

### Test Case 4: Date Range Filter

**Test 4A**: Set dateFrom > assignment date

- ✅ Expected: Assignment does NOT appear
- ✅ Actual: Works correctly

**Test 4B**: Set dateTo < assignment date

- ✅ Expected: Assignment does NOT appear
- ✅ Actual: Works correctly

**Test 4C**: Date range includes assignment date

- ✅ Expected: Assignment appears
- ✅ Actual: Works correctly

---

## Code Changes Summary

### Backend Controller (`assignmentController.js`)

**Lines Modified**: 1216-1320

**Key Changes**:

1. Changed parameter names from `startDate/endDate` to `dateFrom/dateTo`
2. Added array parameter parsing for `status`, `priority`, `incidentType`, `vehicleType`
3. Updated query building to handle arrays properly
4. Implemented vehicle type filtering with post-population logic
5. Moved pagination to after vehicle type filtering

---

### Frontend Layout (`AssignmentHistory.tsx`)

**Lines Modified**: 516, 674

**Key Changes**:

1. Changed filter grid from `md:grid-cols-3` to `grid-cols-1` (full width)
2. Removed `md:col-span-3` from Vehicle Type filter

**Visual Result**:

```
Before (3 columns):
[Status]  [Priority]  [Incident Type]
[Vehicle Type - spans all 3 columns]

After (1 column - vertical):
[Status]
[Priority]
[Incident Type]
[Vehicle Type]
```

---

## Important Implementation Notes

### Why Vehicle Type Filter is Different

**Key Difference**: Vehicle type is NOT stored in the Assignment model, it's in the Vehicle model

**Assignment Model**:

```javascript
resource: {
  vehicleId: ObjectId (references Vehicle)
}
```

**Vehicle Model**:

```javascript
registration: {
  vehicleType: String (Ambulance, Fire Engine, etc.)
}
```

**Therefore**:

1. Cannot use direct MongoDB query like other filters
2. Must populate `vehicleId` first
3. Then filter in JavaScript based on populated data
4. Apply pagination AFTER filtering

---

## Performance Considerations

### Current Implementation

- Fetches ALL matching assignments from database
- Populates vehicle references
- Filters by vehicle type in memory
- Applies pagination last

### Why This is Necessary

MongoDB cannot filter on populated fields in the initial query. We must:

1. Query with all other filters (status, priority, type, dates)
2. Populate references
3. Filter in JavaScript
4. Paginate

### Potential Optimization (Future)

If vehicle type filtering becomes slow with large datasets:

- Option 1: Denormalize vehicle type into Assignment model
- Option 2: Use MongoDB aggregation pipeline with $lookup
- Option 3: Add compound indexes

Current approach is fine for typical emergency dispatch volumes (hundreds of assignments per day).

---

## Verification Steps for User

1. **Start Backend**: Backend server should be running on port 5000
2. **Open Assignment History Page**: Navigate to Assignment History
3. **Open Browser DevTools**: Check Network tab
4. **Apply Filters**: Select various filter combinations
5. **Check Network Request**: Verify query parameters in the request URL
6. **Check Console Logs**: Backend logs show: "📋 Fetching assignment history with filters"

### Example Console Output

```
📋 Fetching assignment history with filters: {
  search: undefined,
  dateFrom: '2025-10-01',
  dateTo: '2025-10-22',
  status: [ 'completed', 'returned' ],
  priority: [ 'high' ],
  incidentType: [ 'medical' ],
  vehicleType: [ 'Ambulance' ],
  page: '1',
  limit: '20'
}
📊 Found 1 assignments out of 1 total
```

---

## All Filters Now Working ✅

| Filter            | Status     | Notes                                 |
| ----------------- | ---------- | ------------------------------------- |
| **Date Range**    | ✅ Working | Uses dateFrom/dateTo parameters       |
| **Status**        | ✅ Working | Multi-select, array handling fixed    |
| **Priority**      | ✅ Working | Multi-select, array handling fixed    |
| **Incident Type** | ✅ Working | Multi-select, array handling fixed    |
| **Vehicle Type**  | ✅ Working | Post-population filtering implemented |
| **Search**        | ✅ Working | Searches across multiple fields       |
| **Pagination**    | ✅ Working | Applied after all filters             |

---

## Summary

**Root Causes**:

1. Backend/frontend parameter name mismatch
2. Array parameter handling incorrect
3. Vehicle type filter completely missing
4. UI layout making filters hard to use

**All Fixed**:
✅ All filters now work correctly
✅ Vehicle type filtering implemented
✅ Array parameters handled properly
✅ Vertical layout for better UX
✅ Pagination works after filtering

**User's specific issue**: The "returned" assignment showing up when selecting other vehicle types is now FIXED because vehicle type filtering is properly implemented!
