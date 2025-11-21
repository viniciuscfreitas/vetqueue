/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // Slate 900
        secondary: "#1e293b", // Slate 800
        gold: "#d4af37",
        "gold-light": "#f0e6b3",
        "gold-dark": "#b4942b",
        "gold-accessible": "#856d1b",
        "surface": "#ffffff",
        "background": "#f8fafc", // Slate 50
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], // Override serif to sans for consistency if used anywhere
      }
    },
  },
  plugins: [],
}
