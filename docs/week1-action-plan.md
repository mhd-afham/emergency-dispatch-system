# Week 1 Action Plan - Team Leader Guide

## Day 1: Environment Setup & Repository Creation

### Your Tasks as Team Leader (Afham):

#### Morning (2-3 hours):

1. **Create GitHub Repository** ✅ **COMPLETED**

   - ✅ Created local Git repository
   - ✅ Initial project structure created
   - ⏳ Create remote GitHub repository (next step)
   - ⏳ Add team members as collaborators (waiting for team member email addresses)

2. **Install Development Environment** ✅ **COMPLETED**

   - ✅ Enabled PowerShell script execution
   - ✅ All dependencies installed (Node.js, Express, React, etc.)
   - ✅ Backend and frontend projects initialized

3. **Initialize Project Structure** ✅ **COMPLETED**
   - ✅ Created backend and frontend folders
   - ✅ Set up package.json files for both
   - ✅ Backend server running successfully on port 5000
   - ✅ React frontend ready for development

#### Afternoon (2-3 hours):

4. **Set Up Backend Foundation**

   - Initialize Express.js server
   - Set up MongoDB connection
   - Create basic folder structure
   - Install necessary packages

5. **Create Development Workflow**
   - Create branch protection rules
   - Set up development branch
   - Create your feature branch `afham/authentication`
   - Document workflow for team

### Team Member Tasks (Day 1):

- Install all required software
- Accept GitHub repository invitation
- Clone repository using GitHub Desktop
- Create their feature branches
- Review project documentation

---

## Day 2: Basic Server Setup & Authentication Foundation

### Your Tasks (Afham):

#### Backend Server Setup:

1. **Create Basic Express Server**

   ```javascript
   // backend/server.js
   const express = require("express");
   const mongoose = require("mongoose");
   const cors = require("cors");
   require("dotenv").config();

   const app = express();

   // Middleware
   app.use(cors());
   app.use(express.json());

   // Basic route
   app.get("/", (req, res) => {
     res.json({ message: "Emergency Dispatch System API" });
   });

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

2. **Database Connection**

   ```javascript
   // backend/config/database.js
   const mongoose = require("mongoose");

   const connectDB = async () => {
     try {
       const conn = await mongoose.connect(process.env.MONGODB_URI);
       console.log(`MongoDB Connected: ${conn.connection.host}`);
     } catch (error) {
       console.error(error);
       process.exit(1);
     }
   };

   module.exports = connectDB;
   ```

3. **User Model (Authentication Foundation)**

   ```javascript
   // backend/models/User.js
   const mongoose = require("mongoose");
   const bcrypt = require("bcryptjs");

   const userSchema = new mongoose.Schema(
     {
       email: {
         type: String,
         required: [true, "Email is required"],
         unique: true,
         lowercase: true,
       },
       password: {
         type: String,
         required: [true, "Password is required"],
         minlength: 6,
       },
       profile: {
         firstName: { type: String, required: true },
         lastName: { type: String, required: true },
         phone: String,
         role: {
           type: String,
           enum: [
             "Call Taker",
             "Dispatcher",
             "Field Crew",
             "Supervisor",
             "Admin",
           ],
           required: true,
         },
       },
       isActive: { type: Boolean, default: true },
     },
     {
       timestamps: true,
     }
   );

   // Hash password before saving
   userSchema.pre("save", async function (next) {
     if (!this.isModified("password")) return next();
     this.password = await bcrypt.hash(this.password, 12);
     next();
   });

   // Compare password method
   userSchema.methods.comparePassword = async function (candidatePassword) {
     return await bcrypt.compare(candidatePassword, this.password);
   };

   module.exports = mongoose.model("User", userSchema);
   ```

### Team Communication (Day 2):

- Share server setup progress
- Help team members with any installation issues
- Plan Day 3 tasks for each member

---

## Day 3: Authentication System & Frontend Setup

### Your Tasks (Afham):

#### Complete Authentication System:

1. **JWT Utilities**

   ```javascript
   // backend/utils/jwt.js
   const jwt = require("jsonwebtoken");

   const generateToken = (userId) => {
     return jwt.sign({ userId }, process.env.JWT_SECRET, {
       expiresIn: "7d",
     });
   };

   const verifyToken = (token) => {
     return jwt.verify(token, process.env.JWT_SECRET);
   };

   module.exports = { generateToken, verifyToken };
   ```

2. **Authentication Middleware**

   ```javascript
   // backend/middleware/auth.js
   const { verifyToken } = require("../utils/jwt");
   const User = require("../models/User");

   const authenticate = async (req, res, next) => {
     try {
       const token = req.header("Authorization")?.replace("Bearer ", "");

       if (!token) {
         return res
           .status(401)
           .json({ message: "Access denied. No token provided." });
       }

       const decoded = verifyToken(token);
       const user = await User.findById(decoded.userId).select("-password");

       if (!user) {
         return res.status(401).json({ message: "Invalid token." });
       }

       req.user = user;
       next();
     } catch (error) {
       res.status(401).json({ message: "Invalid token." });
     }
   };

   module.exports = { authenticate };
   ```

3. **Authentication Routes**

   ```javascript
   // backend/routes/auth.js
   const express = require("express");
   const User = require("../models/User");
   const { generateToken } = require("../utils/jwt");
   const { authenticate } = require("../middleware/auth");

   const router = express.Router();

   // Register user
   router.post("/register", async (req, res) => {
     try {
       const { email, password, firstName, lastName, role } = req.body;

       const existingUser = await User.findOne({ email });
       if (existingUser) {
         return res.status(400).json({ message: "User already exists" });
       }

       const user = new User({
         email,
         password,
         profile: { firstName, lastName, role },
       });

       await user.save();

       const token = generateToken(user._id);

       res.status(201).json({
         message: "User created successfully",
         token,
         user: {
           id: user._id,
           email: user.email,
           profile: user.profile,
         },
       });
     } catch (error) {
       res.status(400).json({ message: error.message });
     }
   });

   // Login user
   router.post("/login", async (req, res) => {
     try {
       const { email, password } = req.body;

       const user = await User.findOne({ email });
       if (!user || !(await user.comparePassword(password))) {
         return res.status(401).json({ message: "Invalid credentials" });
       }

       const token = generateToken(user._id);

       res.json({
         message: "Login successful",
         token,
         user: {
           id: user._id,
           email: user.email,
           profile: user.profile,
         },
       });
     } catch (error) {
       res.status(400).json({ message: error.message });
     }
   });

   // Get current user
   router.get("/me", authenticate, (req, res) => {
     res.json({ user: req.user });
   });

   module.exports = router;
   ```

#### Frontend Setup:

1. **Basic React Structure**

   ```bash
   cd frontend
   npm install axios react-router-dom
   ```

2. **Authentication Context**

   ```javascript
   // frontend/src/context/AuthContext.js
   import React, {
     createContext,
     useContext,
     useReducer,
     useEffect,
   } from "react";
   import axios from "axios";

   const AuthContext = createContext();

   const authReducer = (state, action) => {
     switch (action.type) {
       case "LOGIN_SUCCESS":
         return {
           ...state,
           isAuthenticated: true,
           user: action.payload.user,
           token: action.payload.token,
           loading: false,
         };
       case "LOGOUT":
         return {
           ...state,
           isAuthenticated: false,
           user: null,
           token: null,
           loading: false,
         };
       case "SET_LOADING":
         return { ...state, loading: action.payload };
       default:
         return state;
     }
   };

   export const AuthProvider = ({ children }) => {
     const [state, dispatch] = useReducer(authReducer, {
       isAuthenticated: false,
       user: null,
       token: localStorage.getItem("token"),
       loading: true,
     });

     useEffect(() => {
       const token = localStorage.getItem("token");
       if (token) {
         axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
         // Verify token with backend
         verifyToken();
       } else {
         dispatch({ type: "SET_LOADING", payload: false });
       }
     }, []);

     const verifyToken = async () => {
       try {
         const response = await axios.get("/api/auth/me");
         dispatch({
           type: "LOGIN_SUCCESS",
           payload: {
             user: response.data.user,
             token: localStorage.getItem("token"),
           },
         });
       } catch (error) {
         logout();
       }
     };

     const login = async (email, password) => {
       try {
         const response = await axios.post("/api/auth/login", {
           email,
           password,
         });
         const { token, user } = response.data;

         localStorage.setItem("token", token);
         axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

         dispatch({
           type: "LOGIN_SUCCESS",
           payload: { user, token },
         });

         return { success: true };
       } catch (error) {
         return {
           success: false,
           message: error.response?.data?.message || "Login failed",
         };
       }
     };

     const logout = () => {
       localStorage.removeItem("token");
       delete axios.defaults.headers.common["Authorization"];
       dispatch({ type: "LOGOUT" });
     };

     const value = {
       ...state,
       login,
       logout,
     };

     return (
       <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
     );
   };

   export const useAuth = () => {
     const context = useContext(AuthContext);
     if (!context) {
       throw new Error("useAuth must be used within an AuthProvider");
     }
     return context;
   };
   ```

### Team Member Tasks (Day 3):

- Set up their local backend environment
- Create basic models for their features
- Start planning their component structure

---

## Day 4-5: Individual Feature Development

### Your Continued Tasks (Afham):

#### Complete Authentication UI:

1. **Login Component**
2. **Protected Route Component**
3. **Dashboard Layout**
4. **Role-based Navigation**

#### Help Team Members:

- Review their model schemas
- Help with database connections
- Assist with authentication integration

### Team Member Focus:

- **De Silva:** Incident model and basic CRUD operations
- **Spencer:** Shift model and calendar interface planning
- **Nawanjana:** Vehicle/Crew registration models
- **Udayanga:** Equipment checklist models

---

## Day 6-7: Integration & Testing

### Integration Tasks:

1. **API Testing with Postman**
2. **Frontend-Backend Connection**
3. **Database Validation**
4. **Initial Feature Testing**

### Team Deliverables (End of Week 1):

- [ ] Working authentication system
- [ ] Database models for all features
- [ ] Basic API endpoints for each feature
- [ ] Frontend routing and layout
- [ ] Individual feature foundations

---

## Week 2 Preview:

### Days 8-10: Advanced Features

- Real-time updates with WebSocket
- Map integration for location features
- File upload for vehicle documents
- Mobile responsiveness

### Days 11-14: Integration & Polish

- Feature integration testing
- Performance optimization
- Bug fixes and refinements
- Documentation completion

---

## Success Metrics:

### End of Week 1:

- All team members can run the application locally
- Authentication system fully functional
- Each member has their basic features working
- Database integration complete

### End of Week 2:

- 80% of features integrated and working
- Real-time updates functional
- System ready for demonstration
- Code well-documented for viva preparation

---

## Daily Team Check-ins:

### What to Ask Each Member:

1. What did you complete today?
2. What are you working on tomorrow?
3. Any technical blockers?
4. Do you need help with anything?

### Your Leadership Responsibilities:

- Resolve technical conflicts
- Help with integration issues
- Ensure code quality standards
- Prepare for regular code reviews
- Coordinate sprint planning

---

**Ready to lead your team to success! Start with Day 1 tasks and let me know if you need specific code examples or guidance for any step.**
