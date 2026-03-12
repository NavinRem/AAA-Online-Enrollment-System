# Logic Reuse: Composables

Composables are the primary way we manage **stateful logic** in this project. They allow us to extract complex behavior from Vue components into reusable, reactive functions.

## Reactive Logic Flow

Composables bridge the gap between global services and component templates.

```mermaid
flowchart LR
    Service[Service / API] -->|Raw Data| Composable[Composable]
    Composable -->|Reactive Ref| Component[Vue Template]
    Component -->|User Action| Composable
    Composable -->|Update Method| Service
```

## Core Patterns

### 1. Data Orchestration (`useActionModal.js`)
Handles the boilerplate for modal life-cycles.
- **Problem**: Every modal needs a `localData` copy of a prop to avoid direct mutation, plus loading/error states.
- **Solution**: `useActionModal` tracks the "Original" vs "Local" state and handles the sync.

### 2. Contextual UI State (`useTableActions.js`)
Manages UI interactions that are independent of the data itself.
- **Example**: Tracking which row in a table has its "Actions" menu open and ensuring only one is open at a time.

### 3. Stateful Search (`useSearch.js`)
A generic wrapper for filtering large datasets.
- **Feature**: Encapsulates the `searchQuery` ref and the `computed` filtered result.

## Why Use Composables?

| Benefit | Description |
| :--- | :--- |
| **Stateful** | Unlike Utils, Composables can remember data (using `ref`). |
| **Reactive** | When the Composable state changes, the UI updates automatically. |
| **Testable** | Logic can be tested in isolation from the HTML template. |
| **DRY** | Write complex orchestration once, use it across Parents, Students, and Programs. |

## Implementation Checklist
- [ ] Prefix filename with `use` (e.g., `useAuth.js`).
- [ ] Return reactive state as `refs` or `computed`.
- [ ] Expose methods for state transitions.
- [ ] Avoid embedding hardcoded domain labels (keep it generic).
