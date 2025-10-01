const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing incident type enum values...");

// Fix incident type values
content = content.replace(
  /incidentType:\s*"accident"/g,
  'incidentType: "traffic"'
);
content = content.replace(
  /incidentType:\s*"emergency"/g,
  'incidentType: "medical"'
);
content = content.replace(
  /incidentType:\s*"disaster"/g,
  'incidentType: "other"'
);
content = content.replace(/incidentType:\s*"crime"/g, 'incidentType: "other"');

fs.writeFileSync(seedDataPath, content);
console.log("✅ Incident type enum values fixed successfully!");
