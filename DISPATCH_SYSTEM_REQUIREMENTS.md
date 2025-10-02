# 🚨 Emergency Dispatch System - Requirements & Progress

## 📊 **System Overview**

**Core Concept**: Incident-centric emergency dispatch system where all components revolve around individual incidents.

**Architecture**: Full-screen workspace approach with real-time WebSocket updates via Socket.IO.

**Current Status**: Phase 4 (Assignment Logic) in progress.

---

## ✅ **COMPLETED PHASES**

### **Phase 1: Incident Queue** ✅

- Real-time incident display with WebSocket integration
- Priority-based sorting (Critical → High → Medium → Low)
- Visual priority indicators with color-coded badges
- Status filtering and interactive incident selection
- Live connection status monitoring

**Files**: `IncidentQueue.tsx`, `WebSocketContext.tsx`, `DispatcherDashboard.tsx`

### **Phase 2: Incident Workspace** ✅

- Full-screen incident detail view with Google Maps
- Complete incident information display
- "Assign Resources" button with suggestion panel
- Real-time incident updates via WebSocket
- Notes management functionality

**Files**: `DispatchWorkspace.tsx`, integrated Google Maps API

### **Phase 3: Vehicle Tracking & Visualization** ✅

- Real-time vehicle tracking on Google Maps
- Professional marker system with Heroicons
- Status-based vehicle indicators (available, assigned, en_route, on_scene)
- Vehicle info windows with crew and equipment details
- Streamlined map controls with essential information

**Files**: `vehicleUtils.ts`, enhanced `DispatchWorkspace.tsx`

---

## � **CURRENT PHASE: Assignment Logic (Phase 4)**

### **Implemented:**

- ✅ Resource suggestion matrix with 50+ emergency scenarios
- ✅ Intelligent suggestions based on incident type + category
- ✅ Distance and vehicle type matching logic
- ✅ Visual suggestion display with priority indicators

### **Missing (Critical):**

- ❌ **Assignment API endpoints** - No backend controller/routes for assignments
- ❌ **Actual resource dispatch workflow** - Currently just shows alert()
- ❌ **30-second acceptance timer** - Vehicle crews must accept/decline assignments
- ❌ **Assignment status tracking** - Real-time status updates (assigned → accepted → en_route → on_scene)
- ❌ **Auto-reassignment logic** - If crew declines or times out
- ❌ **WebSocket events** for assignments - `assignment_created`, `assignment_accepted`, etc.

### **Backend Schema Available:**

- ✅ `Assignment.js` model exists with complete schema
- ✅ Vehicle assignment fields in `Vehicle.js` model
- ❌ No `assignmentController.js` or `/api/assignments` routes

**Next Steps:**

1. Create assignment API endpoints (`POST /api/assignments`, `PUT /api/assignments/:id/status`)
2. Implement complete assignment workflow in frontend
3. Add 30-second acceptance timer with auto-reassignment
4. Add WebSocket events for real-time assignment tracking

---

## 📋 **PLANNED PHASES**

### **Phase 5: Communication System**

- Real-time chat interface with vehicle crews
- Separate tabs for each assigned vehicle (ambulance, fire truck, etc.)
- Communication tab for incident requester
- Web ↔ Mobile app messaging (vehicle leaders + citizens)
- Message history per incident

### **Phase 6: Mobile Applications**

- Vehicle leader mobile app (assignment acceptance, GPS tracking, communication)
- Citizen mobile app (incident reporting, communication with dispatcher)
- Push notifications and real-time synchronization

### **Phase 7: Notifications & Context Switching**

- Priority-based alert system for dispatchers
- Context switching between multiple incidents
- Auto-reassignment workflows with dispatcher approval

---

## 🛠️ **TECHNICAL DECISIONS**

| **Aspect**            | **Decision**                     | **Rationale**                         |
| --------------------- | -------------------------------- | ------------------------------------- |
| **Interface**         | Full-screen workspace            | Real dispatch center workflow         |
| **Multi-tasking**     | Single incident focus            | Dispatcher switches between incidents |
| **Maps**              | Google Maps (embedded)           | API key available, no popups          |
| **Communication**     | Chat-like with vehicle tabs      | Modern, intuitive messaging           |
| **Real-time**         | Socket.IO with JWT auth          | Established, working system           |
| **Assignment**        | Distance + vehicle type matching | No crew skill considerations          |
| **Auto-reassignment** | Requires dispatcher approval     | Safety and oversight                  |

---

## 🧠 **Resource Assignment Matrix**

**Logic Priority:**

1. **Incident Type Matching** - Use response matrix for required vehicle types
2. **Distance Calculation** - Find nearest available vehicles
3. **Vehicle Availability** - Only available/returning vehicles
4. **No Crew Skills** - Assume all vehicles have qualified crews

**Example Matrix:**

```typescript
medical: {
  cardiac_arrest: {
    vehicleTypes: [
      { vehicleType: "Ambulance", priority: 1, required: true },
      { vehicleType: "Support Vehicle", priority: 3, required: false }
    ],
    estimatedResponseTime: 8,
    minimumCrewSize: 2
  }
}
```

**File**: `apps/web/src/utils/resourceMatrix.ts` (✅ Complete with 50+ scenarios)

---

## 🚀 **IMMEDIATE DEVELOPMENT TASKS**

### **Assignment Workflow Implementation:**

1. **Create Assignment Controller** (`apps/backend/controllers/assignmentController.js`)

   - `POST /api/assignments` - Create new assignment
   - `PUT /api/assignments/:id/status` - Update assignment status
   - `GET /api/assignments/incident/:incidentId` - Get incident assignments

2. **Assignment Routes** (`apps/backend/routes/assignments.js`)

   - Authentication middleware
   - Role-based permissions (Dispatcher, Admin, Supervisor)

3. **Frontend Assignment Logic** (`DispatcherDashboard.tsx`)

   - Replace `alert()` with actual API calls
   - Implement assignment confirmation workflow
   - Add 30-second acceptance timer display

4. **WebSocket Events** (extend `WebSocketContext.tsx`)

   - `assignment_created` - New assignment dispatched
   - `assignment_status_update` - Crew accepted/declined/en_route
   - `assignment_timeout` - Auto-reassignment needed

5. **Real-time Assignment Tracking**
   - Update incident status automatically
   - Show assignment progress in DispatchWorkspace
   - Handle multiple vehicles per incident

---

## � **CRITICAL DEVELOPMENT RULES**

### **WebSocket Integration (Mandatory)**

- ALL components displaying incident/assignment data MUST use WebSocket real-time updates
- Connection status indicators must be consistent across components
- Console logging format: `📱 [ComponentName] Event: data`

### **Backend Schema Compliance (Mandatory)**

- ALWAYS match existing schemas in `apps/backend/models/`
- Use exact field names, data types, and enums as defined
- No frontend-only fields without backend support

### **Assignment Status Flow (Mandatory)**

```
pending → assigned → [accepted/declined] → en_route → on_scene → completed
```

### **Vehicle Types (Fixed)**

- Ambulance, Fire Engine, Rescue Vehicle, Support Vehicle
- No sub-types or skill considerations

---

## 📋 **VERIFICATION CHECKLIST**

**Before any deployment:**

- [ ] WebSocket real-time updates working
- [ ] Assignment API endpoints functional
- [ ] 30-second timer with auto-reassignment
- [ ] Multiple browser window synchronization
- [ ] Assignment status tracking end-to-end
- [ ] Error handling and loading states
- [ ] Backend schema field validation

---

_Last Updated: October 2, 2025 - Assignment Logic Phase 4 Analysis Complete_
_Next: Complete assignment workflow implementation with backend API endpoints_
