# 📱 How to Update Mobile App IP Address

## 🎯 The Issue

**Q: Why do I need to update the IP manually for the mobile app?**

**A:** The mobile app (React Native/Expo) is a **compiled app** that runs on your phone, not in a browser. The IP address is hardcoded into the app's configuration file during build/development.

### The Two-Part System:

1. **✅ Backend Server (Automatic)**

   - Already configured to accept connections from ANY device on your network
   - Uses regex patterns to match all common private IP ranges
   - No changes needed when you switch networks!

2. **⚠️ Mobile App (Manual)**
   - Needs to know **where to find** the backend server
   - Configuration file: `apps/mobile/src/constants/index.ts`
   - Must be updated when YOUR PC's IP changes

---

## 🔧 Two Ways to Update

### Method 1: Automatic Script (Recommended)

1. **Open PowerShell in project root**

   ```powershell
   cd D:\web-projects\emergency-dispatch-system
   ```

2. **Run the update script**

   ```powershell
   .\update-mobile-ip.ps1
   ```

3. **Follow the prompts**
   - Script will show your current IP addresses
   - Enter the IP from your WiFi/Ethernet adapter
   - Script updates the configuration automatically

### Method 2: Manual Edit

1. **Find your IP address**

   ```powershell
   ipconfig
   ```

   Look for "IPv4 Address" under your WiFi/Ethernet adapter
   Example: `192.168.1.103`

2. **Open the file**

   ```
   apps/mobile/src/constants/index.ts
   ```

3. **Update these two lines** (around line 16-17):

   ```typescript
   export const API_BASE_URL = "http://192.168.1.103:5000/api"; // ← Change IP here
   export const WEBSOCKET_URL = "http://192.168.1.103:5000"; // ← Change IP here
   ```

4. **Update the comment** (around line 14):

   ```typescript
   // CURRENT IP: 192.168.1.103 (Updated: October 9, 2025)  // ← Update for your reference
   ```

5. **Save the file**

---

## 📱 After Updating

1. **Restart the mobile app:**

   - Shake your device
   - Tap "Reload" or press `R` in the terminal

2. **Or restart Expo:**
   ```powershell
   cd apps/mobile
   # Press Ctrl+C to stop
   npm start
   ```

---

## 🌐 When to Update

You need to update the mobile app IP when:

✅ **Your PC's IP changes** (network change)

- Switching from WiFi to hotspot
- Connecting to a different WiFi network
- Your router assigns a new IP via DHCP

❌ **You DON'T need to update when:**

- Just restarting the app
- Only the backend server IP changes (if it's running on the same PC)
- Your phone changes IP (doesn't matter)

---

## 🔍 Finding the Right IP

### Windows:

```powershell
ipconfig
```

Look for:

```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.103  ← Use this one
```

### Ignore these:

- `127.0.0.1` (localhost)
- `169.254.x.x` (APIPA/self-assigned)
- `192.168.56.x` or `192.168.99.x` (VirtualBox/VMware)

### Use:

- `192.168.x.x` (WiFi/home network) ✅
- `172.16-31.x.x` (mobile hotspot) ✅
- `10.x.x.x` (enterprise network) ✅

---

## 🛠️ Troubleshooting

### ❌ "Network request failed" in mobile app

**Solution:**

1. Check if PC and phone are on **same network**
2. Verify backend server is **running** on your PC
3. Confirm mobile app has the **correct IP**
   ```typescript
   // Check this file:
   apps / mobile / src / constants / index.ts;
   ```
4. Try **restarting** both backend and mobile app

### ❌ "Connection refused"

**Check:**

```powershell
# Is backend running?
cd apps/backend
npm run dev

# You should see:
# Server running on http://0.0.0.0:5000
```

### ❌ "Still not connecting after update"

**Steps:**

1. **Verify IP is correct:**

   ```powershell
   ipconfig  # Check PC's IP
   ```

2. **Check mobile app config:**

   ```powershell
   Get-Content apps/mobile/src/constants/index.ts | Select-String "API_BASE_URL"
   ```

3. **Reload mobile app:**

   - Shake device → Reload
   - Or press `R` in terminal

4. **Check Windows Firewall:**
   - Allow Node.js through firewall for Private networks

---

## 📚 File Locations

| What                    | Where                                        |
| ----------------------- | -------------------------------------------- |
| **Mobile App Config**   | `apps/mobile/src/constants/index.ts`         |
| **Update Script**       | `update-mobile-ip.ps1` (project root)        |
| **Backend CORS Config** | `apps/backend/server.js` (already automatic) |
| **Backend .env**        | `apps/backend/.env` (already configured)     |

---

## 💡 Pro Tips

1. **Save common IPs**

   ```typescript
   // In apps/mobile/src/constants/index.ts
   // You can comment out old IPs for reference:

   // Home WiFi: 192.168.1.103
   // Coffee Shop Hotspot: 172.20.10.5
   // University: 10.15.20.50

   export const API_BASE_URL = "http://192.168.1.103:5000/api"; // Current
   ```

2. **Check IP quickly**

   ```powershell
   .\check-ip.ps1
   ```

3. **Update in one command**
   ```powershell
   .\update-mobile-ip.ps1
   ```

---

## 🎓 Example: Complete Workflow

```powershell
# 1. You switched to mobile hotspot
# 2. Check new IP
.\check-ip.ps1
# Output: 172.20.10.5

# 3. Update mobile app
.\update-mobile-ip.ps1
# Enter: 172.20.10.5

# 4. Restart mobile app
cd apps/mobile
# Press Ctrl+C, then:
npm start

# 5. On your phone: Shake → Reload

# ✅ Done! App now connects via hotspot
```

---

## 📖 Summary

| Component                | IP Configuration        | Auto/Manual             |
| ------------------------ | ----------------------- | ----------------------- |
| Backend Server (CORS)    | Accepts all private IPs | ✅ Automatic            |
| Backend Server (runs on) | Your PC's IP            | N/A (system assigned)   |
| Mobile App (connects to) | Hardcoded in config     | ⚠️ Manual update needed |

**Remember:** Only the mobile app config needs manual updates. The backend already accepts connections from any device on your network!

---

**File to edit:** `apps/mobile/src/constants/index.ts`  
**Quick update:** `.\update-mobile-ip.ps1`  
**Check IP:** `.\check-ip.ps1`

---

**Last Updated:** October 9, 2025  
**Your Current IP:** 192.168.1.103
