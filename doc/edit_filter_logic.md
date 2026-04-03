# Editing Filter Logic in AAA Enrollment System

This document explains how to modify the filtering functionality for the Parent/User management module.

## Core Architecture

The filtering system is split between the **View** (data filtering) and the **Reusable Component** (UI controls).

### 1. Data Filtering Logic
In `frontend/src/views/Parents.vue`, the filtering is controlled by a computed property called `statusFilteredParents`.

**Location:** `Parents.vue`
```javascript
const currentFilter = ref('all')

const statusFilteredParents = computed(() => {
  let filtered = allUsers.value

  if (currentFilter.value !== 'all') {
    filtered = allUsers.value.filter(u => {
      // Add or modify filter logic here
      if (currentFilter.value === 'active') return (u.status || 'Active').toLowerCase() === 'active'
      if (currentFilter.value === 'inactive') return (u.status || 'Active').toLowerCase() === 'inactive'
      if (currentFilter.value === 'parent') return (u.role || 'parent').toLowerCase() === 'parent'
      if (currentFilter.value === 'guardian') return (u.role || 'parent').toLowerCase() === 'guardian'
      return true
    })
  }

  return filtered
})
```

### 2. UI Configuration (The Dropdown)
The labels and values that appear in the filter dropdown are defined in the `DataTable` component instance within `Parents.vue`.

**Location:** `Parents.vue` (Template)
```html
<DataTable 
  v-model:currentFilter="currentFilter" 
  :filterOptions="[
    { label: 'All Users', value: 'all' },
    { label: 'Active Only', value: 'active' },
    { label: 'Inactive Only', value: 'inactive' },
    { label: 'Parents Only', value: 'parent' },
    { label: 'Guardians Only', value: 'guardian' },
  ]"
  ...
/>
```

### 3. Visual Styling (Colors & Icons)
The filter button's color is dynamically determined by the `getStatusTheme` helper based on the current filter's value.

*   **Logic:** `TableToolbar.vue` uses `:style="getStatusTheme(currentFilter)"`.
*   **Color Mapping:** Managed in `src/utils/statusHelper.js` under the `getStatusCategory` and `getStatusTheme` functions.
*   **Icons:** Managed via the `getActionIcon('filter')` helper.

## How to add a new filter
1.  Add a new `{ label: '...', value: '...' }` object to the `filterOptions` array in `Parents.vue`.
2.  Add a corresponding `if (currentFilter.value === '...')` case to the `statusFilteredParents` computed property.
3.  (Optional) If you want a specific color for this filter, add the value to a category in `statusHelper.js`.
