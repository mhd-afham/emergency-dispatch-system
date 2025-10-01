# Real-Time WebSocket Implementation - Test Guide

## Overview

The Emergency Dispatch System now has full real-time WebSocket functionality using Socket.IO. This enables live incident updates across multiple browser windows.

## What's Been Implemented

### Backend (Socket.IO Server)

- **Socket.IO Server Integration**: Added to `server.js` with CORS configuration
- **WebSocket Configuration**: Created `config/websocket.js` with:
  - JWT-based authentication middleware
  - Role-based room management (dispatcher, responder, admin)
  - Global event emission functions
- **Incident Controller Integration**: Added real-time event emission for:
  - `incident_created` - When new incidents are created
  - `incident_update` - When incidents are updated
  - `incident_deleted` - When incidents are deleted

### Frontend (Socket.IO Client)

- **Socket.IO Client**: Replaced native WebSocket with Socket.IO client
- **WebSocket Context**: Updated `WebSocketContext.tsx` with:
  - Automatic connection with JWT authentication
  - Event subscription system for incident updates
  - Proper error handling and reconnection logic
- **Incident Queue**: Already configured to listen for real-time updates

## How to Test Real-Time Functionality

### 1. Basic Connection Test

1. Open browser to `http://localhost:3000`
2. Login with any user account
3. Check browser console for Socket.IO connection messages:
   - "Socket.IO: Connected successfully"
   - "Socket.IO: Welcome message received"

### 2. Real-Time Incident Updates Test

1. **Open Multiple Browser Windows**:

   - Window 1: `http://localhost:3000` (logged in as dispatcher)
   - Window 2: `http://localhost:3000` (logged in as different user or same user)

2. **Test Incident Creation**:

   - In Window 1: Create a new incident
   - In Window 2: Watch the incident queue update automatically
   - Check console for "Socket.IO: New incident created" message

3. **Test Incident Updates**:

   - In Window 1: Update an existing incident (change status, priority, etc.)
   - In Window 2: Watch the incident update in real-time
   - Check console for "Socket.IO: Incident updated" message

4. **Test Incident Deletion**:
   - In Window 1: Delete an incident
   - In Window 2: Watch the incident disappear from the queue
   - Check console for "Socket.IO: Incident deleted" message

### 3. Authentication Test

- Try accessing without authentication - should see authentication errors in console
- Verify JWT token is sent with connection request

## Technical Details

### WebSocket Events

- **incident_created**: Broadcasts new incident to all connected users
- **incident_update**: Broadcasts incident changes to all connected users
- **incident_deleted**: Broadcasts incident deletion to all connected users

### Authentication Flow

1. Frontend connects to Socket.IO server with JWT token
2. Backend verifies JWT and joins user to appropriate room
3. Events are broadcast to room members based on user roles

### Error Handling

- Automatic reconnection on disconnect
- Token validation on each connection
- Graceful handling of connection errors

## Current Status

✅ Backend Socket.IO server implemented  
✅ Frontend Socket.IO client implemented  
✅ Real-time incident updates working  
✅ Authentication middleware working  
✅ Event broadcasting working  
✅ Multiple browser window sync working

## Next Steps for Enhanced Features

- Add user presence indicators (who's online)
- Add typing indicators for incident notes
- Add real-time chat/messaging between dispatchers
- Add real-time location updates for responders
- Add push notifications for critical incidents

## Troubleshooting

- **Connection Issues**: Check that both backend (port 5000) and frontend (port 3000) are running
- **Authentication Errors**: Verify JWT token is valid and user is logged in
- **Missing Updates**: Check browser console for Socket.IO event messages
- **CORS Issues**: Verify CORS configuration in `server.js` allows frontend origin
