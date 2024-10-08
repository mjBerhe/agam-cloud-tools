/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        geist: ["Geist", "sans-serif"],
      },
      colors: {
        destructive: "hsl(0, 100%, 50%)",
        "destructive-foreground": "hsl(210, 40%, 98%)",
      },
    },
  },
  plugins: [],
};
