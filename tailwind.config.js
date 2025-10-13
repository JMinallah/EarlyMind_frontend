/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      backgroundImage: {
        'green-bg': "url('/src/assets/green-bg.jpg')",
      },
      colors: {
        'earlymind': {
          'black': '#000000',    // Black (background shadow)
          'yellow': {
            DEFAULT: '#ffc642',  // Bright yellow-orange (body)
            'light': '#ffd772',  // Lighter variation
            'lighter': '#ffe5a2', // Very light variation
            'dark': '#e6b039',   // Darker variation
          },
          'teal': {
            DEFAULT: '#44ddc1',  // Teal (main body/head)
            'light': '#44dec1',  // Light teal variation
            'lighter': '#86f8cc', // Mint green highlight
            'dark': '#43ddc1',   // Aqua teal
          }
        },
      },
    },
  },
  plugins: [],
}

