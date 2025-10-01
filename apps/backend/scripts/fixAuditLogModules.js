const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing audit log module enum values...");

// Valid modules: "authentication", "incident_management", "vehicle_management", "crew_management",
// "station_management", "shift_management", "assignment_management", "communication",
// "equipment_check", "reporting", "user_management", "system_configuration", "audit"

content = content.replace(
  /module:\s*"other"/g,
  'module: "system_configuration"'
);
content = content.replace(
  /module:\s*"general"/g,
  'module: "system_configuration"'
);
content = content.replace(
  /module:\s*"misc"/g,
  'module: "system_configuration"'
);
content = content.replace(
  /module:\s*"system"/g,
  'module: "system_configuration"'
);

fs.writeFileSync(seedDataPath, content);
console.log("✅ Audit log module enum values fixed successfully!");
