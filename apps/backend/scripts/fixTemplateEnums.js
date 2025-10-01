const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing equipment template enum values correctly...");

// Find equipment template sections and fix enum values
const templateStartPattern = /equipmentChecklistTemplates.*?=/;
const templateEndPattern = /^\];/m;

const templateStart = content.search(templateStartPattern);
if (templateStart !== -1) {
  const templateSection = content.substring(templateStart);
  const templateEnd = templateSection.search(templateEndPattern);

  if (templateEnd !== -1) {
    let templateContent = templateSection.substring(0, templateEnd + 2);

    // Fix template-specific enum values
    templateContent = templateContent.replace(
      /type:\s*"communication"/g,
      'type: "system"'
    );
    templateContent = templateContent.replace(
      /type:\s*"medical_equipment"/g,
      'type: "equipment"'
    );
    templateContent = templateContent.replace(
      /type:\s*"medical_supply"/g,
      'type: "supply"'
    );

    // Replace in original content
    content =
      content.substring(0, templateStart) +
      templateContent +
      content.substring(templateStart + templateEnd + 2);
  }
}

fs.writeFileSync(seedDataPath, content);
console.log("✅ Equipment template enum values fixed successfully!");
