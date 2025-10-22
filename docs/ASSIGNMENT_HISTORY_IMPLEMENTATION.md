# Assignment History & Reports - Implementation Guide

**Date:** October 22, 2025  
**Purpose:** CRUD demonstration (DELETE operation), Search, Filters, Report Generation  
**Format:** PDF Reports Only

---

## 1. Assignment ID Implementation ✅

**Format:** `ASG-YYYYMMDD-XXXXX` (e.g., `ASG-20251022-AB3X9`)

**Schema Changes:**

- Added `assignmentId` field to Assignment model
- Auto-generated on creation
- Unique index added
- Pattern: ASG-[Year][Month][Day]-[5-char random]

**Files Modified:**

- `apps/backend/models/Assignment.js`

---

## 2. Verified Schema Values

### Assignment Status (response.status)

```javascript
[
  "assigned",
  "accepted",
  "declined",
  "en_route",
  "on_scene",
  "completed",
  "returned",
  "cancelled",
];
```

### Priority (dispatch.priority)

```javascript
["low", "medium", "high", "critical"];
```

### Incident Types (from Incident schema)

```javascript
["medical", "fire", "rescue", "hazmat", "traffic", "other"];
```

### Vehicle Types (from Vehicle schema)

```javascript
["Ambulance", "Fire Engine", "Rescue Vehicle", "Support Vehicle"];
```

### Performance Metrics (Verified - Auto-calculated)

```javascript
{
  responseTime: Number, // seconds (assignment → en_route)
  arrivalTime: Number,  // seconds (assignment → on_scene)
  onSceneTime: Number,  // seconds (on_scene → completed)
  totalDuration: Number // seconds (assignment → completed)
}
```

✅ Calculated automatically in pre-save middleware

---

## 3. Page Features

### Navigation

- Add button on main dashboard: "Assignment History & Reports"
- Route: `/assignments/history`

### Search Fields

1. **Assignment ID** (ASG-20251022-XXXXX)
2. **Incident ID** (INC-20251022-XXXXX)
3. **Vehicle Plate Number** (e.g., AM-1202)
4. **Crew Leader Name** (primaryCrewId name only)
5. **Location** (incident location address)

### Filter Options

**Date Range:**

- Presets: Today, Last 7 days, Last 30 days, This Month, Custom
- Based on: `dispatch.assignedAt`

**Status Filter (Multi-select):**

```javascript
["completed", "cancelled", "declined", "returned"];
```

**Priority Filter (Multi-select):**

```javascript
["critical", "high", "medium", "low"];
```

**Incident Type Filter (Multi-select):**

```javascript
["medical", "fire", "rescue", "hazmat", "traffic", "other"];
```

**Vehicle Type Filter (Multi-select):**

```javascript
["Ambulance", "Fire Engine", "Rescue Vehicle", "Support Vehicle"];
```

**Performance Filters:**

```javascript
{
  responseTime: ["<5min", "5-10min", "10-15min", ">15min"],
  totalDuration: ["<30min", "30-60min", ">60min"]
}
```

---

## 4. Assignment Card Display

```
┌──────────────────────────────────────────────────┐
│ 🔴 ASG-20251022-AB3X9          [COMPLETED] [HIGH]│
│ INC-20251022-XYZ12 - Medical Emergency           │
│ ────────────────────────────────────────────────│
│ 🚑 AM-1202 | 👤 John Doe (Leader)                │
│ 📍 123 Main St, Colombo                          │
│ ⏱️ Response: 8 min | Duration: 45 min            │
│ 📅 Oct 22, 2025 14:30 - 15:15                    │
│ ────────────────────────────────────────────────│
│ [View Details] [🗑️ Delete] ← Only if cancelled  │
└──────────────────────────────────────────────────┘
```

**Delete Button:**

- Only visible for `status === "cancelled"`
- Confirm before delete
- Success toast after deletion

---

## 5. Report Generation - Single Comprehensive Report

### Report Type: **"Comprehensive Assignment Report"**

**Sections (All included in one PDF):**

1. **Report Header**

   - Date range
   - Generation timestamp
   - Filters applied
   - Report ID

2. **Executive Summary**

   - Total assignments in period
   - Breakdown by status (Completed, Cancelled, Declined)
   - Average response time
   - Average total duration
   - Resolution rate

3. **Statistical Analysis**

   - Assignments by incident type (Bar chart)
   - Assignments by vehicle type (Pie chart)
   - Assignments by priority (Donut chart)
   - Time-based trends (Line chart - daily/hourly)
   - Peak hours heatmap

4. **Performance Metrics**

   - Average response times by incident type
   - Average total duration by priority
   - Fastest/slowest response times
   - Vehicle utilization rates

5. **Detailed Assignment List**

   - Table with all filtered assignments
   - Columns: Assignment ID, Incident ID, Type, Status, Vehicle, Crew Leader,
     Location, Priority, Assigned Time, Response Time, Duration
   - Sorted by date (newest first)

6. **Cancelled Assignments Section** (if any)

   - List of cancelled assignments
   - Cancellation reasons
   - Who cancelled and when
   - Statistics on cancellation patterns

7. **Charts & Visualizations**
   - Response time distribution histogram
   - Daily assignment volume
   - Status breakdown pie chart
   - Vehicle type usage bar chart

**Report Customization Options:**

- Date range selection
- Apply all active filters
- Include/exclude sections (checkboxes)
- Sort order (date, priority, response time)

**PDF Generation:**

- Use **PDFKit** (backend) or **jsPDF + html2canvas** (frontend)
- Professional formatting
- Charts using Chart.js
- Page breaks between sections
- Header/footer with page numbers

---

## 6. Quick Statistics Dashboard

Display at top of page:

```javascript
{
  totalAssignments: Number,
  completed: { count: Number, percentage: Number },
  cancelled: { count: Number, percentage: Number },
  avgResponseTime: Number (in minutes),
  avgTotalDuration: Number (in minutes),
  resolutionRate: Number (percentage)
}
```

---

## 7. API Endpoints

### GET /api/assignments/history

```javascript
Query Parameters:
{
  search: String,              // Multi-field search
  assignmentId: String,
  incidentId: String,
  vehiclePlateNumber: String,
  crewLeaderName: String,
  status: String[],            // ["completed", "cancelled"]
  priority: String[],          // ["high", "critical"]
  incidentType: String[],      // ["medical", "fire"]
  vehicleType: String[],       // ["Ambulance"]
  dateFrom: Date,
  dateTo: Date,
  responseTimeMin: Number,     // in seconds
  responseTimeMax: Number,
  totalDurationMin: Number,
  totalDurationMax: Number,
  page: Number,
  limit: Number,
  sortBy: String,              // "dispatch.assignedAt" | "performance.responseTime"
  sortOrder: String            // "asc" | "desc"
}

Response:
{
  success: true,
  data: {
    assignments: Assignment[],
    pagination: {
      currentPage: Number,
      totalPages: Number,
      totalRecords: Number,
      limit: Number
    }
  }
}
```

### GET /api/assignments/statistics

```javascript
Query Parameters:
{
  dateFrom: Date,
  dateTo: Date,
  // Apply same filters as history endpoint
}

Response:
{
  success: true,
  data: {
    totalAssignments: Number,
    byStatus: { completed: Number, cancelled: Number, ... },
    byPriority: { critical: Number, high: Number, ... },
    byIncidentType: { medical: Number, fire: Number, ... },
    byVehicleType: { Ambulance: Number, ... },
    performance: {
      avgResponseTime: Number,
      avgArrivalTime: Number,
      avgOnSceneTime: Number,
      avgTotalDuration: Number,
      minResponseTime: Number,
      maxResponseTime: Number
    },
    resolutionRate: Number,
    dailyTrends: [{ date: String, count: Number }],
    hourlyDistribution: [{ hour: Number, count: Number }]
  }
}
```

### POST /api/assignments/report

```javascript
Body:
{
  dateFrom: Date,
  dateTo: Date,
  filters: { ... },             // Same as history filters
  includeSections: {
    summary: Boolean,
    statistics: Boolean,
    performance: Boolean,
    detailedList: Boolean,
    cancelled: Boolean,
    charts: Boolean
  },
  sortBy: String,
  sortOrder: String
}

Response:
{
  success: true,
  data: {
    reportUrl: String,          // URL to download PDF
    reportId: String,
    generatedAt: Date
  }
}
```

### DELETE /api/assignments/:id (Existing - No changes)

- Only for cancelled assignments
- Admin only

---

## 8. Implementation Files

### Backend

```
apps/backend/
├── controllers/
│   ├── assignmentHistoryController.js (NEW)
│   └── reportController.js (NEW)
├── routes/
│   ├── assignmentHistory.js (NEW)
│   └── reports.js (NEW)
└── utils/
    └── pdfGenerator.js (NEW)
```

### Frontend

```
apps/web/src/
├── pages/
│   └── AssignmentHistory.tsx (NEW)
├── components/
│   └── assignmentHistory/
│       ├── SearchBar.tsx
│       ├── FilterPanel.tsx
│       ├── DateRangePicker.tsx
│       ├── AssignmentCard.tsx
│       ├── StatsCard.tsx
│       ├── DeleteConfirmModal.tsx
│       ├── ReportModal.tsx
│       └── Pagination.tsx
└── services/
    └── assignmentHistoryService.ts (NEW)
```

---

## 9. Dashboard Button Integration

**Location:** Main Dashboard (DispatchWorkspace or similar)

```tsx
<button
  className="btn-primary"
  onClick={() => navigate("/assignments/history")}
>
  📊 Assignment History & Reports
</button>
```

---

## 10. Implementation Phases

### Phase 1: Core (Priority) ⏱️ 4-6 hours

1. ✅ Add assignmentId to schema (DONE)
2. Create backend history endpoint
3. Create statistics endpoint
4. Create frontend page with routing
5. Add search bar (multi-field)
6. Add date range filter
7. Add status filter
8. Display assignment cards
9. Implement delete functionality
10. Add pagination

### Phase 2: Enhanced Filters ⏱️ 2-3 hours

11. Add priority filter
12. Add incident type filter
13. Add vehicle type filter
14. Add performance filters
15. Add stats dashboard
16. Add sorting options

### Phase 3: Report Generation ⏱️ 5-7 hours

17. Create report modal
18. Implement backend PDF generation
19. Add all report sections
20. Integrate Chart.js for visualizations
21. Add report download
22. Polish UI

**Total Estimated Time:** 11-16 hours

---

## 11. Testing Checklist

- [ ] Assignment ID generates correctly on new assignments
- [ ] Search finds assignments by all fields
- [ ] Filters work correctly (single and combined)
- [ ] Date range filters properly
- [ ] Performance metrics display correctly
- [ ] Delete button only shows for cancelled
- [ ] Delete confirmation works
- [ ] Delete removes assignment from database
- [ ] Statistics calculate correctly
- [ ] Report generates with all sections
- [ ] PDF downloads successfully
- [ ] Charts display properly in report
- [ ] Pagination works
- [ ] Dashboard button navigates correctly

---

## 12. Viva Demonstration Flow

1. **Navigate:** Click "Assignment History & Reports" from dashboard
2. **Search:** Search by Assignment ID (ASG-20251022-XXXXX)
3. **Filter:** Apply date range + status filters
4. **View Stats:** Show quick statistics dashboard
5. **Delete Demo:**
   - Filter to show cancelled assignments
   - Click delete on one assignment
   - Confirm deletion
   - Show it's removed
6. **Generate Report:**
   - Click "Generate Report"
   - Set date range (last 30 days)
   - Select sections to include
   - Click generate
   - Download PDF
   - Open and show comprehensive report with charts

---

**End of Document**
