/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Respondr Brand Colors
        brand: {
          text: "#212121",
          background: "#fbfbfe",
          primary: "#ff4238",
          secondary: "#cda284",
          accent: "#93413e",
        },
        // Primary color variations (based on your #ff4238)
        primary: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ff4238", // Your main primary
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // Secondary color variations (based on your #cda284)
        secondary: {
          50: "#faf8f6",
          100: "#f5f0e8",
          200: "#ebe0d1",
          300: "#e0cfb9",
          400: "#d5bfa2",
          500: "#cda284", // Your main secondary
          600: "#b8936f",
          700: "#a3835b",
          800: "#8e7447",
          900: "#796533",
        },
        // Accent color variations (based on your #93413e)
        accent: {
          50: "#f7f3f3",
          100: "#efe7e7",
          200: "#dfcfce",
          300: "#cfb6b6",
          400: "#bf9e9d",
          500: "#93413e", // Your main accent
          600: "#803735",
          700: "#6d2d2c",
          800: "#5a2323",
          900: "#47191a",
        },
        // Semantic colors
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#10b981",
          600: "#059669",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
