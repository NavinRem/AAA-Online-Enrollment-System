# Utilities vs. Services: Architectural Distinction

In the AAA Online Enrollment System, we maintain a strict separation between communication logic and data processing logic. This ensures the codebase remains modular, testable, and easy to maintain.

## Services (`src/services/`)
**Role**: The "Interfacers"
**Analogy**: The Waiter / Courier

Services are responsible for all communication with external systems, primarily the Firebase backend and Cloud Run API.

- **Responsibility**: Fetching data, sending updates, handling authentication, and managing cache.
- **Constraints**: Services should *not* contain complex business logic or UI-specific data transformations.
- **Example**: `enrollmentService.js` handles the `fetch` call to get enrollment data.

## Utilities (`src/utils/`)
**Role**: The "Processors"
**Analogy**: The Chef / Kitchen

Utilities are responsible for transforming raw data into the specific formats needed by the UI.

- **Responsibility**: Calculating statistics, mapping IDs to names, formatting dates, and complex filtering.
- **Constraints**: Utilities must be "pure" functions. They should *never* make network calls or have side effects.
- **Example**: `enrollmentHelper.js` takes raw enrollment records and calculates the "Today Summary" numbers.

## Orchestration in Views (`src/views/`)
Views act as the **Orchestrators**. Their script blocks should be kept thin by delegating to the appropriate layer:
1. **Request**: The View asks a **Service** for data.
2. **Process**: The View passes that data to a **Utility** for cleaning/mapping.
3. **Display**: The View reactively updates the UI with the processed data.

This pattern keeps our `.vue` files focused on layout and user interaction, rather than math and data munging.
