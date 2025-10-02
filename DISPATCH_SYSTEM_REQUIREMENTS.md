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

### **Phase 4a: Backend Assignment APIs + Web Workflow** 🔨 IN PROGRESS

**Implemented:**

- ✅ Resource suggestion matrix with 50+ emergency scenarios
- ✅ Intelligent suggestions based on incident type + category
- ✅ Distance and vehicle type matching logic
- ✅ Visual suggestion display with priority indicators

**Completed:**

- ✅ **Assignment Controller** - `assignmentController.js` with full CRUD operations
- ✅ **Assignment Routes** - `/api/assignments` endpoints with role-based permissions
- ✅ **WebSocket Events** - `assignment_created`, `assignment_status_update`, `assignment_declined`
- ✅ **Status Flow Logic** - Automatic incident/vehicle status updates based on assignment
- ✅ **Web Dispatcher Workflow** - Basic API integration (needs vehicle selection UI)

**Pending (requires mobile app):**

- ⏳ 30-second acceptance timer (needs mobile crew response)
- ⏳ Assignment acceptance/decline workflow
- ⏳ Auto-reassignment logic

### **Phase 4b: Mobile App (Vehicle Leader)** 📱 PARALLEL DEVELOPMENT NEEDED

**⚠️ Critical:** Mobile app MUST be developed in parallel to test complete assignment flow.

**Why Now:** The assignment workflow requires mobile crews to accept/decline assignments. Cannot test 30-second timer or auto-reassignment without mobile app.

**Mobile App Core Features:**

- Push notifications for new assignments
- Accept/Decline assignment interface with 30-second countdown
- Real-time GPS location sharing
- WebSocket connectivity for live status updates
- Assignment details display

**Development Strategy:**

1. Backend APIs (Phase 4a) - Web dispatcher can create assignments ✅
2. Mobile app (Phase 4b) - Vehicle crews can receive and respond 📱
3. Integration testing - Complete end-to-end assignment workflow 🔄

### **📝 Implementation Progress (October 2, 2025)**

**✅ Completed Today:**

1. **Assignment Controller** (`apps/backend/controllers/assignmentController.js`)

   - `POST /api/assignments` - Create assignment with full validation
   - `PUT /api/assignments/:id/status` - Update status (accept/decline/en_route/on_scene/complete)
   - `GET /api/assignments` - Get all assignments with filtering
   - `GET /api/assignments/:id` - Get assignment by ID
   - `GET /api/assignments/incident/:incidentId` - Get incident assignments
   - Automatic status synchronization: assignment → vehicle → incident

2. **Assignment Routes** (`apps/backend/routes/assignments.js`)

   - Authentication middleware on all routes
   - Role-based permissions: Dispatchers create, Responders update status
   - Registered in `server.js`

3. **WebSocket Events** (integrated in controller)

   - `assignment_created` - Broadcast to all dispatchers
   - `assignment_notification` - Targeted to specific vehicle (room: `vehicle-${vehicleId}`)
   - `assignment_status_update` - Real-time status changes for all
   - `assignment_declined` - Trigger reassignment workflow

4. **Web Integration** - Updated `DispatcherDashboard.tsx` with API structure

**⏳ Pending (Next Development Session):**

- Vehicle selection UI (modal with map showing available vehicles)
- Real-time assignment tracking display in DispatchWorkspace
- Mobile app for vehicle leaders (Phase 4b)
- 30-second timer implementation (frontend + backend timeout)

---

## 📋 **PLANNED PHASES (Updated)**

### **Phase 5: Communication System**

- Real-time chat interface with vehicle crews
- Separate tabs for each assigned vehicle (ambulance, fire truck, etc.)
- Communication tab for incident requester
- Web ↔ Mobile app messaging (vehicle leaders + citizens)
- Message history per incident

### **Phase 6: Citizen Mobile App**

- Incident reporting interface
- Real-time incident status tracking
- Communication with dispatcher
- Location sharing and incident details

### **Phase 7: Notifications & Context Switching**

- Priority-based alert system for dispatchers
- Context switching between multiple incidents
- Enhanced notification system for mobile apps

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
