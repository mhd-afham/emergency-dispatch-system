# 🔄 Git Workflow Quick Reference

## 📊 Branch Structure

```
main (protected) ← development (protected) ← feature branches
     ↑                      ↑                      ↑
  Production            Integration            Daily Work
   (stable)              (testing)            (your code)
```

## 🎯 Daily Workflow Steps

### **Every Day Before Coding:**
1. Open GitHub Desktop
2. Make sure you're on YOUR branch
3. Click `Repository` → `Pull` (sync latest changes)
4. Start coding in your editor

### **When You've Made Changes:**
1. Save files in your editor
2. Check GitHub Desktop for changes
3. Review what files changed
4. Write descriptive commit message
5. Click `Commit to [your-branch]`
6. Click `Push origin`

### **When Feature is Complete:**
1. Make sure all changes are committed & pushed
2. In GitHub Desktop: `Repository` → `Create Pull Request`
3. Target: `development` branch (NOT main)
4. Fill in the PR template
5. Submit and notify team

---

## 🚨 Critical Rules

### ✅ **DO:**
- Work only on your assigned branch
- Pull before starting work each day
- Commit frequently with clear messages
- Target `development` for pull requests
- Test your code before submitting PR

### ❌ **DON'T:**
- Never push to `main` or `development` directly
- Don't work on others' branches without permission
- Don't commit broken/untested code
- Don't make PRs targeting `main` branch
- Don't forget to pull latest changes

---

## 📞 Emergency Contacts

**Repository Issues:** @mhd-afham  
**Team Chat:** [Your team group chat]  
**This Guide:** `docs/team-setup-guide.md`

---

## ⚡ GitHub Desktop Shortcuts

| Action | Shortcut |
|--------|----------|
| Pull changes | `Ctrl + Shift + P` |
| Show changes | `Ctrl + 1` |
| Show history | `Ctrl + 2` |
| Show branches | `Ctrl + B` |
| Create branch | `Ctrl + Shift + N` |

---

## 🔍 Troubleshooting

**Problem:** Can't see my branch  
**Solution:** Pull latest changes, check branch list

**Problem:** Changes not showing  
**Solution:** Save files, refresh GitHub Desktop

**Problem:** Can't push  
**Solution:** Check internet, verify login, ensure you're not pushing to protected branch

**Problem:** Merge conflicts  
**Solution:** Ask team lead (Afham) for help - don't try to resolve alone initially