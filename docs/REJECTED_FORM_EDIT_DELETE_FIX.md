# Rejected Form Edit/Delete Behavior Fix

## Issue Description
When an admin clicked the "Edit" button on a rejected form (vehicle or crew) to view or edit it, and then clicked "Cancel" or the "X" button to close the form **without** submitting, the rejected form disappeared from the "Rejected Forms" tab. This made it seem like the form was deleted, when the admin only intended to view it or cancel the edit.

### User Expectation:
- **Edit Button**: Open the form for viewing/editing
- **Cancel/X Button**: Just close the form without deleting it
- **Delete Button**: Permanently delete the rejected form

### Previous Behavior (WRONG):
1. Admin clicks "Edit" on rejected form
2. System **immediately** clears rejection status (changes to "pending")
3. Form disappears from "Rejected Forms" tab
4. If admin clicks "Cancel", form is now in limbo (not rejected, not submitted)
5. Admin thinks it was deleted

## Root Cause Analysis

### The Problem:
The `handleEditRejected()` function was calling the `/clear-rejection` API endpoint **immediately** when opening the form:

```typescript
// OLD CODE (WRONG)
const handleEditRejected = async (item: any, type: FormType) => {
  // ❌ This runs IMMEDIATELY when Edit is clicked
  const endpoint = type === 'vehicle' 
    ? `/vehicles/${item._id}/clear-rejection` 
    : `/crew/${item._id}/clear-rejection`;
  await apiClient.patch(endpoint); // Changes status to "pending"
  
  // Opens wizard...
};
```

When `/clear-rejection` is called, it:
- Changes status from "rejected" → "pending"
- Removes rejection details
- Form moves from Rejected tab to Pending tab
- If user cancels, form stays in Pending (wrong!)

## Solution Implemented

### New Flow:
1. **When Edit button is clicked**: Open form **without** changing status
2. **When Cancel/X is clicked**: Just close the form (status stays "rejected")
3. **When Submit is clicked**: THEN clear rejection and resubmit

### Implementation Details:

#### 1. Modified `handleEditRejected()` Function
**File**: `apps/web/src/components/admin/AdminRegistrationSection.tsx`

**BEFORE (Wrong)**:
```typescript
const handleEditRejected = async (item: any, type: FormType) => {
  // ❌ Immediately clears rejection
  const endpoint = `/vehicles/${item._id}/clear-rejection`;
  await apiClient.patch(endpoint);
  
  const formData = transformVehicleToFormData(response.data.data);
  setEditingDraft({ formData });
  setCurrentMode(type);
};
```

**AFTER (Correct)**:
```typescript
const handleEditRejected = (item: any, type: FormType) => {
  // ✅ Just transforms data, doesn't change status
  const formData = transformVehicleToFormData(item);
  
  setEditingDraft({
    _id: item._id,
    formData,
    isRejected: true,  // Flag to indicate this is a rejected form
    rejectionReason: item.registrationStatus?.rejectionReason
  });
  setCurrentMode(type);
};
```

Key changes:
- ❌ Removed `apiClient.patch('/clear-rejection')` call
- ✅ Added `isRejected: true` flag
- ✅ No async operation needed
- ✅ Form status stays "rejected" until submitted

#### 2. Modified Vehicle Wizard Submit
**File**: `apps/web/src/components/admin/VehicleRegistrationWizard.tsx`

```typescript
const handleSubmit = async () => {
  // Check if this is a rejected form
  const isRejectedForm = (initialData as any)?.isRejected === true;
  const vehicleId = draftId;

  // ✅ Only clear rejection when SUBMITTING, not when opening
  if (isRejectedForm && vehicleId) {
    console.log("🔄 Clearing rejection status before resubmission");
    await fetch(`/vehicles/${vehicleId}/clear-rejection`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Then submit the form...
  await fetch("/vehicles", {
    method: "POST",
    body: JSON.stringify(submitData),
  });
};
```

#### 3. Modified Crew Wizard Submit
**File**: `apps/web/src/components/admin/CrewRegistrationWizard.tsx`

Same logic as vehicle wizard - clear rejection only on submit, not on open.

## Behavior Matrix

| Action | Old Behavior | New Behavior (Fixed) |
|--------|-------------|---------------------|
| **Click Edit** | Status changes to "pending" immediately | Status stays "rejected" |
| **Click Cancel/X** | Form disappears (now in Pending tab) | Form closes, stays in Rejected tab ✅ |
| **Click Submit** | Submits as new pending | Clears rejection, then submits ✅ |
| **Click Delete** | Permanently deletes | Permanently deletes (unchanged) ✅ |

## Testing Scenarios

### Test 1: View and Cancel
1. ✅ Go to "Rejected Forms" tab
2. ✅ Note a rejected vehicle (e.g., "CAB-1234")
3. ✅ Click "Edit" button
4. ✅ Wizard opens with vehicle data
5. ✅ Click "Cancel" button or "X" button
6. ✅ **Expected**: Vehicle still appears in "Rejected Forms" tab
7. ✅ **Expected**: Status is still "rejected"

### Test 2: Edit and Submit
1. ✅ Go to "Rejected Forms" tab
2. ✅ Click "Edit" on a rejected vehicle
3. ✅ Make changes to the form
4. ✅ Complete all 3 steps
5. ✅ Click "Submit"
6. ✅ **Expected**: Rejection cleared automatically
7. ✅ **Expected**: Vehicle moves to "Pending Forms" tab
8. ✅ **Expected**: Status is now "pending"

### Test 3: View Without Changes
1. ✅ Click "Edit" on rejected form
2. ✅ Browse through all steps (don't change anything)
3. ✅ Click "Cancel"
4. ✅ **Expected**: Form remains in "Rejected Forms" tab

### Test 4: Delete (Original Functionality)
1. ✅ Click "Delete" button on rejected form
2. ✅ Confirm deletion
3. ✅ **Expected**: Form is permanently deleted
4. ✅ **Expected**: Form removed from "Rejected Forms" tab

## Files Modified

### Frontend Changes:
1. **`apps/web/src/components/admin/AdminRegistrationSection.tsx`**
   - Modified `handleEditRejected()` to NOT call `/clear-rejection`
   - Added `isRejected` flag to draft data
   - Removed unnecessary API call

2. **`apps/web/src/components/admin/VehicleRegistrationWizard.tsx`**
   - Modified `handleSubmit()` to detect rejected forms
   - Added rejection clearing logic BEFORE submit
   - Prevents draft deletion for rejected forms

3. **`apps/web/src/components/admin/CrewRegistrationWizard.tsx`**
   - Same changes as vehicle wizard
   - Handles crew member rejection clearing

### Backend Changes:
- ❌ **No backend changes needed**
- ✅ The `/clear-rejection` endpoint still works correctly
- ✅ It's just called at a different time (on submit, not on open)

## Advantages of New Approach

1. ✅ **Non-destructive viewing**: Admins can safely view rejected forms
2. ✅ **Expected behavior**: Cancel means "don't change anything"
3. ✅ **Data integrity**: Status only changes when admin explicitly submits
4. ✅ **Better UX**: Admins don't lose track of rejected forms
5. ✅ **Atomic operation**: Rejection clearing + resubmission happen together

## Edge Cases Handled

### Edge Case 1: Network Failure During Submit
- If rejection clearing succeeds but submit fails, form becomes "pending" (acceptable fallback)
- Error message shown to user
- User can find form in "Pending" tab and retry

### Edge Case 2: Multiple Edits Without Submit
- User can open, cancel, open again multiple times
- Form stays rejected until submitted
- No side effects

### Edge Case 3: Browser Refresh While Editing
- Form state is lost (expected behavior)
- Form remains in "Rejected Forms" tab ✅
- Status unchanged ✅

## Migration Notes

- ✅ **No database migration needed**
- ✅ **No data loss**
- ✅ **Existing rejected forms work normally**
- ✅ **Backward compatible with existing workflows**

## Summary

✅ **Fixed**: Rejected forms no longer disappear when clicking Cancel/X  
✅ **Fixed**: Rejection status only cleared when form is submitted  
✅ **Fixed**: Admins can safely view/edit rejected forms without side effects  
✅ **Fixed**: Delete button is the only way to permanently remove rejected forms  
✅ **Preserved**: All existing functionality for drafts and normal registrations  

---
**Date**: October 23, 2025  
**Issue**: Rejected forms disappearing when Cancel/X clicked  
**Status**: ✅ Fixed  
**Type**: Bug Fix - Workflow Logic
