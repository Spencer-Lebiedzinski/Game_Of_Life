/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6EE7B7',
        secondary: '#60A5FA',
        accent: '#2DD4BF',
        background: '#F9FAFB',
        dark: '#111827',
      },
    },
  },
  plugins: [],
}

