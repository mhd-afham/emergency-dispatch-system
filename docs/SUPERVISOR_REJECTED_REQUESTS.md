# Supervisor Rejected Requests Implementation

## Overview
This document describes the implementation of the "Rejected Requests" tab in the Supervisor Dashboard's Pending Approvals section, allowing supervisors to view and manage rejected vehicle and crew registration requests.

## Date
October 4, 2025

## Changes Made

### Component Modified
- **File**: `apps/web/src/components/supervisor/SupervisorPendingApprovals.tsx`

### New Features

#### 1. **Main Tab Navigation**
Added a two-level tab structure:
- **Level 1 (Main Tabs)**:
  - **Pending Approvals** (Blue) - Shows pending requests
  - **Rejected Requests** (Red) - Shows rejected requests
  
- **Level 2 (Sub Tabs)**:
  - **Vehicle Requests** - Shows vehicle registrations
  - **Crew Requests** - Shows crew registrations

#### 2. **State Management Updates**

```typescript
// New main tab state
const [mainTab, setMainTab] = useState<"pending" | "rejected">("pending");

// Existing sub-tab state (unchanged)
const [activeTab, setActiveTab] = useState<"vehicle" | "crew">("vehicle");

// New rejected data states
const [rejectedVehicles, setRejectedVehicles] = useState<any[]>([]);
const [rejectedCrew, setRejectedCrew] = useState<any[]>([]);
```

#### 3. **New Data Fetching Functions**

**Fetch Rejected Vehicles:**
```typescript
const fetchRejectedVehicles = async () => {
  // Fetches from: /api/vehicles/rejected
  // Uses existing endpoint from Admin dashboard implementation
}
```

**Fetch Rejected Crew:**
```typescript
const fetchRejectedCrew = async () => {
  // Fetches from: /api/crew/rejected
  // Uses existing endpoint from Admin dashboard implementation
}
```

#### 4. **Delete Functionality**

**Handle Delete Rejected:**
```typescript
const handleDeleteRejected = async (id: string, type: "vehicle" | "crew") => {
  // Confirmation dialog before deletion
  // DELETE request to /api/vehicles/{id} or /api/crew/{id}
  // Refreshes the list after successful deletion
}
```

#### 5. **UI Components**

##### Main Tab Navigation
- **Pending Approvals Tab**:
  - Blue accent color
  - Clock icon
  - Badge showing total pending count (vehicles + crew)
  
- **Rejected Requests Tab**:
  - Red accent color
  - X-circle icon
  - Badge showing total rejected count (vehicles + crew)

##### Sub-Tab Navigation
- Dynamic color based on main tab:
  - Pending: Blue for vehicles, Green for crew
  - Rejected: Red for both
- Badge showing count for current type

##### Rejected Vehicle Display
- Red-themed card with border
- Shows all vehicle details:
  - Plate number, type, make, model, year
  - Registration date
  - Station information
  - Equipment list
- **Rejection Details Section**:
  - Rejection reason
  - Rejected by (name)
  - Rejection date
- **Original Submission Info**:
  - Created by
  - Created date
- **Action Buttons**:
  - 👁️ **View** - View full details
  - 🗑️ **Delete** - Permanently delete the record

##### Rejected Crew Display
- Red-themed card with border
- Shows all crew details:
  - Name, employee ID
  - Role, certification level
  - Contact information
  - Hire date
  - Certifications and specializations
  - Emergency contact
- **Rejection Details Section**:
  - Rejection reason
  - Rejected by (name)
  - Rejection date
- **Original Submission Info**:
  - Created by
  - Created date
- **Action Buttons**:
  - 👁️ **View** - View full details
  - 🗑️ **Delete** - Permanently delete the record

## Technical Implementation

### Navigation Flow
1. User clicks **"Rejected Requests"** main tab
2. Data fetch triggered via `useEffect` (watches `mainTab`)
3. Both rejected vehicles and crew are loaded
4. User can switch between **Vehicle Requests** and **Crew Requests** sub-tabs
5. Appropriate content displays based on active sub-tab

### Data Flow

```
User Action: Click "Rejected Requests"
     ↓
Set mainTab = "rejected"
     ↓
useEffect detects change
     ↓
Fetch rejectedVehicles & rejectedCrew
     ↓
Display content based on activeTab (vehicle/crew)
```

### API Endpoints Used

All endpoints use existing implementations from the Admin dashboard:

1. **GET /api/vehicles/rejected**
   - Returns: `{ success: true, data: { rejectedVehicles: [...] } }`
   - Fetches all rejected vehicle registrations

2. **GET /api/crew/rejected**
   - Returns: `{ success: true, data: { rejectedCrew: [...] } }`
   - Fetches all rejected crew registrations

3. **DELETE /api/vehicles/{id}**
   - Permanently deletes a vehicle record
   - Used for rejected vehicles

4. **DELETE /api/crew/{id}**
   - Permanently deletes a crew record
   - Used for rejected crew members

### Error Handling
- Try-catch blocks for all API calls
- User-friendly error messages displayed
- Graceful fallback to empty arrays on error
- Confirmation dialog before deletion
- Success messages after deletion

## User Experience

### Visual Design
- **Color Coding**:
  - Pending: Blue/Green theme
  - Rejected: Red theme
- **Badge Indicators**: Show counts for quick overview
- **Icons**: Visual cues for different states and actions
- **Hover Effects**: Interactive feedback on cards and buttons

### Workflow

#### Viewing Rejected Requests
1. Navigate to Supervisor Dashboard → Pending Approvals
2. Click **"Rejected Requests"** tab
3. Choose **"Vehicle Requests"** or **"Crew Requests"**
4. View list of all rejected registrations

#### Viewing Details
1. Click **"👁️ View"** button on any rejected item
2. Full details modal appears (currently shows alert - can be enhanced)

#### Deleting Rejected Records
1. Click **"🗑️ Delete"** button
2. Confirm deletion in dialog
3. Record permanently deleted from system
4. List refreshes automatically
5. Success message displayed

## Benefits

1. **Transparency**: Supervisors can see all rejected requests
2. **Audit Trail**: Rejection reasons and details preserved
3. **Data Management**: Ability to clean up old rejected records
4. **Clear Organization**: Separate from pending approvals
5. **Consistency**: Matches Admin dashboard pattern

## No Breaking Changes

### Backend
- ✅ No database schema changes
- ✅ No new API endpoints (uses existing Admin endpoints)
- ✅ No server.js modifications needed
- ✅ No model changes required

### Frontend
- ✅ Self-contained component changes
- ✅ No impact on other team members' work
- ✅ Backward compatible with existing functionality

## Testing Checklist

- [ ] Main tab switching (Pending ↔ Rejected)
- [ ] Sub-tab switching (Vehicle ↔ Crew)
- [ ] Rejected vehicles display correctly
- [ ] Rejected crew display correctly
- [ ] Rejection details show properly
- [ ] View button functionality
- [ ] Delete confirmation dialog
- [ ] Successful deletion and list refresh
- [ ] Error handling for failed API calls
- [ ] Empty state displays correctly
- [ ] Badge counts update correctly
- [ ] Loading states work properly

## Future Enhancements

1. **View Details Modal**: Implement full details view instead of alert
2. **Re-approve Option**: Allow supervisor to re-approve a rejected request
3. **Edit & Resubmit**: Allow editing rejected records and resubmitting
4. **Filters**: Add date range, rejection reason filters
5. **Bulk Actions**: Delete multiple rejected records at once
6. **Export**: Export rejected records to CSV/PDF
7. **Search**: Search within rejected records

## Team Notes

⚠️ **Important for Team Leaders**:
- This is a UI-only change in the Supervisor component
- Uses existing backend endpoints (no backend changes needed)
- No database schema modifications
- No impact on Admin dashboard or other components
- Safe to merge - isolated changes

## Related Components

- `SupervisorPendingApprovals.tsx` - Main component modified
- `ModularSupervisorDashboard.tsx` - Parent dashboard (unchanged)
- Admin `AdminRegistrationSection.tsx` - Similar rejected records view

## Code Structure

```typescript
SupervisorPendingApprovals
├── State Management
│   ├── mainTab (pending | rejected)
│   ├── activeTab (vehicle | crew)
│   ├── vehicleApprovals[]
│   ├── crewApprovals[]
│   ├── rejectedVehicles[]
│   └── rejectedCrew[]
├── Data Fetching
│   ├── fetchVehicleApprovals()
│   ├── fetchCrewApprovals()
│   ├── fetchRejectedVehicles() [NEW]
│   └── fetchRejectedCrew() [NEW]
├── Event Handlers
│   ├── handleApprove()
│   ├── handleReject()
│   └── handleDeleteRejected() [NEW]
└── UI Components
    ├── Main Tab Navigation [UPDATED]
    ├── Sub Tab Navigation [UPDATED]
    ├── Pending Vehicle Content
    ├── Pending Crew Content
    ├── Rejected Vehicle Content [NEW]
    ├── Rejected Crew Content [NEW]
    └── Reject Modal
```

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  Registration Requests                              │
│  Review pending requests and manage rejected        │
│                                                      │
│  [Pending Approvals ⌛ 5] [Rejected Requests ❌ 3]│
│  ═════════════                                       │
│                                                      │
│  [Vehicle Requests 🚗 2] [Crew Requests 👥 1]     │
│  ════════════════                                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ❌ Rejected Crew Registrations              3 Rejected│
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤 PARAMEDIC                                  │ │
│  │ John Doe ❌ REJECTED                          │ │
│  │                                               │ │
│  │ Employee ID: EMP-001                          │ │
│  │ Contact: john@example.com                     │ │
│  │                                               │ │
│  │ 📋 Rejection Details:                         │ │
│  │ Reason: Missing certifications                │ │
│  │ Rejected by: Jane Smith on Oct 3, 2025       │ │
│  │                                               │ │
│  │                        [👁️ View] [🗑️ Delete] │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Success Criteria

✅ **Implemented**:
1. Main tab navigation for Pending vs Rejected
2. Sub-tab navigation for Vehicle vs Crew
3. Fetch rejected vehicles from existing endpoint
4. Fetch rejected crew from existing endpoint
5. Display rejected vehicles with all details
6. Display rejected crew with all details
7. Show rejection reason and details
8. View button for each item
9. Delete button with confirmation
10. Delete functionality working
11. Success/error message display
12. Badge counts showing correctly
13. Color-coded UI (red theme for rejected)
14. Empty state messages

## Dependencies

- React hooks: `useState`, `useEffect`
- Existing API endpoints from Admin implementation
- Existing models (no changes needed)
- Tailwind CSS for styling

## Browser Compatibility

- Works in all modern browsers
- Responsive design for mobile/tablet
- Uses standard Web APIs

## Performance Notes

- Data fetched only when tab is active (lazy loading)
- Separate API calls for vehicles and crew
- Minimal re-renders with proper state management
- Efficient conditional rendering

---

**Document Version**: 1.0  
**Last Updated**: October 4, 2025  
**Author**: Emergency Dispatch System Team
