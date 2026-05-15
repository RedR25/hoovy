/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "2rem",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      fontFamily: {
        friendly: ["Nunito", "system-ui", "sans-serif"],
      },
      colors: {
        hoovy: {
          blue: "#4F9CF9",
          purple: "#9B8EF8",
          green: "#5FD394",
          orange: "#FFA96A",
          pink: "#FF7BAC",
          yellow: "#FFD166",
          bg: "#F7F5FF",
        },
      },
    },
  },
  plugins: [],
};

