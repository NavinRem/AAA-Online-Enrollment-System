# Frontend Source Structure Comparison

This document provides a comparative analysis of the directories within `frontend/src/`, clarifying their specific responsibilities and the boundaries between them.

## Summary Table

| Folder | Primary Responsibility | Statefulness | Key Interaction |
| :--- | :--- | :--- | :--- |
| **`views/`** | Page Orchestration | Stateful (Context) | Coordinates services, composables, and components. |
| **`components/`** | UI Building Blocks | Mostly Stateless | Receives props, emits events. |
| **`composables/`** | Reusable Logic | Stateful (Reactive) | Used by views/components for shared logic. |
| **`services/`** | Data Communication | Stateless (IO) | Interfaces with Firebase or external APIs. |
| **`utils/`** | Data Transformation | Stateless (Pure) | Self-contained logic for formatting/parsing. |

---

## 1. Views vs. Components
The most critical boundary in the frontend architecture.

### **Views** (`src/views/`)
- **The "Brain"**: Each file typically represents a full route (e.g., `Students.vue`, `Dashboard.vue`).
- **Orchestrator**: They are responsible for "glueing" everything together. They call services to fetch data and pass that data down to components.
- **Context-Aware**: They know about the route, the current user, and the global state.

### **Components** (`src/components/`)
- **The "Body"**: Modular, reusable UI units (e.g., `StudentCard.vue`, `DataTable.vue`).
- **Agnostic**: They shouldn't know *where* data comes from. They simply render what is given via `props`.
- **Dumb/Presentational**: Ideally logic-light. They communicate back to views via `events` ($emit).

---

## 2. Common vs. Feature Folders
We distinguish between generic building blocks and domain-specific UI.

### **Common Folders** (The "How")
Located in `src/components/common/`, these are the reusable parts of the application:
- **`ui/`**: Low-level "Primitives" like `AppButton.vue` or `StatusBadge.vue`.
- **`data/`**: Generic structural components like `AppTable.vue` or `SearchBox.vue`.
- **`cards/`**: Standard card layouts (`MiniCard.vue`, `DetailCard.vue`) that provide consistent spacing/shadows.

### **Feature Folders** (The "What")
Located in `src/components/[feature]/`, these are domain-specific:
- **`enrollments/`**: Feature-specific forms and tables (e.g., `RecentEnrollmentTable.vue`).
- **`students/`**: Modals and components specific to student management.
- **`parents/`**: Modals and components specific to parent management.

---

## 3. Services vs. Utils
Both contain Javascript logic, but their purpose is strictly different.

### **Services** (`src/services/`)
- **External Communication**: Anything that talks to the outside world (Firebase, REST APIs).
- **Asynchronous**: Almost always returns `Promises`.

### **Utils (Helpers)** (`src/utils/`)
- **Data Manipulation**: Pure functions that transform data (e.g., date formatting, currency parsing).
- **Synchronous**: Typically immediate calculations.
- **Side-Effect Free**: They don't change global state or hit APIs.

---

## 4. Composables
- **Stateful Logic**: Unlike Utils, Composables use Vue's reactivity system (`ref`, `computed`).
- **Lifecycle Bound**: They can tap into component lifecycles (`onMounted`).
