// Vehicle Management Types and Utilities
// Phase 3: Vehicle Tracking and Map Visualization
// FOLLOWING BACKEND SCHEMA: apps/backend/models/Vehicle.js

export interface Vehicle {
  _id: string;
  // Vehicle Registration Information
  registration: {
    plateNumber: string;
    vehicleType:
      | "Ambulance"
      | "Fire Engine"
      | "Rescue Vehicle"
      | "Support Vehicle";
    make: string;
    model: string;
    year: number;
    registrationDate: string;
    approvedBy: string;
  };
  // Current Status Information
  status: {
    operational: "active" | "maintenance" | "out_of_service";
    currentStatus:
      | "available"
      | "assigned"
      | "en_route"
      | "on_scene"
      | "returning";
    currentLocation: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
    lastLocationUpdate: string;
  };
  // Current Assignment Information
  assignment: {
    currentIncidentId?: string;
    assignedAt?: string;
    crew: string[]; // Array of Crew ObjectIds
  };
  // Equipment Information
  equipment: {
    checklistTemplateId?: string;
    lastCheckDate?: string;
    nextMaintenanceDate?: string;
    items: Array<{
      name: string;
      type:
        | "medical_equipment"
        | "medical_supply"
        | "safety_equipment"
        | "communication"
        | "other";
      serialNumber?: string;
      status: "operational" | "needs_repair" | "out_of_service";
      quantity: number;
    }>;
  };
  // Station Information
  station: {
    homeStationId: string;
    currentStationId: string;
  };
  // MongoDB timestamps
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface VehicleMarkerConfig {
  vehicleType: Vehicle["registration"]["vehicleType"];
  currentStatus: Vehicle["status"]["currentStatus"];
  operational: Vehicle["status"]["operational"];
  icon: string;
  backgroundColor: string;
  borderColor: string;
  size: { width: number; height: number };
}

// Vehicle Status Color Mapping (using currentStatus)
export const getVehicleStatusColors = (
  currentStatus: Vehicle["status"]["currentStatus"],
  operational: Vehicle["status"]["operational"]
) => {
  // If not operational, override with operational status colors
  if (operational === "maintenance") {
    return {
      backgroundColor: "#EF4444", // red-500
      borderColor: "#DC2626", // red-600
      textColor: "#ffffff",
      badgeColor: "bg-red-100 text-red-800",
    };
  }
  if (operational === "out_of_service") {
    return {
      backgroundColor: "#6B7280", // gray-500
      borderColor: "#4B5563", // gray-600
      textColor: "#ffffff",
      badgeColor: "bg-gray-100 text-gray-800",
    };
  }

  // Use currentStatus for operational vehicles
  switch (currentStatus) {
    case "available":
      return {
        backgroundColor: "#10B981", // green-500
        borderColor: "#059669", // green-600
        textColor: "#ffffff",
        badgeColor: "bg-green-100 text-green-800",
      };
    case "assigned":
      return {
        backgroundColor: "#3B82F6", // blue-500
        borderColor: "#2563EB", // blue-600
        textColor: "#ffffff",
        badgeColor: "bg-blue-100 text-blue-800",
      };
    case "en_route":
      return {
        backgroundColor: "#8B5CF6", // violet-500
        borderColor: "#7C3AED", // violet-600
        textColor: "#ffffff",
        badgeColor: "bg-purple-100 text-purple-800",
      };
    case "on_scene":
      return {
        backgroundColor: "#F59E0B", // amber-500
        borderColor: "#D97706", // amber-600
        textColor: "#ffffff",
        badgeColor: "bg-orange-100 text-orange-800",
      };
    case "returning":
      return {
        backgroundColor: "#8B5CF6", // violet-500
        borderColor: "#7C3AED", // violet-600
        textColor: "#ffffff",
        badgeColor: "bg-purple-100 text-purple-800",
      };
    default:
      return {
        backgroundColor: "#6B7280",
        borderColor: "#4B5563",
        textColor: "#ffffff",
        badgeColor: "bg-gray-100 text-gray-800",
      };
  }
};

// Incident Status Color Mapping (consistent with existing)
export const getIncidentStatusColors = (status: string) => {
  switch (status) {
    case "pending":
      return {
        backgroundColor: "#F59E0B", // amber-500
        borderColor: "#D97706", // amber-600
        textColor: "#ffffff",
      };
    case "assigned":
      return {
        backgroundColor: "#3B82F6", // blue-500
        borderColor: "#2563EB", // blue-600
        textColor: "#ffffff",
      };
    case "en_route":
      return {
        backgroundColor: "#8B5CF6", // violet-500
        borderColor: "#7C3AED", // violet-600
        textColor: "#ffffff",
      };
    case "on_scene":
      return {
        backgroundColor: "#F59E0B", // amber-500
        borderColor: "#D97706", // amber-600
        textColor: "#ffffff",
      };
    case "resolved":
      return {
        backgroundColor: "#10B981", // green-500
        borderColor: "#059669", // green-600
        textColor: "#ffffff",
      };
    case "cancelled":
      return {
        backgroundColor: "#6B7280", // gray-500
        borderColor: "#4B5563", // gray-600
        textColor: "#ffffff",
      };
    default:
      return {
        backgroundColor: "#6B7280",
        borderColor: "#4B5563",
        textColor: "#ffffff",
      };
  }
};

// Vehicle Type SVG Path Mapping (using backend schema vehicleType)
export const getVehicleTypePath = (
  vehicleType: Vehicle["registration"]["vehicleType"]
) => {
  switch (vehicleType) {
    case "Ambulance":
      return `<path d="M2 8H6V10H10V8H14V12H2V8Z" fill="currentColor"/>
              <path d="M6 6H10V8H6V6Z" fill="currentColor"/>
              <path d="M8 3H8V5H8Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>`;
    case "Fire Engine":
      return `<path d="M2 10H14V12H2V10Z" fill="currentColor"/>
              <path d="M3 6H13V10H3V6Z" fill="currentColor"/>
              <path d="M5 8H11V9H5V8Z" fill="currentColor" opacity="0.7"/>`;
    case "Rescue Vehicle":
      return `<path d="M2 8H14V12H2V8Z" fill="currentColor"/>
              <path d="M4 5H12V8H4V5Z" fill="currentColor"/>
              <path d="M8 2V4" stroke="currentColor" stroke-width="2"/>`;
    case "Support Vehicle":
      return `<path d="M2 10H14V12H2V10Z" fill="currentColor"/>
              <path d="M3 7H13V10H3V7Z" fill="currentColor"/>
              <path d="M6 4H10V7H6V4Z" fill="currentColor" opacity="0.8"/>`;
    default:
      return `<path d="M2 9H14V12H2V9Z" fill="currentColor"/>
              <path d="M4 6H12V9H4V6Z" fill="currentColor"/>`;
  }
};

// Vehicle Type Display Icon (for text display only)
export const getVehicleTypeIcon = (
  vehicleType: Vehicle["registration"]["vehicleType"]
) => {
  switch (vehicleType) {
    case "Ambulance":
      return "AMB";
    case "Fire Engine":
      return "FIRE";
    case "Rescue Vehicle":
      return "RES";
    case "Support Vehicle":
      return "SUP";
    default:
      return "VEH";
  }
};

// Generate SVG marker for vehicles
export const generateVehicleMarkerSVG = (
  vehicleType: Vehicle["registration"]["vehicleType"],
  currentStatus: Vehicle["status"]["currentStatus"],
  operational: Vehicle["status"]["operational"],
  isSelected: boolean = false
): string => {
  const colors = getVehicleStatusColors(currentStatus, operational);
  const vehiclePath = getVehicleTypePath(vehicleType);
  const size = isSelected ? 40 : 32;
  const strokeWidth = isSelected ? 3 : 2;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${size / 2 - strokeWidth}" 
        fill="${colors.backgroundColor}" 
        stroke="${colors.borderColor}" 
        stroke-width="${strokeWidth}"
      />
      <g transform="translate(${size / 2 - 8}, ${size / 2 - 8})" fill="${
    colors.textColor
  }">
        ${vehiclePath}
      </g>
      ${
        isSelected
          ? `<circle cx="${size / 2}" cy="${size / 2}" r="${
              size / 2 - 1
            }" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.8"/>`
          : ""
      }
    </svg>
  `;

  // Use URL encoding instead of base64 to avoid emoji encoding issues
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Generate SVG marker for incidents
export const generateIncidentMarkerSVG = (
  status: string,
  severity: string,
  isSelected: boolean = false
): string => {
  const colors = getIncidentStatusColors(status);
  const size = isSelected ? 40 : 32;
  const strokeWidth = isSelected ? 3 : 2;

  // Severity icon SVG path mapping
  const getSeverityIconPath = (severity: string) => {
    switch (severity) {
      case "critical":
        return `<circle cx="8" cy="8" r="6" fill="currentColor"/>
                <path d="M8 4V9M8 11V12" stroke="white" stroke-width="2" stroke-linecap="round"/>`;
      case "high":
        return `<path d="M8 2L14 14H2L8 2Z" fill="currentColor"/>
                <path d="M8 6V10M8 12V12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`;
      case "medium":
        return `<path d="M8 2L8 14M8 14L2 10L14 10L8 14Z" fill="currentColor"/>`;
      case "low":
        return `<circle cx="8" cy="8" r="6" fill="currentColor"/>
                <path d="M8 4V8M8 10V12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`;
      default:
        return `<path d="M8 2L8 14M8 14L2 10L14 10L8 14Z" fill="currentColor"/>`;
    }
  };

  const severityPath = getSeverityIconPath(severity);

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${size / 2 - strokeWidth}" 
        fill="${colors.backgroundColor}" 
        stroke="${colors.borderColor}" 
        stroke-width="${strokeWidth}"
      />
      <g transform="translate(${size / 2 - 8}, ${size / 2 - 8})" fill="${
    colors.textColor
  }">
        ${severityPath}
      </g>
      ${
        isSelected
          ? `<circle cx="${size / 2}" cy="${size / 2}" r="${
              size / 2 - 1
            }" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.9"/>`
          : ""
      }
    </svg>
  `;

  // Use URL encoding instead of base64 to avoid emoji encoding issues
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
