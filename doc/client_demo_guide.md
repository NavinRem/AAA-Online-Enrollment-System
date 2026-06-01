# Client Demo Guide: AAA Online Enrollment System

This guide outlines how to demonstrate the complete functionality of the application to the client, proving that all core modules (Programs, Classes, Parents, Students, Enrollments, Trials) support full CRUD operations and render data accurately.

## 1. Automated Test Proof

Before walking through the UI, you can assure the client of the system's stability by running our automated test suites.

### Backend Data Integrity Tests
We have built comprehensive Mocha test suites that run directly against a real Firestore Emulator database to guarantee that data flows perfectly from creation to update to deletion.

**To demo this:**
1. Open a terminal in the `backend/` folder.
2. Run `npm test`.
3. Show the client the passing test output, specifically highlighting:
   - Trial Creation & Duplicate Prevention
   - Enrollment Processing & Payment Verification
   - Attendance History Tracking (ensuring attendance records are permanently audited).

### Frontend UI End-to-End Tests
We use Playwright to simulate a real user clicking through the browser to ensure data renders correctly in the UI.

**To demo this:**
1. Open a terminal in the `frontend/` folder.
2. Run `npm run test:e2e`.
3. After the tests finish, run `npx playwright show-report` to open a beautiful HTML report showing the successful browser interactions.

---

## 2. Manual UI Demo Script

Follow this step-by-step script during the live client presentation to show off the core business flow: **Trial → Enroll → Pay → Attendance**.

### Step 1: Trial Booking & Branch Sorting
1. Navigate to the **Trials** page from the sidebar.
2. Point out the **Branch** column and use the filter/search at the top to sort or filter the records by a specific branch (e.g., "North Branch").
3. Click **New Trial**.
4. Fill out the form, ensuring you select a date that falls within the **Active Term**.
5. Submit the form and show how the new trial immediately appears in the list with a single, clear Status badge (e.g., "Booked").

### Step 2: Student Enrollment
1. Navigate to the **Enrollments** page.
2. Click **New Enrollment**.
3. Select a parent, student, and a class that has open capacity.
4. Submit the enrollment. Point out that the status is initially `Pending` or `Unpaid` because the transaction hasn't settled.

### Step 3: Payment Processing
1. Navigate to the **Payments** page.
2. Locate the outstanding payment for the enrollment you just created.
3. Mark the payment as **Paid**.
4. *(Optional)* Jump back to the Enrollments page to show the badge has automatically updated to `Paid` in real-time.

### Step 4: Class Attendance
1. Navigate to the **Classes** page and click on the class you enrolled the student in.
2. Scroll down to the **Student Attendance** table.
3. Show the client that the newly paid student has seamlessly appeared in the roster!
4. Click on a session cell for that student to mark their attendance (e.g., Present, Absent). 
5. Point out that if you click a future date, an elegant red error banner appears above the table preventing premature attendance marking, instead of a disruptive browser alert.

---

**Summary:** This flow demonstrates that the system robustly handles relational data across multiple collections (Users → Trials → Enrollments → Payments → Classes → Attendance) without dropping or misaligning any records.
