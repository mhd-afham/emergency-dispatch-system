const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing equipment template enum values...");

// Fix equipment type enum values
const equipmentTypeMapping = {
  '"medical_equipment"': '"equipment"',
  '"medical_supply"': '"supply"',
  '"safety_equipment"': '"safety"',
  '"communication_equipment"': '"equipment"',
  '"rescue_equipment"': '"equipment"',
  '"fire_equipment"': '"equipment"',
  '"vehicle_equipment"': '"equipment"',
  '"communication"': '"system"',
};

// Fix checkType enum values
const checkTypeMapping = {
  '"gauge_reading"': '"pressure_check"',
  '"inventory_count"': '"quantity_check"',
  '"battery_test"': '"functional_test"',
  '"fluid_check"': '"visual_inspection"',
  '"system_test"': '"functional_test"',
  '"performance_test"': '"functional_test"',
  '"maintenance_check"': '"visual_inspection"',
  '"operational_test"': '"functional_test"',
  '"condition_check"': '"visual_inspection"',
  '"compliance_check"': '"documentation_review"',
};

// Apply equipment type replacements
for (const [invalid, valid] of Object.entries(equipmentTypeMapping)) {
  const regex = new RegExp(`type:\\s*${invalid}`, "g");
  content = content.replace(regex, `type: ${valid}`);
}

// Apply checkType replacements
for (const [invalid, valid] of Object.entries(checkTypeMapping)) {
  const regex = new RegExp(`checkType:\\s*${invalid}`, "g");
  content = content.replace(regex, `checkType: ${valid}`);
}

fs.writeFileSync(seedDataPath, content);
console.log("✅ Equipment template enum values fixed successfully!");
