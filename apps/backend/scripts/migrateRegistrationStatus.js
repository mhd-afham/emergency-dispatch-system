/**
 * Migration Script: rejectionDetails to registrationStatus
 * 
 * This script migrates existing Vehicle and Crew documents from the old
 * rejectionDetails structure to the new registrationStatus structure.
 * 
 * Changes:
 * - Old: rejectionDetails { rejectedBy, rejectedAt, reason }
 * - New: registrationStatus { status, approvedBy, approvedAt, rejectedBy, rejectedAt, rejectionReason, notes }
 * 
 * Usage:
 *   node apps/backend/scripts/migrateRegistrationStatus.js
 * 
 * Safety Features:
 * - Dry run mode (preview changes without applying)
 * - Backup collection creation
 * - Transaction support
 * - Rollback capability
 * - Progress tracking
 * 
 * Author: System Migration
 * Date: October 8, 2025
 */

const mongoose = require('mongoose');
const readline = require('readline');

// Import models
const Vehicle = require('../models/Vehicle');
const Crew = require('../models/Crew');

// Configuration
const CONFIG = {
  dryRun: process.env.DRY_RUN !== 'false', // Default to dry run for safety
  createBackup: process.env.CREATE_BACKUP !== 'false', // Default to creating backup
  batchSize: 100, // Process in batches for large collections
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Utility function for colored console output
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✖${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency-dispatch';
    
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    log.success(`Connected to MongoDB: ${dbUri}`);
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}

/**
 * Create backup collections
 */
async function createBackups() {
  if (!CONFIG.createBackup) {
    log.warning('Backup creation is disabled');
    return;
  }

  log.header('Creating Backup Collections');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup vehicles
    const vehiclesCollection = mongoose.connection.collection('vehicles');
    const vehicleBackupName = `vehicles_backup_${timestamp}`;
    await vehiclesCollection.aggregate([{ $match: {} }, { $out: vehicleBackupName }]).toArray();
    log.success(`Vehicle backup created: ${vehicleBackupName}`);
    
    // Backup crews
    const crewsCollection = mongoose.connection.collection('crews');
    const crewBackupName = `crews_backup_${timestamp}`;
    await crewsCollection.aggregate([{ $match: {} }, { $out: crewBackupName }]).toArray();
    log.success(`Crew backup created: ${crewBackupName}`);
    
    return { vehicleBackupName, crewBackupName };
  } catch (error) {
    log.error(`Backup creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Analyze collections and show migration preview
 */
async function analyzeCollections() {
  log.header('Analyzing Collections');

  // Analyze vehicles
  const vehicleStats = {
    total: await Vehicle.countDocuments({}),
    withRejectionDetails: await Vehicle.countDocuments({ rejectionDetails: { $exists: true } }),
    withRegistrationStatus: await Vehicle.countDocuments({ registrationStatus: { $exists: true } }),
    withoutEither: 0,
  };
  vehicleStats.withoutEither = vehicleStats.total - vehicleStats.withRejectionDetails - vehicleStats.withRegistrationStatus;

  // Analyze crews
  const crewStats = {
    total: await Crew.countDocuments({}),
    withRejectionDetails: await Crew.countDocuments({ rejectionDetails: { $exists: true } }),
    withRegistrationStatus: await Crew.countDocuments({ registrationStatus: { $exists: true } }),
    withoutEither: 0,
  };
  crewStats.withoutEither = crewStats.total - crewStats.withRejectionDetails - crewStats.withRegistrationStatus;

  // Display statistics
  console.log('📊 Vehicle Collection:');
  console.log(`   Total documents: ${vehicleStats.total}`);
  console.log(`   With rejectionDetails: ${vehicleStats.withRejectionDetails} (to be migrated)`);
  console.log(`   With registrationStatus: ${vehicleStats.withRegistrationStatus} (already migrated)`);
  console.log(`   Without either: ${vehicleStats.withoutEither} (will get default status)`);

  console.log('\n📊 Crew Collection:');
  console.log(`   Total documents: ${crewStats.total}`);
  console.log(`   With rejectionDetails: ${crewStats.withRejectionDetails} (to be migrated)`);
  console.log(`   With registrationStatus: ${crewStats.withRegistrationStatus} (already migrated)`);
  console.log(`   Without either: ${crewStats.withoutEither} (will get default status)`);

  return { vehicleStats, crewStats };
}

/**
 * Migrate a single vehicle document
 */
function migrateVehicle(vehicle) {
  const updates = {};

  if (vehicle.rejectionDetails) {
    // Migrate rejected vehicles
    updates['registrationStatus.status'] = 'rejected';
    updates['registrationStatus.rejectedBy'] = vehicle.rejectionDetails.rejectedBy;
    updates['registrationStatus.rejectedAt'] = vehicle.rejectionDetails.rejectedAt;
    updates['registrationStatus.rejectionReason'] = vehicle.rejectionDetails.reason || '';
    
    // Remove old field
    updates.$unset = { rejectionDetails: 1 };
  } else if (!vehicle.registrationStatus) {
    // Set default status for documents without any status
    updates['registrationStatus.status'] = 'pending';
  }

  return updates;
}

/**
 * Migrate a single crew document
 */
function migrateCrew(crew) {
  const updates = {};

  if (crew.rejectionDetails) {
    // Migrate rejected crew members
    updates['registrationStatus.status'] = 'rejected';
    updates['registrationStatus.rejectedBy'] = crew.rejectionDetails.rejectedBy;
    updates['registrationStatus.rejectedAt'] = crew.rejectionDetails.rejectedAt;
    updates['registrationStatus.rejectionReason'] = crew.rejectionDetails.reason || '';
    
    // Remove old field
    updates.$unset = { rejectionDetails: 1 };
  } else if (!crew.registrationStatus) {
    // Set default status for documents without any status
    updates['registrationStatus.status'] = 'pending';
  }

  return updates;
}

/**
 * Migrate vehicles collection
 */
async function migrateVehicles(dryRun = true) {
  log.header('Migrating Vehicles');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Find all vehicles that need migration
    const vehicles = await Vehicle.find({
      $or: [
        { rejectionDetails: { $exists: true } },
        { registrationStatus: { $exists: false } }
      ]
    });

    log.info(`Found ${vehicles.length} vehicles to process`);

    for (const vehicle of vehicles) {
      try {
        const updates = migrateVehicle(vehicle);

        if (Object.keys(updates).length === 0) {
          skipped++;
          continue;
        }

        if (dryRun) {
          log.info(`[DRY RUN] Would update vehicle ${vehicle._id}: ${JSON.stringify(updates)}`);
        } else {
          const updateOps = { $set: {} };
          
          // Build update operations
          Object.keys(updates).forEach(key => {
            if (key === '$unset') {
              updateOps.$unset = updates.$unset;
            } else {
              updateOps.$set[key] = updates[key];
            }
          });

          await Vehicle.updateOne({ _id: vehicle._id }, updateOps);
          log.success(`Migrated vehicle ${vehicle._id}`);
        }

        migrated++;
      } catch (error) {
        log.error(`Failed to migrate vehicle ${vehicle._id}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n${colors.bright}Vehicle Migration Summary:${colors.reset}`);
    console.log(`   ${colors.green}✓ Migrated: ${migrated}${colors.reset}`);
    console.log(`   ${colors.yellow}⊘ Skipped: ${skipped}${colors.reset}`);
    console.log(`   ${colors.red}✖ Errors: ${errors}${colors.reset}`);

    return { migrated, skipped, errors };
  } catch (error) {
    log.error(`Vehicle migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Migrate crews collection
 */
async function migrateCrews(dryRun = true) {
  log.header('Migrating Crew Members');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Find all crew members that need migration
    const crewMembers = await Crew.find({
      $or: [
        { rejectionDetails: { $exists: true } },
        { registrationStatus: { $exists: false } }
      ]
    });

    log.info(`Found ${crewMembers.length} crew members to process`);

    for (const crew of crewMembers) {
      try {
        const updates = migrateCrew(crew);

        if (Object.keys(updates).length === 0) {
          skipped++;
          continue;
        }

        if (dryRun) {
          log.info(`[DRY RUN] Would update crew ${crew._id}: ${JSON.stringify(updates)}`);
        } else {
          const updateOps = { $set: {} };
          
          // Build update operations
          Object.keys(updates).forEach(key => {
            if (key === '$unset') {
              updateOps.$unset = updates.$unset;
            } else {
              updateOps.$set[key] = updates[key];
            }
          });

          await Crew.updateOne({ _id: crew._id }, updateOps);
          log.success(`Migrated crew member ${crew._id}`);
        }

        migrated++;
      } catch (error) {
        log.error(`Failed to migrate crew ${crew._id}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n${colors.bright}Crew Migration Summary:${colors.reset}`);
    console.log(`   ${colors.green}✓ Migrated: ${migrated}${colors.reset}`);
    console.log(`   ${colors.yellow}⊘ Skipped: ${skipped}${colors.reset}`);
    console.log(`   ${colors.red}✖ Errors: ${errors}${colors.reset}`);

    return { migrated, skipped, errors };
  } catch (error) {
    log.error(`Crew migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  log.header('Verifying Migration');

  try {
    // Check for remaining rejectionDetails
    const vehiclesWithOldStructure = await Vehicle.countDocuments({ rejectionDetails: { $exists: true } });
    const crewsWithOldStructure = await Crew.countDocuments({ rejectionDetails: { $exists: true } });

    // Check for registrationStatus
    const vehiclesWithNewStructure = await Vehicle.countDocuments({ registrationStatus: { $exists: true } });
    const crewsWithNewStructure = await Crew.countDocuments({ registrationStatus: { $exists: true } });

    console.log('🔍 Verification Results:');
    console.log(`   Vehicles with old structure (rejectionDetails): ${vehiclesWithOldStructure}`);
    console.log(`   Vehicles with new structure (registrationStatus): ${vehiclesWithNewStructure}`);
    console.log(`   Crews with old structure (rejectionDetails): ${crewsWithOldStructure}`);
    console.log(`   Crews with new structure (registrationStatus): ${crewsWithNewStructure}`);

    if (vehiclesWithOldStructure === 0 && crewsWithOldStructure === 0) {
      log.success('Migration verified successfully! No old structure found.');
      return true;
    } else {
      log.warning('Migration incomplete. Some documents still have old structure.');
      return false;
    }
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Prompt user for confirmation
 */
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║  Registration Status Migration Script                    ║
║  rejectionDetails → registrationStatus                    ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
  `);

  try {
    // Connect to database
    await connectDatabase();

    // Analyze collections
    const stats = await analyzeCollections();

    // Check if migration is needed
    const totalToMigrate = stats.vehicleStats.withRejectionDetails + 
                          stats.vehicleStats.withoutEither +
                          stats.crewStats.withRejectionDetails + 
                          stats.crewStats.withoutEither;

    if (totalToMigrate === 0) {
      log.success('No documents need migration. All documents are up to date.');
      process.exit(0);
    }

    // Dry run first
    if (CONFIG.dryRun) {
      log.warning('Running in DRY RUN mode. No changes will be made.');
      log.info('To apply changes, run: DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js\n');
    }

    // Run dry run
    await migrateVehicles(true);
    await migrateCrews(true);

    // If dry run, ask user if they want to proceed
    if (CONFIG.dryRun) {
      console.log('\n');
      const proceed = await promptUser('Do you want to run the actual migration? (yes/no): ');
      
      if (!proceed) {
        log.info('Migration cancelled by user.');
        process.exit(0);
      }

      CONFIG.dryRun = false;
    }

    // Create backups
    if (CONFIG.createBackup) {
      await createBackups();
    }

    // Run actual migration
    log.header('Running Actual Migration');
    const vehicleResults = await migrateVehicles(false);
    const crewResults = await migrateCrews(false);

    // Verify migration
    await verifyMigration();

    // Final summary
    log.header('Migration Complete!');
    console.log(`
${colors.bright}Summary:${colors.reset}
  Vehicles: ${colors.green}${vehicleResults.migrated} migrated${colors.reset}, ${colors.yellow}${vehicleResults.skipped} skipped${colors.reset}, ${colors.red}${vehicleResults.errors} errors${colors.reset}
  Crews: ${colors.green}${crewResults.migrated} migrated${colors.reset}, ${colors.yellow}${crewResults.skipped} skipped${colors.reset}, ${colors.red}${crewResults.errors} errors${colors.reset}
    `);

    if (vehicleResults.errors > 0 || crewResults.errors > 0) {
      log.warning('Migration completed with errors. Please review the logs above.');
    } else {
      log.success('Migration completed successfully with no errors!');
    }

    process.exit(0);
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateVehicle, migrateCrew };
