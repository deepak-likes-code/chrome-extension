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
      },
    },
  },
  plugins: [],
};
