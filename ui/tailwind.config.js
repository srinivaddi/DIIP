/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090d",
        cardBg: "#0d0f17",
        borderBg: "#1a1e2e",
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
}
