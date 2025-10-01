const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing equipment template types specifically...");

// Find the equipmentTemplates section
const templateStart = content.indexOf("const equipmentTemplates");
if (templateStart === -1) {
  console.log("❌ Could not find equipmentTemplates section");
  process.exit(1);
}

// Find the end of the equipmentTemplates array
let bracketCount = 0;
let searchStart = content.indexOf("[", templateStart);
let i = searchStart;

while (i < content.length) {
  if (content[i] === "[") bracketCount++;
  else if (content[i] === "]") bracketCount--;

  if (bracketCount === 0) break;
  i++;
}

const templateEnd = i + 1;

// Extract and fix the template section
let templateSection = content.substring(templateStart, templateEnd);

templateSection = templateSection.replace(
  /type:\s*"communication"/g,
  'type: "system"'
);
templateSection = templateSection.replace(
  /type:\s*"medical_equipment"/g,
  'type: "equipment"'
);
templateSection = templateSection.replace(
  /type:\s*"medical_supply"/g,
  'type: "supply"'
);
templateSection = templateSection.replace(
  /type:\s*"safety_equipment"/g,
  'type: "safety"'
);

// Reconstruct the content
const newContent =
  content.substring(0, templateStart) +
  templateSection +
  content.substring(templateEnd);

fs.writeFileSync(seedDataPath, newContent);
console.log("✅ Equipment template types fixed successfully!");
