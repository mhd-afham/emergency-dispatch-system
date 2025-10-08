# Migration Quick Reference

## 🚀 Quick Start

### Preview Changes (Safe)
```bash
node apps/backend/scripts/migrateRegistrationStatus.js
```

### Run Migration (After Preview)
```bash
DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js
```

## 📋 Pre-Migration Checklist

- [ ] Backup database manually
- [ ] Stop application servers (optional)
- [ ] Test in development environment first
- [ ] Review dry run output
- [ ] Ensure MongoDB is accessible
- [ ] Have rollback plan ready

## 🔄 Migration Flow

```
1. Connect to MongoDB
   ↓
2. Analyze collections
   ↓
3. Show statistics
   ↓
4. Run dry run (preview)
   ↓
5. Ask for confirmation
   ↓
6. Create backups
   ↓
7. Migrate vehicles
   ↓
8. Migrate crews
   ↓
9. Verify migration
   ↓
10. Show summary
```

## 📊 What Gets Migrated?

### Rejected Items
```javascript
// BEFORE
rejectionDetails: {
  rejectedBy: ObjectId,
  rejectedAt: Date,
  reason: "Invalid plate number"
}

// AFTER
registrationStatus: {
  status: "rejected",
  rejectedBy: ObjectId,
  rejectedAt: Date,
  rejectionReason: "Invalid plate number"
}
```

### Pending Items
```javascript
// BEFORE
{} // No field

// AFTER
registrationStatus: {
  status: "pending"
}
```

## ⚡ Common Commands

### Development
```bash
# Development database
MONGODB_URI="mongodb://localhost:27017/emergency-dispatch-dev" \
DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js
```

### Production (Be Careful!)
```bash
# Production database
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/emergency-dispatch" \
DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js
```

### Without Backup (Not Recommended)
```bash
CREATE_BACKUP=false DRY_RUN=false node apps/backend/scripts/migrateRegistrationStatus.js
```

## 🔍 Verification Queries

### MongoDB Shell
```javascript
// Check old structure (should be 0)
db.vehicles.countDocuments({ rejectionDetails: { $exists: true } })
db.crews.countDocuments({ rejectionDetails: { $exists: true } })

// Check new structure
db.vehicles.countDocuments({ "registrationStatus.status": "pending" })
db.vehicles.countDocuments({ "registrationStatus.status": "approved" })
db.vehicles.countDocuments({ "registrationStatus.status": "rejected" })

// View sample
db.vehicles.findOne({ "registrationStatus.status": "rejected" })
```

## 🔙 Quick Rollback

### List Backups
```bash
mongosh --eval "db.getCollectionNames().filter(name => name.includes('backup'))"
```

### Restore (Replace TIMESTAMP)
```bash
# Restore vehicles
mongosh --eval "db.vehicles_backup_TIMESTAMP.aggregate([{ \$out: 'vehicles' }])"

# Restore crews
mongosh --eval "db.crews_backup_TIMESTAMP.aggregate([{ \$out: 'crews' }])"
```

## ⚠️ Warning Signs

Stop and investigate if you see:
- ❌ High error count in migration
- ❌ Verification fails
- ❌ Unexpected document counts
- ❌ MongoDB errors or timeouts
- ❌ Application errors after migration

## ✅ Success Indicators

Migration successful if:
- ✓ Zero documents with old structure
- ✓ All documents have registrationStatus
- ✓ Verification passes
- ✓ No errors in output
- ✓ Application works normally

## 🆘 Emergency Contacts

If migration fails:
1. **DO NOT** delete backup collections
2. **STOP** the application
3. **DOCUMENT** all error messages
4. **CONTACT** development team
5. **PREPARE** to rollback if needed

## 📁 File Locations

```
apps/backend/scripts/
├── migrateRegistrationStatus.js  ← Main script
├── MIGRATION_GUIDE.md            ← Full guide
└── MIGRATION_QUICKREF.md         ← This file
```

## 🔗 Related Files Changed

### Backend
- `models/Vehicle.js` - New registrationStatus schema
- `models/Crew.js` - New registrationStatus schema
- `controllers/vehicleController.js` - 7 methods updated
- `controllers/crewController.js` - 7 methods updated

### Frontend
- `components/admin/AdminRegistrationSection.tsx`
- `components/supervisor/SupervisorPendingApprovals.tsx`
- `components/common/ViewDetailsModal.tsx`
- `components/RegistrationFormsView.tsx`

## 💡 Pro Tips

1. **Always test in dev first**
2. **Run dry run before actual migration**
3. **Keep backups for 7+ days**
4. **Monitor application after migration**
5. **Deploy all changes together** (backend + frontend)
6. **Schedule during low-traffic hours**
7. **Have team on standby** during migration

## 📞 Quick Support

**Script Issues:**
- Check MongoDB connection
- Verify environment variables
- Review error messages
- Check database permissions

**Application Issues:**
- Clear browser cache
- Restart backend server
- Check API responses
- Verify populated fields

---

**For detailed information, see:** [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
