/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ================================================================
      // COLORS
      // ----------------------------------------------------------------
      // HOW TO USE:
      //   Background  → bg-{name}         e.g. bg-primary, bg-error-soft
      //   Text        → text-{name}       e.g. text-primary, text-content-muted
      //   Border      → border-{name}     e.g. border-outline-std, border-error
      //   Ring        → ring-{name}       e.g. ring-primary, ring-error
      //   Opacity mod → bg-primary/10     e.g. 10% opacity of primary
      // ================================================================

      colors: {
        // ── BRAND ──────────────────────────────────────────────────────
        // Usage: bg-primary  text-primary  border-primary
        //        bg-primary-soft (light tint backgrounds)
        //        bg-primary-light (slightly stronger tint)
        //        text-primary-dark (darker text or hover)
        //        border-primary-deep (strong border)
        primary: {
          DEFAULT: colors.sky[400], // main brand blue
          dark: colors.sky[500], // hover state
          soft: colors.sky[50], // very light tint — active nav bg, highlight bg
          light: colors.sky[100], // light tint — hover bg
          deep: colors.sky[600], // strong — active borders, pressed state
        },

        // ── STATUS: SUCCESS ────────────────────────────────────────────
        // Usage: text-success  bg-success-soft  border-success
        success: {
          DEFAULT: colors.emerald[500], // text, icon, border
          soft: colors.emerald[50], // alert/badge background
          deep: colors.emerald[900], // strong text on light bg
        },

        // ── STATUS: ERROR ──────────────────────────────────────────────
        // Usage: text-error  bg-error-soft  border-error
        error: {
          DEFAULT: colors.red[500], // text, icon, border
          soft: colors.red[50], // alert/badge background, invalid input bg
          deep: colors.red[700], // strong text on light bg
        },

        // ── STATUS: WARNING ────────────────────────────────────────────
        // Usage: text-warning  bg-warning-soft  border-warning
        warning: {
          DEFAULT: colors.amber[400], // text, icon, border
          soft: colors.orange[50], // alert/badge background
          deep: colors.amber[900], // strong text on light bg
        },

        // ── STATUS: INFO ───────────────────────────────────────────────
        // Usage: text-info  bg-info-soft  border-info
        info: {
          DEFAULT: colors.blue[500], // text, icon, border
          soft: colors.blue[50], // alert/badge background
          deep: colors.blue[600], // strong text on light bg
        },

        // ── EXTENDED: ORANGE ───────────────────────────────────────────
        // Usage: text-orange  bg-orange-soft  border-orange
        orange: {
          DEFAULT: colors.orange[700], // text, icon
          soft: colors.orange[50], // badge/alert background
          deep: colors.orange[900], // strong text
        },

        // ── EXTENDED: MAGENTA ──────────────────────────────────────────
        // Usage: text-magenta  bg-magenta-soft  border-magenta
        magenta: {
          DEFAULT: colors.pink[700], // text, icon
          soft: colors.pink[100], // badge/alert background
          deep: colors.pink[900], // strong text
        },

        // ── EXTENDED: PURPLE ───────────────────────────────────────────
        // Usage: text-purple  bg-purple-soft  border-purple
        purple: {
          DEFAULT: colors.purple[700], // text, icon
          soft: colors.purple[50], // badge/alert background
          deep: colors.purple[900], // strong text
        },

        // ── EXTENDED: TEAL ─────────────────────────────────────────────
        // Usage: text-teal  bg-teal-soft  border-teal
        teal: {
          DEFAULT: colors.teal[700], // text, icon
          soft: colors.teal[100], // badge/alert background
          deep: colors.teal[800], // strong text
        },

        // ── EXTENDED: GRAY ─────────────────────────────────────────────
        // Usage: text-gray  bg-gray-soft  border-gray
        gray: {
          DEFAULT: colors.slate[500], // text, icon
          soft: colors.slate[100], // badge/alert background
          deep: colors.slate[600], // strong text
        },

        // ── SURFACES (page & component backgrounds) ────────────────────
        // surface         → white — use for: cards, modals, inputs, dropdowns
        // surface-subtle  → near white — use for: alternating rows, section bg
        // surface-light   → cool gray — use for: page background (outermost bg)
        surface: {
          DEFAULT: colors.white, // bg-surface
          subtle: colors.slate[50], // bg-surface-subtle
          light: colors.slate[100], // bg-surface-light
        },

        // ── CONTENT (all text) ─────────────────────────────────────────
        // content-deep  → headings, titles (darkest)
        // content-dark  → body text (default reading text)
        // content-muted → labels, helper text, secondary info
        // content-light → placeholders, disabled text, timestamps
        content: {
          deep: colors.slate[900], // text-content-deep  — headings
          dark: colors.slate[800], // text-content-dark  — body text
          muted: colors.slate[500], // text-content-muted — labels, secondary
          light: colors.slate[400], // text-content-light — placeholders
        },

        // ── BORDERS ────────────────────────────────────────────────────
        // outline-std → default border for all inputs, cards, dividers, tables
        outline: {
          std: colors.slate[200], // border-outline-std
        },
      },

      // ================================================================
      // SPACING
      // ----------------------------------------------------------------
      // HOW TO USE: p-{name}  px-{name}  py-{name}
      //             m-{name}  mt-{name}  mb-{name}  mx-{name}
      //             gap-{name}  space-x-{name}  space-y-{name}
      //             w-{name}   h-{name}   top-{name}  left-{name}
      //
      // GUIDE:
      //   3xs / 2xs → hairline gaps, micro nudges
      //   xs        → icon padding, tight badge gaps
      //   sm        → form field vertical padding (py-sm)
      //   md        → standard padding — most common (px-md)
      //   lg        → section inner padding
      //   xl        → card padding
      //   2xl       → gap between cards in a grid
      //   3xl–5xl   → page-level section spacing
      // ================================================================

      spacing: {
        '3xs': '2px', // hairline
        '2xs': '4px', // micro
        xs: '8px', // tight
        sm: '12px', // form field padding
        md: '16px', // standard (most used)
        lg: '20px', // section inner
        xl: '24px', // card padding
        '2xl': '32px', // between cards
        '3xl': '40px', // section gap
        '4xl': '48px', // large section
        '5xl': '64px', // page level
      },

      // ================================================================
      // BORDER RADIUS
      // ----------------------------------------------------------------
      // HOW TO USE: rounded-{name}
      //
      // GUIDE:
      //   sm   → inputs, small buttons, tags, chips
      //   std  → cards, modals, dropdowns, panels (default)
      //   md   → large cards, image containers
      //   lg   → hero sections, large panels
      //   xl   → decorative shapes
      //   2xl  → pill / capsule shapes
      //   full → avatars, circular icon buttons
      // ================================================================

      borderRadius: {
        sm: '8px', // inputs, buttons, tags
        std: '12px', // cards, modals (default)
        md: '16px', // large cards
        lg: '24px', // panels
        xl: '32px', // hero
        '2xl': '48px', // pill shapes
        full: '9999px', // circles, avatars
      },

      // ================================================================
      // FONT SIZE
      // ----------------------------------------------------------------
      // HOW TO USE: text-{name}
      //
      // GUIDE:
      //   3xs / 2xs → tiny labels inside badges, status dots
      //   xs        → table column headers, tag labels
      //   sm        → helper text, form labels, captions
      //   base      → body text, inputs, default reading size
      //   lg        → card titles, subheadings
      //   xl        → section titles
      //   2xl       → page subtitles
      //   3xl       → page titles
      //   4xl       → hero headings
      // ================================================================

      fontSize: {
        '3xs': ['0.75rem', { lineHeight: '1rem' }], // tiny badge label
        '2xs': ['0.80rem', { lineHeight: '1.1rem' }], // micro label
        xs: ['0.85rem', { lineHeight: '1.2rem' }], // table header, tag
        sm: ['0.95rem', { lineHeight: '1.4rem' }], // label, caption
        base: ['1.05rem', { lineHeight: '1.6rem' }], // body (default)
        lg: ['1.20rem', { lineHeight: '1.75rem' }], // subheading
        xl: ['1.40rem', { lineHeight: '2rem' }], // section title
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }], // page subtitle
        '3xl': ['2.10rem', { lineHeight: '2.5rem' }], // page title
        '4xl': ['2.60rem', { lineHeight: '3rem' }], // hero heading
      },

      // ================================================================
      // SHADOWS
      // ----------------------------------------------------------------
      // HOW TO USE: shadow-{name}
      //
      // GUIDE:
      //   sm → subtle lift — default cards, inputs on focus
      //   md → floating elements — dropdowns, tooltips, popovers
      //   lg → prominent float — modals, sidepanels, dialogs
      // ================================================================

      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 6px -1px rgba(0,0,0,0.10)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.10)',
      },

      // ================================================================
      // Z-INDEX
      // ----------------------------------------------------------------
      // HOW TO USE: z-{name}
      //
      // LAYER ORDER (low → high):
      //   sticky-header → topbar → sidebar → modal → dropdown
      // ================================================================

      zIndex: {
        'sticky-header': '100', // sticky table/list headers
        topbar: '500', // top navigation bar
        sidebar: '1000', // side navigation drawer
        modal: '2000', // modals and dialogs
        dropdown: '3000', // dropdowns, tooltips (always on top)
      },

      // ================================================================
      // FONT FAMILY
      // ----------------------------------------------------------------
      // HOW TO USE: font-sans (applied globally via body — rarely needed)
      // ================================================================

      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
