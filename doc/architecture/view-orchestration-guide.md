# View Orchestration Guide

This guide defines the role of **Views** in the AAA Online Enrollment System and outlines how they coordinate between different layers of the application.

## 1. Definition of a View
A **View** (located in `src/views/`) is the top-level container for a specific route. Unlike components, which are "dumb" and presentational, a View is a **Lean Orchestrator**. 

Its primary responsibilities are:
- **State Management**: Managing the page-level loading, error, and data states.
- **Service Coordination**: Fetching data from one or more services (`userService`, `enrollmentService`).
- **Data Transformation**: Using "Helpers" or "Mappers" to shape raw API data for consumption by components.
- **Event Handling**: Responding to events emitted by child components (e.g., opening a modal when a "Edit" button is clicked).

---

## 2. The "Lean Orchestrator" Pattern
To keep Views maintainable, we follow these rules:

### A. Template: Layout & Components Only
The template should focus on high-level layout. Avoid complex logic or inline mapping.
```html
<template>
  <DashboardLayout>
    <DataPageLayout>
      <template #overview>
        <DataMetrics :stats="computedStats" />
      </template>
      <template #table>
        <DataTable :items="mappedItems" @action="handleAction" />
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
```

### B. Script: Delegation of Logic
Logic should be delegated to specialized modules:
- **Fetch Logic**: Dedicated `async` functions using `Promise.all` for parallel requests.
- **Calculations**: Moved to `src/utils/` (e.g., `statsHelper.js`, `studentHelper.js`).
- **Side-Effects**: Integrated into `onMounted` or `watch` blocks.

### C. Style: Externalized Primitives
Views should rarely contain large style blocks. They should rely on:
- **Global CSS** (`main.css`) for layout primitives.
- **Asset Styles** (`assets/styles/components/`) for reusable component styling.

---

## 3. Data Flow Pattern
Our orchestration follows a strict **"Props Down, Events Up"** flow:

1. **View fetches data** via a Service.
2. **View transforms data** via a Utility (if needed).
3. **View passes data** to a Component via `props`.
4. **Component emits event** (e.g., `@action`) when a user interacts.
5. **View handles event**, typically updating state or calling another service.

---

## 4. Example: Dashboard Orchestration
The [Dashboard](file:///home/sonavin/Code/AAA-Online-Enrollment-System/frontend/src/views/Dashboard.vue) is a prime example of multi-service coordination:
- It calls **4 services** in parallel (`userService`, `enrollmentService`, `courseService`, `authService`).
- It uses `calculateDashboardStats` to derive summary metrics from 4 different data sources.
- It provides a "Unified View" of the system's current state.
