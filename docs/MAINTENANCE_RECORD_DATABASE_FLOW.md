# 💾 Maintenance Record Database Storage - Complete Flow

**Date:** October 2, 2025  
**System:** Emergency Dispatch System - Equipment Management

---

## 🎯 **Quick Answer: YES, it goes to MongoDB database!**

When you create a maintenance record through the web dashboard, here's exactly what happens:

---

## 📊 **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: User Creates Maintenance Record on Web Dashboard      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  User Action:                                                   │
│  1. Clicks "+ New Maintenance Record" button                    │
│  2. Fills form:                                                 │
│     - Vehicle: A-101                                            │
│     - Record Type: CORRECTIVE                                   │
│     - Priority: HIGH                                            │
│     - Description: "Replace brake pads"                         │
│  3. Clicks "Create" button                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Frontend Sends HTTP Request                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Frontend Code (equipmentService.createMaintenanceRecord)       │
│                                                                 │
│  POST http://localhost:5000/api/equipment/maintenance           │
│                                                                 │
│  Headers:                                                       │
│  {                                                              │
│    "Content-Type": "application/json",                         │
│    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5c..."      │
│  }                                                              │
│                                                                 │
│  Body:                                                          │
│  {                                                              │
│    "vehicleId": "671c4c8e5f3a2b001d4e1a92",                    │
│    "recordType": "CORRECTIVE",                                 │
│    "priority": "HIGH",                                         │
│    "description": "Replace brake pads"                         │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Backend Receives Request                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend Route: apps/backend/routes/equipment.js                │
│  Line 514: router.post('/maintenance', ...)                    │
│                                                                 │
│  1. Authenticates user (middleware)                            │
│  2. Checks user role (Supervisor/Maintenance Tech/Admin only)  │
│  3. Validates request data                                     │
│  4. Verifies vehicle exists                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Create Mongoose Document                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  JavaScript Object Created in Memory:                           │
│                                                                 │
│  const maintenanceRecord = new MaintenanceRecord({             │
│    vehicleId: "671c4c8e5f3a2b001d4e1a92",                      │
│    recordType: "CORRECTIVE",                                   │
│    description: "Replace brake pads",                          │
│    priority: "HIGH",                                           │
│    createdBy: "supervisor@station1.com",                       │
│    createdAt: new Date(),         // 2025-10-02T23:45:00Z     │
│    status: "PENDING"              // Default value             │
│  });                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Save to MongoDB Database                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Code: const savedRecord = await maintenanceRecord.save();     │
│                                                                 │
│  What Happens:                                                  │
│  1. Mongoose validates the data against schema                 │
│  2. Generates unique _id (MongoDB ObjectId)                    │
│  3. Sends INSERT command to MongoDB Atlas                      │
│  4. MongoDB stores document in "maintenancerecords" collection │
│  5. Returns saved document with _id                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: MongoDB Database Storage                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB Atlas Cloud Database                                   │
│  Collection: "maintenancerecords"                              │
│                                                                 │
│  Document Stored:                                               │
│  {                                                              │
│    "_id": ObjectId("671d5e9f8a1b2c001e5f3d21"),  ◄── Generated │
│    "vehicleId": ObjectId("671c4c8e5f3a2b001d4e1a92"),          │
│    "recordType": "CORRECTIVE",                                 │
│    "description": "Replace brake pads",                        │
│    "priority": "HIGH",                                         │
│    "createdBy": "supervisor@station1.com",                     │
│    "createdAt": ISODate("2025-10-02T23:45:00.000Z"),          │
│    "status": "PENDING",                                        │
│    "attachments": [],                                          │
│    "__v": 0                                   ◄── Version key  │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: Update Vehicle Status                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Code: await Vehicle.findByIdAndUpdate(vehicleId, {            │
│    'status.operational': 'maintenance'                         │
│  });                                                            │
│                                                                 │
│  MongoDB Update Command:                                        │
│  db.vehicles.updateOne(                                        │
│    { _id: ObjectId("671c4c8e5f3a2b001d4e1a92") },             │
│    { $set: { "status.operational": "maintenance" } }           │
│  )                                                              │
│                                                                 │
│  Vehicle Document Now Shows:                                    │
│  {                                                              │
│    "_id": ObjectId("671c4c8e5f3a2b001d4e1a92"),               │
│    "registration": {                                           │
│      "plateNumber": "A-101",                                   │
│      "vehicleType": "ambulance"                                │
│    },                                                           │
│    "status": {                                                 │
│      "operational": "maintenance"  ◄── UPDATED!                │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: Backend Returns Response                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  HTTP Response:                                                 │
│  Status: 201 Created                                            │
│                                                                 │
│  Body:                                                          │
│  {                                                              │
│    "success": true,                                            │
│    "message": "Maintenance record created successfully",       │
│    "data": {                                                   │
│      "id": "671d5e9f8a1b2c001e5f3d21",                         │
│      "vehicleId": "671c4c8e5f3a2b001d4e1a92",                  │
│      "vehicleNumber": "A-101",                                 │
│      "vehicleType": "ambulance",                               │
│      "recordType": "CORRECTIVE",                               │
│      "description": "Replace brake pads",                      │
│      "priority": "HIGH",                                       │
│      "createdBy": "supervisor@station1.com",                   │
│      "createdAt": "2025-10-02T23:45:00.000Z",                 │
│      "status": "PENDING"                                       │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 9: Frontend Updates UI                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  1. Modal closes                                                │
│  2. Toast notification appears: "✅ Maintenance record created" │
│  3. Table refreshes to show new record                          │
│  4. New record appears at top of list                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 **MongoDB Document Structure**

### **Collection Name:** `maintenancerecords`

### **Document Example:**

```javascript
{
  // Unique identifier (auto-generated by MongoDB)
  "_id": ObjectId("671d5e9f8a1b2c001e5f3d21"),
  
  // Reference to Vehicle document (foreign key)
  "vehicleId": ObjectId("671c4c8e5f3a2b001d4e1a92"),
  
  // Type of maintenance
  "recordType": "CORRECTIVE",  // Options: ROUTINE, CORRECTIVE, EMERGENCY
  
  // What needs to be done
  "description": "Replace brake pads - wear indicators showing",
  
  // How urgent is this
  "priority": "HIGH",  // Options: LOW, MEDIUM, HIGH
  
  // Who created this record
  "createdBy": "supervisor@station1.com",
  
  // When was it created
  "createdAt": ISODate("2025-10-02T23:45:00.000Z"),
  
  // Current status
  "status": "PENDING",  // Options: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  
  // Optional files/photos (empty array by default)
  "attachments": [],
  
  // Mongoose version key (internal)
  "__v": 0
}
```

---

## 🗄️ **Database Schema Definition**

**File:** `apps/backend/models/MaintenanceRecord.js`

```javascript
const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  
  // REQUIRED: Which vehicle needs maintenance
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId
    ref: 'Vehicle',                        // Links to Vehicle collection
    required: true                          // Cannot be empty
  },
  
  // REQUIRED: Type of maintenance work
  recordType: {
    type: String,
    enum: ['ROUTINE', 'CORRECTIVE', 'EMERGENCY'],  // Only these values allowed
    required: true
  },
  
  // REQUIRED: Detailed description
  description: { 
    type: String, 
    required: true 
  },
  
  // Priority level (defaults to MEDIUM if not provided)
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  
  // REQUIRED: Who created this record
  createdBy: { 
    type: String, 
    required: true 
  },
  
  // Timestamp (auto-generated if not provided)
  createdAt: { 
    type: Date, 
    default: Date.now  // Uses current date/time
  },
  
  // Optional: File attachments (photos, documents)
  attachments: [String],
  
  // Status tracking (defaults to PENDING)
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  }
  
});

// Export as Mongoose model
module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
```

---

## 🔍 **How to View Stored Data**

### **Option 1: MongoDB Atlas Web Interface**

1. Go to: https://cloud.mongodb.com
2. Log in to your account
3. Select your cluster
4. Click "Browse Collections"
5. Select database: `emergency-dispatch`
6. Select collection: `maintenancerecords`
7. See all stored documents

**Example View:**
```
maintenancerecords (15 documents)

┌────────────────────────────────────────────────────────────────┐
│ _id: 671d5e9f8a1b2c001e5f3d21                                  │
│ vehicleId: 671c4c8e5f3a2b001d4e1a92                            │
│ recordType: "CORRECTIVE"                                       │
│ description: "Replace brake pads"                              │
│ priority: "HIGH"                                               │
│ createdBy: "supervisor@station1.com"                           │
│ createdAt: 2025-10-02T23:45:00.000Z                           │
│ status: "PENDING"                                              │
│ attachments: []                                                │
│ __v: 0                                                         │
├────────────────────────────────────────────────────────────────┤
│ _id: 671d5e8f7a1b2c001e5f3d20                                  │
│ ...                                                            │
└────────────────────────────────────────────────────────────────┘
```

### **Option 2: MongoDB Compass (Desktop App)**

1. Install MongoDB Compass
2. Connect to your database
3. Navigate to `emergency-dispatch` → `maintenancerecords`
4. View/search/filter documents

### **Option 3: Backend API Query**

```javascript
// Get all maintenance records
GET http://localhost:5000/api/equipment/maintenance

Response:
{
  "success": true,
  "maintenanceRecords": [
    {
      "_id": "671d5e9f8a1b2c001e5f3d21",
      "vehicleId": {
        "_id": "671c4c8e5f3a2b001d4e1a92",
        "registration": {
          "plateNumber": "A-101",
          "vehicleType": "ambulance"
        }
      },
      "recordType": "CORRECTIVE",
      "description": "Replace brake pads",
      "priority": "HIGH",
      "createdBy": "supervisor@station1.com",
      "createdAt": "2025-10-02T23:45:00.000Z",
      "status": "PENDING"
    },
    // ... more records
  ]
}
```

---

## 🔄 **CRUD Operations on Database**

### **CREATE (Insert Document)**

**Frontend:**
```javascript
equipmentService.createMaintenanceRecord({
  vehicleId: "671c4c8e5f3a2b001d4e1a92",
  recordType: "CORRECTIVE",
  priority: "HIGH",
  description: "Replace brake pads"
})
```

**Backend:**
```javascript
const maintenanceRecord = new MaintenanceRecord({ ... });
await maintenanceRecord.save();  // ← Saves to MongoDB
```

**MongoDB Command:**
```javascript
db.maintenancerecords.insertOne({
  vehicleId: ObjectId("671c4c8e5f3a2b001d4e1a92"),
  recordType: "CORRECTIVE",
  description: "Replace brake pads",
  priority: "HIGH",
  createdBy: "supervisor@station1.com",
  createdAt: ISODate("2025-10-02T23:45:00Z"),
  status: "PENDING",
  attachments: []
})
```

**Result:** ✅ Document inserted with `_id: 671d5e9f8a1b2c001e5f3d21`

---

### **READ (Query Documents)**

**Frontend:**
```javascript
equipmentService.getAllMaintenanceRecords({ limit: 50 })
```

**Backend:**
```javascript
const records = await MaintenanceRecord.find()
  .populate('vehicleId', 'registration')  // Join with Vehicle collection
  .limit(50)
  .sort({ createdAt: -1 });  // Newest first
```

**MongoDB Command:**
```javascript
db.maintenancerecords.find()
  .sort({ createdAt: -1 })
  .limit(50)
```

**Result:** ✅ Returns array of 50 most recent documents

---

### **UPDATE (Modify Document)**

**Frontend:**
```javascript
equipmentService.updateMaintenanceRecord("671d5e9f8a1b2c001e5f3d21", {
  priority: "CRITICAL",
  description: "URGENT: Replace brake pads immediately - complete brake failure"
})
```

**Backend:**
```javascript
await MaintenanceRecord.findByIdAndUpdate(
  "671d5e9f8a1b2c001e5f3d21",
  {
    priority: "CRITICAL",
    description: "URGENT: Replace brake pads immediately - complete brake failure"
  },
  { new: true }  // Return updated document
);
```

**MongoDB Command:**
```javascript
db.maintenancerecords.updateOne(
  { _id: ObjectId("671d5e9f8a1b2c001e5f3d21") },
  { 
    $set: { 
      priority: "CRITICAL",
      description: "URGENT: Replace brake pads immediately - complete brake failure"
    } 
  }
)
```

**Result:** ✅ Document updated in database

---

### **DELETE (Remove Document)**

**Frontend:**
```javascript
equipmentService.deleteMaintenanceRecord("671d5e9f8a1b2c001e5f3d21")
```

**Backend:**
```javascript
await MaintenanceRecord.findByIdAndDelete("671d5e9f8a1b2c001e5f3d21");
```

**MongoDB Command:**
```javascript
db.maintenancerecords.deleteOne({
  _id: ObjectId("671d5e9f8a1b2c001e5f3d21")
})
```

**Result:** ✅ Document permanently removed from database

---

## 🔗 **Database Relationships**

### **MaintenanceRecord → Vehicle (Many-to-One)**

```
maintenancerecords Collection          vehicles Collection
┌──────────────────────────┐          ┌──────────────────────┐
│ _id: 671d5e9f...         │          │ _id: 671c4c8e...     │
│ vehicleId: 671c4c8e... ──┼─────────→│ plateNumber: "A-101" │
│ recordType: CORRECTIVE   │          │ type: "ambulance"    │
│ description: "..."       │          │ status: {...}        │
└──────────────────────────┘          └──────────────────────┘

│ _id: 671d5e8f...         │          
│ vehicleId: 671c4c8e... ──┼─────────→ Same vehicle
│ recordType: ROUTINE      │          │ (Multiple records
│ description: "..."       │          │  per vehicle)
└──────────────────────────┘          
```

**Query with Relationship:**
```javascript
// Get maintenance record with vehicle details
const record = await MaintenanceRecord.findById("671d5e9f...")
  .populate('vehicleId');

// Result:
{
  _id: "671d5e9f...",
  vehicleId: {
    _id: "671c4c8e...",
    registration: {
      plateNumber: "A-101",
      vehicleType: "ambulance"
    }
  },
  recordType: "CORRECTIVE",
  // ...
}
```

---

## 📊 **Database Statistics**

### **Sample Database State:**

```
MongoDB Atlas - emergency-dispatch Database

Collections:
├─ users (25 documents)
├─ vehicles (12 documents)
├─ maintenancerecords (47 documents) ◄── Your maintenance records
├─ equipmentchecks (156 documents)
├─ equipmentchecklisttemplates (3 documents)
├─ crews (18 documents)
└─ incidents (234 documents)

maintenancerecords Collection:
├─ Size: 24 KB
├─ Documents: 47
├─ Avg Document Size: 512 bytes
└─ Indexes: _id (unique), vehicleId
```

### **Example Queries:**

```javascript
// Total maintenance records
db.maintenancerecords.countDocuments()
// Result: 47

// Pending records only
db.maintenancerecords.countDocuments({ status: "PENDING" })
// Result: 12

// High priority records
db.maintenancerecords.countDocuments({ priority: "HIGH" })
// Result: 5

// Records for specific vehicle
db.maintenancerecords.countDocuments({ 
  vehicleId: ObjectId("671c4c8e5f3a2b001d4e1a92") 
})
// Result: 8
```

---

## ✅ **Data Validation**

MongoDB/Mongoose validates data before saving:

### **Example: Invalid Data Rejected**

```javascript
// User tries to create record without description
const record = new MaintenanceRecord({
  vehicleId: "671c4c8e5f3a2b001d4e1a92",
  recordType: "CORRECTIVE",
  // description: missing!
  priority: "HIGH"
});

await record.save();

// Result: ❌ Validation Error
// Error: MaintenanceRecord validation failed: description: Path `description` is required.
// Status: 400 Bad Request
// Document NOT saved to database
```

### **Example: Invalid Enum Value**

```javascript
const record = new MaintenanceRecord({
  vehicleId: "671c4c8e5f3a2b001d4e1a92",
  recordType: "PREVENTIVE",  // ❌ Not in enum ['ROUTINE', 'CORRECTIVE', 'EMERGENCY']
  description: "Oil change",
  priority: "HIGH"
});

await record.save();

// Result: ❌ Validation Error
// Error: `PREVENTIVE` is not a valid enum value for path `recordType`
// Document NOT saved to database
```

---

## 🔒 **Data Security & Backup**

### **Security:**
- ✅ MongoDB Atlas with authentication
- ✅ Network access restricted to authorized IPs
- ✅ Database users with limited permissions
- ✅ Connection via encrypted TLS/SSL
- ✅ JWT token required for API access

### **Backup:**
- ✅ MongoDB Atlas automatic daily backups
- ✅ Point-in-time recovery available
- ✅ Backup retention: 7 days
- ✅ Can restore to any point in last week

---

## 📝 **Summary**

### **YES, Maintenance Records ARE Stored in Database!**

**Where:** MongoDB Atlas cloud database  
**Collection:** `maintenancerecords`  
**Format:** JSON documents (BSON internally)  
**Persistence:** Permanent (until deleted)  
**Access:** Via API or MongoDB tools  
**Relationships:** Linked to Vehicle documents  
**Validation:** Schema enforced by Mongoose  
**Backup:** Automatic daily backups  

**Every time you click "Create":**
1. ✅ Data sent to backend API
2. ✅ Validated against schema
3. ✅ Saved to MongoDB Atlas
4. ✅ Assigned unique `_id`
5. ✅ Vehicle status updated
6. ✅ Available for queries immediately
7. ✅ Appears in web dashboard table

**You can verify by:**
- Viewing MongoDB Atlas web interface
- Querying via API
- Checking maintenance records tab
- Using MongoDB Compass tool

---

**Your data is safe and permanently stored!** 💾✅

