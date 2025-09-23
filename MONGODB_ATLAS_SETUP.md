# 🌐 MongoDB Atlas Setup for Team Members

## 🎯 Quick Setup Guide

### 1. Get the Connection String

Ask Afham (project admin) for the MongoDB Atlas connection string.

### 2. Update Your .env File

In `backend/.env`, replace the MONGODB_URI with:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/emergency_dispatch?retryWrites=true&w=majority
```

### 3. Test Your Connection

Run this command in the backend folder:

```bash
cd backend
node test-atlas.js
```

### 4. If You Get Errors:

**"Authentication failed"**

- Check username/password in connection string
- Contact Afham to verify your database user exists

**"ENOTFOUND" or network errors**

- Check your internet connection
- Contact Afham to whitelist your IP address
- Get your IP from: https://whatismyipaddress.com/

**"MONGODB_URI not found"**

- Make sure you have a `.env` file in the `backend` folder
- Copy `.env.example` to `.env` if needed

## 🔧 Development Workflow

### Option A: Shared Database User (Recommended for development)

- Everyone uses the same connection string
- Easier to manage, good for development phase

### Option B: Individual Database Users

- Each team member has their own database user
- More secure, better for production-like setup

## 📞 Support

If you have issues, contact:

- **Afham** - Database admin and authentication system lead
- Share error messages from `node test-atlas.js`

## 🚀 Ready to Code!

Once your test passes, you can run:

```bash
# From root directory
npm run dev

# Or just backend
npm run server
```
