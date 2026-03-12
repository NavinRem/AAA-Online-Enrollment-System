# Frontend Views Reference & Audit

This document provides an overview of the view layer architecture and identifies areas for future cleanup and optimization.

## Current Architecture

The application uses a "View-First" data fetching pattern. Views are responsible for:
1.  **Data Orchestration**: Fetching raw data from multiple services (User, Enrollment, Course).
2.  **Data Normalization**: Mapping and joining related records (e.g., attaching Parent names to Student records).
3.  **UI State**: Managing local loading states, search queries, and modal visibility.

---

## Audit Findings (Cleanup Opportunities)

### 1. Data Logic Centralization (High Priority)
Many views contain large `computed` or `onMounted` blocks that perform similar data-joining logic.
*   **Observation**: `Students.vue` and `Dashboard.vue` both manually map parent names to student IDs.
*   **Recommendation**: Move this logic to specialized **Composables** or enhance the **Service Layer** to return joined data where possible.

### 2. Utility Standardization
Inconsistencies were found in how common data types are handled.
*   **Date Parsing**: Some views use `formatDate` utility, while others (like `Dashboard.vue`) have local `parseDate` helpers.
*   **Currency**: Dollar signs and decimal rounding are currently hardcoded in templates (e.g., `"$${item.amount}"`).
*   **Recommendation**: Create a global `currencyFormatter` and unify all date parsing into the existing `dateFormatter.js`.

### 3. Component Bloat
Files like `EnrollmentDetail.vue` (800+ lines) and `Students.vue` (400+ lines) are becoming difficult to maintain.
*   **Observation**: Action modals (Edit, Delete, Override) often contain redundant form logic and template code.
*   **Recommendation**: Extract larger inline modals into standalone components and move complex action logic (API calls + success/error handling) into a shared `useViewActions` composable.

### 4. Logging & Debugging
*   **Observation**: Excessive `console.log` statements remain in production-ready files.
*   **Recommendation**: Perform a surgical purge of all non-essential logging to keep the browser console clean and improve performance.

---

## File-Specific Notes

| View | status | Key Recommendation |
| :--- | :--- | :--- |
| `Dashboard.vue` | Needs Refactor | Extract `calculateStats` logic to a utility. Remove debug logs. |
| `Students.vue` | Bloated | Move student-parent mapping to a composable. |
| `Settings.vue` | Placeholder | Future work required to implement profile settings. |
| `EnrollmentDetail.vue` | Very Large | Extract the 4 sub-modals into separate components. |
| `ParentDetail.vue` | Complex | Tab-switching logic is clean but data fetching is heavy. |
