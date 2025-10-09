/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'green-bg': "url('/src/assets/green-bg.jpg')",
      },
    },
  },
  plugins: [],
}