// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // فعال کردن حالت تاریک بر اساس کلاس
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        secondary: "var(--secondary)",
        error: {
          DEFAULT: "var(--error)",
          background: "var(--error-background)",
          border: "var(--error-border)",
        },
        input: {
          background: "var(--input-background)",
          border: "var(--input-border)",
        },
      },
      ringColor: {
        primary: "var(--input-focus-ring)",
      },
      borderColor: {
        input: "var(--input-border)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
