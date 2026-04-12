/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00aeef', // Vibrant Sky Blue
          dark: '#0096d1',    // Deep Sky Blue
          soft: '#f0f9ff',    // Ice Blue (Very Light)
          light: '#e0f2fe',   // Pale Sky Blue
          deep: '#0084bf',    // Ocean Blue
        },
        success: {
          DEFAULT: '#10b981', // Emerald Green
          soft: '#f0fdf4',    // Mint White
          deep: '#065f46',    // Forest Green
        },
        error: {
          DEFAULT: '#ef4444', // Vivid Red
          soft: '#fef2f2',    // Rose White
          deep: '#b91c1c',    // Blood Red
        },
        warning: {
          DEFAULT: '#f59e0b', // Amber Orange
          soft: '#fff7ed',    // Cream Orange
          deep: '#92400e',    // Burnt Orange
        },
        info: {
          DEFAULT: '#3b82f6', // Royal Blue
          soft: '#f0f9ff',    // Sky White
          deep: '#0284c7',    // Deep Cerulean
        },
        // Semantic Surfaces & Content
        'surface-light': '#f2f4f7',  // Cool Gray (Lighter)
        'surface-subtle': '#f8fafc', // Ghost White
        'content-dark': '#1e293b',   // Slate 800 (Deep Blue-Gray)
        'content-muted': '#64748b',  // Slate 500 (Medium Gray)
        'content-deep': '#1a1a1a',   // Almost Black
        'content-light': '#94a3b8',  // Slate 400 (Light Gray)
        'outline-std': '#e2e8f0',    // Slate 200 (Border Gray)

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
