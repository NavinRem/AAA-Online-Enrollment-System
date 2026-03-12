# Components vs. Composables

In our Vue 3 architecture, `components` and `composables` play distinct but complementary roles.

## 1. Components (`src/components/`)
**Role: The "What" (The Interface)**
Components are the visual building blocks of the application. They contain HTML templates and CSS styles.
- **Purpose**: To render the User Interface (UI).
- **Contains**: Template, Styles, and component-specific UI state (e.g., is a modal open?).
- **Rule of Thumb**: If it has HTML, it's a Component.

## 2. Composables (`src/composables/`)
**Role: The "How" (The Reusable Logic)**
Composables are functions that leverage Vue's Composition API (like `ref`, `computed`, `onMounted`) to encapsulate and reuse **stateful logic**.
- **Purpose**: To share complex logic across multiple components or views without repeating code.
- **Contains**: Pure JavaScript logic that uses Vue's reactivity system. They do **not** have templates.
- **Example**: `useSearch` handles the logic of filtering a list based on an input, which can be reused in the Students, Parents, and Enrollments views.
- **Rule of Thumb**: If it's a function starting with `use` and manages reactive state, it's a Composable.

---

## Comparison with Utils and Services

It's common to confuse **Composables** with **Utilities** since both use `.js` files.

| Feature | Utility (`src/utils/`) | Composable (`src/composables/`) | Service (`src/services/`) |
| :--- | :--- | :--- | :--- |
| **Logic Type** | Pure Data Transformation | Stateful, Reactive Logic | External Communication |
| **Vue Reactive** | No (No `ref`, `computed`) | Yes (Uses `ref`, `computed`) | No (Usually) |
| **Example** | `formatDate(date)` | `useSearch(list)` | `courseService.get()` |
| **Mental Model** | A Calculator | A Brain | A Messenger |

### Summary
1. **Utility**: Input -> Computation -> Output.
2. **Service**: Request -> Network -> Data.
3. **Composable**: Tracks State over time (e.g., current search query, menu open status).

## Audit Strategy
I will now audit both folders to:
1.  **Simplify Components**: Remove any complex data processing and move it to Utilities or Composables.
2.  **Genericize Composables**: Ensure they are robust and don't contain hardcoded domain logic that limits their reuse.
3.  **Consistency**: Ensure props and event naming are standardized across all components.
