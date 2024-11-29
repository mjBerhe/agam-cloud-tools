/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        geist: ["Geist", "sans-serif"],
      },
      gridTemplateColumns: {
        // Simple 16 column grid
        13: "repeat(13, minmax(0, 1fr))",
        16: "repeat(16, minmax(0, 1fr))",
      },
      colors: {
        dark: {
          900: "#18181b",
          800: "#1d1d1e",
          700: "#242426",
          600: "#3a3a3c",
          500: "#505051",
        },
        primary: {
          400: "#37C6F4",
          500: "#008EB9",
          600: "#4169B2",
        },
      },
    },
  },
  plugins: [],
};
