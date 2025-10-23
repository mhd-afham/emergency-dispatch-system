# Rejected Form Edit Error Fix

## Issue Description
When clicking the "Edit" button on a rejected vehicle form and navigating to Step 3 (Station Assignment), the application crashed with the error:

```
TypeError: Cannot read properties of undefined (reading 'homeStationId')
at VehicleRegistrationWizard
```

### Root Cause
The `transformVehicleToFormData()` function in `AdminRegistrationSection.tsx` was creating an incorrect data structure. It was using `registration.homeStationId` instead of `station.homeStationId`, which didn't match the expected structure in `VehicleRegistrationWizard`.

## Error Location
**File**: `apps/web/src/components/admin/AdminRegistrationSection.tsx`  
**Function**: `transformVehicleToFormData()`  
**Line**: ~356

## The Fix

### Before (INCORRECT):
```typescript
const transformVehicleToFormData = (vehicle: any) => {
  return {
    basic: { ... },
    equipment: { ... },
    registration: {  // ❌ WRONG - should be "station"
      homeStationId: vehicle.station?.homeStationId?._id || vehicle.station?.homeStationId || "",
    },
  };
};
```

### After (CORRECT):
```typescript
const transformVehicleToFormData = (vehicle: any) => {
  return {
    basic: { ... },
    equipment: { ... },
    station: {  // ✅ CORRECT - matches VehicleRegistrationWizard interface
      homeStationId: vehicle.station?.homeStationId?._id || vehicle.station?.homeStationId || "",
    },
  };
};
```

## Why This Happened

The `VehicleRegistrationWizard` component expects form data in this structure:

```typescript
interface VehicleFormData {
  basic: VehicleBasicInfo;
  equipment: VehicleEquipmentInfo;
  station: VehicleStationInfo;  // ← Must be "station"
}

interface VehicleStationInfo {
  homeStationId: string;
}
```

When accessing `formData.station.homeStationId` in Step 3:
- **Before**: `formData.station` was `undefined` → crash
- **After**: `formData.station` exists with `homeStationId` property → works correctly

## Testing

### Test Scenario:
1. ✅ Navigate to "Rejected Forms" tab
2. ✅ Click "Edit" button on any rejected vehicle
3. ✅ System clears rejection status
4. ✅ Wizard opens with vehicle data loaded
5. ✅ Click through Step 1 (Basic Info) - Should show filled data
6. ✅ Click through Step 2 (Equipment) - Should show equipment list
7. ✅ Click to Step 3 (Station Assignment) - **Should NOT crash anymore**
8. ✅ Station should be pre-selected if vehicle had one
9. ✅ Can modify and resubmit the registration

### Expected Results:
- ✅ No runtime errors
- ✅ All steps display correctly
- ✅ Station dropdown shows the correct selected value
- ✅ Review summary in Step 3 shows all data correctly

## Files Modified
- ✅ `apps/web/src/components/admin/AdminRegistrationSection.tsx` - Fixed `transformVehicleToFormData()` function

## Related Components
- `VehicleRegistrationWizard.tsx` - Consumer of the transformed data
- Step 3 rendering (lines 763-826) - Uses `formData.station.homeStationId`

## Impact
- ✅ Fixes crash when editing rejected vehicle forms
- ✅ Allows rejected forms to be properly edited and resubmitted
- ✅ No impact on other functionality
- ✅ Crew form editing already correct (uses different structure)

## Additional Notes
- The crew transform function (`transformCrewToFormData`) was already correct and didn't need changes
- This fix only affects editing **rejected** vehicle forms
- Draft editing already worked correctly
- New registrations already worked correctly

---
**Date**: October 23, 2025  
**Issue**: Runtime error when editing rejected vehicle forms at Step 3  
**Status**: ✅ Fixed  
**Type**: Bug Fix - Data Structure Mismatch
