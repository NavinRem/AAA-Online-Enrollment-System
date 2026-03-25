# Scrolling Layout Theory (The Alternative Way)

This document explains the technical rationale behind the "Alternative Way" for implementing scrollable grids in the Enrollments Dashboard.

## 1. The Flex-Wrap Problem
A `display: grid` container will naturally grow to fit all its children. To make it scrollable, it **must** have a defined height. However, in a responsive dashboard, height is dynamic.

### The Solution:
We use a **Flex Container Wrapper** (`.main-cards-grid.is-scrollable`) that behaves as a `column flexbox` with `flex: 1` and `min-height: 0`. This allows it to fill the remaining screen space without growing past the viewport boundary.

## 2. Robust Viewport-Relative Height
When parent elements (grandparents) don't have a perfectly defined height chain, `flex: 1` can sometimes fail to find its ceiling.

### The Solution:
We use **`max-height: calc(100vh - 200px)`**. 
- `100vh` is the total browser window height.
- `200px` accounts for the header, padding, and navbar area.
This creates a hard "ceiling" that reliably triggers the `overflow-y: auto` scrollbar on any screen size.

## 3. Clean CSS without `!important`
Previously, `!important` was used to brute-force alignment. We've removed it using two CSS principles:

1.  **Scoped Selectors**: In Vue, `<style scoped>` appends a unique ID to every class (e.g., `.detail-cards-grid[data-v-xxxx]`). These automatically have higher specificity than global styles in `detail-view.css`.
2.  **Combined Class Selectors**: In `DetailPageLayout.css`, we use `.main-cards-grid.is-scrollable`. This "two-class" selector is naturally stronger than the base `.main-cards-grid`, so it overrides the `display: grid` with `display: flex` cleanly.

## 4. Prop-Based "Opt-In" API
Instead of "hacking" the layout from the outside with `:deep` selectors, we've added a `scrollable` prop to `DetailPageLayout.vue`.

### The Benefit:
This creates a clean, intentional API. A page like `EnrollmentDetail` can simply request scrolling:
```vue
<DetailPageLayout :scrollable="true">
```
While a page like `ParentDetail` can keep its internal tab scrolling by leaving it `false` (default). This prevents layout conflicts and double scrollbars.
