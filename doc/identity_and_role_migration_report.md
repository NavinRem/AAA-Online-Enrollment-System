# Identity Refactor & Atomic Role Migration Report
**Date:** April 03, 2026
**Architecture:** Role-Separated Collections (Option B)

## 🎯 Today's Achievements

We successfully completed a major structural refactor of the Enrollment System's identity architecture. This work moves the system from a redundant "split-identity" model to a consolidated, professional database structure.

---

## 🏗️ 1. Identity Consolidation (The "Purge")

### The Legacy Problem:
Previously, user data was duplicated across a central `/users/` collection and role-specific collections (like `/parents/`). This caused:
-   **Data De-sync**: Updating a parent's email in one collection left the other record outdated.
-   **Messy Schema**: The code had to check multiple fallback fields (e.g., `fullName` OR `username` OR `name`).

### The Solution:
We implemented **Option B (Role-Separated Collections)**:
1.  **Strict Isolation**: Every user belongs to **exactly one** collection (`parents`, `guardians`, `teachers`, or `admins`).
2.  **Schema Standardization**: We enforced a single standard for naming and profile assets across the entire codebase:
    -   `name`: The user's full name.
    -   `profile`: The URL to their profile image.
3.  **The Purge**: After migrating and verifying all data, we permanently deleted the legacy `users` collection.

---

## 🛡️ 2. Atomic Role Migration (The "Safe Switch")

To allow you to safely switch roles (e.g., Parent <-> Guardian) in the dashboard without breaking the database, we implemented **Atomic Migration** logic.

### Why it's Safe:
Changing a role is no longer just a text field update; it is a **physical "Move" Operation**:
1.  **Atomic Move**: When a role changes, the backend copies the user's document to the new collection and deletes it from the old one in a single atomic transaction.
2.  **Sub-collection Migration**: Crucially, any **Student records** belonging to that parent are also moved to their new parent collection.
3.  **No Orphans**: This ensures that children never "disappear" from a parent's dashboard during a role switch.
4.  **Token Sync**: Your **Firebase Custom Claims** (security credentials) are automatically updated to match the new role instantly.

---

## 🛠️ 3. Security Hardening Summary

-   **[x] API Auth Middleware**: Every backend call now verifies the user's **Firebase ID Token**.
-   **[x] Rate Limiting**: Integrated `express-rate-limit` to protect your login and registration endpoints from brute-force attacks.
-   **[x] Frontend Token Injection**: Your frontend `api.js` now automatically injects the security token into every request.
-   **[x] Admin Secure Bootstrap**: Created a dedicated `create-admin.js` tool to initialize your first administrative user safely.

## 🏁 Outcome
Your Enrollment System now has a **professional-grade security foundation** and a clean, unambiguous data architecture that is perfectly prepared for both Web and Mobile expansions.
