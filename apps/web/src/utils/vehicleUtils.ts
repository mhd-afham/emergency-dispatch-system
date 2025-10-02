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

// Incident Severity Color Mapping (color-coded by severity, not status)
export const getIncidentSeverityColors = (severity: string) => {
  switch (severity) {
    case "critical":
      return {
        backgroundColor: "#dc2626", // red-600
        borderColor: "#991b1b", // red-800
        textColor: "#ffffff",
      };
    case "high":
      return {
        backgroundColor: "#ea580c", // orange-600
        borderColor: "#c2410c", // orange-700
        textColor: "#ffffff",
      };
    case "medium":
      return {
        backgroundColor: "#d97706", // amber-600
        borderColor: "#b45309", // amber-700
        textColor: "#ffffff",
      };
    case "low":
      return {
        backgroundColor: "#059669", // emerald-600
        borderColor: "#047857", // emerald-700
        textColor: "#ffffff",
      };
    default:
      return {
        backgroundColor: "#6b7280", // gray-500
        borderColor: "#4b5563", // gray-600
        textColor: "#ffffff",
      };
  }
};

// Incident Status Color Mapping (kept for backward compatibility)
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
      // Medical cross icon with outline like other icons
      return `<path stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="none"/>
              <path stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m-4-4h8"/>`;
    case "Fire Engine":
      // Fire/flame icon
      return `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14l4-2c-1 1-3 2-4 2z"/>`;
    case "Rescue Vehicle":
      // Shield with checkmark
      return `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>`;
    case "Support Vehicle":
      // Wrench/tools icon
      return `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`;
    default:
      // Generic truck icon
      return `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m4 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4 0v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2M7 4H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h8"/>`;
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
      <g transform="translate(${size / 2 - 12}, ${
    size / 2 - 12
  }) scale(1)" fill="${colors.textColor}">
        <svg viewBox="0 0 24 24" width="24" height="24">
          ${vehiclePath}
        </svg>
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
  const colors = getIncidentSeverityColors(severity);
  const size = isSelected ? 40 : 32;
  const strokeWidth = isSelected ? 3 : 2;

  // Universal incident icon - exclamation circle for all incidents
  const getIncidentIconPath = () => {
    // Same icon for all incidents - exclamation circle
    return `<path stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="none"/>
            <circle cx="12" cy="16" r="1.5" fill="white"/>`;
  };

  const incidentPath = getIncidentIconPath();

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
      <g transform="translate(${size / 2 - 12}, ${size / 2 - 12}) scale(1)">
        <svg viewBox="0 0 24 24" width="24" height="24">
          ${incidentPath}
        </svg>
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
