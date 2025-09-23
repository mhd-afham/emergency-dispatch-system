# Emergency Dispatch System - Authentication System Documentation

## 🎉 Implementation Complete!

The authentication system for the Emergency Dispatch System has been successfully implemented by **Afham**. This forms the foundational security layer that all other team members will integrate with.

## 📋 System Overview

### Architecture

- **Framework**: Express.js with JWT-based authentication
- **Database**: MongoDB with Mongoose ODM
- **Security**: bcryptjs password hashing, JWT tokens, role-based access control
- **Middleware**: Comprehensive authorization and audit logging

### User Roles Supported

1. **Admin** - Full system access
2. **Supervisor** - Management oversight
3. **Dispatcher** - Emergency dispatch operations
4. **Call Taker** - Emergency call handling
5. **Field Crew** - Field operations staff
6. **Citizen** - Public user access

## 🏗️ Implemented Components

### 1. User Model (`/models/User.js`)

**Features:**

- Comprehensive user schema with authentication, profile, and settings
- Password hashing with bcryptjs (10 salt rounds)
- JWT token generation and validation methods
- Account security with login attempt tracking and automatic locking
- Email verification system (ready for email service integration)
- Password reset functionality with secure tokens
- Audit trail with creation/update timestamps

**Key Methods:**

- `matchPassword()` - Secure password comparison
- `getSignedJwtToken()` - JWT token generation
- `getResetPasswordToken()` - Password reset token creation
- `incLoginAttempts()` - Login attempt tracking and account locking

### 2. Authentication Middleware (`/middleware/auth.js`)

**Features:**

- JWT token verification from headers or cookies
- Role-based authorization with flexible permission levels
- Account status validation (active/inactive, locked/unlocked)
- Comprehensive error handling with specific error messages
- Audit logging for security monitoring
- Optional authentication for public endpoints

**Middleware Functions:**

- `authenticate` - Core JWT verification
- `authorize(...roles)` - Role-based access control
- `adminOnly` - Admin-only access
- `dispatcherAndAdmin` - Dispatcher and Admin access
- `fieldCrew` - Field crew authorization
- `callTakerAndAbove` - Call taker and higher roles
- `internalStaff` - All internal staff (excludes Citizens)
- `selfOrAdmin` - User can access own data or admin can access any
- `optionalAuth` - Optional authentication for enhanced features
- `auditLog` - Action logging for security audit

### 3. Authentication Controller (`/controllers/authController.js`)

**Endpoints Implemented:**

- **POST** `/api/auth/register` - User registration with validation
- **POST** `/api/auth/login` - User authentication with attempt tracking
- **POST** `/api/auth/logout` - Secure logout with cookie clearing
- **GET** `/api/auth/me` - Get current user profile (protected)
- **PUT** `/api/auth/profile` - Update user profile (protected)
- **PUT** `/api/auth/password` - Change password (protected)
- **POST** `/api/auth/forgot-password` - Password reset request
- **PUT** `/api/auth/reset-password/:token` - Password reset execution
- **GET** `/api/auth/verify-email/:token` - Email verification

**Security Features:**

- Input validation and sanitization
- Password strength requirements (minimum 8 characters)
- Account lockout after failed login attempts
- Secure token-based password reset
- Role restriction for registration (Citizens only for self-registration)
- Comprehensive error handling and logging

### 4. Authentication Routes (`/routes/auth.js`)

**Route Configuration:**

- Public routes: register, login, logout, forgot-password, reset-password, verify-email
- Protected routes: me, profile, password (require authentication)
- Audit logging integrated for all actions
- RESTful API design with consistent response format

### 5. Server Integration (`/server.js`)

**Updates Made:**

- Cookie parser middleware for JWT cookie handling
- Authentication routes integrated at `/api/auth`
- Environment configuration updated with JWT settings
- CORS configuration for frontend integration

## 🔧 Configuration

### Environment Variables Required

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/emergency_dispatch

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Dependencies Added

- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `cookie-parser` - Cookie handling
- `mongoose` - MongoDB ODM

## 🚀 Usage Examples

### Registration Request

```javascript
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "confirmPassword": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890"
}
```

### Login Request

```javascript
POST /api/auth/login
{
  "login": "user@example.com", // Can be email or username
  "password": "password123"
}
```

### Protected Route Access

```javascript
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

### Role-Based Route Example

```javascript
// In your routes
router.get("/admin-only", authenticate, adminOnly, (req, res) => {
  // Only admins can access this
});

router.get("/dispatchers", authenticate, dispatcherAndAdmin, (req, res) => {
  // Dispatchers and Admins can access this
});
```

## 🔐 Security Features

### Password Security

- Minimum 8 character requirement
- bcryptjs hashing with 10 salt rounds
- Password change tracking with timestamps

### Account Security

- Maximum 5 login attempts before account lock
- 2-hour automatic unlock period
- Account activation/deactivation support

### Token Security

- JWT tokens with configurable expiration
- Secure HTTP-only cookies
- Token validation on every protected request

### Audit & Monitoring

- Login attempt tracking
- Action logging for security events
- IP address and user agent logging

## 🧪 Testing

### Test Requirements

**Prerequisites:**

1. MongoDB server must be running locally
2. Environment variables properly configured
3. Server started: `npm run dev` or `node server.js`

### Test Script Available

- `test-auth.js` - Comprehensive authentication testing
- Tests registration, login, protected routes, logout
- Validates security measures and error handling

### Manual Testing

1. Start MongoDB: `mongod` (or MongoDB service)
2. Start server: `cd backend && node server.js`
3. Run tests: `node test-auth.js`

## 🚧 Current Status & Next Steps

### ✅ Completed (Ready for Team Integration)

- Full authentication system implementation
- User model with comprehensive security
- JWT-based authentication with role-based access
- All authentication endpoints functional
- Server integration complete
- Documentation and examples provided

### ⚠️ Dependencies for Testing

- **MongoDB**: Must be running for database operations
- **Environment**: JWT_SECRET must be configured
- **Email Service**: Password reset emails require email service integration

### 🔄 Integration Points for Team Members

**For Frontend Team:**

- Authentication API endpoints ready at `/api/auth/*`
- JWT tokens provided for protected route access
- User profile management endpoints available

**For Mobile Team:**

- Same REST API endpoints work for mobile app
- JWT tokens for authenticated requests
- Role-based permissions ready for implementation

**For Other Backend Teams:**

- Import middleware: `const { authenticate, authorize } = require('./middleware/auth')`
- Protect routes: `router.get('/protected', authenticate, authorize('Admin'), handler)`
- Access user data: `req.user` available in protected routes

## 📞 Contact & Support

**Implemented by:** Afham  
**Role:** Authentication System Lead  
**Status:** Ready for team integration  
**Documentation:** Complete with examples and usage patterns

## 🏁 Summary

The authentication system is **fully functional and ready for integration**. All team members can now:

1. Use the authentication middleware to protect their routes
2. Access user information through `req.user` in protected routes
3. Implement role-based permissions using the provided middleware
4. Build upon this foundation for their specific features

The system provides enterprise-grade security with comprehensive audit logging, making it suitable for emergency services where security and accountability are paramount.
