/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#f7f7f7',
          100: '#e6e6e6',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          450: '#87868D', // Page background
          500: '#000000', // Base black
          600: '#000000',
          700: '#242329', // Dark sidebar
          800: '#000000',
          900: '#000000',
        },
        'secondary': {
          50: '#f2eaf6',
          100: '#e5d5ed',
          150: '#DBC6DE', // Active sidebar item
          200: '#BC9BC8', // Color stripe
          300: '#ab82bc',
          400: '#9a69b0',
          500: '#82368C',
          600: '#682b70',
          700: '#4e2054',
          800: '#341538',
          900: '#1a0a1c',
        },
        'accent': {
          50: '#f2eaf6',
          100: '#e5d5ed',
          200: '#BC9BC8',
          300: '#ab82bc',
          400: '#9a69b0',
          500: '#82368C',
          600: '#682b70',
          700: '#4e2054',
          800: '#341538',
          900: '#1a0a1c',
        },
        'highlight': {
          50: '#fff9e6',
          100: '#ffedb3',
          200: '#ffe180',
          300: '#ffd54d',
          400: '#ffc91a',
          500: '#e6b300',
          600: '#b38900',
          700: '#805f00',
          800: '#4d3800',
          900: '#1a1300',
        },
        'imap': {
          mint: '#A0F0C3',
          mintHover: '#90E0B3',
          turquoise: '#00A89E',
          navy: '#12434D',
          black: '#000000',
          purple: '#82368C',
          lavender: '#BC9BC8',
          yellow: '#ffc91a'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
};