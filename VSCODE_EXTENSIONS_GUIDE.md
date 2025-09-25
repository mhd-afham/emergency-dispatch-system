# 🔌 Essential VS Code Extensions for Emergency Dispatch System

**Required Extensions for Cross-Platform Development**  
*Updated: September 25, 2025*

---

## 🎯 **Extension Installation Guide**

### **📋 Required Extensions List:**

```vscode-extensions
msjsdiag.vscode-react-native,dsznajder.es7-react-js-snippets,expo.vscode-expo-tools,dbaeumer.vscode-eslint,esbenp.prettier-vscode,diemasmichiels.emulate
```

---

## 📱 **Extension Details & Purposes**

### **1. React Native Tools (`msjsdiag.vscode-react-native`)**
**Purpose**: Primary React Native development support
- **Debugging**: Debug React Native apps directly in VS Code
- **IntelliSense**: Auto-completion for React Native APIs and components
- **Commands**: Integrated commands for running iOS/Android simulators
- **LogCat**: Android log viewing within VS Code
- **Metro Integration**: JavaScript bundler integration

**Why Essential**: Core functionality for mobile app development

### **2. ES7+ React Snippets (`dsznajder.es7-react-js-snippets`)**  
**Purpose**: Productivity enhancement through code snippets
- **Component Generation**: 
  - `rafce` → React Arrow Function Component Export
  - `rfc` → React Function Component
  - `useState` → useState hook setup
- **Consistent Patterns**: Standardized component structures
- **Speed Boost**: Reduces repetitive typing for common patterns

**Why Essential**: Dramatically improves development speed for React/React Native

### **3. Expo Tools (`expo.vscode-expo-tools`)**
**Purpose**: Enhanced Expo development experience
- **Expo IntelliSense**: Auto-completion for Expo SDK APIs
- **Config Previews**: Preview app.json and eas.json configurations
- **Build Integration**: EAS (Expo Application Services) integration
- **Debug Support**: Enhanced debugging for Expo projects

**Why Essential**: Specialized tooling for our Expo-based mobile app

### **4. ESLint (`dbaeumer.vscode-eslint`)**
**Purpose**: Code quality and consistency enforcement
- **Real-time Linting**: Immediate error and warning detection
- **Style Enforcement**: Consistent coding standards across team
- **Auto-fix**: Automatic correction of common issues
- **Custom Rules**: Project-specific linting rules
- **Integration**: Works with Prettier for complete code formatting

**Why Essential**: Maintains code quality across monorepo

### **5. Prettier (`esbenp.prettier-vscode`)**
**Purpose**: Automatic code formatting
- **Format on Save**: Consistent code style automatically applied
- **Multi-language**: Formats TypeScript, JavaScript, JSON, CSS, Markdown
- **Team Consistency**: Same formatting rules across all developers
- **Integration**: Works seamlessly with ESLint
- **Configuration**: Respects project .prettierrc settings

**Why Essential**: Ensures consistent code style across all platforms

### **6. Android iOS Emulator (`diemasmichiels.emulate`)**
**Purpose**: Device emulator management
- **Quick Access**: Launch Android/iOS emulators from VS Code
- **Device Management**: Manage multiple virtual devices
- **Testing Workflow**: Streamlined mobile app testing
- **Integration**: Works with React Native Tools extension
- **Device Switching**: Easy switching between different device configurations

**Why Essential**: Simplifies mobile app testing workflow

---

## 🚀 **Installation Instructions**

### **Method 1: VS Code Extensions Panel**
1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows) or `Cmd+Shift+X` (Mac)
3. Search for each extension by name or ID
4. Click "Install" for each extension

### **Method 2: Command Line Installation**
```bash
# Install all extensions at once
code --install-extension msjsdiag.vscode-react-native
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension expo.vscode-expo-tools
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension diemasmichiels.emulate
```

### **Method 3: Extensions Quick Install**
Copy this line and paste in VS Code Extensions search:
```
@id:msjsdiag.vscode-react-native @id:dsznajder.es7-react-js-snippets @id:expo.vscode-expo-tools @id:dbaeumer.vscode-eslint @id:esbenp.prettier-vscode @id:diemasmichiels.emulate
```

---

## 🔧 **Extension Configuration**

### **1. React Native Tools Configuration**
Create `.vscode/settings.json` in project root:
```json
{
  "react-native-tools.projectRoot": "./apps/mobile",
  "react-native-tools.showUserTips": false,
  "react-native.packager.port": 8081
}
```

### **2. ESLint Configuration**
Already configured in project:
- Root: `.eslintrc.js` (workspace-wide rules)
- Web: `apps/web/.eslintrc.js` (React-specific rules)
- Mobile: Uses Expo's built-in ESLint configuration

### **3. Prettier Configuration**
Create `.prettierrc` in project root:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### **4. Android Emulator Setup**
For `diemasmichiels.emulate` extension:
1. Install Android Studio
2. Create Android Virtual Devices (AVD)
3. Extension will auto-detect available emulators
4. Configure in VS Code settings:
```json
{
  "emulate.android": "/path/to/android-studio/emulator",
  "emulate.ios": "xcrun simctl"
}
```

---

## ⚡ **Development Workflow Integration**

### **🔄 Typical Development Session:**

1. **Open Project**: VS Code opens with all extensions loaded
2. **Start Backend**: Terminal → `npm run server`
3. **Start Web**: Terminal → `npm run client`  
4. **Start Mobile**: Terminal → `npm run mobile`
5. **Launch Emulator**: Use Android iOS Emulator extension
6. **Code with IntelliSense**: React Native Tools + ES7 Snippets
7. **Auto-format**: Prettier formats code on save
8. **Quality Check**: ESLint shows errors/warnings
9. **Debug**: React Native Tools debugger

### **🎯 Key Keyboard Shortcuts:**
- `Ctrl+Shift+P` → Command palette
- `rafce` → Create React component
- `Ctrl+S` → Save + auto-format (Prettier)
- `F5` → Start React Native debugging
- `Ctrl+`` → Toggle terminal

---

## 🔍 **Extension Synergy**

### **🤝 How Extensions Work Together:**

**React Native Tools + Expo Tools**:
- React Native Tools handles core RN functionality
- Expo Tools adds Expo-specific features
- Together provide complete mobile development environment

**ESLint + Prettier**:
- ESLint catches code quality issues
- Prettier handles formatting automatically
- Both work together for complete code quality

**ES7 Snippets + All Extensions**:
- Snippets generate code templates
- Other extensions provide IntelliSense and validation
- Results in rapid, high-quality code development

**Android iOS Emulator + React Native Tools**:
- Emulator extension manages device launching
- React Native Tools handles debugging and development
- Seamless mobile testing workflow

---

## 🚨 **Troubleshooting Extension Issues**

### **Common Problems & Solutions:**

#### **React Native Tools Not Working:**
```bash
# Solution 1: Reload window
Ctrl+Shift+P → "Developer: Reload Window"

# Solution 2: Reset React Native cache
cd apps/mobile && npx react-native start --reset-cache
```

#### **ESLint Not Linting:**
```bash
# Check ESLint output panel
View → Output → Select "ESLint" from dropdown

# Restart ESLint server
Ctrl+Shift+P → "ESLint: Restart ESLint Server"
```

#### **Prettier Not Formatting:**
```json
// In VS Code settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

#### **Expo Tools Not Recognizing Project:**
```bash
# Ensure you're in mobile directory
cd apps/mobile

# Check app.json exists and is valid JSON
# Restart VS Code if needed
```

---

## 📊 **Extension Performance Impact**

### **📈 Resource Usage:**
- **React Native Tools**: Moderate (adds debugging capabilities)
- **ES7 Snippets**: Minimal (just code snippets)
- **Expo Tools**: Low (lightweight Expo integration)
- **ESLint**: Moderate (runs linting in background)
- **Prettier**: Minimal (only active during formatting)
- **Android Emulator**: Minimal (just UI integration)

### **⚡ Performance Tips:**
- Disable extensions in non-React projects
- Use workspace-specific extension recommendations
- Close unused terminal sessions
- Restart VS Code if experiencing slowdowns

---

## 🎯 **Advanced Extension Features**

### **React Native Debugging:**
1. Set breakpoints in TypeScript/JavaScript
2. Press F5 or use Debug panel
3. Choose "Debug Android" or "Debug iOS"
4. Full debugging experience in VS Code

### **Expo Development:**
1. IntelliSense for Expo SDK APIs
2. Preview app configuration changes
3. EAS build integration
4. Expo developer tools integration

### **Code Quality Automation:**
1. Auto-fix ESLint errors on save
2. Format code with Prettier automatically
3. Real-time error highlighting
4. Consistent code style enforcement

---

## 🔄 **Extension Updates & Maintenance**

### **📅 Regular Maintenance:**
- **Monthly**: Check for extension updates
- **Project Changes**: Update configurations as needed
- **Team Sync**: Ensure all developers have same extensions
- **Performance Review**: Disable unused extensions

### **🔍 Update Monitoring:**
```bash
# Check installed extensions
code --list-extensions

# Check for updates in VS Code
Ctrl+Shift+P → "Extensions: Show Outdated Extensions"
```

---

## 🎉 **Summary**

These 6 essential extensions provide:
- **Complete Mobile Development**: React Native + Expo support
- **Code Quality**: ESLint + Prettier integration
- **Developer Productivity**: Snippets + IntelliSense
- **Testing Workflow**: Emulator management
- **Professional Development**: Industry-standard tooling

With these extensions installed and configured, you have a **professional-grade development environment** for cross-platform emergency dispatch system development.

---

**Extension Guide Version**: 1.0.0  
**VS Code Compatibility**: 1.80+  
**Last Verified**: September 25, 2025  
**Total Extensions**: 6 Essential + Recommended Additional