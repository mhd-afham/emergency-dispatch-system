# 🔄 Circular Dependencies Management Guide

## Overview

This document identifies all circular dependencies in the Emergency Dispatch System database models and provides strategies for handling them during database operations (seeding, CRUD operations).

**Strategy**: Use nullable references during initial creation, then update circular references in a second pass after all entities exist.

---

## 🚨 Identified Circular Dependencies

### **1. Incident ↔ Vehicle Circular Dependency**

#### **Relationship Pattern:**

```
Incident.assignedResources[] → Vehicle
Vehicle.assignment.currentIncidentId → Incident
```

#### **Fields Involved:**

- **Incident Model**: `assignedResources[].resourceId` (references Vehicle)
- **Vehicle Model**: `assignment.currentIncidentId` (references Incident)

#### **Seeding Strategy:**

```javascript
// PHASE 1: Create entities with null circular references
const incident = new Incident({
  // ... all other fields
  assignedResources: [], // Empty array initially
});

const vehicle = new Vehicle({
  // ... all other fields
  assignment: {
    currentIncidentId: null, // Null initially
    assignedAt: null,
    crew: [],
  },
});

// PHASE 2: Update circular references after both exist
incident.assignedResources.push({
  resourceId: vehicle._id,
  assignedAt: new Date(),
  status: "assigned",
});

vehicle.assignment.currentIncidentId = incident._id;
vehicle.assignment.assignedAt = new Date();

await incident.save();
await vehicle.save();
```

---

### **2. Station ↔ Vehicle Circular Dependency**

#### **Relationship Pattern:**

```
Station.currentResources.vehicles[] → Vehicle
Vehicle.station.homeStationId → Station
Vehicle.station.currentStationId → Station
```

#### **Fields Involved:**

- **Station Model**: `currentResources.vehicles[].vehicleId` (references Vehicle)
- **Vehicle Model**: `station.homeStationId` and `station.currentStationId` (reference Station)

#### **Seeding Strategy:**

```javascript
// PHASE 1: Create entities with null/empty circular references
const station = new Station({
  // ... all other fields
  currentResources: {
    vehicles: [], // Empty array initially
    crew: [],
  },
});

const vehicle = new Vehicle({
  // ... all other fields
  station: {
    homeStationId: station._id, // This is safe - not circular
    currentStationId: null, // Null initially if different from home
  },
});

// PHASE 2: Update station's vehicle references
station.currentResources.vehicles.push({
  vehicleId: vehicle._id,
  status: "stationed",
});

// If vehicle is currently at home station
vehicle.station.currentStationId = station._id;

await station.save();
await vehicle.save();
```

---

### **3. Station ↔ Crew Circular Dependency**

#### **Relationship Pattern:**

```
Station.currentResources.crew[] → Crew
Crew.currentStatus.assignedVehicleId → Vehicle → Station
```

#### **Fields Involved:**

- **Station Model**: `currentResources.crew[].crewId` (references Crew)
- **Crew Model**: `currentStatus.assignedVehicleId` (references Vehicle, which references Station)

#### **Seeding Strategy:**

```javascript
// PHASE 1: Create entities with null/empty circular references
const station = new Station({
  // ... all other fields
  currentResources: {
    vehicles: [],
    crew: [], // Empty array initially
  },
});

const crew = new Crew({
  // ... all other fields
  currentStatus: {
    availability: "off_duty",
    shiftId: null,
    assignedVehicleId: null, // Null initially
    location: { coordinates: [] },
  },
});

// PHASE 2: Update circular references
station.currentResources.crew.push({
  crewId: crew._id,
  status: "on_duty",
});

// If crew is assigned to a vehicle at this station
if (vehicleAtStation) {
  crew.currentStatus.assignedVehicleId = vehicleAtStation._id;
}

await station.save();
await crew.save();
```

---

### **4. Crew ↔ Shift Circular Dependency**

#### **Relationship Pattern:**

```
Crew.currentStatus.shiftId → Shift
Shift.staffing.assignedCrew[] → Crew
```

#### **Fields Involved:**

- **Crew Model**: `currentStatus.shiftId` (references Shift)
- **Shift Model**: `staffing.assignedCrew[].crewId` (references Crew)

#### **Seeding Strategy:**

```javascript
// PHASE 1: Create entities with null/empty circular references
const shift = new Shift({
  // ... all other fields
  staffing: {
    requiredCrewCount: 3,
    assignedCrew: [], // Empty array initially
  },
});

const crew = new Crew({
  // ... all other fields
  currentStatus: {
    availability: "on_duty",
    shiftId: null, // Null initially
    assignedVehicleId: null,
  },
});

// PHASE 2: Update circular references
shift.staffing.assignedCrew.push({
  crewId: crew._id,
  role: "EMT",
  assignedAt: new Date(),
  status: "assigned",
  assignedBy: supervisorUserId,
});

crew.currentStatus.shiftId = shift._id;

await shift.save();
await crew.save();
```

---

### **5. Vehicle ↔ EquipmentCheck Circular Dependency**

#### **Relationship Pattern:**

```
Vehicle.equipment.lastCheckDate → EquipmentCheck (implicit)
EquipmentCheck.vehicleId → Vehicle
```

#### **Fields Involved:**

- **Vehicle Model**: `equipment.lastCheckDate` (date from latest EquipmentCheck)
- **EquipmentCheck Model**: `vehicleId` (references Vehicle)

#### **Seeding Strategy:**

```javascript
// PHASE 1: Create vehicle without check date
const vehicle = new Vehicle({
  // ... all other fields
  equipment: {
    checklistTemplateId: templateId,
    lastCheckDate: null, // Null initially
    items: [],
  },
});

// PHASE 2: Create equipment check and update vehicle
const equipmentCheck = new EquipmentCheck({
  vehicleId: vehicle._id,
  crewId: crewId,
  templateId: templateId,
  // ... other fields
});

vehicle.equipment.lastCheckDate = equipmentCheck.timing.completedAt;

await equipmentCheck.save();
await vehicle.save();
```

---

## 📋 Database Operation Guidelines

### **Creating New Records (General Process)**

#### **Step 1: Identify Dependencies**

Before creating any record, identify all circular dependencies using this guide.

#### **Step 2: Create Base Records**

Create all involved entities with `null` values for circular reference fields:

```javascript
// Set circular reference fields to null or empty arrays
entity.circularReferenceField = null;
entity.circularReferenceArray = [];
```

#### **Step 3: Update Circular References**

After all entities exist with valid `_id` values, update the circular references:

```javascript
// Update both sides of the circular relationship
entityA.referenceToB = entityB._id;
entityB.referenceToA = entityA._id;

await entityA.save();
await entityB.save();
```

### **Deleting Records**

When deleting records involved in circular dependencies:

1. **Remove all circular references first**
2. **Then delete the entity**

```javascript
// Example: Deleting a vehicle assigned to an incident
const vehicle = await Vehicle.findById(vehicleId);
const incident = await Incident.findById(vehicle.assignment.currentIncidentId);

// Remove circular references
vehicle.assignment.currentIncidentId = null;
incident.assignedResources = incident.assignedResources.filter(
  (r) => r.resourceId.toString() !== vehicleId
);

await vehicle.save();
await incident.save();

// Now safe to delete
await Vehicle.findByIdAndDelete(vehicleId);
```

### **Updating Assignments**

When creating new assignments (most common operation):

```javascript
async function assignVehicleToIncident(vehicleId, incidentId, assignedBy) {
  // PHASE 1: Create Assignment record
  const assignment = new Assignment({
    incident: { incidentId: incidentId },
    resource: { vehicleId: vehicleId, primaryCrewId: crewId },
    dispatch: { assignedBy: assignedBy },
  });
  await assignment.save();

  // PHASE 2: Update circular references
  const vehicle = await Vehicle.findById(vehicleId);
  const incident = await Incident.findById(incidentId);

  // Update Vehicle → Incident reference
  vehicle.assignment.currentIncidentId = incidentId;
  vehicle.assignment.assignedAt = new Date();
  vehicle.status.currentStatus = "assigned";

  // Update Incident → Vehicle reference
  incident.assignedResources.push({
    resourceId: vehicleId,
    assignedAt: new Date(),
    status: "assigned",
  });

  await vehicle.save();
  await incident.save();

  return assignment;
}
```

---

## 🗂️ Seeding Order (Updated for Circular Dependencies)

### **Phase 1: Independent Base Models**

1. **User** (no dependencies)
2. **EquipmentChecklistTemplate** (User only)

### **Phase 2: Infrastructure with Null Circular References**

3. **Station** (User only, empty `currentResources`)
4. **Incident** (User only, empty `assignedResources`)
5. **Crew** (User only, null `shiftId`, null `assignedVehicleId`)
6. **Vehicle** (User, Station, Template, null `currentIncidentId`)
7. **Shift** (User, empty `assignedCrew`)

### **Phase 3: Update Circular References**

8. **Update Station.currentResources** (add Vehicle and Crew references)
9. **Update Crew.currentStatus.shiftId** (reference Shift)
10. **Update Shift.staffing.assignedCrew** (reference Crew)
11. **Update Vehicle.assignment.currentIncidentId** (if assigned)
12. **Update Incident.assignedResources** (if vehicles assigned)

### **Phase 4: Association Models**

13. **Assignment** (all base models exist)
14. **EquipmentCheck** (all dependencies exist)
15. **Communication** (all references exist)

### **Phase 5: System Generated**

16. **Report** (generated from existing data)
17. **AuditLog** (system actions)

---

## ⚠️ Important Notes

1. **Always check for existing circular references** before creating new ones
2. **Use transactions when possible** to ensure data consistency
3. **Handle errors gracefully** - if Phase 2 fails, clean up Phase 1 records
4. **Test circular dependency handling** thoroughly in development
5. **Document any new circular dependencies** discovered during development

## 🔍 Quick Reference Checklist

When working with these models, always ask:

- [ ] Does this model have circular dependencies?
- [ ] Am I creating records in the correct order?
- [ ] Are circular reference fields set to null/empty initially?
- [ ] Have I updated both sides of circular relationships?
- [ ] Are my delete operations handling circular references?

---

**Last Updated**: October 2, 2025  
**Version**: 1.0  
**Status**: Active - Use this guide for all database operations
