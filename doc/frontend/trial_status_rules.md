# Trial Status Rules

## Deprecated Statuses Deleted
Statuses such as `pending`, `scheduled`, and `no-show` have been identified as legacy/unused data. They have been completely removed from the frontend mapping (`badgeUtils.js`) to strictly enforce the official flow.

## Official Trial Status Flow

To clean this up and ensure a consistent user experience, the rules for trial statuses are now strictly defined as follows:

1. **Created (Booked / Walk-in)**
   - When a trial is first created (either as a booked appointment or a walk-in), its initial status is **Confirmed**.
   - **Badge Color:** Blue (`confirmed`)

2. **Student Attends**
   - If the student shows up for the trial, the admin manually updates the status to **Attended**.
   - **Badge Color:** Green (`attended`)

3. **Student is Absent**
   - If the student does not show up, the admin updates the status to **Absent**.
   - **Badge Color:** Red (`absent`)

4. **Conversion (Successful Enrollment)**
   - If the student decides to enroll after the trial, the admin marks the trial as successful.
   - The status badge will change from "Attended" (or "Confirmed") to **Successful**.
   - **Badge Color:** Green (`successful`)

5. **Single Badge Display**
   - The UI will only ever show **one status badge** per trial record to avoid confusion (e.g., hiding the "Confirmed" badge when it becomes "Successful").

These rules will be enforced in the UI, particularly in the `badgeUtils.js` and the Trials data table.

## Date & Timezone Recording Rules

To prevent timezone offset bugs (e.g., dates showing up as 7:00 AM of the previous day due to UTC conversion), the following rules are strictly enforced across the system:

1. **Trial Dates:**
   - **Storage:** Saved as local strings shifted to upcoming weekends (`YYYY-MM-DD`).
   - **Rendering:** Must be parsed using `formatDateOnly` to avoid UTC-to-local timezone shifting, and manually concatenated with `trialTime`.

2. **Enrollment Dates (`enrollAt`):**
   - **Storage:** Saved as a full ISO Timestamp (`YYYY-MM-DDTHH:mm:ss.sssZ`) at the exact moment of creation to preserve the exact time the enrollment was created.
   - **Rendering:** Rendered using the standard `formatDate` helper, which naturally shifts the ISO string to the correct local time for the user.

3. **Payment Dates (`paidAt` / `date`):**
   - **Storage:** Saved as a full ISO Timestamp (`YYYY-MM-DDTHH:mm:ss.sssZ`) at the exact moment a payment is processed (whether Cash or Online).
   - **Rendering:** Rendered using the standard `formatDate` helper to show the exact local time the transaction occurred.
