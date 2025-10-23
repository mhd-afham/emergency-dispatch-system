# Search Feature - Visual Guide
**Registration Management Search System**  
**Visual Diagrams and UI Mockups**

---

## 🎨 Complete UI Layout

```
╔═══════════════════════════════════════════════════════════════╗
║  REGISTRATION MANAGEMENT TAB                                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🔍 QUICK SEARCH (Global ID Lookup)                     │  ║
║  │ ┌────────────────────────────────────────────────────┐ │  ║
║  │ │ Enter Plate Number (CAB-1234) or Employee ID...   │ │  ║
║  │ └────────────────────────────────────────────────────┘ │  ║
║  │ [Search] [Clear]    💡 Searches across all tabs      │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  ┌─────────┬──────────┬──────────┬─────────┐                 ║
║  │ Pending │ Approved │ Rejected │ Drafted │ ← Tabs          ║
║  └─────────┴──────────┴──────────┴─────────┘                 ║
║  ═══════════════════════════════════════════                  ║
║                                                                ║
║  ⏰ Pending Approval                                           ║
║  ────────────────────────────────────────────                 ║
║                                                                ║
║  [🚗 Vehicle Registrations (15)] [👥 Crew Registrations (8)] ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🔎 FILTER RESULTS (Tab-Specific)                       │  ║
║  │ ┌────────────────────────────────────────────────────┐ │  ║
║  │ │ Filter by plate, make, model, type...             │ │  ║
║  │ └────────────────────────────────────────────────────┘ │  ║
║  │ [+ Show Advanced]  [Clear]                            │  ║
║  │                                                          │  ║
║  │ ┌─ Advanced Filters (Collapsible) ──────────────────┐ │  ║
║  │ │ From Date: [2025-10-01]  To Date: [2025-10-31]   │ │  ║
║  │ └───────────────────────────────────────────────────┘ │  ║
║  │                                                          │  ║
║  │ Showing 5 of 15 results                                │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 📋 CAB-1234                    [View Details]          │  ║
║  │ Ambulance - Ford Transit (2023)                        │  ║
║  │ Station: Central Station                               │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 📋 CAB-5678                    [View Details]          │  ║
║  │ Fire Truck - Volvo FL (2022)                           │  ║
║  │ Station: West Station                                  │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🔍 Quick Search Component

### Default State
```
┌────────────────────────────────────────────────────────────┐
│ 🔍 Quick Search                       Direct ID Lookup     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Enter Plate Number (e.g., CAB-1234) or Employee... │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [  Search  ]                                              │
│                                                             │
│  💡 Searches across all tabs and auto-navigates to result │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Active State (With Input)
```
┌────────────────────────────────────────────────────────────┐
│ 🔍 Quick Search                       Direct ID Lookup     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ CAB-1234                                    ║       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [  Search  ]  [ Clear ]                                   │
│                                                             │
│  💡 Searches across all tabs and auto-navigates to result │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌────────────────────────────────────────────────────────────┐
│ 🔍 Quick Search                       Direct ID Lookup     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ CAB-1234                                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [ ⟳ Searching... ]                                        │
│           ↑ Spinner animation                              │
│                                                             │
│  💡 Searches across all tabs and auto-navigates to result │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔎 Tab Filter Component

### Default State
```
┌────────────────────────────────────────────────────────────┐
│ 🔎 Filter Results                      [+ Show Advanced]  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Filter by plate, make, model, type...              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Active State (With Filter)
```
┌────────────────────────────────────────────────────────────┐
│ 🔎 Filter Results                      [− Hide Advanced]  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ford                                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [ Clear ]                                                 │
│                                                             │
│  ┌─ Advanced Filters ───────────────────────────────────┐ │
│  │                                                        │ │
│  │  From Date           To Date                          │ │
│  │  ┌──────────────┐    ┌──────────────┐                │ │
│  │  │ 2025-10-01   │    │ 2025-10-31   │                │ │
│  │  └──────────────┘    └──────────────┘                │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Showing 3 of 15 results                                   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Empty Results State
```
┌────────────────────────────────────────────────────────────┐
│ 🔎 Filter Results                      [− Hide Advanced]  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ zzzzz                                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [ Clear ]                                                 │
│                                                             │
│  Showing 0 of 15 results                                   │
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                                                             │
│               No vehicles match your filters               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🎬 User Flow Diagrams

### Flow 1: Quick Search for Vehicle
```
┌──────────────┐
│ User enters  │
│  "CAB-1234"  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Clicks       │
│ "Search"     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ System searches:     │
│ - Pending Vehicles   │
│ - Approved Vehicles  │
│ - Rejected Vehicles  │
└──────┬───────────────┘
       │
       ▼
    Found? ◄─────── NO ────┐
       │                    │
      YES                   ▼
       │            ┌───────────────┐
       ▼            │ Show "Not     │
┌──────────────┐    │ Found" alert  │
│ Navigate to  │    └───────────────┘
│ correct tab  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Switch to    │
│ Vehicle type │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Highlight    │
│ result       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Show success │
│ notification │
└──────────────┘
```

### Flow 2: Tab Filter for Crew
```
┌──────────────┐
│ User clicks  │
│ "Pending"    │
│ tab          │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Clicks       │
│ "Crew"       │
│ toggle       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Types        │
│ "paramedic"  │
│ in filter    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ System filters       │
│ pendingCrew array    │
│ (real-time)          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Display filtered     │
│ results (5 of 12)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ User clicks          │
│ "+ Show Advanced"    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Date pickers appear  │
│ User sets range      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Results refined      │
│ (3 of 12)            │
└──────────────────────┘
```

---

## 📱 Responsive Design

### Desktop View (> 1024px)
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Quick Search: [━━━━━━━━━━━━━━━━━━━━━━] [Search] [Clear]   │
│                                                              │
│  [Pending] [Approved] [Rejected] [Drafted]                  │
│                                                              │
│  Filter: [━━━━━━━━━━━━━━] [+ Advanced] [Clear]             │
│  From: [━━━━━] To: [━━━━━]                                  │
│                                                              │
│  Results: 50 items per page                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1024px)
```
┌──────────────────────────────────────────────┐
│                                               │
│  Quick Search:                                │
│  [━━━━━━━━━━━━━━━━━━━] [Search] [Clear]     │
│                                               │
│  [Pending][Approved][Rejected][Drafted]      │
│                                               │
│  Filter: [━━━━━━━━━━━━] [+ Adv] [Clear]     │
│  From: [━━━━━] To: [━━━━━]                   │
│                                               │
│  Results: 30 items per page                  │
│                                               │
└──────────────────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌───────────────────────────────┐
│                                │
│  Quick Search:                 │
│  [━━━━━━━━━━━━━━━━━━━]       │
│  [Search] [Clear]              │
│                                │
│  ▼ Tabs ▼                      │
│  • Pending                     │
│  • Approved                    │
│  • Rejected                    │
│  • Drafted                     │
│                                │
│  Filter:                       │
│  [━━━━━━━━━━━━━━━━]          │
│  [+ Advanced]                  │
│                                │
│  Results: 20 items             │
│                                │
└───────────────────────────────┘
```

---

## 🎨 Color Scheme

### Quick Search (Global)
```
Background: linear-gradient(to right, #EFF6FF, #EEF2FF)
           (from-blue-50 to-indigo-50)
Border: #BFDBFE (border-blue-200)
Input: White background
       Gray border (#D1D5DB)
       Blue focus ring (#3B82F6)
Button: Blue (#2563EB)
        White text
        Hover: Darker blue (#1D4ED8)
```

### Tab Filter (Local)
```
Background: #F9FAFB (bg-gray-50)
Border: #E5E7EB (border-gray-200)
Input: White background
       Gray border (#D1D5DB)
       Blue focus ring (#3B82F6)
Clear Button: Light gray (#E5E7EB)
              Dark gray text (#374151)
              Hover: Medium gray (#D1D5DB)
```

### Result Cards
```
Background: White
Border: Gray (#E5E7EB)
Hover: Shadow effect (shadow-md)
       Border stays same
Text: Dark gray (#111827) for titles
      Medium gray (#6B7280) for descriptions
Icons: Blue (#3B82F6) for vehicles
       Green (#10B981) for crew
```

---

## 🔔 Notification Styles

### Success (Found)
```
┌────────────────────────────────────────┐
│ ✅ Vehicle Found!                      │
│ Found vehicle CAB-1234 in pending     │
│ section                                │
│                           [ OK ]       │
└────────────────────────────────────────┘
Background: Light green (#F0FDF4)
Border: Green (#22C55E)
Icon: Green checkmark
```

### Info (Not Found)
```
┌────────────────────────────────────────┐
│ ℹ️ Not Found                           │
│ No registration found with ID:         │
│ XYZ-9999. Make sure it's correctly    │
│ formatted.                             │
│                           [ OK ]       │
└────────────────────────────────────────┘
Background: Light blue (#EFF6FF)
Border: Blue (#3B82F6)
Icon: Blue info circle
```

### Warning (Validation)
```
┌────────────────────────────────────────┐
│ ⚠️ Search Required                     │
│ Please enter a plate number            │
│ (e.g., CAB-1234) or employee ID       │
│ (e.g., EMP001)                         │
│                           [ OK ]       │
└────────────────────────────────────────┘
Background: Light yellow (#FEFCE8)
Border: Yellow (#EAB308)
Icon: Yellow warning triangle
```

### Error (System)
```
┌────────────────────────────────────────┐
│ ❌ Search Error                        │
│ An error occurred while searching.     │
│ Please try again.                      │
│                           [ OK ]       │
└────────────────────────────────────────┘
Background: Light red (#FEF2F2)
Border: Red (#EF4444)
Icon: Red X circle
```

---

## 🎯 Interactive States

### Button States

#### Default
```
┌─────────┐
│ Search  │
└─────────┘
Background: Blue (#2563EB)
Text: White
Cursor: pointer
```

#### Hover
```
┌─────────┐
│ Search  │ ← Slightly darker
└─────────┘
Background: Darker blue (#1D4ED8)
Text: White
Cursor: pointer
Transition: 200ms
```

#### Disabled
```
┌─────────┐
│ Search  │ ← Grayed out
└─────────┘
Background: Light gray (#D1D5DB)
Text: Medium gray (#6B7280)
Cursor: not-allowed
```

#### Loading
```
┌─────────────┐
│ ⟳ Searching │ ← Spinner rotates
└─────────────┘
Background: Blue (#2563EB)
Text: White
Spinner: Rotating animation
Disabled: true
```

### Input States

#### Default (Empty)
```
┌────────────────────────────────────────┐
│ Enter Plate Number...                 │
└────────────────────────────────────────┘
Background: White
Border: Gray (#D1D5DB)
Placeholder: Light gray text
```

#### Focus (Active)
```
┌────────────────────────────────────────┐
│ CAB-1234║                              │
└────────────────────────────────────────┘
     ↑ Cursor blinking
Background: White
Border: Blue (#3B82F6)
Ring: Blue glow (ring-2)
```

#### Filled
```
┌────────────────────────────────────────┐
│ CAB-1234                               │
└────────────────────────────────────────┘
Background: White
Border: Gray (#D1D5DB)
Text: Dark gray (#111827)
```

---

## 📐 Spacing & Layout

### Component Spacing
```
Quick Search Box:
  Padding: 1rem (16px)
  Margin bottom: 1rem (16px)
  Border radius: 0.5rem (8px)

Tab Filter Box:
  Padding: 1rem (16px)
  Margin bottom: 1.5rem (24px)
  Border radius: 0.5rem (8px)

Input Fields:
  Padding: 0.5rem 1rem (8px 16px)
  Height: 2.5rem (40px)
  Border radius: 0.375rem (6px)

Buttons:
  Padding: 0.5rem 1.5rem (8px 24px)
  Height: 2.5rem (40px)
  Border radius: 0.375rem (6px)

Result Cards:
  Padding: 1rem (16px)
  Margin bottom: 0.75rem (12px)
  Border radius: 0.5rem (8px)
```

### Grid Layout
```
Desktop (> 1024px):
┌────────────────────────┬────────────────────────┐
│ Input (flex-1)         │ Buttons (auto)         │
└────────────────────────┴────────────────────────┘

Mobile (< 768px):
┌─────────────────────────────────────────────────┐
│ Input (full width)                              │
├─────────────────────────────────────────────────┤
│ Buttons (full width, stacked)                   │
└─────────────────────────────────────────────────┘
```

---

## ✨ Animation Effects

### Fade In
```
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

Applied to:
- Filter results section
- Notification alerts
- Result cards
Duration: 200ms
```

### Slide Down
```
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

Applied to:
- Advanced filters section
Duration: 300ms
```

### Spin (Loading)
```
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

Applied to:
- Loading spinner
Duration: 1000ms
Repeat: infinite
```

---

## 🎬 Complete Interaction Example

### Step-by-Step Visual Flow

**Step 1: Initial State**
```
┌─────────────────────────────────────────────┐
│ 🔍 Quick Search                              │
│ [________________] [Search] (disabled)      │
│                                              │
│ [Pending] Approved Rejected Drafted         │
└─────────────────────────────────────────────┘
```

**Step 2: User Types "CAB-1234"**
```
┌─────────────────────────────────────────────┐
│ 🔍 Quick Search                              │
│ [CAB-1234_______] [Search] [Clear]          │
│                        ↑ Now enabled         │
│ [Pending] Approved Rejected Drafted         │
└─────────────────────────────────────────────┘
```

**Step 3: User Clicks Search**
```
┌─────────────────────────────────────────────┐
│ 🔍 Quick Search                              │
│ [CAB-1234_______] [⟳ Searching...]          │
│                    ↑ Loading state           │
│ [Pending] Approved Rejected Drafted         │
└─────────────────────────────────────────────┘
```

**Step 4: Found & Navigated**
```
┌─────────────────────────────────────────────┐
│ 🔍 Quick Search                              │
│ [CAB-1234_______] [Search] [Clear]          │
│                                              │
│ Pending [Approved] Rejected Drafted         │
│         ↑ Auto-switched                      │
├─────────────────────────────────────────────┤
│ 🔎 Filter Results                            │
│ [CAB-1234_______] (auto-filled)             │
│         ↑ Highlights the found item          │
│                                              │
│ 📋 CAB-1234 ← FOUND! (highlighted)          │
│ 📋 CAB-5678                                  │
└─────────────────────────────────────────────┘

┌────────────────────────────────┐
│ ✅ Vehicle Found!              │
│ Found vehicle CAB-1234 in      │
│ approved section    [ OK ]     │
└────────────────────────────────┘
```

---

## 🏁 Summary

This visual guide provides:
- ✅ Complete UI layouts
- ✅ Component diagrams
- ✅ User flow charts
- ✅ Responsive designs
- ✅ Color schemes
- ✅ Animation specs
- ✅ Interactive states
- ✅ Spacing details

**Use this guide for:**
- UI/UX reviews
- Design consistency
- User training
- Development reference
- QA testing

---

*For implementation details, see `SEARCH_FEATURE_DOCUMENTATION.md`*  
*For usage instructions, see `SEARCH_QUICK_START.md`*  
*For summary, see `SEARCH_IMPLEMENTATION_SUMMARY.md`*
