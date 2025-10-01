const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing shift role enum values...");

// Valid roles from Crew model: "EMT", "Paramedic", "Firefighter", "Driver", "Supervisor"
content = content.replace(/"Rescue Specialist"/g, '"Firefighter"');
content = content.replace(/"Communications"/g, '"Supervisor"');
content = content.replace(/"Communication Specialist"/g, '"Supervisor"');
content = content.replace(/"Team Leader"/g, '"Supervisor"');
content = content.replace(/"Medical Technician"/g, '"EMT"');
content = content.replace(/"Fire Captain"/g, '"Supervisor"');
content = content.replace(/"Police Officer"/g, '"Supervisor"');
content = content.replace(/"Paramedic Supervisor"/g, '"Supervisor"');
content = content.replace(/"Rescue Team Leader"/g, '"Supervisor"');
content = content.replace(/"Police Inspector"/g, '"Supervisor"');

// Fix shift types - valid values from error: regular, overtime, emergency
content = content.replace(/type:\s*"night"/g, 'type: "regular"');
content = content.replace(/type:\s*"day"/g, 'type: "regular"');
content = content.replace(/type:\s*"evening"/g, 'type: "regular"');

fs.writeFileSync(seedDataPath, content);
console.log("✅ Shift role enum values fixed successfully!");
