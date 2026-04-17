/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#11396D',
          beige: '#A88365',
          dark: '#1A1A1A',
          navy: '#1E2E59',
          cream: '#E7D9B0',
        },
      },
      fontFamily: {
        serif: ['"South Korea Serif"', 'Georgia', 'serif'],
        sans: ['"RNS Sisma"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
