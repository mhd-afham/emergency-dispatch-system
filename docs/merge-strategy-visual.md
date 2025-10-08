# Visual Merge Strategy Diagram

```
Current State:
==============

main ─────────────────────────────────────────────
       \
        development ──────────────────────────────
           \
            ├── afham/dispatch-system (YOU - 15 files modified)
            │   ├── WebSocket support
            │   ├── Registration approval system
            │   ├── Mobile UI enhancements
            │   └── Multi-network CORS
            │
            ├── chirath/incident-management
            │   └── Incident management features
            │
            ├── inusha/vehicle-registration
            │   └── Vehicle registration features
            │
            ├── julien/shift-management
            │   └── Shift management features
            │
            └── lakshan/equipment-management
                └── Equipment management features


Recommended Strategy:
=====================

Step 1: Create Integration Branch
──────────────────────────────────

main ─────────────────────────────────────────────
       \
        development ──────────────────────────────
           \                                      \
            │                   integration/team-merge-sprint-1 (NEW!)
            │                                      /
            ├── lakshan/equipment ───────────────┘
            ├── julien/shift ────────────────────┘
            ├── afham/dispatch ──────────────────┘
            ├── chirath/incident ────────────────┘
            └── inusha/vehicle ──────────────────┘


Step 2: Sequential Merging (Safest Approach)
─────────────────────────────────────────────

integration/team-merge-sprint-1
    │
    ├─→ Merge 1: lakshan/equipment-management
    │   └─→ Test ✅
    │
    ├─→ Merge 2: julien/shift-management
    │   ├─→ Resolve conflicts (if any)
    │   └─→ Test ✅
    │
    ├─→ Merge 3: afham/dispatch-system (YOU)
    │   ├─→ Resolve conflicts (expected!)
    │   └─→ Test ✅
    │
    ├─→ Merge 4: chirath/incident-management
    │   ├─→ Resolve conflicts (expected!)
    │   └─→ Test ✅
    │
    └─→ Merge 5: inusha/vehicle-registration
        ├─→ Resolve conflicts (expected!)
        └─→ Test ✅


Step 3: Final Integration
──────────────────────────

After ALL tests pass:

integration/team-merge-sprint-1 (All features working!)
    │
    └─→ Merge into development ───────────────────┐
                                                    │
development ←───────────────────────────────────────┘
    │
    └─→ (Later) Merge into main for production


Risk Level by Branch:
═════════════════════

Low Risk (Merge First):
├── lakshan/equipment-management     ░░░░░ 20%
└── julien/shift-management          ░░░░░░░░ 40%

Medium Risk:
└── afham/dispatch-system (YOU)      ░░░░░░░░░░░░ 60%
    (WebSocket, Registration, Mobile)

High Risk (Merge Last):
├── chirath/incident-management      ░░░░░░░░░░░░░░ 70%
│   (Likely touches assignments, vehicles)
└── inusha/vehicle-registration      ░░░░░░░░░░░░░░░░ 80%
    (HIGHEST - YOU modified Vehicle model heavily)


Conflict Hotspots:
══════════════════

🔥🔥🔥 VERY HIGH: models/Vehicle.js
       (You + Inusha both modified)

🔥🔥  HIGH: controllers/vehicleController.js
       (You + Inusha + Chirath likely modified)

🔥   MEDIUM: controllers/crewController.js
       (You + Julien + Chirath likely modified)

🔥   MEDIUM: routes/vehicles.js, routes/crews.js
       (You + others likely added routes)

     LOW: mobile/* (Only you modified)


Timeline Visualization:
═══════════════════════

Day 1 (4 hours):
├─ Hour 1: Preparation & Setup
│  ├─ Commit all work
│  ├─ Create integration branch
│  └─ Merge lakshan + julien
│
├─ Hour 2-3: Your Merge
│  ├─ Merge afham/dispatch-system
│  ├─ Resolve conflicts
│  └─ Test thoroughly
│
└─ Hour 4: chirath merge start
   └─ Begin merging incident-management

Day 2 (3 hours):
├─ Hour 1: Complete chirath merge
│  └─ Test all features
│
├─ Hour 2: inusha merge (Most conflicts!)
│  ├─ Resolve Vehicle model conflicts
│  └─ Test vehicle features
│
└─ Hour 3: Final testing & merge to dev
   ├─ Cross-feature testing
   └─ Merge to development


Backup Strategy:
════════════════

Before each merge:
integration/team-merge-sprint-1
    ├─→ backup/before-lakshan-merge
    ├─→ backup/before-julien-merge
    ├─→ backup/before-afham-merge
    ├─→ backup/before-chirath-merge
    └─→ backup/before-inusha-merge

Why? If a merge goes wrong, you can:
git reset --hard backup/before-[name]-merge


Alternative: Parallel Merge (NOT RECOMMENDED)
══════════════════════════════════════════════

⚠️ This is risky but faster:

integration/team-merge-sprint-1
    ├─→ Merge ALL 5 branches at once
    ├─→ Resolve MANY conflicts simultaneously
    └─→ High risk of breaking something

Why avoid?
❌ Can't isolate which merge caused issues
❌ Harder to rollback
❌ More difficult to coordinate with team
❌ Higher chance of breaking existing code


Your Modified Files + Risk:
════════════════════════════

Backend Models (High Conflict Risk):
├── models/Crew.js                    🔥🔥
└── models/Vehicle.js                 🔥🔥🔥

Backend Controllers (Medium-High Risk):
├── controllers/crewController.js     🔥🔥
├── controllers/vehicleController.js  🔥🔥🔥
└── utils/DatabaseUtils.js            🔥

Backend Routes (Medium Risk):
├── routes/crews.js                   🔥
└── routes/vehicles.js                🔥🔥

Backend Config (Low Risk):
├── server.js                         ░
└── scripts/seedDatabase.js           ░░

Mobile (No Risk - Only you touched):
├── mobile/package.json               ✓
├── mobile/src/constants/index.ts     ✓
├── components/DashboardScreen.tsx    ✓
└── components/AssignmentModal.tsx    ✓


Expected Merge Conflicts:
══════════════════════════

Example 1: Vehicle.js
─────────────────────
<<<<<<< HEAD (Inusha's code)
registrationDetails: {
  registeredBy: ObjectId,
  registrationNumber: String,
}
=======
<<<<<<< YOUR CODE (Afham)
registrationStatus: {
  status: "pending" | "approved" | "rejected",
  approvedBy: ObjectId,
  rejectedBy: ObjectId,
}
>>>>>>>

Resolution: KEEP BOTH ✅
registrationDetails: { ... },  // Inusha's
registrationStatus: { ... },   // Yours


Example 2: crewController.js
────────────────────────────
<<<<<<< HEAD (Julien's code)
exports.assignCrewToShift = async (req, res) => {
  // Shift assignment logic
};
=======
<<<<<<< YOUR CODE (Afham)
exports.approveCrewRegistration = async (req, res) => {
  // Approval logic
};
>>>>>>>

Resolution: KEEP BOTH ✅
// Just add both methods


Success Metrics:
════════════════

✅ All backend tests pass
✅ Frontend loads without errors
✅ Mobile app connects successfully
✅ Database seeding works
✅ All 5 features work independently
✅ All 5 features work together
✅ No console errors
✅ WebSocket connections work
✅ Registration approval workflow works
✅ Incident assignment works
✅ Vehicle tracking works
✅ Shift scheduling works
✅ Equipment checklists work


Final Merge to Development:
════════════════════════════

integration/team-merge-sprint-1 (Fully tested! ✅)
              ↓
              ↓ git merge --no-ff
              ↓
        development ←── (All 5 team members' code!)
              ↓
              ↓ (After production testing)
              ↓
            main ←── (Production ready!)


Git Command Reference:
══════════════════════

Create integration branch:
$ git checkout development
$ git pull origin development
$ git checkout -b integration/team-merge-sprint-1

Merge a team member's branch:
$ git merge lakshan/equipment-management --no-ff
$ # Resolve conflicts if any
$ git add .
$ git commit -m "merge: Integrate Lakshan's equipment management"
$ git push origin integration/team-merge-sprint-1

Test after each merge:
$ cd apps/backend && npm run dev
$ cd apps/frontend && npm run dev
$ cd apps/mobile && npm start

Final merge to development:
$ git checkout development
$ git merge integration/team-merge-sprint-1 --no-ff
$ git push origin development
$ git tag -a v1.1.0 -m "Sprint 1 Complete"
$ git push origin v1.1.0
```
