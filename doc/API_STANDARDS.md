# AAA Academy API Standards

This document outlines the architectural standards and security policies for the AAA Academy Online Enrollment System backend.

## 1. Directory Structure

The backend follows a modular, layer-based architecture (located in `backend/src/`):

- `routes/`: API endpoint definitions and middleware application.
- `controllers/`: Request/Response handling and orchestration.
- `services/`: Core business logic and database interactions.
- `middleware/`: Security and validation filters.
- `utils/`: Reusable helper functions (Profile snapshots, date formatting).

## 2. The "Gold Standard" CRUD Pattern

To maintain consistency, all Controllers and Services MUST follow this exact method sequence:

1.  **Create**: `POST /` - `create[Entity]`
2.  **Read All**: `GET /` - `getAll[Entities]`
3.  **Read ID**: `GET /:id` - `get[Entity]`
4.  **Update**: `PATCH /:id` - `update[Entity]`
5.  **Delete**: `DELETE /:id` - `delete[Entity]`

Specialized utilities (e.g., `cancel`, `duplicate`, `sync`) must be grouped at the bottom of the file under a `// --- Specialized Actions ---` header.

## 3. Response Standards

- **Success (Creation)**: `201 Created`
- **Success (Standard)**: `200 OK`
- **Validation Error**: `400 Bad Request`
- **Authentication Error**: `401 Unauthorized`
- **Authorization Error**: `403 Forbidden`
- **Resource Not Found**: `404 Not Found`

## 4. Security Policies

### Authentication

All requests (except public registration) require a valid Firebase ID Token passed via the `Authorization: Bearer <token>` header.

### Authorization Roles

- **Admin**: Full read/write access to all collections.
- **Teacher**: Access to assigned class data and student attendance.
- **Parent**: Access to their own profile and their children's student/enrollment data.

### Privacy Enforcement

- **UID-based Protection**: User profiles are protected by `isOwnerOrAdmin`, matching the `req.user.uid` against the route parameter.
- **Relationship-based Protection**: Student and Enrollment data are protected by verifying the `parentId` link within the document against the requesting user's UID.

## 5. Data Integrity & Mirroring

The system uses **Database Snapshots** (via `ProfileHelper.js`) to store redundant data for performance.

- When an entity (e.g., Parent or Student) is updated, the service MUST trigger a `sync` operation to update all mirrored snapshots in related collections (e.g., Enrollments).
- When an entity is deleted, the service MUST trigger a `deleteAccount` call to the `AuthService` to clean up the Firebase Authentication record.
