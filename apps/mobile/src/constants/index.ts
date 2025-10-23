// Local constants for mobile app

// ========================================
// 📱 MOBILE APP API CONFIGURATION
// ========================================
// ⚠️ IMPORTANT: Update this IP when you change networks!
//
// HOW TO FIND YOUR IP:
// 1. Open terminal/PowerShell in project root
// 2. Run: .\check-ip.ps1
// 3. Look for your WiFi/Ethernet IP (usually 192.168.x.x)
// 4. Update the IP below
//
// CURRENT IP: 192.168.1.103 (Updated: October 9, 2025)
// ========================================
export const API_BASE_URL = "http://172.20.10.3:5000/api";
export const WEBSOCKET_URL = "http://172.20.10.3:5000";

export const API_ENDPOINTS = {
  AUTH: "/auth",
  INCIDENTS: "/incidents",
  VEHICLES: "/vehicles",
  CREWS: "/crews",
  STATIONS: "/stations",
  SHIFTS: "/shifts",
  ASSIGNMENTS: "/assignments",
  COMMUNICATIONS: "/communications",
  REPORTS: "/reports",
  EQUIPMENT: "/equipment",
  AUDIT: "/audit",
};

export const USER_ROLES = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  DISPATCHER: "Dispatcher",
  FIELD_CREW: "Field Crew", // Mobile app users
} as const;

export const ASSIGNMENT_STATUS = {
  ASSIGNED: "assigned",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  EN_ROUTE: "en_route",
  ON_SCENE: "on_scene",
  COMPLETED: "completed",
  RETURNED: "returned", // October 21, 2025 - When crew marks "Returned to Station"
  CANCELLED: "cancelled",
} as const;

export const DECLINE_REASONS = [
  { label: "Vehicle Issue", value: "vehicle_issue" },
  { label: "Medical Emergency", value: "medical_emergency" },
  { label: "Equipment Failure", value: "equipment_failure" },
  { label: "Other", value: "other" },
] as const;

export const GPS_UPDATE_INTERVAL = 15000; // 15 seconds when en_route

// October 20, 2025 - Vehicle Status (separate from assignment status)
export const VEHICLE_STATUS = {
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  EN_ROUTE: "en_route",
  ON_SCENE: "on_scene",
  RETURNING: "returning", // Vehicle returning to station after completing assignment
} as const;

export const INCIDENT_TYPES = {
  FIRE: "Fire",
  MEDICAL: "Medical Emergency",
  TRAFFIC: "Traffic Accident",
  RESCUE: "Rescue Operation",
  HAZMAT: "Hazardous Materials",
  OTHER: "Other",
} as const;

export const INCIDENT_SEVERITY = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4,
  EMERGENCY: 5,
} as const;

// October 20, 2025 - Vehicle Status removed from here (defined above with correct values)

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type IncidentType = (typeof INCIDENT_TYPES)[keyof typeof INCIDENT_TYPES];
