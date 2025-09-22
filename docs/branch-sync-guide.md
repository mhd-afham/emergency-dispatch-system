# 🔄 Feature Branch Synchronization Guide

## 📅 **When to Sync Your Branch with Main**

### **🚨 ALWAYS Sync When:**
- **Monday mornings** - Start of each work week
- **Before starting major new features** - Get latest foundation
- **Before creating Pull Requests** - Ensure compatibility
- **When team lead announces main branch updates** - Stay current
- **After critical bug fixes** are merged to main

### **⚡ Optional But Recommended:**
- **Mid-week check** - Wednesday sync if lots of team activity
- **Before weekend** - End week with clean state
- **After being away** - Catch up after breaks

---

## 🖥️ **How to Sync Using GitHub Desktop**

### **Method 1: Simple Merge (Recommended for beginners)**

#### **Step 1: Save and Commit Your Current Work**
1. Save all files in your editor
2. In GitHub Desktop, commit any pending changes
3. **Important:** Make sure you have no uncommitted changes

#### **Step 2: Switch to Main Branch**
1. Click on your current branch name (e.g., `chirath/incident-management`)
2. Select **`main`** from the branch list
3. GitHub Desktop will switch to main branch

#### **Step 3: Pull Latest Main Changes**
1. Click **`Repository`** → **`Pull`** (or Ctrl+Shift+P)
2. This downloads all new changes from the remote main branch
3. Wait for "Successfully pulled X commits" message

#### **Step 4: Switch Back to Your Feature Branch**
1. Click on **`main`** (current branch name)
2. Select **your feature branch** (e.g., `chirath/incident-management`)
3. You're back on your working branch

#### **Step 5: Merge Main into Your Branch**
1. Click **`Repository`** → **`Merge into current branch...`**
2. Select **`main`** as the branch to merge from
3. Click **`Merge main into [your-branch]`**
4. GitHub Desktop will merge the changes

#### **Step 6: Push the Updated Branch**
1. Click **`Push origin`** to upload the merged changes
2. Your branch now contains all main branch updates

---

### **Method 2: Rebase (Advanced - Use Only If Comfortable)**

**⚠️ Warning: Only use rebase if you understand Git well**

1. Switch to your feature branch
2. Open terminal in GitHub Desktop: `Repository` → `Open in Command Prompt`
3. Run: `git rebase main`
4. If conflicts occur, resolve them carefully
5. Push with: `git push --force-with-lease origin your-branch-name`

**For beginners: Stick with Method 1 (Merge)**

---

## 🔍 **Visual Example in GitHub Desktop**

### **What You'll See:**

**Before Sync:**
```
GitHub Desktop shows:
├── Your Branch: "2 commits ahead, 5 commits behind main"
└── Status: "Your branch is behind the remote"
```

**After Sync:**
```
GitHub Desktop shows:
├── Your Branch: "7 commits ahead of main"
└── Status: "Your branch is up to date"
```

---

## ⚠️ **Handling Merge Conflicts**

### **If You See "Merge Conflicts" Message:**

#### **Don't Panic! This is Normal:**
1. GitHub Desktop will show files with conflicts
2. Click on each conflicted file
3. You'll see sections like:
   ```
   <<<<<<< HEAD (your changes)
   your code here
   =======
   team member's code here
   >>>>>>> main (main branch changes)
   ```

#### **Resolve Conflicts:**
1. **Decide which code to keep:**
   - Keep yours: Delete the other person's code and conflict markers
   - Keep theirs: Delete your code and conflict markers  
   - Keep both: Combine both solutions and remove markers

2. **Remove conflict markers:**
   - Delete `<<<<<<< HEAD`
   - Delete `=======`
   - Delete `>>>>>>> main`

3. **Test the merged code** to ensure it works

4. **Mark as resolved:**
   - Save the file
   - In GitHub Desktop, the file will show as "resolved"
   - Click "Commit merge"

### **If Conflicts Are Complex:**
- **Ask for help** in team chat
- **Contact the author** of the conflicting code
- **Don't guess** - get clarification on intended behavior

---

## 📋 **Weekly Sync Checklist**

### **Every Monday Morning:**
- [ ] Open GitHub Desktop
- [ ] Switch to main branch
- [ ] Pull latest changes (`Repository` → `Pull`)
- [ ] Switch back to my feature branch
- [ ] Merge main into my branch (`Repository` → `Merge into current branch`)
- [ ] Resolve any conflicts if they appear
- [ ] Push updated branch (`Push origin`)
- [ ] Verify in GitHub Desktop that branch shows "up to date"

### **Before Creating PR:**
- [ ] Follow the same sync steps above
- [ ] Test that my feature still works after merge
- [ ] Commit any fixes needed after sync
- [ ] Then create the Pull Request

---

## 🚨 **Important Reminders**

### **✅ DO:**
- Sync regularly (weekly minimum)
- Commit your work before syncing
- Test your code after syncing
- Ask for help with complex conflicts
- Push the merged branch to GitHub

### **❌ DON'T:**
- Sync in the middle of unfinished work
- Ignore conflict markers in your code
- Force push without understanding why
- Skip testing after merging
- Panic if you see conflicts (they're normal!)

---

## 🆘 **Common Issues & Solutions**

### **"Cannot merge - you have uncommitted changes"**
**Solution:** Commit or stash your current work first

### **"Your branch has diverged from main"**
**Solution:** This is normal after merging - just push your branch

### **"Merge conflicts in multiple files"**
**Solution:** Resolve one file at a time, don't rush

### **"I messed up the merge"**
**Solution:** Don't panic! Ask team lead for help - Git keeps history

---

## 📞 **Getting Help**

### **For Sync Issues:**
1. **Screenshot the error** in GitHub Desktop
2. **Ask in team chat** with screenshot
3. **Don't continue** if you're unsure
4. **Contact Afham** for repository-level issues

### **For Merge Conflicts:**
1. **Identify the conflicted files**
2. **Contact the author** of the conflicting code
3. **Discuss the intended solution** before resolving
4. **Test thoroughly** after resolution

---

**Remember: Regular syncing prevents big conflicts later! 🔄**