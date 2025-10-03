# Crew Assignment UI - Visual Guide

## Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Shift Management > Manage Crew                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────┐  ┌──────┐       │
│  │  Morning Shift - Station 1                           │  │ Back │       │
│  │  📅 2025-10-05 • 08:00 - 16:00                      │  └──────┘       │
│  │  Station: Fire Station 1                             │                  │
│  │                                                       │                  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │                  │
│  │  │ Required   │  │ Assigned   │  │ Needed     │    │                  │
│  │  │    6       │  │    4       │  │    2       │    │                  │
│  │  └────────────┘  └────────────┘  └────────────┘    │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                                                                              │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │ ✅ Assigned Crew (4)            │  │ ✨ Available Crew               │ │
│  ├─────────────────────────────────┤  ├──────────────────────────────────┤ │
│  │                                 │  │                                  │ │
│  │ John Smith    [EMP-001]        │  │ [Show All Crew]                 │ │
│  │ Role: [Paramedic]              │  │                                  │ │
│  │ Specialization: [Paramedic]    │  │ 🔍 Search by name, ID...        │ │
│  │ Certification: Advanced         │  │ [ All Specializations ▼ ]       │ │
│  │                   [Remove]      │  │                                  │ │
│  │─────────────────────────────────│  │──────────────────────────────────│ │
│  │                                 │  │                                  │ │
│  │ Sarah Johnson [EMP-002]        │  │ Mike Davis    [EMP-005]         │ │
│  │ Role: [EMT]                    │  │ Specialization: [Firefighter]   │ │
│  │ Specialization: [EMT]          │  │ Certification: Intermediate     │ │
│  │ Certification: Intermediate     │  │ Status: available               │ │
│  │                   [Remove]      │  │                   [+ Assign]     │ │
│  │─────────────────────────────────│  │──────────────────────────────────│ │
│  │                                 │  │                                  │ │
│  │ Alex Brown    [EMP-003]        │  │ Lisa Wilson   [EMP-006]         │ │
│  │ Role: [Firefighter]            │  │ Specialization: [Paramedic]     │ │
│  │ Specialization: [Firefighter]  │  │ Certification: Expert           │ │
│  │ Certification: Basic            │  │ Status: off_duty                │ │
│  │                   [Remove]      │  │                   [+ Assign]     │ │
│  │─────────────────────────────────│  │──────────────────────────────────│ │
│  │                                 │  │                                  │ │
│  │ Emma Taylor   [EMP-004]        │  │ Tom Anderson  [EMP-007]         │ │
│  │ Role: [Driver]                 │  │ Specialization: [EMT]           │ │
│  │ Specialization: [Driver]       │  │ Certification: Advanced         │ │
│  │ Certification: Intermediate     │  │ Status: available               │ │
│  │                   [Remove]      │  │                   [+ Assign]     │ │
│  │                                 │  │                                  │ │
│  └─────────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Color Coding System

### Badge Colors
- **Blue** (`bg-blue-100 text-blue-800`): Employee ID
  - Example: `[EMP-001]`
  
- **Green** (`bg-green-100 text-green-800`): Assigned Role (for shift)
  - Example: `[Paramedic]`, `[EMT]`, `[Firefighter]`
  
- **Purple** (`bg-purple-100 text-purple-800`): Specialization/Professional Role
  - Example: `[Paramedic]`, `[EMT]`, `[Firefighter]`, `[Driver]`, `[Supervisor]`
  
- **Yellow** (`bg-yellow-100 text-yellow-800`): Unavailable Status
  - Example: `[on_duty]`, `[on_leave]`, `[training]`

### Text Colors
- **Green** (`text-green-600`): Available status
- **Yellow** (`text-yellow-600`): Unavailable status
- **Gray** (`text-gray-600`): Secondary information

## Empty States

### No Assigned Crew
```
┌─────────────────────────────┐
│ ✅ Assigned Crew (0)        │
├─────────────────────────────┤
│                             │
│           👥                │
│   No crew assigned yet      │
│                             │
│   Start adding crew members │
│   from the right panel      │
│                             │
└─────────────────────────────┘
```

### No Search Results
```
┌──────────────────────────────┐
│ 🔍 Search: "xyz"             │
├──────────────────────────────┤
│                              │
│           🔍                 │
│   No crew members found      │
│                              │
│   Try adjusting your filters │
│                              │
└──────────────────────────────┘
```

### All Crew Already Assigned
```
┌──────────────────────────────┐
│ ✨ Available Crew            │
├──────────────────────────────┤
│                              │
│           ✅                 │
│   All matching crew          │
│   already assigned           │
│                              │
└──────────────────────────────┘
```

## Button States

### Primary Action (Assign)
- **Default**: `bg-blue-600 text-white` - "Assign"
- **Hover**: `bg-blue-700` - Darker blue
- **Disabled**: `opacity-50 cursor-not-allowed` - Grayed out

### Secondary Action (Remove)
- **Default**: `bg-red-50 text-red-600 border-red-200` - "Remove"
- **Hover**: `bg-red-100` - Lighter red background
- **Disabled**: `opacity-50 cursor-not-allowed` - Grayed out

### Toggle Button
- **Default**: `bg-blue-50 text-blue-700 border-blue-200`
- **Hover**: `bg-blue-100` - Slightly darker
- **Text Changes**: "Show Available Only" ↔ "Show All Crew"

## Crew Member Card Details

### Assigned Crew Card
```
┌──────────────────────────────────────────┐
│ John Smith [EMP-001]                     │
│                                          │
│ Role: [Paramedic]                        │
│ Specialization: [Paramedic]              │
│ Certification: Advanced                  │
│                               [Remove]   │
└──────────────────────────────────────────┘
```

### Available Crew Card (Available)
```
┌──────────────────────────────────────────┐
│ Mike Davis [EMP-005]                     │
│                                          │
│ Specialization: [Firefighter]            │
│ Certification: Intermediate              │
│ Status: available (green)                │
│                               [+ Assign] │
└──────────────────────────────────────────┘
```

### Available Crew Card (Unavailable - When Showing All)
```
┌──────────────────────────────────────────┐
│ Lisa Wilson [EMP-006] [on_duty]          │
│                                          │
│ Specialization: [Paramedic]              │
│ Certification: Expert                    │
│ Status: on_duty (yellow)                 │
│                               [+ Assign] │
└──────────────────────────────────────────┘
```

## Filter Panel

### Expanded View
```
┌──────────────────────────────────────┐
│ ✨ Available Crew    [Show All Crew] │
├──────────────────────────────────────┤
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🔍 Search by name, employee ID...│ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ All Specializations          ▼  │ │
│ └──────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

### Dropdown Options
```
All Specializations
Driver
EMT
Firefighter
Paramedic
Supervisor
```

## Statistics Cards

### Shift Statistics (Top Section)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Required    │  │ Assigned    │  │ Needed      │
│             │  │             │  │             │
│     6       │  │     4       │  │     2       │
│             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
  (Blue)           (Green)          (Yellow)
```

## Responsive Behavior

### Desktop (>= 1024px)
- Two-column layout
- Side-by-side panels
- Full-width panels

### Tablet/Mobile (< 1024px)
- Single-column layout
- Assigned crew panel on top
- Available crew panel below
- Full-width panels
- Scrollable lists

## Interaction Flow

### Adding a Crew Member
1. 👁️ **See** crew member in right panel
2. 🔍 **Search/Filter** (optional) to find specific crew
3. 🖱️ **Click** "+ Assign" button
4. ⚡ **Instant** - Crew moves to left panel
5. ✅ **Success** - Statistics update automatically

### Removing a Crew Member
1. 👁️ **See** crew member in left panel
2. 🖱️ **Click** "Remove" button
3. ⚡ **Instant** - Crew removed from shift
4. ↩️ **Returns** to available pool (if previously available)
5. ✅ **Success** - Statistics update automatically

### Searching for Crew
1. 🖱️ **Click** search input field
2. ⌨️ **Type** any part of name, ID, or role
3. ⚡ **Real-time** filtering as you type
4. 👁️ **See** matching results only
5. ❌ **Clear** search to see all again

### Filtering by Role
1. 🖱️ **Click** role dropdown
2. 👁️ **See** all available roles
3. 🖱️ **Select** specific role
4. ⚡ **Instant** filtering
5. 🔄 **Select** "All Specializations" to reset

## Icons Used

- 👥 People/Crew
- ✅ Success/Assigned
- ✨ Available/Special
- 🔍 Search
- 📅 Date/Calendar
- ➕ Add/Plus
- ❌ Remove/Delete
- 🔄 Refresh/Reset
- ⚡ Instant/Fast
- 👁️ View/See
- 🖱️ Click/Mouse
- ⌨️ Type/Keyboard

## Accessibility Features

- ✅ Clear visual hierarchy
- ✅ Color-coded information
- ✅ High contrast text
- ✅ Descriptive button labels
- ✅ Loading states
- ✅ Empty states with clear messages
- ✅ Hover effects for better feedback
- ✅ Disabled states when appropriate
