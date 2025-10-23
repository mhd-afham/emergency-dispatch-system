/**
 * Script to recalculate performance metrics for existing assignments
 * Run this to populate performance data for assignments created before the pre-save hook
 */

const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
require("dotenv").config();

async function recalculatePerformanceMetrics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/emergency-dispatch",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("✅ Connected to MongoDB");

    // Find all assignments
    const assignments = await Assignment.find({});
    console.log(`\n📊 Found ${assignments.length} assignments to process\n`);

    let updated = 0;
    let skipped = 0;

    for (const assignment of assignments) {
      let needsUpdate = false;

      console.log(`\n📝 Processing: ${assignment.assignmentId}`);
      console.log(`   Status: ${assignment.response?.status}`);
      console.log(`   Current performance:`, assignment.performance);

      // Calculate response time (assignment to en_route)
      if (
        assignment.response?.enRouteAt &&
        assignment.dispatch?.assignedAt &&
        !assignment.performance?.responseTime
      ) {
        assignment.performance.responseTime = Math.round(
          (new Date(assignment.response.enRouteAt) -
            new Date(assignment.dispatch.assignedAt)) /
            1000
        );
        console.log(
          `   ✓ Calculated responseTime: ${assignment.performance.responseTime}s`
        );
        needsUpdate = true;
      }

      // Calculate arrival time (assignment to on_scene)
      if (
        assignment.response?.onSceneAt &&
        assignment.dispatch?.assignedAt &&
        !assignment.performance?.arrivalTime
      ) {
        assignment.performance.arrivalTime = Math.round(
          (new Date(assignment.response.onSceneAt) -
            new Date(assignment.dispatch.assignedAt)) /
            1000
        );
        console.log(
          `   ✓ Calculated arrivalTime: ${assignment.performance.arrivalTime}s`
        );
        needsUpdate = true;
      }

      // Calculate on-scene time (on_scene to completed)
      if (
        assignment.response?.completedAt &&
        assignment.response?.onSceneAt &&
        !assignment.performance?.onSceneTime
      ) {
        assignment.performance.onSceneTime = Math.round(
          (new Date(assignment.response.completedAt) -
            new Date(assignment.response.onSceneAt)) /
            1000
        );
        console.log(
          `   ✓ Calculated onSceneTime: ${assignment.performance.onSceneTime}s`
        );
        needsUpdate = true;
      }

      // Calculate total duration (assignment to completed)
      if (
        assignment.response?.completedAt &&
        assignment.dispatch?.assignedAt &&
        !assignment.performance?.totalDuration
      ) {
        assignment.performance.totalDuration = Math.round(
          (new Date(assignment.response.completedAt) -
            new Date(assignment.dispatch.assignedAt)) /
            1000
        );
        console.log(
          `   ✓ Calculated totalDuration: ${assignment.performance.totalDuration}s`
        );
        needsUpdate = true;
      }

      if (needsUpdate) {
        await assignment.save();
        updated++;
        console.log(`   ✅ Updated performance metrics`);
      } else {
        skipped++;
        console.log(
          `   ⏭️  Skipped (already has metrics or missing timestamps)`
        );
      }
    }

    console.log(`\n\n✅ Processing complete!`);
    console.log(`   Updated: ${updated} assignments`);
    console.log(`   Skipped: ${skipped} assignments`);
    console.log(`   Total: ${assignments.length} assignments\n`);

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
recalculatePerformanceMetrics();
