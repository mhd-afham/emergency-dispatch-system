# Mobile App Color System Update

## Overview

This document details the comprehensive color system update applied to the mobile app to ensure consistency with the web application's finalized color palette.

**Date:** January 2025  
**Related Issues:** Issue #26 - Map marker color consistency

---

## Color System Principles

### Status Color Meanings

- **Cyan (#06B6D4)**: Pending/Waiting state - not yet assigned
- **Yellow (#EAB308)**: Assigned state - crew has been notified
- **Orange (#FB923C)**: En Route - actively traveling to scene
- **Red (#EF4444)**: On Scene - at the emergency location
- **Blue (#3B82F6)**: Returning - heading back to station
- **Green (#10B981)**: Available/Completed - ready for next assignment
- **Gray (#6B7280)**: Inactive/Out of Service

### Severity Color Meanings

- **Critical**: Red (#dc2626) - Life-threatening emergency
- **High**: Orange (#ea580c) - Serious incident requiring urgent response
- **Medium**: Amber (#d97706) - Standard priority response
- **Low**: Emerald (#059669) - Minor incident

---

## Updated Files

### 1. `apps/mobile/src/styles/theme.ts`

#### Assignment Status Colors

**Before:**

```typescript
statusAssigned: "#3b82f6", // Blue
statusEnRoute: "#f59e0b", // Orange (old amber)
statusOnScene: "#ff4238", // Primary Red
```

**After:**

```typescript
statusAssigned: "#EAB308", // Yellow (matches web app)
statusEnRoute: "#FB923C", // Orange (matches web app)
statusOnScene: "#ef4444", // Red (matches web app)
```

#### Priority/Severity Colors

**Before:**

```typescript
priorityCritical: "#dc2626",
priorityHigh: "#f59e0b",    // ❌ Old amber
priorityMedium: "#3b82f6",   // ❌ Blue (incorrect)
priorityLow: "#10b981",      // ❌ Green (should be emerald)
```

**After:**

```typescript
priorityCritical: "#dc2626", // red-600 (matches web app)
priorityHigh: "#ea580c",     // orange-600 (matches web app)
priorityMedium: "#d97706",   // amber-600 (matches web app)
priorityLow: "#059669",      // emerald-600 (matches web app)
```

#### Vehicle Status Colors

**Before:**

```typescript
vehicleAssigned: "#f59e0b",  // ❌ Old amber
vehicleEnRoute: "#ff4238",   // ❌ Primary red (incorrect)
vehicleOnScene: "#93413e",   // ❌ Accent color (incorrect)
```

**After:**

```typescript
vehicleAssigned: "#EAB308",  // yellow (matches web app)
vehicleEnRoute: "#FB923C",   // orange (matches web app)
vehicleOnScene: "#ef4444",   // red (matches web app)
```

---

### 2. `apps/mobile/src/components/AssignmentNotificationModal.tsx`

#### Timer Color Function

**Before:**

```typescript
const getTimerColor = () => {
  if (timeLeft > 20) return "#10b981"; // Green
  if (timeLeft > 10) return "#f59e0b"; // ❌ Amber
  return "#ef4444"; // Red
};
```

**After:**

```typescript
const getTimerColor = () => {
  if (timeLeft > 20) return "#10b981"; // Green
  if (timeLeft > 10) return "#EAB308"; // ✅ Yellow (matches assigned color)
  return "#ef4444"; // Red
};
```

#### Severity Color Map

**Before:**

```typescript
const severityMap: { [key: string]: string } = {
  critical: "#dc2626",
  high: "#f59e0b", // ❌ Old amber
  medium: "#3b82f6", // ❌ Blue (incorrect)
  low: "#10b981", // ❌ Green (should be emerald)
};
```

**After:**

```typescript
const severityMap: { [key: string]: string } = {
  critical: "#dc2626", // red-600 (matches web app)
  high: "#ea580c", // orange-600 (matches web app)
  medium: "#d97706", // amber-600 (matches web app)
  low: "#059669", // emerald-600 (matches web app)
};
```

---

### 3. `apps/mobile/src/components/DashboardScreen.tsx`

#### Vehicle Status Badge Colors

**Before:**

```typescript
// Combined assigned AND en_route into same color
backgroundColor:
  vehicle.status?.currentStatus === "available"
    ? "#d1fae5"
    : vehicle.status?.currentStatus === "assigned" ||
      vehicle.status?.currentStatus === "en_route"
    ? "#fef3c7"  // ❌ Both states used yellow
    : "#fee2e2",
```

**After:**

```typescript
// Separate colors for assigned vs en_route
backgroundColor:
  vehicle.status?.currentStatus === "available"
    ? "#d1fae5" // green-100
    : vehicle.status?.currentStatus === "assigned"
    ? "#fef3c7" // yellow-100 (matches web app)
    : vehicle.status?.currentStatus === "en_route"
    ? "#fed7aa" // orange-100 (matches web app)
    : "#fee2e2", // red-100
```

#### Text Colors Updated

**Before:**

```typescript
color:
  vehicle.status?.currentStatus === "available"
    ? "#065f46"
    : vehicle.status?.currentStatus === "assigned" ||
      vehicle.status?.currentStatus === "en_route"
    ? "#92400e"  // ❌ Both states used same text color
    : "#991b1b",
```

**After:**

```typescript
color:
  vehicle.status?.currentStatus === "available"
    ? "#065f46" // green-900
    : vehicle.status?.currentStatus === "assigned"
    ? "#92400e" // yellow-900 (matches web app)
    : vehicle.status?.currentStatus === "en_route"
    ? "#9a3412" // orange-900 (matches web app)
    : "#991b1b", // red-900
```

---

## Complete Color Reference

### Assignment Status Colors

| Status    | Mobile Color | Web Color | Hex Code | Usage                       |
| --------- | ------------ | --------- | -------- | --------------------------- |
| Assigned  | Yellow       | Yellow    | #EAB308  | Crew notified of assignment |
| Accepted  | Green        | Green     | #10B981  | Crew accepted assignment    |
| En Route  | Orange       | Orange    | #FB923C  | Traveling to incident       |
| On Scene  | Red          | Red       | #EF4444  | At emergency location       |
| Completed | Gray         | Green     | #6B7280  | Assignment finished         |
| Declined  | Red          | Red       | #EF4444  | Crew declined assignment    |

### Incident Severity Colors

| Severity | Mobile Color | Web Color | Hex Code | Description                |
| -------- | ------------ | --------- | -------- | -------------------------- |
| Critical | Red          | Red       | #dc2626  | Life-threatening emergency |
| High     | Orange       | Orange    | #ea580c  | Urgent response required   |
| Medium   | Amber        | Amber     | #d97706  | Standard priority          |
| Low      | Emerald      | Emerald   | #059669  | Minor incident             |

### Vehicle Status Colors

| Status         | Mobile Color | Web Color | Hex Code | Description          |
| -------------- | ------------ | --------- | -------- | -------------------- |
| Available      | Green        | Green     | #10B981  | Ready for assignment |
| Assigned       | Yellow       | Yellow    | #EAB308  | Assigned to incident |
| En Route       | Orange       | Orange    | #FB923C  | Traveling to scene   |
| On Scene       | Red          | Red       | #EF4444  | At incident location |
| Returning      | Blue         | Blue      | #3B82F6  | Returning to station |
| Out of Service | Gray         | Gray      | #6B7280  | Not available        |

---

## Implementation Locations

### DashboardScreen.tsx

- **Function**: `getStatusColor()` (line 735)

  - Uses: `colors.statusAssigned`, `colors.statusEnRoute`, `colors.statusOnScene`
  - Purpose: Returns color for assignment status badges

- **Function**: `getSeverityColor()` (line 755)

  - Uses: `colors.priorityCritical`, `colors.priorityHigh`, `colors.priorityMedium`, `colors.priorityLow`
  - Purpose: Returns color for incident priority badges

- **Inline Styles**: Vehicle status badge (lines 1118-1147)
  - Uses: Hardcoded background and text colors for vehicle status display
  - Purpose: Shows current vehicle operational status

### AssignmentNotificationModal.tsx

- **Function**: `getTimerColor()` (line 194)

  - Uses: Hardcoded timer colors (green, yellow, red)
  - Purpose: Shows urgency of assignment acceptance timer

- **Function**: `getSeverityColor()` (line 200)
  - Uses: Hardcoded severity colors
  - Purpose: Shows incident severity badge in assignment notification

---

## Testing Checklist

### Visual Consistency Tests

- [ ] Assignment notification modal shows yellow for assigned status
- [ ] Timer color transitions: Green (>20s) → Yellow (>10s) → Red (<10s)
- [ ] Severity badges match web app colors (critical=red, high=orange, medium=amber, low=emerald)
- [ ] Vehicle status badge shows distinct colors for assigned (yellow) vs en_route (orange)
- [ ] Dashboard assignment status display uses correct colors
- [ ] Priority/severity badges in incident details use correct colors

### Functional Tests

- [ ] Accept assignment → Status shows yellow (#EAB308)
- [ ] En route to scene → Status shows orange (#FB923C)
- [ ] Arrive on scene → Status shows red (#EF4444)
- [ ] Complete assignment → Status shows gray (#6B7280)
- [ ] Vehicle status transitions update colors correctly
- [ ] Assignment notification timer colors animate properly

### Cross-Platform Tests

- [ ] Colors render correctly on iOS
- [ ] Colors render correctly on Android
- [ ] Colors match web app on dispatcher view
- [ ] Colors are accessible (WCAG AA contrast ratios)

---

## Key Changes Summary

### 🎨 Primary Color Updates

1. **Assigned Status**: Blue (#3b82f6) → Yellow (#EAB308)

   - **Rationale**: Distinguishes "notified" state from "traveling" state
   - **Impact**: Assignment cards, status badges, notifications

2. **En Route Status**: Amber (#f59e0b) → Orange (#FB923C)

   - **Rationale**: Clear distinction between assigned (yellow) and traveling (orange)
   - **Impact**: Vehicle status, assignment progress tracking

3. **High Severity**: Amber (#f59e0b) → Orange (#ea580c)

   - **Rationale**: Aligns with web app severity color scheme
   - **Impact**: Incident priority badges, severity indicators

4. **Medium Severity**: Blue (#3b82f6) → Amber (#d97706)

   - **Rationale**: Proper severity hierarchy (red > orange > amber > green)
   - **Impact**: Priority badges in assignment details

5. **Low Severity**: Green (#10b981) → Emerald (#059669)
   - **Rationale**: More professional emergency services palette
   - **Impact**: Low priority incident badges

### 🔧 Technical Improvements

- Separated combined "assigned || en_route" logic into distinct color assignments
- Added inline comments documenting color choices and Tailwind equivalents
- Centralized color definitions in `theme.ts` for consistency
- Updated hardcoded colors in component logic to match theme

### 📊 Impact Analysis

- **Files Modified**: 3
- **Color Definitions Updated**: 15
- **Components Affected**: 2 (DashboardScreen, AssignmentNotificationModal)
- **Breaking Changes**: None (color changes only)
- **Backward Compatibility**: Maintained

---

## Related Documentation

- [MAP_COMPONENT_ANALYSIS.md](./MAP_COMPONENT_ANALYSIS.md) - Web app color system
- [dispatch-system-issues.md](./dispatch-system-issues.md) - Issue #26 tracking
- [Web Color System](../apps/web/src/styles/colors.css) - Web app color definitions

---

## Maintenance Notes

### Future Color Updates

When updating colors in the future:

1. Update `apps/mobile/src/styles/theme.ts` first
2. Check for hardcoded colors in components using grep: `grep -r "#[0-9a-f]{6}" apps/mobile/src/components/`
3. Update inline styles to use theme colors where possible
4. Update this documentation with changes
5. Run visual regression tests on iOS and Android

### Color Consistency Check

To ensure mobile and web apps stay synchronized:

```bash
# Search for status color definitions in web app
grep -r "statusAssigned\|statusEnRoute\|statusOnScene" apps/web/src/

# Search for status color definitions in mobile app
grep -r "statusAssigned\|statusEnRoute\|statusOnScene" apps/mobile/src/
```

### Adding New Status Colors

When adding new statuses:

1. Add color definition to `theme.ts` following naming convention
2. Update `getStatusColor()` function in DashboardScreen
3. Update relevant component inline styles
4. Document the new color in this file
5. Update MAP_COMPONENT_ANALYSIS.md for web-mobile parity

---

**Last Updated:** January 2025  
**Updated By:** GitHub Copilot  
**Reviewed By:** [Pending Review]
