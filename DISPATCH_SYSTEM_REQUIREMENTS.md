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

### **Authentication & Data Model:**

**Dual-Model Architecture:**

- **User Model** → Authentication (email/password, JWT tokens)
  - `auth.role = "Field Crew"` for mobile app access
  - `auth.employeeId` links to Crew model
- **Crew Model** → Professional field operations
  - `personal.employeeId` matches User.auth.employeeId
  - `currentStatus.assignedVehicleId` links to Vehicle
- **Assignment Model** → Dispatch workflow
  - `resource.primaryCrewId` = Crew Leader (authoritative)
  - Only primaryCrewId can accept/decline assignments

**Login Flow:**

1. Authenticate via User model (email/password) → JWT token
2. Validate role = "Field Crew"
3. Fetch Crew profile by employeeId
4. Connect WebSocket with crew room: `crew-${crewId}`
5. Navigate to Crew Leader Dashboard

**Required Backend APIs:**

```javascript
GET /api/crews/by-employee/:employeeId  // Get crew profile
GET /api/crews/:crewId/assignments      // Get crew assignments
GET /api/crews/:crewId/vehicle          // Get assigned vehicle
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
| **Authentication**       | User (login) + Crew (operations)                 | Existing schema, no changes needed         |
| **Crew Leader ID**       | Assignment.resource.primaryCrewId                | Already in schema, authoritative source    |

---

## 📋 **USE CASE SCENARIOS**

### **UC-002: Assign Resources (Primary Workflow)**

**Actors:** Dispatcher (primary), Crew Leader (secondary), Citizen (secondary)

**Main Flow:**

1. Dispatcher reviews new incident in queue with priority indicator
2. System displays incident details (type, location, severity, notes)
3. System suggests nearest resources using matrix (type + distance + availability)
4. Dispatcher reviews suggestions on map interface with ETAs
5. Dispatcher selects preferred resource
6. System sends notification to crew via Socket.IO (`assignment_notification`)
7. System starts 30-second acceptance timer
8. **Crew leader accepts via mobile app**
9. System updates incident status to "En Route"
10. System begins GPS tracking and sends ETA to citizen
11. Dispatcher monitors unit progress on real-time dashboard

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

### **Sprint 1: Core Assignment Workflow (P0 - Critical) - 4.5 days**

**Backend APIs (0.5 day):**

1. `GET /api/crews/by-employee/:employeeId` - Fetch crew profile by employee ID
2. `GET /api/crews/:crewId/assignments` - Get crew's active assignments
3. `GET /api/crews/:crewId/vehicle` - Get crew's assigned vehicle details
4. `PUT /api/crews/:crewId/location` - Update crew GPS location

**Mobile App (4 days):**

1. **Authentication Flow** (0.5 day)

   - Login screen with User model authentication
   - Fetch linked Crew profile via employeeId
   - Store token + crewId securely (SecureStore)
   - Role validation (Field Crew only)

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
- **Crew** - Field personnel (employeeId links to User, assignedVehicleId)
- **Vehicle** - Emergency vehicles (crew[] array, status, location)
- **Assignment** - Dispatch workflow (primaryCrewId = crew leader)
- **Incident** - Emergency events (type, location, status, priority)

### **Key API Endpoints:**

**Auth:**

- `POST /api/auth/login` - User authentication

**Assignments:**

- `POST /api/assignments` - Create assignment (Dispatcher)
- `PUT /api/assignments/:id/status` - Update status (Crew Leader)
- `GET /api/assignments/incident/:incidentId` - Get incident assignments

**Crews (New - Required for Mobile):**

- `GET /api/crews/by-employee/:employeeId` - Get crew by employee ID
- `GET /api/crews/:crewId/assignments` - Get crew's assignments
- `GET /api/crews/:crewId/vehicle` - Get assigned vehicle
- `PUT /api/crews/:crewId/location` - Update GPS location

**Vehicles:**

- `GET /api/vehicles` - List all vehicles with filters
- `POST /api/vehicles/:vehicleId/readiness-check` - Submit checklist

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

_Last Updated: October 2, 2025 - Stakeholder Requirements & Mobile Strategy Documented_
_Next: Implement Sprint 1 (Core Assignment Workflow) - Mobile App Phase 4b_
