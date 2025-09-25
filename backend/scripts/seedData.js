const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * Seed data for Emergency Dispatch System
 * Contains realistic Sri Lankan emergency service data for development and testing
 */

// User seed data with Sri Lankan context
const users = [
  {
    personal: {
      firstName: "Mohamed",
      lastName: "Afham",
      email: "admin@respondr.lk",
      dateOfBirth: new Date("1985-03-15"),
      gender: "male",
      address: {
        street: "45 Independence Avenue",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00700",
        country: "Sri Lanka",
      },
      phone: "+94771234567",
    },
    auth: {
      password: "admin123",
      role: "Admin",
      employeeId: "EMP000001",
    },
    settings: {
      isActive: true,
      emailVerified: true,
      preferences: {
        mapZoom: 12,
        notificationSound: true,
        theme: "system",
      },
    },
  },
  {
    personal: {
      firstName: "Mohamed",
      lastName: "Afham",
      email: "dispatcher@respondr.lk",
      dateOfBirth: new Date("1988-07-22"),
      gender: "male",
      address: {
        street: "23 Galle Road",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00300",
        country: "Sri Lanka",
      },
      phone: "+94771234569",
    },
    auth: {
      password: "dispatcher123",
      role: "Dispatcher",
      employeeId: "EMP000002",
    },
    settings: {
      isActive: true,
      emailVerified: true,
      preferences: {
        mapZoom: 14,
        notificationSound: true,
        theme: "light",
      },
    },
  },
  {
    personal: {
      firstName: "Chirath",
      lastName: "De Silva",
      email: "calltaker@respondr.lk",
      dateOfBirth: new Date("1997-08-27"),
      gender: "male",
      address: {
        street: "45 Galle Road",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00300",
        country: "Sri Lanka",
      },
      phone: "+94771234869",
    },
    auth: {
      password: "calltaker123",
      role: "Call Taker",
      employeeId: "EMP000003",
    },
    settings: {
      isActive: true,
      emailVerified: true,
      preferences: {
        mapZoom: 14,
        notificationSound: true,
        theme: "light",
      },
    },
  },
  {
    personal: {
      firstName: "Julien",
      lastName: "Spencer",
      email: "supervisor@respondr.lk",
      dateOfBirth: new Date("1985-01-13"),
      gender: "male",
      address: {
        street: "45 Galle Road",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00300",
        country: "Sri Lanka",
      },
      phone: "+94771234456",
    },
    auth: {
      password: "supervisor123",
      role: "Supervisor",
      employeeId: "EMP000004",
    },
    settings: {
      isActive: true,
      emailVerified: true,
      preferences: {
        mapZoom: 14,
        notificationSound: true,
        theme: "light",
      },
    },
  },
];

// Station seed data for Sri Lanka
const stations = [
  {
    stationName: "Colombo Central Fire Station",
    address: "25 Chatham Street, Colombo 01, Sri Lanka",
    coordinates: {
      type: "Point",
      coordinates: [79.8612, 6.9271], // [longitude, latitude] for Colombo Central
    },
    province: "Western",
    contactPhone: "+94112345678",
    contactEmail: "colombo.central@fire.gov.lk",
    stationType: "Fire Station",
    capacity: {
      vehicleCapacity: 6,
      crewCapacity: 24,
    },
    operatingHours: {
      is24Hours: true,
      openTime: "00:00",
      closeTime: "23:59",
    },
    coverageArea: {
      radius: 15, // 15 km radius
      districts: ["Colombo"],
      cities: ["Colombo", "Mount Lavinia", "Dehiwala"],
    },
    stationCommander: null, // Will be populated after user creation
    currentResources: {
      activeVehicles: 4,
      onDutyPersonnel: 8,
      availableEquipment: ["Fire Trucks", "Ladder Trucks", "Rescue Equipment"],
    },
    isActive: true,
    // audit.createdBy will be populated during seeding
  },
  {
    stationName: "Kandy Central Ambulance Station",
    address: "45 Dalada Veediya, Kandy, Sri Lanka",
    coordinates: {
      type: "Point",
      coordinates: [80.6337, 7.2906], // [longitude, latitude] for Kandy
    },
    province: "Central",
    contactPhone: "+94812345679",
    contactEmail: "kandy.ambulance@health.gov.lk",
    stationType: "Ambulance Station",
    capacity: {
      vehicleCapacity: 8,
      crewCapacity: 16,
    },
    operatingHours: {
      is24Hours: true,
      openTime: "00:00",
      closeTime: "23:59",
    },
    coverageArea: {
      radius: 25, // 25 km radius
      districts: ["Kandy", "Matale"],
      cities: ["Kandy", "Peradeniya", "Gampola"],
    },
    stationCommander: null, // Will be populated after user creation
    currentResources: {
      activeVehicles: 6,
      onDutyPersonnel: 12,
      availableEquipment: ["Ambulances", "Medical Equipment", "Stretchers"],
    },
    isActive: true,
    // audit.createdBy will be populated during seeding
  },
  {
    stationName: "Galle Multi-Purpose Emergency Station",
    address: "78 Main Street, Galle Fort, Galle, Sri Lanka",
    coordinates: {
      type: "Point",
      coordinates: [80.217, 6.0535], // [longitude, latitude] for Galle
    },
    province: "Southern",
    contactPhone: "+94912345680",
    contactEmail: "galle.emergency@disaster.gov.lk",
    stationType: "Multi-Purpose",
    capacity: {
      vehicleCapacity: 10,
      crewCapacity: 20,
    },
    operatingHours: {
      is24Hours: true,
      openTime: "00:00",
      closeTime: "23:59",
    },
    coverageArea: {
      radius: 30, // 30 km radius
      districts: ["Galle", "Matara"],
      cities: ["Galle", "Unawatuna", "Hikkaduwa", "Bentota"],
    },
    stationCommander: null, // Will be populated after user creation
    currentResources: {
      activeVehicles: 7,
      onDutyPersonnel: 15,
      availableEquipment: [
        "Fire Trucks",
        "Ambulances",
        "Rescue Boats",
        "Diving Equipment",
      ],
    },
    isActive: true,
    // audit.createdBy will be populated during seeding
  },
];

// Vehicle seed data
const vehicles = [
  {
    registration: {
      plateNumber: "CAE-5678",
      vehicleType: "Fire Engine",
      make: "Isuzu",
      model: "NPR Fire Truck",
      year: 2020,
      registrationDate: new Date("2020-03-15"),
      approvedBy: null, // Will be populated during seeding
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // Colombo Central
      },
      lastLocationUpdate: new Date(),
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Water Pump",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Fire Hoses",
          type: "safety_equipment",
          status: "operational",
          quantity: 8,
        },
        {
          name: "Ladders",
          type: "safety_equipment",
          status: "operational",
          quantity: 2,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-01-15"),
      nextMaintenanceDate: new Date("2024-04-15"),
    },
    station: {
      homeStationId: null, // Will be populated during seeding
      currentStationId: null, // Will be populated during seeding
    },
    // audit fields will be populated during seeding
  },
  {
    registration: {
      plateNumber: "CAB-9012",
      vehicleType: "Ambulance",
      make: "Toyota",
      model: "Hiace Ambulance",
      year: 2021,
      registrationDate: new Date("2021-06-10"),
      approvedBy: null, // Will be populated during seeding
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.6337, 7.2906], // Kandy
      },
      lastLocationUpdate: new Date(),
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Defibrillator",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Stretcher",
          type: "medical_equipment",
          status: "operational",
          quantity: 2,
        },
        {
          name: "First Aid Kit",
          type: "medical_supply",
          status: "operational",
          quantity: 2,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-02-01"),
      nextMaintenanceDate: new Date("2024-05-01"),
    },
    station: {
      homeStationId: null, // Will be populated during seeding
      currentStationId: null, // Will be populated during seeding
    },
    // audit fields will be populated during seeding
  },
  {
    registration: {
      plateNumber: "CAR-3456",
      vehicleType: "Rescue Vehicle",
      make: "Mercedes",
      model: "Sprinter Rescue",
      year: 2022,
      registrationDate: new Date("2022-09-20"),
      approvedBy: null, // Will be populated during seeding
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.217, 6.0535], // Galle
      },
      lastLocationUpdate: new Date(),
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Hydraulic Rescue Tools",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Diving Equipment",
          type: "safety_equipment",
          status: "operational",
          quantity: 4,
        },
        {
          name: "Rescue Boat",
          type: "other",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-01-20"),
      nextMaintenanceDate: new Date("2024-04-20"),
    },
    station: {
      homeStationId: null, // Will be populated during seeding
      currentStationId: null, // Will be populated during seeding
    },
    // audit fields will be populated during seeding
  },
];

// Crew seed data
const crew = [
  {
    personal: {
      employeeId: "EMP000003",
      firstName: "Nuwan",
      lastName: "Silva",
      email: "nuwan.silva@fire.gov.lk",
      phone: "+94771234571",
    },
    professional: {
      role: "Firefighter",
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Fire Safety Certification",
          number: "FS-2020-001",
          issuedBy: "Sri Lanka Fire Services",
          issueDate: new Date("2020-06-01"),
          expiryDate: new Date("2025-06-01"),
          isActive: true,
        },
        {
          type: "Emergency Medical Technician",
          number: "EMT-2019-003",
          issuedBy: "Ministry of Health",
          issueDate: new Date("2019-03-15"),
          expiryDate: new Date("2025-03-15"),
          isActive: true,
        },
      ],
      specializations: ["fire_suppression", "rescue_operations"],
      hireDate: new Date("2008-04-01"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null,
      location: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // Colombo Central
      },
      lastLocationUpdate: new Date(),
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Sanduni Silva",
        relationship: "Spouse",
        phone: "+94771234572",
      },
    },
    // audit fields will be populated during seeding
  },
  {
    personal: {
      employeeId: "EMP000004",
      firstName: "Chamara",
      lastName: "Perera",
      email: "chamara.perera@health.gov.lk",
      phone: "+94771234573",
    },
    professional: {
      role: "Paramedic",
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Advanced Paramedic Certification",
          number: "APC-2021-007",
          issuedBy: "Sri Lanka Medical Council",
          issueDate: new Date("2021-08-15"),
          expiryDate: new Date("2026-08-15"),
          isActive: true,
        },
        {
          type: "Cardiac Life Support",
          number: "CLS-2020-012",
          issuedBy: "Heart Foundation Sri Lanka",
          issueDate: new Date("2020-11-20"),
          expiryDate: new Date("2025-11-20"),
          isActive: true,
        },
      ],
      specializations: ["cardiac_care", "trauma", "emergency_medicine"],
      hireDate: new Date("2015-07-01"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null,
      location: {
        type: "Point",
        coordinates: [80.6337, 7.2906], // Kandy
      },
      lastLocationUpdate: new Date(),
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Kumari Perera",
        relationship: "Parent",
        phone: "+94771234574",
      },
    },
    // audit fields will be populated during seeding
  },
  {
    personal: {
      employeeId: "EMP000005",
      firstName: "Ravindra",
      lastName: "Fernando",
      email: "ravindra.fernando@rescue.gov.lk",
      phone: "+94771234575",
    },
    professional: {
      role: "Driver",
      certificationLevel: "Intermediate",
      certifications: [
        {
          type: "Heavy Vehicle License",
          number: "HVL-2019-045",
          issuedBy: "Department of Motor Traffic",
          issueDate: new Date("2019-05-10"),
          expiryDate: new Date("2029-05-10"),
          isActive: true,
        },
        {
          type: "Emergency Vehicle Operations",
          number: "EVO-2020-023",
          issuedBy: "Emergency Services Training Institute",
          issueDate: new Date("2020-02-14"),
          expiryDate: new Date("2025-02-14"),
          isActive: true,
        },
      ],
      specializations: ["rescue_operations", "medical_transport"],
      hireDate: new Date("2012-09-15"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null,
      location: {
        type: "Point",
        coordinates: [80.217, 6.0535], // Galle
      },
      lastLocationUpdate: new Date(),
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Nimal Fernando",
        relationship: "Sibling",
        phone: "+94771234576",
      },
    },
    // audit fields will be populated during seeding
  },
];

// Equipment Checklist Templates
const equipmentTemplates = [
  {
    vehicleType: "fire_engine",
    template: {
      name: "Fire Engine Daily Inspection",
      description: "Comprehensive daily inspection checklist for fire engines",
      version: "2.1",
    },
    checklist: {
      instructions:
        "Complete all checks before shift starts. Mark any issues and report immediately to supervisor.",
      categories: [
        {
          name: "Engine & Mechanical",
          description: "Basic vehicle mechanical systems",
          items: [
            {
              name: "Engine Oil Level",
              type: "system",
              description: "Check oil level using dipstick",
              required: true,
              checkType: "visual_inspection",
              expectedValue: "Between MIN and MAX marks",
              instructions:
                "Engine must be warm but not hot. Check between MIN and MAX marks.",
            },
            {
              name: "Coolant Level",
              type: "system",
              description: "Visual check of coolant reservoir",
              required: true,
              checkType: "visual_inspection",
              expectedValue: "Above minimum line",
              instructions:
                "Level should be above minimum line when engine is cold.",
            },
            {
              name: "Brake Fluid Level",
              type: "system",
              description: "Check brake fluid reservoir",
              required: true,
              checkType: "visual_inspection",
              expectedValue: "Clear fluid above minimum",
              instructions: "Fluid should be clear and above minimum line.",
            },
          ],
        },
        {
          name: "Fire Suppression Equipment",
          description: "Primary firefighting equipment",
          items: [
            {
              name: "Water Tank Level",
              type: "equipment",
              description: "Check main water tank gauge",
              required: true,
              checkType: "pressure_check",
              expectedValue: "100% full capacity",
              instructions:
                "Tank should be at full capacity (100%) before deployment.",
            },
            {
              name: "Hoses Condition",
              type: "equipment",
              description: "Visual inspection of all hoses",
              required: true,
              checkType: "visual_inspection",
              expectedValue: "No cracks, kinks, or damage",
              instructions:
                "Check for cracks, kinks, or damage. Test connections.",
            },
            {
              name: "Nozzles Function",
              type: "equipment",
              description: "Test all nozzle settings",
              required: true,
              checkType: "functional_test",
              expectedValue: "All spray patterns work",
              instructions: "Test spray patterns and shut-off mechanisms.",
            },
          ],
        },
      ],
    },
    // audit fields will be populated during seeding
  },
  {
    vehicleType: "ambulance",
    template: {
      name: "Ambulance Equipment Check",
      description: "Daily medical equipment and supply verification",
      version: "1.8",
    },
    checklist: {
      instructions:
        "Verify all medical equipment is functional and supplies are fully stocked. Report any shortages or malfunctions immediately.",
      categories: [
        {
          name: "Medical Equipment",
          description: "Essential life-saving equipment",
          items: [
            {
              name: "Defibrillator",
              type: "equipment",
              description: "Test defibrillator functionality",
              required: true,
              checkType: "functional_test",
              expectedValue: "Self-test passes, battery > 80%",
              instructions:
                "Run self-test sequence. Check battery level and electrode expiry dates.",
            },
            {
              name: "Oxygen Tank Pressure",
              type: "supply",
              description: "Check oxygen tank pressure gauge",
              required: true,
              checkType: "pressure_check",
              expectedValue: "Above 1800 PSI",
              instructions:
                "Pressure should be above 1800 PSI. Replace if below minimum.",
            },
            {
              name: "Monitor/ECG Function",
              type: "equipment",
              description: "Test patient monitoring equipment",
              required: true,
              checkType: "functional_test",
              expectedValue: "Display clear, alarms functional",
              instructions: "Test all leads, display, and alarm functions.",
            },
          ],
        },
        {
          name: "Medical Supplies",
          description: "Consumable medical supplies",
          items: [
            {
              name: "IV Bags & Lines",
              type: "supply",
              description: "Check IV fluid inventory",
              required: true,
              checkType: "quantity_check",
              expectedValue: "Min 6 saline, 4 lactated ringers",
              instructions:
                "Minimum 6 saline bags, 4 lactated ringers. Check expiry dates.",
            },
            {
              name: "Medications",
              type: "supply",
              description: "Verify controlled substance inventory",
              required: true,
              checkType: "documentation_review",
              expectedValue: "All medications accounted for",
              instructions:
                "Count all medications and verify against log. Check expiry dates.",
            },
          ],
        },
      ],
    },
    // audit fields will be populated during seeding
  },
];

// Sample incidents for testing
const incidents = [
  {
    callerInfo: {
      name: "Saman Kumara",
      contactNumber: "+94771234580",
      alternateContact: "+94771234581",
      reportingMethod: "phone_call",
    },
    incidentType: "fire",
    incidentCategory: "structure_fire",
    severity: "critical",
    description:
      "Large fire at commercial building. Multiple floors affected. Possible people trapped on upper floors.",
    location: {
      address: "Building Complex, Galle Face Green",
      city: "Colombo",
      province: "Western",
      coordinates: {
        type: "Point",
        coordinates: [79.8652, 6.9181],
      },
      locationAccuracy: "exact",
      landmarks: "Near Galle Face Hotel",
    },
    status: "on_scene",
    // loggedBy will be set in the seeding function
    assignedDispatcher: null, // Will be set in seeding function
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Priya Silva",
      contactNumber: "+94771234582",
      reportingMethod: "mobile_app",
    },
    incidentType: "medical",
    incidentCategory: "cardiac_arrest",
    severity: "critical",
    description:
      "65-year-old male collapsed at home, not breathing, family performing CPR as instructed.",
    location: {
      address: "78 Ward Place",
      city: "Colombo",
      province: "Western",
      coordinates: {
        type: "Point",
        coordinates: [79.8612, 6.9147],
      },
      locationAccuracy: "exact",
      landmarks: "Opposite Cinnamon Gardens",
    },
    status: "en_route",
    assignedDispatcher: null,
    assignedResources: [],
  },
];

// Assignment seed data - Links incidents to resources
const assignments = [
  {
    incident: {
      incidentId: null, // Will be populated during seeding
    },
    resource: {
      vehicleId: null, // Will be populated during seeding
      primaryCrewId: null, // Will be populated during seeding
      additionalCrew: [], // Will be populated during seeding
    },
    dispatch: {
      assignedBy: null, // Will be populated during seeding
      assignedAt: new Date(Date.now() - 1800000), // 30 minutes ago
      priority: "critical",
      estimatedArrivalTime: new Date(Date.now() + 900000), // 15 minutes from now
      dispatchNotes:
        "Structure fire with possible entrapment. Respond with full crew.",
    },
    status: {
      current: "en_route",
      history: [
        {
          status: "assigned",
          timestamp: new Date(Date.now() - 1800000),
          updatedBy: null, // Will be populated
          notes: "Assignment created and dispatched",
        },
        {
          status: "acknowledged",
          timestamp: new Date(Date.now() - 1600000),
          updatedBy: null, // Will be populated
          notes: "Crew acknowledged assignment",
        },
        {
          status: "en_route",
          timestamp: new Date(Date.now() - 1500000),
          updatedBy: null, // Will be populated
          notes: "Unit responding to scene",
        },
      ],
    },
    location: {
      dispatchLocation: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // [longitude, latitude] - Station location
      },
      arrivalLocation: {
        type: "Point",
        coordinates: [79.8652, 6.9181], // [longitude, latitude] - Incident location
      },
    },
    performance: {
      responseTimeTarget: 480, // 8 minutes in seconds
      actualResponseTime: null, // Will be calculated
      distanceTraveled: 2.5,
    },
  },
];

// Communication seed data - Incident communications
const communications = [
  {
    type: "incident_dispatch",
    priority: "urgent",
    status: "delivered",
    subject: "Structure Fire - Multiple Units Required",
    message:
      "STRUCTURE FIRE reported at Building Complex, Galle Face Green. Multiple floors involved. Possible entrapment. Dispatching Fire Engine CAE-5678 with full crew. ETA 8 minutes.",
    sender: {
      userId: null, // Will be populated during seeding (dispatcher)
      name: "Kamal Perera",
      role: "dispatcher",
    },
    recipient: {
      type: "crew",
      recipientIds: [], // Will be populated during seeding
      names: ["Nuwan Silva", "Crew Team Alpha"],
    },
    channel: {
      type: "radio",
      frequency: "460.550",
      callSign: "DISPATCH-1",
    },
    incident: {
      incidentId: null, // Will be populated during seeding
      incidentNumber: null, // Auto-generated
    },
    delivery: {
      sentAt: new Date(Date.now() - 1800000),
      deliveredAt: new Date(Date.now() - 1795000),
      readAt: new Date(Date.now() - 1790000),
      acknowledgedAt: new Date(Date.now() - 1785000),
    },
    attachments: [],
  },
  {
    type: "status_change",
    priority: "normal",
    status: "delivered",
    subject: "Medical Emergency - Unit Responding",
    message:
      "MEDICAL EMERGENCY - Cardiac arrest reported at 78 Ward Place, Colombo. Ambulance CAB-9012 dispatched with paramedic crew. Patient CPR in progress by family.",
    sender: {
      userId: null, // Will be populated during seeding (dispatcher)
      name: "Kamal Perera",
      role: "dispatcher",
    },
    recipient: {
      type: "crew",
      recipientIds: [], // Will be populated during seeding
      names: ["Chamara Perera", "Medical Team Bravo"],
    },
    channel: {
      type: "mobile_data",
      frequency: null,
      callSign: "MED-1",
    },
    incident: {
      incidentId: null, // Will be populated during seeding
      incidentNumber: null, // Auto-generated
    },
    delivery: {
      sentAt: new Date(Date.now() - 900000),
      deliveredAt: new Date(Date.now() - 895000),
      readAt: new Date(Date.now() - 890000),
      acknowledgedAt: new Date(Date.now() - 885000),
    },
    attachments: [],
  },
];

// Equipment Check seed data
const equipmentChecks = [
  {
    vehicleId: null, // Will be populated during seeding
    crewId: null, // Will be populated during seeding
    templateId: null, // Will be populated during seeding
    inspection: {
      checkResults: [
        {
          categoryName: "Engine & Mechanical",
          itemName: "Engine Oil Level",
          status: "pass",
          actualValue: "Between MIN and MAX marks",
          notes: "Oil level good, no leaks observed",
          photos: [],
          checkedAt: new Date(),
          checkedBy: null, // Will be populated during seeding
        },
        {
          categoryName: "Engine & Mechanical",
          itemName: "Coolant Level",
          status: "pass",
          actualValue: "Above minimum line",
          notes: "Coolant level adequate",
          photos: [],
          checkedAt: new Date(),
          checkedBy: null, // Will be populated during seeding
        },
        {
          categoryName: "Fire Suppression Equipment",
          itemName: "Water Tank Level",
          status: "pass",
          actualValue: "100% full capacity",
          notes: "Tank at full capacity, pressure normal",
          photos: [],
          checkedAt: new Date(),
          checkedBy: null, // Will be populated during seeding
        },
      ],
      overallStatus: "pass",
      inspectionSummary:
        "All systems operational. Vehicle ready for deployment.",
      deficienciesFound: [],
      correctiveActions: [],
    },
    timing: {
      startedAt: new Date(Date.now() - 3600000), // Started 1 hour ago
      completedAt: new Date(Date.now() - 3300000), // Completed 55 minutes ago
      duration: 5, // 5 minutes
    },
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // [longitude, latitude] - Station location
      },
      address: "Colombo Central Fire Station",
      stationId: null, // Will be populated during seeding
    },
    signatures: {
      crewMember: {
        signedBy: null, // Will be populated during seeding
        signedAt: new Date(Date.now() - 3300000),
        signature: null,
      },
      supervisor: {
        signedBy: null, // Will be populated during seeding
        signedAt: new Date(Date.now() - 3000000),
        signature: null,
        comments: "Equipment inspection completed satisfactorily",
      },
    },
    schedule: {
      scheduledDate: new Date(),
      completedDate: new Date(),
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      frequency: "daily",
      isOverdue: false,
    },
  },
];

// Audit Log seed data
const auditLogs = [
  {
    action: {
      type: "create",
      description: "New incident created via phone call",
      outcome: "success",
    },
    actor: {
      userId: null, // Will be populated during seeding
      username: "kamal.perera", // Add username
      role: "dispatcher", // lowercase
      ipAddress: "192.168.1.100",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Emergency Dispatch System",
    },
    target: {
      entityType: "Incident", // Add entity type
      entityId: null, // Will be populated during seeding
      resourceName: "Structure Fire - Galle Face Green",
      previousValues: null,
      newValues: {
        incidentType: "fire",
        severity: "critical",
        status: "pending",
        location: "Building Complex, Galle Face Green",
      },
    },
    context: {
      sessionId: "sess_" + Math.random().toString(36).substr(2, 9),
      module: "incident_management",
      feature: "create_incident",
      businessContext: {
        callerPhone: "+94771234580",
        reportingMethod: "phone_call",
        urgency: "immediate",
      },
    },
    compliance: {
      dataClassification: "confidential",
      retentionPeriod: 2555, // 7 years in days
      regulatoryFramework: ["Emergency Services Act", "Data Protection Act"],
    },
  },
  {
    action: {
      type: "assign",
      description: "Vehicle and crew assigned to incident",
      outcome: "success",
    },
    actor: {
      userId: null, // Will be populated during seeding
      username: "kamal.perera", // Add username
      role: "dispatcher", // lowercase
      ipAddress: "192.168.1.100",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Emergency Dispatch System",
    },
    target: {
      entityType: "Assignment", // Add entity type
      entityId: null, // Will be populated during seeding
      resourceName: "Fire Engine CAE-5678 Assignment",
      previousValues: null,
      newValues: {
        vehicleId: "CAE-5678",
        primaryCrew: "Nuwan Silva",
        priority: "critical",
        estimatedArrival: "8 minutes",
      },
    },
    context: {
      sessionId: "sess_" + Math.random().toString(36).substr(2, 9),
      module: "assignment_management",
      feature: "assign_resources",
      businessContext: {
        incidentType: "structure_fire",
        resourcesRequested: ["fire_engine", "rescue_crew"],
        responseTime: "immediate",
      },
    },
    compliance: {
      dataClassification: "confidential",
      retentionPeriod: 2555, // 7 years in days
      regulatoryFramework: ["Emergency Services Act"],
    },
  },
];

// Report seed data
const reports = [
  {
    reportId: "RPT-2024-000001",
    title: "Monthly Incident Response Performance Analysis",
    type: "performance_analysis",
    category: "operational",
    description:
      "Comprehensive analysis of response times, resource utilization, and incident outcomes for the month of September 2024.",
    content: {
      executiveSummary:
        "Overall response performance improved by 12% compared to previous month. Average response time reduced to 6.8 minutes.",
      methodology:
        "Analysis based on incident logs, GPS tracking data, and crew performance metrics.",
      keyFindings: [
        "Average response time: 6.8 minutes (target: 8 minutes)",
        "Incident resolution rate: 94.2%",
        "Resource utilization: 78% optimal",
        "Critical incidents handled: 47 (85% success rate)",
      ],
      recommendations: [
        "Deploy additional ambulance unit in Kandy district",
        "Implement predictive maintenance for vehicles",
        "Conduct additional training for new crew members",
      ],
      dataVisualization: {
        chartTypes: ["line_chart", "bar_chart", "pie_chart"],
        dataPoints: 156,
        timeRange: "September 1-30, 2024",
      },
    },
    metadata: {
      generatedBy: null, // Will be populated during seeding
      generatedAt: new Date(Date.now() - 172800000), // 2 days ago
      approvedBy: null, // Will be populated during seeding
      approvedAt: new Date(Date.now() - 86400000), // 1 day ago
      version: "1.2",
      tags: ["performance", "monthly", "analysis", "response_times"],
      confidentialityLevel: "internal",
    },
    distribution: {
      recipients: [
        {
          name: "Emergency Services Director",
          email: "director@emergency.gov.lk",
          role: "Administrator",
          deliveredAt: new Date(Date.now() - 86400000),
        },
        {
          name: "Station Commanders",
          email: "commanders@emergency.gov.lk",
          role: "Management",
          deliveredAt: new Date(Date.now() - 86400000),
        },
      ],
      publicationChannel: ["internal_portal", "email"],
      accessLevel: "management",
    },
    schedule: {
      frequency: "monthly",
      nextGeneration: new Date(Date.now() + 2592000000), // Next month
      isRecurring: true,
      automatedGeneration: false,
    },
    status: {
      current: "published",
      publishedAt: new Date(Date.now() - 86400000),
      lastModified: new Date(Date.now() - 43200000),
      isArchived: false,
    },
    data: {
      period: {
        startDate: new Date(2024, 8, 1), // September 1, 2024
        endDate: new Date(2024, 8, 30), // September 30, 2024
      },
    },
    generation: {
      method: "automated",
      processingTime: 3500,
    },
  },
];

// Shift seed data
const shifts = [
  {
    shift: {
      name: "Day Shift Alpha",
      type: "regular",
    },
    schedule: {
      startTime: "08:00",
      endTime: "20:00",
      date: new Date(),
      duration: 12,
      recurrence: "daily",
    },
    staffing: {
      requiredCrewCount: 3,
      requiredRoles: ["Firefighter", "Driver", "EMT"],
      minimumCertificationLevel: "Basic",
      assignedCrew: [], // Will be populated during seeding
    },
    supervision: {
      supervisorId: null, // Will be populated during seeding
      supervisorNotes:
        "Regular day shift operations with focus on community safety",
    },
    status: {
      current: "planned",
    },
    stationId: null, // Will be populated during seeding
    metrics: {
      incidentsHandled: 0,
    },
    audit: {
      createdBy: null, // Will be populated during seeding
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    shift: {
      name: "Night Shift Beta",
      type: "regular",
    },
    schedule: {
      startTime: "20:00",
      endTime: "08:00",
      date: new Date(Date.now() + 86400000), // Tomorrow
      duration: 12,
      recurrence: "daily",
    },
    staffing: {
      requiredCrewCount: 2,
      requiredRoles: ["Firefighter", "Paramedic"],
      minimumCertificationLevel: "Intermediate",
      assignedCrew: [], // Will be populated during seeding
    },
    supervision: {
      supervisorId: null, // Will be populated during seeding
      supervisorNotes: "Night shift coverage with emergency response priority",
    },
    status: {
      current: "planned",
    },
    stationId: null, // Will be populated during seeding
    metrics: {
      incidentsHandled: 0,
    },
    audit: {
      createdBy: null, // Will be populated during seeding
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

module.exports = {
  users,
  stations,
  vehicles,
  crew,
  equipmentTemplates,
  incidents,
  assignments,
  communications,
  equipmentChecks,
  auditLogs,
  reports,
  shifts,
};
