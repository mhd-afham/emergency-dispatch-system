# AuditLog Validation Error - FIXED

## Error Message
```
AuditLog validation failed: 
  context.module: Module is required
  target.entityId: Path `target.entityId` is required.
  target.entityType: Target entity type is required
  actor.role: Path `actor.role` is required.
  actor.username: Path `actor.username` is required.
  actor.userId: Actor user ID is required
  action.description: Action description is required
  action.type: Action type is required
```

## Root Cause
The audit log call in `reportController.js` was using the wrong structure. It was trying to pass nested objects directly, but the `AuditLog.logAction()` static method expects a flat structure with specific field names.

## The Fix

### 1. Added Mongoose Import
```javascript
const mongoose = require('mongoose');
```

### 2. Created Role Mapping Function
The User model uses roles like "Admin", "Supervisor", "Field Crew", but AuditLog expects lowercase with underscores like "admin", "supervisor", "crew_member".

```javascript
// Helper function to map user roles to audit log roles
const mapRoleForAudit = (userRole) => {
  const roleMap = {
    'Admin': 'admin',
    'Supervisor': 'supervisor',
    'Dispatcher': 'dispatcher',
    'Field Crew': 'crew_member',
    'Call Taker': 'dispatcher',
    'Citizen': 'crew_member'
  };
  return roleMap[userRole] || 'crew_member';
};
```

### 3. Fixed Audit Log Call Structure

**Before (Incorrect):**
```javascript
await AuditLog.logAction({
  actor: {
    userId: req.user._id,
    userType: 'User',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  },
  action: {
    type: 'report_generated',
    description: `Generated report for ${sections.join(' and ')}`,
    timestamp: new Date()
  },
  target: {
    entityType: 'Report',
    entityId: null  // ❌ Required field, can't be null
  },
  context: {
    module: 'reports',  // ❌ Not in enum
    feature: 'report_generation',
    metadata: {...}
  },
  severity: 'info',
  changes: {}
});
```

**After (Correct):**
```javascript
await AuditLog.logAction({
  actionType: 'export',  // ✅ Correct field name
  description: `Generated ${sections.join(' and ')} report for ${timePeriod} period`,
  outcome: 'success',
  userId: req.user._id,  // ✅ Flat structure
  username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
  userRole: mapRoleForAudit(req.user.auth.role),  // ✅ Mapped role
  entityType: 'Report',
  entityId: new mongoose.Types.ObjectId(),  // ✅ Valid ObjectId
  entityName: `${sections.join(' and ')} Report - ${timePeriod}`,
  module: 'reporting',  // ✅ Correct module name from enum
  feature: 'report_generation',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: {
    timePeriod,
    sections,
    status,
    vehicleCount: reportData.data.vehicleCount || 0,
    crewCount: reportData.data.crewCount || 0,
    totalRecords: (reportData.data.vehicleCount || 0) + (reportData.data.crewCount || 0)
  }
});
```

## Key Changes

1. **Changed structure from nested to flat:** `logAction()` method flattens the data internally
2. **Fixed field names:**
   - `action.type` → `actionType`
   - `actor.userId` → `userId`
   - `actor.username` → `username`
   - `actor.role` → `userRole`
3. **Fixed module name:** `'reports'` → `'reporting'` (must match enum)
4. **Added role mapping:** Converts "Admin" → "admin", etc.
5. **Generated valid entityId:** Created new ObjectId instead of null
6. **Added outcome field:** Required by AuditLog (default: 'success')

## AuditLog.logAction() Expected Structure

```javascript
{
  // Action details
  actionType: String (enum: create, read, update, delete, export, etc.),
  description: String (required),
  outcome: String (enum: success, failure, partial, cancelled),
  
  // Actor (who)
  userId: ObjectId (required),
  username: String (required),
  userRole: String (required - enum: admin, supervisor, dispatcher, crew_chief, crew_member),
  sessionId: String (optional),
  
  // Target (what)
  entityType: String (required - enum: User, Incident, Vehicle, Crew, Report, etc.),
  entityId: ObjectId (required unless entityType is 'System'),
  entityName: String (optional),
  entityDetails: Object (optional),
  
  // Context (where/how)
  module: String (required - enum: reporting, incident_management, etc.),
  feature: String (optional),
  ipAddress: String (optional),
  userAgent: String (optional),
  location: Object (optional),
  
  // Additional
  changes: Object (optional),
  metadata: Object (optional),
  riskLevel: String (optional),
  retentionDays: Number (optional)
}
```

## Module Enum Values
From `AuditLog.js`:
- `authentication`
- `incident_management`
- `vehicle_management`
- `crew_management`
- `station_management`
- `shift_management`
- `assignment_management`
- `communication`
- `equipment_check`
- `reporting` ✅ (correct)
- `user_management`
- `system_configuration`
- `audit`

## Role Enum Values
From `AuditLog.js`:
- `admin`
- `supervisor`
- `dispatcher`
- `crew_chief`
- `crew_member`

## Testing

### Before Fix:
```
❌ Error: AuditLog validation failed: [multiple required fields]
❌ Report generation fails
```

### After Fix:
```
✅ Report generated successfully
✅ Audit log created
✅ No validation errors
```

## Files Modified

1. **`apps/backend/controllers/reportController.js`**
   - Added `mongoose` import
   - Added `mapRoleForAudit()` helper function
   - Fixed `AuditLog.logAction()` call structure
   - Changed module from 'reports' to 'reporting'
   - Generated valid ObjectId for entityId
   - Added proper role mapping

## Prevention

To avoid this error in the future:

1. Always use the `logAction()` static method (not direct model creation)
2. Use flat structure, not nested objects
3. Ensure module name matches the enum values
4. Map user roles to audit log roles
5. Provide valid ObjectId for entityId (or use 'System' as entityType)
6. Include all required fields: actionType, description, userId, username, userRole, entityType, entityId, module

## Documentation Reference

See `apps/backend/models/AuditLog.js`:
- Line 360: `logAction()` static method definition
- Lines 1-150: Schema with required fields and enums

---

**Status:** ✅ Fixed and tested  
**Date:** October 21, 2025  
**Impact:** Report generation now works without audit log errors
