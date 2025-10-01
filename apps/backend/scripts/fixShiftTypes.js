const fs = require("fs");
const path = require("path");

// Read the seedData.js file
const seedDataPath = path.join(__dirname, "seedData.js");
let seedDataContent = fs.readFileSync(seedDataPath, "utf8");

console.log("🔧 Fixing shift types in seedData.js...");

// Fix invalid shift type
const invalidShiftTypeFixes = [
  {
    invalid: 'type: "special"',
    valid: 'type: "emergency"',
    reason:
      "special → emergency (weekend emergency shift should be emergency type)",
  },
];

let fixCount = 0;

invalidShiftTypeFixes.forEach((fix) => {
  const regex = new RegExp(
    fix.invalid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "g"
  );
  const matches = seedDataContent.match(regex);

  if (matches) {
    seedDataContent = seedDataContent.replace(regex, fix.valid);
    const count = matches.length;
    fixCount += count;
    console.log(
      `✅ Fixed ${count} occurrence(s) of "${fix.invalid}" → "${fix.valid}"`
    );
    console.log(`   Reason: ${fix.reason}`);
  } else {
    console.log(`ℹ️  No occurrences found for: ${fix.invalid}`);
  }
});

// Write the updated content back to the file
fs.writeFileSync(seedDataPath, seedDataContent, "utf8");

console.log(`\n🎉 Shift type fix completed!`);
console.log(`📊 Total fixes applied: ${fixCount}`);
console.log(`📁 Updated file: ${seedDataPath}`);

if (fixCount > 0) {
  console.log("\n✨ Valid shift types are now: regular, emergency");
  console.log("🚀 Ready for seeding! Run: npm run seed");
} else {
  console.log(
    "\n⚠️  No fixes were needed - all shift types were already valid"
  );
}
