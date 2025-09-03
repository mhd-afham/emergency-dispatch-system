# Emergency Dispatch System - Development Setup Guide

## Team: Y2.S2.WD.IT.07.02 Group No: 160

**Project:** Emergency Dispatch System – Respondr
**Timeline:** 80% completion in 2 weeks

---

## 📋 Table of Contents

1. [Software Installation](#software-installation)
2. [GitHub Setup & Workflow](#github-setup--workflow)
3. [Project Structure Setup](#project-structure-setup)
4. [Development Environment Configuration](#development-environment-configuration)
5. [Git Workflow with GitHub Desktop](#git-workflow-with-github-desktop)
6. [Team Development Guidelines](#team-development-guidelines)
7. [Essential MERN Stack Concepts](#essential-mern-stack-concepts)

---

## 🔧 Software Installation

### Required Software (Install in this order):

#### 1. Node.js & npm

- **Download:** https://nodejs.org/en/download/
- **Version:** Download LTS version (v20.x.x)
- **Installation:** Run installer with default settings
- **Verify:** Open Command Prompt and run:
  ```
  node --version
  npm --version
  ```
- **What it does:** Node.js runs JavaScript on server, npm manages packages

#### 2. Git for Windows

- **Download:** https://git-scm.com/download/win
- **Installation:** Use default settings, select "Git Bash Here" option
- **Verify:** In Command Prompt: `git --version`
- **What it does:** Version control system to track code changes

#### 3. GitHub Desktop (Graphical Git Interface)

- **Download:** https://desktop.github.com/
- **Installation:** Run installer and sign in with your GitHub account
- **What it does:** Visual interface for Git operations (no commands needed)

#### 4. Visual Studio Code

- **Download:** https://code.visualstudio.com/Download
- **Installation:** Run installer, check "Add to PATH" option
- **Essential Extensions to Install:**
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - Bracket Pair Colorizer
  - Auto Rename Tag
  - MongoDB for VS Code
  - Thunder Client (API testing)

#### 5. MongoDB Community Server

- **Download:** https://www.mongodb.com/try/download/community
- **Version:** Windows x64, Current release
- **Installation:**
  - Run installer
  - Choose "Complete" setup
  - Install MongoDB Compass (GUI for database)
  - Install as Windows Service
- **Verify:** MongoDB Compass should open after installation

#### 6. Postman (API Testing)

- **Download:** https://www.postman.com/downloads/
- **Installation:** Run installer
- **What it does:** Test API endpoints during development

---

## 🐙 GitHub Setup & Workflow

### Repository Setup (Afham - Team Leader Task)

#### Step 1: Create Repository

1. Go to GitHub.com
2. Click "New Repository"
3. Repository name: `emergency-dispatch-system`
4. Description: `Emergency Dispatch System - Respondr (SLIIT IT2080)`
5. Set to **Private** (for academic integrity)
6. **DO NOT** check "Add a README file" (we already have one)
7. **DO NOT** select ".gitignore template" (we already have one)
8. **DO NOT** choose a license (not needed for academic project)
9. Click "Create Repository"

#### Step 2: Add Team Members as Collaborators

1. Go to repository → Settings → Manage access
2. Click "Invite a collaborator"
3. Add each team member's GitHub username
4. They'll receive email invitations

#### Step 3: Create Branch Protection Rules

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews before merging (set to **1 required review**)
   - Require review from code owners
   - Dismiss stale reviews when new commits are pushed

### Team Member Setup

#### Each team member should:

1. Accept GitHub collaboration invitation
2. Open GitHub Desktop
3. Clone repository:
   - File → Clone Repository
   - Choose `emergency-dispatch-system`
   - Local path: `C:\Projects\emergency-dispatch-system`

---

## 🔗 Connecting Your Local Project to GitHub (For Team Leader)

### After creating the GitHub repository, you need to connect your existing local project. You can do this in **3 different ways**:

#### **Method 1: GitHub Desktop (Recommended for Beginners)**

1. **Download and Install GitHub Desktop**

   - Go to: https://desktop.github.com/
   - Download and install
   - Sign in with your GitHub account

2. **Add Your Existing Repository**

   - Open GitHub Desktop
   - Click "File" → "Add Local Repository"
   - Browse to: `d:\web-projects\emergency-dispatch-system`
   - Click "Add Repository"
   - GitHub Desktop will detect it's a Git repository

3. **Connect to Remote Repository**

   - GitHub Desktop will show "Publish repository" button
   - Click "Publish repository"
   - **Repository name**: Should auto-fill as `emergency-dispatch-system`
   - **Description**: `Emergency Dispatch System - Respondr (SLIIT IT2080)`
   - **IMPORTANT**: Check "Keep this code private"
   - **IMPORTANT**: In organization dropdown, select your personal account
   - Click "Publish repository"

4. **Verify Upload**
   - GitHub Desktop will automatically push all your commits
   - Go to GitHub.com and refresh your repository page
   - You should see all your files and folders

#### **Method 2: VS Code Source Control (Built-in Alternative)**

1. **Open Your Project in VS Code**

   - File → Open Folder → `d:\web-projects\emergency-dispatch-system`

2. **Open Source Control Panel**

   - Click the Source Control icon in left sidebar (looks like branching lines)
   - Or press `Ctrl+Shift+G`

3. **Add Remote Repository**

   - Click the "..." menu in Source Control panel
   - Select "Remote" → "Add Remote"
   - **Name**: `origin`
   - **URL**: `https://github.com/YOUR_USERNAME/emergency-dispatch-system.git`
   - Click "Add Remote"

4. **Push to GitHub**
   - In Source Control panel, click "..." menu
   - Select "Push to..." → "origin/main"
   - Enter your GitHub credentials if prompted
   - Your code will upload to GitHub

#### **Method 3: Command Line (For Reference Only)**

```bash
# Navigate to your project
cd d:\web-projects\emergency-dispatch-system

# Add remote connection
git remote add origin https://github.com/YOUR_USERNAME/emergency-dispatch-system.git

# Rename branch to main (GitHub standard)
git branch -M main

# Push code to GitHub
git push -u origin main
```

### **Troubleshooting Common Issues**

#### **If GitHub Desktop shows "Repository already exists":**

- The repository name conflicts with existing one
- Solution: Use "File" → "Add Local Repository" instead of "Publish"

#### **If VS Code asks for credentials:**

- Use your GitHub username and password
- Or generate a Personal Access Token (GitHub Settings → Developer settings → Personal access tokens)

#### **If you see "403 Permission denied":**

- Check repository is set to Private with you as owner
- Verify you're signed into correct GitHub account

---

## 🏗️ Project Structure Setup

### Recommended Folder Structure:

```
emergency-dispatch-system/
├── frontend/                 # React.js application
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Main pages
│   │   ├── services/        # API calls
│   │   ├── context/         # React Context
│   │   ├── utils/           # Helper functions
│   │   └── styles/          # CSS files
│   ├── package.json
│   └── package-lock.json
├── backend/                  # Node.js/Express server
│   ├── controllers/         # Route handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Authentication, validation
│   ├── config/              # Database, environment
│   ├── utils/               # Helper functions
│   ├── package.json
│   └── server.js
├── docs/                    # Project documentation
├── .gitignore
├── README.md
└── package.json             # Root package.json
```

---

## ⚙️ Development Environment Configuration

### Initial Project Setup (Afham - Do this first)

#### 1. Initialize Root Package.json

Create file: `package.json` in root directory:

```json
{
  "name": "emergency-dispatch-system",
  "version": "1.0.0",
  "description": "Emergency Dispatch System - Respondr",
  "main": "server.js",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd backend && npm run dev",
    "client": "cd frontend && npm start",
    "build": "cd frontend && npm run build"
  },
  "keywords": ["emergency", "dispatch", "mern", "sliit"],
  "author": "Group 160 - Y2.S2.WD.IT.07.02",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

#### 2. Backend Setup

Navigate to project root in Command Prompt:

```bash
mkdir backend
cd backend
npm init -y
```

Install backend dependencies:

```bash
npm install express mongoose cors dotenv bcryptjs jsonwebtoken nodemon
npm install --save-dev nodemon
```

#### 3. Frontend Setup

From project root:

```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom
```

#### 4. Environment Configuration

Create `.env` file in backend folder:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/emergency_dispatch
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
```

---

## 🔄 Git Workflow - Multiple Methods

### Branch Strategy

#### Main Branches:

- **main**: Production-ready code (protected)
- **development**: Integration branch for testing

#### Feature Branches (one per team member):

- **afham/authentication**: Authentication & security system
- **desilva/incident-management**: Emergency call logging & location
- **spencer/shift-management**: Shift planning & crew assignment
- **nawanjana/vehicle-registration**: Vehicle & crew registration
- **udayanga/equipment-management**: Equipment readiness & maintenance

### **Method 1: GitHub Desktop Workflow (Recommended)**

#### For Team Leader (Afham):

1. **Create Development Branch:**

   - Open GitHub Desktop
   - Current branch dropdown: select "main"
   - Click "New branch" button
   - Name: "development"
   - Click "Create branch"
   - Click "Publish branch" to upload to GitHub

2. **Create Your Feature Branch:**
   - Current branch dropdown: select "development"
   - Click "New branch" button
   - Name: "afham/authentication"
   - Click "Create branch"
   - Click "Publish branch"

#### For Team Members:

1. **Fetch Latest Changes:**

   - Click "Fetch origin" button (do this daily)
   - This downloads latest changes from GitHub

2. **Create Your Feature Branch:**

   - Current branch dropdown: select "development"
   - Click "New branch" button
   - Name: "yourname/your-feature" (e.g., "desilva/incident-management")
   - Click "Create branch"
   - Click "Publish branch"

3. **Daily Work Cycle:**

   - Make changes in VS Code
   - Return to GitHub Desktop
   - Review changes in "Changes" tab
   - Add commit message: "Add incident logging form"
   - Click "Commit to yourname/your-feature"
   - Click "Push origin" (uploads to GitHub)

4. **Weekly Integration (Create Pull Request):**
   - In GitHub Desktop: Branch → "Create pull request"
   - This opens GitHub.com in browser
   - Add description of changes
   - Click "Create pull request"
   - Wait for Afham's review and approval

### **Method 2: VS Code Source Control Workflow**

#### Creating Branches in VS Code:

1. **Open Command Palette:**

   - Press `Ctrl+Shift+P`
   - Type "Git: Create Branch"
   - Enter branch name (e.g., "development" or "afham/authentication")

2. **Switch Between Branches:**

   - Click branch name in bottom-left status bar
   - Select branch from dropdown

3. **Daily Work Cycle:**

   - Make changes in VS Code
   - Open Source Control panel (`Ctrl+Shift+G`)
   - Review changes
   - Type commit message
   - Click "✓" (commit) button
   - Click "..." → "Push" to upload to GitHub

4. **Create Pull Request:**
   - Go to GitHub.com manually
   - Navigate to your repository
   - GitHub will show "Compare & pull request" button
   - Click it and fill out the form

### **Method 3: Command Line (For Reference)**

```bash
# Create and switch to development branch
git checkout -b development
git push -u origin development

# Create feature branch
git checkout development
git checkout -b afham/authentication
git push -u origin afham/authentication

# Daily work cycle
git add .
git commit -m "Add login functionality"
git push origin afham/authentication
```

### **🤔 Which Method Should You Use?**

#### **GitHub Desktop (Recommended for Your Team)**

**✅ Pros:**

- **Visual interface** - See changes, branches, and history graphically
- **Beginner-friendly** - No command memorization needed
- **Built-in pull request creation** - One-click PR creation
- **Conflict resolution help** - Visual merge conflict resolution
- **Branch management** - Easy branch switching and creation

**❌ Cons:**

- **Extra software** - Need to download and install
- **Learning curve** - New interface to learn

**👥 Best for:** Team members new to Git, visual learners

#### **VS Code Source Control (Good Alternative)**

**✅ Pros:**

- **Already installed** - Built into VS Code
- **Integrated workflow** - Code and Git in same window
- **Powerful features** - Advanced Git operations available
- **No context switching** - Stay in your coding environment

**❌ Cons:**

- **Less visual** - More text-based than GitHub Desktop
- **Manual PR creation** - Need to go to GitHub.com for pull requests
- **Steeper learning** - More Git knowledge required

**👥 Best for:** Developers comfortable with VS Code, want everything in one place

#### **Command Line (For Advanced Users)**

**✅ Pros:**

- **Most powerful** - Access to all Git features
- **Fast** - Quick operations once learned
- **Universal** - Works everywhere
- **Automation** - Can be scripted

**❌ Cons:**

- **Steep learning curve** - Need to memorize commands
- **Error-prone** - Easy to make mistakes
- **No visual feedback** - Text-only interface

**👥 Best for:** Experienced developers, power users

### **📋 Recommendation for Your Project:**

**For Team Leader (Afham):** Start with **GitHub Desktop** for initial setup, then use **VS Code Source Control** for daily work once comfortable.

**For Team Members:** Use **GitHub Desktop** throughout the project - it's the most beginner-friendly and reduces chance of Git errors.

**Why this combination works:**

- Reduces learning overhead for your 2-week timeline
- Minimizes Git-related confusion and conflicts
- Allows focus on actual coding rather than Git commands
- Provides visual feedback for better understanding

---

### Merge Conflicts Resolution

#### If you see conflicts in GitHub Desktop:

1. Click "Open in Visual Studio Code"
2. Look for conflict markers:
   ```javascript
   <<<<<<< HEAD
   Your code
   =======
   Other person's code
   >>>>>>> branch-name
   ```
3. Choose which code to keep or combine both
4. Remove conflict markers
5. Save file
6. In GitHub Desktop: "Mark as resolved"
7. Commit and push

---

## 👥 Team Development Guidelines

### Code Review Process

#### Pull Request Template:

```markdown
## Description

Brief description of changes

## Features Added

- Feature 1
- Feature 2

## Testing Done

- Tested on localhost
- API endpoints verified

## Screenshots (if UI changes)

[Add screenshots]
```

### Communication Protocol

#### Daily Standup (Online/WhatsApp):

- What did you complete yesterday?
- What will you work on today?
- Any blockers or help needed?

#### Weekly Integration Meeting:

- Merge all feature branches to development
- Test integrated system
- Plan next week's work

### Code Standards

#### Naming Conventions:

- **Files:** camelCase (userController.js)
- **Components:** PascalCase (LoginForm.jsx)
- **Variables:** camelCase (userName)
- **Constants:** UPPER_CASE (API_BASE_URL)

#### Comment Requirements:

```javascript
/**
 * Handles user authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} User object with token
 */
const loginUser = async (email, password) => {
  // Implementation here
};
```

---

## 📚 Essential MERN Stack Concepts

### Understanding the Stack

#### MongoDB (Database)

- **What:** NoSQL document database
- **Why:** Stores data as JSON-like documents
- **Your Role:** Store incidents, users, vehicles, etc.

#### Express.js (Backend Framework)

- **What:** Web framework for Node.js
- **Why:** Creates APIs and handles HTTP requests
- **Your Role:** Handle login, create incidents, etc.

#### React.js (Frontend Framework)

- **What:** JavaScript library for building UIs
- **Why:** Creates interactive web pages
- **Your Role:** Dashboard, forms, maps display

#### Node.js (Runtime)

- **What:** Runs JavaScript on server
- **Why:** Allows JavaScript for backend development
- **Your Role:** Server that processes requests

### Request Flow Example:

```
1. User clicks "Login" button (React)
2. React sends POST request to /api/auth/login (Axios)
3. Express receives request (Backend Route)
4. Express validates credentials (Controller)
5. Express queries database (MongoDB/Mongoose)
6. Express sends response back (JWT token)
7. React receives response and updates UI
```

### Essential Learning Resources

#### Before Starting Development:

1. **MERN Crash Course**: Watch "MERN Stack Tutorial" by Traversy Media (4 hours)
2. **React Basics**: React Official Tutorial (2 hours)
3. **MongoDB**: "MongoDB in 30 Minutes" by Web Dev Simplified

#### As You Develop:

- **React Hook:** When working on frontend components
- **Express Routing:** When creating API endpoints
- **Mongoose Models:** When defining database schemas

---

## 🚀 Next Steps

### Week 1 Tasks (All Members):

#### Day 1-2: Environment Setup

- [ ] Install all required software
- [ ] Clone repository and create your branch
- [ ] Set up development environment

#### Day 3-4: Learning & Planning

- [ ] Watch recommended tutorials
- [ ] Understand your assigned features
- [ ] Create basic project structure

#### Day 5-7: Foundation Development

- [ ] Afham: Authentication system
- [ ] Others: Basic components for your features

### Week 2 Tasks:

- Integration and testing
- Advanced features implementation
- System optimization

---

## 🆘 Getting Help

### Common Issues & Solutions:

#### "npm is not recognized"

- Restart Command Prompt after Node.js installation
- Add Node.js to PATH manually if needed

#### "Module not found" error

- Run `npm install` in the correct directory
- Check if package.json exists

#### MongoDB connection fails

- Ensure MongoDB service is running
- Check if port 27017 is available

### Team Support:

- **Technical Lead:** Afham (overall architecture)
- **Daily Help:** Team WhatsApp group
- **Code Review:** GitHub pull requests
- **Integration Issues:** Weekly team meetings

---

## 📝 Understanding for Viva

### Key Concepts You Must Know:

#### MERN Architecture:

- How frontend and backend communicate
- Role of each technology in the stack
- Request-response cycle

#### Database Design:

- Why MongoDB for this project
- Document structure vs relational tables
- Indexing for performance

#### Authentication:

- How JWT tokens work
- Password hashing with bcrypt
- Protected routes implementation

#### Real-time Features:

- WebSocket connection for live updates
- State management in React
- API design patterns

### Code Segments You Should Understand:

1. User authentication middleware
2. Database model definitions
3. React component lifecycle
4. API route handlers
5. Error handling patterns

---

**Ready to start? Let's begin with the foundation setup!**
