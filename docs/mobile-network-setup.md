# 📱 Mobile App Network Configuration

## ✅ Problem Solved!

**Issue:** Mobile app couldn't connect to backend because it was using `localhost:5000`  
**Solution:** Updated to use computer's local IP address: `192.168.1.101:5000`

---

## 🔧 Changes Made

### 1. Mobile App API Configuration

**File:** `apps/mobile/src/constants/index.ts`

```typescript
// OLD (doesn't work on physical device):
export const API_BASE_URL = "http://localhost:5000/api";
export const WEBSOCKET_URL = "http://localhost:5000";

// NEW (works on same Wi-Fi network):
export const API_BASE_URL = "http://192.168.1.101:5000/api";
export const WEBSOCKET_URL = "http://192.168.1.101:5000";
```

### 2. Backend CORS Configuration

**File:** `apps/backend/server.js`

Added mobile device origins to CORS:

```javascript
cors({
  origin: [
    "http://localhost:3000", // Web app
    "http://192.168.1.101:8081", // Expo Dev Server
    /^http:\/\/192\.168\.1\.\d+:8081$/, // Any device on network (Expo)
    /^http:\/\/192\.168\.1\.\d+:19000$/, // Expo Metro bundler
  ],
  // ...
});
```

---

## 📱 How It Works

### Localhost vs Local IP

**localhost** = The device itself

- On computer: localhost = your computer
- On phone: localhost = your phone ❌

**Local IP (192.168.1.101)** = Your computer on the network

- On computer: 192.168.1.101 = your computer ✅
- On phone: 192.168.1.101 = your computer ✅

### Network Requirements

Both devices must be on **same Wi-Fi network**:

- Computer: Connected to Wi-Fi (192.168.1.101)
- iPhone: Connected to same Wi-Fi network

---

## 🔍 Find Your Computer's IP Address

### Windows (PowerShell):

```powershell
ipconfig
# Look for "IPv4 Address" under Wi-Fi adapter
```

### Mac/Linux (Terminal):

```bash
ifconfig | grep "inet "
# or
ip addr show
```

### Expo Metro Bundler:

When you run `npm start`, Metro shows your IP:

```
Metro waiting on exp://192.168.1.101:8081
                      ^^^^^^^^^^^^^^^^
                      This is your IP!
```

---

## ⚙️ Update IP Address (If Your IP Changes)

If your computer's IP changes, update these files:

### 1. Mobile App Constants

**File:** `apps/mobile/src/constants/index.ts`

```typescript
export const API_BASE_URL = "http://YOUR_NEW_IP:5000/api";
export const WEBSOCKET_URL = "http://YOUR_NEW_IP:5000";
```

### 2. Backend Server (Optional - if you hardcoded)

**File:** `apps/backend/server.js`

```javascript
// Update the console.log output:
console.log(`📱 Network URL: http://YOUR_NEW_IP:${PORT}`);
```

---

## 🧪 Test Connection

### 1. Start Backend Server

```powershell
cd apps/backend
npm run dev
```

**Look for:**

```
✅ Server running on port 5000
📱 Network URL: http://192.168.1.101:5000
✅ CORS enabled for mobile devices
```

### 2. Start Mobile App

```powershell
cd apps/mobile
npm start
```

**Look for:**

```
Metro waiting on exp://192.168.1.101:8081
```

### 3. Try Login on iPhone

Open app and login with:

- Email: `nuwan.silva@respondr.lk`
- Password: `crew12345`

**Check Metro Terminal for:**

```
🔵 API Request: { method: 'POST', url: '/auth/login', fullURL: 'http://192.168.1.101:5000/api/auth/login' }
✅ API Response: { status: 200, data: {...} }
```

---

## 🚨 Troubleshooting

### Error: "Network Error"

**Cause:** Phone can't reach computer  
**Fix:**

1. Verify both on same Wi-Fi network
2. Check computer firewall allows port 5000
3. Verify IP address is correct: `ipconfig`
4. Restart backend server

### Error: "CORS Error"

**Cause:** Backend not allowing mobile device origin  
**Fix:** Already fixed in `apps/backend/server.js` CORS config

### Error: "Connection Refused"

**Cause:** Backend server not running  
**Fix:** Start backend: `cd apps/backend && npm run dev`

### Error: "Timeout"

**Cause:** Firewall blocking connection  
**Fix:**

```powershell
# Windows: Allow Node through firewall
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=5000
```

---

## 💡 Pro Tips

1. **Use Static IP:** Set a static IP in your router for consistent development
2. **Firewall:** Add exception for Node.js on port 5000
3. **Testing:** Use `curl` to test API from phone:
   ```bash
   curl http://192.168.1.101:5000/api/health
   ```
4. **Metro Logs:** Always watch Metro terminal for API request/response logs
5. **Backend Logs:** Watch backend terminal for incoming requests

---

## 🔗 Related Files

- `apps/mobile/src/constants/index.ts` - API URLs
- `apps/backend/server.js` - CORS configuration
- `apps/mobile/src/services/apiClient.ts` - HTTP client with logging
- `apps/mobile/src/services/websocketService.ts` - WebSocket client

---

_Last Updated: October 3, 2025_
_Status: Network connectivity configured and tested ✅_
