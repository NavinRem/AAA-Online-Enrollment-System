# Frontend Services Reference

This document provides a detailed breakdown of each file in `src/services/` and the "theory" behind why they exist and how they work.

## Core Infrastructure

### 1. `api.js` (The Communication Hub)
**Role**: The primary gatekeeper for all outgoing network requests to the Cloud Run backend.
*   **Theory**: Instead of using `fetch()` everywhere in the UI, we centralize it here. It automatically handles:
    *   **Base URL**: Prepends the correct API URL from the central config.
    *   **JSON Handling**: Automatically stringifies request bodies and parses JSON responses.
    *   **Error Normalization**: Catches network errors or API error messages and throws a standard error that the UI can display.
    *   **Cache Hook**: Directly talks to `cache.js` to retrieve data or clear it when data changes (e.g., clearing the "students" cache after a new student is saved).

### 2. `cache.js` (The Performance Booster)
**Role**: A lightweight system wrapper around `localStorage` to speed up the app and reduce server costs.
*   **Theory**: "Data that doesn't change often shouldn't be downloaded twice." 
    *   **Time-to-Live (TTL)**: Stores data with a timestamp and expires it after 5 minutes by default.
    *   **Prefix Clearing**: Includes "Smart Clearing" logic. If you edit a student, it can clear every cached item starting with `/students` to ensure the next fetch gets the fresh data.

### 3. `authService.js` (The Security Specialist)
**Role**: A focused wrapper around the Firebase Authentication SDK.
*   **Theory**: Keeps UI components from being "coupled" directly to Firebase. If we ever switched from Firebase to another auth provider, we would only need to change this one file.
    *   **Methods**: Login, Logout, Registration, and Password Reset.
    *   **State Observation**: Provides a clean way to listen for when a user logs in or out.

## Domain Services

### 4. `userService.js` (People & Profiles)
**Role**: Manages data for the "People" in the system—Parents, Students, and Admin Users.
*   **Theory**: Handles the relationship between users.
    *   **Parent-Student Link**: Knows how to fetch students belonging to a specific parent.
    *   **Medical Info**: Specifically handles the sensitive updates to student medical notes.

### 5. `courseService.js` (Academic Catalog)
**Role**: Manages Programs, Sessions, Categories, and Levels.
*   **Theory**: Handles the "What" the school offers. 
    *   **Hierarchical Data**: Manages the multi-level structure of Categories -> Levels -> Courses -> Sessions.
    *   **Uploads**: Includes the logic for uploading program profile images to the backend.

### 6. `enrollmentService.js` (The Business Logic)
**Role**: Manages the lifecycle of a student joining a program.
*   **Theory**: The most critical service for the "Registration" part of the app.
    *   **Lifecycle**: Creation of enrollments, status updates (Paid/Unpaid/Pending), and cancellations with reasons.
    *   **Financials**: Handles updating amount and remark fields for payment tracking.

---

## Summary of Benefits
*   **Dry Code**: Write the fetch/error logic once, use it everywhere.
*   **Zero UI Logic**: Components only handle "What the user sees"; Services handle "Where the data comes from."
*   **Resilience**: Changes in backend URLs or naming only happen in one place.
