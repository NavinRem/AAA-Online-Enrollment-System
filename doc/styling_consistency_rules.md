# Styling Consistency & Styling Non-Regression Rules

To maintain absolute visual integrity and design parity across the **AAA Online Enrollment System**, all developers (including agentic AI assistants) must strictly adhere to the styling preservation rules defined in this document.

---

## 🚨 Core Directives

### 1. Absolute Preservation of User Styles

- **Zero Alteration**: Under no circumstances should you edit, delete, or replace any existing style rules, tailwind utility classes, or custom class definitions that the user has implemented.
- **Preserve Specificity**: Custom overrides in component `<style>` blocks or global stylesheets (`main.css`, `cards.css`, `tables.css`, etc.) have absolute authority. They must never be rewritten or simplified unless explicitly requested by the user.

### 2. Functional Fixes Must Be Style-Neutral

- When resolving compiler parsing errors (like Vite semicolon event handlers), dynamic imports, or reactivity bugs (like computed state errors), **the visual presentation layer must remain 100% untouched**.
- You must not add, remove, or modify existing HTML/Vue element class lists during logic corrections. Keep all modifications layout-neutral.

### 3. Design Token Alignment

Any newly introduced helper component or fallback layout must strictly map to the pre-established visual token system defined in the codebase:

- **Typography**: Nunito Font family (`font-sans`), standard line heights.
- **Borders & Radii**: High-fidelity roundings (`rounded-std` for cards/modals, `rounded-sm` for inputs, `rounded-full` for avatars).
- **Colors**: Unified palette mappings (`bg-primary`, `bg-surface-subtle`, `border-outline-std`).
- **Symmetry**: Maintain the high-density, clean padding tokens (`p-md`, `p-xl`) to respect overall visual symmetry.

---

## 🛠️ Implementation Checklist for Code Edits

Before completing any file edit, verify the changes against this visual regression checklist:

- [ ] **No Deleted Classes**: Verify that no Tailwind class or custom style class was removed from templates.
- [ ] **No Altered CSS Variables**: Confirm that local or global CSS variables (`--color-primary`, etc.) are not rewritten.
- [ ] **Exact Layout Parity**: Verify that component spacing, alignments, flex directions, and widths are identical to the previous version.
- [ ] **Exact Theme Parity**: Verify that custom theme colors load dynamically without hardcoded stylesheet overrides.

---

_By maintaining these strict consistency guidelines, we guarantee that the AAA platform remains visually stunning, visually premium, and structurally stable across all administrative modules._
