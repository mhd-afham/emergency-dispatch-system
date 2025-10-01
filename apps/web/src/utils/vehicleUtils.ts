// Vehicle Management Types and Utilities
// Phase 3: Vehicle Tracking and Map Visualization

export interface Vehicle {
  _id: string;
  vehicleId: string;
  type:
    | "ambulance"
    | "fire_truck"
    | "police_car"
    | "rescue_unit"
    | "hazmat_unit";
  status:
    | "available"
    | "assigned"
    | "en_route"
    | "on_scene"
    | "maintenance"
    | "offline";
  location: {
    coordinates: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
    lastUpdated: string;
    accuracy?: number; // GPS accuracy in meters
  };
  assignedIncidentId?: string;
  crew: {
    driverId: string;
    driverName: string;
    teamMembers: Array<{
      id: string;
      name: string;
      role: string;
    }>;
  };
  specifications: {
    capacity: number;
    equipment: string[];
    specializations: string[];
  };
  estimatedArrival?: string;
  lastStatusUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMarkerConfig {
  type: Vehicle["type"];
  status: Vehicle["status"];
  icon: string;
  backgroundColor: string;
  borderColor: string;
  size: { width: number; height: number };
}

// Vehicle Status Color Mapping
export const getVehicleStatusColors = (status: Vehicle["status"]) => {
  switch (status) {
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
    case "maintenance":
      return {
        backgroundColor: "#EF4444", // red-500
        borderColor: "#DC2626", // red-600
        textColor: "#ffffff",
        badgeColor: "bg-red-100 text-red-800",
      };
    case "offline":
      return {
        backgroundColor: "#6B7280", // gray-500
        borderColor: "#4B5563", // gray-600
        textColor: "#ffffff",
        badgeColor: "bg-gray-100 text-gray-800",
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

// Vehicle Type SVG Path Mapping
export const getVehicleTypePath = (type: Vehicle["type"]) => {
  switch (type) {
    case "ambulance":
      return `<path d="M2 8H6V10H10V8H14V12H2V8Z" fill="currentColor"/>
              <path d="M6 6H10V8H6V6Z" fill="currentColor"/>
              <path d="M8 3H8V5H8Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>`;
    case "fire_truck":
      return `<path d="M2 10H14V12H2V10Z" fill="currentColor"/>
              <path d="M3 6H13V10H3V6Z" fill="currentColor"/>
              <path d="M5 8H11V9H5V8Z" fill="currentColor" opacity="0.7"/>`;
    case "police_car":
      return `<path d="M2 9H14V12H2V9Z" fill="currentColor"/>
              <path d="M4 6H12V9H4V6Z" fill="currentColor"/>
              <circle cx="8" cy="4" r="1" fill="currentColor"/>`;
    case "rescue_unit":
      return `<path d="M2 8H14V12H2V8Z" fill="currentColor"/>
              <path d="M4 5H12V8H4V5Z" fill="currentColor"/>
              <path d="M8 2V4" stroke="currentColor" stroke-width="2"/>`;
    case "hazmat_unit":
      return `<path d="M2 10H14V12H2V10Z" fill="currentColor"/>
              <path d="M3 7H13V10H3V7Z" fill="currentColor"/>
              <path d="M6 4H10V7H6V4Z" fill="currentColor" opacity="0.8"/>`;
    default:
      return `<path d="M2 9H14V12H2V9Z" fill="currentColor"/>
              <path d="M4 6H12V9H4V6Z" fill="currentColor"/>`;
  }
};

// Vehicle Type Display Icon (for text display only)
export const getVehicleTypeIcon = (type: Vehicle["type"]) => {
  switch (type) {
    case "ambulance":
      return "AMB";
    case "fire_truck":
      return "FIRE";
    case "police_car":
      return "POL";
    case "rescue_unit":
      return "RES";
    case "hazmat_unit":
      return "HAZ";
    default:
      return "VEH";
  }
};

// Generate SVG marker for vehicles
export const generateVehicleMarkerSVG = (
  type: Vehicle["type"],
  status: Vehicle["status"],
  isSelected: boolean = false
): string => {
  const colors = getVehicleStatusColors(status);
  const vehiclePath = getVehicleTypePath(type);
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

// Mock Vehicle Data for Testing
export const mockVehicles: Vehicle[] = [
  {
    _id: "vehicle_001",
    vehicleId: "AMB-001",
    type: "ambulance",
    status: "available",
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // Colombo area
      },
      lastUpdated: new Date().toISOString(),
      accuracy: 5,
    },
    crew: {
      driverId: "driver_001",
      driverName: "Sunil Perera",
      teamMembers: [
        { id: "medic_001", name: "Dr. Priya Fernando", role: "Paramedic" },
        {
          id: "medic_002",
          name: "Nurse Kamala Silva",
          role: "Medical Assistant",
        },
      ],
    },
    specifications: {
      capacity: 2,
      equipment: ["Defibrillator", "Oxygen Tank", "Stretcher", "First Aid Kit"],
      specializations: ["Emergency Medical Care", "Patient Transport"],
    },
    lastStatusUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "vehicle_002",
    vehicleId: "FIRE-001",
    type: "fire_truck",
    status: "assigned",
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.8541, 6.9319], // Near Pettah
      },
      lastUpdated: new Date().toISOString(),
      accuracy: 3,
    },
    assignedIncidentId: "INC-2024-001",
    crew: {
      driverId: "driver_002",
      driverName: "Ravi Wickramasinghe",
      teamMembers: [
        {
          id: "fire_001",
          name: "Captain Nimal Jayawardena",
          role: "Fire Captain",
        },
        { id: "fire_002", name: "Sergeant Lal Perera", role: "Firefighter" },
        { id: "fire_003", name: "Constable Dinesh Kumar", role: "Firefighter" },
      ],
    },
    specifications: {
      capacity: 6,
      equipment: [
        "Water Pump",
        "Ladder",
        "Hoses",
        "Breathing Apparatus",
        "Axes",
      ],
      specializations: [
        "Fire Suppression",
        "Rescue Operations",
        "Hazardous Materials",
      ],
    },
    estimatedArrival: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
    lastStatusUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "vehicle_003",
    vehicleId: "POL-001",
    type: "police_car",
    status: "en_route",
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.8648, 6.9147], // Mount Lavinia area
      },
      lastUpdated: new Date().toISOString(),
      accuracy: 8,
    },
    assignedIncidentId: "INC-2024-003",
    crew: {
      driverId: "driver_003",
      driverName: "PC Chandana Rathnayake",
      teamMembers: [
        {
          id: "police_001",
          name: "Inspector Malini Seneviratne",
          role: "Police Inspector",
        },
      ],
    },
    specifications: {
      capacity: 4,
      equipment: [
        "Radio Communication",
        "First Aid Kit",
        "Traffic Control Equipment",
      ],
      specializations: [
        "Traffic Control",
        "Law Enforcement",
        "Emergency Response",
      ],
    },
    estimatedArrival: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    lastStatusUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "vehicle_004",
    vehicleId: "AMB-002",
    type: "ambulance",
    status: "on_scene",
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.859, 6.927], // Colombo Fort area
      },
      lastUpdated: new Date().toISOString(),
      accuracy: 2,
    },
    assignedIncidentId: "INC-2024-002",
    crew: {
      driverId: "driver_004",
      driverName: "Kumara Dissanayake",
      teamMembers: [
        {
          id: "medic_003",
          name: "Dr. Amara Gunawardena",
          role: "Emergency Physician",
        },
        {
          id: "medic_004",
          name: "Technician Sandun Peris",
          role: "Medical Technician",
        },
      ],
    },
    specifications: {
      capacity: 2,
      equipment: [
        "Advanced Life Support",
        "Cardiac Monitor",
        "Ventilator",
        "IV Equipment",
      ],
      specializations: ["Advanced Life Support", "Critical Care Transport"],
    },
    lastStatusUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "vehicle_005",
    vehicleId: "RES-001",
    type: "rescue_unit",
    status: "available",
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.8711, 6.9021], // Dehiwala area
      },
      lastUpdated: new Date().toISOString(),
      accuracy: 10,
    },
    crew: {
      driverId: "driver_005",
      driverName: "Chaminda Rathnayake",
      teamMembers: [
        {
          id: "rescue_001",
          name: "Sergeant Major Anura Silva",
          role: "Rescue Specialist",
        },
        {
          id: "rescue_002",
          name: "Corporal Tharindu Perera",
          role: "Rescue Technician",
        },
      ],
    },
    specifications: {
      capacity: 8,
      equipment: [
        "Cutting Tools",
        "Lifting Equipment",
        "Ropes",
        "Rescue Harness",
        "Search Equipment",
      ],
      specializations: [
        "Technical Rescue",
        "Search and Rescue",
        "Vehicle Extrication",
      ],
    },
    lastStatusUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "vehicle_006",
    vehicleId: "HAZ-001",
    type: "hazmat_unit",
    status: "maintenance",
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.88, 6.935], // Kotahena area
      },
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      accuracy: 15,
    },
    crew: {
      driverId: "driver_006",
      driverName: "Upali Gunasekara",
      teamMembers: [
        {
          id: "hazmat_001",
          name: "Specialist Rohan Fernando",
          role: "Hazmat Specialist",
        },
        {
          id: "hazmat_002",
          name: "Technician Saman Perera",
          role: "Chemical Safety Officer",
        },
      ],
    },
    specifications: {
      capacity: 4,
      equipment: [
        "Chemical Detection Equipment",
        "Decontamination Suits",
        "Containment Materials",
        "Air Monitoring",
      ],
      specializations: [
        "Hazardous Materials Response",
        "Chemical Spill Cleanup",
        "Decontamination",
      ],
    },
    lastStatusUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];
