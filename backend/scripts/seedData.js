const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * Seed data for Emergency Dispatch System
 * Contains realistic Sri Lankan emergency service data for development and testing
 */

// User seed data with Sri Lankan context
const users = [
  {
    username: "admin.colombo",
    email: "admin@respondr.lk",
    password: "$2a$12$LQv3c1yqBwEHFx6Zt1LgXO5UVKPvJrC5C2jN4kXJm7H8XPKqp5mCe", // bcrypt hash for "Admin123!"
    personal: {
      firstName: "Priya",
      lastName: "Fernando",
      dateOfBirth: new Date("1985-03-15"),
      gender: "female",
      address: {
        street: "45 Independence Avenue",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00700",
        country: "Sri Lanka",
      },
      phone: "+94771234567",
      emergencyContact: {
        name: "Sunil Fernando",
        phone: "+94771234568",
        relationship: "Husband",
      },
    },
    auth: {
      role: "admin",
      permissions: [
        "manage_users",
        "manage_incidents",
        "manage_resources",
        "view_reports",
      ],
      isActive: true,
      lastLogin: new Date(),
      loginHistory: [
        {
          timestamp: new Date(),
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
        },
      ],
    },
    settings: {
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
      dashboard: {
        defaultView: "incidents",
        refreshInterval: 30,
        showCriticalOnly: false,
      },
      language: "en",
      timezone: "Asia/Colombo",
    },
  },
  {
    username: "dispatcher.central",
    email: "dispatch@respondr.lk",
    password: "$2a$12$LQv3c1yqBwEHFx6Zt1LgXO5UVKPvJrC5C2jN4kXJm7H8XPKqp5mCe", // "Dispatch123!"
    personal: {
      firstName: "Kamal",
      lastName: "Perera",
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
      emergencyContact: {
        name: "Mala Perera",
        phone: "+94771234570",
        relationship: "Wife",
      },
    },
    auth: {
      role: "dispatcher",
      permissions: ["manage_incidents", "dispatch_resources", "view_resources"],
      isActive: true,
      lastLogin: new Date(),
      loginHistory: [],
    },
    settings: {
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
      dashboard: {
        defaultView: "dispatch",
        refreshInterval: 15,
        showCriticalOnly: true,
      },
      language: "en",
      timezone: "Asia/Colombo",
    },
  },
];

// Station seed data for Sri Lanka
const stations = [
  {
    stationInfo: {
      stationId: "STN-COL-001",
      name: "Colombo Central Fire Station",
      type: "fire_rescue",
      established: new Date("1950-05-01"),
      commander: null, // Will be populated after user creation
      contactInfo: {
        phone: "+94112345678",
        email: "colombo.central@fire.gov.lk",
        emergencyLine: "110",
      },
    },
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // Colombo Central
      },
      address: "25 Chatham Street, Colombo 01",
      district: "Colombo",
      province: "Western Province",
    },
    coverage: {
      primaryArea: {
        type: "Polygon",
        coordinates: [
          [
            [79.84, 6.9],
            [79.88, 6.9],
            [79.88, 6.95],
            [79.84, 6.95],
            [79.84, 6.9],
          ],
        ],
      },
      maxResponseDistance: 15000,
      populationServed: 250000,
    },
    capacity: {
      personnel: {
        onDutyCapacity: 12,
        currentOnDuty: 8,
        totalCapacity: 24,
      },
      vehicles: {
        totalBays: 6,
        occupiedBays: 4,
        availableBays: 2,
      },
      equipment: {
        totalValue: 15000000,
        lastInventory: new Date("2024-01-15"),
        criticalEquipment: ["ladder_truck", "pumper", "rescue_equipment"],
      },
    },
    resources: {
      vehicles: [], // Will be populated after vehicle creation
      equipment: [
        { name: "Hydraulic Rescue Tools", quantity: 2, status: "operational" },
        { name: "High Pressure Hoses", quantity: 8, status: "operational" },
        { name: "Oxygen Tanks", quantity: 12, status: "operational" },
      ],
      specialCapabilities: [
        "high_rise_rescue",
        "hazmat_response",
        "water_rescue",
      ],
    },
    operational: {
      status: "active",
      operationalHours: "24/7",
      lastInspection: new Date("2024-02-01"),
      nextInspection: new Date("2024-05-01"),
      certifications: ["ISO_9001", "NFPA_Compliant"],
    },
    statistics: {
      totalResponses: 1250,
      avgResponseTime: 6.5,
      successRate: 95.2,
      lastUpdated: new Date(),
    },
  },
  {
    stationInfo: {
      stationId: "STN-KANDY-001",
      name: "Kandy Fire Station",
      type: "fire_rescue",
      established: new Date("1955-08-10"),
      commander: null,
      contactInfo: {
        phone: "+94812345679",
        email: "kandy.station@fire.gov.lk",
        emergencyLine: "110",
      },
    },
    location: {
      coordinates: {
        type: "Point",
        coordinates: [80.6337, 7.2906], // Kandy
      },
      address: "15 Queens Road, Kandy",
      district: "Kandy",
      province: "Central Province",
    },
    coverage: {
      primaryArea: {
        type: "Polygon",
        coordinates: [
          [
            [80.6, 7.25],
            [80.67, 7.25],
            [80.67, 7.33],
            [80.6, 7.33],
            [80.6, 7.25],
          ],
        ],
      },
      maxResponseDistance: 20000,
      populationServed: 180000,
    },
    capacity: {
      personnel: {
        onDutyCapacity: 10,
        currentOnDuty: 6,
        totalCapacity: 20,
      },
      vehicles: {
        totalBays: 4,
        occupiedBays: 3,
        availableBays: 1,
      },
      equipment: {
        totalValue: 8000000,
        lastInventory: new Date("2024-01-20"),
        criticalEquipment: ["pumper", "rescue_vehicle"],
      },
    },
    resources: {
      vehicles: [],
      equipment: [
        { name: "Forest Fire Equipment", quantity: 1, status: "operational" },
        { name: "Water Pumps", quantity: 4, status: "operational" },
        { name: "First Aid Kits", quantity: 6, status: "operational" },
      ],
      specialCapabilities: ["forest_fire", "mountain_rescue"],
    },
    operational: {
      status: "active",
      operationalHours: "24/7",
      lastInspection: new Date("2024-02-05"),
      nextInspection: new Date("2024-05-05"),
      certifications: ["NFPA_Compliant"],
    },
    statistics: {
      totalResponses: 680,
      avgResponseTime: 8.2,
      successRate: 92.8,
      lastUpdated: new Date(),
    },
  },
];

// Vehicle seed data
const vehicles = [
  {
    registration: {
      plateNumber: "CAE-5678",
      vehicleType: "fire_truck",
      registrationDate: new Date("2020-03-15"),
      expiryDate: new Date("2025-03-15"),
      registrationAuthority: "Department of Motor Traffic - Sri Lanka",
    },
    specifications: {
      make: "Isuzu",
      model: "NPR Fire Truck",
      year: 2020,
      engineNumber: "6HK1-12345",
      chassisNumber: "NPR85-67890",
      fuelType: "diesel",
      capacity: {
        crew: 6,
        waterTank: 3000, // liters
        equipment: 500, // kg
      },
      dimensions: {
        length: 8.5,
        width: 2.4,
        height: 3.2,
        weight: 12000,
      },
    },
    equipment: {
      standard: [
        { name: "Water Pump", quantity: 1, status: "operational" },
        { name: "Hoses", quantity: 8, status: "operational" },
        { name: "Ladders", quantity: 2, status: "operational" },
        { name: "Fire Extinguishers", quantity: 4, status: "operational" },
      ],
      specialized: [
        { name: "Hydraulic Cutter", quantity: 1, status: "operational" },
        { name: "Oxygen Tank", quantity: 2, status: "operational" },
      ],
      safety: [
        { name: "Helmets", quantity: 6, status: "operational" },
        { name: "Protective Suits", quantity: 6, status: "operational" },
      ],
    },
    status: {
      operational: "Available",
      fuelLevel: 85,
      mileage: 45230,
      lastMaintenance: new Date("2024-01-15"),
      nextMaintenance: new Date("2024-04-15"),
      currentLocation: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // At Colombo Central Station
      },
      lastUpdate: new Date(),
    },
    assignment: {
      currentStation: null, // Will be populated after station creation
      assignedCrewId: [],
      currentShift: null,
      assignmentDate: new Date(),
    },
  },
  {
    registration: {
      plateNumber: "CAB-9012",
      vehicleType: "ambulance",
      registrationDate: new Date("2021-06-10"),
      expiryDate: new Date("2026-06-10"),
      registrationAuthority: "Department of Motor Traffic - Sri Lanka",
    },
    specifications: {
      make: "Toyota",
      model: "Hiace Ambulance",
      year: 2021,
      engineNumber: "1KD-34567",
      chassisNumber: "TRH200-12345",
      fuelType: "diesel",
      capacity: {
        crew: 3,
        patients: 2,
        equipment: 300,
      },
      dimensions: {
        length: 5.9,
        width: 1.9,
        height: 2.3,
        weight: 3500,
      },
    },
    equipment: {
      medical: [
        { name: "Defibrillator", quantity: 1, status: "operational" },
        { name: "Oxygen Concentrator", quantity: 1, status: "operational" },
        { name: "Stretcher", quantity: 2, status: "operational" },
        { name: "First Aid Kit", quantity: 2, status: "operational" },
      ],
      communication: [
        { name: "Radio System", quantity: 1, status: "operational" },
        { name: "GPS Device", quantity: 1, status: "operational" },
      ],
      safety: [
        { name: "Fire Extinguisher", quantity: 1, status: "operational" },
        { name: "Emergency Lights", quantity: 4, status: "operational" },
      ],
    },
    status: {
      operational: "Available",
      fuelLevel: 78,
      mileage: 28450,
      lastMaintenance: new Date("2024-02-01"),
      nextMaintenance: new Date("2024-05-01"),
      currentLocation: {
        type: "Point",
        coordinates: [80.6337, 7.2906], // At Kandy Station
      },
      lastUpdate: new Date(),
    },
    assignment: {
      currentStation: null,
      assignedCrewId: [],
      currentShift: null,
      assignmentDate: new Date(),
    },
  },
];

// Crew seed data
const crew = [
  {
    personal: {
      firstName: "Nuwan",
      lastName: "Silva",
      dateOfBirth: new Date("1985-11-20"),
      gender: "male",
      nationalId: "198532301234V",
      address: {
        street: "67 Baseline Road",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00900",
        country: "Sri Lanka",
      },
      phone: "+94771234571",
      email: "nuwan.silva@fire.gov.lk",
      emergencyContact: [
        {
          name: "Sanduni Silva",
          phone: "+94771234572",
          relationship: "Wife",
        },
      ],
    },
    professional: {
      employeeId: "FD-COL-001",
      role: "crew_chief",
      department: "Fire Department",
      rank: "Senior Firefighter",
      hireDate: new Date("2008-04-01"),
      experienceYears: 16,
      salary: {
        basic: 85000,
        allowances: 25000,
        currency: "LKR",
      },
      certifications: [
        {
          name: "Fire Safety Level 3",
          issuedBy: "Sri Lanka Fire Services",
          issuedDate: new Date("2020-06-01"),
          expiryDate: new Date("2025-06-01"),
          isActive: true,
        },
        {
          name: "Emergency Medical Technician",
          issuedBy: "Ministry of Health",
          issuedDate: new Date("2019-03-15"),
          expiryDate: new Date("2024-03-15"),
          isActive: true,
        },
      ],
      specializations: ["fire_suppression", "rescue_operations", "hazmat"],
      performanceRating: 4.6,
    },
    currentStatus: {
      availability: "available",
      location: {
        type: "Point",
        coordinates: [79.8612, 6.9271],
      },
      shiftId: null,
      lastUpdate: new Date(),
    },
    assignment: {
      currentStation: null,
      assignedVehicles: [],
      currentIncidents: [],
    },
    settings: {
      notifications: {
        sms: true,
        email: true,
        push: true,
      },
      preferences: {
        language: "en",
        timezone: "Asia/Colombo",
      },
    },
  },
  {
    personal: {
      firstName: "Anura",
      lastName: "Wickramasinghe",
      dateOfBirth: new Date("1990-08-12"),
      gender: "male",
      nationalId: "199022401567V",
      address: {
        street: "128 Kandy Road",
        city: "Kadawatha",
        province: "Western Province",
        postalCode: "11850",
        country: "Sri Lanka",
      },
      phone: "+94771234573",
      email: "anura.w@fire.gov.lk",
      emergencyContact: [
        {
          name: "Chamari Wickramasinghe",
          phone: "+94771234574",
          relationship: "Wife",
        },
      ],
    },
    professional: {
      employeeId: "FD-COL-002",
      role: "crew_member",
      department: "Fire Department",
      rank: "Firefighter",
      hireDate: new Date("2015-09-01"),
      experienceYears: 9,
      salary: {
        basic: 68000,
        allowances: 18000,
        currency: "LKR",
      },
      certifications: [
        {
          name: "Fire Safety Level 2",
          issuedBy: "Sri Lanka Fire Services",
          issuedDate: new Date("2018-04-01"),
          expiryDate: new Date("2023-04-01"),
          isActive: false,
        },
        {
          name: "First Aid Certification",
          issuedBy: "Sri Lanka Red Cross",
          issuedDate: new Date("2022-01-10"),
          expiryDate: new Date("2025-01-10"),
          isActive: true,
        },
      ],
      specializations: ["fire_suppression", "technical_rescue"],
      performanceRating: 4.2,
    },
    currentStatus: {
      availability: "available",
      location: {
        type: "Point",
        coordinates: [79.8612, 6.9271],
      },
      shiftId: null,
      lastUpdate: new Date(),
    },
    assignment: {
      currentStation: null,
      assignedVehicles: [],
      currentIncidents: [],
    },
    settings: {
      notifications: {
        sms: true,
        email: false,
        push: true,
      },
      preferences: {
        language: "si",
        timezone: "Asia/Colombo",
      },
    },
  },
];

// Equipment Checklist Templates
const equipmentTemplates = [
  {
    vehicleType: "fire_truck",
    template: {
      name: "Fire Truck Daily Inspection",
      description: "Comprehensive daily inspection checklist for fire trucks",
      version: "2.1",
    },
    categories: [
      {
        name: "Engine & Mechanical",
        items: [
          {
            name: "Engine Oil Level",
            checkType: "visual_check",
            expectedValue: "Between MIN and MAX",
            required: true,
          },
          {
            name: "Coolant Level",
            checkType: "visual_check",
            expectedValue: "Above minimum line",
            required: true,
          },
          {
            name: "Brake Fluid Level",
            checkType: "visual_check",
            expectedValue: "Above minimum line",
            required: true,
          },
        ],
      },
      {
        name: "Fire Fighting Equipment",
        items: [
          {
            name: "Water Tank Capacity",
            checkType: "measurement",
            expectedValue: "3000L",
            required: true,
          },
          {
            name: "Pump Pressure Test",
            checkType: "measurement",
            expectedValue: "150 PSI",
            required: true,
          },
          {
            name: "Hose Condition",
            checkType: "visual_check",
            expectedValue: "No cracks or damage",
            required: true,
          },
        ],
      },
      {
        name: "Safety Equipment",
        items: [
          {
            name: "Helmets Count",
            checkType: "count",
            expectedValue: "6",
            required: true,
          },
          {
            name: "Oxygen Tanks Pressure",
            checkType: "measurement",
            expectedValue: "2000 PSI",
            required: true,
          },
        ],
      },
    ],
    settings: {
      isActive: true,
      isDefault: true,
      requiredSignatures: ["crew_member", "supervisor"],
    },
    usage: {
      timesUsed: 145,
      lastUsed: new Date("2024-02-15"),
      averageCompletionTime: 25,
    },
    audit: {
      createdAt: new Date("2023-01-01"),
      createdBy: null,
      updatedAt: new Date("2024-01-15"),
      updatedBy: null,
    },
  },
];

// Sample incidents for testing
const incidents = [
  {
    incidentNumber: "INC-2024-000001",
    caller: {
      name: "Saman Kumara",
      phone: "+94771234580",
      location: {
        coordinates: {
          type: "Point",
          coordinates: [79.8652, 6.9181],
        },
        address: "45 Galle Face Green, Colombo 03",
      },
      relationship: "witness",
    },
    incident: {
      type: "fire",
      subType: "building_fire",
      severity: 4,
      description:
        "Large fire at commercial building. Multiple floors affected. Possible people trapped.",
      hazards: ["electrical", "structural_collapse"],
      estimatedLoss: 2500000,
    },
    location: {
      coordinates: {
        type: "Point",
        coordinates: [79.8652, 6.9181],
      },
      address: "Building Complex, Galle Face Green, Colombo 03",
      landmarks: "Near Galle Face Hotel",
      accessNotes: "Main entrance blocked, use side entrance",
    },
    status: {
      current: "On Scene",
      priority: "high",
      history: [
        {
          status: "Received",
          timestamp: new Date(Date.now() - 3600000),
          updatedBy: null,
          notes: "Initial call received",
        },
        {
          status: "Dispatched",
          timestamp: new Date(Date.now() - 3300000),
          updatedBy: null,
          notes: "Units dispatched to scene",
        },
        {
          status: "En Route",
          timestamp: new Date(Date.now() - 3000000),
          updatedBy: null,
          notes: "Units en route",
        },
        {
          status: "On Scene",
          timestamp: new Date(Date.now() - 2400000),
          updatedBy: null,
          notes: "First unit arrived on scene",
        },
      ],
    },
    timeline: {
      reportedAt: new Date(Date.now() - 3600000),
      dispatchedAt: new Date(Date.now() - 3300000),
      enRouteAt: new Date(Date.now() - 3000000),
      arrivedAt: new Date(Date.now() - 2400000),
      controlledAt: null,
      clearedAt: null,
    },
    assignment: {
      vehicleId: null,
      primaryCrewId: null,
      additionalCrew: [],
      assignedBy: null,
      assignedAt: new Date(Date.now() - 3300000),
    },
    communication: {
      initialCall: {
        duration: 180,
        callerId: "+94771234580",
        operatorId: null,
      },
      updates: [
        {
          timestamp: new Date(Date.now() - 3300000),
          message: "Fire truck dispatched",
          priority: "high",
        },
        {
          timestamp: new Date(Date.now() - 2400000),
          message: "First unit on scene, requesting additional resources",
          priority: "urgent",
        },
      ],
    },
    resources: {
      required: {
        vehicles: 2,
        personnel: 8,
        specialEquipment: ["ladder_truck", "rescue_equipment"],
      },
      deployed: {
        vehicles: 1,
        personnel: 4,
        specialEquipment: [],
      },
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
};
