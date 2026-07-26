/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colors.sky[400],
          dark: colors.sky[500],
          soft: colors.sky[50],
          light: colors.sky[100],
          deep: colors.sky[600],
        },
        success: {
          DEFAULT: colors.emerald[500],
          soft: colors.emerald[50],
          deep: colors.emerald[900],
        },
        error: {
          DEFAULT: colors.red[500],
          soft: colors.red[50],
          deep: colors.red[700],
        },
        warning: {
          DEFAULT: colors.amber[400],
          soft: colors.orange[50],
          deep: colors.amber[900],
        },
        info: {
          DEFAULT: colors.blue[500],
          soft: colors.blue[50],
          deep: colors.blue[600],
        },
        orange: {
          DEFAULT: colors.orange[700],
          soft: colors.orange[50],
          deep: colors.orange[900],
        },
        purple: {
          DEFAULT: colors.purple[700],
          soft: colors.purple[50],
          deep: colors.purple[900],
        },
        teal: {
          DEFAULT: colors.teal[700],
          soft: colors.teal[100],
          deep: colors.teal[800],
        },
        gray: {
          DEFAULT: colors.slate[500],
          soft: colors.slate[100],
          deep: colors.slate[600],
        },
        surface: {
          DEFAULT: colors.white,
          subtle: colors.slate[50],
          light: colors.slate[100],
        },
        content: {
          deep: colors.slate[900],
          dark: colors.slate[800],
          muted: colors.slate[500],
          light: colors.slate[400],
        },
        outline: {
          std: colors.slate[200],
        },
      },
      borderRadius: {
        sm: '8px',
        std: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'zoom-in': 'zoom-in 0.2s ease-out',
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [],
}
