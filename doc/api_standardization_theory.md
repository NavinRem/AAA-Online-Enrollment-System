# API Design Theory: PATCH vs PUT for Partial Updates

In modern web development, especially when working with Document Databases like Firestore, choosing the right HTTP method is crucial for data integrity and performance.

## 1. The Core Difference
- **PUT**: Replaces the **entire** resource. If you only send 3 fields of a 10-field object, the other 7 fields will be deleted or set to null.
- **PATCH**: Applies a **partial update**. Only the fields sent in the request body are modified; the others remain untouched.

## 2. Why we standardized on PATCH
In our Enrollment System, many updates are partial by nature:
- Changing only the `status` of a program.
- Updating a student's `medicalNote` without affecting their enrollment history.
- Modifying a program `price` without resetting the schedule.

Standardizing on `PATCH` ensures that we don't accidentally wipe out data that wasn't included in a specific edit form.

## 3. Implementation Details
- **Frontend**: Services now use `method: 'PATCH'` for all update operations.
- **Backend (Express)**: Routes are registered using `router.patch('/:id', ...)` to match.
- **Service Layer (Firestore)**: We use `ref.update(data)` which natively supports the "patch" behavior by merging the new fields into the existing document.

## 4. Troubleshooting
If an update returns a **404**, it often means the Method (PATCH) sent by the frontend is not yet registered in the backend routes. Always ensure the HTTP Method in the `Service` matches the `Route` definition.
