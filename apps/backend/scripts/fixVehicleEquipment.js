const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing vehicle equipment enum values...");

// Fix vehicle equipment type enum values
const vehicleEquipmentTypeMapping = {
  '"safety"': '"safety_equipment"',
  '"equipment"': '"medical_equipment"',
  '"supply"': '"medical_supply"',
  '"system"': '"communication"',
  '"documentation"': '"other"',
};

// Apply vehicle equipment type replacements with simpler global replace
for (const [invalid, valid] of Object.entries(vehicleEquipmentTypeMapping)) {
  const regex = new RegExp(`type:\\s*${invalid}`, "g");
  content = content.replace(regex, `type: ${valid}`);
}

fs.writeFileSync(seedDataPath, content);
console.log("✅ Vehicle equipment enum values fixed successfully!");
