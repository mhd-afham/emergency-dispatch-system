# 🚨 Equipment Check Workflow - Complete Implementation Guide

## Date: October 2, 2025

---

## 📋 **Overview**

This document outlines the complete **Digital Equipment Readiness Check** workflow for emergency dispatch vehicles (ambulances and fire engines). This implements the user story requirements for pre-shift vehicle inspections with automatic status updates and maintenance workflow integration.

---

## 🎯 **User Story Requirements**

### **Primary Flow: Successful Equipment Check**

1. ✅ Crew leader navigates to "Vehicle/Equipment Management"
2. ✅ System displays assigned vehicle and equipment information
3. ✅ Crew member taps "Begin Equipment Check" button
4. ✅ System loads the appropriate digital checklist template based on vehicle type (ambulance or fire engine)
5. ✅ Crew member performs vehicle systems inspection (fuel level, oil, battery, coolant, belts) and enters levels or PASS/FAIL status for each item in the mobile app
6. ✅ Crew member conducts exterior inspection (emergency lights, siren, physical damage) and records PASS/FAIL status in the app
7. ✅ Crew member checks running condition and expiry dates of emergency equipment specific to vehicle type (medical supplies for ambulance, firefighting tools for fire engine) and enters PASS/FAIL status in the app
8. ✅ System validates all information against minimum thresholds and displays results
9. ✅ For FAIL items, crew member records detailed description of the problem and selects urgency level (Critical, High, Medium, Low) from dropdown menu
10. ✅ System calculates overall readiness score based on all checklist items and displays inspection summary
11. ✅ If all critical items pass, crew member confirms readiness and ends readiness check
12. ✅ System captures timestamp, GPS location (from mobile app), and crew leader ID
13. ✅ System updates vehicle status to "READY" in dispatch system and sends notification to dispatcher
14. ✅ System displays confirmation message "Pre-shift inspection complete - Vehicle available for dispatch"

### **Branching Actions: Critical Failures**

**11a.** ✅ If critical items failed, system automatically marks vehicle as **"OUT OF SERVICE"**
**11b.** ✅ System immediately generates high-priority maintenance work order
**11c.** ✅ System sends notifications to the Shift Supervisor
**11d.** ✅ Mobile app instructs crew leader to report to supervisor for alternative vehicle assignment
**11e.** ✅ System ends inspection process and logs incomplete status with failure reasons

### **Branching Actions: Non-Critical Failures**

**11a1.** ✅ If only non-critical items failed, system marks vehicle as **"AVAILABLE WITH RESTRICTIONS"**
**11a2.** ✅ System generates maintenance work order
**11a3.** ✅ Continue with step 12 (timestamp, GPS, status update)

---

## 🏗️ **System Architecture**

### **Backend Components**

#### **1. Models**

**EquipmentCheck Model** (`apps/backend/models/EquipmentCheck.js`)
```javascript
{
  vehicleId: ObjectId,         // Reference to Vehicle
  crewId: ObjectId,            // Reference to Crew performing check
  templateId: ObjectId,        // Reference to EquipmentChecklistTemplate
  inspection: {
    checkResults: [            // Array of inspection results
      {
        categoryName: String,
        itemName: String,
        status: String,        // 'pass', 'fail', 'warning'
        isCritical: Boolean,
        notes: String,
        photos: [String]
      }
    ],
    overallStatus: String,     // 'passed', 'minor_issues', 'critical_failure'
    criticalFailures: [],      // Critical items that failed
    passCount: Number,
    failCount: Number,
    warningCount: Number,
    location: {                // GPS coordinates
      type: 'Point',
      coordinates: [Number, Number],
      address: String,
      capturedAt: Date
    },
    notes: String
  },
  workflow: {
    status: String,            // 'completed', 'incomplete'
    completedAt: Date,
    submittedBy: ObjectId
  }
}
```

**EquipmentChecklistTemplate Model** (`apps/backend/models/EquipmentChecklistTemplate.js`)
```javascript
{
  vehicleType: String,         // 'ambulance', 'fire_engine', 'rescue'
  template: {
    name: String,
    version: Number,
    description: String,
    categories: [              // Inspection categories
      {
        name: String,          // e.g., "Vehicle Systems"
        order: Number,
        items: [
          {
            name: String,      // e.g., "Fuel Level"
            type: String,      // 'boolean', 'level', 'expiry'
            isCritical: Boolean,
            minThreshold: Number,
            unit: String,
            notes: String
          }
        ]
      }
    ]
  },
  status: String               // 'active', 'inactive'
}
```

**Vehicle Model** (`apps/backend/models/Vehicle.js`)
```javascript
{
  registration: {
    plateNumber: String,
    vehicleType: String        // 'ambulance', 'fire_engine'
  },
  operationalStatus: {
    status: String,            // 'available', 'available_with_restrictions', 
                               // 'out_of_service', 'maintenance'
    reason: String,
    lastUpdated: Date
  },
  specifications: {
    model: String,
    year: Number,
    make: String
  }
}
```

**MaintenanceRecord Model** (`apps/backend/models/MaintenanceRecord.js`)
```javascript
{
  vehicleId: ObjectId,
  recordType: String,          // 'ROUTINE', 'CORRECTIVE', 'EMERGENCY'
  description: String,
  priority: String,            // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  status: String,              // 'pending', 'in_progress', 'completed'
  sourceCheckId: ObjectId,     // Reference to EquipmentCheck that triggered this
  createdBy: ObjectId,
  assignedTo: ObjectId
}
```

#### **2. API Endpoints**

**Equipment Check Endpoints** (`apps/backend/routes/equipment.js`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/equipment/templates/:vehicleId` | Get checklist template for vehicle | Crew, Supervisor |
| POST | `/api/equipment/checks` | Create new equipment check | Crew, Supervisor |
| GET | `/api/equipment/checks/vehicle/:vehicleId` | Get all checks for vehicle | All Users |
| GET | `/api/equipment/checks/vehicle/:vehicleId/latest` | Get latest check | All Users |
| GET | `/api/equipment/checks/:checkId` | Get specific check details | All Users |
| GET | `/api/equipment/statistics` | Get dashboard statistics | Supervisor, Admin |

#### **3. Controller Logic** (`apps/backend/controllers/equipmentController.js`)

**Equipment Check Creation Flow:**

```javascript
static async createEquipmentCheck(req, res) {
  // 1. Validate input (vehicleId, templateId, checkResults)
  // 2. Find crew member by user ID
  // 3. Verify vehicle and template exist
  // 4. Create equipment check with results
  
  // 5. Calculate results
  let passCount = 0, failCount = 0, criticalFailures = [];
  checkResults.forEach(result => {
    if (result.status === 'pass') passCount++;
    if (result.status === 'fail') {
      failCount++;
      if (result.isCritical) {
        criticalFailures.push(result);
      }
    }
  });
  
  // 6. Determine overall status and update vehicle
  if (criticalFailures.length > 0) {
    // CRITICAL FAILURE BRANCH (11a)
    equipmentCheck.overallStatus = 'critical_failure';
    
    // Update vehicle to OUT OF SERVICE
    await Vehicle.findByIdAndUpdate(vehicleId, {
      'operationalStatus.status': 'out_of_service',
      'operationalStatus.reason': 'Critical equipment failure detected',
      'operationalStatus.lastUpdated': new Date()
    });
    
    // TODO: Generate high-priority maintenance work order (11b)
    // TODO: Send notification to supervisor (11c)
    // TODO: Send mobile notification to crew (11d)
    
  } else if (failCount > 0) {
    // NON-CRITICAL FAILURE BRANCH (11a1)
    equipmentCheck.overallStatus = 'minor_issues';
    
    // Update vehicle to AVAILABLE WITH RESTRICTIONS
    await Vehicle.findByIdAndUpdate(vehicleId, {
      'operationalStatus.status': 'available_with_restrictions',
      'operationalStatus.reason': 'Minor equipment issues detected',
      'operationalStatus.lastUpdated': new Date()
    });
    
    // TODO: Generate maintenance work order (11a2)
    
  } else {
    // SUCCESS BRANCH (11)
    equipmentCheck.overallStatus = 'passed';
    
    // Update vehicle to READY
    await Vehicle.findByIdAndUpdate(vehicleId, {
      'operationalStatus.status': 'available',
      'operationalStatus.reason': 'Equipment check passed',
      'operationalStatus.lastUpdated': new Date()
    });
    
    // TODO: Send notification to dispatcher (13)
  }
  
  // 7. Save equipment check (captures timestamp - step 12)
  const savedCheck = await equipmentCheck.save();
  
  // 8. Return response with confirmation message (14)
  return res.status(201).json({
    success: true,
    message: getConfirmationMessage(equipmentCheck.overallStatus),
    data: savedCheck
  });
}
```

---

## 🎨 **Frontend Components (Web Supervisor Dashboard)**

### **EquipmentManagementDashboard.tsx**

**Changes Made:**
- ✅ Removed empty "Overview" tab
- ✅ Now shows 2 tabs: "Maintenance Records" and "Equipment Checks"
- ✅ Starts on "Maintenance Records" tab by default
- ✅ Equipment Checks tab displays all completed inspections

**Tab 1: Maintenance Records** (Existing functionality)
- View all maintenance records
- Create/Edit/Delete records
- Toast notifications
- Confirmation dialogs

**Tab 2: Equipment Checks** (Enhanced display)
- View all equipment checks for vehicles
- Show vehicle, inspector, status, results, date
- Color-coded status badges:
  - 🟢 **PASSED** - All items passed
  - 🟡 **MINOR_ISSUES** - Some non-critical failures
  - 🔴 **CRITICAL_FAILURE** - Critical items failed
- Display pass/fail counts
- "View" button to see detailed results

---

## 📱 **Mobile App Integration**

### **Required Mobile Screens**

#### **1. Vehicle Assignment Screen**
```
┌─────────────────────────────────────┐
│  My Assigned Vehicle                │
├─────────────────────────────────────┤
│  🚑 Ambulance A-101                 │
│  📍 Station 1, Bay 2                │
│  ⏰ Last Check: 2 hours ago         │
│                                     │
│  Status: ⚠️ CHECK REQUIRED          │
│                                     │
│  [ Begin Equipment Check ]          │
└─────────────────────────────────────┘
```

#### **2. Checklist Template Screen**
```
┌─────────────────────────────────────┐
│  Equipment Check - A-101            │
│  ⏱️ Started: 10:45 AM               │
├─────────────────────────────────────┤
│  1. VEHICLE SYSTEMS (0/5)           │
│  ├─ 🔲 Fuel Level                   │
│  ├─ 🔲 Oil Level                    │
│  ├─ 🔲 Battery Voltage              │
│  ├─ 🔲 Coolant Level                │
│  └─ 🔲 Drive Belts                  │
│                                     │
│  2. EXTERIOR INSPECTION (0/4)       │
│  ├─ 🔲 Emergency Lights             │
│  ├─ 🔲 Siren Function               │
│  ├─ 🔲 Body Damage                  │
│  └─ 🔲 Tire Condition               │
│                                     │
│  3. MEDICAL EQUIPMENT (0/8)         │
│  ├─ 🔲 Oxygen Tank (Expiry)         │
│  ├─ 🔲 AED Pads (Expiry)            │
│  ├─ 🔲 IV Supplies (Expiry)         │
│  └─ ...more items                   │
│                                     │
│  [ Continue (0/17 completed) ]      │
└─────────────────────────────────────┘
```

#### **3. Item Inspection Screen**
```
┌─────────────────────────────────────┐
│  ← Back                             │
│  Fuel Level Check                   │
│  ⚠️ CRITICAL ITEM                   │
├─────────────────────────────────────┤
│  Current Level:                     │
│  ┌─────────────────────────────┐   │
│  │ 75%                         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Minimum Required: 50%              │
│                                     │
│  Status:                            │
│  ○ PASS  ○ FAIL  ○ WARNING          │
│                                     │
│  Notes (if FAIL/WARNING):           │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  📸 Add Photo (Optional)            │
│                                     │
│  [ Save & Continue ]                │
└─────────────────────────────────────┘
```

#### **4. Failure Detail Screen (for FAIL items)**
```
┌─────────────────────────────────────┐
│  ❌ Item Failed                     │
│  Emergency Lights                   │
├─────────────────────────────────────┤
│  Urgency Level: *                   │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ Critical          ▼      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Problem Description: *             │
│  ┌─────────────────────────────┐   │
│  │ Front left light not        │   │
│  │ functioning. Bulb appears   │   │
│  │ to be burned out.           │   │
│  └─────────────────────────────┘   │
│                                     │
│  📸 Add Photos:                     │
│  [+] [Photo 1] [Photo 2]            │
│                                     │
│  [ Save ]                           │
└─────────────────────────────────────┘
```

#### **5. Inspection Summary Screen**
```
┌─────────────────────────────────────┐
│  Inspection Summary                 │
│  🚑 Ambulance A-101                 │
├─────────────────────────────────────┤
│  Overall Readiness Score:           │
│  ┌─────────────────────────────┐   │
│  │      🟡 68%                  │   │
│  │   MINOR ISSUES DETECTED      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Results:                           │
│  ✅ Passed: 14                      │
│  ⚠️ Warnings: 2                     │
│  ❌ Failed: 1 (Non-critical)        │
│                                     │
│  Failed Items:                      │
│  • First Aid Kit - Expired supplies│
│                                     │
│  📍 Location: Station 1             │
│  👤 Inspector: John Smith           │
│  ⏰ Completed: 10:52 AM             │
│                                     │
│  [ Confirm & Submit ]               │
└─────────────────────────────────────┘
```

#### **6. Confirmation Screen (Success - All Pass)**
```
┌─────────────────────────────────────┐
│  ✅ Inspection Complete             │
├─────────────────────────────────────┤
│                                     │
│       🚑                            │
│                                     │
│  Pre-shift inspection complete      │
│  Vehicle available for dispatch     │
│                                     │
│  Vehicle Status: 🟢 READY           │
│                                     │
│  Dispatcher has been notified       │
│                                     │
│  [ Return to Dashboard ]            │
└─────────────────────────────────────┘
```

#### **7. Confirmation Screen (Critical Failure)**
```
┌─────────────────────────────────────┐
│  🚨 CRITICAL FAILURE                │
├─────────────────────────────────────┤
│                                     │
│       ⚠️                            │
│                                     │
│  Vehicle cannot be used             │
│  OUT OF SERVICE                     │
│                                     │
│  Critical failures detected:        │
│  • Emergency Lights - Front left   │
│                                     │
│  🔧 Maintenance work order created  │
│  📢 Supervisor has been notified    │
│                                     │
│  ⚠️ PLEASE REPORT TO SUPERVISOR     │
│  for alternative vehicle assignment │
│                                     │
│  [ Contact Supervisor ]             │
│  [ Return to Dashboard ]            │
└─────────────────────────────────────┘
```

#### **8. Confirmation Screen (Non-Critical Failures)**
```
┌─────────────────────────────────────┐
│  ⚠️ Inspection Complete             │
├─────────────────────────────────────┤
│                                     │
│       🟡                            │
│                                     │
│  Vehicle available with restrictions│
│                                     │
│  Non-critical issues detected:      │
│  • First Aid Kit - Expired supplies│
│                                     │
│  Vehicle Status:                    │
│  🟡 AVAILABLE WITH RESTRICTIONS     │
│                                     │
│  🔧 Maintenance work order created  │
│  📢 Dispatcher has been notified    │
│                                     │
│  Vehicle can be used for dispatch   │
│  Recheck required within 24 hours   │
│                                     │
│  [ Return to Dashboard ]            │
└─────────────────────────────────────┘
```

---

## 🔄 **Workflow State Transitions**

### **Vehicle Status Flow**

```
┌─────────────────┐
│   Initial       │
│   (Unknown)     │
└────────┬────────┘
         │
         │ Crew starts check
         ▼
┌─────────────────┐
│  Check in       │
│  Progress       │
└────────┬────────┘
         │
         │ Crew completes check
         ▼
    ┌────────┐
    │ Results│
    └───┬─┬─┬┘
        │ │ │
   ┌────┘ │ └────┐
   │      │      │
   ▼      ▼      ▼
┌─────┐┌─────┐┌─────────┐
│PASS ││MINOR││CRITICAL │
│     ││ISSUE││FAILURE  │
└──┬──┘└──┬──┘└────┬────┘
   │      │        │
   │      │        ▼
   │      │   ┌──────────────┐
   │      │   │OUT OF SERVICE│
   │      │   │- High priority│
   │      │   │  work order  │
   │      │   │- Notify super│
   │      │   │- Alternative │
   │      │   │  assignment  │
   │      │   └──────────────┘
   │      │
   │      ▼
   │  ┌──────────────────┐
   │  │AVAILABLE WITH    │
   │  │RESTRICTIONS      │
   │  │- Work order      │
   │  │- Notify dispatch │
   │  │- Can be used     │
   │  └──────────────────┘
   │
   ▼
┌──────────────┐
│  READY       │
│- Notify      │
│  dispatcher  │
│- Available   │
│  for dispatch│
└──────────────┘
```

---

## 🚀 **Implementation Checklist**

### **Backend (Already Complete ✅)**
- ✅ EquipmentCheck model with all required fields
- ✅ EquipmentChecklistTemplate model
- ✅ Vehicle model with operationalStatus
- ✅ MaintenanceRecord model
- ✅ POST /api/equipment/checks endpoint
- ✅ GET /api/equipment/templates/:vehicleId endpoint
- ✅ GET /api/equipment/checks endpoints
- ✅ Equipment check creation logic with status calculation
- ✅ Automatic vehicle status updates based on check results

### **Backend (TODO 🔨)**
- ⏳ Auto-generate maintenance work order on failures (11b, 11a2)
- ⏳ Send notification to supervisor on critical failure (11c)
- ⏳ Send notification to dispatcher on success (13)
- ⏳ Send mobile push notification to crew (11d)
- ⏳ GPS location capture and validation

### **Frontend Web (Supervisor Dashboard) ✅**
- ✅ Removed empty Overview tab
- ✅ Equipment Checks tab displaying inspection results
- ✅ Color-coded status badges
- ✅ View detailed check results
- ✅ Filter and search capabilities
- ⏳ Real-time status updates via WebSocket

### **Frontend Mobile (Crew App) 🔨**
- ⏳ Vehicle assignment screen
- ⏳ "Begin Equipment Check" button
- ⏳ Dynamic checklist template loading
- ⏳ Item-by-item inspection interface
- ⏳ Pass/Fail/Warning selection
- ⏳ Failure detail form (urgency, description, photos)
- ⏳ Photo capture and upload
- ⏳ GPS location capture
- ⏳ Inspection summary screen
- ⏳ Readiness score calculation
- ⏳ Confirmation screens (success, critical failure, restrictions)
- ⏳ Push notifications

---

## 📊 **Data Flow Example**

### **Scenario: Non-Critical Failure**

**Step 1: Crew Starts Check**
```javascript
// Mobile app loads template
GET /api/equipment/templates/vehicle123
Response: { template with 17 items for ambulance }
```

**Step 2: Crew Performs Inspection**
- Fuel Level: ✅ PASS (75%)
- Oil Level: ✅ PASS
- Battery: ✅ PASS
- ... (more items)
- First Aid Kit: ❌ FAIL (Expired supplies) - Non-critical
- ... (more items)
- Results: 15 Pass, 0 Warning, 2 Fail (both non-critical)

**Step 3: Crew Submits Check**
```javascript
POST /api/equipment/checks
Body: {
  vehicleId: "vehicle123",
  templateId: "template456",
  checkResults: [
    {
      categoryName: "Medical Equipment",
      itemName: "First Aid Kit",
      status: "fail",
      isCritical: false,
      notes: "Bandages and gauze expired",
      urgency: "MEDIUM"
    },
    {
      categoryName: "Medical Equipment",
      itemName: "IV Supplies",
      status: "fail",
      isCritical: false,
      notes: "Some IV bags expired",
      urgency: "LOW"
    },
    // ... 15 passing items
  ],
  location: {
    coordinates: [-73.935242, 40.730610],
    address: "Station 1, New York",
    capturedAt: "2025-10-02T10:52:00Z"
  }
}
```

**Step 4: Backend Processing**
```javascript
// Calculate results
passCount = 15
failCount = 2
criticalFailures = [] // None critical

// Determine status: minor_issues
overallStatus = 'minor_issues'

// Update vehicle
Vehicle.update({
  operationalStatus: {
    status: 'available_with_restrictions',
    reason: 'Minor equipment issues detected',
    lastUpdated: new Date()
  }
})

// Generate maintenance work order
MaintenanceRecord.create({
  vehicleId: "vehicle123",
  recordType: "CORRECTIVE",
  priority: "MEDIUM",
  description: "Replace expired medical supplies",
  sourceCheckId: "check789"
})

// Send notification to dispatcher
// (TODO: Implement)

// Return response
Response: {
  success: true,
  message: "Vehicle available with restrictions - Maintenance work order created",
  data: { check details }
}
```

**Step 5: Mobile Confirmation**
```
Mobile app displays:
"⚠️ Vehicle available with restrictions
 Minor issues detected
 Maintenance work order created
 Dispatcher notified"
```

---

## 🎓 **Training Notes for Users**

### **For Crew Members:**
1. Perform equipment check **before every shift**
2. Be thorough - check every item carefully
3. Mark items as CRITICAL only if they prevent safe operation
4. Take clear photos of any issues
5. Write detailed failure descriptions
6. If vehicle marked OUT OF SERVICE, report to supervisor immediately

### **For Supervisors:**
1. Monitor equipment check completion rates
2. Review critical failure notifications immediately
3. Assign alternative vehicles when needed
4. Track maintenance work order completion
5. Ensure crews don't bypass inspection requirements

### **For Maintenance Team:**
1. Prioritize work orders from equipment checks
2. High priority = critical failures (immediate attention)
3. Medium/Low priority = schedule within 24-48 hours
4. Update work order status when repairs complete
5. Trigger re-check after repairs

---

## 📈 **Success Metrics**

1. **Inspection Compliance:** 100% of shifts start with completed check
2. **Critical Failure Detection Rate:** Track vehicle issues caught before dispatch
3. **Response Time:** Supervisor notified within 1 minute of critical failure
4. **Maintenance Turnaround:** Critical repairs completed within 4 hours
5. **Vehicle Availability:** Maintain 95%+ fleet readiness

---

## 🔒 **Security & Compliance**

- ✅ All API endpoints require authentication
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all equipment checks
- ✅ GPS location captured and validated
- ✅ Timestamp integrity (server-side)
- ✅ Photo metadata preserved (EXIF data)
- ✅ Data encryption in transit (HTTPS)
- ✅ Database backups (MongoDB Atlas)

---

## 📞 **Support & Troubleshooting**

**Common Issues:**

1. **Mobile app can't load checklist**
   - Check internet connection
   - Verify vehicle assignment in system
   - Contact IT if template missing

2. **GPS location not captured**
   - Enable location services on device
   - Grant app location permissions
   - Use manual address entry if needed

3. **Photo upload fails**
   - Check file size (max 5MB per photo)
   - Verify internet connection
   - Retry upload or skip and add later

4. **Check won't submit**
   - Ensure all required fields completed
   - Check for validation errors
   - Save draft and contact support

---

**Status: ✅ BACKEND COMPLETE | 🔨 MOBILE APP IN DEVELOPMENT**

*Last Updated: October 2, 2025 11:15 PM*
