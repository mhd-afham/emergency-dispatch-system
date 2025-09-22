# 💻 Software Installation Guide

**For:** Emergency Dispatch System Development Team  
**Purpose:** Essential software setup for MERN stack development

---

## 🔧 Required Software (Install in this order)

### **1. Node.js & npm**
- **Download:** https://nodejs.org/en/download/
- **Version:** LTS version (v20.x.x)
- **Installation:** Run installer with default settings
- **Verify:** Open Command Prompt and run:
  ```
  node --version
  npm --version
  ```
- **What it does:** Node.js runs JavaScript on server, npm manages packages

---

### **2. Git for Windows**
- **Download:** https://git-scm.com/download/win
- **Installation:** Use default settings, ensure "Git Bash Here" is selected
- **Verify:** In Command Prompt: `git --version`
- **What it does:** Version control system to track code changes

---

### **3. GitHub Desktop**
- **Download:** https://desktop.github.com/
- **Installation:** Run installer and sign in with your GitHub account
- **What it does:** Visual interface for Git operations (no commands needed)
- **Why we use it:** Beginner-friendly, visual branch management

---

### **4. Visual Studio Code**
- **Download:** https://code.visualstudio.com/Download
- **Installation:** Run installer, check "Add to PATH" option
- **Essential Extensions to Install:**
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
  - Auto Rename Tag
  - Bracket Pair Colorizer 2
  - Thunder Client (API testing)

---

### **5. MongoDB Community Server**
- **Download:** https://www.mongodb.com/try/download/community
- **Version:** Windows x64, Current release
- **Installation:**
  - Run installer
  - Choose "Complete" setup
  - Install MongoDB Compass (GUI tool)
  - Install as Windows Service
- **Verify:** MongoDB Compass should open after installation

---

### **6. Postman** (Optional but Recommended)
- **Download:** https://www.postman.com/downloads/
- **Installation:** Run installer
- **What it does:** Test API endpoints during development
- **Alternative:** Use Thunder Client extension in VS Code

---

## ✅ Installation Verification Checklist

After installing everything:

- [ ] `node --version` shows v20.x.x
- [ ] `npm --version` shows 10.x.x or higher
- [ ] `git --version` shows 2.x.x or higher
- [ ] GitHub Desktop opens and you can sign in
- [ ] VS Code opens with all extensions installed
- [ ] MongoDB Compass connects to localhost:27017
- [ ] Postman/Thunder Client ready for API testing

---

## 🚨 Common Installation Issues

### **Node.js PATH Issues**
**Problem:** `node --version` command not found  
**Solution:** Restart Command Prompt, or add Node.js to system PATH manually

### **Git Not Recognized**
**Problem:** `git --version` command not found  
**Solution:** Restart computer, or install Git with "Add Git to PATH" option

### **GitHub Desktop Login Issues**
**Problem:** Can't sign in to GitHub Desktop  
**Solution:** Check internet connection, verify GitHub credentials, try browser login first

### **VS Code Extensions Won't Install**
**Problem:** Extensions fail to install  
**Solution:** Check internet connection, restart VS Code, try installing one at a time

### **MongoDB Won't Start**
**Problem:** MongoDB Compass can't connect  
**Solution:** Ensure MongoDB service is running in Windows Services, restart computer if needed

---

## 👥 Next Steps After Installation

1. **Verify all software works** using the checklist above
2. **Join the GitHub repository** (wait for invitation from Afham)
3. **Follow team setup guide** (`team-setup-guide.md`) for repository setup
4. **Set up your development environment** for your assigned module

---

## 🆘 Getting Help

**For installation issues:**
- Ask in team group chat with screenshot of error
- Google the specific error message
- Contact team lead (Afham) if repository-related

**Installation should take 30-45 minutes total.**

---

**✅ Once everything is installed, you're ready for the team setup guide!**