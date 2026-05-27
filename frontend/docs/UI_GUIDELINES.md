# UI Guidelines

This document outlines the standard UI guidelines and patterns to be followed across the frontend application.

## Modal Submit Buttons & Architecture (Central Style)

### 1. Unified Modals (One Modal per Module)

Each module must use exactly ONE unified modal component (e.g., `ParentActionModal.vue`) to handle all forms and actions (add, edit, delete, deactivate, etc.).

- Do not split logic into `[Entity]FormModal.vue` and `[Entity]ActionModal.vue`.
- Use Vue's `v-if` / `v-else-if` directives within the single modal to render the appropriate form or confirmation prompt based on the `type` prop.

### 2. Standardized Labels

Use consistent labeling for buttons across all modals based on the action type:

- `add` / `plus` / Create actions -> **"Add"**
- `edit` / Update actions -> **"Update"**
- `delete` / `remove` actions -> **"Delete"**
- `cancel` actions -> **"Cancel"**

**Important Implementation Rule**: Do not hardcode these labels using ternary operators (`isEditMode ? 'Update' : 'Add'`) directly in the Vue `<template>`. Instead, define a centralized `submitLabel` computed property in the script and bind it in the template.

```javascript
const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Update'
  // ... handle other types
  return 'Add'
})
```

### 3. Standardized Modal Titles

Ensure that every modal has a consistent title format based on its action type and the entity it operates on.

- `add` / Create actions -> **"Add [Entity]"** (e.g., "Add Branch", "Add Student")
- `edit` / Update actions -> **"Edit [Entity]"** (e.g., "Edit Branch", "Edit Student")
- `delete` / Remove actions -> **"Delete [Entity]"** (e.g., "Delete Branch", "Delete Student")
  _Exception: If the modal requires specific contextual phrasing (e.g. "Select Class Records from Catalog"), prioritize clarity, but default to the standardized format._

**Important Implementation Rule**: Just like submit labels, do not clutter the `<template>` with hardcoded conditionals. Store the title logic in a centralized `modalTitle` computed property in the `<script>` block.

```javascript
const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Branch'
  // ... handle other types
  return 'Add Branch'
})
```

### 4. Visually Disable on Empty/Invalid State

Never use the native HTML `disabled` attribute for form validation or "unsaved changes" states. Native disabled buttons swallow all click events, preventing us from showing the user _why_ they cannot submit the form.

**Instead, visually disable the button if required inputs are empty (or unmodified in edit mode).**

- Bind `:class="{ 'opacity-60 grayscale-[0.2]': isFormInvalid || (type === 'edit' && !isDirty) }"` to the submit button.
- The `:disabled` prop should only be bound to the `loading` state to prevent duplicate submissions.

### 5. Validation Feedback Messages

When a user clicks a visually disabled button because required inputs are empty, **show a message to tell the user why it is disabled**.

- Maintain a reactive `validationMessage` state.
- In your submit handler, check validity. If invalid, set the message (e.g., `"Please fill out all required fields to proceed."`) and trigger field shaking.
- Display the message using `<AppAlert type="error" v-if="validationMessage">` directly above the modal footer.

#### Implementation Example

```vue
<AppAlert v-if="validationMessage" type="error" class="w-full">
  {{ validationMessage }}
</AppAlert>

<AppButton
  :variant="type === 'delete' ? 'danger' : 'primary'"
  type="button"
  @click="requestConfirm"
  :loading="loading"
  :disabled="loading"
  :class="{ 'opacity-60 grayscale-[0.2]': (type === 'edit' && !isDirty) || isFormInvalid }"
>
  {{ submitLabel }}
</AppButton>
```

2. **Apply Visual Disabled Styling:** Bind the `:class` to include `'opacity-60 grayscale-[0.2]'` when the form is invalid or unmodified (`(type === 'edit' && !isDirty) || isFormInvalid`).
3. **Trigger Feedback on Click:** When the user clicks the visually disabled button, the `@click` handler (`requestConfirm` or `handleSubmit`) must execute form validation. This validation should trigger `shaking` animations on empty required inputs and/or display an error message to the user.

## Class Action Modal Rules

When implementing or updating the `ClassActionModal`, follow these specific rules regarding data structure and relationships:

1. **Class Record Structure:** A Class is fundamentally composed of a combination of a **Program**, one or more **Schedules**, and one or more **Branches**.
2. **Multiple Assignments:** The Class Action Modal must allow users to assign _multiple_ schedules and _multiple_ branches to a single Class product.
3. **Validation Requirements:** The UI must enforce that at least one program, one schedule, and one branch are selected before allowing the creation or update of the Class record.

### Class Status Values

Class statuses are split into two categories:

#### Persisted to Firebase (admin-set)

Only these values are stored in Firestore and shown in the modal status dropdown:

| Status      | Meaning                                     |
| ----------- | ------------------------------------------- |
| `available` | Open for enrollment, has remaining capacity |
| `upcoming`  | Enrollment start date is in the future      |

#### Derived on Frontend (NOT stored in Firebase)

The UI computes a single display status for classes/schedules, prioritizing conditions in this order:

1. `full` - Derived if `currentCount >= capacity`
2. `ongoing` - Derived if the class is actively taking place at the current moment
3. _(Fallback)_ - The manually persisted status (`available` or `upcoming`)

**Central Logic Container**: Always use the `calculateOfferingStatus` utility function exported from `@/utils/formatUtils` to calculate this derived status across the application. 
- **Active Terms (`TermDetail.vue`)**: By default, it checks if a class is `ongoing` based on the exact term dates and timeslot.
- **Master Catalog (`Classes.vue`)**: When rendering blueprints, pass `checkOngoing: false` to the utility. The catalog only cares if a class is `full` (across its active terms) or `available`, but should not show as `ongoing` since the blueprint itself is not a specific session instance.

---

## Rule 6 — Respect User's Manual Deletions

When editing any file in this project, **never restore code that the user has manually deleted**.

- Treat deleted blocks as intentional decisions.
- Only suggest or add _new_ improvements: better naming, cleaner style, enhanced logic, bug fixes.
- If a feature needs to come back, the user will explicitly request it.
