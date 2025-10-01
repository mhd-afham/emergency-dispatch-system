const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing equipment and supply type values in vehicles...");

// Replace type: "equipment" with type: "medical_equipment"
content = content.replace(
  /type:\s*"equipment"(?!_)/g,
  'type: "medical_equipment"'
);

// Replace type: "supply" with type: "medical_supply"
content = content.replace(/type:\s*"supply"(?!_)/g, 'type: "medical_supply"');

fs.writeFileSync(seedDataPath, content);
console.log("✅ Equipment and supply type values fixed successfully!");
