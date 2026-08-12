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
          deep:  '#0C1E3F',
          /* navy is an alias of deep (#0C1E3F). Kept for backward
             compatibility with existing Tailwind utilities. */
          navy:  '#0C1E3F',
          blue:  '#2A5CBF',
          sky:   '#6C93D6',
          bg:      '#F7F4EF',
          surface: '#FDFCF9',

          warm:  '#0E121B',
          muted: '#5A6B8A',
          cream: '#F7F4EF',
        }
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
