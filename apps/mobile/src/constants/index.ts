// Local constants for mobile app

// API Configuration
// Use your computer's local IP address instead of localhost for physical devices
// Change this to your computer's IP address (find with: ipconfig on Windows, ifconfig on Mac/Linux)
// Current IPs available: 192.168.56.1 (VirtualBox), 172.20.10.3 (WiFi/Hotspot)
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
  RETURNED: "returned",
  CANCELLED: "cancelled",
} as const;

export const DECLINE_REASONS = [
  { label: "Vehicle Issue", value: "vehicle_issue" },
  { label: "Medical Emergency", value: "medical_emergency" },
  { label: "Equipment Failure", value: "equipment_failure" },
  { label: "Other", value: "other" },
] as const;

export const GPS_UPDATE_INTERVAL = 15000; // 15 seconds when en_route

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

export const VEHICLE_STATUS = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  EN_ROUTE: "En Route",
  ON_SCENE: "On Scene",
  OUT_OF_SERVICE: "Out of Service",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type IncidentType = (typeof INCIDENT_TYPES)[keyof typeof INCIDENT_TYPES];
