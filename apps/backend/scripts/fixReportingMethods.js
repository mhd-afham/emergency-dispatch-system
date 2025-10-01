const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing reporting method enum values...");

// Fix reporting method values
// Valid values: 'phone_call', 'mobile_app', 'sms', 'walk_in', 'third_party'
content = content.replace(
  /reportingMethod:\s*"online_portal"/g,
  'reportingMethod: "mobile_app"'
);
content = content.replace(
  /reportingMethod:\s*"web_portal"/g,
  'reportingMethod: "mobile_app"'
);
content = content.replace(
  /reportingMethod:\s*"app"/g,
  'reportingMethod: "mobile_app"'
);
content = content.replace(
  /reportingMethod:\s*"website"/g,
  'reportingMethod: "mobile_app"'
);
content = content.replace(
  /reportingMethod:\s*"emergency_call"/g,
  'reportingMethod: "phone_call"'
);
content = content.replace(
  /reportingMethod:\s*"call"/g,
  'reportingMethod: "phone_call"'
);
content = content.replace(
  /reportingMethod:\s*"text"/g,
  'reportingMethod: "sms"'
);
content = content.replace(
  /reportingMethod:\s*"in_person"/g,
  'reportingMethod: "walk_in"'
);
content = content.replace(
  /reportingMethod:\s*"radio_call"/g,
  'reportingMethod: "third_party"'
);
content = content.replace(
  /reportingMethod:\s*"satellite_phone"/g,
  'reportingMethod: "phone_call"'
);

fs.writeFileSync(seedDataPath, content);
console.log("✅ Reporting method enum values fixed successfully!");
