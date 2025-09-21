# Complete Git Workflow Guide - Team Development

## 📋 Table of Contents

1. [Project Initialization](#project-initialization)
2. [Repository Setup](#repository-setup)
3. [Branch Strategy](#branch-strategy)
4. [Daily Development Workflow](#daily-development-workflow)
5. [Staging and Committing](#staging-and-committing)
6. [Branch Management](#branch-management)
7. [Pull Request Workflow](#pull-request-workflow)
8. [Merge Strategies](#merge-strategies)
9. [Conflict Resolution](#conflict-resolution)
10. [Team Collaboration Guidelines](#team-collaboration-guidelines)
11. [Emergency Scenarios](#emergency-scenarios)
12. [Best Practices](#best-practices)

---

## 🚀 Project Initialization

### **Step 1: Local Project Setup**

#### **Creating New Project Structure:**

```bash
# Create main project directory
mkdir emergency-dispatch-system
cd emergency-dispatch-system

# Initialize Git repository
git init

# Create project structure
mkdir backend frontend docs
```

#### **Essential Files to Create:**

1. **`.gitignore`** - Files Git should ignore
2. **`README.md`** - Project description
3. **`package.json`** - Root project configuration
4. **Backend structure** - Express.js setup
5. **Frontend structure** - React.js setup

#### **Initial Commit:**

```bash
# Stage all files
git add .

# Create initial commit
git commit -m "Initial project setup with MERN stack foundation"
```

### **Step 2: GitHub Repository Creation**

#### **Option A: Create Repository on GitHub First**

1. **Go to GitHub.com**
2. **Click "New Repository"**
3. **Settings:**
   - Name: `emergency-dispatch-system`
   - Description: `Emergency Dispatch System - Respondr (SLIIT IT2080)`
   - Visibility: **Private** (for academic projects)
   - **DO NOT** initialize with README, .gitignore, or license
4. **Click "Create Repository"**

#### **Option B: Push Existing Repository**

```bash
# Add remote connection
git remote add origin https://github.com/USERNAME/emergency-dispatch-system.git

# Push to GitHub
git branch -M main  # Rename master to main (GitHub standard)
git push -u origin main
```

---

## 🌳 Branch Strategy

### **Branch Hierarchy:**

```
main (protected)
├── development
│   ├── afham/authentication
│   ├── desilva/incident-management
│   ├── spencer/shift-management
│   ├── nawanjana/vehicle-registration
│   └── udayanga/equipment-management
└── hotfix/critical-bug-fix (if needed)
```

### **Branch Types and Purpose:**

#### **1. Main Branch (`main`)**

- **Purpose:** Production-ready code
- **Protection:** Branch protection rules enabled
- **Access:** Only through approved pull requests
- **Contains:** Stable, tested, deployable code

#### **2. Development Branch (`development`)**

- **Purpose:** Integration branch for testing features
- **Access:** Feature branches merge here first
- **Testing:** All features tested together
- **Promotion:** Periodically merged to main

#### **3. Feature Branches (`name/feature`)**

- **Naming Convention:** `firstname/feature-name`
- **Examples:**
  - `afham/authentication`
  - `desilva/incident-management`
  - `spencer/shift-management`
- **Purpose:** Individual feature development
- **Lifespan:** Created for feature, deleted after merge

#### **4. Hotfix Branches (`hotfix/description`)**

- **Purpose:** Critical bug fixes
- **Source:** Branched from main
- **Target:** Merged directly to main and development
- **Usage:** Emergency fixes only

---

## 📅 Daily Development Workflow

### **Morning Routine (Start of Work Day):**

#### **GitHub Desktop Method:**

1. **Open GitHub Desktop**
2. **Click "Fetch origin"** - Download latest changes
3. **Switch to your feature branch**
4. **Click "Pull origin"** - Get latest updates

#### **VS Code Method:**

1. **Open project in VS Code**
2. **Press Ctrl+Shift+G** (Source Control)
3. **Click "..." → Pull** - Get latest changes
4. **Check current branch** in bottom-left status bar

#### **Command Line Method:**

```bash
# Navigate to project
cd emergency-dispatch-system

# Fetch latest changes
git fetch origin

# Switch to your branch
git checkout afham/authentication

# Pull latest changes
git pull origin afham/authentication
```

### **During Development:**

#### **Making Changes:**

1. **Edit files in VS Code**
2. **Test your changes** (run server, check functionality)
3. **Review what you changed** before committing

#### **Checking Status:**

```bash
# See what files you've changed
git status

# See specific changes in files
git diff filename.js
```

### **Evening Routine (End of Work Day):**

#### **Save Your Progress:**

1. **Stage changes** (prepare for commit)
2. **Write meaningful commit message**
3. **Commit locally**
4. **Push to GitHub** (backup your work)

---

## 📦 Staging and Committing

### **Understanding Git Staging:**

```
Working Directory → Staging Area → Repository
     (edited)         (staged)      (committed)
```

#### **What is Staging?**

- **Staging Area:** Temporary space where you prepare commits
- **Purpose:** Choose exactly which changes to include
- **Benefit:** Create clean, logical commits

### **Staging Methods:**

#### **GitHub Desktop:**

1. **Changes tab** shows all modified files
2. **Checkboxes** next to files - check what to include
3. **Partial staging** - select specific lines in a file
4. **Review changes** in right panel

#### **VS Code:**

1. **Source Control panel** (Ctrl+Shift+G)
2. **"+" button** next to files to stage
3. **"-" button** to unstage
4. **Stage specific lines** by selecting text and right-click

#### **Command Line:**

```bash
# Stage all changes
git add .

# Stage specific file
git add backend/server.js

# Stage specific parts of file (interactive)
git add -p filename.js

# Unstage files
git reset HEAD filename.js
```

### **Commit Message Guidelines:**

#### **Good Commit Message Structure:**

```
Type: Brief description (50 chars or less)

Detailed explanation if needed (wrap at 72 chars)
- What was changed
- Why it was changed
- How it affects the system
```

#### **Commit Types:**

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code formatting (no logic change)
- **refactor:** Code restructuring (no feature change)
- **test:** Adding or modifying tests
- **chore:** Maintenance tasks

#### **Examples of Good Commit Messages:**

```bash
# Good examples:
git commit -m "feat: Add user authentication with JWT tokens"
git commit -m "fix: Resolve database connection timeout issue"
git commit -m "docs: Update API documentation for incident endpoints"

# Bad examples (avoid these):
git commit -m "stuff"
git commit -m "fixed bug"
git commit -m "updates"
```

### **Committing Process:**

#### **GitHub Desktop:**

1. **Review staged changes**
2. **Write commit message** in bottom-left box
3. **Click "Commit to branch-name"**
4. **Click "Push origin"** to upload

#### **VS Code:**

1. **Type commit message** in Source Control input box
2. **Press Ctrl+Enter** or click ✓ button
3. **Click "..." → Push** to upload

#### **Command Line:**

```bash
# Commit with message
git commit -m "feat: Add user login functionality"

# Push to GitHub
git push origin afham/authentication
```

---

## 🌿 Branch Management

### **Creating Branches:**

#### **When to Create New Branch:**

- Starting new feature
- Fixing specific bug
- Experimenting with new approach
- Working on separate component

#### **Branch Creation Methods:**

**GitHub Desktop:**

1. **Current branch dropdown** (top bar)
2. **Click "New branch"**
3. **Name:** `yourname/feature-description`
4. **Base branch:** Usually `development`
5. **Click "Create branch"**
6. **Click "Publish branch"** to upload

**VS Code:**

1. **Press Ctrl+Shift+P**
2. **Type "Git: Create Branch"**
3. **Enter branch name**
4. **Select base branch**

**Command Line:**

```bash
# Create and switch to new branch
git checkout -b afham/authentication development

# Push new branch to GitHub
git push -u origin afham/authentication
```

### **Switching Between Branches:**

#### **Why Switch Branches:**

- Work on different features
- Test someone else's code
- Fix urgent bugs
- Review pull requests

#### **Switching Methods:**

**GitHub Desktop:**

1. **Current branch dropdown**
2. **Select branch** from list
3. **Files automatically update**

**VS Code:**

1. **Click branch name** in bottom-left status bar
2. **Select branch** from dropdown

**Command Line:**

```bash
# Switch to existing branch
git checkout development

# Switch and pull latest changes
git checkout development && git pull origin development
```

### **Keeping Branches Updated:**

#### **Why Update Branches:**

- Get latest changes from team
- Reduce merge conflicts
- Stay synchronized with main development

#### **Understanding What "Updated" Means:**

**Example Scenario:**

```
Day 1:
development: [Initial Setup]
afham/auth:  [Initial Setup] → [Add login form]
desilva/inc: [Initial Setup] → [Add incident model]

Day 2 - Without updating afham/auth:
development: [Initial Setup] → [Desilva's model merged]
afham/auth:  [Initial Setup] → [Add login form] → [Add validation]
             ↑ PROBLEM: Missing Desilva's database model!

Day 2 - With updating afham/auth:
development: [Initial Setup] → [Desilva's model merged]
afham/auth:  [Initial Setup] → [Desilva's model] → [Add login] → [Add validation]
             ↑ GOOD: Has all team changes!
```

#### **Update Methods:**

**GitHub Desktop Method:**

1. **Switch to development branch:**
   - Current branch dropdown → select "development"
2. **Get latest changes:**
   - Click "Fetch origin" button
   - Click "Pull origin" button
3. **Switch to your feature branch:**
   - Current branch dropdown → select "afham/authentication"
4. **Merge development into your branch:**
   - Branch menu → "Merge into current branch"
   - Select "development" from the list
   - Click "Merge development into afham/authentication"
5. **Push updated branch:**
   - Click "Push origin" button

**VS Code Method:**

1. **Switch to development branch:**
   - Click branch name in bottom-left status bar
   - Select "development" from dropdown
2. **Pull latest changes:**
   - Ctrl+Shift+G (Source Control panel)
   - Click "..." menu → "Pull"
3. **Switch to your feature branch:**
   - Click branch name → select your branch
4. **Merge development:**
   - Ctrl+Shift+P → "Git: Merge Branch"
   - Select "development" from list
5. **Push updated branch:**
   - Source Control panel → "..." → "Push"

**Command Line Method:**

```bash
# Switch to development branch
git checkout development

# Get latest changes
git pull origin development

# Switch back to your feature branch
git checkout afham/authentication

# Merge development into your branch
git merge development

# Push updated branch
git push origin afham/authentication
```

#### **When to Update Branches:**

- **Daily:** Start of work day
- **Before creating PR:** Ensure compatibility
- **After team member merges:** Get their changes
- **When conflicts arise:** Resolve with latest code

---

## � Understanding Local Merging and Pushing

### **What is Local Merging?**

**Local Merging** = Combining changes from one branch into another **on your computer**

#### **Example of Local Merge:**

```
Before merge (on your computer):
development: [Setup] → [Database] → [Auth API]
afham/auth:  [Setup] → [Login Form]

After local merge:
afham/auth:  [Setup] → [Database] → [Auth API] → [Login Form]
             ↑ Now has all development changes + your work
```

#### **Local Merge Process:**

**GitHub Desktop:**

1. **Switch to your branch** (afham/authentication)
2. **Branch menu → "Merge into current branch"**
3. **Select source branch** (development)
4. **Click "Merge development into afham/authentication"**
5. **Resolve conflicts if any**
6. **Merge happens locally** - still on your computer only!

**VS Code:**

1. **Ensure you're on target branch** (your feature branch)
2. **Ctrl+Shift+P → "Git: Merge Branch"**
3. **Select branch to merge** (development)
4. **VS Code merges locally**

**Command Line:**

```bash
# Switch to target branch
git checkout afham/authentication

# Merge source branch into current branch
git merge development
# This happens locally - GitHub doesn't know yet!
```

### **What is Pushing?**

**Pushing** = Uploading your local commits to GitHub (remote repository)

#### **Visual Explanation:**

```
Your Computer (Local)    →    GitHub (Remote)
┌─────────────────────┐  →  ┌─────────────────────┐
│ [Your commits here] │  →  │ [Commits uploaded]  │
│ [Only you can see]  │  →  │ [Team can see now]  │
└─────────────────────┘  →  └─────────────────────┘
```

#### **What Happens During Push:**

1. **Git uploads** your new commits to GitHub
2. **GitHub updates** the branch with your changes
3. **Team members** can now pull your changes
4. **Backup created** - your work is safe in cloud

#### **Push Examples:**

**Scenario 1 - Pushing New Commits:**

```bash
# You make changes
git add .
git commit -m "Add login validation"

# Push uploads the commit to GitHub
git push origin afham/authentication
```

**Scenario 2 - Pushing After Local Merge:**

```bash
# You merge development locally
git merge development

# Push uploads the merge result to GitHub
git push origin afham/authentication
```

#### **Push Methods:**

**GitHub Desktop:**

1. **Look for "Push origin" button** (top toolbar)
2. **Button shows number** of commits to upload
3. **Click "Push origin"**
4. **Progress bar** shows upload status

**VS Code:**

1. **Source Control panel** (Ctrl+Shift+G)
2. **Click "..." menu → "Push"**
3. **Or click ↑ arrow** in status bar

**Command Line:**

```bash
# Push current branch
git push origin branch-name

# Push and set tracking (first time)
git push -u origin branch-name
```

### **Complete Workflow Example:**

#### **Real Team Scenario:**

**Morning - Afham starts work:**

```bash
# 1. Get latest team changes
git checkout development
git pull origin development

# 2. Update feature branch with team changes
git checkout afham/authentication
git merge development         # Local merge
git push origin afham/authentication  # Push to backup

# 3. Start coding...
```

**During Day - Afham makes progress:**

```bash
# 4. Make changes
# Edit files in VS Code...

# 5. Save progress
git add .
git commit -m "Add password strength validation"
git push origin afham/authentication  # Push to share/backup
```

**End of Day - Desilva merges his work:**

```bash
# Desilva's incident management gets merged to development
# Now development has new changes
```

**Next Morning - Afham updates again:**

```bash
# 6. Get Desilva's changes
git checkout development
git pull origin development     # Get Desilva's work

# 7. Update feature branch again
git checkout afham/authentication
git merge development          # Local merge - get Desilva's changes
git push origin afham/authentication  # Push updated branch
```

### **Why This Workflow Matters:**

#### **Benefits of Local Merge + Push:**

1. **Test integration** locally before sharing
2. **Resolve conflicts** on your machine
3. **Keep work backed up** on GitHub
4. **Enable team collaboration** - others can see your progress
5. **Maintain clean history** - merge conflicts resolved locally

#### **Without Pushing:**

- Work exists only on your computer
- Team can't see your progress
- No backup if computer crashes
- Can't collaborate or get help
- Integration testing impossible

---

## �🔄 Pull Request Workflow

### **When to Create Pull Request:**

#### **Feature Complete:**

- Basic functionality working
- Code tested locally
- No obvious bugs
- Ready for team review

#### **Weekly Integration:**

- End of sprint/week
- Want feedback on approach
- Need help with implementation

### **Creating Pull Request:**

#### **Method 1: GitHub Desktop**

1. **Ensure latest changes pushed**
2. **Branch → Create Pull Request**
3. **GitHub opens in browser**
4. **Fill out PR template**

#### **Method 2: GitHub Website**

1. **Go to repository on GitHub**
2. **GitHub shows "Compare & pull request" banner**
3. **Click "Compare & pull request"**
4. **Fill out details**

#### **Method 3: After Push**

```bash
# After pushing your branch
git push origin afham/authentication

# GitHub will show pull request link in terminal
# Click the link or go to GitHub manually
```

### **Pull Request Template:**

```markdown
## 📋 Description

Brief summary of what this PR does

## ✨ Features Added

- [ ] User authentication system
- [ ] Login/logout functionality
- [ ] Password encryption
- [ ] JWT token management

## 🧪 Testing Done

- [ ] Tested login with valid credentials
- [ ] Tested login with invalid credentials
- [ ] Tested logout functionality
- [ ] Tested protected routes

## 📷 Screenshots (if UI changes)

[Add screenshots or GIFs showing the changes]

## 🔗 Related Issues

Closes #123
Fixes #456

## 📝 Additional Notes

- Database migration required
- Environment variables added
- Dependencies updated
```

### **Pull Request Review Process:**

#### **For Reviewers (Team Leader):**

1. **Read PR description**
2. **Check out branch locally** (optional)
3. **Review code changes**
4. **Test functionality**
5. **Provide feedback or approve**

#### **Review Checklist:**

```markdown
## Code Review Checklist

- [ ] Code follows project standards
- [ ] No console.log() statements left
- [ ] Error handling implemented
- [ ] Code is well-commented
- [ ] No hardcoded values
- [ ] Database queries optimized
- [ ] Security considerations addressed
- [ ] Tests pass locally
```

#### **Feedback Types:**

- **Approve:** Code is good, ready to merge
- **Request Changes:** Issues need fixing before merge
- **Comment:** Suggestions or questions

---

## 🔀 Merge Strategies

### **Merge Options:**

#### **1. Merge Commit (Default)**

```bash
# Creates merge commit preserving branch history
git merge afham/authentication
```

**Pros:** Preserves complete history
**Cons:** More complex history graph

#### **2. Squash and Merge**

```bash
# Combines all commits into single commit
git merge --squash afham/authentication
git commit -m "feat: Add complete authentication system"
```

**Pros:** Clean linear history
**Cons:** Loses individual commit details

#### **3. Rebase and Merge**

```bash
# Replays commits on top of target branch
git rebase development
git checkout development
git merge afham/authentication
```

**Pros:** Linear history, preserves commits
**Cons:** More complex process

### **Recommended Strategy for Your Project:**

**For Feature Branches → Development:**

- Use **Squash and Merge**
- Keeps development branch clean
- Each feature = one commit

**For Development → Main:**

- Use **Merge Commit**
- Preserves feature integration points
- Good for release tracking

### **Merge Process:**

#### **GitHub Web Interface:**

1. **Open approved pull request**
2. **Click "Merge pull request" dropdown**
3. **Select merge type**
4. **Edit commit message if needed**
5. **Click "Confirm merge"**
6. **Delete feature branch** (optional)

#### **Local Merge:**

```bash
# Switch to target branch
git checkout development

# Pull latest changes
git pull origin development

# Merge feature branch
git merge afham/authentication

# Push merged result
git push origin development
```

---

## ⚔️ Conflict Resolution

### **What are Merge Conflicts:**

Conflicts occur when:

- Two people edit same file, same lines
- One person deletes file, another edits it
- Structural changes overlap

### **Conflict Indicators:**

```javascript
<<<<<<< HEAD
// Your changes
const apiUrl = 'http://localhost:5000';
=======
// Incoming changes
const apiUrl = 'http://localhost:3001';
>>>>>>> feature-branch
```

### **Resolution Methods:**

#### **GitHub Desktop Resolution:**

1. **Conflict appears** during merge/pull
2. **Click "Open in Visual Studio Code"**
3. **VS Code shows conflict markers**
4. **Choose which code to keep:**
   - Click "Accept Current Change"
   - Click "Accept Incoming Change"
   - Click "Accept Both Changes"
   - Manually edit combination
5. **Save file**
6. **Return to GitHub Desktop**
7. **Click "Mark as resolved"**
8. **Commit the resolution**

#### **VS Code Resolution:**

1. **Conflicts show with highlights**
2. **Click resolution buttons** above conflict
3. **Or manually edit** the code
4. **Remove conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)
5. **Save file**
6. **Stage resolved file**
7. **Commit resolution**

#### **Command Line Resolution:**

```bash
# See conflicted files
git status

# Edit files manually to resolve conflicts
code conflicted-file.js

# Mark as resolved
git add conflicted-file.js

# Complete the merge
git commit -m "resolve: Merge conflict in API configuration"
```

### **Conflict Prevention:**

#### **Best Practices:**

1. **Pull frequently** - Stay updated with team changes
2. **Small commits** - Easier to merge
3. **Communicate** - Coordinate who works on what
4. **Feature branches** - Isolate different work
5. **Rebase before merge** - Clean up your branch first

#### **Team Coordination:**

```markdown
## File Ownership (Reduce Conflicts)

- afham/: Authentication files (controllers/auth.js, models/User.js)
- desilva/: Incident files (controllers/incidents.js, models/Incident.js)
- spencer/: Shift files (controllers/shifts.js, models/Shift.js)
- shared/: Common files (server.js, database.js) - coordinate changes
```

---

## 👥 Team Collaboration Guidelines

### **Daily Team Workflow:**

#### **Morning Standup (5 minutes):**

1. **What did you complete yesterday?**
2. **What will you work on today?**
3. **Any blockers or conflicts?**
4. **Any shared files you need to modify?**

#### **Communication Channels:**

- **WhatsApp/Discord:** Quick questions, daily updates
- **GitHub Issues:** Bug reports, feature requests
- **Pull Request Comments:** Code-specific discussions
- **Weekly Meetings:** Sprint planning, integration

### **Branch Coordination:**

#### **Team Leader Responsibilities (Afham):**

1. **Create and manage development branch**
2. **Review all pull requests**
3. **Resolve merge conflicts in shared files**
4. **Coordinate releases to main branch**
5. **Maintain project documentation**

#### **Team Member Responsibilities:**

1. **Work only in your feature branch**
2. **Pull latest changes daily**
3. **Create descriptive commits**
4. **Test before creating pull requests**
5. **Respond to review feedback**

### **File Modification Rules:**

#### **Shared Files (Coordinate Before Changing):**

- `backend/server.js` - Main server file
- `backend/config/database.js` - Database configuration
- `package.json` files - Dependencies
- Documentation files - Project guides

#### **Individual Files (Safe to Modify):**

- Your feature controllers
- Your feature models
- Your feature routes
- Your component files

### **Integration Schedule:**

#### **Daily Integration:**

- Push your changes to your feature branch
- Pull latest changes from development

#### **Weekly Integration:**

- Create pull request for completed features
- Team leader reviews and merges
- All team members update from development

---

## 🚨 Emergency Scenarios

### **Scenario 1: Accidentally Committed Wrong Files**

#### **Solution - Undo Last Commit (Keep Changes):**

```bash
# Undo commit but keep changes in working directory
git reset --soft HEAD~1

# Remove specific files from staging
git reset HEAD passwords.txt

# Create new commit without sensitive files
git add .
git commit -m "feat: Add authentication (fixed)"
```

#### **GitHub Desktop:**

1. **History tab**
2. **Right-click last commit**
3. **"Undo changes in master"**
4. **Re-stage correct files**
5. **Commit again**

### **Scenario 2: Accidentally Deleted Important Files**

#### **Recovery Options:**

**If Committed Previously:**

```bash
# See file in previous commits
git log --oneline

# Restore file from specific commit
git checkout 8c39a11 -- path/to/deleted/file.js
```

**If in Staging Area:**

```bash
# Restore staged file
git checkout HEAD -- filename.js
```

**GitHub Desktop:**

1. **History tab**
2. **Find commit with the file**
3. **Right-click file**
4. **"Restore in working directory"**

### **Scenario 3: Need to Switch Branches with Uncommitted Changes**

#### **Option 1 - Stash Changes:**

```bash
# Save current work temporarily
git stash push -m "Work in progress on login form"

# Switch branch
git checkout development

# Later, switch back and restore
git checkout afham/authentication
git stash pop
```

#### **Option 2 - Commit Work in Progress:**

```bash
# Commit incomplete work
git add .
git commit -m "WIP: Login form validation (incomplete)"

# Switch branch
git checkout development

# Later, continue work and amend commit
git checkout afham/authentication
# Make more changes
git add .
git commit --amend -m "feat: Complete login form with validation"
```

### **Scenario 4: Remote Repository is Ahead**

#### **Error Message:**

```
! [rejected] master -> master (fetch first)
error: failed to push some refs to 'origin'
```

#### **Solution:**

```bash
# Get latest changes
git pull origin master

# If conflicts, resolve them
# Then push again
git push origin master
```

### **Scenario 5: Wrong Branch Merged**

#### **If Just Merged Locally (Not Pushed):**

```bash
# Undo merge
git reset --hard HEAD~1
```

#### **If Already Pushed to GitHub:**

```bash
# Create revert commit
git revert -m 1 HEAD

# Or contact team leader for repository reset
```

### **Scenario 6: Lost Work After Hard Reset**

#### **Recovery Using Reflog:**

```bash
# See all recent actions
git reflog

# Find your lost commit
# 8c39a11 HEAD@{2}: commit: feat: Add authentication

# Restore to that point
git checkout 8c39a11

# Create new branch from recovered state
git checkout -b recovery/lost-authentication
```

---

## ✅ Best Practices

### **Commit Practices:**

#### **Commit Frequency:**

- **Daily minimum** - Don't lose work
- **After each logical change** - Fix one thing per commit
- **Before switching branches** - Clean working directory
- **End of coding session** - Save progress

#### **Commit Size:**

- **Small and focused** - One feature/fix per commit
- **Complete units** - Don't commit broken code
- **Testable changes** - Each commit should be testable

### **Branch Practices:**

#### **Branch Naming:**

```bash
# Good examples:
afham/authentication
desilva/incident-logging
spencer/shift-calendar
feature/user-dashboard
fix/login-validation
hotfix/security-patch

# Bad examples:
new-stuff
updates
branch1
afham-work
```

#### **Branch Lifecycle:**

1. **Create** from development
2. **Develop** feature completely
3. **Test** thoroughly
4. **Create** pull request
5. **Get** review and approval
6. **Merge** to development
7. **Delete** feature branch

### **Code Quality:**

#### **Before Committing:**

```bash
# Run tests
npm test

# Check linting
npm run lint

# Format code
npm run format

# Start server to verify
npm run dev
```

#### **Code Review Checklist:**

- [ ] **Functionality:** Does it work as intended?
- [ ] **Performance:** Any obvious performance issues?
- [ ] **Security:** No sensitive data exposed?
- [ ] **Standards:** Follows team coding conventions?
- [ ] **Documentation:** Complex code is commented?
- [ ] **Testing:** Changes are tested?

### **Documentation:**

#### **README Updates:**

- Update when adding new features
- Include setup instructions for new dependencies
- Document environment variables
- Explain how to run/test the project

#### **Code Documentation:**

```javascript
/**
 * Authenticates user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} User object with JWT token
 * @throws {Error} When credentials are invalid
 */
const authenticateUser = async (email, password) => {
  // Implementation here
};
```

### **Security Practices:**

#### **Never Commit:**

- Passwords or API keys
- `.env` files with real credentials
- Database connection strings
- Personal access tokens

#### **Environment Variables:**

```bash
# .env file (never commit this)
JWT_SECRET=super_secret_key_here
MONGODB_URI=mongodb://localhost:27017/emergency_dispatch
TWILIO_API_KEY=your_api_key_here

# .env.example (commit this as template)
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
TWILIO_API_KEY=your_twilio_api_key
```

### **Backup Strategies:**

#### **Multiple Backups:**

1. **Local commits** - On your computer
2. **GitHub repository** - Cloud backup
3. **Team member clones** - Distributed copies
4. **Regular releases** - Stable snapshots

#### **Recovery Planning:**

- Document critical configurations
- Keep dependencies list updated
- Maintain setup instructions
- Regular team synchronization

---

## 📖 Quick Reference Commands

### **Essential Git Commands:**

```bash
# Repository setup
git init
git remote add origin <url>
git clone <url>

# Daily workflow
git status
git add .
git add <file>
git commit -m "message"
git push origin <branch>
git pull origin <branch>

# Branch management
git branch                      # List branches
git checkout -b <branch>        # Create and switch
git checkout <branch>           # Switch branch
git merge <branch>             # Merge branch
git branch -d <branch>         # Delete branch

# History and information
git log --oneline              # Commit history
git diff                       # See changes
git reflog                     # Action history

# Emergency commands
git stash                      # Save work temporarily
git stash pop                  # Restore stashed work
git reset --soft HEAD~1        # Undo last commit
git checkout HEAD -- <file>    # Restore file
```

### **GitHub Desktop Shortcuts:**

```
Ctrl+Shift+A    - Show changes
Ctrl+Enter      - Commit
Ctrl+Shift+P    - Push
Ctrl+Shift+F    - Fetch
Ctrl+`          - Open repository in terminal
```

---

**🎉 You now have a complete Git workflow guide! Bookmark this document and refer to it whenever you need guidance on version control during your project development.**
