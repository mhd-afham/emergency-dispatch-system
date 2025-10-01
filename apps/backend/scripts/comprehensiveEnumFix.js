const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Comprehensive fix for all enum validation issues...");

// First, fix all vehicle equipment types to be valid for Vehicle model
// Valid vehicle equipment types: "medical_equipment", "medical_supply", "safety_equipment", "communication", "other"
content = content.replace(/type:\s*"safety"(?!_)/g, 'type: "safety_equipment"');
content = content.replace(/type:\s*"system"/g, 'type: "communication"');
content = content.replace(
  /type:\s*"equipment"(?!_)/g,
  'type: "medical_equipment"'
);
content = content.replace(/type:\s*"supply"(?!_)/g, 'type: "medical_supply"');

// Now fix equipment checklist template types - but this is tricky because
// the valid values are different: "equipment", "supply", "system", "safety", "documentation"

// Find the equipment template section and fix it separately
const templateSectionStart = content.indexOf(
  "const equipmentChecklistTemplates"
);
if (templateSectionStart !== -1) {
  const templateSectionEnd = content.indexOf("];", templateSectionStart);
  if (templateSectionEnd !== -1) {
    let templateSection = content.substring(
      templateSectionStart,
      templateSectionEnd + 2
    );

    // Fix template-specific enum values (reverse the global fixes for this section)
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

    // Replace the template section in the original content
    content =
      content.substring(0, templateSectionStart) +
      templateSection +
      content.substring(templateSectionEnd + 2);
  }
}

fs.writeFileSync(seedDataPath, content);
console.log("✅ Comprehensive enum fixes applied successfully!");
