# Composables Guide

Composables are the primary way we manage **stateful logic** in this project. They allow us to extract complex behavior from Vue components into reusable functions.

## What is a Composable?
In the context of Vue 3 Composition API, a composable is a function that leverages Vue's reactivity system to encapsulate and reuse stateful logic. Unlike "Utilities" (which are pure functions), composables can hold `ref`, `reactive`, and `computed` state.

## Core Composables in this Project

### 1. `useSearch.js`
Generic stateful search and filtering logic.
- **Purpose**: Handles filtering a list of items based on a keyword.
- **Key Features**: Auto-focus, extraction of search-friendly text from complex objects.
- **Usage**:
```javascript
const { searchQuery, filteredItems } = useSearch(allItems, {
  searchFields: ['name', 'email'],
  extractionFn: (item) => item.fullName
})
```

### 2. `useTableActions.js`
Manages the complexity of dropdown menus and contextual actions.
- **Purpose**: Tracks which menu is open and handles click-outside logic.
- **Usage**:
```javascript
const { activeMenuId, toggleMenu, closeMenu } = useTableActions()
```

### 3. `useActionModal.js`
ORCHESTRATOR for all domain-specific modals.
- **Purpose**: Manages the lifecycle of a modal (open/close sync), form state synchronization, and loading/error handling.
- **Pattern**:
    - `getInitialData`: Defines the default empty form state.
    - `mapSourceToForm`: Maps a prop (e.g., `student`) to the local form state when the modal opens.
- **Usage**:
```javascript
const { localData, submitForm } = useActionModal(props, emit, {
  getInitialData: () => ({ name: '' }),
  mapSourceToForm: () => ({ name: props.student.name })
})
```

## Best Practices
1. **Naming**: Always prefix with `use` (e.g., `useAuth`, `useForm`).
2. **Setup vs. Logic**: Components should only define *what* data to use; the composable defines *how* it behaves.
3. **Return Objects**: Return reactive state and methods as an object for easy destructuring.
4. **Prop Synchronization**: Use the `useActionModal` pattern to avoid "mutating props" and ensure a clean "Edit" vs "Cancel" flow.
