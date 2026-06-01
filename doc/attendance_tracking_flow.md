# Attendance Tracking E2E Flow

This document outlines the lifecycle of a student moving from a Trial to a paid Enrollment, and how their attendance data is structured and saved in the AAA Online Enrollment System.

## 1. Trial Creation
When a student books a trial, the `trials` collection saves a denormalized snapshot of the student, parent, and program information.
- **Collection**: `trials`
- **Purpose**: Retains the exact state of the student/parent profile at the time the trial was booked, protecting historical data from future profile updates.
- **Key Fields**: `studentId`, `parentId`, `programId`, `classId`, `trialDate`, `status: 'scheduled'`

## 2. Enrollment Creation
Once a student decides to officially enroll, an enrollment record is created upon payment.
- **Collection**: `enrollments`
- **Purpose**: Creates a financial and academic link between the student and a specific active term/class. Includes denormalized snapshots for robust reporting.
- **Key Fields**: `termId`, `termOfferingId`, `classId`, `enrollAt`, `status: 'paid'`, `paymentStatus: 'paid'`

## 3. Attendance Recording
With an active, paid enrollment, the student will appear in the web dashboard's Class Detail attendance table. 

**Database Schema (Backend)**
- **Collection**: `attendances`
- **Structure**: Highly scalable, atomic documents for each individual student per session.
- **Document ID format**: `{classId}_{sessionId}_{studentId}`
- **Purpose**: Storing individual documents enables lightning-fast queries for the mobile application (e.g., "Find all absences for Student A in Term 2").
- **Key Fields**:
  ```json
  {
    "studentId": "...",
    "termId": "...",
    "classId": "...",
    "sessionId": "session-1",
    "status": "P",
    "updatedAt": "2026-06-01T06:01:22.456Z"
  }
  ```

## 4. Frontend Rendering & Compatibility
Although the backend utilizes scalable atomic documents for attendance, the `getClassAttendance` API dynamically intercepts this data on read.
- The API restructures the array of individual documents back into the legacy nested map format: `{ "session-1": { "studentId": "P" } }`.
- **Result**: The Vue.js web dashboard (`ClassDetail.vue`) does not require any logic updates to process the data, while mobile applications can consume the scalable atomic records directly from Firestore.
