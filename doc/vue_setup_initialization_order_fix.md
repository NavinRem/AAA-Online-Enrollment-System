# Bug Fix: Lexical Initialization Error in Vue Setup

## The Issue

A `ReferenceError` occurred in `EnrollmentForm.vue`:
`Uncaught (in promise) ReferenceError: can't access lexical declaration 'availableStudents' before initialization`

This happened because the `useSearch` composable was being called with `availableStudents` (a computed property) as an argument **before** the `availableStudents` property was actually defined in the `<script setup>` block.

## Root Cause

In JavaScript's `temporal dead zone`, variables declared with `const` or `let` cannot be accessed before their declaration line is executed. Even though `script setup` compiles to a `setup()` function, the order of statements within the block still matters.

### Incorrect Order (Caused Error):

```javascript
// 1. Trying to use availableStudents here...
const { searchResults } = useSearch(availableStudents, mapper)

// 2. But it's defined here!
const availableStudents = computed(() => { ... })
```

## The Fix

I reordered the declarations to ensure that all reactive dependencies (like computed properties or refs) are fully defined before they are passed into other functions or composables.

### Correct Order (Fixed):

```javascript
// 1. Define the dependency first
const availableStudents = computed(() => { ... })

// 2. Now it's safe to use
const { searchResults } = useSearch(availableStudents, mapper)
```

## Best Practices

1. **Declare Dependencies First**: Always define `refs` and `computed` properties before any logic or composable calls that rely on them.
2. **Setup Block Structure**: Group core data (refs/computed) at the top of the script block to make dependencies clear.
3. **Import Verification**: Ensure all used mappers (like `studentSearchMapper`) are explicitly imported from their source files.
