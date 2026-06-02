# UI Guidelines

This document serves as the central repository for strict User Interface (UI) rules and guidelines within the AAA Online Enrollment System.

## Tailwind CSS Value Rules
**Rule:** Only accept standard Tailwind CSS utility classes. Arbitrary/manual values are STRICTLY FORBIDDEN.

### Rationale
To maintain strict design system consistency, we exclusively use Tailwind's predefined scale. Using arbitrary values (e.g., `h-[84px]`, `w-[150px]`) introduces fragmentation, breaks responsive scaling, and undermines the maintainability of the component library.

### Guidelines
- **Use standard classes:** Always use `h-20` (80px), `h-24` (96px), `w-64`, etc., instead of arbitrary brackets.
- **Do not use bracket notation:** `h-[...]`, `w-[...]`, `p-[...]`, `m-[...]`, and other bracket notations for hardcoded pixel values are not allowed.
- **Extend the theme if necessary:** If a specific dimension is repeatedly needed and missing from standard Tailwind, extend `tailwind.config.js` rather than using arbitrary values inline.

## Centralized Confirm Badges (AppConfirmOverlay.vue)
**Rule:** Standardized data keys in confirm overlays must be automatically rendered as badges through centralized logic, not manually flagged per-component.

### Rationale
To ensure visual consistency across all modules (Enrollments, Students, Programs, etc.) when displaying confirm overlays, the `AppConfirmOverlay` component enforces badge rendering based on key names rather than relying on developers to manually pass `badge: true` flags.

### Supported Auto-Badged Keys
The `AppConfirmOverlay` automatically transforms the following keys into `AppBadge` components:
- `Status`
- Keys containing `Date` (e.g., `StartDate`, `EndDate`)
- `Type`
- `Converted`
- `IsSponsorship` / `IsProrated`

Manual overrides via the `row.badge = true` property are only permitted for custom/unrecognized fields (e.g., Branch `Abbr` fields).
