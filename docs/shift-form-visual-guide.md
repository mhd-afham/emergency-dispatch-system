# Enhanced Shift Creation Form - Visual Guide

## Complete Form Preview

```
╔═══════════════════════════════════════════════════════════════════╗
║  ➕ Create New Shift                              [Cancel]       ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  📋 BASIC INFORMATION                                            ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                   ║
║  Shift Name *                    │  Shift Type *                ║
║  [Morning Shift - ER      ]      │  [Regular        ▼]         ║
║                                   │                              ║
║  Station Name / Location *                                       ║
║  [Central Fi...           ]  ← Start typing for suggestions     ║
║  ┌─────────────────────────┐                                    ║
║  │ 🏢 Central Fire Station │                                    ║
║  │ 🏢 Central Hospital     │                                    ║
║  └─────────────────────────┘                                    ║
║  Start typing to see suggestions or enter a custom name         ║
║                                                                   ║
║  🕐 SCHEDULE                                                     ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                   ║
║  Date *            │  Start Time *  │  End Time *               ║
║  [10/21/2025  ]    │  [08:00    ]   │  [16:00    ]             ║
║                                                                   ║
║  ┌───────────────────────────────────────────────────────┐      ║
║  │ Shift Duration:                            8 hours    │      ║
║  └───────────────────────────────────────────────────────┘      ║
║                                                                   ║
║  Recurrence Pattern                                              ║
║  [One-time Shift                               ▼]               ║
║  This shift will occur only once                                ║
║                                                                   ║
║  👥 STAFFING REQUIREMENTS                                       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                   ║
║  Required Crew Count *       │  Minimum Certification Level *   ║
║  [6                    ]     │  [Intermediate            ▼]    ║
║  Number of crew members      │  Minimum qualification required  ║
║                                                                   ║
║  Required Roles                                                  ║
║  [☑ EMT] [☑ Paramedic] [☐ Firefighter] [☑ Driver] [☐ Supervisor]║
║                                                                   ║
║  📝 ADDITIONAL DETAILS                                          ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                   ║
║  Supervisor Notes / Instructions                                 ║
║  ┌───────────────────────────────────────────────────────────┐  ║
║  │ Ensure all emergency equipment is checked before shift   │  ║
║  │ Priority response area: Downtown district                 │  ║
║  │                                                           │  ║
║  └───────────────────────────────────────────────────────────┘  ║
║  Optional notes will be visible to all assigned crew members    ║
║                                                                   ║
║  ──────────────────────────────────────────────────────────────  ║
║                                                                   ║
║  [➕ Create Shift]  [Cancel]                                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## Section Breakdown

### 1. Header Section
```
┌─────────────────────────────────────────────────┐
│ ➕ Create New Shift              [Cancel]      │
└─────────────────────────────────────────────────┘
```
- Clear title with icon
- Cancel button for easy exit
- Clean, modern design

### 2. Basic Information Section
```
📋 BASIC INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shift Name *              │ Shift Type *
[________________]        │ [Select...  ▼]

Station Name / Location *
[_______________________] ← Type here
┌──────────────────────┐
│ 🏢 Suggestion 1      │
│ 🏢 Suggestion 2      │
└──────────────────────┘
Helper text appears here
```

**Fields**:
- Shift Name: Text input with placeholder
- Shift Type: Dropdown (Regular/Overtime/Emergency)
- Station: Autocomplete with suggestions

### 3. Schedule Section
```
🕐 SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date *     │ Start Time * │ End Time *
[______]   │ [____]       │ [____]

┌─────────────────────────────────┐
│ Shift Duration:      8 hours    │
└─────────────────────────────────┘

Recurrence Pattern
[One-time Shift           ▼]
Explanation text appears here
```

**Fields**:
- Date: Calendar picker
- Start Time: Time picker (24h or 12h)
- End Time: Time picker
- Duration: Auto-calculated display (blue badge)
- Recurrence: Dropdown with options

**Duration Examples**:
- 08:00 → 16:00 = "8 hours"
- 08:00 → 16:30 = "8h 30m"
- 14:00 → 22:00 = "8 hours"
- 22:00 → 06:00 = "8 hours" (overnight)

### 4. Staffing Requirements Section
```
👥 STAFFING REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Required Crew * │ Min Certification *
[____]          │ [Select...      ▼]
Helper text     │ Helper text

Required Roles
[☑ EMT] [☐ Paramedic] [☑ Firefighter]
[☐ Driver] [☐ Supervisor]
```

**Fields**:
- Required Crew Count: Number input (1-20)
- Minimum Certification: Dropdown
- Required Roles: Checkboxes (multi-select)

### 5. Additional Details Section
```
📝 ADDITIONAL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Supervisor Notes / Instructions
┌────────────────────────────────┐
│ Type your notes here...        │
│                                │
│                                │
└────────────────────────────────┘
Helper text appears here
```

**Fields**:
- Supervisor Notes: Large textarea (4 rows)
- Helpful placeholder text
- Guidance text below

### 6. Action Buttons
```
───────────────────────────────────

[➕ Create Shift]  [Cancel]
```
- Create button: Blue, primary action
- Cancel button: Gray, secondary action
- Clear visual hierarchy

## Interactive Elements

### Autocomplete Dropdown Behavior

**State 1: Empty Field**
```
Station Name / Location *
[___________________________]
Start typing to see suggestions
```

**State 2: Typing (matching results)**
```
Station Name / Location *
[Central Fi_______________]
┌─────────────────────────────┐
│ 🏢 Central Fire Station    │ ← Hover = light blue
│ 🏢 Central Hospital        │
└─────────────────────────────┘
```

**State 3: Typing (no matches)**
```
Station Name / Location *
[New Station 5____________]
┌─────────────────────────────┐
│ No suggestions found        │
│ You can create a new name   │
└─────────────────────────────┘
```

**State 4: Selected**
```
Station Name / Location *
[Central Fire Station_____]
Start typing to see suggestions
```

### Duration Calculator States

**Normal Shift**
```
┌─────────────────────────────────┐
│ Shift Duration:      8 hours    │
└─────────────────────────────────┘
```

**Shift with Minutes**
```
┌─────────────────────────────────┐
│ Shift Duration:     8h 30m      │
└─────────────────────────────────┘
```

**Overnight Shift**
```
┌─────────────────────────────────┐
│ Shift Duration:      8 hours    │
└─────────────────────────────────┘
```

**Invalid/Empty**
```
┌─────────────────────────────────┐
│ Shift Duration:      0 hours    │
└─────────────────────────────────┘
```

### Recurrence Pattern Options

**One-time Shift**
```
[One-time Shift               ▼]
This shift will occur only once
```

**Daily Recurrence**
```
[Daily                        ▼]
This shift will repeat every day
```

**Weekly Recurrence**
```
[Weekly                       ▼]
This shift will repeat weekly on this day
```

**Custom Pattern**
```
[Custom Pattern               ▼]
Custom recurrence pattern can be configured after creation
```

## Color Scheme Guide

### Field States

**Normal State**
```
Border: #D1D5DB (gray-300)
Background: #FFFFFF (white)
Text: #111827 (gray-900)
```

**Focus State**
```
Border: #3B82F6 (blue-500)
Ring: 2px #3B82F6 (blue-500)
Background: #FFFFFF (white)
```

**Error State**
```
Border: #EF4444 (red-500)
Background: #FEF2F2 (red-50)
```

### Section Elements

**Section Headers**
```
Color: #1F2937 (gray-800)
Font Weight: 600 (semibold)
Border: #E5E7EB (gray-200)
```

**Duration Display**
```
Background: #DBEAFE (blue-50)
Border: #BFDBFE (blue-200)
Text: #1E40AF (blue-900)
Number: #2563EB (blue-600)
```

**Helper Text**
```
Color: #6B7280 (gray-500)
Font Size: 0.75rem (12px)
```

## Responsive Breakpoints

### Desktop (≥1024px)
```
┌─────────────┬─────────────┐
│   Field 1   │   Field 2   │ ← 2 columns
├─────────────┼─────────────┤
│   Field 3   │   Field 4   │
└─────────────┴─────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────┬─────────────┐
│   Field 1   │   Field 2   │ ← 2 columns
├─────────────────────────────┤
│        Full Width Field     │ ← Some full width
└─────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────┐
│        Field 1              │ ← 1 column
├─────────────────────────────┤
│        Field 2              │
├─────────────────────────────┤
│        Field 3              │
└─────────────────────────────┘
```

## Field Validation Indicators

### Required Field (Empty)
```
Shift Name *
[________________________]
```

### Required Field (Filled)
```
Shift Name *
[Morning Shift___________] ✓
```

### Optional Field
```
Supervisor Notes
[________________________]
```

### Error State
```
Shift Name *
[________________________]
⚠️ This field is required
```

## Keyboard Navigation

```
Tab Order:
1. Shift Name
2. Shift Type
3. Station Name
4. Date
5. Start Time
6. End Time
7. Recurrence
8. Required Crew Count
9. Min Certification
10. Role Checkboxes (EMT → Paramedic → ...)
11. Supervisor Notes
12. Create Button
13. Cancel Button
```

**Shortcuts**:
- `Tab`: Next field
- `Shift+Tab`: Previous field
- `Enter`: Submit form (when focused on button)
- `Esc`: Close autocomplete dropdown
- `Arrow Down/Up`: Navigate suggestions
- `Enter`: Select suggestion

## Example Use Cases

### Use Case 1: Regular Morning Shift
```
Shift Name: Morning Shift
Type: Regular
Station: Central Fire Station
Date: Oct 21, 2025
Time: 08:00 - 16:00
Duration: 8 hours ✓
Recurrence: One-time
Crew: 6
Certification: Intermediate
Roles: ☑EMT ☑Paramedic ☑Driver
Notes: Check all equipment
```

### Use Case 2: Emergency Overnight Shift
```
Shift Name: Emergency Night Response
Type: Emergency
Station: Downtown Emergency Center
Date: Oct 21, 2025
Time: 22:00 - 06:00
Duration: 8 hours ✓
Recurrence: One-time
Crew: 8
Certification: Advanced
Roles: ☑EMT ☑Paramedic ☑Firefighter ☑Supervisor
Notes: Standby for weather emergency
```

### Use Case 3: Recurring Weekly Shift
```
Shift Name: Weekend Coverage
Type: Regular
Station: South District Station
Date: Oct 26, 2025 (Saturday)
Time: 09:00 - 17:00
Duration: 8 hours ✓
Recurrence: Weekly ✓
Crew: 4
Certification: Basic
Roles: ☑EMT ☑Driver
Notes: Standard weekend protocol
```

---

**Visual Guide Status**: Complete
**Created By**: GitHub Copilot
**Date**: October 21, 2025
