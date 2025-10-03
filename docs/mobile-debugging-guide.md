# 📱 Mobile App Debugging Guide for VS Code

## 🎯 Overview

This guide shows you how to debug the React Native mobile app directly in VS Code with full error visibility, just like debugging the web app.

---

## 🛠️ Available Debugging Methods

### Method 1: VS Code Built-in Debugger (Recommended) 🔍

**Best for:** Setting breakpoints, inspecting variables, step-through debugging

**Setup:**

1. Make sure Metro bundler is running: `npm start` in `apps/mobile/`
2. Open VS Code Debug panel (Ctrl+Shift+D or Cmd+Shift+D)
3. Select configuration from dropdown:
   - **"Attach to Expo"** - Attach to running Expo app
   - **"Debug in Expo Go (iOS)"** - Launch iOS simulator
   - **"Debug in Expo Go (Android)"** - Launch Android emulator
   - **"Full Stack Debug"** - Debug backend + mobile together
4. Press F5 or click green play button

**Features:**

- ✅ Set breakpoints in TypeScript files
- ✅ Watch variables in real-time
- ✅ Call stack inspection
- ✅ Console output in Debug Console
- ✅ Hot reload works during debugging

---

### Method 2: Terminal with Enhanced Logging 📝

**Best for:** Quick error checking, deployment issues, network errors

**Run these commands from `apps/mobile/` directory:**

```powershell
# Standard start (current method)
npm start

# Clear cache and restart (when things break)
npm run start:clear

# Enable verbose logging
npx expo start --dev-client

# Use tunnel mode (for physical device on different network)
npm run start:tunnel
```

**Enhanced Error Visibility:**

- Errors show directly in terminal with full stack traces
- Metro bundler logs all bundling errors
- WebSocket connection errors visible
- API request/response errors logged

---

### Method 3: React DevTools (Advanced) 🔧

**Best for:** Component inspection, prop/state debugging, performance profiling

**Installation:**

```powershell
npm install -g react-devtools
```

**Usage:**

1. Run `react-devtools` in separate terminal
2. Start Expo app: `npm start`
3. Press `Shift + M` in terminal to open Dev Menu on device
4. Select "Toggle Element Inspector"

---

### Method 4: Expo Dev Tools (Browser-based) 🌐

**Best for:** Logs, device info, bundle progress

**Usage:**

1. Start app: `npm start`
2. Press `W` in terminal to open web interface
3. View logs, connected devices, bundle progress

---

## 🐛 Common Debugging Scenarios

### Scenario 1: App Won't Start / Metro Bundler Errors

**Check in Terminal:**

```powershell
cd apps/mobile
npm run start:clear
```

**Look for:**

- ❌ Module not found errors
- ❌ TypeScript compilation errors
- ❌ Package version conflicts
- ❌ Port conflicts (8081 already in use)

**Fix:**

```powershell
# Clear all caches
npx expo start --clear

# Reset Metro bundler
npx expo start --reset-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

### Scenario 2: Login/Authentication Errors

**Enable API Logging:**

Add this to `apps/mobile/src/services/apiClient.ts`:

```typescript
// Add interceptors for debugging
apiClient.interceptors.request.use((request) => {
  console.log("🔵 API Request:", {
    method: request.method,
    url: request.url,
    data: request.data,
    headers: request.headers,
  });
  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
```

**Check in VS Code Debug Console:**

- Look for API request/response logs
- Check if backend URL is correct
- Verify JWT token is being sent

---

### Scenario 3: WebSocket Connection Issues

**Enable WebSocket Logging:**

In `apps/mobile/src/services/websocketService.ts`, logging is already enabled:

```typescript
socket.on("connect", () => {
  console.log("✅ WebSocket connected");
});

socket.on("connect_error", (error) => {
  console.error("❌ WebSocket connection error:", error);
});
```

**Check:**

- Backend WebSocket server running (port 5000)
- Correct WebSocket URL in constants
- Device can reach backend server (same network)

---

### Scenario 4: Runtime Errors on Device

**Enable Error Boundaries:**

Already implemented in `App.tsx` with proper error handling.

**View Errors:**

1. **On Device:** Red error screen shows full stack trace
2. **In Terminal:** Errors logged with stack trace
3. **In VS Code:** Set breakpoint in error boundary's `componentDidCatch`

---

## 📊 VS Code Debug Configuration (Already Set Up)

**File:** `.vscode/launch.json`

```json
{
  "configurations": [
    {
      "name": "Attach to Expo",
      "type": "reactnative",
      "request": "attach",
      "cwd": "${workspaceFolder}/apps/mobile",
      "port": 19000
    },
    {
      "name": "Debug in Expo Go (iOS)",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios",
      "cwd": "${workspaceFolder}/apps/mobile"
    },
    {
      "name": "Full Stack Debug",
      "configurations": ["Backend Server", "Attach to Expo"]
    }
  ]
}
```

---

## 🔍 Step-by-Step: Debug a Login Error

### 1. Start Backend Server

```powershell
cd apps/backend
npm run dev
```

### 2. Start Mobile App with Logging

```powershell
cd apps/mobile
npm run start:clear
```

### 3. Open VS Code Debugger

- Press `Ctrl+Shift+D` (Windows) or `Cmd+Shift+D` (Mac)
- Select "Attach to Expo"
- Press F5

### 4. Set Breakpoints

- Open `apps/mobile/src/components/LoginScreen.tsx`
- Click left margin on line where login happens (e.g., line with `apiClient.post`)
- Breakpoint (red dot) appears

### 5. Trigger Login on Device

- Enter credentials on phone
- Press Login button
- VS Code will pause execution at breakpoint

### 6. Inspect Variables

- Hover over variables to see values
- Use Debug Console to run expressions
- Step through code with F10 (next) / F11 (step into)

### 7. Check Logs in Multiple Places

- **Terminal (Metro):** Bundling errors, console.logs
- **VS Code Debug Console:** Debugger output, errors
- **VS Code Output Panel:** React Native Packager logs
- **Device Screen:** Red error overlay with stack trace

---

## 📋 Debugging Checklist

Before reporting an issue, check:

- [ ] Terminal shows Metro bundler running without errors
- [ ] Backend server is running (port 5000)
- [ ] Device/simulator can reach backend (ping test)
- [ ] No red error overlay on device screen
- [ ] Check VS Code Debug Console for errors
- [ ] Check Terminal output for API errors
- [ ] Check browser Network tab for failed requests (if using Expo web)
- [ ] TypeScript compilation succeeds: `npm run type-check`

---

## 🚀 Quick Commands Reference

| Command                       | Purpose                      |
| ----------------------------- | ---------------------------- |
| `npm start`                   | Start Metro bundler          |
| `npm run start:clear`         | Start with cleared cache     |
| `npm run start:tunnel`        | Use tunnel for remote device |
| `npm run type-check`          | Check TypeScript errors      |
| `npx expo start --dev-client` | Verbose logging mode         |
| Press `R` in terminal         | Reload app                   |
| Press `D` in terminal         | Open dev menu                |
| Press `J` in terminal         | Open debugger                |
| Press `Shift+M` in terminal   | Toggle element inspector     |

---

## 🔗 Useful Resources

- [React Native Debugging Docs](https://reactnative.dev/docs/debugging)
- [Expo Debugging Guide](https://docs.expo.dev/debugging/tools/)
- [VS Code React Native Extension](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native)

---

## 💡 Pro Tips

1. **Always clear cache first** when encountering weird errors
2. **Use breakpoints instead of console.log** for complex debugging
3. **Check Network tab** in dev tools for API issues
4. **Enable verbose logging** during development
5. **Keep Metro bundler terminal visible** to catch early errors
6. **Use TypeScript checking** before testing: `npm run type-check`

---

_Last Updated: October 3, 2025_
_Status: Ready for debugging Sprint 1 mobile app_
