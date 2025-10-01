const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing system type values in vehicles...");

// Replace type: "system" with type: "communication"
content = content.replace(/type:\s*"system"/g, 'type: "communication"');

fs.writeFileSync(seedDataPath, content);
console.log("✅ System type values fixed successfully!");
