# 🚨 Emergency Dispatch System - Complete Requirements & Progress

## � **CRITICAL DEVELOPMENT INSTRUCTIONS**

### **📜 MANDATORY IMPLEMENTATION RULES**

**⚠️ EVERY DEVELOPER MUST FOLLOW THESE INSTRUCTIONS WHEN IMPLEMENTING ANY FEATURE:**

#### **1. WebSocket Real-Time Integration (MANDATORY)**

- **RULE**: ALL components that display incident data MUST use WebSocket real-time updates
- **IMPLEMENTATION**:
  ```typescript
  import { useWebSocket } from "../../contexts/WebSocketContext";
  const { subscribe, isConnected, isConnecting } = useWebSocket();
  ```
- **SUBSCRIPTION PATTERN**:
  ```typescript
  useEffect(() => {
    const unsubscribe = subscribe("incident_update", (data) => {
      // Handle real-time updates
      setIncident(data.incident);
      console.log("📱 Real-time update received:", data.incident.incidentId);
    });
    return unsubscribe;
  }, [subscribe]);
  ```
- **CONNECTION STATUS**: MUST show consistent connection indicators across ALL components

#### **2. Backend Schema Compliance (MANDATORY)**

- **RULE**: ALWAYS match existing backend schemas in `apps/backend/models/`
- **KEY SCHEMAS**: Incident.js, Vehicle.js, User.js, Assignment.js, Communication.js
- **VALIDATION**: Use exact field names, data types, and enums as defined in backend
- **NO CUSTOM FIELDS**: Do not create frontend-only fields without backend support

#### **3. Consistent UI/UX Patterns (MANDATORY)**

- **CONNECTION STATUS**:
  ```typescript
  // CORRECT Implementation (use in ALL components)
  <div className="flex items-center space-x-2 text-sm">
    <div
      className={`w-2 h-2 rounded-full ${
        isConnected
          ? "bg-green-500 animate-pulse"
          : isConnecting
          ? "bg-amber-500"
          : "bg-red-500"
      }`}
    />
    <span>
      {isConnected
        ? "Live Updates"
        : isConnecting
        ? "Connecting..."
        : "Disconnected"}
    </span>
  </div>
  ```
- **PRIORITY COLORS**: Critical(Red), High(Orange), Medium(Yellow), Low(Green)
- **STATUS WORKFLOW**: pending → assigned → en_route → on_scene → resolved/cancelled

#### **4. Real-Time Event Handling (MANDATORY)**

- **SUBSCRIBE TO**: `incident_created`, `incident_update`, `incident_deleted`
- **LOGGING FORMAT**: `console.log("📱 [ComponentName] Event:", data)`
- **ERROR HANDLING**: Always include try-catch for WebSocket operations
- **CLEANUP**: Always return unsubscribe function in useEffect

#### **5. Google Maps Integration Standards (MANDATORY)**

- **LIBRARY**: Use `@react-google-maps/api` (already configured)
- **CONTEXT**: Wrap components with `<GoogleMapsProvider>`
- **COORDINATES**: Backend uses GeoJSON format `[longitude, latitude]`
- **CONVERSION**:
  ```typescript
  const mapCoords = {
    lat: incident.location.coordinates.coordinates[1], // latitude
    lng: incident.location.coordinates.coordinates[0], // longitude
  };
  ```

#### **6. Development Verification Checklist**

Before submitting ANY code, verify:

- [ ] ✅ WebSocket integration implemented with proper subscriptions
- [ ] ✅ Connection status indicator matches other components
- [ ] ✅ Backend schema fields used exactly as defined
- [ ] ✅ Real-time updates working (test with multiple browser windows)
- [ ] ✅ Error handling and loading states implemented
- [ ] ✅ Console logging follows format: `📱 [ComponentName] Event: data`
- [ ] ✅ TypeScript compilation with no errors
- [ ] ✅ Component responds to server start/stop (connection status changes)

---

## �📋 **Project Overview**

An incident-centric emergency dispatch system where all components revolve around individual incidents. Dispatchers can manage multiple incidents simultaneously with real-time upda---

## 🔍 **DETAILED BACKEND SCHEMA ANALYSIS**

### **📋 Available Models (apps/backend/models/):**

- ✅ **Incident.js** - Complete incident management with geospatial support
- ✅ **Vehicle.js** - Vehicle fleet management with GPS tracking
- ✅ **User.js** - User authentication and role management
- ✅ **Assignment.js** - Resource-to-incident assignments with timeline tracking
- ✅ **Communication.js** - Message system with attachments and priority
- ✅ **Crew.js** - Field crew management
- ✅ **Station.js** - Emergency station locations
- ✅ **Shift.js** - Personnel shift management
- ✅ **Report.js** - Incident reporting system
- ✅ **AuditLog.js** - System audit trail
- ✅ **EquipmentCheck.js** - Equipment maintenance tracking
- ✅ **EquipmentChecklistTemplate.js** - Maintenance templates

### **🗄️ Core Schema Structure:**

#### **Incident Schema Key Fields:**

```typescript
interface Incident {
  incidentId: string; // Auto-generated format: INC-YYYYMMDD-XXXXX
  callerInfo: {
    name: string;
    contactNumber: string; // Sri Lankan validation
    alternateContact?: string;
    reportingMethod:
      | "phone_call"
      | "mobile_app"
      | "sms"
      | "walk_in"
      | "third_party";
  };
  incidentType: "medical" | "fire" | "rescue" | "hazmat" | "traffic" | "other";
  incidentCategory: string; // Type-specific categories
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: {
    address: string;
    city: string;
    province: string; // Sri Lankan provinces
    coordinates?: { type: "Point"; coordinates: [lng, lat] }; // GeoJSON
    locationAccuracy: "exact" | "approximate" | "general_area";
    landmarks?: string;
  };
  status:
    | "pending"
    | "assigned"
    | "en_route"
    | "on_scene"
    | "resolved"
    | "cancelled";
  assignedResources: Array<{
    resourceId: ObjectId; // References Vehicle
    assignedAt: Date;
    status: "assigned" | "en_route" | "on_scene" | "completed";
  }>;
  notes: Array<{ note: string; addedBy: ObjectId; timestamp: Date }>;
  // ... more fields
}
```

#### **Vehicle Schema Key Fields:**

```typescript
interface Vehicle {
  registration: {
    plateNumber: string; // Sri Lankan format: CAB-1234
    vehicleType:
      | "Ambulance"
      | "Fire Engine"
      | "Rescue Vehicle"
      | "Support Vehicle";
    make: string;
    model: string;
    year: number;
  };
  status: {
    operational: "active" | "maintenance" | "out_of_service";
    currentStatus:
      | "available"
      | "assigned"
      | "en_route"
      | "on_scene"
      | "returning";
    currentLocation: { type: "Point"; coordinates: [lng, lat] };
    lastLocationUpdate: Date;
  };
  // ... more fields
}
```

#### **Assignment Schema Key Fields:**

```typescript
interface Assignment {
  incident: { incidentId: ObjectId };
  resource: {
    vehicleId: ObjectId;
    primaryCrewId: ObjectId;
    additionalCrew: ObjectId[];
  };
  dispatch: {
    assignedBy: ObjectId;
    assignedAt: Date;
    priority: "routine" | "urgent" | "emergency" | "critical";
    estimatedArrivalTime?: Date;
  };
  response: {
    status:
      | "assigned"
      | "accepted"
      | "declined"
      | "en_route"
      | "on_scene"
      | "completed"
      | "cancelled";
    acceptedAt?: Date;
    // ... timeline tracking
  };
}
```

### **🔌 Available API Endpoints:**

- ✅ `/api/auth/*` - Authentication (login, register, verify)
- ✅ `/api/incidents/*` - Incident CRUD operations
- ✅ `/api/equipment/*` - Equipment management
- 🚧 Vehicle management endpoints - _Need to check if implemented_
- 🚧 Assignment/dispatch endpoints - _Need to check if implemented_
- 🚧 Communication endpoints - _Need to check if implemented_

---

## ❓ **CLARIFYING QUESTIONS & DECISIONS NEEDED**

### **✅ DECISIONS MADE:**

#### **🗺️ Google Maps Integration:**

- **Map Library**: `@react-google-maps/api` (most popular and well-maintained)
- **Real-time Tracking**: ✅ **REQUIRED** - Live vehicle location markers
- **Map Features**: Vehicle markers, incident location, route calculation, ETA display

#### **🚀 Resource Assignment Logic:**

- **Response Matrix**: ✅ **HARDCODED** - Easier customization and faster performance
- **Vehicle Availability**: ✅ **Status Field Based** - Use `Vehicle.status.currentStatus`
  - Available when: `currentStatus === 'available'`
  - Unavailable when: `currentStatus === 'assigned' | 'en_route' | 'on_scene' | 'returning'`

#### **🔔 Notification System:**

- **Alert Interruption**: ✅ **MODERATE AGGRESSIVENESS**
  - Critical/High priority: Floating notification with 8-second auto-switch
  - Medium priority: Persistent notification requiring dispatcher click
  - Low priority: Subtle indicator in incident queue

### **📋 PENDING DECISIONS (Phase 3+):**

#### **📱 Communication System:**

3. **Vehicle Communication Tabs**: How do we identify the "leader" of each vehicle crew?
   - Use `Assignment.resource.primaryCrewId`?
   - Separate "Vehicle Leader" role in User schema?
4. **Mobile App Integration**: Are the mobile apps (vehicle leader + citizen) already built?
   - Do they have WebSocket connectivity?
   - What's the message format between web ↔ mobile?

### **📊 Data Integration:**

8. **Missing Backend Implementation**: Do we need to create controllers/routes for:
   - Vehicle management and GPS updates?
   - Assignment dispatch operations?
   - Real-time communication messaging?
9. **WebSocket Events**: Beyond incident events, do we need:
   - `vehicle_location_update` events?
   - `assignment_status_change` events?
   - `communication_message` events?

### **🎨 UI/UX Implementation:**

10. **Incident Categories**: The schema supports detailed categories per type. Should we:
    - Show category selection dropdown in incident creation?
    - Use categories for more specific resource matching?
11. **Sri Lankan Localization**: The schemas include Sri Lankan-specific validation:
    - Phone numbers (+94 format)
    - Province enums (Western, Central, etc.)
    - Coordinate boundaries (79.5-81.9 lng, 5.9-9.9 lat)
    - Should UI reflect this localization?

---

## 🚀 **IMMEDIATE NEXT STEPS**

### **🚧 PHASE 2: READY TO IMPLEMENT**

#### **IncidentWorkspace Component Features:**

1. ✅ **Full incident detail view** using complete Incident schema
2. ✅ **Google Maps integration** with `@react-google-maps/api`
3. ✅ **Real-time vehicle tracking** markers on map
4. ✅ **"Assign Resources" button** with intelligent suggestions
5. ✅ **Hardcoded response matrix** for resource matching
6. ✅ **Notes display and adding** functionality
7. ✅ **Vehicle availability filtering** based on status field

#### **Implementation Plan:**

- **Step 1**: Install and configure Google Maps React library
- **Step 2**: Create IncidentWorkspace component with incident details
- **Step 3**: Embed Google Maps with incident location marker
- **Step 4**: Add vehicle tracking markers with real-time updates
- **Step 5**: Implement "Assign Resources" with response matrix logic
- **Step 6**: Add incident notes functionality

#### **Backend APIs Required:**

- 🚧 **Vehicle Management**: GET `/api/vehicles` with availability filtering
- 🚧 **Assignment Operations**: POST `/api/assignments` for dispatch operations
- 🚧 **Real-time Vehicle Tracking**: WebSocket events for location updates

---

_Last Updated: Complete repository analysis - Ready for Phase 2 implementation_
*Next Phase: IncidentWorkspace with Google Maps integration*and intelligent resource assignment.

---

## 🎯 **Core System Flow**

### **Main Workflow:**

1. **Incident Queue** → Dispatcher sees priority-sorted active incidents
2. **Incident Selection** → Click incident → Enter full-screen incident workspace
3. **Incident Details** → Full incident info with "Assign Resources" button
4. **Resource Assignment** → Google Maps with intelligent suggestions
5. **Active Monitoring** → Real-time tracking with incident communications
6. **Context Switching** → Alerts for other incidents, easy navigation back

---

## 🏗️ **System Architecture Decisions**

| **Aspect**             | **Decision**            | **Rationale**                         |
| ---------------------- | ----------------------- | ------------------------------------- |
| **Interface Style**    | Full-screen workspace   | Real dispatch center workflow         |
| **Multi-tasking**      | Single incident focus   | Dispatcher switches between incidents |
| **Map Integration**    | Embedded in workspace   | No popups/overlays                    |
| **Communication**      | Chat-like interface     | Modern, intuitive messaging           |
| **Alert Interruption** | Moderate aggressiveness | Balance urgency with workflow         |
| **Maps Provider**      | Google Maps             | API key available                     |
| **Component Library**  | Simplest approach       | Maintain development speed            |

---

## 📊 **Implementation Progress**

### ✅ **PHASE 1: COMPLETED**

**Component:** `IncidentQueue.tsx`
**Status:** ✅ **FULLY IMPLEMENTED**

**Features Completed:**

- ✅ Real-time incident display with WebSocket integration
- ✅ Priority-based sorting (Critical → High → Medium → Low)
- ✅ Visual priority indicators (color-coded badges/borders)
- ✅ Status filtering (Active, All, specific statuses)
- ✅ Interactive incident selection
- ✅ Live connection status ("Live Updates" indicator)
- ✅ Responsive design optimized for dispatch operations
- ✅ Backend schema compatibility
- ✅ Error handling and loading states

**Technical Stack:**

- Socket.IO for real-time communication
- JWT-based WebSocket authentication
- Role-based rooms (dispatcher, responder, admin)
- MongoDB Atlas integration
- React with TypeScript

### ✅ **PHASE 2: COMPLETED**

**Component:** `IncidentWorkspace.tsx`
**Status:** ✅ **FULLY IMPLEMENTED**

**Features Completed:**

- ✅ Full-screen incident detail view with embedded Google Maps
- ✅ Complete incident information display with caller details
- ✅ Google Maps integration with incident location markers
- ✅ "Assign Resources" button with intelligent suggestions panel
- ✅ Navigation back to incident queue
- ✅ Real-time incident status updates via WebSocket
- ✅ Live connection status indicator
- ✅ Resource suggestion matrix with 50+ emergency scenarios
- ✅ Notes display and management functionality
- ✅ Responsive design optimized for dispatch operations
- ✅ Priority-based visual indicators
- ✅ Status-conditional resource assignment

**Technical Implementation:**

- WebSocket real-time updates using `useWebSocket()` hook
- Google Maps integration with `@react-google-maps/api`
- Intelligent resource assignment using hardcoded response matrix
- Live incident updates synchronized across multiple dispatchers
- Status-based UI state management (pending/assigned/en_route/on_scene)
- Real-time connection monitoring with visual indicators

---

### ✅ **PHASE 2: COMPLETED**

**Component:** `IncidentWorkspace.tsx`
**Status:** ✅ **FULLY IMPLEMENTED**

**Features Completed:**

- ✅ Full-screen incident detail view with embedded Google Maps
- ✅ Complete incident information display with caller details
- ✅ Google Maps integration with incident location markers
- ✅ "Assign Resources" button with intelligent suggestions panel
- ✅ Navigation back to incident queue
- ✅ Real-time incident status updates via WebSocket
- ✅ Live connection status indicator
- ✅ Resource suggestion matrix with 50+ emergency scenarios
- ✅ Notes display and management functionality
- ✅ Responsive design optimized for dispatch operations
- ✅ Priority-based visual indicators
- ✅ Status-conditional resource assignment

**Technical Implementation:**

- WebSocket real-time updates using `useWebSocket()` hook
- Google Maps integration with `@react-google-maps/api`
- Intelligent resource assignment using hardcoded response matrix
- Live incident updates synchronized across multiple dispatchers
- Status-based UI state management (pending/assigned/en_route/on_scene)
- Real-time connection monitoring with visual indicators

**Component Structure:**

```typescript
// IncidentWorkspace.tsx - COMPLETED
interface IncidentWorkspaceProps {
  incident: Incident;
  onBackToQueue: () => void;
  onAssignResources: (
    incident: Incident,
    suggestions: ResourceSuggestion[]
  ) => void;
}

// Key Features Implemented:
// - Real-time WebSocket integration for live incident updates
// - Google Maps with incident location and vehicle markers
// - Intelligent resource suggestion engine with 50+ scenarios
// - Status-conditional UI (Assign Resources button only shows for pending incidents)
// - Live connection status indicator
// - Notes management system
```

---

### 📋 **PHASE 3: PLANNED**

**Component:** `ResourceAssignmentMap.tsx`
**Status:** 📋 **PLANNED**

**Required Features:**

- [ ] Google Maps with real-time vehicle tracking
- [ ] Intelligent resource suggestions based on:
  - Distance to incident
  - Vehicle type matching
  - Availability status
- [ ] Resource response matrix for incident types
- [ ] Manual resource selection capability
- [ ] Dispatch confirmation system
- [ ] 30-second acceptance timer

---

### 💬 **PHASE 4: PLANNED**

**Component:** `IncidentCommunications.tsx`
**Status:** 📋 **PLANNED**

**Required Features:**

- [ ] Chat-like interface with tabs:
  - Tab per assigned vehicle (Ambulance, Fire Engine, etc.)
  - Tab for communication with incident requester
- [ ] Real-time messaging between:
  - Web dispatcher ↔ Mobile vehicle leader
  - Web dispatcher ↔ Mobile citizen app
- [ ] Message history per incident
- [ ] Read receipts and typing indicators

---

### 🔔 **PHASE 5: PLANNED**

**Component:** `NotificationSystem.tsx`
**Status:** 📋 **PLANNED**

**Required Features:**

- [ ] Priority-based alert system
- [ ] Context switching between incidents
- [ ] Auto-reassignment timeout (requires dispatcher approval)
- [ ] New incident notifications
- [ ] Status change alerts
- [ ] Quick switch navigation

---

## 🗄️ **Backend Schema Integration**

**⚠️ CRITICAL:** Always match existing backend schemas in `apps/backend/models/`

### **Key Models:**

- **Incident.js** - Main incident data structure
- **Vehicle.js** - Emergency vehicles and resources
- **User.js** - Dispatcher, responder, and citizen accounts
- **Assignment.js** - Resource-to-incident assignments

### **Vehicle Types Available:**

- Ambulance
- Fire Engine
- Rescue Vehicle
- Support Vehicle

### **Incident Severity Levels:**

- low (🟢 Green)
- medium (🟡 Yellow)
- high (🟠 Orange)
- critical (🔴 Red)

### **Incident Statuses:**

- pending
- assigned
- en_route
- on_scene
- resolved
- cancelled

---

## 🧠 **Intelligent Resource Assignment Matrix**

### **Response Logic:**

```typescript
// Resource Selection Priority:
// 1. Incident Type Matching
// 2. Distance Calculation (nearest available)
// 3. Vehicle Availability Status
// 4. No crew skill considerations (assume all qualified)

const responseMatrix = {
  medical_emergency: ["Ambulance"],
  fire_small: ["Fire Engine"],
  fire_large: ["Fire Engine", "Support Vehicle"],
  rescue_operation: ["Rescue Vehicle", "Ambulance"],
  traffic_accident: ["Ambulance", "Support Vehicle"],
};
```

---

## 🔄 **Real-Time Features**

### **WebSocket Events:**

- `incident_created` - New incident added
- `incident_updated` - Incident status/details changed
- `incident_deleted` - Incident removed
- `resource_assigned` - Vehicle assigned to incident
- `resource_status_changed` - Vehicle status updated
- `communication_message` - New chat message

### **Multi-User Synchronization:**

- Multiple dispatchers work simultaneously
- Live updates across all browser windows
- Role-based event filtering
- JWT-based authentication

---

## 🎨 **UI/UX Guidelines**

### **Color Scheme:**

- 🔴 **Critical:** Red (#EF4444)
- 🟠 **High:** Orange (#F97316)
- 🟡 **Medium:** Yellow (#EAB308)
- 🟢 **Low:** Green (#22C55E)

### **Layout Structure:**

```
┌─────────────────────────────────────────────────┐
│ DispatcherDashboard (Main Container)           │
├─────────────┬───────────────────────────────────┤
│ Incident    │ IncidentWorkspace                 │
│ Queue       │ ┌─────────────────────────────────┤
│ (Left Panel)│ │ Incident Details                │
│             │ ├─────────────────────────────────┤
│ - Critical  │ │ Google Maps (Embedded)          │
│ - High      │ ├─────────────────────────────────┤
│ - Medium    │ │ Communications (Chat Tabs)      │
│ - Low       │ └─────────────────────────────────┤
└─────────────┴───────────────────────────────────┘
```

---

## 🚀 **Next Immediate Steps**

### **Ready to Implement:**

1. **Create IncidentWorkspace component**
   - Display full incident details
   - Integrate Google Maps
   - Add "Assign Resources" button
   - Handle incident selection from queue

### **Questions to Resolve:**

- ✅ Map provider: Google Maps
- ✅ Interface style: Full-screen workspace
- ✅ Multi-tasking: Single incident focus
- ✅ Communication: Chat-like with vehicle tabs
- ✅ Auto-reassignment: Requires dispatcher approval

---

## 🧪 **TESTING & VERIFICATION INSTRUCTIONS**

### **✅ Real-Time Functionality Testing**

#### **WebSocket Connection Testing:**

1. **Start Backend**: `npm run dev` (both frontend and backend)
2. **Open Multiple Browser Windows**: Test multi-user synchronization
3. **Stop Backend Server**: Verify connection status shows "Connecting..." then "Disconnected"
4. **Restart Backend**: Verify automatic reconnection and "Live Updates" status
5. **Check Console Logs**: Look for WebSocket connection messages

#### **Phase 1 (IncidentQueue) Testing:**

- ✅ **Connection Status**: Shows "Live Updates" when connected, "Connecting..." when attempting, "Disconnected" when failed
- ✅ **Real-time Updates**: Create/update/delete incidents in database, verify immediate UI updates
- ✅ **Multi-window Sync**: Changes in one browser window appear in others instantly
- ✅ **Priority Sorting**: Critical → High → Medium → Low order maintained
- ✅ **Status Filtering**: Active/All filters work correctly

#### **Phase 2 (IncidentWorkspace) Testing:**

- ✅ **Connection Status**: Matches Phase 1 behavior exactly
- ✅ **Real-time Updates**: Individual incident updates appear immediately
- ✅ **Google Maps**: Incident location displays correctly with markers
- ✅ **Resource Assignment**: "Assign Resources" button shows only for pending incidents
- ✅ **Resource Suggestions**: Intelligent recommendations based on incident type/category
- ✅ **Status Updates**: Changes to incident status reflect immediately via WebSocket

#### **WebSocket Event Verification:**

```bash
# Console logs should show:
📱 [IncidentQueue] Real-time incident update received: INC-20251001-00001
📱 [IncidentWorkspace] Real-time incident update received: INC-20251001-00001 Status: assigned
✅ WebSocket authenticated: Mohamed Afham (Dispatcher)
🔗 Client connected: Mohamed Afham (Dispatcher)
```

### **🚨 Critical Issues Fixed:**

1. **✅ WebSocket Phase 2 Integration**: Added real-time updates to IncidentWorkspace
2. **✅ Connection Status Consistency**: **FINAL FIX APPLIED** - Both phases now show identical connection states
   - **Previous Issue**: IncidentQueue showed "Connecting..." when server stopped, IncidentWorkspace showed "Disconnected"
   - **Root Cause**: IncidentQueue was missing `isConnecting` state usage
   - **Fix Applied**: Updated IncidentQueue to use same logic as IncidentWorkspace
   - **Result**: Both components now show: Connected → "Live Updates", Connecting → "Connecting...", Disconnected → "Disconnected"
3. **✅ Socket.IO TypeScript Errors**: Resolved import and type definition issues
4. **✅ Resource Assignment Logic**: Implemented intelligent 50+ scenario matrix
5. **✅ Google Maps Integration**: Embedded maps with incident location markers

---

## 📝 **Development Notes**

- **Backend API:** Already set up with Socket.IO
- **Authentication:** JWT-based with role management
- **Database:** MongoDB Atlas with existing schemas
- **Frontend:** React + TypeScript + Socket.IO client
- **Real-time:** ✅ **FULLY IMPLEMENTED** - Phases 1 & 2 complete
- **Environment:** Development setup complete

### **📊 Current System Status:**

- **Phase 1**: ✅ Complete - IncidentQueue with real-time updates
- **Phase 2**: ✅ Complete - IncidentWorkspace with WebSocket integration
- **Next**: Phase 3 - ResourceAssignmentMap with vehicle tracking

---

_Last Updated: Phases 1 & 2 Complete - Full WebSocket integration with consistent connection status_
_Current Focus: Real-time functionality verification and testing_
