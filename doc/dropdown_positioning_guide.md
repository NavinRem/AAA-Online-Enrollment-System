# Technical Guide: Teleported Dropdown Positioning

This document explains the implementation of "floating" dropdown menus that render outside their parent containers using Vue 3's `<Teleport>` and dynamic viewport positioning.

## The Problem
Standard absolute positioning (`position: absolute; top: 100%`) places the element relative to its nearest positioned ancestor. If any parent has `overflow: hidden` or `overflow: auto` (like our data table container), the dropdown menu will be clipped or cause unwanted scrollbars.

## The Solution: Teleport + Fixed Positioning

### 1. Rendering Outside the Hierarchy
We use `<Teleport to="body">` to move the dropdown menu's DOM nodes to the end of the `<body>` element. This ensures that no parent container can clip the menu.

```vue
<Teleport to="body">
  <div v-if="isOpen" class="dropdown-menu" :style="menuStyles">
    <!-- Menu Content -->
  </div>
</Teleport>
```

### 2. Dynamic Positioning Logic
Since the menu is no longer relative to the trigger button, we must calculate its position manually using viewport coordinates.

#### Step 1: Capture the Trigger's Position
When the dropdown is toggled, we use `getBoundingClientRect()` on the button that was clicked.

```javascript
const toggleMenu = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  // rect contains top, left, bottom, right, width, height in viewport space
};
```

#### Step 2: Calculate Menu Styles
We use `position: fixed` for the teleported menu.

- **Top**: `rect.bottom + offset` (places it right below the button)
- **Left**: `rect.left` (aligns the left edges)
- **MinWidth**: A reasonable fixed width for readability.

```javascript
categoryMenuStyles.value = {
  top: `${rect.bottom + 8}px`,
  left: `${rect.left}px`,
  minWidth: '160px'
};
```

### 3. Handling focus and Blur (Search Box)
To allow interaction with elements inside the teleported menu (like a search box) while using `@blur` on the main button:
- We use a `setTimeout` in the `blur` handler.
- We check `event.relatedTarget` to see if the focus moved *into* the menu. If so, we prevent closing.
- We use `@mousedown.stop` on the menu to prevent the click from closing the dropdown before the action is registered.

```javascript
const closeCategoryFilter = (event) => {
  setTimeout(() => {
    const menu = document.querySelector('.category-filter-menu');
    if (menu && menu.contains(event.relatedTarget)) return;
    isCategoryFilterOpen.value = false;
  }, 200);
};
```

### 4. Search and Filtering
For the Category list, we add a local `ref` for the search query and a `computed` property to filter the items.

```javascript
const filteredCategories = computed(() => {
  if (!categorySearchQuery.value) return categories.value;
  const q = categorySearchQuery.value.toLowerCase();
  return categories.value.filter(c => c.name.toLowerCase().includes(q));
});
```
