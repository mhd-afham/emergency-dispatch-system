# Assignment Workflow - Real-time Update Fixes (October 21, 2025)

## ⚠️ CRITICAL FIXES: Schema Validation Errors

### Error 1: Assignment Model

**ERROR**: `Assignment validation failed: response.status: 'returned' is not a valid enum value`

**Fix**: Added "returned" to enum in `apps/backend/models/Assignment.js` (line ~65):

```javascript
enum: [
  "assigned",
  "accepted",
  "declined",
  "en_route",
  "on_scene",
  "completed",
  "returned",
  "cancelled",
];
```

### Error 2: Incident Model

**ERROR**: `Incident validation failed: assignedResources.0.status: 'returned' is not a valid enum value`

**Fix**: Added "returned" to enum in `apps/backend/models/Incident.js` (line ~259):

```javascript
enum: ["pending", "assigned", "en_route", "on_scene", "completed", "returned"];
```

### Error 3: Controller Logic

**Issue**: When assignment status is "returned", the controller was setting incident resource status to "returned", but logically it should stay "completed".

**Fix**: Updated `apps/backend/controllers/assignmentController.js` (line ~530):

```javascript
if (status === "returned") {
  // Keep incident resource as "completed" when vehicle returns
  incidentResourceStatus = "completed";
}
```

### Error 4: Assignment Creation Blocked

**ERROR**: Cannot create new assignment for vehicle after it returns to station. Web shows error toast, mobile receives nothing.

**Root Cause**: The `createAssignment` function checks for existing assignments with this query:

```javascript
"response.status": { $nin: ["completed", "cancelled", "declined"] }
```

This doesn't exclude "returned", so vehicles with returned assignments are blocked from new assignments.

**Fix**: Updated `apps/backend/controllers/assignmentController.js` (line ~141):

```javascript
"response.status": { $nin: ["completed", "cancelled", "declined", "returned"] }
```

---

## Issues Fixed

### 1. Mobile App: "Complete Assignment" → "Returned to Station" Button Not Appearing

**Problem**: After clicking "Complete Assignment", the "Returned to Station" button didn't appear until manual refresh.

**Root Cause**: The mobile app's WebSocket listener updated the assignment status but didn't immediately fetch the vehicle status. The backend changes vehicle status to "returning" when assignment is completed, but this wasn't reflected in the UI until refresh.

**Fix**: Modified `DashboardScreen.tsx` WebSocket listener for `assignment_status_update`:

```typescript
if (data.status === ASSIGNMENT_STATUS.COMPLETED) {
  setHasCompletedAssignment(true);
  // Fetch vehicle to get updated "returning" status
  // This is critical for showing the "Returned to Station" button
  fetchVehicle();
}
```

### 2. Mobile App: "Returned to Station" Click Doesn't Clear Assignment

**Problem**: Clicking "Returned to Station" button didn't update the assignment status on backend, so the assignment remained visible.

**Root Cause**: The `markReturnedToStation` function only updated vehicle status and readiness, but didn't call the assignment status update API. The backend query filters assignments by `response.returnedAt` field, which is only set when assignment status is updated to "returned".

**Fix**: Modified `markReturnedToStation()` in `DashboardScreen.tsx`:

```typescript
// FIRST: Update assignment status to "returned" - this sets response.returnedAt
await apiClient.updateAssignmentStatus(currentAssignment._id, "returned");

// The backend will automatically:
// 1. Set vehicle status to "available"
// 2. Emit WebSocket events
```

### 3. Mobile App: Assignment Lingers After Returned to Station

**Problem**: Even after returning to station, the assignment stayed visible. Manual refresh didn't help.

**Root Cause**: WebSocket listener wasn't handling "returned" status to clear assignment from local state.

**Fix**:

1. Added `RETURNED: "returned"` to `ASSIGNMENT_STATUS` constants
2. Enhanced WebSocket `assignment_status_update` listener:

```typescript
if (data.status === "returned") {
  console.log("📱 Assignment returned - clearing local state");
  setHasCompletedAssignment(false);
  fetchVehicle();
  fetchCurrentAssignment();
  return null; // Clear assignment from state
}
```

3. Enhanced WebSocket `vehicle_status_update` listener:

```typescript
if (data.status === "available") {
  console.log("🏠 Vehicle is available - clearing assignment state");
  setCurrentAssignment(null);
  setHasCompletedAssignment(false);
  fetchCurrentAssignment(); // Check for any new assignments
}
```

### 4. Web App: Real-time Updates for Vehicle Status

**Problem**: Web app required manual refresh to see vehicles transitioning to "returning" or "available" status.

**Status**: ✅ Already working correctly! The `DispatchWorkspace.tsx` already:

- Subscribes to `assignment_status_update` and calls `fetchVehicles()`
- Subscribes to `vehicle_status_update` and updates vehicle state in real-time
- Refreshes assignments when status changes occur

## Backend Flow (Confirmed Working)

### When "Complete Assignment" is clicked:

1. Mobile calls: `PUT /api/assignments/:id/status` with `status: "completed"`
2. Backend (`assignmentController.js`):
   - Sets `assignment.response.completedAt`
   - Sets `assignment.response.returningAt`
   - Changes vehicle status to `"returning"`
   - Sets `vehicle.readiness.isReady = true`
   - Clears `vehicle.assignment.currentIncidentId`
   - Emits WebSocket events:
     - `assignment_status_update`
     - `vehicle_readiness_update`
     - `vehicle_status_update`
     - `incident:updated`

### When "Returned to Station" is clicked:

1. Mobile calls: `PUT /api/assignments/:id/status` with `status: "returned"`
2. Backend:

   - Sets `assignment.response.returnedAt = new Date()`
   - Changes vehicle status to `"available"`
   - Emits WebSocket events:
     - `assignment_status_update` (status: "returned")
     - `vehicle_status_update` (status: "available")
     - `incident:updated`

3. Mobile fetches: `GET /api/crews/:crewId/assignments`
4. Backend query excludes assignments where status is "returned":

```javascript
Assignment.find({
  "resource.primaryCrewId": crewId,
  "response.status": { $nin: ["cancelled", "declined", "returned"] }, // ← "returned" added
  "response.returnedAt": { $exists: false }, // Double-check filter
});
```

## Files Changed

### Backend (CRITICAL FIXES)

1. **`apps/backend/models/Assignment.js`** ⚠️ SCHEMA FIX #1

   - Added "returned" to `response.status` enum (line ~65)
   - **This was causing first validation error**

2. **`apps/backend/models/Incident.js`** ⚠️ SCHEMA FIX #2

   - Added "returned" to `assignedResources.status` enum (line ~259)
   - **This was causing second validation error**

3. **`apps/backend/controllers/assignmentController.js`** (Multiple fixes)

   - Line ~530: Added special handling for "returned" status mapping
   - Line ~141: Updated `createAssignment` query to exclude "returned" status
   - **First fix prevents incident validation error**
   - **Second fix allows new assignments after vehicle returns**

4. **`apps/backend/controllers/crewController.js`**
   - Line 105: Updated query to exclude "returned" status from active assignments

### Mobile App

1. **`apps/mobile/src/components/DashboardScreen.tsx`**

   - Enhanced `assignment_status_update` WebSocket listener (lines 142-183)
   - Enhanced `vehicle_status_update` WebSocket listener (lines 248-279)
   - Fixed `markReturnedToStation()` function (lines 583-599)

2. **`apps/mobile/src/constants/index.ts`**
   - Added `RETURNED: "returned"` to ASSIGNMENT_STATUS (line 50)

### Web App

No changes needed - already working correctly!

## Testing Checklist

- [ ] **Dispatcher assigns vehicle to incident**

  - Web: Verify vehicle marker changes to yellow (assigned)
  - Mobile: Verify crew receives assignment notification

- [ ] **Crew accepts assignment**

  - Mobile: Verify "Mark En Route" button appears immediately
  - Web: Verify toast notification shows "Assignment accepted"

- [ ] **Crew marks "En Route"**

  - Mobile: Verify "Mark On Scene" button appears
  - Web: Verify vehicle marker turns green (en_route)

- [ ] **Crew marks "On Scene"**

  - Mobile: Verify "Complete Assignment" button appears
  - Web: Verify vehicle marker turns red (on_scene)

- [ ] **Crew clicks "Complete Assignment"** ⚠️ KEY TEST

  - Mobile: Verify "Returned to Station" button appears **IMMEDIATELY** (no refresh)
  - Web: Verify vehicle marker turns blue (returning) **WITHOUT MANUAL REFRESH**
  - Web: Verify incident status updates to "resolved" if all vehicles completed

- [ ] **Crew clicks "Returned to Station"** ⚠️ KEY TEST
  - Mobile: Verify assignment **clears immediately** from dashboard (no refresh)
  - Mobile: Verify "No active assignments" message appears
  - Web: Verify vehicle marker turns gray (available) **WITHOUT MANUAL REFRESH**

## Technical Notes

### Assignment Status Field Structure

```typescript
{
  status: string,          // Secondary (synced)
  response: {
    status: string,        // PRIMARY - used by mobile app
    acceptedAt?: Date,
    enRouteAt?: Date,
    onSceneAt?: Date,
    completedAt?: Date,
    returningAt?: Date,    // Set when completed
    returnedAt?: Date      // Set when crew marks returned ← KEY for filtering
  }
}
```

### Status Transitions

- `assigned` → `accepted` → `en_route` → `on_scene` → `completed` → `returned`
- Vehicle status: `assigned` → `en_route` → `on_scene` → `returning` → `available`

### WebSocket Events Emitted by Backend

1. `assignment_status_update` - Assignment status changed
2. `vehicle_status_update` - Vehicle status changed
3. `vehicle_readiness_update` - Vehicle readiness changed
4. `incident:updated` - Incident status/resources updated

---

**Status**: ✅ All fixes implemented and ready for testing
**Date**: October 21, 2025
