const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing duplicate employee IDs...");

// Extract all crew data and fix employee IDs
const crewMatches = content.match(/employeeId:\s*"EMP\d{6}"/g);
const usedIds = new Set();
const duplicates = [];

if (crewMatches) {
  crewMatches.forEach((match, index) => {
    const empId = match.match(/"(EMP\d{6})"/)[1];
    if (usedIds.has(empId)) {
      duplicates.push(empId);
    } else {
      usedIds.add(empId);
    }
  });

  console.log(
    `Found ${duplicates.length} duplicate employee ID(s):`,
    duplicates
  );

  // Generate unique employee IDs for duplicates
  let counter = 1;
  duplicates.forEach((dupId) => {
    // Find next available ID
    while (usedIds.has(`EMP${String(counter).padStart(6, "0")}`)) {
      counter++;
    }
    const newId = `EMP${String(counter).padStart(6, "0")}`;
    usedIds.add(newId);

    // Replace the first occurrence of duplicate with new ID
    content = content.replace(
      `employeeId: "${dupId}"`,
      `employeeId: "${newId}"`
    );
    console.log(`Replaced duplicate ${dupId} with ${newId}`);
    counter++;
  });
}

fs.writeFileSync(seedDataPath, content);
console.log("✅ Employee ID duplicates fixed successfully!");
