# Assignment Search Implementation Analysis

## Current Implementation Issues

### Issue 1: Search Not Working - Returns All Results ❌

**Current Code (Lines 1277-1285):**

```javascript
if (search) {
  const searchRegex = new RegExp(search, "i");
  query.$or = [
    { assignmentId: searchRegex },
    { "incident.incidentId": searchRegex }, // ❌ WRONG! This is ObjectId, not string
    { "resource.vehicleCallSign": searchRegex }, // ❌ Field doesn't exist
    { "incident.location.address": searchRegex }, // ❌ Location is in Incident, not Assignment
    { "incident.location.city": searchRegex }, // ❌ Location is in Incident, not Assignment
  ];
}
```

**Problems:**

1. **`incident.incidentId`** is an **ObjectId reference**, not a searchable string field
2. **`resource.vehicleCallSign`** doesn't exist in the Assignment schema
3. **`incident.location.address`** and **`incident.location.city`** are in the **Incident** collection, not embedded in Assignment
4. You **cannot search referenced document fields before population** in MongoDB query
5. These fields need to be searched **after population** (post-query filtering)

**Why It Returns All Results:**
When MongoDB tries to match an ObjectId field with a regex, or tries to find non-existent fields, the `$or` query likely fails silently or returns everything.

---

### Issue 2: No Search Scope Filtering ❌

**Current Behavior:**
The search term is applied globally across all specified fields. There's no way for the user to say "search only in Vehicle Plate Number" or "search only in Location".

**User's Concern:**
"We have filters that filter the search results, but no filters are available to restrict where the search term will be searched."

**Example Scenario:**

- User wants to search for plate number "ABC-1234"
- But "ABC-1234" might also appear in dispatch notes or location
- User has no way to limit search to just plate numbers

---

### Issue 3: Wrong Search Pattern (Middle/End Matching) ❌

**Current Pattern:**

```javascript
const searchRegex = new RegExp(search, "i");
// This matches ANYWHERE in the string
```

**Examples:**

- Search: "app"
- Matches: "**app**le", "w**app**le", "pineapple" ❌ (all match!)

**User's Requirement:**
"Should match from the beginning, not in the middle or end"

- Search: "app"
- Should match: "**app**le" ✅
- Should NOT match: "w**app**le" ❌, "pineapple" ❌

**Correct Pattern:**

```javascript
const searchRegex = new RegExp(`^${search}`, "i");
// ^ = start of string anchor
```

---

## Data Structure Analysis

### What the Placeholder Says:

```
"Search by Assignment ID, Incident ID, Vehicle, Crew Leader, or Location..."
```

### Actual Field Locations:

| Search Field         | Location       | Path                                                           | Type   | Can Query Directly?     |
| -------------------- | -------------- | -------------------------------------------------------------- | ------ | ----------------------- |
| **Assignment ID**    | Assignment     | `assignmentId`                                                 | String | ✅ YES                  |
| **Incident ID**      | Incident (ref) | `incident.incidentId` (ref) → `incidentId`                     | String | ❌ NO (need population) |
| **Vehicle Plate**    | Vehicle (ref)  | `resource.vehicleId` (ref) → `registration.plateNumber`        | String | ❌ NO (need population) |
| **Crew Leader Name** | Crew (ref)     | `resource.primaryCrewId` (ref) → `personal.firstName/lastName` | String | ❌ NO (need population) |
| **Location Address** | Incident (ref) | `incident.incidentId` (ref) → `location.address`               | String | ❌ NO (need population) |
| **Location City**    | Incident (ref) | `incident.incidentId` (ref) → `location.city`                  | String | ❌ NO (need population) |

### Schema Reality:

**Assignment Model:**

```javascript
{
  assignmentId: "ASG-20251023-ABC12",  // ✅ Can search directly
  incident: {
    incidentId: ObjectId("507f1f77...")  // ❌ ObjectId reference - cannot search as string
  },
  resource: {
    vehicleId: ObjectId("507f1f77..."),  // ❌ ObjectId reference
    primaryCrewId: ObjectId("507f1f77...")  // ❌ ObjectId reference
  }
}
```

**Incident Model (referenced):**

```javascript
{
  incidentId: "INC-20251023-XYZ45",  // ✅ This is searchable string
  location: {
    address: "123 Main Street",
    city: "Colombo"
  }
}
```

**Vehicle Model (referenced):**

```javascript
{
  registration: {
    plateNumber: "ABC-1234",
    vehicleType: "Ambulance"
  }
}
```

**Crew Model (referenced):**

```javascript
{
  personal: {
    firstName: "John",
    lastName: "Doe"
  }
}
```

---

## Recommended Solutions

### Solution A: Simple Search (Current Approach - Fixed) ✅

**Pros:**

- Simple user experience
- One search box for everything
- Fast to implement

**Cons:**

- Can't limit search scope
- Slower (needs to search all fields)
- More false positives

**Implementation:**

1. Search `assignmentId` in MongoDB query (before population)
2. Populate all references
3. Post-filter by searching populated fields (Incident ID, Vehicle Plate, Crew Name, Location)
4. Use `^` anchor for start-of-string matching

**Code:**

```javascript
// Step 1: Direct query on Assignment fields only
if (search) {
  const searchRegex = new RegExp(`^${search}`, "i"); // Start of string
  query.$or = [{ assignmentId: searchRegex }];
}

// Step 2: Populate references
let assignments = await Assignment.find(query)
  .populate("incident.incidentId")
  .populate("resource.vehicleId")
  .populate("resource.primaryCrewId")
  .sort({ "dispatch.assignedAt": -1 });

// Step 3: Post-population search filtering
if (search) {
  const searchRegex = new RegExp(`^${search}`, "i");
  assignments = assignments.filter((assignment) => {
    // Search in assignmentId (already queried, but include for completeness)
    if (searchRegex.test(assignment.assignmentId)) return true;

    // Search in Incident ID
    if (
      assignment.incident?.incidentId?.incidentId &&
      searchRegex.test(assignment.incident.incidentId.incidentId)
    ) {
      return true;
    }

    // Search in Vehicle Plate Number
    if (
      assignment.resource?.vehicleId?.registration?.plateNumber &&
      searchRegex.test(assignment.resource.vehicleId.registration.plateNumber)
    ) {
      return true;
    }

    // Search in Crew Leader Name
    const crew = assignment.resource?.primaryCrewId;
    if (crew?.personal) {
      const fullName = `${crew.personal.firstName} ${crew.personal.lastName}`;
      if (
        searchRegex.test(fullName) ||
        searchRegex.test(crew.personal.firstName) ||
        searchRegex.test(crew.personal.lastName)
      ) {
        return true;
      }
    }

    // Search in Location
    const incident = assignment.incident?.incidentId;
    if (incident?.location) {
      if (
        searchRegex.test(incident.location.address) ||
        searchRegex.test(incident.location.city)
      ) {
        return true;
      }
    }

    return false;
  });
}
```

---

### Solution B: Advanced Search with Scope Filters ✨

**Pros:**

- User can specify search scope
- More precise results
- Better UX for power users

**Cons:**

- More complex UI
- More parameters to handle
- Takes more screen space

**UI Design:**

```
┌────────────────────────────────────────────────────────────┐
│  Search Term: [_____________]                              │
│                                                             │
│  Search In:                                                 │
│  ☑ Assignment ID                                            │
│  ☑ Incident ID                                              │
│  ☑ Vehicle Plate                                            │
│  ☑ Crew Leader                                              │
│  ☑ Location                                                 │
└────────────────────────────────────────────────────────────┘
```

**Implementation:**

```javascript
// Frontend sends parameters:
{
  search: "ABC",
  searchFields: ["assignmentId", "vehiclePlate", "incidentId", "crewLeader", "location"]
}

// Backend applies search only to selected fields
if (search && searchFields && searchFields.length > 0) {
  const searchRegex = new RegExp(`^${search}`, "i");

  assignments = assignments.filter(assignment => {
    if (searchFields.includes("assignmentId") &&
        searchRegex.test(assignment.assignmentId)) {
      return true;
    }

    if (searchFields.includes("incidentId") &&
        assignment.incident?.incidentId?.incidentId &&
        searchRegex.test(assignment.incident.incidentId.incidentId)) {
      return true;
    }

    if (searchFields.includes("vehiclePlate") &&
        assignment.resource?.vehicleId?.registration?.plateNumber &&
        searchRegex.test(assignment.resource.vehicleId.registration.plateNumber)) {
      return true;
    }

    // ... etc

    return false;
  });
}
```

---

### Solution C: Hybrid Approach (Recommended) 🎯

**Combine both approaches:**

1. Default behavior: Search ALL fields (Solution A)
2. Optional: Add "Advanced Search" toggle that reveals scope filters (Solution B)

**Benefits:**

- Simple for basic users (just type and search)
- Powerful for advanced users (click "Advanced" to see scope filters)
- Best of both worlds

**UI:**

```
┌────────────────────────────────────────────────────────────┐
│  🔍 [Search: ABC-1234____________]  [🔽 Advanced]          │
└────────────────────────────────────────────────────────────┘

(When "Advanced" is clicked:)

┌────────────────────────────────────────────────────────────┐
│  🔍 [Search: ABC-1234____________]  [🔼 Advanced]          │
│                                                             │
│  📍 Search Scope (leave all checked for global search):    │
│  ☑ Assignment ID    ☑ Incident ID    ☑ Vehicle Plate      │
│  ☑ Crew Leader      ☑ Location                             │
└────────────────────────────────────────────────────────────┘
```

---

## Regex Pattern Comparison

### Current Pattern (WRONG):

```javascript
new RegExp(search, "i");
```

**Matches:**

- "app" matches: "**app**le", "w**app**le", "pineapple"

### Correct Pattern (START OF STRING):

```javascript
new RegExp(`^${search}`, "i");
```

**Matches:**

- "app" matches: "**app**le" ✅
- "app" does NOT match: "wapple" ❌, "pineapple" ❌

### Alternative: START OF WORD (More Flexible):

```javascript
new RegExp(`\\b${search}`, "i");
```

**Matches:**

- "app" matches: "**app**le", "red **app**le" ✅
- "app" does NOT match: "wapple", "pineapple" ❌

**Note:** Word boundary `\b` is more user-friendly as it matches the start of any word, not just the start of the entire string.

---

## Performance Considerations

### Current Approach (Inefficient):

1. Query: Fetch ALL assignments matching status/date filters
2. Populate: Load ALL referenced documents
3. Filter: Apply search on ALL populated results

**Problem:** If you have 10,000 assignments, you're populating all 10,000 even if search will reduce to 5 results.

### Optimized Approach:

1. **Query:** Fetch assignments matching direct fields (assignmentId) + other filters
2. **Populate:** Load references for matching assignments only
3. **Filter:** If no matches from step 1, do a second query for populated fields

**Better Code Structure:**

```javascript
// First pass: Search in Assignment model fields
if (search) {
  const searchRegex = new RegExp(`^${search}`, "i");
  query.$or = [{ assignmentId: searchRegex }];
}

let assignments = await Assignment.find(query)
  .populate(...)
  .sort(...);

// If search term provided but no results, try searching populated fields
if (search && assignments.length === 0) {
  // Fetch incidents matching search
  const incidents = await Incident.find({
    $or: [
      { incidentId: searchRegex },
      { "location.address": searchRegex },
      { "location.city": searchRegex }
    ]
  }).select("_id");

  const incidentIds = incidents.map(i => i._id);

  // ... similar for vehicles and crew

  // Query assignments with matching references
  const refQuery = {
    ...dateFilter,
    ...statusFilter,
    $or: [
      { "incident.incidentId": { $in: incidentIds } },
      { "resource.vehicleId": { $in: vehicleIds } },
      { "resource.primaryCrewId": { $in: crewIds } }
    ]
  };

  assignments = await Assignment.find(refQuery).populate(...);
}
```

This is more complex but more efficient for large datasets.

---

## Recommended Immediate Fix

**Priority 1: Make Search Work ✅**

Use **Solution A** (Simple Search - Fixed):

1. Fix regex to use `^` for start-of-string matching
2. Remove invalid fields from MongoDB query
3. Add post-population filtering for referenced fields

**Priority 2: Add Search Scope (Optional) ⭐**

If you want advanced filtering, implement **Solution C** (Hybrid):

1. Keep simple search as default
2. Add collapsible "Advanced Search" section
3. Allow users to select which fields to search

---

## Code Examples

### Example 1: Matching Behavior

**Input:** Search term = "ASG"

**Current Regex (`/ASG/i`):**

- ✅ Matches: "**ASG**-20251023-ABC12"
- ❌ Matches: "REASSIGNED" (wrong!)
- ❌ Matches: "MESSAGE" (wrong!)

**Fixed Regex (`/^ASG/i`):**

- ✅ Matches: "**ASG**-20251023-ABC12"
- ❌ Does NOT match: "REASSIGNED"
- ❌ Does NOT match: "MESSAGE"

### Example 2: Name Search

**Input:** Search term = "John"

**Current Regex (`/John/i`):**

- ✅ Matches firstName: "**John**"
- ❌ Matches firstName: "St. **John**" (wrong!)

**Word Boundary Regex (`/\bJohn/i`):**

- ✅ Matches firstName: "**John**"
- ✅ Matches firstName: "St. **John**" (correct - starts a word)
- ❌ Does NOT match: "Johnson"

---

## Decision Points

### Question 1: Search Pattern

**Which pattern should we use?**

| Pattern             | Regex      | Use Case                    |
| ------------------- | ---------- | --------------------------- |
| **Start of String** | `^search`  | IDs (ASG-xxx, INC-xxx)      |
| **Start of Word**   | `\bsearch` | Names (John Doe), Addresses |
| **Anywhere**        | `search`   | Notes, descriptions         |

**Recommendation:** Use **word boundary** (`\b`) for more flexibility while still avoiding middle-of-word matches.

### Question 2: Search Scope

**Do you want search scope filtering?**

| Option                          | Complexity | User Experience        |
| ------------------------------- | ---------- | ---------------------- |
| **Global Search Only**          | Low        | Simple, fast           |
| **Search Scope Always Visible** | Medium     | Powerful but cluttered |
| **Advanced Toggle**             | Medium     | Clean + Powerful       |

**Recommendation:** Start with **global search only** (Solution A). Add advanced filters later if users request it.

---

## Summary

### Current Issues:

1. ❌ Search queries non-existent or wrong fields
2. ❌ Search tries to query ObjectId references as strings
3. ❌ Search matches middle/end of words (not just start)
4. ❌ No way to limit search scope

### Recommended Fix (Solution A):

1. ✅ Use `^` or `\b` regex anchor for start matching
2. ✅ Only query `assignmentId` in MongoDB
3. ✅ Do post-population filtering for all other fields
4. ✅ Search incident ID, vehicle plate, crew name, location after population

### Future Enhancement (Solution C):

1. ⭐ Add "Advanced Search" toggle
2. ⭐ Allow users to select search scope (which fields to search)
3. ⭐ Keep simple search as default

Would you like me to implement Solution A first (fix the broken search), or jump directly to Solution C (hybrid approach with advanced options)?
