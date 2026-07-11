# Table Toolbar & Centralized Filtering Guide

This document defines the architecture, styling standards, and implementation patterns for table toolbars and filtering across the application. Specifically, it covers standardizing custom filter labels, preventing header row overflow using centralized unified filter buttons, sticky popover headers, and styling popover filter menus.

---

## 1. Core Objectives & Problems Solved

1. **Header Overflow Prevention**:
   When multiple filter dimensions (e.g., Term, Branch, Shift, Day, Status) are placed side-by-side in a table header alongside a search bar and title, they overflow standard viewports and squeeze table titles (`"Classes"` -> `"Cl..."`).
2. **Centralized Secondary Filters**:
   Instead of horizontally crowding the toolbar with 4+ dropdown buttons, secondary filters are centralized into a single **`Filters`** button that opens a structured popover panel.
3. **Sticky Header & Scrollable Content Layout**:
   The filter popover keeps the header (`"Table Filters"` + `"Reset all"`) pinned sticky at the top while the filter option sections scroll cleanly below it.
4. **Custom Filter Button Labels**:
   Built-in primary filters in `<DataTable>` (such as academic term filters) can customize their default unselected button label from generic `"Filter"` to domain-specific labels like `"Term"`.

---

## 2. Standardizing Primary Built-in Filters (`DataTable` & `TableToolbar`)

### 2.1 Customizing `filterLabel`
When using `<DataTable>` with `:hasFilter="true"`, you can pass `filterLabel` to customize the default label shown when `currentFilter === 'all'` or empty.

#### Example Usage in `<DataTable>`
```vue
<DataTable
  :headers="headers"
  :items="items"
  :hasSearch="true"
  :hasFilter="true"
  filterLabel="Term"
  v-model:currentFilter="selectedTermFilter"
  :filterOptions="termFilterOptions"
/>
```

### 2.2 TableToolbar Search Bar & Responsive Layout
In `TableToolbar.vue`, the search box and toolbar layout are structured to prevent overlapping or title squashing:
- **SearchBox Width**: Constrained to `max-w-md lg:max-w-lg w-full flex-1`.
- **Title Box Protection**: Uses `shrink-0` so titles never truncate prematurely.
- **Responsive Flex Wrapping**: Uses `gap-4 flex-wrap` so toolbar actions wrap cleanly on narrower viewports.

---

## 3. Centralized Unified Filter Pattern (`#toolbar-actions`)

When a table requires multiple secondary filters (e.g., Branch, Shift, Days, Status), place them inside a single **Unified Filter Button** in the `#toolbar-actions` slot.

### 3.1 Unified Button Anatomy
```vue
<AppButton
  :variant="activeFilterCount > 0 ? 'ghost' : 'secondary'"
  size="md"
  @click="toggleTableFilterDropdown('unified', $event)"
  :class="{
    '!text-white shadow-md': activeFilterCount > 0,
    'shadow-sm': activeFilterCount === 0,
  }"
  :style="activeFilterCount > 0 ? { backgroundColor: 'var(--color-blue)' } : {}"
>
  <img
    :src="getActionIcon('filter')"
    class="w-4 h-4 brightness-0 transition-all opacity-80 group-hover:opacity-100"
    :class="{ invert: activeFilterCount > 0 }"
  />
  <span class="font-bold tracking-tight" :class="{ 'text-white': activeFilterCount > 0 }">
    Filters
  </span>
  <span
    v-if="activeFilterCount > 0"
    class="ml-1 px-1.5 py-0.5 text-3xs font-extrabold rounded-full bg-white text-blue-700 shadow-sm"
  >
    {{ activeFilterCount }}
  </span>
  <span class="ml-1 text-xs opacity-60 group-hover:opacity-100" :class="{ 'text-white': activeFilterCount > 0 }">
    ▼
  </span>
</AppButton>
```

---

## 4. Popover Filter Menu Design Standards

When the unified filter button is clicked, it opens a `<Teleport to="body">` popover menu (`.toolbar-filter-menu`) structured as follows:

### 4.1 Layout Structure (Sticky Header + Scrollable Content)
- **Outer Container**: Uses `flex flex-col overflow-hidden !p-0` with dynamic `maxHeight` computed to fit within the viewport.
- **Header (`shrink-0 px-4 py-3 border-b bg-white`)**: Pinned at the top containing the title `"Table Filters"` and the `"Reset all"` button.
- **Content Body (`flex-1 overflow-y-auto p-4 flex flex-col`)**: Contains all filter sections; scrolls independently below the header.

### 4.2 Typography & Option Styling
- **Section Headers**: Sentence/title case (`text-xs font-semibold text-content-muted`).
- **Option Buttons**: `text-sm`, `border rounded-md`, `px-2.5 py-1.5 font-semibold transition-all`.
- **Selected/Active State**: `bg-primary border-primary text-white shadow-sm font-bold`.
- **Inactive State**: `bg-white border-outline-std/60 text-content-dark hover:bg-surface-subtle`.
- **Entity Badges**: Render `<AppBadge>` cleanly inside option buttons (for branches and statuses) without duplicating text labels.

---

## 5. Implementation Reference Template

```vue
<Teleport to="body">
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="activeFilterDropdown === 'unified'"
      class="toolbar-filter-menu !p-0 !w-80 shadow-2xl border border-outline-std/80 rounded-sm bg-white z-50 flex flex-col overflow-hidden"
      :style="filterDropdownStyles"
      @mousedown.stop
    >
      <!-- Sticky Popover Header -->
      <div class="flex items-center justify-between border-b border-outline-std px-4 py-3 bg-white shrink-0">
        <span class="text-sm font-bold text-content-dark">Table Filters</span>
        <button
          v-if="activeFilterCount > 0"
          @click="resetAllTableFilters"
          class="text-xs font-bold text-error hover:text-blue-800 transition-colors"
        >
          Reset all
        </button>
      </div>

      <!-- Scrollable Filter Content Below Header -->
      <div class="flex-1 overflow-y-auto p-4 flex flex-col">
        <!-- Branch Section with Color Badges -->
        <div class="flex flex-col gap-1.5 mb-5">
          <label class="text-xs font-semibold text-content-muted">Branch</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in branchFilterOptions"
              :key="opt.value"
              @click="selectTableFilter('branch', opt.value)"
              class="px-2.5 py-1.5 border rounded-md text-sm font-semibold transition-all flex items-center gap-2"
              :class="
                String(filterBranch) === String(opt.value)
                  ? 'bg-primary border-primary text-white shadow-sm font-bold'
                  : 'bg-white border-outline-std/60 text-content-dark hover:bg-surface-subtle'
              "
            >
              <AppBadge
                v-if="opt.value !== 'all'"
                :status="opt.label"
                :type="opt.color"
                size="sm"
              />
              <span v-else>{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</Teleport>
```
