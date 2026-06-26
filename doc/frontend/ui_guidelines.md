# Frontend UI Guidelines

This document serves as the central repository for strict User Interface (UI) rules and guidelines within the AAA Online Enrollment System.

## 1. Tailwind CSS Value Rules
**Rule:** Only accept standard Tailwind CSS utility classes. Arbitrary/manual values are STRICTLY FORBIDDEN.

### Rationale
To maintain strict design system consistency, we exclusively use Tailwind's predefined scale. Using arbitrary values (e.g., `h-[84px]`, `w-[150px]`) introduces fragmentation, breaks responsive scaling, and undermines the maintainability of the component library.

### Guidelines
- **Use standard classes:** Always use `h-20` (80px), `h-24` (96px), `w-64`, etc., instead of arbitrary brackets.
- **Do not use bracket notation:** `h-[...]`, `w-[...]`, `p-[...]`, `m-[...]`, and other bracket notations for hardcoded pixel values are not allowed.
- **Extend the theme if necessary:** If a specific dimension is repeatedly needed and missing from standard Tailwind, extend `tailwind.config.js` rather than using arbitrary values inline.

## 2. Modal Lifecycle Rules

All action modals (e.g., `*ActionModal.vue`) must adhere to the following data synchronization rules:

- **Form Synchronization**: On open (`isOpen === true`), the modal must reset its form using the source prop data. If using `useActionModal`, call `sync()` inside the watcher instead of relying on its internal watcher (unless `sourceKey` is used).
- **Cleanup**: On close (`isOpen === false`), the modal must call `clearError()` and reset local UI state flags (e.g., `showConfirm = false`, `validationMessage = ''`).

## 3. Confirmation Rules

To prevent accidental data loss and ensure users know what they are acting on:

- **Delete Confirmations**: Modals requesting deletion MUST display identifying details of the target record (e.g., Name, ID, Status, associated entities). Never show an empty confirmation screen.
- **CRUD Confirmations**: All add/edit/override modals MUST display a summary of the finalized data before the final submit step, if a confirmation overlay is used.

## 4. Centralized Confirm Badges (AppConfirmOverlay.vue)
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

## 5. Status Badge Rules

Status badges convey critical state and must be accurate for the context:

- **Catalog / Master List Views**: These views must display the **persisted status** fetched directly from the database (e.g., `product.status`). Do not use term-calculated statuses for catalog lists.
- **Term Detail Views**: These views must use the **calculated status** (via `calculateOfferingStatus()`) because they depend on the term's start and end dates.
- **Fallbacks**: Never render an empty or invisible badge. Always provide a logical fallback (e.g., `'available'`).

## 6. Data Fetching & Reactivity Rules

Handling complex dependent filters requires careful timing:

- **`nextTick` between filter updates**: When setting multiple dependent reactive references (e.g., setting a `termFilter` which triggers a recompute of branch options, and then trying to set `branchFilter`), you MUST await Vue's `nextTick()` before setting the child filter to ensure the computed options have settled.
- **Guard initialization in watchers**: Watchers that reset dependent filters (e.g., resetting `branchFilter` when `termFilter` changes) must skip execution during the initial page load/fetch. Use an `isInitializing` ref to prevent watchers from overriding freshly fetched defaults.
- **Prefer Fresh Data over Snapshots**: When a detail page fetches fresh associated data (e.g., fetching a `Program` document), the UI should prioritize displaying fields from the fresh document over denormalized snapshot fields on the parent entity.

## 7. UI Elements

- **AppSelect**: Dropdowns should display a visual indicator (like a checkmark) next to the currently selected item.
- **Uniqueness**: Prevent duplicate selections/entries at the UI level for fields/records that require uniqueness (e.g., duplicating classes in a term, adding the same schedule twice).
