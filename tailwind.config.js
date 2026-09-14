/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#4da6ff",
          DEFAULT: "#0080ff",
          dark: "#0066cc",
        },
        accent: {
          light: "#ff9966",
          DEFAULT: "#ff6600",
          dark: "#cc5200",
        },
        mint: {
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
        },
      },
      backdropBlur: {
        glass: "24px",
      },
      borderRadius: {
        glass: "20px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "SF Pro Display",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
