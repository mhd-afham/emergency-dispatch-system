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

**✅ Implementation Verification (October 2, 2025):**

- **Schema Compliance:** ✅ All backend code uses exact Assignment.js, Vehicle.js, Incident.js models
- **WebSocket Integration:** ✅ Real-time events implemented correctly per requirements
  - `assignment_created` - Broadcast to all dispatchers
  - `assignment_notification` - Targeted to vehicle (room: `vehicle-${vehicleId}`)
  - `assignment_status_update` - Real-time status changes
  - `assignment_declined` - Trigger reassignment
- **Logging Format:** ✅ Follows mandated format `📱 [ComponentName] Event: data`
- **Status Flow:** ✅ Automatic synchronization: assignment → vehicle → incident

**⏳ Pending (Next Development Session):**

- Vehicle selection UI (modal with map showing available vehicles)
- Real-time assignment tracking display in DispatchWorkspace
- Mobile app for vehicle leaders (Phase 4b) - **NOW IN FOCUS**
- 30-second timer implementation (frontend + backend timeout)

---

## 📱 **MOBILE APP DEVELOPMENT STRATEGY (Phase 4b)**

### **Current Mobile App Status:**

- ✅ React Native (Expo) app exists in `apps/mobile/`
- ✅ Isolated architecture - NO shared packages (monorepo best practice)
- ✅ Existing: LoginScreen, DashboardScreen, local services/constants
- 🎯 Focus: Crew Leader features first, Citizen features later

### **Authentication & Data Model (Revised Strategy):**

**🎯 Core Principle: Permanent Leader Designation**

- **Crew Leader = Designated Role**, not assignment-dependent
- Only crew leaders can access mobile app
- Leaders assigned to vehicles during shift scheduling (Supervisor task)
- Vehicle readiness checks performed by leader BEFORE any assignments
- One leader per vehicle (enforced at shift scheduling)

**Schema Structure:**

- **User Model** → Authentication (email/password, JWT tokens)
  - `auth.role = "Field Crew"` for potential mobile app access
  - `auth.employeeId` links to Crew model
- **Crew Model** → Professional field operations
  - `personal.employeeId` matches User.auth.employeeId
  - **`professional.isLeader: Boolean`** ✅ **NEW FIELD** - Designates crew leaders
  - `currentStatus.assignedVehicleId` links to Vehicle
- **Vehicle Model** → Emergency vehicles
  - `assignment.crew[]` - Array of assigned crew members
  - Leader = crew member with `isLeader: true` (one per vehicle)
- **Assignment Model** → Dispatch workflow
  - `resource.primaryCrewId` auto-populated from vehicle's leader
  - System finds leader automatically during assignment creation

**Simplified Login Flow:**

1. Authenticate via User model (email/password) → JWT token
2. Validate `role = "Field Crew"`
3. Fetch Crew profile by employeeId
4. **Validate `crew.professional.isLeader === true`** ✅ **NEW CHECK**
5. If not leader → Reject access (mobile app for leaders only)
6. Connect WebSocket with crew room: `crew-${crewId}`
7. Navigate to Crew Leader Dashboard

**Required Backend APIs:**

```javascript
// Authentication & Profile
GET /api/crews/by-employee/:employeeId  // Get crew profile (with isLeader check)
GET /api/crews/:crewId/assignments      // Get crew's active assignments
GET /api/crews/:crewId/vehicle          // Get assigned vehicle details

// Supervisor Functions (NEW)
POST /api/vehicles/:vehicleId/assign-crew  // Assign crew to vehicle at shift start
PUT /api/vehicles/:vehicleId/unassign-crew // Remove crew from vehicle
GET /api/crews/leaders/available           // Get available crew leaders for scheduling
```

---

## 👥 **STAKEHOLDER REQUIREMENTS**

### **🎛️ Dispatcher Requirements (Web App)**

**✅ Completed:**

- Real-time incident queue with priority indicators
- Interactive map with live vehicle tracking
- Resource suggestion engine (50+ scenarios)
- Assignment creation API with WebSocket events
- Vehicle status monitoring (Available, En Route, On Scene, Cleared)

**⏳ Pending:**

- Vehicle selection UI (modal with available vehicles)
- Auto-reassignment logic (30-second timeout, crew decline)
- Real-time assignment tracking in workspace
- Two-way communication (chat with crew leaders)
- Performance metrics dashboard

### **🚑 Crew Leader Requirements (Mobile App - Priority)**

**🔴 Critical (Assignment Workflow):**

1. **Assignment Reception** - Push notifications via Socket.IO
2. **Accept/Decline Interface** - 30-second countdown timer, reason for decline
3. **Status Management** - Update status: En Route → On Scene → Cleared
4. **Incident Details** - Type, location, severity, special instructions
5. **Navigation** - Show incident location, tap to open Google Maps (like Uber)
6. **GPS Tracking** - Continuous location sharing while en_route, on-demand otherwise

**🟡 High Priority (Operations):**

7. **Vehicle Readiness Check** - Simplified pre-shift checklist

   - Vehicle Systems (fuel, battery, emergency lights)
   - Emergency Equipment (medical supplies/firefighting tools)
   - Safety Equipment (PPE, communication devices)
   - PASS/FAIL with notes → Auto-update vehicle status (Available/Out of Service)
   - Skip complex maintenance work orders

8. **Communication** - Push notifications + basic chat with dispatcher

   - Dispatcher sends text messages to crew
   - Crew sends pre-defined status updates + optional text
   - Real-time delivery via Socket.IO
   - Message history per incident

9. **Current Location Display** - Show crew position on simple map

**🟢 Medium Priority (Nice to Have):**

10. **Request Backup** - Quick button to request additional resources
11. **Offline Support** - Capture data offline, sync when connected
12. **Post-Incident Report** - Simple form (casualty count, actions taken, notes)

### **👤 Citizen Requirements (Mobile App - Future Phase)**

**⏳ Deferred to Phase 6:**

- Incident reporting interface
- Real-time status tracking
- Communication with dispatcher
- Location sharing for incident reporting

---

## 🎯 **FEATURE PRIORITY MATRIX**

### **Phase 4b - Crew Leader App (Current Focus)**

| Priority | Feature                     | Estimate | Dependency      |
| -------- | --------------------------- | -------- | --------------- |
| 🔴 P0    | Schema Update (isLeader)    | 0.5 day  | None            |
| 🔴 P0    | Leader-Only Authentication  | 0.5 day  | Schema change   |
| 🔴 P0    | Assignment Notifications    | 1 day    | Socket.IO setup |
| 🔴 P0    | Accept/Decline UI + Timer   | 1 day    | None            |
| 🔴 P0    | Status Update Buttons       | 0.5 day  | None            |
| 🔴 P0    | GPS Location Sharing        | 1 day    | Expo Location   |
| 🔴 P0    | Incident Details Screen     | 0.5 day  | None            |
| 🔴 P0    | Navigation (Google Maps)    | 0.5 day  | Linking API     |
| 🟡 P1    | Vehicle Readiness Checklist | 1 day    | None            |
| 🟡 P1    | Communication (Chat)        | 1.5 days | Socket.IO       |
| 🟡 P1    | Current Location Map        | 0.5 day  | Google Maps     |
| 🟢 P2    | Request Backup              | 0.5 day  | API endpoint    |
| 🟢 P2    | Post-Incident Report        | 1 day    | None            |
| 🟢 P2    | Offline Support             | 2 days   | AsyncStorage    |

**Total P0 (Critical):** ~4.5 days | **Total P1 (High):** ~3 days | **Total P2 (Medium):** ~3.5 days

---

## 🛠️ **TECHNICAL IMPLEMENTATION DECISIONS**

| Aspect                   | Decision                                         | Rationale                                  |
| ------------------------ | ------------------------------------------------ | ------------------------------------------ |
| **Mobile Notifications** | Socket.IO in-app (no Expo Push)                  | Simpler, no external service dependencies  |
| **Web Notifications**    | Socket.IO + browser notifications (optional)     | Real-time updates via existing WebSocket   |
| **Navigation**           | Open Google Maps app with destination            | No routing integration needed (Uber model) |
| **GPS Frequency**        | Continuous (15s) while en_route, on-demand else  | Balance accuracy vs battery life           |
| **Communication**        | Socket.IO chat (dispatcher → text, crew → quick) | Consistent with real-time architecture     |
| **Vehicle Readiness**    | Simplified checklist (5-7 items, PASS/FAIL)      | Quick pre-shift, skip complex work orders  |
| **Authentication**       | User + Crew with `isLeader` flag                 | Leaders only - permanent designation       |
| **Crew Leader ID**       | Permanent via `Crew.professional.isLeader`       | Designated role, not assignment-dependent  |
| **Leader Assignment**    | Supervisor assigns at shift start                | One leader per vehicle, enforced by system |

---

## 📋 **USE CASE SCENARIOS**

### **UC-001: Assign Crew to Vehicle (Shift Start - NEW)**

**Actor:** Supervisor

**Pre-condition:** Crew members are on-duty and available

**Main Flow:**

1. Supervisor opens vehicle management interface
2. System displays list of vehicles at station
3. Supervisor selects vehicle needing crew assignment
4. System shows available crew members with leader status indicators
5. Supervisor selects crew members (must include exactly ONE leader)
6. System validates: One and only one crew member has `isLeader: true`
7. System assigns crew to vehicle (`Vehicle.assignment.crew[]`)
8. System updates crew status (`assignedVehicleId` for all crew members)
9. System marks vehicle as "Ready for Readiness Check"
10. Crew leader receives notification to perform vehicle readiness check

**Branching Actions:**

- **A: No Leader Selected** - System rejects: "Must assign at least one crew leader"
- **B: Multiple Leaders Selected** - System rejects: "Cannot assign multiple leaders to one vehicle"
- **C: Vehicle Already Has Crew** - System asks to confirm replacement of existing crew

### **UC-002: Assign Resources (Primary Workflow)**

**Actors:** Dispatcher (primary), Crew Leader (secondary), Citizen (secondary)

**Pre-condition:** Vehicle has assigned crew with leader (from UC-001)

**Main Flow:**

1. Dispatcher reviews new incident in queue with priority indicator
2. System displays incident details (type, location, severity, notes)
3. System suggests nearest resources using matrix (type + distance + availability)
4. Dispatcher reviews suggestions on map interface with ETAs
5. Dispatcher selects preferred vehicle
6. **System automatically identifies leader from vehicle's assigned crew** ✅ **NEW**
7. System creates assignment with `primaryCrewId` = vehicle's leader
8. System sends notification to leader via Socket.IO (`assignment_notification` to `crew-${leaderId}`)
9. System starts 30-second acceptance timer
10. **Crew leader accepts via mobile app**
11. System updates incident status to "En Route"
12. System begins GPS tracking and sends ETA to citizen
13. Dispatcher monitors unit progress on real-time dashboard

**Branching Actions:**

- **A: Manual Override** - Dispatcher selects different resource, system recalculates ETA
- **B: Multiple Resources** - System suggests ambulance + fire truck, coordinates dual dispatch
- **C: No Optimal Resources** - System shows next available with delay estimate
- **D: Acceptance Timeout** - After 30s, dispatcher chooses retry or auto-reassign
- **E: Crew Declines** - System logs reason, immediately suggests alternative resources

### **UC-005: Vehicle/Equipment Readiness (Simplified)**

**Actor:** Crew Leader

**Main Flow:**

1. Crew leader opens "Vehicle Readiness" in mobile app
2. System displays assigned vehicle info
3. Crew leader taps "Begin Check" button
4. System loads checklist (5-7 items based on vehicle type)
5. Crew leader checks each item, marks PASS/FAIL with optional notes
6. For FAIL items, crew leader describes issue
7. System calculates overall readiness
8. **If all critical items PASS**: Vehicle marked "Available", dispatcher notified
9. **If any critical FAIL**: Vehicle marked "Out of Service", supervisor notified
10. System logs timestamp, GPS location, crew leader ID

**Simplified Checklist:**

- **Ambulance**: Fuel Level, Emergency Lights/Siren, Medical Supplies, Communication Equipment, Safety Gear
- **Fire Engine**: Fuel Level, Emergency Lights/Siren, Water/Foam, Firefighting Tools, Safety Gear

---

## 📋 **PLANNED PHASES (Next)**

### **Phase 5: Communication System (Web + Mobile)**

- Socket.IO-based real-time chat
- Dispatcher → Crew Leader text messages
- Crew Leader → Dispatcher quick updates + optional text
- Message history per incident
- Push notification integration for messages

### **Phase 6: Citizen Mobile App**

- Incident reporting interface
- Real-time status tracking
- Communication with dispatcher
- Location sharing for incident reporting

### **Phase 7: Advanced Features**

- Auto-reassignment logic completion
- Performance metrics dashboard
- Post-incident reporting
- Offline support with sync

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

## 🚀 **NEXT DEVELOPMENT TASKS (Phase 4b - Mobile App)**

### **Sprint 0: Schema Updates & Supervisor Features (NEW - 1 day)**

**Schema Changes (0.5 day):**

1. **Update Crew Model** - Add `professional.isLeader: Boolean` field
   - Default: `false`
   - Required: `true`
   - Migration script to set existing crew leaders
2. **Update Assignment Controller** - Auto-populate `primaryCrewId` from vehicle's leader
   - Find crew with `isLeader: true` from `Vehicle.assignment.crew[]`
   - Validate vehicle has exactly one leader

**Supervisor APIs (0.5 day):**

3. `POST /api/vehicles/:vehicleId/assign-crew` - Assign crew to vehicle at shift start
   - Validate: Exactly one crew member has `isLeader: true`
   - Update `Vehicle.assignment.crew[]` and `Crew.currentStatus.assignedVehicleId`
4. `PUT /api/vehicles/:vehicleId/unassign-crew` - Remove crew from vehicle
5. `GET /api/crews/leaders/available` - List available crew leaders for scheduling

### **Sprint 1: Core Assignment Workflow (P0 - Critical) - 5 days**

**Backend APIs (0.5 day):**

1. `GET /api/crews/by-employee/:employeeId` - Fetch crew profile by employee ID (with `isLeader` check)
2. `GET /api/crews/:crewId/assignments` - Get crew's active assignments
3. `GET /api/crews/:crewId/vehicle` - Get crew's assigned vehicle details
4. `PUT /api/crews/:crewId/location` - Update crew GPS location

**Mobile App (4.5 days):**

1. **Leader-Only Authentication Flow** (0.5 day)

   - Login screen with User model authentication
   - Fetch linked Crew profile via employeeId
   - **Validate `crew.professional.isLeader === true`** ✅ **NEW**
   - Reject non-leaders with clear error message
   - Store token + crewId securely (SecureStore)
   - Role validation (Field Crew + Leader only)

2. **Socket.IO Integration** (0.5 day)

   - Connect on login with JWT token
   - Join crew room: `crew-${crewId}`
   - Listen for `assignment_notification` event
   - Handle reconnection logic

3. **Assignment Notification** (1 day)

   - Real-time push notification via Socket.IO
   - Assignment detail modal (incident info, location, priority)
   - Accept/Decline buttons
   - 30-second countdown timer with visual indicator
   - Decline reason picker (vehicle issue, emergency, other)

4. **Status Management** (0.5 day)

   - Dashboard with current assignment display
   - Status update buttons: En Route → On Scene → Cleared
   - API integration: `PUT /api/assignments/:id/status`
   - Real-time status sync via Socket.IO

5. **Incident Details & Navigation** (0.5 day)

   - Incident information screen (type, address, notes, severity)
   - Show incident location on simple map
   - "Get Directions" button → Open Google Maps app with destination
   - Use React Native Linking API

6. **GPS Location Sharing** (1 day)
   - Request location permissions (Expo Location)
   - Continuous tracking (15s interval) while status = "en_route"
   - On-demand tracking for other statuses
   - Background location updates (iOS/Android permissions)
   - Send location to backend: `PUT /api/crews/:crewId/location`

### **Sprint 2: Vehicle Readiness & Communication (P1 - High) - 3 days**

7. **Vehicle Readiness Checklist** (1 day)

   - Pre-shift checklist screen
   - Dynamic items based on vehicle type (Ambulance vs Fire Engine)
   - PASS/FAIL toggle with optional notes field
   - Overall status calculation
   - API: `POST /api/vehicles/:vehicleId/readiness-check`
   - Auto-update vehicle operational status

8. **Basic Communication** (1.5 days)

   - Chat screen with dispatcher
   - Receive text messages from dispatcher (Socket.IO)
   - Send quick status updates (predefined buttons) + optional text
   - Message history per incident
   - Push notification for new messages
   - API: `POST /api/communication/messages`

9. **Current Location Display** (0.5 day)
   - Simple map showing crew's current position
   - Incident location marker
   - Distance to incident calculation

### **Sprint 3: Additional Features (P2 - Medium) - 3.5 days**

10. **Request Backup** (0.5 day)

    - Quick action button on assignment screen
    - Send request to dispatcher with reason
    - API: `POST /api/assignments/:id/backup-request`

11. **Post-Incident Report** (1 day)

    - Simple form after assignment completion
    - Fields: casualty count, actions taken, notes, equipment used
    - API: `POST /api/assignments/:id/report`

12. **Offline Support** (2 days)
    - AsyncStorage for local data caching
    - Queue actions when offline
    - Sync on reconnection
    - Offline indicator in UI

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

- [x] WebSocket real-time updates working (Phase 4a complete)
- [x] Assignment API endpoints functional (Phase 4a complete)
- [ ] Mobile app assignment workflow (Phase 4b - in progress)
- [ ] 30-second timer with auto-reassignment (requires mobile app)
- [ ] Vehicle readiness checking (mobile app)
- [ ] GPS location tracking (mobile app)
- [ ] Communication system (web + mobile)
- [ ] Multiple browser window synchronization
- [ ] Error handling and loading states

---

## 📝 **QUICK REFERENCE**

### **Schema Models:**

- **User** - Authentication (email/password, role: "Field Crew")
- **Crew** - Field personnel (employeeId links to User, **`isLeader: Boolean`** ✅ NEW, assignedVehicleId)
- **Vehicle** - Emergency vehicles (crew[] array with one leader, status, location)
- **Assignment** - Dispatch workflow (primaryCrewId auto-populated from vehicle's leader)
- **Incident** - Emergency events (type, location, status, priority)

### **Key API Endpoints:**

**Auth:**

- `POST /api/auth/login` - User authentication

**Assignments:**

- `POST /api/assignments` - Create assignment (Dispatcher) - Auto-finds leader from vehicle
- `PUT /api/assignments/:id/status` - Update status (Crew Leader only)
- `GET /api/assignments/incident/:incidentId` - Get incident assignments

**Crews (Required for Mobile):**

- `GET /api/crews/by-employee/:employeeId` - Get crew by employee ID (validates isLeader)
- `GET /api/crews/:crewId/assignments` - Get crew's active assignments
- `GET /api/crews/:crewId/vehicle` - Get assigned vehicle details
- `PUT /api/crews/:crewId/location` - Update GPS location
- `GET /api/crews/leaders/available` - Get available crew leaders ✅ NEW

**Vehicles (Supervisor Functions):**

- `GET /api/vehicles` - List all vehicles with filters
- `POST /api/vehicles/:vehicleId/assign-crew` - Assign crew at shift start ✅ NEW
- `PUT /api/vehicles/:vehicleId/unassign-crew` - Remove crew from vehicle ✅ NEW
- `POST /api/vehicles/:vehicleId/readiness-check` - Submit checklist (Leader only)

### **WebSocket Events:**

**Assignments:**

- `assignment_created` - Broadcast to all dispatchers
- `assignment_notification` - Targeted to crew: `crew-${crewId}`
- `assignment_status_update` - Real-time status changes
- `assignment_declined` - Trigger reassignment workflow

**Communication:**

- `message_received` - New chat message
- `typing_indicator` - User is typing

**Location:**

- `crew_location_update` - GPS position update

### **Mobile App Stack:**

- React Native (Expo framework)
- Socket.IO client for real-time
- Expo Location for GPS tracking
- Expo SecureStore for token storage
- React Navigation for screens
- Google Maps (open via Linking API)

---

## 🔄 **STRATEGY REVISION HISTORY**

**October 3, 2025 - Leadership Model Revised:**

- **Problem Identified:** Assignment-based leadership was temporary and prevented pre-assignment operations (vehicle readiness)
- **Solution Adopted:** Permanent leader designation via `Crew.professional.isLeader` boolean
- **Key Changes:**
  - Only crew leaders can access mobile app
  - Leaders assigned to vehicles by supervisor at shift start
  - Assignment controller auto-finds leader from vehicle's crew
  - Supervisor workflow added (UC-001)
  - Authentication simplified (direct isLeader check)
- **Benefits:** Pre-assignment operations, clearer authority, simpler implementation, matches real-world operations

---

_Last Updated: October 3, 2025 - Leadership Strategy Revised to Permanent Designation Model_
_Next: Implement Sprint 0 (Schema Updates) → Sprint 1 (Core Assignment Workflow) - Phase 4b_
