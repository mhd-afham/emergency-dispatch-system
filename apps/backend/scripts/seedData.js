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
      employeeId: "EMP000020",
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
      password: "DisMoh168202",
      role: "Dispatcher",
      employeeId: "EMP000022",
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
      employeeId: "EMP000023",
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
      employeeId: "EMP000024",
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
  // FIELD CREW LEADERS (20 users matching crew leaders with isLeader: true)
  // Employee IDs: EMP000001-EMP000019 and EMP000021
  {
    personal: {
      firstName: "Nuwan",
      lastName: "Silva",
      email: "nuwan.silva@respondr.lk",
      dateOfBirth: new Date("1982-05-10"),
      gender: "male",
      address: {
        street: "12 Chatham Street",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00100",
        country: "Sri Lanka",
      },
      phone: "+94771234501",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000021",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Chamara",
      lastName: "Jayasinghe",
      email: "chamara.jayasinghe@respondr.lk",
      dateOfBirth: new Date("1984-02-15"),
      gender: "male",
      address: {
        street: "67 Peradeniya Road",
        city: "Kandy",
        province: "Central Province",
        postalCode: "20000",
        country: "Sri Lanka",
      },
      phone: "+94771234503",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000001",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Ravindra",
      lastName: "Fernando",
      email: "ravindra.fernando@respondr.lk",
      dateOfBirth: new Date("1986-09-20"),
      gender: "male",
      address: {
        street: "23 Lighthouse Street",
        city: "Galle",
        province: "Southern Province",
        postalCode: "80000",
        country: "Sri Lanka",
      },
      phone: "+94771234505",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000002",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Asanka",
      lastName: "Rajapaksa",
      email: "asanka.rajapaksa@respondr.lk",
      dateOfBirth: new Date("1983-07-08"),
      gender: "male",
      address: {
        street: "45 Matara Road",
        city: "Matara",
        province: "Southern Province",
        postalCode: "81000",
        country: "Sri Lanka",
      },
      phone: "+94771234507",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000003",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Mahinda",
      lastName: "Wijeratne",
      email: "mahinda.wijeratne@respondr.lk",
      dateOfBirth: new Date("1985-11-14"),
      gender: "male",
      address: {
        street: "78 Sacred City Road",
        city: "Anuradhapura",
        province: "North Central Province",
        postalCode: "50000",
        country: "Sri Lanka",
      },
      phone: "+94771234509",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000004",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Chaminda",
      lastName: "Perera",
      email: "chaminda.perera@respondr.lk",
      dateOfBirth: new Date("1989-06-25"),
      gender: "male",
      address: {
        street: "34 Galle Road",
        city: "Mount Lavinia",
        province: "Western Province",
        postalCode: "10370",
        country: "Sri Lanka",
      },
      phone: "+94771234511",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000005",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Suresh",
      lastName: "Mendis",
      email: "suresh.mendis@respondr.lk",
      dateOfBirth: new Date("1987-04-18"),
      gender: "male",
      address: {
        street: "89 Main Street",
        city: "Matale",
        province: "Central Province",
        postalCode: "21000",
        country: "Sri Lanka",
      },
      phone: "+94771234513",
    },
    auth: {
      password: "SureMend845",
      role: "Field Crew",
      employeeId: "EMP000006",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Priyantha",
      lastName: "Gunasekara",
      email: "priyantha.gunasekara@respondr.lk",
      dateOfBirth: new Date("1988-12-03"),
      gender: "male",
      address: {
        street: "56 Station Road",
        city: "Dehiwala",
        province: "Western Province",
        postalCode: "10350",
        country: "Sri Lanka",
      },
      phone: "+94771234515",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000007",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Lakmal",
      lastName: "Wijesuriya",
      email: "lakmal.wijesuriya@respondr.lk",
      dateOfBirth: new Date("1990-01-28"),
      gender: "male",
      address: {
        street: "12 Beach Road",
        city: "Hikkaduwa",
        province: "Southern Province",
        postalCode: "80240",
        country: "Sri Lanka",
      },
      phone: "+94771234517",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000008",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Kamal",
      lastName: "Ratnayake",
      email: "kamal.ratnayake@respondr.lk",
      dateOfBirth: new Date("1986-10-12"),
      gender: "male",
      address: {
        street: "34 Ancient City Road",
        city: "Polonnaruwa",
        province: "North Central Province",
        postalCode: "51000",
        country: "Sri Lanka",
      },
      phone: "+94771234519",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000009",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Upul",
      lastName: "Bandara",
      email: "upul.bandara@respondr.lk",
      dateOfBirth: new Date("1991-03-22"),
      gender: "male",
      address: {
        street: "67 Harbour Road",
        city: "Trincomalee",
        province: "Eastern Province",
        postalCode: "31000",
        country: "Sri Lanka",
      },
      phone: "+94771234521",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000010",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Ajith",
      lastName: "Kumara",
      email: "ajith.kumara@respondr.lk",
      dateOfBirth: new Date("1988-07-15"),
      gender: "male",
      address: {
        street: "23 Galle Road",
        city: "Bentota",
        province: "Southern Province",
        postalCode: "80500",
        country: "Sri Lanka",
      },
      phone: "+94771234523",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000011",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Saman",
      lastName: "Wickramasinghe",
      email: "saman.wickramasinghe@respondr.lk",
      dateOfBirth: new Date("1985-04-20"),
      gender: "male",
      address: {
        street: "45 Lewis Place",
        city: "Negombo",
        province: "Western Province",
        postalCode: "11500",
        country: "Sri Lanka",
      },
      phone: "+94771234525",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000012",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Tharaka",
      lastName: "Senanayake",
      email: "tharaka.senanayake@respondr.lk",
      dateOfBirth: new Date("1987-08-30"),
      gender: "male",
      address: {
        street: "12 Galle Road",
        city: "Ratmalana",
        province: "Western Province",
        postalCode: "10390",
        country: "Sri Lanka",
      },
      phone: "+94771234527",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000013",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Dinesh",
      lastName: "Ratnayake",
      email: "dinesh.ratnayake@respondr.lk",
      dateOfBirth: new Date("1984-12-05"),
      gender: "male",
      address: {
        street: "78 William Gopallawa Mawatha",
        city: "Peradeniya",
        province: "Central Province",
        postalCode: "20400",
        country: "Sri Lanka",
      },
      phone: "+94771234529",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000014",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Janaka",
      lastName: "Dissanayake",
      email: "janaka.dissanayake@respondr.lk",
      dateOfBirth: new Date("1989-05-18"),
      gender: "male",
      address: {
        street: "34 Main Street",
        city: "Batticaloa",
        province: "Eastern Province",
        postalCode: "30000",
        country: "Sri Lanka",
      },
      phone: "+94771234531",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000015",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Roshan",
      lastName: "Cooray",
      email: "roshan.cooray@respondr.lk",
      dateOfBirth: new Date("1988-01-30"),
      gender: "male",
      address: {
        street: "56 Galle Road",
        city: "Ambalangoda",
        province: "Southern Province",
        postalCode: "80300",
        country: "Sri Lanka",
      },
      phone: "+94771234533",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000016",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Nimal",
      lastName: "Jayawardena",
      email: "nimal.jayawardena@respondr.lk",
      dateOfBirth: new Date("1982-06-12"),
      gender: "male",
      address: {
        street: "23 Colombo Fort",
        city: "Colombo",
        province: "Western Province",
        postalCode: "00100",
        country: "Sri Lanka",
      },
      phone: "+94771234535",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000017",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Susil",
      lastName: "Fonseka",
      email: "susil.fonseka@respondr.lk",
      dateOfBirth: new Date("1986-04-25"),
      gender: "male",
      address: {
        street: "45 Dalada Veediya",
        city: "Kandy",
        province: "Central Province",
        postalCode: "20000",
        country: "Sri Lanka",
      },
      phone: "+94771234537",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000018",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
  {
    personal: {
      firstName: "Gamini",
      lastName: "Silva",
      email: "gamini.silva@respondr.lk",
      dateOfBirth: new Date("1990-08-15"),
      gender: "male",
      address: {
        street: "67 Main Street",
        city: "Galle",
        province: "Southern Province",
        postalCode: "80000",
        country: "Sri Lanka",
      },
      phone: "+94771234539",
    },
    auth: {
      password: "crew12345",
      role: "Field Crew",
      employeeId: "EMP000019",
    },
    settings: {
      isActive: true,
      emailVerified: true,
    },
  },
];

// Station seed data for Sri Lanka
const stations = [
  {
    stationName: "Colombo Central Emergency Station",
    address: "25 Chatham Street, Colombo 01, Sri Lanka",
    coordinates: { type: "Point", coordinates: [79.8612, 6.9271] }, // Vehicle FE-2301
    province: "Western",
    contactPhone: "+94112345001",
    contactEmail: "colombo.central@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 15, districts: ["Colombo"], cities: ["Colombo"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Kandy Central Emergency Station",
    address: "45 Dalada Veediya, Kandy, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.6337, 7.2906] }, // Vehicle FE-2302
    province: "Central",
    contactPhone: "+94812345002",
    contactEmail: "kandy.central@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Kandy"], cities: ["Kandy"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Galle Emergency Station",
    address: "Main Street, Galle, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.217, 6.0535] }, // Vehicle FE-2303
    province: "Southern",
    contactPhone: "+94912345003",
    contactEmail: "galle@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Galle"], cities: ["Galle"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Matara Emergency Station",
    address: "Beach Road, Matara, Sri Lanka",
    coordinates: { type: "Point", coordinates: [81.2085, 6.032] }, // Vehicle FE-2304
    province: "Southern",
    contactPhone: "+94412345004",
    contactEmail: "matara@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Matara"], cities: ["Matara"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Anuradhapura Emergency Station",
    address: "Sacred City Road, Anuradhapura, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.4037, 8.3114] }, // Vehicle FE-2305
    province: "North Central",
    contactPhone: "+94252345005",
    contactEmail: "anuradhapura@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: {
      radius: 25,
      districts: ["Anuradhapura"],
      cities: ["Anuradhapura"],
    },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Mount Lavinia Emergency Station",
    address: "Galle Road, Mount Lavinia, Sri Lanka",
    coordinates: { type: "Point", coordinates: [79.9072, 6.8421] }, // Vehicle AM-1201
    province: "Western",
    contactPhone: "+94112345006",
    contactEmail: "mtlavinia@emergency.lk",
    stationType: "Ambulance Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: {
      radius: 15,
      districts: ["Colombo"],
      cities: ["Mount Lavinia", "Dehiwala"],
    },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Matale Emergency Station",
    address: "Temple Road, Matale, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.7718, 7.4818] }, // Vehicle AM-1202
    province: "Central",
    contactPhone: "+94662345007",
    contactEmail: "matale@emergency.lk",
    stationType: "Ambulance Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Matale"], cities: ["Matale"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Dehiwala Emergency Station",
    address: "Galle Road, Dehiwala, Sri Lanka",
    coordinates: { type: "Point", coordinates: [79.8774, 6.7077] }, // Vehicle AM-1203
    province: "Western",
    contactPhone: "+94112345008",
    contactEmail: "dehiwala@emergency.lk",
    stationType: "Ambulance Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 15, districts: ["Colombo"], cities: ["Dehiwala"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Hikkaduwa Emergency Station",
    address: "Beach Road, Hikkaduwa, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.3964, 5.9549] }, // Vehicle AM-1204
    province: "Southern",
    contactPhone: "+94912345009",
    contactEmail: "hikkaduwa@emergency.lk",
    stationType: "Ambulance Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Galle"], cities: ["Hikkaduwa"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Polonnaruwa Emergency Station",
    address: "Ancient City Road, Polonnaruwa, Sri Lanka",
    coordinates: { type: "Point", coordinates: [81.0104, 7.9553] }, // Vehicle AM-1205
    province: "North Central",
    contactPhone: "+94272345010",
    contactEmail: "polonnaruwa@emergency.lk",
    stationType: "Ambulance Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: {
      radius: 25,
      districts: ["Polonnaruwa"],
      cities: ["Polonnaruwa"],
    },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Trincomalee Emergency Station",
    address: "Harbor Road, Trincomalee, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.5932, 8.5604] }, // Vehicle AM-1206
    province: "Eastern",
    contactPhone: "+94262345011",
    contactEmail: "trincomalee@emergency.lk",
    stationType: "Ambulance Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: {
      radius: 25,
      districts: ["Trincomalee"],
      cities: ["Trincomalee"],
    },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Bentota Emergency Station",
    address: "Coastal Road, Bentota, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.7429, 6.0367] }, // Vehicle AM-1207
    province: "Southern",
    contactPhone: "+94342345012",
    contactEmail: "bentota@emergency.lk",
    stationType: "Ambulance Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Kalutara"], cities: ["Bentota"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Negombo Emergency Station",
    address: "Airport Road, Negombo, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.0259, 6.9344] }, // Vehicle RV-3401
    province: "Western",
    contactPhone: "+94312345013",
    contactEmail: "negombo@emergency.lk",
    stationType: "Rescue Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Gampaha"], cities: ["Negombo"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Ratmalana Emergency Station",
    address: "Airport Road, Ratmalana, Sri Lanka",
    coordinates: { type: "Point", coordinates: [79.9278, 6.8649] }, // Vehicle RV-3402
    province: "Western",
    contactPhone: "+94112345014",
    contactEmail: "ratmalana@emergency.lk",
    stationType: "Rescue Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 15, districts: ["Colombo"], cities: ["Ratmalana"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Peradeniya Emergency Station",
    address: "University Road, Peradeniya, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.7747, 7.2944] }, // Vehicle RV-3403
    province: "Central",
    contactPhone: "+94812345015",
    contactEmail: "peradeniya@emergency.lk",
    stationType: "Rescue Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Kandy"], cities: ["Peradeniya"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Batticaloa Emergency Station",
    address: "Lagoon Road, Batticaloa, Sri Lanka",
    coordinates: { type: "Point", coordinates: [81.8313, 6.9271] }, // Vehicle RV-3404
    province: "Eastern",
    contactPhone: "+94652345016",
    contactEmail: "batticaloa@emergency.lk",
    stationType: "Rescue Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: {
      radius: 25,
      districts: ["Batticaloa"],
      cities: ["Batticaloa"],
    },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Ambalangoda Emergency Station",
    address: "Beach Road, Ambalangoda, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.3403, 6.4027] }, // Vehicle RV-3405
    province: "Southern",
    contactPhone: "+94912345017",
    contactEmail: "ambalangoda@emergency.lk",
    stationType: "Rescue Station",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Galle"], cities: ["Ambalangoda"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Colombo Fort Emergency Station",
    address: "Fort Station Road, Colombo 01, Sri Lanka",
    coordinates: { type: "Point", coordinates: [79.8597, 6.9271] }, // Vehicle PV-4501
    province: "Western",
    contactPhone: "+94112345018",
    contactEmail: "colombo.fort@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: {
      radius: 15,
      districts: ["Colombo"],
      cities: ["Colombo Fort"],
    },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Kandy Police Emergency Station",
    address: "Police Road, Kandy, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.6423, 7.2927] }, // Vehicle PV-4502
    province: "Central",
    contactPhone: "+94812345019",
    contactEmail: "kandy.police@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Kandy"], cities: ["Kandy"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
  {
    stationName: "Galle Police Emergency Station",
    address: "Police Station Road, Galle, Sri Lanka",
    coordinates: { type: "Point", coordinates: [80.217, 6.0328] }, // Vehicle PV-4503
    province: "Southern",
    contactPhone: "+94912345020",
    contactEmail: "galle.police@emergency.lk",
    stationType: "Multi-Purpose",
    capacity: { vehicleCapacity: 5, crewCapacity: 20 },
    operatingHours: { is24Hours: true, openTime: "00:00", closeTime: "23:59" },
    coverageArea: { radius: 20, districts: ["Galle"], cities: ["Galle"] },
    stationCommander: null,
    currentResources: {
      activeVehicles: 1,
      onDutyPersonnel: 4,
      availableEquipment: [],
    },
    isActive: true,
  },
];

// Vehicle seed data - 20 vehicles across Sri Lanka covering all vehicle types
const vehicles = [
  // FIRE ENGINES (5 vehicles)
  {
    registration: {
      plateNumber: "FE-2301",
      vehicleType: "Fire Engine",
      make: "Isuzu",
      model: "NPR Fire Truck",
      year: 2021,
      registrationDate: new Date("2021-03-15"),
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
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null, // Circular dependency - will be updated in Phase 2
      assignedAt: null,
      crew: [], // Will be populated with crew leader
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
          quantity: 10,
        },
        {
          name: "Ladders",
          type: "safety_equipment",
          status: "operational",
          quantity: 3,
        },
        {
          name: "Breathing Apparatus",
          type: "safety_equipment",
          status: "operational",
          quantity: 6,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-01"),
      nextMaintenanceDate: new Date("2025-01-01"),
    },
    station: {
      homeStationId: null, // Will be populated during seeding
      currentStationId: null, // Will be populated during seeding
    },
  },
  {
    registration: {
      plateNumber: "FE-2302",
      vehicleType: "Fire Engine",
      make: "Mercedes",
      model: "Atego Fire Truck",
      year: 2022,
      registrationDate: new Date("2022-05-20"),
      approvedBy: null,
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
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "High Pressure Pump",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Foam Concentrate",
          type: "other",
          status: "operational",
          quantity: 200,
        },
        {
          name: "Rescue Tools",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-28"),
      nextMaintenanceDate: new Date("2024-12-28"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "FE-2303",
      vehicleType: "Fire Engine",
      make: "Volvo",
      model: "FL Fire Tender",
      year: 2020,
      registrationDate: new Date("2020-08-10"),
      approvedBy: null,
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
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Water Tank",
          type: "other",
          status: "operational",
          quantity: 3000,
        },
        {
          name: "Fire Extinguishers",
          type: "safety_equipment",
          status: "operational",
          quantity: 8,
        },
        {
          name: "Cutting Tools",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-30"),
      nextMaintenanceDate: new Date("2024-12-30"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "FE-2304",
      vehicleType: "Fire Engine",
      make: "Scania",
      model: "P320 Fire Engine",
      year: 2023,
      registrationDate: new Date("2023-02-15"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [81.2085, 6.032], // Matara
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Aerial Platform",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Hydraulic Spreaders",
          type: "safety_equipment",
          status: "operational",
          quantity: 2,
        },
        {
          name: "Thermal Camera",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-01"),
      nextMaintenanceDate: new Date("2025-03-01"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "FE-2305",
      vehicleType: "Fire Engine",
      make: "MAN",
      model: "TGM Fire Truck",
      year: 2021,
      registrationDate: new Date("2021-11-25"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.4037, 8.3114], // Anuradhapura
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Water Cannon",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Emergency Lighting",
          type: "communication",
          status: "operational",
          quantity: 12,
        },
        {
          name: "Communication Radio",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-25"),
      nextMaintenanceDate: new Date("2024-12-25"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },

  // AMBULANCES (7 vehicles)
  {
    registration: {
      plateNumber: "AM-1201",
      vehicleType: "Ambulance",
      make: "Toyota",
      model: "Hiace Ambulance",
      year: 2022,
      registrationDate: new Date("2022-04-12"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [79.9072, 6.8421], // Mount Lavinia
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
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
          name: "Oxygen Tank",
          type: "medical_supply",
          status: "operational",
          quantity: 4,
        },
        {
          name: "First Aid Kit",
          type: "medical_supply",
          status: "operational",
          quantity: 3,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-01"),
      nextMaintenanceDate: new Date("2025-01-01"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "AM-1202",
      vehicleType: "Ambulance",
      make: "Mitsubishi",
      model: "Rosa Ambulance",
      year: 2021,
      registrationDate: new Date("2021-07-08"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.7718, 7.4818], // Matale
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Ventilator",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "IV Fluids",
          type: "medical_supply",
          status: "operational",
          quantity: 10,
        },
        {
          name: "Cardiac Monitor",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-29"),
      nextMaintenanceDate: new Date("2024-12-29"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "AM-1203",
      vehicleType: "Ambulance",
      make: "Ford",
      model: "Transit Ambulance",
      year: 2023,
      registrationDate: new Date("2023-01-20"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [79.8774, 6.7077], // Dehiwala
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Spinal Board",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Blood Pressure Monitor",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Emergency Medications",
          type: "medical_supply",
          status: "operational",
          quantity: 20,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-02"),
      nextMaintenanceDate: new Date("2025-04-02"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "AM-1204",
      vehicleType: "Ambulance",
      make: "Nissan",
      model: "NV200 Ambulance",
      year: 2020,
      registrationDate: new Date("2020-09-14"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.3964, 5.9549], // Hikkaduwa
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Suction Unit",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Trauma Kit",
          type: "medical_supply",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Nebulizer",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-26"),
      nextMaintenanceDate: new Date("2024-12-26"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "AM-1205",
      vehicleType: "Ambulance",
      make: "Volkswagen",
      model: "Crafter Ambulance",
      year: 2022,
      registrationDate: new Date("2022-03-30"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [81.0104, 7.9553], // Polonnaruwa
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Ultrasound Scanner",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Surgical Kit",
          type: "medical_supply",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Pediatric Equipment",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-30"),
      nextMaintenanceDate: new Date("2024-12-30"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "AM-1206",
      vehicleType: "Ambulance",
      make: "Isuzu",
      model: "D-Max Ambulance",
      year: 2021,
      registrationDate: new Date("2021-12-05"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.5932, 8.5604], // Trincomalee
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Mobile ICU Equipment",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Burn Treatment Kit",
          type: "medical_supply",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Hypothermia Kit",
          type: "medical_supply",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-01"),
      nextMaintenanceDate: new Date("2025-03-01"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "AM-1207",
      vehicleType: "Ambulance",
      make: "Mercedes",
      model: "Sprinter Ambulance",
      year: 2023,
      registrationDate: new Date("2023-06-18"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.7429, 6.0367], // Bentota
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Advanced Life Support",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Drug Infusion Pumps",
          type: "medical_equipment",
          status: "operational",
          quantity: 2,
        },
        {
          name: "Portable X-Ray",
          type: "medical_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-01"),
      nextMaintenanceDate: new Date("2025-09-01"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },

  // RESCUE VEHICLES (5 vehicles)
  {
    registration: {
      plateNumber: "RV-3401",
      vehicleType: "Rescue Vehicle",
      make: "Mercedes",
      model: "Sprinter Rescue",
      year: 2022,
      registrationDate: new Date("2022-08-22"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.0259, 6.9344], // Negombo
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
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
          quantity: 6,
        },
        {
          name: "Rescue Boat",
          type: "other",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Rope Rescue Kit",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-28"),
      nextMaintenanceDate: new Date("2024-12-28"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "RV-3402",
      vehicleType: "Rescue Vehicle",
      make: "Volvo",
      model: "FMX Rescue",
      year: 2021,
      registrationDate: new Date("2021-10-11"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [79.9278, 6.8649], // Ratmalana
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Heavy Lifting Equipment",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Search Light System",
          type: "communication",
          status: "operational",
          quantity: 4,
        },
        {
          name: "Confined Space Equipment",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-27"),
      nextMaintenanceDate: new Date("2024-12-27"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "RV-3403",
      vehicleType: "Rescue Vehicle",
      make: "MAN",
      model: "TGS Rescue",
      year: 2020,
      registrationDate: new Date("2020-05-15"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.7747, 7.2944], // Peradeniya
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Chemical Spill Kit",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Hazmat Suits",
          type: "safety_equipment",
          status: "operational",
          quantity: 8,
        },
        {
          name: "Air Monitoring Equipment",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-25"),
      nextMaintenanceDate: new Date("2024-12-25"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "RV-3404",
      vehicleType: "Rescue Vehicle",
      make: "Scania",
      model: "R450 Rescue",
      year: 2023,
      registrationDate: new Date("2023-04-07"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [81.8313, 6.9271], // Batticaloa
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Water Rescue Equipment",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Emergency Generator",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Flood Rescue Kit",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-02"),
      nextMaintenanceDate: new Date("2025-07-02"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "RV-3405",
      vehicleType: "Rescue Vehicle",
      make: "Iveco",
      model: "Daily Rescue",
      year: 2021,
      registrationDate: new Date("2021-09-30"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.3403, 6.4027], // Ambalangoda
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Mountain Rescue Kit",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Winch System",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "First Aid Station",
          type: "medical_supply",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-30"),
      nextMaintenanceDate: new Date("2024-12-30"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },

  // POLICE VEHICLES (3 vehicles)
  {
    registration: {
      plateNumber: "PV-4501",
      vehicleType: "Support Vehicle",
      make: "Toyota",
      model: "Land Cruiser Police",
      year: 2022,
      registrationDate: new Date("2022-02-28"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [79.8597, 6.9271], // Colombo Fort
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Emergency Lights",
          type: "communication",
          status: "operational",
          quantity: 6,
        },
        {
          name: "Police Radio System",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Traffic Control Equipment",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Emergency Barrier Kit",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-01"),
      nextMaintenanceDate: new Date("2025-05-01"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "PV-4502",
      vehicleType: "Support Vehicle",
      make: "Mitsubishi",
      model: "Pajero Police",
      year: 2021,
      registrationDate: new Date("2021-06-15"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.6423, 7.2927], // Kandy Police
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Mobile Command Unit",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Crowd Control Barriers",
          type: "safety_equipment",
          status: "operational",
          quantity: 10,
        },
        {
          name: "Emergency Communication",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-09-29"),
      nextMaintenanceDate: new Date("2024-12-29"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
  {
    registration: {
      plateNumber: "PV-4503",
      vehicleType: "Support Vehicle",
      make: "Ford",
      model: "Ranger Police",
      year: 2023,
      registrationDate: new Date("2023-03-12"),
      approvedBy: null,
    },
    status: {
      operational: "active",
      currentStatus: "available",
      currentLocation: {
        type: "Point",
        coordinates: [80.217, 6.0328], // Galle Police
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    assignment: {
      currentIncidentId: null,
      assignedAt: null,
      crew: [],
    },
    equipment: {
      items: [
        {
          name: "Incident Command System",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Emergency Response Kit",
          type: "safety_equipment",
          status: "operational",
          quantity: 1,
        },
        {
          name: "Public Address System",
          type: "communication",
          status: "operational",
          quantity: 1,
        },
      ],
      checklistTemplateId: null,
      lastCheckDate: new Date("2024-10-01"),
      nextMaintenanceDate: new Date("2025-06-01"),
    },
    station: {
      homeStationId: null,
      currentStationId: null,
    },
  },
];

// Crew seed data - 20 crew leaders for vehicle assignments
const crew = [
  // FIRE ENGINE CREW LEADERS (5)
  {
    personal: {
      employeeId: "EMP000021",
      firstName: "Nuwan",
      lastName: "Silva",
      email: "nuwan.silva@respondr.lk",
      phone: "+94771234501",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
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
          type: "Emergency Response Leadership",
          number: "ERL-2021-005",
          issuedBy: "Emergency Services Institute",
          issueDate: new Date("2021-03-15"),
          expiryDate: new Date("2026-03-15"),
          isActive: true,
        },
        {
          type: "Communication Systems",
          number: "CS-2022-012",
          issuedBy: "Emergency Communications Authority",
          issueDate: new Date("2022-01-10"),
          expiryDate: new Date("2027-01-10"),
          isActive: true,
        },
      ],
      specializations: [
        "fire_suppression",
        "rescue_operations",
        "other",
        "other",
      ],
      hireDate: new Date("2008-04-01"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to FE-2301 in Phase 2
      location: {
        type: "Point",
        coordinates: [79.8612, 6.9271], // Colombo Central
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Sanduni Silva",
        relationship: "Spouse",
        phone: "+94771234502",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000001",
      firstName: "Chamara",
      lastName: "Jayasinghe",
      email: "chamara.jayasinghe@respondr.lk",
      phone: "+94771234503",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Advanced Fire Suppression",
          number: "AFS-2019-008",
          issuedBy: "Sri Lanka Fire Services",
          issueDate: new Date("2019-08-15"),
          expiryDate: new Date("2024-08-15"),
          isActive: true,
        },
        {
          type: "Hazmat Operations",
          number: "HO-2020-003",
          issuedBy: "Industrial Safety Council",
          issueDate: new Date("2020-11-20"),
          expiryDate: new Date("2025-11-20"),
          isActive: true,
        },
      ],
      specializations: ["hazmat", "fire_suppression", "other"],
      hireDate: new Date("2010-07-01"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to FE-2302
      location: {
        type: "Point",
        coordinates: [80.6337, 7.2906], // Kandy
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Kumari Jayasinghe",
        relationship: "Spouse",
        phone: "+94771234504",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000002",
      firstName: "Ravindra",
      lastName: "Fernando",
      email: "ravindra.fernando@respondr.lk",
      phone: "+94771234505",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Structural Collapse Rescue",
          number: "SCR-2021-004",
          issuedBy: "Urban Search and Rescue",
          issueDate: new Date("2021-05-10"),
          expiryDate: new Date("2026-05-10"),
          isActive: true,
        },
        {
          type: "Water Rescue Operations",
          number: "WRO-2020-023",
          issuedBy: "Aquatic Rescue Division",
          issueDate: new Date("2020-02-14"),
          expiryDate: new Date("2025-02-14"),
          isActive: true,
        },
      ],
      specializations: [
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
      ],
      hireDate: new Date("2012-09-15"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to FE-2303
      location: {
        type: "Point",
        coordinates: [80.217, 6.0535], // Galle
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Nimal Fernando",
        relationship: "Sibling",
        phone: "+94771234506",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000003",
      firstName: "Asanka",
      lastName: "Rajapaksa",
      email: "asanka.rajapaksa@respondr.lk",
      phone: "+94771234507",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Aerial Operations",
          number: "AO-2022-001",
          issuedBy: "Specialized Fire Operations",
          issueDate: new Date("2022-01-15"),
          expiryDate: new Date("2027-01-15"),
          isActive: true,
        },
        {
          type: "Technical Rescue",
          number: "TR-2021-007",
          issuedBy: "Technical Rescue Institute",
          issueDate: new Date("2021-09-12"),
          expiryDate: new Date("2026-09-12"),
          isActive: true,
        },
      ],
      specializations: [
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
      ],
      hireDate: new Date("2009-11-01"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to FE-2304
      location: {
        type: "Point",
        coordinates: [81.2085, 6.032], // Matara
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Priya Rajapaksa",
        relationship: "Spouse",
        phone: "+94771234508",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000004",
      firstName: "Mahinda",
      lastName: "Wijeratne",
      email: "mahinda.wijeratne@respondr.lk",
      phone: "+94771234509",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Wildfire Suppression",
          number: "WS-2020-009",
          issuedBy: "Forest Fire Division",
          issueDate: new Date("2020-04-20"),
          expiryDate: new Date("2025-04-20"),
          isActive: true,
        },
        {
          type: "Rural Emergency Response",
          number: "RER-2019-015",
          issuedBy: "Rural Emergency Services",
          issueDate: new Date("2019-12-05"),
          expiryDate: new Date("2024-12-05"),
          isActive: true,
        },
      ],
      specializations: [
        "fire_suppression",
        "rescue_operations",
        "fire_suppression",
      ],
      hireDate: new Date("2011-03-20"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to FE-2305
      location: {
        type: "Point",
        coordinates: [80.4037, 8.3114], // Anuradhapura
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Kamani Wijeratne",
        relationship: "Spouse",
        phone: "+94771234510",
      },
    },
  },

  // AMBULANCE CREW LEADERS (7)
  {
    personal: {
      employeeId: "EMP000005",
      firstName: "Chaminda",
      lastName: "Perera",
      email: "chaminda.perera@respondr.lk",
      phone: "+94771234511",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
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
          type: "Critical Care Transport",
          number: "CCT-2022-004",
          issuedBy: "Critical Care Institute",
          issueDate: new Date("2022-03-10"),
          expiryDate: new Date("2027-03-10"),
          isActive: true,
        },
        {
          type: "Emergency Medical Communications",
          number: "EMC-2020-008",
          issuedBy: "Medical Emergency Communications",
          issueDate: new Date("2020-11-20"),
          expiryDate: new Date("2025-11-20"),
          isActive: true,
        },
      ],
      specializations: [
        "cardiac_care",
        "trauma",
        "emergency_medicine",
        "other",
      ],
      hireDate: new Date("2015-07-01"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to AM-1201
      location: {
        type: "Point",
        coordinates: [79.9072, 6.8421], // Mount Lavinia
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Nilani Perera",
        relationship: "Spouse",
        phone: "+94771234512",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000006",
      firstName: "Suresh",
      lastName: "Mendis",
      email: "suresh.mendis@respondr.lk",
      phone: "+94771234513",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Cardiac Life Support",
          number: "CLS-2020-012",
          issuedBy: "Heart Foundation Sri Lanka",
          issueDate: new Date("2020-11-20"),
          expiryDate: new Date("2025-11-20"),
          isActive: true,
        },
        {
          type: "Pediatric Emergency Care",
          number: "PEC-2021-006",
          issuedBy: "Children's Hospital",
          issueDate: new Date("2021-04-15"),
          expiryDate: new Date("2026-04-15"),
          isActive: true,
        },
      ],
      specializations: ["pediatric", "cardiac_care", "medical_transport"],
      hireDate: new Date("2013-02-10"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to AM-1202
      location: {
        type: "Point",
        coordinates: [80.7718, 7.4818], // Matale
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Ranjani Mendis",
        relationship: "Spouse",
        phone: "+94771234514",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000007",
      firstName: "Priyantha",
      lastName: "Gunasekara",
      email: "priyantha.gunasekara@respondr.lk",
      phone: "+94771234515",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Trauma Care Certification",
          number: "TCC-2019-018",
          issuedBy: "Trauma Center Institute",
          issueDate: new Date("2019-06-25"),
          expiryDate: new Date("2024-06-25"),
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
      specializations: ["trauma", "medical_transport", "medical_transport"],
      hireDate: new Date("2014-08-15"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to AM-1203
      location: {
        type: "Point",
        coordinates: [79.8774, 6.7077], // Dehiwala
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Malini Gunasekara",
        relationship: "Spouse",
        phone: "+94771234516",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000008",
      firstName: "Lakmal",
      lastName: "Wijesuriya",
      email: "lakmal.wijesuriya@respondr.lk",
      phone: "+94771234517",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Rural Emergency Medicine",
          number: "REM-2020-011",
          issuedBy: "Rural Health Services",
          issueDate: new Date("2020-09-30"),
          expiryDate: new Date("2025-09-30"),
          isActive: true,
        },
        {
          type: "Water Emergency Response",
          number: "WER-2021-003",
          issuedBy: "Coast Guard Medical Unit",
          issueDate: new Date("2021-01-20"),
          expiryDate: new Date("2026-01-20"),
          isActive: true,
        },
      ],
      specializations: [
        "emergency_medicine",
        "rescue_operations",
        "medical_transport",
      ],
      hireDate: new Date("2016-01-12"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to AM-1204
      location: {
        type: "Point",
        coordinates: [80.3964, 5.9549], // Hikkaduwa
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Chandrika Wijesuriya",
        relationship: "Spouse",
        phone: "+94771234518",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000009",
      firstName: "Kamal",
      lastName: "Ratnayake",
      email: "kamal.ratnayake@respondr.lk",
      phone: "+94771234519",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Advanced Life Support",
          number: "ALS-2021-002",
          issuedBy: "Advanced Medical Institute",
          issueDate: new Date("2021-05-18"),
          expiryDate: new Date("2026-05-18"),
          isActive: true,
        },
        {
          type: "Cultural Heritage Emergency Response",
          number: "CHER-2022-001",
          issuedBy: "Cultural Heritage Protection",
          issueDate: new Date("2022-07-10"),
          expiryDate: new Date("2027-07-10"),
          isActive: true,
        },
      ],
      specializations: ["emergency_medicine", "other", "other"],
      hireDate: new Date("2012-11-05"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to AM-1205
      location: {
        type: "Point",
        coordinates: [81.0104, 7.9553], // Polonnaruwa
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Wasantha Ratnayake",
        relationship: "Sibling",
        phone: "+94771234520",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000010",
      firstName: "Upul",
      lastName: "Bandara",
      email: "upul.bandara@respondr.lk",
      phone: "+94771234521",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Emergency Maritime Response",
          number: "EMR-2020-007",
          issuedBy: "Maritime Emergency Services",
          issueDate: new Date("2020-04-22"),
          expiryDate: new Date("2025-04-22"),
          isActive: true,
        },
        {
          type: "Multi-lingual Medical Communication",
          number: "MMC-2021-004",
          issuedBy: "International Medical Services",
          issueDate: new Date("2021-08-15"),
          expiryDate: new Date("2026-08-15"),
          isActive: true,
        },
      ],
      specializations: [
        "emergency_medicine",
        "emergency_medicine",
        "medical_transport",
      ],
      hireDate: new Date("2017-03-18"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to AM-1206
      location: {
        type: "Point",
        coordinates: [80.5932, 8.5604], // Trincomalee
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Sewwandi Bandara",
        relationship: "Spouse",
        phone: "+94771234522",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000011",
      firstName: "Ajith",
      lastName: "Kumara",
      email: "ajith.kumara@respondr.lk",
      phone: "+94771234523",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Resort Emergency Medicine",
          number: "REM-2022-008",
          issuedBy: "Tourism Medical Services",
          issueDate: new Date("2022-02-28"),
          expiryDate: new Date("2027-02-28"),
          isActive: true,
        },
        {
          type: "Helicopter Emergency Medical Services",
          number: "HEMS-2021-001",
          issuedBy: "Aviation Medical Unit",
          issueDate: new Date("2021-10-12"),
          expiryDate: new Date("2026-10-12"),
          isActive: true,
        },
      ],
      specializations: ["emergency_medicine", "other", "medical_transport"],
      hireDate: new Date("2014-06-30"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to AM-1207
      location: {
        type: "Point",
        coordinates: [80.7429, 6.0367], // Bentota
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Dilani Kumara",
        relationship: "Spouse",
        phone: "+94771234524",
      },
    },
  },

  // RESCUE VEHICLE CREW LEADERS (5)
  {
    personal: {
      employeeId: "EMP000012",
      firstName: "Saman",
      lastName: "Wickramasinghe",
      email: "saman.wickramasinghe@respondr.lk",
      phone: "+94771234525",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Swift Water Rescue",
          number: "SWR-2020-003",
          issuedBy: "Water Safety Institute",
          issueDate: new Date("2020-07-15"),
          expiryDate: new Date("2025-07-15"),
          isActive: true,
        },
        {
          type: "Technical Rope Rescue",
          number: "TRR-2021-009",
          issuedBy: "Technical Rescue Academy",
          issueDate: new Date("2021-05-20"),
          expiryDate: new Date("2026-05-20"),
          isActive: true,
        },
        {
          type: "Marine Emergency Response",
          number: "MER-2019-012",
          issuedBy: "Coast Guard Training Center",
          issueDate: new Date("2019-11-10"),
          expiryDate: new Date("2024-11-10"),
          isActive: true,
        },
      ],
      specializations: [
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
      ],
      hireDate: new Date("2011-04-15"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to RV-3401
      location: {
        type: "Point",
        coordinates: [80.0259, 6.9344], // Negombo
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Manel Wickramasinghe",
        relationship: "Spouse",
        phone: "+94771234526",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000013",
      firstName: "Tharaka",
      lastName: "Senanayake",
      email: "tharaka.senanayake@respondr.lk",
      phone: "+94771234527",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Urban Search and Rescue",
          number: "USAR-2021-005",
          issuedBy: "Urban Rescue Institute",
          issueDate: new Date("2021-03-08"),
          expiryDate: new Date("2026-03-08"),
          isActive: true,
        },
        {
          type: "Heavy Equipment Operations",
          number: "HEO-2020-014",
          issuedBy: "Construction Safety Council",
          issueDate: new Date("2020-09-25"),
          expiryDate: new Date("2025-09-25"),
          isActive: true,
        },
      ],
      specializations: [
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
      ],
      hireDate: new Date("2013-08-20"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to RV-3402
      location: {
        type: "Point",
        coordinates: [79.9278, 6.8649], // Ratmalana
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Hiruni Senanayake",
        relationship: "Spouse",
        phone: "+94771234528",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000014",
      firstName: "Dinesh",
      lastName: "Ratnayake",
      email: "dinesh.ratnayake@respondr.lk",
      phone: "+94771234529",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Hazardous Materials Response",
          number: "HMR-2020-006",
          issuedBy: "Environmental Safety Agency",
          issueDate: new Date("2020-12-03"),
          expiryDate: new Date("2025-12-03"),
          isActive: true,
        },
        {
          type: "Chemical Emergency Response",
          number: "CER-2021-002",
          issuedBy: "Chemical Safety Institute",
          issueDate: new Date("2021-06-18"),
          expiryDate: new Date("2026-06-18"),
          isActive: true,
        },
      ],
      specializations: ["hazmat", "hazmat", "hazmat", "hazmat"],
      hireDate: new Date("2010-02-12"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to RV-3403
      location: {
        type: "Point",
        coordinates: [80.7747, 7.2944], // Peradeniya
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Gayani Ratnayake",
        relationship: "Spouse",
        phone: "+94771234530",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000015",
      firstName: "Janaka",
      lastName: "Dissanayake",
      email: "janaka.dissanayake@respondr.lk",
      phone: "+94771234531",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Flood Response Operations",
          number: "FRO-2019-008",
          issuedBy: "Disaster Management Center",
          issueDate: new Date("2019-10-15"),
          expiryDate: new Date("2024-10-15"),
          isActive: true,
        },
        {
          type: "Emergency Generator Operations",
          number: "EGO-2020-011",
          issuedBy: "Power Systems Institute",
          issueDate: new Date("2020-07-22"),
          expiryDate: new Date("2025-07-22"),
          isActive: true,
        },
      ],
      specializations: [
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
        "other",
      ],
      hireDate: new Date("2015-05-10"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to RV-3404
      location: {
        type: "Point",
        coordinates: [81.8313, 6.9271], // Batticaloa
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Sujani Dissanayake",
        relationship: "Spouse",
        phone: "+94771234532",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000016",
      firstName: "Roshan",
      lastName: "Cooray",
      email: "roshan.cooray@respondr.lk",
      phone: "+94771234533",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Mountain Rescue Operations",
          number: "MRO-2021-001",
          issuedBy: "Alpine Rescue Institute",
          issueDate: new Date("2021-04-12"),
          expiryDate: new Date("2026-04-12"),
          isActive: true,
        },
        {
          type: "Winch and Recovery Systems",
          number: "WRS-2020-005",
          issuedBy: "Heavy Recovery Training Center",
          issueDate: new Date("2020-11-30"),
          expiryDate: new Date("2025-11-30"),
          isActive: true,
        },
      ],
      specializations: [
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
        "rescue_operations",
      ],
      hireDate: new Date("2014-01-25"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to RV-3405
      location: {
        type: "Point",
        coordinates: [80.3403, 6.4027], // Ambalangoda
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Padma Cooray",
        relationship: "Spouse",
        phone: "+94771234534",
      },
    },
  },

  // POLICE VEHICLE CREW LEADERS (3)
  {
    personal: {
      employeeId: "EMP000017",
      firstName: "Inspector Nimal",
      lastName: "Jayawardena",
      email: "nimal.jayawardena@respondr.lk",
      phone: "+94771234535",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Expert",
      certifications: [
        {
          type: "Emergency Response Command",
          number: "ERC-2020-004",
          issuedBy: "Police Training College",
          issueDate: new Date("2020-03-15"),
          expiryDate: new Date("2025-03-15"),
          isActive: true,
        },
        {
          type: "Traffic Incident Management",
          number: "TIM-2021-007",
          issuedBy: "Traffic Police Division",
          issueDate: new Date("2021-07-20"),
          expiryDate: new Date("2026-07-20"),
          isActive: true,
        },
        {
          type: "Multi-Agency Coordination",
          number: "MAC-2019-012",
          issuedBy: "Emergency Services Coordination",
          issueDate: new Date("2019-09-10"),
          expiryDate: new Date("2024-09-10"),
          isActive: true,
        },
      ],
      specializations: ["other", "other", "other", "other"],
      hireDate: new Date("2008-06-01"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to PV-4501
      location: {
        type: "Point",
        coordinates: [79.8597, 6.9271], // Colombo Fort
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Sumana Jayawardena",
        relationship: "Spouse",
        phone: "+94771234536",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000018",
      firstName: "Sergeant Susil",
      lastName: "Fonseka",
      email: "susil.fonseka@respondr.lk",
      phone: "+94771234537",
    },
    professional: {
      role: "Supervisor",
      isLeader: true,
      certificationLevel: "Advanced",
      certifications: [
        {
          type: "Mobile Command Operations",
          number: "MCO-2021-003",
          issuedBy: "Police Command Training",
          issueDate: new Date("2021-02-18"),
          expiryDate: new Date("2026-02-18"),
          isActive: true,
        },
        {
          type: "Emergency Communication Systems",
          number: "ECS-2020-009",
          issuedBy: "Police Communications Division",
          issueDate: new Date("2020-08-15"),
          expiryDate: new Date("2025-08-15"),
          isActive: true,
        },
      ],
      specializations: ["other", "other", "other", "other"],
      hireDate: new Date("2012-04-15"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to PV-4502
      location: {
        type: "Point",
        coordinates: [80.6423, 7.2927], // Kandy Police
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Indira Fonseka",
        relationship: "Spouse",
        phone: "+94771234538",
      },
    },
  },
  {
    personal: {
      employeeId: "EMP000019",
      firstName: "Gamini",
      lastName: "Silva",
      email: "gamini.silva@respondr.lk",
      phone: "+94771234539",
    },
    professional: {
      role: "Driver",
      isLeader: true,
      certificationLevel: "Intermediate",
      certifications: [
        {
          type: "Incident Command System",
          number: "ICS-2020-015",
          issuedBy: "Emergency Management Institute",
          issueDate: new Date("2020-10-25"),
          expiryDate: new Date("2025-10-25"),
          isActive: true,
        },
        {
          type: "Public Safety Communications",
          number: "PSC-2021-006",
          issuedBy: "Public Safety Training Center",
          issueDate: new Date("2021-01-30"),
          expiryDate: new Date("2026-01-30"),
          isActive: true,
        },
      ],
      specializations: ["other", "other", "other", "other"],
      hireDate: new Date("2016-08-10"),
    },
    currentStatus: {
      availability: "available",
      shiftId: null,
      assignedVehicleId: null, // Will be assigned to PV-4503
      location: {
        type: "Point",
        coordinates: [80.217, 6.0328], // Galle Police
      },
      lastLocationUpdate: new Date(),
    },
    readiness: {
      isReady: false, // October 20, 2025 - Must be explicitly marked ready by crew
      lastReadyUpdate: new Date(),
      notReadyReason: null,
    },
    settings: {
      isActive: true,
      emergencyContact: {
        name: "Malini Silva",
        relationship: "Spouse",
        phone: "+94771234540",
      },
    },
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
  {
    vehicleType: "ambulance",
    template: {
      name: "Ambulance Daily Inspection",
      description: "Comprehensive daily inspection checklist for ambulances",
      version: "2.0",
    },
    checklist: {
      instructions:
        "Complete all medical equipment checks before each shift. Verify all life-support systems are operational.",
      categories: [
        {
          name: "Medical Equipment",
          description: "Life-saving medical equipment inspection",
          items: [
            {
              name: "Defibrillator Battery",
              type: "equipment",
              description: "Check defibrillator battery level and operation",
              required: true,
              checkType: "functional_test",
              expectedValue: "Full charge, self-test passed",
              instructions: "Run self-test sequence and verify battery at 100%",
            },
            {
              name: "Oxygen Tank Pressure",
              type: "supply",
              description: "Verify oxygen tank pressure levels",
              required: true,
              checkType: "pressure_check",
              expectedValue: "Above 1800 PSI",
              instructions: "Check all oxygen tanks, replace if below 1800 PSI",
            },
            {
              name: "IV Fluid Inventory",
              type: "supply",
              description: "Count and verify IV fluid stock",
              required: true,
              checkType: "quantity_check",
              expectedValue: "As per inventory sheet",
              instructions: "Verify quantities and check expiry dates",
            },
          ],
        },
      ],
    },
  },
  {
    vehicleType: "rescue_vehicle",
    template: {
      name: "Rescue Vehicle Daily Inspection",
      description:
        "Comprehensive daily inspection checklist for rescue vehicles",
      version: "1.8",
    },
    checklist: {
      instructions:
        "Test all rescue equipment and verify hydraulic systems are operational.",
      categories: [
        {
          name: "Rescue Equipment",
          description: "Specialized rescue equipment inspection",
          items: [
            {
              name: "Hydraulic Rescue Tools",
              type: "safety",
              description: "Test hydraulic spreaders and cutters",
              required: true,
              checkType: "functional_test",
              expectedValue: "Full operational pressure",
              instructions: "Run full cycle test, check hydraulic fluid levels",
            },
            {
              name: "Rope Rescue System",
              type: "safety",
              description: "Inspect all ropes and rigging equipment",
              required: true,
              checkType: "visual_inspection",
              expectedValue: "No wear, cuts, or damage",
              instructions: "Check entire length of all ropes for damage",
            },
            {
              name: "Diving Equipment",
              type: "safety",
              description: "Test diving equipment and air supplies",
              required: true,
              checkType: "pressure_check",
              expectedValue: "All tanks above minimum pressure",
              instructions:
                "Check tank pressure, regulator function, mask seals",
            },
          ],
        },
      ],
    },
  },
  {
    vehicleType: "support_vehicle",
    template: {
      name: "Police Vehicle Daily Inspection",
      description: "Daily inspection checklist for emergency police vehicles",
      version: "1.5",
    },
    checklist: {
      instructions:
        "Verify all emergency equipment and communication systems are operational.",
      categories: [
        {
          name: "Emergency Systems",
          description: "Police emergency equipment inspection",
          items: [
            {
              name: "Emergency Light Bar",
              type: "system",
              description: "Test all emergency warning lights",
              required: true,
              checkType: "functional_test",
              expectedValue: "All lights operational",
              instructions: "Test all light patterns and colors",
            },
            {
              name: "Radio Communication",
              type: "system",
              description: "Test radio communication systems",
              required: true,
              checkType: "functional_test",
              expectedValue: "Clear transmission and reception",
              instructions: "Perform radio check with dispatch center",
            },
            {
              name: "Traffic Control Equipment",
              type: "safety",
              description: "Verify traffic control devices are present",
              required: true,
              checkType: "quantity_check",
              expectedValue: "All items present and functional",
              instructions: "Check cones, flares, barriers, and warning signs",
            },
          ],
        },
      ],
    },
  },
];

// Sample incidents for testing - 10 incidents across Sri Lanka
const incidents = [
  {
    callerInfo: {
      name: "Saman Kumara",
      contactNumber: "+94771234601",
      alternateContact: "+94711234601",
      reportingMethod: "phone_call",
    },
    incidentType: "fire",
    incidentCategory: "structure_fire",
    severity: "critical",
    description:
      "Large fire at commercial building near World Trade Center. Multiple floors affected. Heavy smoke visible. Possible people trapped on upper floors.",
    location: {
      address: "Echelon Square, Colombo 01",
      city: "Colombo",
      province: "Western",
      coordinates: {
        type: "Point",
        coordinates: [79.8652, 6.9181], // Colombo commercial district
      },
      locationAccuracy: "exact",
      landmarks: "Near World Trade Center, opposite BMICH",
    },
    status: "pending", // Not assigned yet
    assignedDispatcher: null,
    assignedResources: [], // Empty - following circular dependency strategy
  },
  {
    callerInfo: {
      name: "Dr. Priya Mendis",
      contactNumber: "+94771234602",
      alternateContact: "+94701234602",
      reportingMethod: "mobile_app",
    },
    incidentType: "medical",
    incidentCategory: "cardiac_arrest",
    severity: "critical",
    description:
      "68-year-old male tourist collapsed at hotel. Unresponsive, not breathing normally. Hotel staff performing CPR as instructed by our dispatcher.",
    location: {
      address: "Cinnamon Grand Hotel, Galle Road",
      city: "Colombo",
      province: "Western",
      coordinates: {
        type: "Point",
        coordinates: [79.8612, 6.9147], // Cinnamon Grand area
      },
      locationAccuracy: "exact",
      landmarks: "Near U.S. Embassy, Galle Road",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Chamara Wijesinghe",
      contactNumber: "+94771234603",
      reportingMethod: "phone_call",
    },
    incidentType: "traffic",
    incidentCategory: "collision",
    severity: "high",
    description:
      "Multi-vehicle accident on A1 highway. Three vehicles involved including a tour bus. Multiple casualties reported. Road completely blocked.",
    location: {
      address: "A1 Highway, near Kadawatha Junction",
      city: "Gampaha",
      province: "Western",
      coordinates: {
        type: "Point",
        coordinates: [79.964, 7.0037], // Kadawatha area
      },
      locationAccuracy: "approximate",
      landmarks: "Near Kadawatha Bridge, A1 northbound",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Nimal Rathnayake",
      contactNumber: "+94771234604",
      alternateContact: "+94812234604",
      reportingMethod: "phone_call",
    },
    incidentType: "rescue",
    incidentCategory: "other_rescue",
    severity: "critical",
    description:
      "Tourist boat in distress on Kandy Lake. Engine failure, boat taking on water. 12 passengers including children on board. Weather conditions deteriorating.",
    location: {
      address: "Kandy Lake, near Temple of the Tooth",
      city: "Kandy",
      province: "Central",
      coordinates: {
        type: "Point",
        coordinates: [80.6417, 7.2906], // Kandy Lake
      },
      locationAccuracy: "exact",
      landmarks: "Between Temple of the Tooth and Queen's Hotel",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Malathi Silva",
      contactNumber: "+94771234605",
      reportingMethod: "mobile_app",
    },
    incidentType: "medical",
    incidentCategory: "other_medical",
    severity: "high",
    description:
      "Woman in active labor with complications. Baby coming prematurely at 32 weeks. Husband reports heavy bleeding. Remote location, difficult access.",
    location: {
      address: "Tea Estate Workers' Quarters, Nuwara Eliya",
      city: "Nuwara Eliya",
      province: "Central",
      coordinates: {
        type: "Point",
        coordinates: [80.7891, 6.9497], // Nuwara Eliya hills
      },
      locationAccuracy: "approximate",
      landmarks: "Near Pedro Tea Estate, 15km from main town",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Sunil Perera - Hotel Manager",
      contactNumber: "+94771234606",
      alternateContact: "+94912234606",
      reportingMethod: "phone_call",
    },
    incidentType: "rescue",
    incidentCategory: "other_rescue",
    severity: "critical",
    description:
      "Partial building collapse at construction site near Galle Fort. Workers trapped under debris. Heavy machinery involved. Need immediate heavy rescue response.",
    location: {
      address: "New Hotel Construction Site, Galle Fort Area",
      city: "Galle",
      province: "Southern",
      coordinates: {
        type: "Point",
        coordinates: [80.217, 6.0328], // Galle Fort vicinity
      },
      locationAccuracy: "exact",
      landmarks: "Behind Galle Fort Hotel, near lighthouse",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Fisherman Kamal",
      contactNumber: "+94771234607",
      reportingMethod: "third_party",
    },
    incidentType: "rescue",
    incidentCategory: "water_rescue",
    severity: "critical",
    description:
      "Fishing boat with 8 crew members missing since yesterday evening. Last known position 15 nautical miles off Negombo. Rough seas, monsoon conditions.",
    location: {
      address: "Indian Ocean, 15NM West of Negombo",
      city: "Negombo",
      province: "Western",
      coordinates: {
        type: "Point",
        coordinates: [79.8259, 6.9344], // Negombo coast - approximate offshore
      },
      locationAccuracy: "approximate",
      landmarks: "15 nautical miles west of Negombo fishing harbor",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Station Master Bandara",
      contactNumber: "+94771234608",
      alternateContact: "+94472234608",
      reportingMethod: "phone_call",
    },
    incidentType: "traffic",
    incidentCategory: "other_traffic",
    severity: "high",
    description:
      "Train derailment near Haputale station. Blue Line passenger train carrying 150+ passengers. Several coaches off track. Multiple casualties reported.",
    location: {
      address: "Railway Track, 2km before Haputale Station",
      city: "Haputale",
      province: "Uva",
      coordinates: {
        type: "Point",
        coordinates: [80.9567, 6.7678], // Haputale area
      },
      locationAccuracy: "exact",
      landmarks: "Between Diyatalawa and Haputale stations",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Park Ranger Jayasekara",
      contactNumber: "+94771234609",
      reportingMethod: "phone_call",
    },
    incidentType: "rescue",
    incidentCategory: "other_rescue",
    severity: "high",
    description:
      "Foreign tourist hiking group lost in Horton Plains. Last contact 18 hours ago. GPS shows they're in restricted area. Weather turning bad, temperature dropping.",
    location: {
      address: "Horton Plains National Park, restricted zone",
      city: "Ohiya",
      province: "Central",
      coordinates: {
        type: "Point",
        coordinates: [80.8043, 6.8043], // Horton Plains
      },
      locationAccuracy: "approximate",
      landmarks: "Near World's End cliff, beyond marked trails",
    },
    status: "pending",
    assignedDispatcher: null,
    assignedResources: [],
  },
  {
    callerInfo: {
      name: "Factory Supervisor Ranjith",
      contactNumber: "+94771234610",
      alternateContact: "+94372234610",
      reportingMethod: "phone_call",
    },
    incidentType: "hazmat",
    incidentCategory: "chemical_spill",
    severity: "critical",
    description:
      "Major chemical leak at textile factory. Ammonia gas release affecting large area. 50+ workers evacuated. Chemical cloud spreading toward residential area.",
    location: {
      address: "Brandix Textile Factory, Export Processing Zone",
      city: "Katunayake",
      province: "Western",
      coordinates: {
        type: "Point",
        coordinates: [79.8817, 7.1692], // Katunayake EPZ
      },
      locationAccuracy: "exact",
      landmarks: "Near Bandaranaike International Airport, Industrial Zone",
    },
    status: "pending",
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
      module: "system_configuration",
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
  {
    shift: {
      name: "Day Shift Bravo",
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
      requiredCrewCount: 5,
      requiredRoles: [
        "Paramedic",
        "EMT",
        "Driver",
        "Firefighter",
        "Supervisor",
      ],
      minimumCertificationLevel: "Intermediate",
      assignedCrew: [],
    },
    supervision: {
      supervisorId: null,
      supervisorNotes: "High-activity day shift covering multiple stations",
    },
    status: {
      current: "planned",
    },
    stationId: null,
    metrics: {
      incidentsHandled: 0,
    },
    audit: {
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    shift: {
      name: "Night Shift Charlie",
      type: "regular",
    },
    schedule: {
      startTime: "20:00",
      endTime: "08:00",
      date: new Date(Date.now() + 86400000),
      duration: 12,
      recurrence: "daily",
    },
    staffing: {
      requiredCrewCount: 4,
      requiredRoles: ["Paramedic", "Firefighter", "Firefighter", "Supervisor"],
      minimumCertificationLevel: "Advanced",
      assignedCrew: [],
    },
    supervision: {
      supervisorId: null,
      supervisorNotes:
        "Night shift with enhanced emergency response capability",
    },
    status: {
      current: "planned",
    },
    stationId: null,
    metrics: {
      incidentsHandled: 0,
    },
    audit: {
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    shift: {
      name: "Weekend Emergency Shift",
      type: "emergency",
    },
    schedule: {
      startTime: "06:00",
      endTime: "18:00",
      date: new Date(Date.now() + 172800000), // Day after tomorrow
      duration: 12,
      recurrence: "weekly",
    },
    staffing: {
      requiredCrewCount: 6,
      requiredRoles: [
        "Supervisor",
        "Supervisor",
        "Supervisor",
        "Supervisor",
        "Supervisor",
        "Driver",
      ],
      minimumCertificationLevel: "Expert",
      assignedCrew: [],
    },
    supervision: {
      supervisorId: null,
      supervisorNotes:
        "Weekend shift with all specialized team leaders for maximum coverage",
    },
    status: {
      current: "planned",
    },
    stationId: null,
    metrics: {
      incidentsHandled: 0,
    },
    audit: {
      createdBy: null,
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

