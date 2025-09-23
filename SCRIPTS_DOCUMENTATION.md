# 📁 Project Structure & Scripts Documentation

## 🗂️ Backend File Organization

### `/scripts/` Directory Structure:

```
backend/scripts/
├── setup/
│   └── team-setup.js       # Team member onboarding verification
├── tests/
│   ├── test-atlas.js       # MongoDB Atlas connection testing
│   └── test-auth.js        # Authentication API endpoint testing
├── clean.js                # Database cleanup utility
└── seed.js                 # Database seeding with test data
```

---

## 🎯 Script Purposes & Usage

### **Database Management Scripts**

#### `scripts/seed.js`

- **Purpose**: Populate database with initial test data
- **Usage**: `npm run seed`
- **What it does**:
  - Creates sample users for each role (Admin, Dispatcher, Call Taker, etc.)
  - Sets up realistic test data for development
  - Safe to run multiple times (checks for existing data)

#### `scripts/clean.js`

- **Purpose**: Remove all data from database
- **Usage**: `npm run clean`
- **What it does**:
  - Deletes all users from database
  - Useful for resetting during development
  - ⚠️ **Warning**: This will delete ALL data!

---

### **Setup & Onboarding Scripts**

#### `scripts/setup/team-setup.js`

- **Purpose**: Team member onboarding verification
- **Usage**: `npm run team-setup`
- **What it does**:
  - Tests MongoDB Atlas connection
  - Verifies User model works correctly
  - Checks database access and permissions
  - Provides troubleshooting guidance
- **When to use**: First time setup for new team members

---

### **Testing Scripts**

#### `scripts/tests/test-atlas.js`

- **Purpose**: MongoDB Atlas connection testing
- **Usage**: `npm run test-atlas`
- **What it does**:
  - Tests connection to MongoDB Atlas
  - Creates and deletes a test document
  - Verifies read/write permissions
  - Reports connection status and database info

#### `scripts/tests/test-auth.js`

- **Purpose**: Authentication API comprehensive testing
- **Usage**: `npm run test-auth`
- **What it does**:
  - Tests all authentication endpoints
  - Registers test users
  - Tests login/logout functionality
  - Validates JWT token handling
  - Tests role-based access control

---

## 🚀 NPM Scripts Reference

```bash
# Development
npm run dev          # Start server with nodemon
npm run start        # Start production server
npm run debug        # Start server with Node.js debugger

# Database Management
npm run seed         # Populate database with test data
npm run clean        # Remove all data from database

# Testing & Setup
npm run team-setup   # Team member onboarding verification
npm run test-atlas   # Test MongoDB Atlas connection
npm run test-auth    # Test authentication endpoints
```

---

## 🔄 Typical Development Workflow

### **For New Team Members:**

1. `npm run team-setup` - Verify everything works
2. `npm run seed` - Add test data
3. `npm run dev` - Start development

### **For Testing:**

1. `npm run test-atlas` - Verify database connection
2. `npm run test-auth` - Test API endpoints
3. `npm run clean` - Reset database if needed

### **For Database Reset:**

1. `npm run clean` - Remove all data
2. `npm run seed` - Add fresh test data

---

## ❓ Why This Organization?

### **Before (Messy):**

- Scripts scattered in root directory
- No clear categorization
- Hard to find specific utilities

### **After (Clean):**

- **`/scripts/setup/`** - Onboarding and configuration
- **`/scripts/tests/`** - Testing and verification
- **`/scripts/`** - Core database utilities

### **Benefits:**

- **Clear Purpose**: Each directory has a specific role
- **Easy Navigation**: Find scripts by their purpose
- **Team Friendly**: New members know where to look
- **Maintainable**: Easy to add new scripts in the right place

---

## 🛠️ Adding New Scripts

### **Database Scripts**: Add to `/scripts/`

### **Testing Scripts**: Add to `/scripts/tests/`

### **Setup Scripts**: Add to `/scripts/setup/`

Remember to:

1. Update `package.json` with new script commands
2. Use relative paths: `../../models/User` from subdirectories
3. Add documentation here for new scripts
