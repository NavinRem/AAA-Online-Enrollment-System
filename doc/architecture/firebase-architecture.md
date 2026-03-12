# Firebase Architecture Reference

This document explains the organization and strategy for Firebase configuration within the AAA Online Enrollment System.

## Project Structure

Our Firebase setup follows a "Monorepo" pattern, where infrastructure settings are consolidated at the project root while domain-specific rules live within their respective modules.

### 1. Project Entry Points (Root)
These files sit at the project root and manage the "Handbag" of the entire deployment:

*   **`firebase.json`**: The master configuration. It tells the Firebase CLI where everything is. 
    *   **Hosting**: Points to `frontend/dist`.
    *   **Functions**: Points to `backend/functions`.
    *   **Rules/Indexes**: Points into the `backend/configs/` directory.
*   **.firebaserc**: Stores the Project ID (`aaa-online-registration-e3833`) to ensure we always deploy to the correct Google cloud environment.

### 2. Configuration Subdirectory (`backend/configs/`)
We keep security-critical and database-defining files here instead of the root.

*   **`firestore.rules`**: Defines who can read/write to the database. Keeping this in the backend folder makes it clear it is a data-layer concern.
*   **`firestore.indexes.json`**: Optimizes database queries.
*   **`storage.rules`**: Controls permissions for file uploads to Cloud Storage.

---

## Why this structure?

1.  **Deployment Simplicity**: You can run `firebase deploy` from the root folder to update the entire stack (web app + api functions + security rules) in one go.
2.  **Clean Project Root**: Prevents "Config Bloat" at the top level. We only have entry points at the root, maintaining a professional and clean project home.
3.  **Logical Ownership**: Security rules are backend logic. By keeping them in `backend/configs`, we maintain a clear separation between the "Face" (Frontend) and the "Brain" (Backend) of the system.

---

## Deployment Commands
Run these from the main project folder:

| Command | Action |
| :--- | :--- |
| `firebase login` | Authenticate your terminal |
| `firebase emulators:start` | Test the entire system locally |
| `firebase deploy` | Push all changes to the cloud |
| `firebase deploy --only hosting` | Only update the web app |
