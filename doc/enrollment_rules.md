# Enrollment Rules

## Duplicate Prevention Logic

The AAA Online Enrollment System implements strict front-end validation to prevent duplicate or conflicting enrollments for a given student. This logic is enforced within the enrollment creation and modification flow (`EnrollmentActionModal.vue` and `dropdownUtils.js`).

### 1. Program Duplication Preventative Rules
A student cannot be enrolled in the exact same program more than once simultaneously.
- **Rule**: If a student has an active enrollment (`paid`, `unpaid`, `active`, `confirmed`, `success`) for Program A, Program A will be hidden from the available program selection list for any new enrollments.
- **Implementation**: This is handled via the `filterEnrolledPrograms` utility function.

### 2. Schedule Conflict Prevention (Cross-Program)
Even if a student selects a completely different program, they cannot enroll in an offering that clashes with their existing schedule.
- **Rule**: If a student is actively enrolled in any class that meets on a specific schedule (e.g., `Saturday-09:00 AM`), the system will automatically filter out and hide any offerings across all programs that meet on the exact same `Day` and `Time`.
- **Exception**: This check applies across the same or different branches. A student cannot be in two places at once.
- **Implementation**: The logic dynamically maps all the student's active schedules (retrieved from their existing enrollments and active terms) into a set. Then, it compares this set against the available offerings when filtering them down in the `availableOfferings` computed property. Any offering whose schedule combination (`day-time`) is found within the student's active schedules set is excluded.
