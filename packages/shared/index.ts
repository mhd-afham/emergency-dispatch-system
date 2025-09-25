// Shared constants and utilities
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  INCIDENTS: '/api/incidents',
  VEHICLES: '/api/vehicles',
  CREW: '/api/crew',
  STATIONS: '/api/stations',
  SHIFTS: '/api/shifts',
  ASSIGNMENTS: '/api/assignments',
  COMMUNICATIONS: '/api/communications',
  REPORTS: '/api/reports',
  EQUIPMENT: '/api/equipment',
  AUDIT: '/api/audit'
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor', 
  DISPATCHER: 'Dispatcher',
  CALL_TAKER: 'Call Taker',
  CREW_MEMBER: 'Crew Member'
} as const;

export const INCIDENT_TYPES = {
  FIRE: 'Fire',
  MEDICAL: 'Medical Emergency',
  TRAFFIC: 'Traffic Accident',
  RESCUE: 'Rescue Operation',
  HAZMAT: 'Hazardous Materials',
  OTHER: 'Other'
} as const;

export const INCIDENT_SEVERITY = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4,
  EMERGENCY: 5
} as const;

export const VEHICLE_STATUS = {
  AVAILABLE: 'Available',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route',
  ON_SCENE: 'On Scene',
  OUT_OF_SERVICE: 'Out of Service'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type IncidentType = typeof INCIDENT_TYPES[keyof typeof INCIDENT_TYPES];
export type VehicleStatus = typeof VEHICLE_STATUS[keyof typeof VEHICLE_STATUS];