# Emergency Dispatch System (Respondr) - System Architecture & User Flow

## System Overview

The Respondr Emergency Dispatch System is designed for emergency services with two main platforms:

- **Web Application**: For control room operations and administration
- **Mobile Application**: For citizens and field responders

## User Types & Access Patterns

### 🌐 Web Application Users (Control Room & Admin)

#### 1. **Call Takers**

- **Purpose**: Receive and log emergency calls
- **Registration**: Manual registration by System Administrator
- **Access**: Web dashboard only
- **Key Functions**: Emergency call intake, incident data entry, caller information capture

#### 2. **Dispatchers**

- **Purpose**: Assign resources and monitor incidents
- **Registration**: Manual registration by System Administrator
- **Access**: Web dashboard only
- **Key Functions**: Resource allocation, real-time monitoring, crew coordination

#### 3. **System Administrators**

- **Purpose**: Manage system configuration and user accounts
- **Registration**: Manual registration by Senior Admin (initial admin created during system setup)
- **Access**: Web dashboard with admin privileges
- **Key Functions**: User management, vehicle/crew registration, system configuration

#### 4. **Shift Supervisors**

- **Purpose**: Oversee operations and approve registrations
- **Registration**: Manual registration by System Administrator
- **Access**: Web dashboard only
- **Key Functions**: Shift planning, crew assignment, vehicle approval, performance monitoring

#### 5. **Crew Leaders** (Partial Web Access)

- **Purpose**: Senior field personnel with supervisory responsibilities
- **Registration**: Manual registration by System Administrator
- **Access**: Both web (limited) and mobile app
- **Key Functions**: Equipment checks, team coordination, incident reporting

### 📱 Mobile Application Users

#### 1. **Citizens**

- **Purpose**: Report emergencies and receive emergency services
- **Registration**: Self-registration through mobile app only
- **Access**: Mobile app only (citizen portal)
- **Key Functions**: Emergency reporting, location sharing, status updates

#### 2. **Field Crews (EMTs & Firefighters)**

- **Purpose**: Respond to emergencies and update status
- **Registration**: Manual registration by System Administrator (crew member data) + Mobile app activation
- **Access**: Mobile app only (field responder portal)
- **Key Functions**: Assignment acceptance, location updates, incident reporting, equipment checks

## Platform Boundaries & Responsibilities

### 🌐 Web Application Scope

**Primary Users**: Control room staff and administrators
**No Public Access**: No homepage needed - direct login for authorized personnel
**Core Functions**:

- Emergency call management and incident logging
- Real-time resource dispatch and coordination
- Vehicle and crew registration (admin functions)
- Shift scheduling and crew management
- System configuration and user management
- Performance analytics and reporting

### 📱 Mobile Application Scope

**Primary Users**: Citizens and field personnel
**Citizen Functions**:

- Emergency reporting with location services
- Real-time updates on emergency response
- Emergency contacts and medical information
  **Field Responder Functions**:
- Assignment notifications and acceptance
- Real-time location tracking
- Equipment checks and vehicle readiness
- Incident status updates and completion reports

## Authentication & Registration Flows

### Web Application Authentication

```
System Admin Creates User Account
    ↓
Sends Login Credentials to User (secure channel)
    ↓
User Logs In → Role-Based Dashboard Access
    ↓
[Call Taker] → Emergency Call Management
[Dispatcher] → Resource Management & Dispatch
[Supervisor] → Operations Management & Approvals
[Admin] → System Configuration & User Management
```

### Mobile Application Authentication

#### Citizens:

```
Download Mobile App
    ↓
Self-Register (Email, Phone, Basic Info)
    ↓
Phone/Email Verification
    ↓
Complete Profile (Emergency Contacts, Medical Info)
    ↓
Access Citizen Emergency Portal
```

#### Field Crews:

```
Admin Registers Crew Member in Web System
    ↓
Crew Member Downloads Mobile App
    ↓
Enters Employee ID + Initial Password
    ↓
Account Activation & Profile Setup
    ↓
Access Field Responder Portal
```

## System Access Points

### Web Application Entry Point

- **URL**: Dedicated web portal (e.g., dispatch.respondr.lk)
- **Landing**: Direct login page (no public homepage)
- **Security**: Internal network access + VPN for remote users
- **Authentication**: Username/password + optional 2FA

### Mobile Application Entry Point

- **Citizens**: Public app store download → Self registration
- **Field Crews**: Internal app distribution → Employee activation

## Data Flow & Integration

### Emergency Incident Flow

```
Citizen Reports Emergency (Mobile App)
    ↓
Call Taker Receives Alert (Web Dashboard)
    ↓
Call Taker Logs Incident Details
    ↓
Dispatcher Assigns Resources (Web Dashboard)
    ↓
Field Crews Notified (Mobile App)
    ↓
Crews Respond & Update Status (Mobile App)
    ↓
Real-time Updates to Control Room (Web Dashboard)
```

## Key Architectural Decisions

### ✅ **Correct Current Implementation**

- JWT-based authentication with role-based access control
- Password security with strength validation and history
- Responsive web design for control room operations

### ❌ **Issues to Address**

1. **No Self-Registration for Web Users**: Remove public registration - admin-only user creation
2. **No Citizen Dashboard in Web App**: Citizens use mobile app exclusively
3. **Email System**: Implement proper email service for password resets
4. **Home Page**: Remove/redirect - web app is for authorized personnel only

### 🔄 **Recommended Changes**

#### Immediate (Phase 1):

1. **Disable Public Registration**: Convert to admin-only user creation
2. **Configure Email Service**: Set up SMTP/email service for password resets
3. **Update Landing Page**: Remove home page, redirect to login
4. **Role-Based Routing**: Implement role-specific dashboards after login

#### Future (Phase 2):

1. **Mobile App Development**: Separate React Native/Flutter app
2. **API Integration**: Shared backend for web and mobile
3. **Real-time Communication**: WebSocket for live updates
4. **Integration Testing**: End-to-end workflow testing

## Security Considerations

### Web Application Security

- **Network Security**: Internal network + VPN access
- **Authentication**: Multi-factor authentication for admin users
- **Authorization**: Strict role-based access control
- **Session Management**: Secure session handling with auto-logout
- **Audit Logging**: Complete audit trail for all user actions

### Mobile Application Security

- **Data Encryption**: End-to-end encryption for sensitive data
- **Location Privacy**: Secure location sharing with citizen consent
- **Device Security**: App-level security with biometric authentication
- **Offline Security**: Secure local data storage for offline operations

## Development Priority

### Phase 1 (Current - Web Application Foundation)

- ✅ Authentication system enhancement (completed)
- 🔄 Fix registration flow (admin-only user creation)
- 🔄 Configure email system for password resets
- 📋 Implement role-based dashboard routing
- 📋 Emergency call logging system
- 📋 Resource dispatch interface

### Phase 2 (Mobile Application Development)

- 📱 Mobile app architecture design
- 📱 Citizen registration and emergency reporting
- 📱 Field responder app with GPS tracking
- 🔄 API integration between platforms

### Phase 3 (Integration & Testing)

- 🔗 End-to-end workflow testing
- 📊 Performance monitoring and analytics
- 🚀 Production deployment and monitoring

---

This architecture ensures clear separation of concerns between platforms while maintaining seamless emergency response workflows. The web application serves as the central command and control system, while the mobile application extends the system's reach to citizens and field personnel.
