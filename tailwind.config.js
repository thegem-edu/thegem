/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gem-navy': '#0A0F1E',
        'gem-gold': '#C9A84C',
      },
    },
  },
  plugins: [],
}