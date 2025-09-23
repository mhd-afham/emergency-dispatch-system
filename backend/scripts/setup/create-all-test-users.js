const mongoose = require("mongoose");
const User = require("../../models/User");
require("dotenv").config();

const testUsers = [
  {
    personal: {
      firstName: "John",
      lastName: "Admin",
      email: "admin@test.com",
      phone: "+94771234567",
    },
    auth: {
      password: "admin123",
      role: "Admin",
      employeeId: "EMP123456",
    },
  },
  {
    personal: {
      firstName: "Sarah",
      lastName: "Dispatcher",
      email: "dispatcher@test.com",
      phone: "+94771234568",
    },
    auth: {
      password: "dispatcher123",
      role: "Dispatcher",
      employeeId: "EMP123457",
    },
  },
  {
    personal: {
      firstName: "Mike",
      lastName: "CallTaker",
      email: "calltaker@test.com",
      phone: "+94771234569",
    },
    auth: {
      password: "calltaker123",
      role: "Call Taker",
      employeeId: "EMP123458",
    },
  },
  {
    personal: {
      firstName: "Emily",
      lastName: "Supervisor",
      email: "supervisor@test.com",
      phone: "+94771234570",
    },
    auth: {
      password: "supervisor123",
      role: "Supervisor",
      employeeId: "EMP123459",
    },
  },
  {
    personal: {
      firstName: "Alex",
      lastName: "FieldCrew",
      email: "fieldcrew@test.com",
      phone: "+94771234571",
    },
    auth: {
      password: "fieldcrew123",
      role: "Field Crew",
      employeeId: "EMP123460",
    },
  },
  {
    personal: {
      firstName: "Maria",
      lastName: "Citizen",
      email: "citizen@test.com",
      phone: "+94771234572",
    },
    auth: {
      password: "citizen123",
      role: "Citizen",
      employeeId: null, // Citizens don't have employee IDs
    },
  },
];

async function createAllTestUsers() {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // Clean existing test users
    console.log("🧹 Cleaning existing test users...");
    await User.deleteMany({ "personal.email": /test\.com$/ });
    console.log("✅ Cleaned existing test users");

    console.log("👥 Creating test users...");

    for (const userData of testUsers) {
      try {
        const user = new User(userData);
        await user.save();

        console.log(
          `✅ Created user: ${userData.personal.firstName} ${userData.personal.lastName} (${userData.auth.role})`
        );
        console.log(`   📧 Email: ${userData.personal.email}`);
        console.log(`   🔑 Password: ${userData.auth.password}`);
        console.log(`   🆔 Employee ID: ${userData.auth.employeeId}`);
        console.log("");
      } catch (error) {
        console.error(
          `❌ Failed to create user ${userData.personal.email}:`,
          error.message
        );
      }
    }

    console.log("🎉 Test user creation completed!");
    console.log("");
    console.log("📝 LOGIN CREDENTIALS:");
    console.log("=".repeat(50));
    testUsers.forEach((user) => {
      console.log(`${user.auth.role}:`);
      console.log(`  📧 Email: ${user.personal.email}`);
      console.log(`  🔑 Password: ${user.auth.password}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

createAllTestUsers();
