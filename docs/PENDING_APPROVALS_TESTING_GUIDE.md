# Pending Approvals Feature - Testing Guide

## 🎯 Feature Overview
The Pending Approvals feature allows Supervisors to review and approve/reject vehicle and crew registration requests submitted by Admins.

## 📍 Location
**Supervisor Dashboard** → **Pending Approvals** tab (after Shift Management)

## 🔐 Access Control
- **Accessible by**: Supervisors, Admins
- **Required authentication**: JWT token
- **Backend validation**: Role-based access control on all endpoints

## 🧪 Testing Steps

### Test 1: Vehicle Registration Approval Flow

#### Step 1: Submit Vehicle Registration (as Admin)
1. Log in as **Admin**
2. Navigate to **Admin Dashboard** → **Registration Management**
3. Click "**Start Registration**" under Vehicle Registration
4. Fill out the 3-step form:
   - **Step 1**: Basic Information (plate number, type, make, model, year)
   - **Step 2**: Equipment Inventory (add at least one item)
   - **Step 3**: Station Assignment (select home station)
5. Click "**Register Vehicle**"
6. ✅ Success message appears
7. Vehicle is now **pending approval** (not yet active)

#### Step 2: View Pending Approval (as Supervisor)
1. Log in as **Supervisor**
2. Navigate to **Supervisor Dashboard**
3. Click on "**✓ Pending Approvals**" tab
4. You should see the vehicle in the "**Vehicle Registration Requests**" section
5. Verify displayed information:
   - Plate number and vehicle type badge
   - Make, model, and year
   - Equipment items count
   - Requester name (admin who submitted)
   - Submission date/time

#### Step 3: Approve Vehicle
1. Click "**✓ Approve**" button
2. ✅ Green success message appears: "Vehicle approved successfully! It is now available for dispatch."
3. Vehicle disappears from pending list
4. **Backend**: Vehicle status updated to `isActive: true`, `status.operational: 'active'`
5. **Database**: Vehicle now available for dispatcher assignment

#### Step 4: Verify Vehicle is Active
1. Navigate to vehicle management (if available)
2. Search for the approved vehicle by plate number
3. Verify status shows as "Active"
4. Vehicle should be selectable for incident dispatch

### Test 2: Vehicle Registration Rejection Flow

#### Step 1: Submit Another Vehicle (as Admin)
1. Follow Test 1, Step 1 to submit a new vehicle

#### Step 2: Reject Vehicle (as Supervisor)
1. In **Pending Approvals** tab, find the new vehicle
2. Click "**✗ Reject**" button
3. Modal appears: "**Reject Registration**"
4. Enter rejection reason: *"Vehicle does not meet department standards"*
5. Click "**Reject**" button in modal
6. ✅ Success message: "Vehicle registration rejected. Admin has been notified."
7. Vehicle disappears from pending list
8. **Backend**: Vehicle is **permanently deleted** from database
9. **Note**: Admin notification is TODO (email service needed)

### Test 3: Crew Registration Flow

#### Current Behavior:
- Crew members are **automatically active** upon registration
- No approval required (by current design)
- "Crew Registration Requests" section shows: *"No pending crew registration requests"*
- Message displays: *"Crew members are automatically active upon registration"*

#### If Crew Approval is Needed:
See `PENDING_APPROVALS_IMPLEMENTATION.md` for required backend changes

### Test 4: Multiple Pending Registrations

#### Setup:
1. As Admin, submit 3 vehicle registrations
2. As Supervisor, view Pending Approvals

#### Verify:
- All 3 vehicles appear in the list
- Each vehicle shows complete information
- Can approve vehicles independently
- List updates after each approval
- Remaining vehicles stay in pending state

### Test 5: Error Handling

#### Test Invalid Rejection:
1. Click "Reject" button
2. Leave rejection reason blank
3. Try to submit
4. ✅ Error message: "Please provide a reason for rejection"

#### Test Network Error:
1. Disconnect from backend (stop server)
2. Try to approve a vehicle
3. ✅ Error message appears with failure notification
4. Vehicle remains in pending state

### Test 6: UI/UX Validation

#### Check Responsive Design:
- View on desktop (1920x1080)
- View on tablet (768px width)
- View on mobile (375px width)
- All content should be readable and buttons accessible

#### Check Loading States:
- Page should show spinner on initial load
- Buttons should show "Processing..." when clicked
- Buttons should be disabled during processing

#### Check Visual Elements:
- **Vehicle section**: Blue color theme
- **Crew section**: Green color theme
- Badges use appropriate colors
- Success messages: Green
- Error messages: Red
- Information is well-organized and easy to read

## 📊 Expected Database States

### Before Approval:
```javascript
Vehicle {
  isActive: false,
  status: {
    operational: 'maintenance',
    currentStatus: 'available'
  },
  registration: {
    approvedBy: null  // or the initial admin ID
  }
}
```

### After Approval:
```javascript
Vehicle {
  isActive: true,
  status: {
    operational: 'active',
    currentStatus: 'available'
  },
  registration: {
    approvedBy: <supervisor_id>
  }
}
```

### After Rejection:
```
Vehicle record deleted from database
```

## 🔍 Backend API Testing

### Using Postman/Thunder Client:

#### 1. Get Pending Approvals
```http
GET http://localhost:5000/api/vehicles/pending-approval
Authorization: Bearer <supervisor_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": [/* array of pending vehicles */],
  "count": 2
}
```

#### 2. Approve Vehicle
```http
POST http://localhost:5000/api/vehicles/<vehicle_id>/approve
Authorization: Bearer <supervisor_jwt_token>
Content-Type: application/json

{
  "comments": "Approved - meets all requirements"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vehicle approved successfully",
  "data": {
    "vehicle": {/* approved vehicle data */},
    "approvalDetails": {/* approval info */}
  }
}
```

#### 3. Reject Vehicle
```http
POST http://localhost:5000/api/vehicles/<vehicle_id>/reject
Authorization: Bearer <supervisor_jwt_token>
Content-Type: application/json

{
  "reason": "Does not meet equipment requirements"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vehicle registration rejected",
  "data": {
    "rejectionDetails": {/* rejection info */}
  }
}
```

## 🐛 Common Issues & Solutions

### Issue: "No pending approvals" when vehicles are pending
**Solution**: Check that vehicles have `isActive: false` in database

### Issue: Approve button doesn't work
**Solution**: Check browser console for API errors, verify JWT token is valid

### Issue: Can't see Pending Approvals tab
**Solution**: Verify user is logged in as Supervisor or Admin role

### Issue: Success message doesn't disappear
**Solution**: Message auto-disappears after 5 seconds (working as intended)

## ✅ Success Criteria

- [ ] Admin can submit vehicle registrations
- [ ] Supervisor sees pending registrations in dedicated tab
- [ ] Vehicle and crew sections are visually separated
- [ ] All vehicle details display correctly
- [ ] Approve button activates vehicle for dispatch
- [ ] Reject modal requires reason input
- [ ] Rejected vehicles are removed from database
- [ ] Success/error messages display appropriately
- [ ] UI is responsive and user-friendly
- [ ] Loading states provide good UX
- [ ] Multiple registrations handled correctly

## 📝 Notes for QA Team

1. **Data Setup**: Create test admin and supervisor accounts before testing
2. **Stations**: Ensure at least 3 stations exist in database for testing
3. **Equipment**: Test with various equipment types and quantities
4. **Timing**: Test during peak hours to verify performance
5. **Browser**: Test on Chrome, Firefox, Safari, and Edge
6. **Mobile**: Test on iOS and Android devices

---

**Last Updated**: October 3, 2025  
**Feature Version**: 1.0  
**Related Documentation**: PENDING_APPROVALS_IMPLEMENTATION.md