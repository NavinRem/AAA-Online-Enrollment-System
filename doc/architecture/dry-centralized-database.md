# DRY Principle & Centralized Database Pattern

## The "DRY" Principle
**DRY** stands for **Don’t Repeat Yourself**. It is a fundamental principle of software development aimed at reducing repetition of software patterns.

### Why DRY Matters
- **Maintenance**: When a piece of knowledge is repeated, update requirements multiply. Changing a collection name in one place is safer than 15.
- **Reliability**: Repetition creates opportunities for manual errors (typos). Centralization ensures that if something works in one place, it works everywhere.
- **Readability**: Code becomes cleaner when "Magic Strings" are replaced by descriptive constants.

## The "Centralized Map" Pattern
In this project, we use a central configuration file (`backend/functions/src/config/database.js`) to act as a "Map" for the entire backend.

### Benefits for Growth
1. **Single Source of Truth**: The database ID and collection names are defined exactly once.
2. **Environment Portability**: Easily switch between `development`, `staging`, and `production` databases by changing one configuration value.
3. **Developer Onboarding**: New developers can understand the entire data schema by looking at one file instead of auditing the entire codebase.
4. **IntelliSense Support**: Using constants instead of strings enables IDE features like auto-completion and "Find All References," making navigation and refactoring effortless.

### Practical Example
**Instead of (WET):**
```javascript
db.collection("enrollment").get(); // Hardcoded string repeated everywhere
```

**We use (DRY):**
```javascript
const { db, COLLECTIONS } = require("../config/database");
db.collection(COLLECTIONS.ENROLLMENT).get(); // Centralized constant
```
