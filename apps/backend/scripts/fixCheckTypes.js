const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing checkType enum values...");

// Fix checkType values
content = content.replace(
  /checkType:\s*"pressure_test"/g,
  'checkType: "pressure_check"'
);
content = content.replace(
  /checkType:\s*"system_test"/g,
  'checkType: "functional_test"'
);
content = content.replace(
  /checkType:\s*"performance_test"/g,
  'checkType: "functional_test"'
);
content = content.replace(
  /checkType:\s*"battery_test"/g,
  'checkType: "functional_test"'
);
content = content.replace(
  /checkType:\s*"fluid_check"/g,
  'checkType: "visual_inspection"'
);
content = content.replace(
  /checkType:\s*"gauge_reading"/g,
  'checkType: "pressure_check"'
);
content = content.replace(
  /checkType:\s*"inventory_count"/g,
  'checkType: "quantity_check"'
);
content = content.replace(
  /checkType:\s*"condition_check"/g,
  'checkType: "visual_inspection"'
);
content = content.replace(
  /checkType:\s*"maintenance_check"/g,
  'checkType: "visual_inspection"'
);
content = content.replace(
  /checkType:\s*"operational_test"/g,
  'checkType: "functional_test"'
);
content = content.replace(
  /checkType:\s*"compliance_check"/g,
  'checkType: "documentation_review"'
);
content = content.replace(
  /checkType:\s*"communication_test"/g,
  'checkType: "functional_test"'
);
content = content.replace(
  /checkType:\s*"inventory_check"/g,
  'checkType: "quantity_check"'
);

// Fix vehicleType issues
content = content.replace(
  /vehicleType:\s*"police_vehicle"/g,
  'vehicleType: "support_vehicle"'
);

fs.writeFileSync(seedDataPath, content);
console.log("✅ CheckType enum values fixed successfully!");
