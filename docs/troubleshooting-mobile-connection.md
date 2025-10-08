# Troubleshooting Mobile App Connection Issues

## Issue: Mobile app shows timeout errors when trying to login

### Root Cause

The mobile app was configured to connect to IP address `192.168.1.101`, but your computer's actual IP addresses are different:

- `192.168.56.1` (VirtualBox/VMware host-only adapter)
- `172.20.10.3` (WiFi/Mobile Hotspot network)

### Solution Applied

#### 1. Updated Mobile App Configuration

**File:** `apps/mobile/src/constants/index.ts`

Changed from:

```typescript
export const API_BASE_URL = "http://192.168.1.101:5000/api";
export const WEBSOCKET_URL = "http://192.168.1.101:5000";
```

To:

```typescript
export const API_BASE_URL = "http://172.20.10.3:5000/api";
export const WEBSOCKET_URL = "http://172.20.10.3:5000";
```

#### 2. Updated Backend CORS Configuration

**File:** `apps/backend/server.js`

Added support for multiple network interfaces:

- `192.168.x.x` (Original local network)
- `172.20.x.x` (WiFi/Hotspot network)

### Steps to Fix

1. **Stop the mobile app** if it's currently running
2. **Restart the backend server** to apply CORS changes:
   ```bash
   cd apps/backend
   npm run dev
   ```
3. **Restart the mobile app**:
   ```bash
   cd apps/mobile
   npm run start
   # or
   npm run start:tunnel
   ```
4. **Clear the app cache** on your mobile device (if needed)

### Verification

Test backend accessibility:

```bash
# Should return 200 OK with JSON response
curl http://172.20.10.3:5000/
```

### If Connection Still Fails

1. **Check your current IP address:**

   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. **Make sure your mobile device is on the SAME network as your computer**

   - Both should be connected to the same WiFi
   - OR use mobile hotspot from your phone and connect your computer to it

3. **Update IP address in mobile app:**

   - Edit `apps/mobile/src/constants/index.ts`
   - Change `API_BASE_URL` and `WEBSOCKET_URL` to match your current IP
   - Restart the mobile app

4. **Check Windows Firewall:**

   - Allow Node.js through Windows Firewall
   - Allow port 5000 for both private and public networks

5. **Alternative: Use Expo Tunnel (slower but works across networks)**
   ```bash
   cd apps/mobile
   npm run start:tunnel
   ```

### Network Debugging Commands

```bash
# Check if backend is running on port 5000
netstat -ano | findstr :5000

# Test localhost connection
curl http://localhost:5000/

# Test network IP connection
curl http://172.20.10.3:5000/

# Get all network adapters and IPs
ipconfig /all
```

### Common Errors and Solutions

| Error                         | Cause                                     | Solution                       |
| ----------------------------- | ----------------------------------------- | ------------------------------ |
| `timeout of 10000ms exceeded` | Wrong IP address or server not accessible | Update IP in mobile app config |
| `Network Error`               | No network connectivity                   | Check WiFi/Hotspot connection  |
| `CORS Error`                  | Backend not allowing origin               | Update CORS in server.js       |
| `ECONNREFUSED`                | Backend not running                       | Start backend server           |

### Registration Status Impact

**NOTE:** The login failures are **NOT related** to the registration status changes we made. The registration status feature:

- Does NOT block existing users from logging in
- Only affects new crew/vehicle registrations (they start as "pending")
- Seeded data is auto-approved and fully functional

All seeded crew members (including Suresh Mendis) have `registrationStatus: "approved"` and can log in normally once the network connection is fixed.
