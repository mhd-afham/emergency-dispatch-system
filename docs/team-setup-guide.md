# 🚀 Emergency Dispatch System - Team Setup Guide

Welcome to the Emergency Dispatch System project! This guide will help you get started with your development environment.

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- ✅ **Completed software installation** (see `software-installation.md`)
- ✅ **GitHub account** (you should already have this)
- ✅ **Repository access** (you've been added as a collaborator)
- ✅ **All required software installed** (GitHub Desktop, VS Code, etc.)

**⚠️ If you haven't installed software yet, complete `software-installation.md` first.**

---

## 🔧 Step 1: Clone the Repository

### Using GitHub Desktop:

1. **Open GitHub Desktop**
2. **Sign in to your GitHub account** if not already signed in
3. **Clone repository:**
   - Click `File` → `Clone repository`
   - Go to `GitHub.com` tab
   - Find `mhd-afham/emergency-dispatch-system` in your repositories list
   - Choose a local folder (e.g., `D:\web-projects\` or `C:\Users\[YourName]\Projects\`)
   - Click **Clone**

4. **Verify the clone:**
   - GitHub Desktop should show the repository
   - You should see the main branch selected
   - Local files should be available in your chosen folder

---

## 🌿 Step 2: Find Your Feature Branch

Each team member has their own feature branch:

| Team Member | Branch Name | Module |
|-------------|-------------|---------|
| **Afham** | `afham/authentication` | User Authentication |
| **Chirath** | `chirath/incident-management` | Incident Management |
| **Julien** | `julien/shift-management` | Shift Management |
| **Inusha** | `inusha/vehicle-registration` | Vehicle Registration |
| **Lakshan** | `lakshan/equipment-management` | Equipment Management |

### Switch to Your Branch:

1. **In GitHub Desktop:**
   - Click on the current branch name (should show "main")
   - Find your assigned branch in the list
   - Click on **your branch name**
   - GitHub Desktop will switch to your branch

2. **Verify you're on the right branch:**
   - Branch name should appear in GitHub Desktop
   - Status should show "No local changes"

---

## 💻 Step 3: Set Up Your Development Environment

### 1. Open Your Code Editor
- Open your preferred code editor
- Open the project folder you cloned
- You should see the project structure:
  ```
  emergency-dispatch-system/
  ├── docs/
  ├── .github/
  └── [your files will go here]
  ```

### 2. Create Your Module Structure
Based on your assignment, create the appropriate folders and files for your module.

---

## 🔄 Step 4: Daily Development Workflow

### **Making Changes:**

1. **Always start by syncing:**
   - Open GitHub Desktop
   - Click `Repository` → `Pull` (or Ctrl+Shift+P)
   - This gets the latest updates from the remote repository

2. **Make your changes:**
   - Edit files in your code editor
   - Create new files as needed for your module
   - Test your code locally

3. **Review your changes:**
   - GitHub Desktop will show all modified files
   - Review each change to make sure it's correct
   - Only commit changes related to your module

### **Committing Changes:**

1. **Stage your changes:**
   - In GitHub Desktop, you'll see "Changes" tab
   - Review each file that's been modified
   - Uncheck any files you don't want to commit

2. **Write a good commit message:**
   ```
   Good examples:
   ✅ "feat: Add user login form with validation"
   ✅ "fix: Resolve authentication token expiry issue"
   ✅ "docs: Update authentication module documentation"
   
   Bad examples:
   ❌ "changes"
   ❌ "update"
   ❌ "stuff"
   ```

3. **Commit to your branch:**
   - Fill in commit summary (required)
   - Add description if needed (optional)
   - Click **Commit to [your-branch-name]**

4. **Push to GitHub:**
   - Click **Push origin** button
   - This uploads your changes to GitHub

---

## 🔀 Step 5: Creating Pull Requests

When your feature is ready to be merged:

### **Using GitHub Desktop:**

1. **Ensure all changes are committed and pushed**

2. **Create Pull Request:**
   - Click `Repository` → `Create Pull Request on GitHub`
   - This opens GitHub in your web browser
   - GitHub Desktop automatically fills in the branch information

3. **Fill in the PR template:**
   - **Title:** Clear description of what you built
   - **Description:** The template will guide you through what to include
   - **Base branch:** Should be `development` (NOT main)
   - **Compare branch:** Your feature branch

4. **Submit the PR:**
   - Click **Create Pull Request**
   - Your code will be reviewed before merging

---

## 🔄 Step 6: Keeping Your Branch Updated

**Important:** Your feature branch needs to stay current with main branch changes!

### **When to Sync:**
- **Every Monday morning** (weekly routine)
- **Before creating Pull Requests** 
- **When team lead announces main branch updates**

### **How to Sync:**
See the detailed guide: **`docs/branch-sync-guide.md`**

**Quick Summary:**
1. Switch to `main` branch in GitHub Desktop
2. Pull latest changes
3. Switch back to your feature branch  
4. `Repository` → `Merge into current branch` → Select `main`
5. Push your updated branch

---

## ⚠️ Important Rules & Guidelines

### **Branch Rules:**
- ✅ **Always work on your assigned feature branch**
- ✅ **Pull requests should target `development` branch**
- ❌ **Never push directly to `main` or `development`**
- ❌ **Don't work on other team members' branches**

### **Collaboration Guidelines:**
- 🔄 **Pull regularly** to get latest updates
- 💬 **Communicate** before making major changes
- 📝 **Write clear commit messages**
- 🧪 **Test your code** before creating PRs
- 👀 **Review others' PRs** when asked

### **File Organization:**
- Keep your module files organized in appropriate folders
- Follow the project's coding standards
- Don't modify files outside your assigned module without discussion

---

## 🆘 Getting Help

### **Common Issues:**

1. **"Can't see my branch"**
   - Make sure you've pulled latest changes
   - Check GitHub Desktop's branch list
   - Ask Afham if your branch is missing

2. **"Changes not showing in GitHub Desktop"**
   - Make sure you're in the right repository
   - Check if files are saved in your editor
   - Refresh GitHub Desktop (View → Refresh)

3. **"Can't push changes"**
   - Make sure you have internet connection
   - Verify you're signed in to GitHub Desktop
   - Check if branch protection rules are blocking (this is expected for main/development)

### **Need Help?**
- 📱 **Team group chat:** Ask questions there
- 👤 **Contact Afham:** For repository/access issues
- 📖 **Check documentation:** Review this guide and other docs
- 🔄 **Branch syncing:** See `docs/branch-sync-guide.md`

---

## 🎯 Quick Start Checklist

Copy this checklist and tick off each step:

- [ ] GitHub Desktop installed and signed in
- [ ] Repository cloned to local machine
- [ ] Switched to my assigned feature branch
- [ ] Code editor opened with project folder
- [ ] Created first test commit and pushed successfully
- [ ] Understand how to create pull requests
- [ ] Know how to pull latest changes daily
- [ ] Have team contact information for help

---

## 🚀 You're Ready!

Once you've completed this setup, you're ready to start developing your assigned module. Remember:

- **Work on your branch**
- **Commit regularly with good messages**  
- **Push your changes frequently**
- **Create PRs when features are complete**
- **Communicate with the team**

**Happy coding! 🎉**