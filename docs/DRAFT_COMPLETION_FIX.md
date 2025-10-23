# Draft Completion Percentage Fix

## Issue Description
Previously, drafted forms were showing incorrect completion percentages because the system was calculating completion based on how many fields were filled in the entire form, rather than based on which step the user completed.

### Problem Example:
- User fills Step 1 completely and saves as draft
- Old system: Shows ~30-40% completion (based on total fields across all 3 steps)
- **Expected**: Should show 33% (Step 1 of 3 completed)

## Solution Implemented

### Overview
Changed the completion percentage calculation from **field-based** to **step-based** logic.

### New Completion Logic:
- **Step 1 completed**: 33% (1 of 3 steps)
- **Step 2 completed**: 66% (2 of 3 steps)
- **Step 3 completed**: 100% (3 of 3 steps - ready to submit)

## Changes Made

### File Modified: `apps/backend/controllers/draftController.js`

#### 1. Added Helper Function
```javascript
/**
 * Helper function to calculate completion percentage based on step
 * Step 1: 33%, Step 2: 66%, Step 3: 100%
 */
const calculateStepCompletion = (currentStep) => {
  if (currentStep === 1) return 33;
  if (currentStep === 2) return 66;
  if (currentStep === 3) return 100;
  return 0;
};
```

#### 2. Updated `saveDraft()` Method
**BEFORE:**
```javascript
const draft = new RegistrationDraft({
  registrationType,
  draftTitle,
  formData,
  currentStep: currentStep || 1,
  audit: { createdBy: req.user._id },
});

draft.calculateCompletion(); // Field-based calculation
await draft.save();
```

**AFTER:**
```javascript
const draft = new RegistrationDraft({
  registrationType,
  draftTitle,
  formData,
  currentStep: currentStep || 1,
  completionPercentage: calculateStepCompletion(currentStep || 1), // Step-based
  audit: { createdBy: req.user._id },
});

await draft.save();
```

#### 3. Updated `updateDraft()` Method
**BEFORE:**
```javascript
if (draftTitle) draft.draftTitle = draftTitle;
if (formData) draft.formData = formData;
if (currentStep) draft.currentStep = currentStep;

draft.calculateCompletion(); // Field-based calculation
await draft.save();
```

**AFTER:**
```javascript
if (draftTitle) draft.draftTitle = draftTitle;
if (formData) draft.formData = formData;
if (currentStep) {
  draft.currentStep = currentStep;
  draft.completionPercentage = calculateStepCompletion(currentStep); // Step-based
}

await draft.save();
```

## Why This Approach?

### ✅ Benefits:
1. **Accurate Progress Tracking**: Users see exactly which step they completed
2. **Consistent UX**: All 3-step wizards show same completion logic
3. **No Model Changes**: Avoided merge conflicts by only changing controller
4. **Simple & Predictable**: Easy for users to understand their progress

### 📝 Note on Model:
The `RegistrationDraft` model still has the `calculateCompletion()` method for backwards compatibility, but it's no longer used by the controller. 

**⚠️ IMPORTANT - Notify Team Leader:**
The `calculateCompletion()` method in `RegistrationDraft` model is now deprecated in favor of step-based calculation in the controller. If other team members are using this method, they should be notified of this change.

## Testing

### Test Scenarios:

#### Scenario 1: Save Draft at Step 1
1. Admin fills only Step 1 (Basic Information)
2. Click "Save as Draft"
3. **Expected**: Draft shows "Step 1 of 3 - 33% Complete"

#### Scenario 2: Save Draft at Step 2
1. Admin fills Step 1 and Step 2 (Equipment/Professional Info)
2. Click "Save as Draft"
3. **Expected**: Draft shows "Step 2 of 3 - 66% Complete"

#### Scenario 3: Save Draft at Step 3
1. Admin fills all 3 steps
2. Click "Save as Draft" instead of Submit
3. **Expected**: Draft shows "Step 3 of 3 - 100% Complete"

#### Scenario 4: Update Existing Draft
1. Load a draft saved at Step 1 (33%)
2. Complete Step 2 and save
3. **Expected**: Draft updates to "Step 2 of 3 - 66% Complete"

### Visual Progress Bar
The drafted forms section shows:
```
Draft Title
Step X of 3 - YY% Complete
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━] YY%
Last updated: Date
```

## Files Modified
- ✅ `apps/backend/controllers/draftController.js` - Added step-based completion logic

## Files NOT Modified (Per Instructions)
- ❌ `apps/backend/config/database.js` - No changes
- ❌ `apps/backend/server.js` - No route changes needed
- ❌ `apps/backend/models/RegistrationDraft.js` - Schema unchanged
- ❌ Other models - No changes

## Deployment Notes
- No database migration required
- No frontend changes needed
- Existing drafts will be recalculated when next updated
- No breaking changes to API

## Team Notification Required ⚠️

**Please inform the team leader about:**

1. **Deprecated Method**: `RegistrationDraft.calculateCompletion()` is no longer used by the draft controller
2. **New Logic**: Completion percentage is now calculated based on `currentStep` (33%, 66%, 100%)
3. **Compatibility**: Old field-based calculation method still exists in model but should not be used
4. **Future Work**: Consider removing or updating the `calculateCompletion()` method in the model after all team members are notified

## Summary
✅ Completion percentage now accurately reflects which step was completed  
✅ Step 1 = 33%, Step 2 = 66%, Step 3 = 100%  
✅ No model schema changes (avoiding merge conflicts)  
✅ Backwards compatible  
✅ Simple and predictable for users  

---
**Date**: October 23, 2025  
**Author**: GitHub Copilot  
**Status**: ✅ Implemented and Ready for Testing
