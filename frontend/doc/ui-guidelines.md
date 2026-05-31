# Frontend UI Guidelines

This document outlines the standard rules and patterns that all frontend Vue templates and components must follow to ensure consistency, reliability, and a predictable user experience.

## 1. Modal Lifecycle Rules

All action modals (e.g., `*ActionModal.vue`) must adhere to the following data synchronization rules:

- **Immediate Watchers**: Every modal must use `watch(() => props.isOpen, ..., { immediate: true })` to handle data loading/resetting when the modal opens or closes.
- **Form Synchronization**: On open (`isOpen === true`), the modal must reset its form using the source prop data. If using `useActionModal`, call `sync()` inside the watcher instead of relying on its internal watcher (unless `sourceKey` is used).
- **Cleanup**: On close (`isOpen === false`), the modal must call `clearError()` and reset local UI state flags (e.g., `showConfirm = false`, `validationMessage = ''`).

## 2. Confirmation Rules

To prevent accidental data loss and ensure users know what they are acting on:

- **Delete Confirmations**: Modals requesting deletion MUST display identifying details of the target record (e.g., Name, ID, Status, associated entities). Never show an empty confirmation screen.
- **CRUD Confirmations**: All add/edit/override modals MUST display a summary of the finalized data before the final submit step, if a confirmation overlay is used.

## 3. Status Badge Rules

Status badges convey critical state and must be accurate for the context:

- **Catalog / Master List Views**: These views must display the **persisted status** fetched directly from the database (e.g., `product.status`). Do not use term-calculated statuses for catalog lists.
- **Term Detail Views**: These views must use the **calculated status** (via `calculateOfferingStatus()`) because they depend on the term's start and end dates.
- **Fallbacks**: Never render an empty or invisible badge. Always provide a logical fallback (e.g., `'available'`).

## 4. Data Fetching & Reactivity Rules

Handling complex dependent filters requires careful timing:

- **`nextTick` between filter updates**: When setting multiple dependent reactive references (e.g., setting a `termFilter` which triggers a recompute of branch options, and then trying to set `branchFilter`), you MUST await Vue's `nextTick()` before setting the child filter to ensure the computed options have settled.
- **Guard initialization in watchers**: Watchers that reset dependent filters (e.g., resetting `branchFilter` when `termFilter` changes) must skip execution during the initial page load/fetch. Use an `isInitializing` ref to prevent watchers from overriding freshly fetched defaults.
- **Prefer Fresh Data over Snapshots**: When a detail page fetches fresh associated data (e.g., fetching a `Program` document), the UI should prioritize displaying fields from the fresh document over denormalized snapshot fields on the parent entity.

## 5. UI Elements

- **AppSelect**: Dropdowns should display a visual indicator (like a checkmark) next to the currently selected item.
- **Uniqueness**: Prevent duplicate selections/entries at the UI level for fields/records that require uniqueness (e.g., duplicating classes in a term, adding the same schedule twice).
