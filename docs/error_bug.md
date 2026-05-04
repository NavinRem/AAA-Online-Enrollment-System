# Project Bug & Error Analysis Checklist

This document tracks potential bugs, architectural risks, and data integrity issues identified in the **AAA Online Enrollment System**.

## 🔴 High Priority (Data Integrity & Security)

- [ ] **Class Capacity Desync:**
    - **Issue:** `currentCount` in the `classes` collection is updated manually during enrollment/cancellation.
    - **Risk:** If a process crashes or a record is modified directly in Firestore, the capacity becomes incorrect.
    - **Fix:** Implement a Firebase Cloud Function `onWrite` trigger for the `enrollments` collection to automatically re-calculate `currentCount`.

- [ ] **Ghost Enrollment Counts on Deletion:**
    - **Issue:** `studentService.deleteStudent` deletes enrollment records but does not appear to decrement `currentCount` in the corresponding `classes`.
    - **Risk:** Deleting a student results in "phantom" filled seats that can never be occupied by new students.
    - **Fix:** Update `deleteStudent` to trigger `syncStudentCount` for all affected classes.

- [ ] **Transaction Limits on Mirror Sync:**
    - **Issue:** `syncStudentMirrors` updates all enrollment records when a student's profile changes.
    - **Risk:** If a student has >500 historical enrollments, the Firestore `batch` or `transaction` will fail due to the 500-write limit.
    - **Fix:** Use a recursive chunked batching utility (already exists in some services but not all).

## 🟡 Medium Priority (Logic & UX)

- [ ] **Timezone "Off-by-One" Errors:**
    - **Issue:** All dates are stored as UTC ISO strings.
    - **Risk:** Depending on the school's local timezone (e.g., GMT+7), a student born at 11:00 PM UTC might show as being born on the wrong day in the local UI.
    - **Fix:** Standardize on date-only strings (YYYY-MM-DD) for birthdays or use a consistent timezone library (Luxon/dayjs) on the frontend.

- [ ] **Inconsistent Term Status Calculation:**
    - **Issue:** `calculateStatus` in `classService.js` uses `new Date()`.
    - **Risk:** A class might show as "Upcoming" on one user's machine and "Active" on another's if their system clocks are different or if they are in different timezones.
    - **Fix:** Use a centralized server timestamp for status calculations.

- [ ] **Soft Delete Confusion:**
    - **Issue:** Some services use `isDeleted: true` while others perform hard deletes.
    - **Risk:** Reporting queries might accidentally include "deleted" records if they forget to filter for `isDeleted === false`.
    - **Fix:** Standardize on one deletion strategy per collection and document it.

## 🟢 Low Priority (Performance & Cleanup)

- [ ] **Large Dataset Performance (Frontend):**
    - **Issue:** `Enrollments.vue` fetches all enrollments and then filters them in memory.
    - **Risk:** Once the school has thousands of enrollments, the page will become sluggish and use excessive memory/data.
    - **Fix:** Implement server-side pagination and filtering in `enrollmentService.js`.

- [ ] **Redundant Firestore Queries:**
    - **Issue:** Components like `EnrollmentFormModal` receive huge arrays of `parents`, `students`, and `classes` as props.
    - **Risk:** Multiple open modals or nested components might trigger redundant re-renders or data processing.
    - **Fix:** Use a global state management store (Pinia/Vuex) with cached getters.

## 📝 Error Logs & Debugging Checklist

- **Firebase Persistence Error:** 
    - [x] Firestore settings can't be changed after initialization. (Fixed in `firebase.js`)
- **Deprecation Warnings:**
    - [x] `enableMultiTabIndexedDbPersistence` is deprecated. (Fixed in `firebase.js` using `localCache`)
- **Extension Conflicts:**
    - [ ] `Uncaught TypeError: Failed to execute 'appendChild' on 'Node'` (External: Chrome Extension conflict, ignore unless it affects app functionality).
