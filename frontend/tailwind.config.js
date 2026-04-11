/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00aeef',
          dark: '#0096d1',
          soft: '#f0f9ff',
          light: '#e0f2fe',
          deep: '#0084bf',
        },
        success: {
          DEFAULT: '#10b981',
          soft: '#f0fdf4',
          deep: '#065f46',
        },
        error: {
          DEFAULT: '#ef4444',
          soft: '#fef2f2',
          deep: '#b91c1c',
        },
        warning: {
          DEFAULT: '#f59e0b',
          soft: '#fff7ed',
          deep: '#92400e',
        },
        info: {
          DEFAULT: '#3b82f6',
          soft: '#f0f9ff',
          deep: '#0284c7',
        },
        // Semantic Surfaces & Content
        'surface-light': '#f2f4f7',
        'surface-subtle': '#f8fafc',
        'content-dark': '#1e293b',
        'content-muted': '#64748b',
        'content-deep': '#1a1a1a',
        'content-light': '#94a3b8',
        'outline-std': '#e2e8f0',

        // Legacy Support (Compatibility)
        'bg-light': '#f2f4f7',
        'bg-subtle': '#f8fafc',
        'text-dark': '#1e293b',
        'text-muted': '#64748b',
        'text-light': '#94a3b8',
        'border-color': '#e2e8f0',
      },
      spacing: {
        4.5: '1.125rem',
        '3xs': '2px',
        '2xs': '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
        '5xl': '64px',
      },
      borderRadius: {
        std: '12px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      fontSize: {
        '3xs': '0.65rem',
        '2xs': '0.7rem',
        xs: '0.75rem',
        sm: '0.85rem',
        base: '0.95rem',
        lg: '1.1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.8rem',
        '4xl': '2.2rem',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      zIndex: {
        sidebar: '100',
        topbar: '50',
        modal: '2000',
        dropdown: '3000',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
