# Pattern: Lean View Orchestration

Extreme simplification is the practice of moving logic out of `.vue` files and into specialized JavaScript layers. This makes the Views **lean** and focused.

## The Transformation

### BEFORE (Bloated View)
A View component that handles its own math, data mapping, and API logic.
```javascript
// Complex math and filtering trapped in the View
const stats = computed(() => {
  return items.value.reduce((acc, item) => {
    if (item.status === 'paid') acc.total += item.price;
    return acc;
  }, { total: 0 });
});
```

### AFTER (Lean View)
A View component that delegates to a **Utility** or **Composable**.
```javascript
// The logic is now reusable and testable in a helper file
import { calculateTotals } from '@/utils/statsHelper';
const stats = computed(() => calculateTotals(items.value));
```

## View Stewardship Checklist

When writing or refactoring a View, ask:
1.  **Is this math?** Move to `src/utils/`.
2.  **Is this an API call?** Move to `src/services/`.
3.  **Is this a reactive UI behavior?** Move to `src/composables/`.
4.  **Is this a complex modal?** Extract to a standalone component.

## Architecture Mapping

| Layer | Responsibility | Pattern Name |
| :--- | :--- | :--- |
| `src/views/` | **Orchestrator** | Coordinates data and state. |
| `src/utils/` | **Processor** | Pure functional transformations. |
| `src/composables/` | **Manager** | Stateful reactive behavior. |
| `src/services/` | **Messenger** | Centralized API communication. |

By following this pattern, we ensure that the "Business Logic" of the enrollment system is decoupled from the "User Interface."
