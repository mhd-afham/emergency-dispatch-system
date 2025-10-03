# Inusha Nawanjana's Vehicle & Crew Registration API Documentation

## 🎯 Overview
This document outlines the API endpoints implemented for **Inusha Nawanjana's** responsibilities in the Emergency Dispatch System:
- **US-010**: Vehicle Registration
- **US-011**: Vehicle Registration Approval 
- **US-012**: Crew Registration

## 🚀 Server Information
- **Base URL**: `http://localhost:5000`
- **Authentication**: JWT Bearer tokens required for all endpoints
- **Content-Type**: `application/json`

## 🔐 Test Credentials
Use these credentials to get authentication tokens:
- **Admin**: `admin@respondr.lk` / `admin123`
- **Dispatcher**: `dispatcher@respondr.lk` / `dispatcher123`
- **Supervisor**: `supervisor@respondr.lk` / `supervisor123`

## 🚛 Vehicle Registration API

### 1. Register New Vehicle
**POST** `/api/vehicles`
**Access**: Admins, Supervisors

```json
{
  "plateNumber": "CAB-1234",
  "vehicleType": "Ambulance",
  "make": "Toyota",
  "model": "HiAce",
  "year": 2023,
  "homeStationId": "64f123456789abcdef123456",
  "equipmentItems": [
    {
      "name": "Defibrillator",
      "type": "medical_equipment",
      "serialNumber": "DEF123",
      "status": "operational",
      "quantity": 1
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Vehicle registration submitted successfully. Pending approval.",
  "data": {
    "vehicle": { /* vehicle object */ },
    "status": "pending_approval",
    "nextSteps": [
      "Vehicle will be reviewed by a supervisor",
      "Email notification will be sent upon approval decision",
      "Vehicle will be available for dispatch once approved"
    ]
  }
}
```

### 2. Get All Vehicles
**GET** `/api/vehicles?page=1&limit=20&status=available&vehicleType=Ambulance`
**Access**: All authenticated users

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (available, assigned, maintenance, out_of_service)
- `vehicleType`: Filter by type (Ambulance, Fire Engine, Rescue Vehicle, Support Vehicle)
- `search`: Search by plate number, make, or model
- `sortBy`: Sort field (default: registration.registrationDate)
- `sortOrder`: Sort direction (asc, desc)

### 3. Get Pending Approvals
**GET** `/api/vehicles/pending-approval`
**Access**: Supervisors, Admins

```json
{
  "success": true,
  "message": "Pending vehicle approvals retrieved successfully",
  "data": {
    "pendingVehicles": [ /* array of pending vehicles */ ],
    "count": 5,
    "summary": {
      "total": 5,
      "overdue": 1,
      "urgent": 2
    }
  }
}
```

### 4. Validate Plate Number
**POST** `/api/vehicles/validate-plate`
**Access**: Admins, Supervisors

```json
{
  "plateNumber": "CAB-1234",
  "excludeId": "64f123456789abcdef123456"  // Optional: exclude this ID from uniqueness check
}
```

**Response**:
```json
{
  "success": true,
  "valid": true,
  "message": "Plate number is available",
  "normalizedPlate": "CAB-1234"
}
```

### 5. Approve Vehicle
**POST** `/api/vehicles/:id/approve`
**Access**: Supervisors, Admins

```json
{
  "comments": "Vehicle meets all safety and equipment requirements"
}
```

### 6. Reject Vehicle
**POST** `/api/vehicles/:id/reject`
**Access**: Supervisors, Admins

```json
{
  "reason": "Missing required medical equipment certification"
}
```

### 7. Get Available Vehicles by Type
**GET** `/api/vehicles/available/Ambulance?includeLocation=true`
**Access**: Dispatchers, Supervisors, Admins

### 8. Get Nearby Vehicles
**GET** `/api/vehicles/near/79.8612/6.9271?maxDistance=5000&vehicleType=Ambulance&limit=5`
**Access**: Dispatchers, Supervisors, Admins

### 9. Get Vehicle by ID
**GET** `/api/vehicles/:id`
**Access**: All authenticated users

### 10. Update Vehicle
**PUT** `/api/vehicles/:id`
**Access**: Admins, Supervisors

```json
{
  "make": "Toyota",
  "model": "HiAce Super GL",
  "year": 2023,
  "homeStationId": "64f123456789abcdef123456"
}
```

### 11. Update Vehicle Status
**PUT** `/api/vehicles/:id/status`
**Access**: Dispatchers, Field Crew, Supervisors, Admins

```json
{
  "operational": "active",
  "currentStatus": "available"
}
```

### 12. Update Vehicle Location
**PUT** `/api/vehicles/:id/location`
**Access**: Field Crew, Supervisors, Admins

```json
{
  "longitude": 79.8612,
  "latitude": 6.9271
}
```

## 👥 Crew Registration API

### 1. Register New Crew Member
**POST** `/api/crew`
**Access**: Admins, Supervisors

```json
{
  "employeeId": "EMP123456",
  "firstName": "John",
  "lastName": "Silva",
  "email": "john.silva@respondr.lk",
  "phone": "+94701234567",
  "role": "EMT",
  "certificationLevel": "Advanced",
  "hireDate": "2024-01-15",
  "certifications": [
    {
      "type": "Basic Life Support",
      "number": "BLS123456",
      "issuedBy": "Sri Lanka Medical Council",
      "issueDate": "2024-01-01",
      "expiryDate": "2026-01-01"
    }
  ],
  "specializations": ["cardiac_care", "trauma"],
  "emergencyContact": {
    "name": "Jane Silva",
    "relationship": "Spouse",
    "phone": "+94707654321"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Crew member registered successfully",
  "data": {
    "crew": { /* crew member object */ },
    "summary": {
      "employeeId": "EMP123456",
      "fullName": "John Silva",
      "role": "EMT",
      "certificationLevel": "Advanced",
      "certificationsCount": 1,
      "isActive": true
    }
  }
}
```

### 2. Get All Crew Members
**GET** `/api/crew?page=1&limit=20&role=EMT&status=available`
**Access**: All authenticated users

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by availability (available, on_duty, off_duty, on_leave, training)
- `role`: Filter by role (EMT, Paramedic, Firefighter, Driver, Supervisor)
- `certificationLevel`: Filter by level (Basic, Intermediate, Advanced, Expert)
- `search`: Search by name, employee ID, or email

### 3. Get Available Crew by Role
**GET** `/api/crew/available/EMT?includeLocation=true`
**Access**: Dispatchers, Supervisors, Admins

### 4. Get Expiring Certifications
**GET** `/api/crew/expiring-certifications?days=30`
**Access**: Supervisors, Admins

### 5. Validate Employee ID
**POST** `/api/crew/validate-employee-id`
**Access**: Admins, Supervisors

```json
{
  "employeeId": "EMP123456",
  "excludeId": "64f123456789abcdef123456"  // Optional
}
```

### 6. Validate Email
**POST** `/api/crew/validate-email`
**Access**: Admins, Supervisors

```json
{
  "email": "john.silva@respondr.lk",
  "excludeId": "64f123456789abcdef123456"  // Optional
}
```

### 7. Get Crew Statistics
**GET** `/api/crew/statistics?timeframe=month`
**Access**: Supervisors, Admins, Data Analysts

### 8. Get Crew Member by ID
**GET** `/api/crew/:id`
**Access**: Self, Supervisors, Admins, Dispatchers

*Supports both MongoDB ObjectId and Employee ID lookup*

### 9. Update Crew Member
**PUT** `/api/crew/:id`
**Access**: Self (limited), Supervisors, Admins

**Admin/Supervisor can update**:
```json
{
  "firstName": "John",
  "lastName": "Silva",
  "phone": "+94701234567",
  "role": "Paramedic",
  "certificationLevel": "Expert",
  "specializations": ["cardiac_care", "trauma", "pediatric"],
  "emergencyContact": {
    "name": "Jane Silva",
    "relationship": "Spouse", 
    "phone": "+94707654321"
  }
}
```

**Self can update**:
```json
{
  "phone": "+94701234567",
  "emergencyContact": {
    "name": "Updated Contact",
    "relationship": "Spouse",
    "phone": "+94707654321"
  }
}
```

### 10. Update Crew Status
**PUT** `/api/crew/:id/status`
**Access**: Self, Dispatchers, Supervisors, Admins

```json
{
  "availability": "available",
  "shiftId": "64f123456789abcdef123456",
  "assignedVehicleId": "64f123456789abcdef123456"
}
```

### 11. Update Crew Location
**PUT** `/api/crew/:id/location`
**Access**: Self, Supervisors, Admins

```json
{
  "longitude": 79.8612,
  "latitude": 6.9271
}
```

## 🛠️ Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "plateNumber": "Invalid plate number format. Use format like CAB-1234"
  }
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "message": "Insufficient permissions to register vehicles",
  "requiredRoles": ["Admin", "Supervisor"],
  "currentRole": "Dispatcher"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Vehicle not found"
}
```

**409 Conflict**:
```json
{
  "success": false,
  "message": "Vehicle with this plate number already exists",
  "field": "plateNumber",
  "existingVehicleId": "64f123456789abcdef123456"
}
```

## 🔍 Testing with cURL Examples

### Get Authentication Token
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@respondr.lk",
    "password": "admin123"
  }'
```

### Register a Vehicle
```bash
curl -X POST "http://localhost:5000/api/vehicles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "plateNumber": "CAB-1234",
    "vehicleType": "Ambulance",
    "make": "Toyota",
    "model": "HiAce",
    "year": 2023,
    "homeStationId": "64f123456789abcdef123456"
  }'
```

### Get All Vehicles
```bash
curl -X GET "http://localhost:5000/api/vehicles?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Register a Crew Member
```bash
curl -X POST "http://localhost:5000/api/crew" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employeeId": "EMP123456",
    "firstName": "John",
    "lastName": "Silva",
    "email": "john.silva@respondr.lk",
    "phone": "+94701234567",
    "role": "EMT",
    "certificationLevel": "Advanced",
    "hireDate": "2024-01-15"
  }'
```

## 📝 Notes & Reminders

### For Team Leader (Important!)
Please note the following additions/changes that need team coordination:

#### ⚠️ Required Team Leader Actions:
1. **No changes needed to Models** - All existing models (Vehicle, Crew, User, AuditLog) were sufficient
2. **Routes registered in server.js** - Added vehicles and crew routes
3. **Database is fully seeded** - No additional seeding required

#### ✅ What was implemented:
- Complete vehicle registration workflow with approval system
- Complete crew registration with role-based permissions  
- Real-time validation endpoints for forms
- Comprehensive error handling and audit logging
- GPS location tracking support
- Statistics endpoints for dashboards

#### 🔄 Integration Points:
- **Afham's Dispatch System**: Vehicle availability queries are ready
- **Spencer's Shift Management**: Crew assignment interfaces are ready  
- **Udayanga's Equipment System**: Vehicle equipment tracking is integrated
- **De Silva's Communication**: Notification hooks are in place for approvals

#### 📱 Mobile App Functions Needed:
The following mobile app functions would be needed but should be checked if already implemented:
- Vehicle location updates (PUT /api/vehicles/:id/location)
- Crew location updates (PUT /api/crew/:id/location)  
- Crew status updates (PUT /api/crew/:id/status)

All endpoints are tested and working with the existing database structure. The system follows the established patterns for authentication, error handling, and audit logging.