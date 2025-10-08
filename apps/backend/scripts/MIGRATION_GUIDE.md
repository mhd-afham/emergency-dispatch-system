# Registration Status Migration Guide

## Overview

This guide explains how to migrate your database from the old `rejectionDetails` structure to the new `registrationStatus` structure for both Vehicle and Crew collections.

## What Changed?

### Old Structure (rejectionDetails)
```javascript
{
  rejectionDetails: {
    rejectedBy: ObjectId,
    rejectedAt: Date,
    reason: String
  }
}
```

### New Structure (registrationStatus)
```javascript
{
  registrationStatus: {
    status: String,              // "pending", "approved", "rejected"
    approvedBy: ObjectId,        // Reference to User
    approvedAt: Date,
    rejectedBy: ObjectId,        // Reference to User
    rejectedAt: Date,
    rejectionReason: String,     // Renamed from "reason"
    notes: String                // New field for additional context
  }
}
```

## Migration Script Features

✅ **Safe by Default**
- Dry run mode (preview changes without applying)
- Automatic backup creation
- Progress tracking and error reporting

✅ **Smart Migration**
- Automatically converts `rejectionDetails` → `registrationStatus`
- Sets default "pending" status for new documents
- Handles field renaming (`reason` → `rejectionReason`)
- Removes old `rejectionDetails` field after migration

✅ **Verification**
- Post-migration verification
- Detailed statistics and reporting
- Error logging for troubleshooting

## Prerequisites

1. **Backup Your Database** (The script creates automatic backups, but manual backup is recommended)
   ```bash
   mongodump --uri="your_mongodb_uri" --out=./backup
   ```

2. **Stop Your Application** (Optional but recommended)
   ```bash
   # Stop the backend server
   npm stop
   ```

3. **Ensure MongoDB Connection**
   - Set `MONGODB_URI` environment variable, or
   - Update the connection string in the script

## Usage

### Step 1: Preview Changes (Dry Run)

Run the migration in **dry run mode** to see what will be changed:

```bash
# From project root
node apps/backend/scripts/migrateRegistrationStatus.js
```

Or with explicit dry run flag:

```bash
DRY_RUN=true node apps/backend/scripts/migrateRegistrationStatus.js
```

**What you'll see:**
- Statistics on how many documents will be migrated
- Preview of changes for each document
- No actual modifications to the database

### Step 2: Review the Dry Run Output

Example output:
```
📊 Vehicle Collection:
   Total documents: 150
   With rejectionDetails: 23 (to be migrated)
   With registrationStatus: 100 (already migrated)
   Without either: 27 (will get default status)

📊 Crew Collection:
   Total documents: 85
   With rejectionDetails: 12 (to be migrated)
   With registrationStatus: 60 (already migrated)
   Without either: 13 (will get default status)
```

### Step 3: Run Actual Migration

After reviewing the dry run, execute the migration:

```bash
DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js
```

The script will:
1. Show statistics
2. Run a dry run preview
3. **Ask for confirmation** before proceeding
4. Create backup collections
5. Migrate all documents
6. Verify the migration
7. Display summary

### Step 4: Verify Results

The script automatically verifies the migration. You can also manually verify:

```javascript
// In MongoDB shell or Compass
// Check for remaining old structure
db.vehicles.countDocuments({ rejectionDetails: { $exists: true } })
db.crews.countDocuments({ rejectionDetails: { $exists: true } })

// Should return 0 for both

// Check new structure
db.vehicles.findOne({ "registrationStatus.status": "rejected" })
db.crews.findOne({ "registrationStatus.status": "rejected" })
```

## Configuration Options

You can customize the migration behavior with environment variables:

```bash
# Disable dry run (actually apply changes)
DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js

# Disable automatic backup creation (not recommended)
CREATE_BACKUP=false DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js

# Custom MongoDB URI
MONGODB_URI="mongodb://localhost:27017/emergency-dispatch" node apps/backend/scripts/migrateRegistrationStatus.js
```

## Migration Logic

### For Documents with `rejectionDetails`:
1. Create new `registrationStatus` object
2. Set `status` to `"rejected"`
3. Copy `rejectedBy` → `registrationStatus.rejectedBy`
4. Copy `rejectedAt` → `registrationStatus.rejectedAt`
5. Copy `reason` → `registrationStatus.rejectionReason`
6. Remove old `rejectionDetails` field

### For Documents without Either Structure:
1. Create new `registrationStatus` object
2. Set `status` to `"pending"`
3. Leave other fields undefined

### For Documents Already Migrated:
- Skip (no changes needed)

## Rollback Procedure

If you need to rollback the migration:

### Option 1: Restore from Automatic Backup

The script creates backups named with timestamps:
```
vehicles_backup_2025-10-08T14-30-00-000Z
crews_backup_2025-10-08T14-30-00-000Z
```

Restore using MongoDB:
```bash
# List backup collections
mongosh --eval "db.getCollectionNames().filter(name => name.includes('backup'))"

# Restore vehicles (replace TIMESTAMP with actual timestamp)
mongosh --eval "db.vehicles_backup_TIMESTAMP.aggregate([{ \$out: 'vehicles' }])"

# Restore crews
mongosh --eval "db.crews_backup_TIMESTAMP.aggregate([{ \$out: 'crews' }])"
```

### Option 2: Restore from Manual Backup

If you created a manual backup:
```bash
mongorestore --uri="your_mongodb_uri" --drop ./backup
```

## Troubleshooting

### Issue: "Failed to connect to MongoDB"
**Solution:** 
- Check your `MONGODB_URI` environment variable
- Ensure MongoDB is running
- Verify connection string is correct

### Issue: Migration shows errors for some documents
**Solution:**
- Check error messages in the output
- Verify those documents have valid structure
- Fix problematic documents manually and re-run migration

### Issue: "No documents need migration"
**Solution:**
- Migration already completed
- All documents are up to date
- No action needed

### Issue: Script hangs or takes too long
**Solution:**
- The script processes documents one by one (safe but slower)
- For very large collections, consider increasing batch size in the script
- Monitor MongoDB connection and resources

## Testing in Development

Before running in production, test in your development environment:

1. **Create a copy of production data:**
   ```bash
   mongodump --uri="production_uri" --out=./prod_backup
   mongorestore --uri="dev_uri" ./prod_backup
   ```

2. **Run migration on development database:**
   ```bash
   MONGODB_URI="dev_uri" DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js
   ```

3. **Test your application** with migrated data

4. **Verify all features work** (approve, reject, edit, delete)

## Post-Migration Checklist

After successful migration:

- [ ] Verify no errors in migration output
- [ ] Check document counts match expected values
- [ ] Test approval workflow
- [ ] Test rejection workflow
- [ ] Test clear rejection feature
- [ ] Test delete rejected items
- [ ] Test edit rejected items
- [ ] Verify UI displays correctly
- [ ] Monitor application logs for errors
- [ ] Keep backup collections for at least 7 days
- [ ] Update team documentation
- [ ] Deploy updated code to production

## Support

If you encounter issues during migration:

1. **Stop the migration** (Ctrl+C if in progress)
2. **Do NOT delete backup collections**
3. **Document the error message**
4. **Check MongoDB logs**
5. **Contact the development team** with:
   - Error messages
   - Migration output
   - Database statistics (document counts)

## Additional Notes

### Performance Considerations
- Migration runs synchronously for data consistency
- For very large collections (100k+ documents), expect longer run times
- Consider running during low-traffic hours
- Monitor database CPU and memory usage

### Data Integrity
- The script maintains referential integrity
- ObjectId references are preserved
- Timestamps are copied exactly
- No data loss occurs during migration

### Backward Compatibility
- Old code will not work after migration
- Ensure all application instances are updated
- Frontend and backend must be deployed together
- Mobile apps may need updates

## Script Location

```
emergency-dispatch-system/
└── apps/
    └── backend/
        └── scripts/
            ├── migrateRegistrationStatus.js  (Migration script)
            └── MIGRATION_GUIDE.md            (This guide)
```

## Version History

- **v1.0.0** (October 8, 2025) - Initial migration script
  - Migrates rejectionDetails to registrationStatus
  - Supports dry run and backup creation
  - Automatic verification

---

**Last Updated:** October 8, 2025  
**Script Version:** 1.0.0  
**Author:** Development Team
