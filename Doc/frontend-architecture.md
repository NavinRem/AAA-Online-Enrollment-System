# Frontend Architecture Reference

This document explains the core foundation files of the AAA Online Enrollment System frontend.

## 1. `src/main.js` (The Entry Point)
This is the starting point of the entire application. When the browser loads the project, this is the first file it executes.

*   **App Initialization**: Creates the Vue instance and mounts it to the DOM (`#app` in `index.html`).
*   **Plugin Management**: Integrates **Vue Router** (navigation) and **Pinia** (state management).
*   **Global Styling**: Imports the primary CSS files (`main.css` and `responsive.css`).
*   **Authentication Guard**: Specifically configured to wait for the Firebase Auth state to resolve before initializing the app. This ensures the user is correctly identified (logged in or out) before the UI is rendered, preventing unauthorized access "flickers."

## 2. `src/firebase.js` (The Firebase Bridge)
This file serves as the central hub for connecting your frontend to Google Firebase services.

*   **Central Configuration**: Contains the API keys and Project IDs required to authenticate your specific Firebase project.
*   **Service Exports**: Initializes and exports the core Firebase modules used throughout the project:
    *   `auth`: Handles user login, logout, and token management.
    *   `firestore`: Connects to the NoSQL database for students, enrollments, and user data.
    *   `storage`: Manages cloud file uploads for any images or documents.
*   **Reusability**: By centralizing the connection logic here, all other service files (e.g., `authService.js`, `enrollmentService.js`) can easily import a single, ready-at-hand Firebase instance without redundant setup.

---

### Summary Table

| File | Primary Role | Analogy | 
| :--- | :--- | :--- |
| `main.js` | Starts the Vue application engine | The Ignition System |
| `firebase.js` | Connects the app to Google's data services | The Fuel Line |
