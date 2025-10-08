# Save as Draft Feature - Implementation Guide

## Overview
The "Save as Draft" feature allows administrators to save partially completed vehicle and crew registration forms and continue editing them later. This improves the user experience by preventing data loss and allowing flexible form completion.

---

## Feature Description

### What It Does:
- ✅ Adds a **"Save as Draft"** button to both Vehicle and Crew registration wizards
- ✅ Saves current form data (all steps, partial or complete) to the database
- ✅ Stored drafts appear in the **"Save and Drafted"** tab under Registration Management
- ✅ Admins can retrieve, edit, and complete drafts later
- ✅ Prevents data loss if admin needs to leave the form incomplete

### Button Location:
The "Save as Draft" button appears on **all steps** of the registration wizard:
- Bottom right corner of the form
- Between "Previous/Cancel" and "Next/Register" buttons
- Always visible and accessible
- Blue outline style to distinguish from primary actions

---

## User Workflow

### Saving a Draft:

1. **Admin starts filling out a registration form** (Vehicle or Crew)
2. **Admin fills in some fields** (can be partial, doesn't need to be complete)
3. **Admin clicks "Save as Draft" button**
4. **System validates and saves** the current form state
5. **Success alert appears:** "Draft saved successfully! You can continue editing later from the Drafted Forms section."
6. **Form closes** and returns to Registration Management view
7. **Draft appears** in the "Save and Drafted" tab with:
   - Draft type (Vehicle/Crew)
   - Partial data preview
   - Created date
   - Edit and Delete buttons

### Retrieving and Editing a Draft:

1. **Admin navigates to** Registration Management tab
2. **Admin clicks** "Save and Drafted" sub-tab
3. **Admin sees list** of all saved drafts (Vehicle and Crew)
4. **Admin clicks "Edit"** button on a draft
5. **Form reopens** with all previously entered data restored
6. **Admin continues filling** the form from where they left off
7. **Admin can:**
   - Save as draft again (updates existing draft)
   - Complete and submit the registration
   - Cancel and discard changes

---

## Technical Implementation

### Frontend Changes

#### 1. Crew Registration Wizard (`CrewRegistrationWizard.tsx`)

**Added Function:**
```typescript
const handleSaveAsDraft = async () => {
  setIsLoading(true);
  setGeneralError("");

  try {
    const draftData = {
      type: "crew",
      data: {
        employeeId: formData.personal.employeeId,
        firstName: formData.personal.firstName,
        lastName: formData.personal.lastName,
        email: formData.personal.email,
        phone: formData.personal.phone,
        role: formData.professional.role,
        certificationLevel: formData.professional.certificationLevel,
        hireDate: formData.professional.hireDate,
        certifications: formData.professional.certifications,
        specializations: formData.professional.specializations,
        emergencyContact: formData.emergencyContact,
      },
      status: "draft",
    };

    const response = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/drafts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(draftData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save draft");
    }

    alert("Draft saved successfully! You can continue editing later from the Drafted Forms section.");
    localStorage.removeItem("crewRegistrationData");
    
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Save draft error:", error);
    setGeneralError(error instanceof Error ? error.message : "Failed to save draft");
  } finally {
    setIsLoading(false);
  }
};
```

**Added Button:**
```tsx
<button
  type="button"
  onClick={handleSaveAsDraft}
  disabled={isLoading}
  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  title="Save current progress as draft"
>
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
  {isLoading ? "Saving..." : "Save as Draft"}
</button>
```

#### 2. Vehicle Registration Wizard (`VehicleRegistrationWizard.tsx`)

**Added Function:**
```typescript
const handleSaveAsDraft = async () => {
  setIsLoading(true);
  setGeneralError("");

  try {
    const draftData = {
      type: "vehicle",
      data: {
        plateNumber: formData.basic.plateNumber,
        vehicleType: formData.basic.vehicleType,
        make: formData.basic.make,
        model: formData.basic.model,
        year: formData.basic.year,
        homeStationId: formData.station.homeStationId,
        equipmentItems: formData.equipment.equipmentItems,
      },
      status: "draft",
    };

    const response = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/drafts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(draftData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save draft");
    }

    alert("Draft saved successfully! You can continue editing later from the Drafted Forms section.");
    localStorage.removeItem("vehicleRegistrationData");
    
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Save draft error:", error);
    setGeneralError(error instanceof Error ? error.message : "Failed to save draft");
  } finally {
    setIsLoading(false);
  }
};
```

**Added Button:** (Same structure as crew registration)

---

### Backend Integration

#### API Endpoint Used:
```
POST /api/drafts
```

#### Request Body Structure:
```json
{
  "registrationType": "vehicle" | "crew",
  "draftTitle": "Descriptive title for the draft",
  "formData": {
    // All form fields (partial or complete)
    // Vehicle: { basic: {}, station: {}, equipment: {} }
    // Crew: { personal: {}, professional: {}, emergencyContact: {} }
  },
  "currentStep": 1 | 2 | 3
}
```

#### Backend Files (Already Created):
- ✅ `apps/backend/models/RegistrationDraft.js` - Draft model schema
- ✅ `apps/backend/controllers/draftController.js` - Draft CRUD operations
- ✅ `apps/backend/routes/drafts.js` - Draft API routes
- ✅ `apps/backend/server.js` - Routes registered (line 41)

**No additional backend changes required!** ✅

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Admin fills Vehicle/Crew Registration Form (any step)  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Admin clicks "Save as Draft" button                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend: handleSaveAsDraft() called                    │
│ - Collects all current form data                       │
│ - Creates draft payload with type and status           │
│ - Sends POST request to /api/drafts                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Backend: draftController.createDraft()                  │
│ - Validates request                                     │
│ - Creates new RegistrationDraft document               │
│ - Saves to MongoDB                                      │
│ - Returns success response                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend: Success handling                              │
│ - Shows success alert                                   │
│ - Clears localStorage                                   │
│ - Closes form (calls onSuccess)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Admin Dashboard: Registration Management View          │
│ - Draft appears in "Save and Drafted" tab              │
│ - Shows draft details with Edit/Delete buttons         │
└─────────────────────────────────────────────────────────┘
```

---

## Button Behavior

### Visual States:

1. **Normal State:**
   - Blue outline (`border-blue-600`)
   - Blue text (`text-blue-600`)
   - White background
   - Download icon visible

2. **Hover State:**
   - Light blue background (`hover:bg-blue-50`)
   - Same blue border and text

3. **Loading State:**
   - Disabled (`disabled={isLoading}`)
   - Reduced opacity (`disabled:opacity-50`)
   - Text changes to "Saving..."
   - Cursor not allowed

4. **Disabled State:**
   - Same as loading state
   - Cursor changes to not-allowed

---

## Validation Rules

### Draft Saving:
- ❌ **No validation required** - Drafts can be saved with partial data
- ✅ Any data entered is saved, even if incomplete
- ✅ Empty fields are allowed
- ✅ User can save at any step (1, 2, or 3)

### Draft Submission:
- ✅ When loading a draft and clicking "Register", **full validation applies**
- ✅ All required fields must be completed before final submission
- ✅ Backend validation still enforces schema rules

---

## Testing Guide

### Test Scenario 1: Save Partial Vehicle Registration
1. Navigate to Admin Dashboard → Registration Management
2. Click "Register New Vehicle"
3. Fill only Step 1 (Basic Info):
   - Plate Number: `ABC-1234`
   - Vehicle Type: `Ambulance`
   - Leave other fields empty
4. Click "Save as Draft"
5. **Expected:** Success alert, form closes
6. Go to "Save and Drafted" tab
7. **Expected:** Vehicle draft appears with partial data

### Test Scenario 2: Save Partial Crew Registration
1. Navigate to Admin Dashboard → Registration Management
2. Click "Register New Crew Member"
3. Fill only Step 1 (Personal Info):
   - Employee ID: `EMP123456`
   - First Name: `John`
   - Leave other fields empty
4. Click "Save as Draft"
5. **Expected:** Success alert, form closes
6. Go to "Save and Drafted" tab
7. **Expected:** Crew draft appears with partial data

### Test Scenario 3: Save Complete Form as Draft
1. Fill entire Vehicle or Crew form (all 3 steps)
2. On final step, click "Save as Draft" instead of "Register"
3. **Expected:** Draft saved with all data
4. Edit draft later
5. **Expected:** All fields restored correctly

### Test Scenario 4: Edit and Complete Draft
1. Go to "Save and Drafted" tab
2. Click "Edit" on a draft
3. **Expected:** Form opens with saved data
4. Complete remaining fields
5. Click "Register Vehicle/Crew Member"
6. **Expected:** Full validation applied, registration succeeds

### Test Scenario 5: Multiple Drafts
1. Save multiple vehicle drafts
2. Save multiple crew drafts
3. **Expected:** All appear in "Save and Drafted" tab
4. Each can be edited/deleted independently

---

## Known Limitations

### Current Implementation:
1. ✅ Drafts saved with all current form data
2. ✅ No validation required for draft saving
3. ✅ Button visible on all steps
4. ⚠️ Alert used for success (could be improved with toast notification)
5. ⚠️ No duplicate draft detection (can save multiple drafts with same Employee ID/Plate)

### Future Enhancements:
- Add toast notifications instead of alerts
- Add draft auto-save functionality
- Add duplicate draft detection/merging
- Add draft expiration (delete old drafts after X days)
- Add draft versioning
- Add collaborative drafts (multiple admins)

---

## Error Handling

### Possible Errors:

1. **Network Error:**
   ```
   Error: Failed to save draft
   ```
   - **Cause:** Backend API not reachable
   - **Solution:** Check backend server is running

2. **Authorization Error:**
   ```
   Error: 401 Unauthorized
   ```
   - **Cause:** Invalid or expired token
   - **Solution:** Log out and log in again

3. **Validation Error (Backend):**
   ```
   Error: Type must be 'vehicle' or 'crew'
   ```
   - **Cause:** Invalid draft type sent
   - **Solution:** Frontend bug, check draftData structure

4. **Database Error:**
   ```
   Error: Failed to save to database
   ```
   - **Cause:** MongoDB connection issue
   - **Solution:** Check database connection

---

## Files Modified

### Frontend:
1. ✅ `apps/web/src/components/admin/CrewRegistrationWizard.tsx`
   - Added `handleSaveAsDraft()` function
   - Added "Save as Draft" button in navigation
   - No validation required for draft saving

2. ✅ `apps/web/src/components/admin/VehicleRegistrationWizard.tsx`
   - Added `handleSaveAsDraft()` function
   - Added "Save as Draft" button in navigation
   - No validation required for draft saving

### Backend:
- ❌ **No changes required** (infrastructure already exists)

### Documentation:
1. ✅ `docs/SAVE_AS_DRAFT_FEATURE.md` (this file)

---

## Team Coordination Notes

### ⚠️ No Database Changes Required:
- Using existing `RegistrationDraft` model
- No schema modifications
- No migration needed

### ✅ Safe Changes:
- Only modified UI components (wizard forms)
- Added new functions (no modifications to existing functions)
- Used existing API endpoints
- No model/schema changes

### 📋 For Team Leader:
All changes are isolated to the registration wizard components. No shared code, models, or database schemas were modified, ensuring zero merge conflicts with other team members' work.

---

## API Reference

### Save Draft
```http
POST /api/drafts
Authorization: Bearer {token}
Content-Type: application/json

{
  "registrationType": "vehicle" | "crew",
  "draftTitle": "Vehicle ABC-1234 - Draft",
  "formData": {
    // Vehicle: { basic: {}, station: {}, equipment: {} }
    // Crew: { personal: {}, professional: {}, emergencyContact: {} }
  },
  "currentStep": 1
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Draft saved successfully",
  "data": {
    "draft": {
      "_id": "...",
      "registrationType": "vehicle",
      "draftTitle": "Vehicle ABC-1234 - Draft",
      "formData": { ... },
      "currentStep": 1,
      "completionPercentage": 33,
      "audit": {
        "createdBy": "...",
        "createdAt": "2025-10-04T...",
    "updatedAt": "2025-10-04T..."
  }
}
```

**Response (Error):**
```json
{
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## Frequently Asked Questions

**Q: Can I save a completely empty form as draft?**
A: Yes, but it's not recommended. The draft will be saved but won't be useful.

**Q: What happens if I save a draft with the same Employee ID/Plate Number?**
A: Currently, multiple drafts with the same identifier can exist. Each is stored separately.

**Q: Can I save a draft on any step?**
A: Yes! The "Save as Draft" button is available on all three steps of the wizard.

**Q: Do drafts expire?**
A: No, drafts persist indefinitely until manually deleted.

**Q: Can I update an existing draft?**
A: Currently, each "Save as Draft" creates a new draft. To update, edit the old draft and save again (creates new version).

**Q: What happens to localStorage when I save a draft?**
A: The localStorage is cleared after successful draft save to prevent conflicts.

**Q: Are drafts shared between admins?**
A: No, each draft is associated with the admin who created it (via createdBy field).

---

## Change Log

### 2025-10-04 (Update 3) - API URL Fix
- 🐛 Fixed "Failed to save draft" error
- ✅ Corrected API URL construction
- ✅ Changed default from `"http://localhost:5000"` to `"http://localhost:5000/api"`
- ✅ Fixed double `/api/api/` issue when using environment variable
- ✅ Added detailed console logging for debugging
- ✅ Added error alert messages for better user feedback
- ✅ Updated both Vehicle and Crew registration wizards

### 2025-10-04 (Update 2) - Bug Fix
- 🐛 Fixed "Access denied. User not found." error
- ✅ Corrected API payload structure to match backend expectations
- ✅ Changed `type` → `registrationType`
- ✅ Added required `draftTitle` field
- ✅ Changed `data` → `formData` with proper structure
- ✅ Added `currentStep` tracking
- ✅ Updated both Vehicle and Crew registration wizards
- ✅ Updated documentation with correct API structure

### 2025-10-04 (Initial)
- ✅ Added "Save as Draft" button to Crew Registration Wizard
- ✅ Added "Save as Draft" button to Vehicle Registration Wizard
- ✅ Implemented `handleSaveAsDraft()` functions
- ✅ Connected to existing draft API endpoints
- ✅ Created comprehensive documentation

---

## Support

For questions or issues:
1. Check this documentation first
2. Verify API endpoints are working (`/api/drafts`)
3. Check browser console for errors
4. Contact team lead if backend issues suspected
