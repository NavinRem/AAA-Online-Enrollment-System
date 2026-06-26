# TermDetail.vue — Script Logic Documentation

The `<script setup>` block in `TermDetail.vue` is the engine that drives the Term Detail page. Because a Term is the central hub connecting Branches, Classes, Schedules, and Students, this script is responsible for complex data aggregation and state management.

Here is a breakdown of how the logic works.

## 1. Core Architecture & State Management

The component uses Vue 3's Composition API (`<script setup>`). It does not fetch raw API endpoints directly; instead, it relies heavily on the Pinia `dataStore` to ensure data consistency across the application.

### Key State Variables
- `activeBranchId`: The currently selected branch. A term can run across multiple branches. The entire page's data is filtered based on this ID.
- `activeSubTab`: Controls which table is currently visible (`classes`, `students`, `trials`, `revenue`).
- `term`: The core data object for the term, derived from `dataStore.terms` based on the URL route `id`.

## 2. Data Initialization & Flow

When the component mounts, it executes a specific loading sequence:
1. **`onMounted` / `watch`**: It watches the route ID. When loaded, it calls `dataStore.fetchAllCommonData()` to ensure all baseline data (programs, branches, etc.) is loaded.
2. **`fetchTermData()`**: It makes a specific API call (`termService.getTermById`) to get the deep, nested details of the specific term.
3. **Branch Auto-selection**: Once the term data is loaded, it automatically sets `activeBranchId` to the first branch in the term's `branchIds` array.

## 3. The Core Computed Properties (Data Aggregation)

The most complex logic in the file involves taking flat, normalized data from the store and assembling it into rich, nested objects for the tables.

### `activeBranchSetting`
A term can have a global start/end date, but individual branches *can override* these dates. This computed property looks for `branchSettings` inside the term data. If the active branch has custom dates, it returns them; otherwise, it falls back to the global term dates.

### `rawBranchOfferings`
This iterates through all the `offerings` inside the term object. It filters out only the offerings that belong to the `activeBranchId`. For each offering, it populates the rich data:
- Finds the `program`.
- Finds all enrolled `students` by cross-referencing `dataStore.enrollments`.
- Finds the `responsibleTeachers`.
- Calculates the base `currentCount` and `revenue` for that specific offering.

### `groupedBranchOfferings` (The Master Assembler)
Because a class blueprint can have multiple schedules (e.g., Monday 9AM and Wednesday 10AM), the raw offerings list will have two separate entries. This computed property groups them together so they display nicely in the table:
1. **Grouping**: It uses a `Map` to group offerings by `classId` (or `programId`).
2. **Schedule Aggregation**: It loops through the raw offerings and pushes each specific schedule into a `schedules` array inside the group.
3. **Status Calculation**: For *every single schedule*, it calls `calculateOfferingStatus()` to determine if that specific timeslot is `full`, `ongoing`, or `available`.
4. **Real Metrics**: It calculates the `totalRevenue` and `uniqueStudentCount` for the grouped class by looking at the unique enrollments across all its schedules.

## 4. Search, Filtering, and Pagination

The script handles extensive client-side table manipulations.

### `filteredClasses` & `paginatedClasses`
- **Filtering**: Uses a dropdown (`classFilter`). If the user selects a day like "Monday" (`day-Monday`), the script filters the classes to only show those that have a Monday schedule. Crucially, it *also* filters the internal `item.schedules` array so the table only displays the Monday timeslot!
- **Search**: It uses a reusable `useSearch` composable, which compares user input against a combined string of class names, statuses, and times.

### `filteredStudents`
Similar to classes, it handles filtering students by their `paymentStatus` (Paid/Unpaid) or `status` (Active/Inactive) using the `studentFilter` dropdown.

## 5. Modal and Action Handlers

The script utilizes unified action modals (e.g., `TermActionModal`, `ClassActionModal`) to handle updates.
- **`handleAction(type, item, context)`**: A centralized function that opens the appropriate modal. It passes a `type` (`edit`, `delete`, etc.) and the `item` to edit. 
- **`toggleMenu(event, id)`**: Manages the positioning of the "three-dot" action menus on table rows using Vue `<Teleport>`, ensuring dropdowns don't get clipped by hidden table overflows.

## Summary of Data Flow
1. **URL Route** -> `fetchTermData` -> Updates `dataStore.terms`.
2. `term` computed property updates.
3. `activeBranchId` is selected.
4. `groupedBranchOfferings` aggregates the schedules and calculates capacities/statuses.
5. User types in search/filters -> `filteredClasses` updates.
6. Table paginates the final view.
