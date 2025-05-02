/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'notion-gray': {
          50: '#f8f8f8',
          100: '#f1f1f1',
          200: '#e6e6e6',
          300: '#d9d9d9',
          400: '#b3b3b3',
          500: '#8c8c8c',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
} 