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

## 3. Storage Emulator Configuration

**Problem**: Image uploads would hang "indefinitely" during local development.

**Root Cause**: The application was correctly connected to Auth and Firestore emulators but was missing the Storage emulator connection. Attempting to upload to production Storage with a local emulator Auth token caused a security/timeout hang.

**Solution**:

- **Updated `firebase.json`**: Added the `storage` emulator on port `9199`.
- **Updated `firebase.js`**: Added `connectStorageEmulator(storage, '127.0.0.1', 9199)` to the local environment check.
- **Updated `storage.rules`**: Allowed unauthenticated writes specifically to `/profiles/temp/` to enable registration-phase uploads.

## 4. Teacher & New User Avatar Selection

**Requirement**: Allow new users (especially teachers who cannot edit their profile later) to select a default avatar or upload a custom one during account creation.

**Solution**:

- **Updated `UserAuth.vue`**: Integrated `AvatarSelector` into the registration form.
- **Defaulting**: Set a default path (`profiles/avatar-man`) so that all new accounts start with a valid profile picture.
- **Logic**: Passed the `profileURL` to the `registerParentAccount` (generic registration) service call.

## Related Files

- `firebase.json`
- `frontend/src/firebase.js`
- `frontend/src/components/auth/UserAuth.vue`
- `frontend/src/views/Parents.vue`
- `frontend/src/views/Students.vue`
- `frontend/src/assets/styles/components/AppModal.css`
- `frontend/src/components/common/ui/AvatarSelector.vue`
