const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "seedData.js");
let content = fs.readFileSync(seedDataPath, "utf8");

// Fix employee IDs to proper format (EMP + 6 digits)
const employeeIdPattern = /employeeId: "EMP000",/g;
let employeeCounter = 1;
content = content.replace(employeeIdPattern, () => {
  const paddedNumber = employeeCounter.toString().padStart(6, "0");
  employeeCounter++;
  return `employeeId: "EMP${paddedNumber}",`;
});

// Fix roles
content = content.replace(/role: "Fire Captain"/g, 'role: "Supervisor"');
content = content.replace(
  /role: "Paramedic Supervisor"/g,
  'role: "Supervisor"'
);
content = content.replace(/role: "Rescue Team Leader"/g, 'role: "Supervisor"');
content = content.replace(/role: "Police Inspector"/g, 'role: "Supervisor"');
content = content.replace(/role: "Police Sergeant"/g, 'role: "Supervisor"');
content = content.replace(/role: "Police Constable"/g, 'role: "Driver"');

// Fix specializations - replace invalid ones with valid enum values
const specializationMap = {
  '"team_leadership"': '"other"',
  '"emergency_communications"': '"other"',
  '"hazmat_response"': '"hazmat"',
  '"water_rescue"': '"rescue_operations"',
  '"structural_rescue"': '"rescue_operations"',
  '"coastal_operations"': '"rescue_operations"',
  '"aerial_operations"': '"rescue_operations"',
  '"technical_rescue"': '"rescue_operations"',
  '"high_angle_rescue"': '"rescue_operations"',
  '"wildfire_operations"': '"fire_suppression"',
  '"rural_rescue"': '"rescue_operations"',
  '"forest_operations"': '"fire_suppression"',
  '"critical_care"': '"cardiac_care"',
  '"medical_communications"': '"other"',
  '"intensive_transport"': '"medical_transport"',
  '"coastal_medical_response"': '"medical_transport"',
  '"rural_medicine"': '"emergency_medicine"',
  '"water_emergencies"': '"rescue_operations"',
  '"tourist_medical_response"': '"medical_transport"',
  '"advanced_life_support"': '"emergency_medicine"',
  '"heritage_site_response"': '"other"',
  '"archaeological_emergencies"': '"other"',
  '"maritime_medicine"': '"emergency_medicine"',
  '"port_emergencies"': '"emergency_medicine"',
  '"international_visitor_care"': '"medical_transport"',
  '"resort_medicine"': '"emergency_medicine"',
  '"helicopter_operations"': '"other"',
  '"luxury_healthcare_transport"': '"medical_transport"',
  '"marine_operations"': '"rescue_operations"',
  '"diving_operations"': '"rescue_operations"',
  '"urban_rescue"': '"rescue_operations"',
  '"heavy_lifting"': '"rescue_operations"',
  '"structural_collapse"': '"rescue_operations"',
  '"industrial_accidents"': '"rescue_operations"',
  '"chemical_spills"': '"hazmat"',
  '"industrial_safety"': '"hazmat"',
  '"decontamination"': '"hazmat"',
  '"flood_rescue"': '"rescue_operations"',
  '"electrical_emergencies"': '"rescue_operations"',
  '"disaster_response"': '"rescue_operations"',
  '"power_restoration"': '"other"',
  '"mountain_rescue"': '"rescue_operations"',
  '"vehicle_recovery"': '"rescue_operations"',
  '"cliff_rescue"': '"rescue_operations"',
  '"wilderness_operations"': '"rescue_operations"',
  '"emergency_command"': '"other"',
  '"traffic_management"': '"other"',
  '"crowd_control"': '"other"',
  '"inter_agency_coordination"': '"other"',
  '"mobile_command"': '"other"',
  '"communication_systems"': '"other"',
  '"field_coordination"': '"other"',
  '"emergency_protocols"': '"other"',
  '"incident_management"': '"other"',
  '"public_safety"': '"other"',
  '"coastal_security"': '"other"',
  '"industrial_fires"': '"fire_suppression"',
  '"pediatric_care"': '"pediatric"',
  '"cardiac_emergencies"': '"cardiac_care"',
  '"trauma_care"': '"trauma"',
  '"emergency_transport"': '"medical_transport"',
  '"coastal_rescue"': '"rescue_operations"',
};

// Apply all specialization replacements
for (const [invalid, valid] of Object.entries(specializationMap)) {
  content = content.replace(new RegExp(invalid, "g"), valid);
}

fs.writeFileSync(seedDataPath, content);
console.log("✅ Crew data fixed successfully!");
