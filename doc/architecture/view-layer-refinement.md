# View Layer Architecture & Refactoring Overview

This document explains the "Lean Orchestrator" pattern applied to the View layer of the AAA Online Enrollment System and provides definitions for how components work.

## 1. The "Lean Orchestrator" Pattern

In this architecture, **Views** (found in `src/views/`) are designated as orchestrators. Their primary responsibility is to coordinate the flow of data and events between various system layers without becoming bogged down in complex internal logic.

### Responsibilities of a View:
- **State Orchestration**: Initializing and managing high-level reactive state (e.g., lists of students, loading states).
- **Service Integration**: Calling backend services (e.g., `userService`, `enrollmentService`) to fetch or update data.
- **Composable Usage**: Delegating repetitive logic (e.g., searching, table action state) to reusable composables like `useSearch` or `useTableActions`.
- **Component Coordination**: Passing data down to child components via props and handling emitted events.

---

## 2. Key Refactored Components

### List Views (`Students.vue`, `Parents.vue`, `Programs.vue`, `Enrollments.vue`)
These views have been optimized to leverage the enhanced `DataTable` component.

#### How it works:
1. **DataTable Slot Props**: The `DataTable` component now manages the internal state of row actions (dropdown menus). It passes `toggleMenu`, `activeMenuId`, and `menuStyles` back to the View via a scoped slot.
2. **Logic Extraction**: Previously redundant logic for handling global clicks to close menus has been removed from the Views and is now handled internally by the `DataTable` (using the `useTableActions` composable).
3. **Event Emission**: Views listen for the `@action` event from `DataTable`, which passes the action type and the target item, allowing the View to simply open the relevant modal.

### Detail Views (`StudentDetail.vue`, `ParentDetail.vue`, `EnrollmentDetail.vue`)
These views focus on providing a deep dive into specific records.

#### How it works:
1. **Parallel Data Fetching**: When a detail view mounts, it fetches the primary record and all related records (e.g., Parent, Student, Course) in parallel using `Promise.allSettled` to ensure a fast and resilient UI.
2. **Contextual Enrichment**: Views use helper utilities (e.g., `enrichEnrollments`) to add UI-specific properties to raw data before passing it to display cards.

---

## 3. Definitions

| Term | Definition |
| :--- | :--- |
| **Lean Orchestrator** | A component that manages data flow and coordination but delegates complex logic to external modules. |
| **Slot Props Delegation** | A technique where a child component provides its internal state and methods back to the parent via scoped slots (e.g., `DataTable` row actions). |
| **Enrichment** | The process of adding computed or related properties to a raw data object for easier rendering (e.g., adding a `courseTitle` to an Enrollment object). |
| **View-side Controller** | The script section of a `.vue` file in `src/views/` that acts as the coordinator for that specific route. |

---

## 4. Maintenance Guidelines

- **Keep Logic Out**: If a function in a View script exceeds 15-20 lines or is repeated in another View, consider moving it to a helper utility or a composable.
- **Standardize UI**: Always use `DataPageLayout` for list views and `DetailPageLayout` for detail views to maintain visual consistency.
- **Leverage Composables**: Do not re-implement searching or table management; use the existing standard composables.
