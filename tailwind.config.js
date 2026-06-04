/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0f172a',
          blueDeep: '#1e293b',
          blueElectric: '#3b82f6',
          turquoise: '#14b8a6',
          cyan: '#06b6d4',
          smoke: '#f8fafc',
          gray: '#f1f5f9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
