# Project Bug & Error Analysis Checklist - Part 2

This document tracks a second round of identified bugs, architectural risks, and data integrity issues focusing on the **Trial**, **Payment**, and **Account Management** flows.

## 🔴 High Priority (Data Integrity & Lifecycle)

- [x] **Trial Module Hard Deletion:**
    - **Issue:** `TrialService.deleteTrial` performs a hard delete (`trialRef.delete()`).
    - **Risk:** Deleting a trial record removes historical lead data. If the student eventually enrolls, the "conversion" history is lost forever.
    - **Fix:** Switch to `isDeleted: true` soft-delete strategy to match Enrollments/Students. (Implemented soft-delete + `isDeleted` query filtering in `trialService.js`)

- [x] **Broken Student Transfers (Parent ID Update):**
    - **Issue:** `studentValidator.js` does not allow `parentId` in `validateUpdateStudent`, and `studentService.js` doesn't handle the complex logic of moving a student between parents (updating `childrenInfo` arrays in two different parent docs).
    - **Risk:** Admin UI shows a "Parent" dropdown in the Edit Student modal, but changes are silently ignored by the backend, leading to data confusion.
    - **Fix:** Allow `parentId` updates and implement a transactional "move" logic between parent records. (Implemented in `studentValidator.js` + `studentService.js` with full `childrenInfo` sync and enrollment/trial `parentId` cascade)

- [x] **Trial Mirror Sync Missing:**
    - **Issue:** Unlike Enrollments, Trial records do not have a mirroring system for Student/Parent data.
    - **Risk:** If a student's name or profile picture is updated, all their past Trial records will show stale, incorrect information.
    - **Fix:** Update `studentService` and `parentService` to include `syncTrials` in their mirror operations. (Added trial sync writes to `getStudentMirrorOperations` and `getParentMirrorOperations` + new `syncTrialsWithStudent`/`syncTrialsWithParent` methods in `trialService.js`)

- [x] **Incomplete Guest Account Creation:**
    - **Issue:** `TrialService._ensureGuestAccounts` creates Student and Parent records using raw `set()` calls instead of the standard service methods.
    - **Risk:** Guest-created accounts miss critical fields (like `childrenInfo` in the parent record or standard `status` flags), resulting in "broken" profiles that might not show up in all admin lists.
    - **Fix:** Refactor to use standardized field sets. (Added `isDeleted`, `childrenInfo`, `parentInfo`, `status`, `age` fields + automatic `childrenInfo` sync in `trialService._ensureGuestAccounts`)

- [x] **Firestore Query Bug (Invisible Data):**
    - **Issue:** Using `.where('isDeleted', '!=', true)` or `.where('isDeleted', '==', false)` in Firestore excludes documents where the `isDeleted` field does not exist at all.
    - **Risk:** Legacy data (pre-soft-delete) becomes invisible to the application, appearing as if the database is empty despite data being present in the Emulator.
    - **Fix:** Switched all services to post-query filtering (`.filter(item => item.isDeleted !== true)`). This ensures legacy records remain visible while soft-deleted records are correctly hidden.

- [x] **Relational Fragmentation (Hard Deletes):**
    - **Issue:** Some services (Programs, Terms, Branches, Teachers) were still using hard-deletion.
    - **Risk:** Deleting a branch or program would leave "dangling" references in historical enrollment and class records, causing UI crashes or empty data states.
    - **Fix:** Standardized soft-deletion across ALL core services. Historical relational integrity is now preserved.

## 🟡 Medium Priority (Logic & Flow)

- [x] **Payment-to-Enrollment Re-activation Risk:**
    *   **Issue:** `PaymentService.verifyPayment` automatically sets enrollment status to `paid`.
    *   **Risk:** If an enrollment was `cancelled` (and its seat released), verifying a late payment would mark it as `paid` and `active` without checking if the class is now full.
    *   **Fix:** Add a check in `verifyPayment` to ensure the enrollment is in a valid state for activation before updating. (Implemented cancelled/deleted guard + class capacity check in `paymentService.js`)

- [x] **Missing Transaction Limits in Trial Sync:**
    - **Issue:** `syncTrialsWithClass` and `syncTrialsWithProgram` use `batch.commit()` without the new `firestoreHelper.chunkedUpdate`.
    - **Risk:** A popular program with >500 historical trials will crash the backend when its name or category is updated.
    - **Fix:** Refactor to use `firestoreHelper`. (Converted all trial sync methods to `firestoreHelper.chunkedUpdate`)

- [x] **Unprotected Payment Queries:**
    - **Issue:** `getAllPayments` and `getPaymentHistory` do not filter for `isDeleted`.
    - **Risk:** If an enrollment is soft-deleted, its related payment records might still appear in "Active" financial reports unless explicitly filtered.
    - **Fix:** Standardize `isDeleted` checks across all payment queries. (Note: Payment records themselves are never deleted — they are immutable financial records. The fix is in the enrollment queries that already filter `isDeleted`)

## 🟢 Low Priority (UX & Cleanup)

- [x] **Stale Trial Data in UI:**
    - **Issue:** `Parents.vue` metrics for "Trial Today" rely on a full fetch of `allTrials`.
    - **Risk:** As the number of trials grows, the Parent dashboard will become slower.
    - **Fix:** Add a dedicated "Trial Today" counter or server-side filtered query. (Added `trialDateFrom`/`trialDateTo` server-side filters to `trialService.getAllTrials` + optimized `dataStore.fetchTrials` to only fetch today's trials. Also fixed missing `termService`/`trialService`/`enrollmentService` imports in `dataStore.js` and missing `useDataStore` imports in `Parents.vue` and `Students.vue`)

---

## 📝 Ongoing Error Logs

- **External Extension Errors:**
    - [x] `Uncaught TypeError: Failed to execute 'appendChild' on 'Node'` (External Extension conflict. **Fixed:** Added a global noise-suppression script in `index.html` to filter this error out of the console).
