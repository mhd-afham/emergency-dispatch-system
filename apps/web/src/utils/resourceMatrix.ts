// Resource Assignment Matrix for Emergency Dispatch System
// Hardcoded logic for intelligent resource suggestions based on incident type and category

export interface ResourceSuggestion {
  vehicleType:
    | "Ambulance"
    | "Fire Engine"
    | "Rescue Vehicle"
    | "Support Vehicle";
  priority: number; // 1 = highest priority, 4 = lowest
  required: boolean; // true = mandatory resource, false = optional/support
  reasoning: string; // Explanation for dispatcher
}

export interface IncidentTypeConfig {
  vehicleTypes: ResourceSuggestion[];
  estimatedResponseTime: number; // in minutes
  minimumCrewSize: number;
}

/**
 * Emergency Response Matrix
 * Defines which vehicle types should respond to specific incident types and categories
 */
export const RESPONSE_MATRIX: Record<
  string,
  Record<string, IncidentTypeConfig>
> = {
  // MEDICAL EMERGENCIES
  medical: {
    cardiac_arrest: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Life-threatening cardiac emergency requires immediate medical intervention",
        },
        {
          vehicleType: "Support Vehicle",
          priority: 3,
          required: false,
          reasoning: "Additional medical support if available",
        },
      ],
      estimatedResponseTime: 8,
      minimumCrewSize: 2,
    },
    respiratory_emergency: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Respiratory distress requires immediate medical care and oxygen",
        },
      ],
      estimatedResponseTime: 10,
      minimumCrewSize: 2,
    },
    trauma: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Trauma patient requires stabilization and rapid transport",
        },
        {
          vehicleType: "Rescue Vehicle",
          priority: 2,
          required: false,
          reasoning: "May need extrication or specialized rescue equipment",
        },
      ],
      estimatedResponseTime: 12,
      minimumCrewSize: 3,
    },
    unconscious: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Unconscious patient requires immediate medical assessment",
        },
      ],
      estimatedResponseTime: 10,
      minimumCrewSize: 2,
    },
    allergic_reaction: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning: "Severe allergic reactions can be life-threatening",
        },
      ],
      estimatedResponseTime: 10,
      minimumCrewSize: 2,
    },
    other_medical: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Medical emergency requires professional medical assessment",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 2,
    },
  },

  // FIRE EMERGENCIES
  fire: {
    structure_fire: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Structure fires require immediate fire suppression and rescue capabilities",
        },
        {
          vehicleType: "Ambulance",
          priority: 2,
          required: true,
          reasoning:
            "Medical support for potential casualties and smoke inhalation",
        },
        {
          vehicleType: "Support Vehicle",
          priority: 3,
          required: false,
          reasoning: "Additional equipment and water supply",
        },
      ],
      estimatedResponseTime: 8,
      minimumCrewSize: 4,
    },
    vehicle_fire: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Vehicle fires require fire suppression and hazmat capabilities",
        },
        {
          vehicleType: "Ambulance",
          priority: 2,
          required: false,
          reasoning: "Standby medical support for potential injuries",
        },
      ],
      estimatedResponseTime: 10,
      minimumCrewSize: 3,
    },
    wildfire: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Wildfire requires specialized firefighting equipment and water supply",
        },
        {
          vehicleType: "Support Vehicle",
          priority: 2,
          required: true,
          reasoning:
            "Additional water supply and equipment transport essential",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 6,
    },
    explosion: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Explosion scene requires fire suppression and hazmat response",
        },
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "High probability of casualties requiring immediate medical care",
        },
        {
          vehicleType: "Rescue Vehicle",
          priority: 2,
          required: true,
          reasoning:
            "Potential entrapment and structural collapse rescue needed",
        },
      ],
      estimatedResponseTime: 8,
      minimumCrewSize: 6,
    },
    smoke_investigation: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Smoke investigation requires firefighting standby capability",
        },
      ],
      estimatedResponseTime: 12,
      minimumCrewSize: 3,
    },
    other_fire: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning: "Fire emergency requires firefighting capabilities",
        },
      ],
      estimatedResponseTime: 12,
      minimumCrewSize: 3,
    },
  },

  // RESCUE OPERATIONS
  rescue: {
    vehicle_accident: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Vehicle accidents often involve injuries requiring medical care",
        },
        {
          vehicleType: "Rescue Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "May require vehicle extrication and specialized rescue equipment",
        },
        {
          vehicleType: "Fire Engine",
          priority: 2,
          required: false,
          reasoning:
            "Fire suppression standby for fuel spills or vehicle fires",
        },
      ],
      estimatedResponseTime: 10,
      minimumCrewSize: 4,
    },
    water_rescue: {
      vehicleTypes: [
        {
          vehicleType: "Rescue Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "Water rescue requires specialized equipment and trained divers",
        },
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning: "High risk of hypothermia and drowning injuries",
        },
      ],
      estimatedResponseTime: 12,
      minimumCrewSize: 4,
    },
    confined_space: {
      vehicleTypes: [
        {
          vehicleType: "Rescue Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "Confined space rescue requires specialized equipment and safety protocols",
        },
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "High risk of injury and medical emergency in confined spaces",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 5,
    },
    height_rescue: {
      vehicleTypes: [
        {
          vehicleType: "Rescue Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "Height rescue requires specialized climbing and rigging equipment",
        },
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning: "Fall injuries require immediate medical assessment",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 4,
    },
    animal_rescue: {
      vehicleTypes: [
        {
          vehicleType: "Rescue Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "Animal rescue may require specialized equipment and handling",
        },
        {
          vehicleType: "Ambulance",
          priority: 2,
          required: false,
          reasoning:
            "Standby medical support for potential animal-related injuries",
        },
      ],
      estimatedResponseTime: 20,
      minimumCrewSize: 3,
    },
    other_rescue: {
      vehicleTypes: [
        {
          vehicleType: "Rescue Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "Rescue operation requires specialized equipment and training",
        },
        {
          vehicleType: "Ambulance",
          priority: 2,
          required: false,
          reasoning: "Medical support for potential injuries",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 3,
    },
  },

  // HAZMAT INCIDENTS
  hazmat: {
    chemical_spill: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Chemical spills require hazmat response and decontamination capabilities",
        },
        {
          vehicleType: "Ambulance",
          priority: 2,
          required: true,
          reasoning: "Chemical exposure medical monitoring and treatment",
        },
        {
          vehicleType: "Support Vehicle",
          priority: 2,
          required: true,
          reasoning: "Additional hazmat equipment and containment materials",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 4,
    },
    gas_leak: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Gas leaks require hazmat response and explosion prevention",
        },
        {
          vehicleType: "Ambulance",
          priority: 2,
          required: false,
          reasoning: "Standby medical support for gas exposure",
        },
      ],
      estimatedResponseTime: 10,
      minimumCrewSize: 3,
    },
    toxic_exposure: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Toxic exposure requires immediate medical decontamination",
        },
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning: "Hazmat decontamination and scene safety control",
        },
      ],
      estimatedResponseTime: 12,
      minimumCrewSize: 4,
    },
    environmental: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Environmental hazmat incidents require containment and cleanup",
        },
        {
          vehicleType: "Support Vehicle",
          priority: 2,
          required: true,
          reasoning: "Environmental cleanup equipment and materials",
        },
      ],
      estimatedResponseTime: 20,
      minimumCrewSize: 3,
    },
    other_hazmat: {
      vehicleTypes: [
        {
          vehicleType: "Fire Engine",
          priority: 1,
          required: true,
          reasoning:
            "Hazmat incidents require specialized response capabilities",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 3,
    },
  },

  // TRAFFIC INCIDENTS
  traffic: {
    collision: {
      vehicleTypes: [
        {
          vehicleType: "Ambulance",
          priority: 1,
          required: true,
          reasoning:
            "Traffic collisions often result in injuries requiring medical care",
        },
        {
          vehicleType: "Support Vehicle",
          priority: 2,
          required: false,
          reasoning: "Traffic control and scene safety management",
        },
      ],
      estimatedResponseTime: 12,
      minimumCrewSize: 2,
    },
    road_obstruction: {
      vehicleTypes: [
        {
          vehicleType: "Support Vehicle",
          priority: 1,
          required: true,
          reasoning: "Road obstruction removal and traffic control",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 2,
    },
    traffic_control: {
      vehicleTypes: [
        {
          vehicleType: "Support Vehicle",
          priority: 1,
          required: true,
          reasoning: "Traffic control requires visibility and safety equipment",
        },
      ],
      estimatedResponseTime: 10,
      minimumCrewSize: 2,
    },
    other_traffic: {
      vehicleTypes: [
        {
          vehicleType: "Support Vehicle",
          priority: 1,
          required: true,
          reasoning: "Traffic incidents require scene safety and control",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 2,
    },
  },

  // OTHER INCIDENTS
  other: {
    public_service: {
      vehicleTypes: [
        {
          vehicleType: "Support Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "Public service calls require general emergency response capability",
        },
      ],
      estimatedResponseTime: 20,
      minimumCrewSize: 2,
    },
    assist_police: {
      vehicleTypes: [
        {
          vehicleType: "Support Vehicle",
          priority: 1,
          required: true,
          reasoning: "Police assistance may require emergency service support",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 2,
    },
    false_alarm: {
      vehicleTypes: [
        {
          vehicleType: "Support Vehicle",
          priority: 2,
          required: false,
          reasoning:
            "False alarm verification with minimal resource commitment",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 1,
    },
    other: {
      vehicleTypes: [
        {
          vehicleType: "Support Vehicle",
          priority: 1,
          required: true,
          reasoning:
            "General emergency response capability for undefined incidents",
        },
      ],
      estimatedResponseTime: 15,
      minimumCrewSize: 2,
    },
  },
};

/**
 * Get resource suggestions for a specific incident
 */
export const getResourceSuggestions = (
  incidentType: string,
  incidentCategory: string,
  severity: "low" | "medium" | "high" | "critical"
): ResourceSuggestion[] => {
  const config = RESPONSE_MATRIX[incidentType]?.[incidentCategory];

  if (!config) {
    // Fallback for unknown incident types
    return [
      {
        vehicleType: "Support Vehicle",
        priority: 1,
        required: true,
        reasoning: "General emergency response for unclassified incident",
      },
    ];
  }

  // Adjust priorities based on severity
  const suggestions = config.vehicleTypes.map((suggestion) => ({
    ...suggestion,
    priority:
      severity === "critical"
        ? Math.max(1, suggestion.priority - 1)
        : suggestion.priority,
  }));

  // Add additional resources for critical incidents
  if (
    severity === "critical" &&
    !suggestions.some((s) => s.vehicleType === "Support Vehicle")
  ) {
    suggestions.push({
      vehicleType: "Support Vehicle",
      priority: 3,
      required: false,
      reasoning: "Additional support for critical severity incident",
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
};

/**
 * Get estimated response time for incident
 */
export const getEstimatedResponseTime = (
  incidentType: string,
  incidentCategory: string
): number => {
  const config = RESPONSE_MATRIX[incidentType]?.[incidentCategory];
  return config?.estimatedResponseTime || 15; // Default 15 minutes
};

/**
 * Get minimum crew size for incident
 */
export const getMinimumCrewSize = (
  incidentType: string,
  incidentCategory: string
): number => {
  const config = RESPONSE_MATRIX[incidentType]?.[incidentCategory];
  return config?.minimumCrewSize || 2; // Default 2 crew members
};
