// Respondr Mobile App Theme - Matches Web Application
// Based on apps/web/src/styles/colors.css

export const colors = {
  // Core Brand Colors
  text: "#212121",
  background: "#fbfbfe",
  primary: "#ff4238",
  secondary: "#cda284",
  accent: "#93413e",

  // Semantic Colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // UI Colors
  surface: "#ffffff",
  surfaceHover: "#f3f4f6",
  border: "#e5e7eb",
  borderHover: "#d1d5db",

  // Text Variations
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  textOnPrimary: "#ffffff",
  textOnSecondary: "#ffffff",

  // Primary Variations
  primary50: "#fef2f2",
  primary100: "#fee2e2",
  primary200: "#fecaca",
  primary300: "#fca5a5",
  primary400: "#f87171",
  primary500: "#ff4238",
  primary600: "#dc2626",
  primary700: "#b91c1c",
  primary800: "#991b1b",
  primary900: "#7f1d1d",

  // Secondary Variations
  secondary50: "#faf8f6",
  secondary100: "#f5f0e8",
  secondary200: "#ebe0d1",
  secondary300: "#e0cfb9",
  secondary400: "#d5bfa2",
  secondary500: "#cda284",
  secondary600: "#b8936f",
  secondary700: "#a3835b",
  secondary800: "#8e7447",
  secondary900: "#796533",

  // Accent Variations
  accent50: "#f7f3f3",
  accent100: "#efe7e7",
  accent200: "#dfcfce",
  accent300: "#cfb6b6",
  accent400: "#bf9e9d",
  accent500: "#93413e",
  accent600: "#803735",
  accent700: "#6d2d2c",
  accent800: "#5a2323",
  accent900: "#47191a",

  // Assignment Status Colors
  statusAssigned: "#EAB308", // Yellow (matches web app)
  statusAccepted: "#10b981", // Green
  statusEnRoute: "#FB923C", // Orange (matches web app)
  statusOnScene: "#ef4444", // Red (matches web app)
  statusCompleted: "#6b7280", // Gray
  statusDeclined: "#ef4444", // Error Red

  // Priority Colors (Incident Severity)
  priorityCritical: "#dc2626", // red-600 (matches web app)
  priorityHigh: "#ea580c", // orange-600 (matches web app)
  priorityMedium: "#d97706", // amber-600 (matches web app)
  priorityLow: "#059669", // emerald-600 (matches web app)

  // Vehicle Status Colors
  vehicleAvailable: "#10b981", // green (matches web app)
  vehicleAssigned: "#EAB308", // yellow (matches web app)
  vehicleEnRoute: "#FB923C", // orange (matches web app)
  vehicleOnScene: "#ef4444", // red (matches web app)
  vehicleReturning: "#3b82f6", // blue (matches web app)
  vehicleOutOfService: "#6b7280", // gray
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeight: {
    regular: "400" as "400",
    medium: "500" as "500",
    semibold: "600" as "600",
    bold: "700" as "700",
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export default theme;
