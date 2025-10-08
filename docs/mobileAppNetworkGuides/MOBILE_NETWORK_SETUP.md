# 📱 Mobile App Network Configuration Guide

## 🎯 Purpose

This guide helps you connect your mobile app (Expo) to the backend server when switching between different networks (WiFi, hotspot, etc.).

## 🔧 Quick Setup

### **Option 1: Automatic (Recommended - Already Configured)**

The server is now configured to **automatically accept connections** from any device on common private networks:

- `192.168.x.x` (home/office WiFi)
- `172.16.x.x` to `172.31.x.x` (hotspot/mobile networks)
- `10.x.x.x` (enterprise networks)

**You don't need to do anything!** Just connect your phone and PC to the same network and it should work.

### **Option 2: Add Specific IPs (For Extra Security)**

If you want to limit access to specific IP addresses only:

1. **Find Your PC's IP Address:**

   ```powershell
   # Windows PowerShell
   ipconfig
   ```

   Look for "IPv4 Address" under your active network adapter (WiFi or Ethernet)

   Example output:

   ```
   Wireless LAN adapter Wi-Fi:
      IPv4 Address. . . . . . . . . . . : 192.168.1.105
   ```

2. **Update the `.env` file:**

   ```bash
   # In apps/backend/.env
   MOBILE_IPS=192.168.1.105,172.20.10.3
   ```

   - Add multiple IPs separated by commas (no spaces)
   - Add IPs for all networks you use (home WiFi, hotspot, office, etc.)

3. **Restart the backend server:**
   ```powershell
   # Stop the server (Ctrl+C) and run:
   npm run dev
   ```

## 📝 How to Add New IP Addresses

### When You Switch Networks:

**Method 1: Update MOBILE_IPS (If using specific IPs)**

1. Find your new IP address: `ipconfig`
2. Open `apps/backend/.env`
3. Add the new IP to the `MOBILE_IPS` list:

   ```bash
   # Before
   MOBILE_IPS=192.168.1.105

   # After (added new network IP)
   MOBILE_IPS=192.168.1.105,10.0.0.42
   ```

4. Restart the backend server

**Method 2: Use Automatic Mode (Default)**

- Just ensure your regex patterns cover your network range
- Already configured for 192.168.x.x, 172.16-31.x.x, and 10.x.x.x
- No changes needed!

## 🌐 Network Ranges Explained

The server automatically allows connections from these private IP ranges:

| Network Type              | IP Range                      | Common Use          |
| ------------------------- | ----------------------------- | ------------------- |
| `192.168.x.x`             | 192.168.0.0 - 192.168.255.255 | Home/Office WiFi    |
| `172.16.x.x - 172.31.x.x` | 172.16.0.0 - 172.31.255.255   | Mobile Hotspot      |
| `10.x.x.x`                | 10.0.0.0 - 10.255.255.255     | Enterprise Networks |

## 🚀 Testing Connection

### 1. **Start the Backend Server**

```powershell
cd apps/backend
npm run dev
```

You should see:

```
🌐 CORS Configuration:
   Allowed origins: X patterns
   📱 Mobile IPs: 192.168.1.105,172.20.10.3
```

### 2. **Update Mobile App Configuration**

Edit your Expo mobile app config to use your PC's IP:

```javascript
// In your mobile app API configuration
const API_URL = "http://192.168.1.105:5000/api"; // Replace with your PC's IP
```

### 3. **Test the Connection**

- Open the mobile app on your phone
- Try to login or make an API request
- Check the backend terminal for connection logs

## 🔍 Troubleshooting

### ❌ "Network request failed" Error

**Solution 1: Check if PC and Phone are on the same network**

```powershell
# Find your PC's IP
ipconfig

# Ping your PC from phone (if possible)
ping 192.168.1.105
```

**Solution 2: Check Windows Firewall**

```powershell
# Allow Node.js through firewall
# Go to: Windows Defender Firewall > Allow an app
# Find "Node.js" and enable for Private networks
```

**Solution 3: Restart Backend Server**

```powershell
# Stop server (Ctrl+C)
npm run dev
```

### ❌ "CORS Error" in Mobile App

**Check the backend logs:**

- If you see the request being blocked, add your current IP to `MOBILE_IPS`
- Restart the server after changing `.env`

### ❌ Connection Works on WiFi but Not on Hotspot

**This is normal!** Your IP changes when switching networks:

1. Find new IP: `ipconfig`
2. Add to `MOBILE_IPS` in `.env`
3. Or rely on automatic regex patterns (already configured)

## 📚 Common Network Scenarios

### **Scenario 1: Home WiFi (192.168.x.x)**

✅ **Already configured** - No action needed

### **Scenario 2: Mobile Hotspot (172.x.x.x)**

✅ **Already configured** - No action needed

### **Scenario 3: University/Office Network (10.x.x.x)**

✅ **Already configured** - No action needed

### **Scenario 4: Public WiFi**

⚠️ **Security Warning:** Avoid using public WiFi for development

- Use mobile hotspot instead
- Or use VPN

## 🎓 Example: Complete Workflow

1. **Morning at Home (WiFi: 192.168.1.105)**

   ```bash
   # Check your IP
   ipconfig
   # Output: 192.168.1.105

   # Already works! (covered by regex)
   # Mobile app connects successfully
   ```

2. **Afternoon at Coffee Shop (Use Hotspot: 172.20.10.3)**

   ```bash
   # Check your IP
   ipconfig
   # Output: 172.20.10.3

   # Already works! (covered by regex)
   # Mobile app connects successfully
   ```

3. **Evening at University (Network: 10.0.0.42)**

   ```bash
   # Check your IP
   ipconfig
   # Output: 10.0.0.42

   # Already works! (covered by regex)
   # Mobile app connects successfully
   ```

## 🔐 Security Notes

- The regex patterns only allow private IP ranges (not public IPs)
- All connections still require JWT authentication
- CORS only controls browser/app-level access
- Consider using HTTPS in production

## 📞 Need Help?

If you're still having connection issues:

1. Check that both devices are on the same network
2. Verify the IP address matches (ipconfig)
3. Ensure Windows Firewall allows Node.js
4. Check the backend server logs for CORS errors
5. Restart both the backend server and mobile app

---

**Last Updated:** October 9, 2025
**Version:** 2.0 (Dynamic Network Support)
