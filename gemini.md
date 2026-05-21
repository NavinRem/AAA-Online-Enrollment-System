# Global AI Instructions: Design and Architecture Consistency

These instructions MUST be followed by all AI agents modifying this project across the **frontend, backend, and mobile** environments.

## 1. Design Consistency & Aesthetics

When creating or modifying User Interfaces, adhere to a strict and consistent design system to maintain a unified user experience.

### Typography

- **Primary Font**: Use a consistent, modern sans-serif font (e.g., Inter, Roboto, or system fonts).
- **Hierarchy**: Maintain a clear typographic hierarchy (H1, H2, H3, paragraph, small text) with standardized sizes, line heights, and font weights.

### Color Palette

- **Primary/Secondary Colors**: Stick to the project's established primary and secondary brand colors.
- **Grayscale**: Use a consistent scale for text, borders, and backgrounds (e.g., slate or gray scales).
- **Semantic Colors**: Ensure consistent colors for success (green), warning (yellow/orange), error (red), and info (blue) states across all platforms.
- **Dark/Light Mode**: Always consider both modes, ensuring sufficient contrast ratios and seamless transitions.

### Spacing and Layout

- Use a standardized spacing scale (e.g., multiples of 4px or 8px) for margins, padding, and gaps.
- Maintain consistent border-radius (e.g., 4px for buttons, 8px for cards) to give a uniform feel.

### Components

- **Reusability**: Prioritize building and using reusable UI components over writing custom inline styles or duplicated CSS.
- **Interactivity**: Ensure buttons, links, and form inputs have consistent hover, focus, active, and disabled states. Include subtle micro-animations for interactions where appropriate to make the app feel dynamic.

## 2. Cross-Platform Alignment

- **Web vs. Mobile**: While platform-specific conventions exist (e.g., iOS vs. Android navigation), the core brand identity (colors, typography, iconography, and general component styling) must remain identical.
- **Backend/Admin UI**: Any internal dashboards or admin panels must utilize the same design tokens and component libraries as the user-facing frontend.

## 3. Technology & Frameworks

- **CSS Strategy**: Continue using the established CSS approach (e.g., Vanilla CSS, Tailwind, or CSS-in-JS). Do not introduce new CSS frameworks unless explicitly requested.
- **Responsive Design**: Ensure all web interfaces are mobile-responsive by default, utilizing standard breakpoints.

**Reminder to AI**: Before modifying any UI code, review existing components and style tokens to ensure your new additions perfectly match the established aesthetic. Never use generic or disjointed styling.
