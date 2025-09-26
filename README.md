# Emergency Dispatch System - Respondr

## Project Overview

A comprehensive MERN stack emergency dispatch system for the National Emergency Response and Coordination Center (NERCC) in Sri Lanka.

## Team Members

- **M. I. M. Afham** (IT23827912) - Team Leader, Authentication & Security, Dispatching, Real-time tracking & Auto-Reassignment, Dynamic Routing & ETA
- **T. H. C. T. De Silva** (IT23836136) - Emergency Call Logging & Location Management
- **J. A. J. Spencer** (IT23536166) - Shift Management & Crew Scheduling
- **D. D. I. Nawanjana** (IT23857162) - Vehicle & Crew Registration
- **W. P. L. P. Udayanga** (IT23827158) - Equipment Management & Maintenance

## Technology Stack

- **Frontend:** React.js, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** WebSocket (Socket.io)
- **Maps:** Google Maps API
- **SMS:** Twilio API

## Project Structure

```
emergency-dispatch-system/
├── frontend/          # React.js application
├── backend/           # Node.js/Express server
├── docs/             # Project documentation
└── README.md         # This file
```

## Development Timeline

- **Week 1:** Foundation setup and individual feature development
- **Week 2:** Integration, testing, and system optimization
- **Target:** 80% completion in 2 weeks

## Quick Start

### **One Command Setup (Recommended)**

```bash
git clone <repository-url>
cd emergency-dispatch-system
npm install  # Installs all dependencies for root + all apps automatically
npm run seed  # Populate database with test data
npm run dev  # Start both backend and frontend
```

### **Manual Setup (Alternative)**

1. Follow the [Development Setup Guide](./docs/development-setup-guide.md)
2. Install required software
3. Clone repository and create your feature branch
4. Run `npm run install-all` to install all app dependencies
5. Set up development environment

## Features by Team Member

### Afham - System Foundation

- User authentication and authorization
- JWT token management
- Database architecture setup
- Security middleware

### De Silva - Emergency Management

- Emergency call logging system
- Location geocoding and validation
- Duplicate incident detection
- Communication system

### Spencer - Shift Management

- Shift creation and scheduling
- Crew assignment to shifts
- Coverage validation
- Notification system

### Nawanjana - Registration Systems

- Vehicle registration wizard
- Crew registration system
- Approval workflows
- Document management

### Udayanga - Equipment Management

- Digital equipment checklists
- Maintenance workflow automation
- Equipment readiness tracking
- Mobile inspection interface

## API Endpoints Structure

```
/api/auth/          # Authentication routes
/api/incidents/     # Emergency incident management
/api/vehicles/      # Vehicle operations
/api/crews/         # Crew management
/api/shifts/        # Shift scheduling
/api/equipment/     # Equipment management
/api/communications/ # SMS and notifications
```

## Development Guidelines

- Follow Git workflow with feature branches
- Use GitHub Desktop for version control
- Code review required for all pull requests
- Maintain comprehensive documentation
- Test all features before integration

## Support & Resources

- **Setup Guide:** [development-setup-guide.md](./docs/development-setup-guide.md)
- **API Documentation:** (To be created)
- **Team Communication:** WhatsApp group
- **Code Review:** GitHub Pull Requests

## Academic Requirements

- Complete understanding of MERN stack concepts
- Ability to explain and recreate code segments
- Demonstration of individual and integrated features
- Comprehensive documentation and testing

---

**Last Updated:** August 31, 2025  
**Status:** In Development  
**Next Milestone:** Foundation Setup Complete (Week 1)
