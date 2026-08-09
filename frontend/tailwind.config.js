/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#030712',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  safelist: [
    { pattern: /bg-(red|blue|green|yellow|purple|orange)-(400|500|600|700|800|900|950)\/(10|20|30|50)/ },
    { pattern: /border-(red|blue|green|yellow|purple|orange)-(400|500|600|700|800|900)\/(30|50)/ },
    { pattern: /text-(red|blue|green|yellow|purple|orange)-(300|400|500|600)/ },
  ]
}
