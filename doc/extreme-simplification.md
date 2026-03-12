# Extreme Code Simplification

This document outlines the architectural shift toward "Extreme Simplification" in the frontend, focusing on making View components lean and centralizing logic in the utility layer.

## Core Philosophy: Views as Orchestrators

View components (`.vue` files) should primarily focus on **orchestration**:
1.  **Fetching Data**: Calling services to retrieve raw data.
2.  **State Management**: Managing local loading and error states.
3.  **UI Orchestration**: Passing data to child components and handling user interactions.

**Business Logic**, **Data Transformation**, and **Complex Filtering** should reside in "Pure" Utility functions.

## Implementation Details

### Centralized Status Logic (`statusHelper.js`)
To avoid scattered logic like `status === 'paid' || status === 'confirmed'`, all status-related business rules are centralized:
- `isPaid(status)`
- `isCancelled(status)`
- `isUnpaid(status)`
- `isPending(status)`

### Domain-Specific Helpers
Logic specific to various entities has been moved to dedicated helpers:

| Helper | Responsibility |
| :--- | :--- |
| `enrollmentHelper.js` | Statistics, Data Enrichment, and Detail View Filtering. |
| `studentHelper.js` | Student-specific stats and profile enrichment. |
| `parentHelper.js` | Statistics and mapping linked students to parents. |
| `programHelper.js` | Program stats and time-based "In Progress" session logic. |
| `studentStatusHelper.js` | Complex hierarchy for determining academic status. |
| `statsHelper.js` | Dashboard-wide calculation logic. |

## Benefits
1.  **Reduced Component Size**: View script sections have been reduced by up to 60%.
2.  **Reusability**: Logic is no longer trapped inside a single `.vue` file.
3.  **Testability**: Utility functions are "pure" (input -> output) and easy to unit test.
4.  **Consistency**: Status rules are defined once and applied everywhere.

## Maintenance Guidelines
- If you find yourself writing a `computed` property that performs complex filtering or mapping, move it to the corresponding `helper.js`.
- Always import shared status checks from `statusHelper.js` rather than checking strings manually.
