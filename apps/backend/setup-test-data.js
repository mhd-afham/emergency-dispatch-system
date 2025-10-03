const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Shift = require('./models/Shift');
const Crew = require('./models/Crew');

// Test data setup script
async function setupTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test station ID (you'll need to replace this with actual station ID)
    const testStationId = new mongoose.Types.ObjectId('675023b6c3b5d9dab8e67890');
    const supervisorId = new mongoose.Types.ObjectId('675023b6c3b5d9dab8e67891');

    // Create test crew members
    console.log('👥 Creating test crew members...');
    const crewMembers = [
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'John',
          lastName: 'Smith',
          employeeId: 'EMP000001',
          email: 'john.smith@emergency.gov',
          phone: '+94771234567'
        },
        professional: {
          role: 'Driver',
          certificationLevel: 'Advanced',
          certifications: [],
          specializations: ['rescue_operations', 'fire_suppression'],
          hireDate: new Date('2020-01-15')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'Jane Smith',
            relationship: 'Spouse',
            phone: '+94771234568'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          employeeId: 'EMP000002',
          email: 'sarah.johnson@emergency.gov',
          phone: '+94771234569'
        },
        professional: {
          role: 'Paramedic',
          certificationLevel: 'Expert',
          certifications: [],
          specializations: ['cardiac_care', 'trauma', 'pediatric'],
          hireDate: new Date('2018-03-10')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'Mike Johnson',
            relationship: 'Spouse',
            phone: '+94771234570'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'Mike',
          lastName: 'Davis',
          employeeId: 'EMP000003',
          email: 'mike.davis@emergency.gov',
          phone: '+94771234571'
        },
        professional: {
          role: 'Firefighter',
          certificationLevel: 'Advanced',
          certifications: [],
          specializations: ['fire_suppression', 'hazmat', 'rescue_operations'],
          hireDate: new Date('2019-06-20')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'Lisa Davis',
            relationship: 'Spouse',
            phone: '+94771234572'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'Lisa',
          lastName: 'Brown',
          employeeId: 'EMP000004',
          email: 'lisa.brown@emergency.gov',
          phone: '+94771234573'
        },
        professional: {
          role: 'Paramedic',
          certificationLevel: 'Intermediate',
          certifications: [],
          specializations: ['emergency_medicine', 'medical_transport'],
          hireDate: new Date('2021-02-14')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'Tom Brown',
            relationship: 'Sibling',
            phone: '+94771234574'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'Robert',
          lastName: 'Wilson',
          employeeId: 'EMP000005',
          email: 'robert.wilson@emergency.gov',
          phone: '+94771234575'
        },
        professional: {
          role: 'Firefighter',
          certificationLevel: 'Expert',
          certifications: [],
          specializations: ['fire_suppression', 'hazmat', 'rescue_operations'],
          hireDate: new Date('2017-09-05')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'Mary Wilson',
            relationship: 'Spouse',
            phone: '+94771234576'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'Amanda',
          lastName: 'Taylor',
          employeeId: 'EMP000006',
          email: 'amanda.taylor@emergency.gov',
          phone: '+94771234577'
        },
        professional: {
          role: 'Driver',
          certificationLevel: 'Advanced',
          certifications: [],
          specializations: ['rescue_operations', 'medical_transport'],
          hireDate: new Date('2020-11-30')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'David Taylor',
            relationship: 'Spouse',
            phone: '+94771234578'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'Chris',
          lastName: 'Anderson',
          employeeId: 'EMP000007',
          email: 'chris.anderson@emergency.gov',
          phone: '+94771234579'
        },
        professional: {
          role: 'EMT',
          certificationLevel: 'Intermediate',
          certifications: [],
          specializations: ['emergency_medicine', 'trauma'],
          hireDate: new Date('2022-01-10')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'Kelly Anderson',
            relationship: 'Spouse',
            phone: '+94771234580'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        personal: {
          firstName: 'Jessica',
          lastName: 'Martinez',
          employeeId: 'EMP000008',
          email: 'jessica.martinez@emergency.gov',
          phone: '+94771234581'
        },
        professional: {
          role: 'Supervisor',
          certificationLevel: 'Expert',
          certifications: [],
          specializations: ['emergency_medicine', 'trauma', 'cardiac_care'],
          hireDate: new Date('2015-05-12')
        },
        currentStatus: {
          availability: 'available',
          shiftId: null,
          assignedVehicleId: null
        },
        settings: {
          emergencyContact: {
            name: 'Carlos Martinez',
            relationship: 'Spouse',
            phone: '+94771234582'
          }
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    // Clear existing crew data and insert new
    await Crew.deleteMany({});
    await Crew.insertMany(crewMembers);
    console.log(`✅ Created ${crewMembers.length} test crew members`);

    // Create sample shifts
    console.log('📅 Creating test shifts...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testShifts = [
      {
        shift: {
          name: 'Morning Response Team',
          type: 'regular'
        },
        schedule: {
          date: today,
          startTime: '08:00',
          endTime: '16:00',
          duration: 8,
          recurrence: 'daily'
        },
        staffing: {
          requiredCrewCount: 4,
          requiredRoles: ['Driver', 'Paramedic', 'Fire Fighter'],
          minimumCertificationLevel: 'Basic',
          assignedCrew: []
        },
        status: {
          current: 'active'
        },
        stationId: testStationId,
        supervision: {
          supervisorId: supervisorId
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          lastModifiedBy: supervisorId,
          lastModifiedAt: new Date()
        }
      },
      {
        shift: {
          name: 'Evening Response Team',
          type: 'regular'
        },
        schedule: {
          date: today,
          startTime: '16:00',
          endTime: '00:00',
          duration: 8,
          recurrence: 'daily'
        },
        staffing: {
          requiredCrewCount: 4,
          requiredRoles: ['Driver', 'Paramedic', 'Fire Fighter'],
          minimumCertificationLevel: 'Basic',
          assignedCrew: []
        },
        status: {
          current: 'planned'
        },
        stationId: testStationId,
        supervision: {
          supervisorId: supervisorId
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          lastModifiedBy: supervisorId,
          lastModifiedAt: new Date()
        }
      },
      {
        shift: {
          name: 'Night Response Team',
          type: 'regular'
        },
        schedule: {
          date: tomorrow,
          startTime: '00:00',
          endTime: '08:00',
          duration: 8,
          recurrence: 'daily'
        },
        staffing: {
          requiredCrewCount: 3,
          requiredRoles: ['Driver', 'Paramedic'],
          minimumCertificationLevel: 'Basic',
          assignedCrew: []
        },
        status: {
          current: 'planned'
        },
        stationId: testStationId,
        supervision: {
          supervisorId: supervisorId
        },
        audit: {
          createdBy: supervisorId,
          createdAt: new Date(),
          lastModifiedBy: supervisorId,
          lastModifiedAt: new Date()
        }
      }
    ];

    // Clear existing shifts and insert new
    await Shift.deleteMany({});
    await Shift.insertMany(testShifts);
    console.log(`✅ Created ${testShifts.length} test shifts`);

    console.log('\n🎉 Test data setup complete!');
    console.log('\n📋 Test Data Summary:');
    console.log(`   - Crew Members: ${crewMembers.length}`);
    console.log(`   - Shifts: ${testShifts.length}`);
    console.log('\n👥 Available Crew:');
    crewMembers.forEach(crew => {
      console.log(`   - ${crew.personal.firstName} ${crew.personal.lastName} (${crew.professional.role}) - ${crew.professional.certificationLevel}`);
    });
    
    console.log('\n📅 Created Shifts:');
    testShifts.forEach(shift => {
      console.log(`   - ${shift.shift.name}: ${shift.schedule.startTime}-${shift.schedule.endTime} (${shift.staffing.requiredCrewCount} crew needed)`);
    });

    console.log('\n🚀 You can now test the shift management system!');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupTestData();