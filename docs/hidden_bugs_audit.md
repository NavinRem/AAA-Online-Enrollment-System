# Audit Checklist: Hidden Administrative Bugs & System Integrity

This document tracks logic inconsistencies, state synchronization gaps, and UX issues identified across the administrative modules following the major refactors of May 2026.

## 1. Data Logic & Integrity (Critical)

- [x] **Revenue Calculation Accuracy**:
    - *Risk*: `Programs.vue` using basePrice instead of actual enrollment amount.
    - *Fix*: Replaced `basePrice` lookup with `Number(e.amount)` in all reduction logic.
- [x] **ID Comparison Fragility**:
    - *Risk*: String vs Number mismatch (e.g., Firestore ID "1" vs local index 1).
    - *Fix*: Applied `String(id)` coercion to all `.find()` and `.filter()` operations.
- [x] **Branch Resolution Fallback**:
    - *Risk*: Legacy enrollments missing `branchId` causing empty metrics.
    - *Fix*: Implemented fallback chain: `e.branchId || e.class?.branch?.id || e.class?.branchId`.
- [x] **Studying Count Accuracy**:
    - *Risk*: Duplicate student counting across multiple enrollments.
    - *Fix*: Enforced `new Set(...)` on `studentId` for all studying student metrics.

## 2. Temporal Accuracy & Timezones

- [x] **Today Definition (UTC Drift)**:
    - *Risk*: Early morning data attributed to the previous day due to `toISOString()`.
    - *Fix*: Standardized on `toLocaleDateString('en-CA')` (Local YYYY-MM-DD) for all "Today" checks.
- [x] **Metric Window Synchronization**:
    - *Risk*: Programs using "Sunday reset" vs Branches using "Rolling 7-day".
    - *Fix*: Unified all weekly metrics to use the **Rolling 7-Day Window**.

## 3. UI/UX & High-Contrast Enforcement

- [x] **High-Contrast Black Text**:
    - *Requirement*: No grey text for operational info.
    - *Implementation*: Updated `Branches.vue` and `tables.css` to use `text-content-dark` and `font-bold` for all data cells.
- [x] **Horizontal Scroll UX**:
    - *Risk*: Teleported dropdown menus detaching from rows on scroll.
    - *Fix*: Verified `flexible="true"` and `AppTable` internal overflow handling.
- [x] **Color-Coded Identity**:
    - *Implementation*: Added dedicated **Abbr Badge** column in Branch table using dynamic identity colors.

## 4. State & Reactivity

- [x] **Manual Computed Mutation**:
    - *Risk*: Directly editing `.value` of computed properties.
    - *Fix*: Verified all updates go through `branchService` or `dataStore` actions to ensure persistence.
- [x] **Financial Type Safety**:
    - *Risk*: String concatenation in revenue sums (e.g., "100" + "50" = "10050").
    - *Fix*: Enforced `Number()` casting in all financial `reduce` functions.

---
*Last Updated: 2026-05-05*
