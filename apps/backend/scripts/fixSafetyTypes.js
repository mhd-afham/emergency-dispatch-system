const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing remaining safety type values in vehicles...");

// Replace type: "safety" with type: "safety_equipment" (but not if it's already safety_equipment)
content = content.replace(/type:\s*"safety"(?!_)/g, 'type: "safety_equipment"');

fs.writeFileSync(seedDataPath, content);
console.log("✅ Safety type values fixed successfully!");
