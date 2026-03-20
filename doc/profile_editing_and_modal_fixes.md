# Profile Editing and Modal Width Fixes

## Overview
This document technical explanation of the fixes implemented to resolve the profile picture persistence issues and the modal width constraints.

## 1. Profile Picture Persistence Fix
**Problem**: When editing a parent or student profile, the selected avatar (profile picture) was not being saved, even though it was correctly selected in the `AvatarSelector` component.

**Root Cause**: The `submitActionModal` handlers in both `Parents.vue` and `Students.vue` were missing the `profileURL` field in their `formData` destructuring and subsequent service calls.

**Solution**:
- **Updated `Parents.vue`**: Added `profileURL` to the `submitActionModal` destructuring and passed it to `userService.updateUser`.
- **Updated `Students.vue`**: Added `profileURL` to the `submitActionModal` destructuring and passed it to `userService.updateStudent`.
- **State Synchronization**: Ensured local state updates (reactively updating the table) also include the new `profileURL`.

## 2. Modal Width Optimization
**Problem**: The "action" modals (used for editing users) were too narrow (fixed at 480px), causing layout issues with the `AvatarSelector` and dense forms like the student edit modal.

**Solution**:
- **Modified `AppModal.css`**: Increased `max-width` of `.modal-content.action` to `600px`.
- **Responsive Width**: Added `width: 90%` for better mobile responsiveness.
- **Refined `AvatarSelector.vue`**: Changed `justify-content` from `center` to `space-around` and increased horizontal padding to ensure the content "fits" the wider container naturally.

## Related Files
- `frontend/src/views/Parents.vue`
- `frontend/src/views/Students.vue`
- `frontend/src/assets/styles/components/AppModal.css`
- `frontend/src/components/common/ui/AvatarSelector.vue`
