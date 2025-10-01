const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing incident category values to match incident types...");

// Valid categories per incident type from the model:
// medical: ['cardiac_arrest', 'respiratory_emergency', 'trauma', 'unconscious', 'allergic_reaction', 'other_medical']
// fire: ['structure_fire', 'vehicle_fire', 'wildfire', 'explosion', 'smoke_investigation', 'other_fire']
// rescue: ['vehicle_accident', 'water_rescue', 'confined_space', 'height_rescue', 'animal_rescue', 'other_rescue']
// hazmat: ['chemical_spill', 'gas_leak', 'toxic_exposure', 'environmental', 'other_hazmat']
// traffic: ['collision', 'road_obstruction', 'traffic_control', 'other_traffic']
// other: ['public_service', 'assist_police', 'false_alarm', 'other']

// Fix common category mapping issues
content = content.replace(
  /incidentCategory:\s*"motor_vehicle_accident"/g,
  'incidentCategory: "collision"'
);
content = content.replace(
  /incidentCategory:\s*"car_accident"/g,
  'incidentCategory: "collision"'
);
content = content.replace(
  /incidentCategory:\s*"accident"/g,
  'incidentCategory: "collision"'
);
content = content.replace(
  /incidentCategory:\s*"road_accident"/g,
  'incidentCategory: "collision"'
);
content = content.replace(
  /incidentCategory:\s*"vehicle_collision"/g,
  'incidentCategory: "collision"'
);

content = content.replace(
  /incidentCategory:\s*"building_fire"/g,
  'incidentCategory: "structure_fire"'
);
content = content.replace(
  /incidentCategory:\s*"house_fire"/g,
  'incidentCategory: "structure_fire"'
);
content = content.replace(
  /incidentCategory:\s*"forest_fire"/g,
  'incidentCategory: "wildfire"'
);

content = content.replace(
  /incidentCategory:\s*"heart_attack"/g,
  'incidentCategory: "cardiac_arrest"'
);
content = content.replace(
  /incidentCategory:\s*"breathing_difficulty"/g,
  'incidentCategory: "respiratory_emergency"'
);
content = content.replace(
  /incidentCategory:\s*"injury"/g,
  'incidentCategory: "trauma"'
);

content = content.replace(
  /incidentCategory:\s*"drowning"/g,
  'incidentCategory: "water_rescue"'
);
content = content.replace(
  /incidentCategory:\s*"trapped_person"/g,
  'incidentCategory: "confined_space"'
);

content = content.replace(
  /incidentCategory:\s*"oil_spill"/g,
  'incidentCategory: "chemical_spill"'
);
content = content.replace(
  /incidentCategory:\s*"chemical_leak"/g,
  'incidentCategory: "chemical_spill"'
);

// Fix additional invalid categories found in the data
content = content.replace(
  /incidentCategory:\s*"rescue_operations"/g,
  'incidentCategory: "other_rescue"'
);
content = content.replace(
  /incidentCategory:\s*"obstetric_emergency"/g,
  'incidentCategory: "other_medical"'
);
content = content.replace(
  /incidentCategory:\s*"marine_emergency"/g,
  'incidentCategory: "water_rescue"'
);
content = content.replace(
  /incidentCategory:\s*"train_accident"/g,
  'incidentCategory: "other_traffic"'
);
content = content.replace(
  /incidentCategory:\s*"wilderness_rescue"/g,
  'incidentCategory: "other_rescue"'
);

fs.writeFileSync(seedDataPath, content);
console.log("✅ Incident category values fixed successfully!");
