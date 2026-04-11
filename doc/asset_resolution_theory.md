# Asset Resolution Theory: Pure Convention-Based Strategy

## Background

The previous asset resolution logic relied on a manual `ASSET_PATH_MAP` and case-sensitive matching, which often led to broken images and maintenance overhead when new categories or assets were added.

## The New Strategy: Convention over Configuration

The new system in `assetHelper.js` implements a purely dynamic, convention-based resolution strategy. Instead of explicit mapping, it uses naming patterns to find assets.

### 1. Unified Resolver (`getAsset`)

The `getAsset` function is the core engine. It performs the following steps:

- **Normalization**: Automatically converts identifiers to lowercase and replaces spaces/underscores with hyphens (e.g., "Piano Class" -> "piano-class").
- **Direct Matching**: Attempts to find the asset directly in the corresponding folder (images or icons).
- **Pattern Matching**: If a direct match fails, it automatically tries common naming conventions:
  - `classes/card-X` (for programs/courses)
  - `profiles/avatar-X` (for user profiles)
  - `dashboard/card-X` (for dashboard metrics)
  - `status/badge-X` (for status labels)

### 2. Priority of Resolution

When `getImageUrl(identifier)` is called, it follows this priority:

1.  **Already Resolved URLs**: If the input starts with `http`, `firebasestorage`, or is already a base64/blob URL, it is returned immediately.
2.  **Explicit Paths**: If the input contains a `/`, it treats it as a direct path within the assets folder.
3.  **Convention-Based Lookups**: If the input is a simple string (e.g., "Robotic"), it uses the convention patterns to find the most likely match.

## Benefits

- **Zero Maintenance**: No need to update a mapping table when adding new programs or categories.
- **Robustness**: Case-insensitive and separator-agnostic matching prevents common rendering errors.
- **Clean API**: Components can use simple, descriptive names (e.g., `getImageUrl('Piano')`) instead of hardcoding complex paths.
- **Reliable Fallbacks**: Default profiles and icons are handled centrally with predictable fallback logic.

## Usage in Helpers

Standardized helpers like `getProgramProfileURL` leverage this logic to provide context-aware defaults:

```javascript
export const getProgramProfileURL = (profileURL, category) => {
  if (profileURL) return getImageUrl(profileURL) // User uploaded
  if (category) return getImageUrl(category) // Convention default (classes/card-category)
  return getImageUrl('classes/card-model') // Global fallback
}
```
