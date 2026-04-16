# Standardized Academic Data Schema

This document defines the **Source of Truth** for the enrollment system's data architecture. It aligns perfectly with the backend service logic (`ProfileHelper`, `ClassService`, `EnrollmentService`) to ensure data integrity and zero redundancy.

## 1. Branch (`branches`)
Each branch represents a physical location or studio.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | **Manual ID** (e.g., `FM`, `HQ`). Must match `abbr`. |
| `name` | `string` | Human-readable name (e.g., "Funmall Studio"). |
| `abbr` | `string` | Unique abbreviation (e.g., `FM`). |
| `location` | `string` | Physical address or city. |
| `studentCount`| `number` | Count of unique students enrolled (calculated). |
| `createdAt` | `string` | ISO timestamp. |

## 2. Term (`terms`)
Defines academic periods (e.g., "Term 2 2026").

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Unique name (e.g., "Term 2 2026"). |
| `startDate` | `string` | ISO Date (Start of the term). |
| `endDate` | `string` | ISO Date (End of the term). |

## 3. Program (`programs`)
The "Model" or catalog entry for a course.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Primary identifier (e.g., "Ballet Lvl 1"). |
| `categoryId` | `string` | ID of the Category document. |
| `category` | `string` | **Snapshot** of the category name. |
| `levelId` | `string` | ID of the Level document. |
| `level` | `string` | **Snapshot** of the level name. |
| `basePrice` | `number` | Default price for the full term. |
| `sessionNumber`| `number` | Total number of sessions in the program. |
| `type` | `string` | `group` or `private`. |

## 4. Class (`classes`)
An operational instance of a Program at a specific Branch and Term.

| Field | Type | Snapshot Included? |
| :--- | :--- | :--- |
| `programId` | `string` | Yes (`program` object) |
| `termId` | `string` | Yes (`term` object) |
| `branchId` | `string` | Yes (`branch` object) |
| `day` | `string` | Day of the week (e.g., `Monday`). |
| `timeslot` | `string` | Time range (e.g., `09:00 - 10:30`). |
| `numStudent` | `number` | Current occupancy (defaults to 0). |

## 5. Student & Parent Relationship
Ensures students are always linked to their primary guardian.

### Parent (`users`)
- `role`: `parent`
- `name`, `email`, `phone`, `status`

### Student (`students`)
- `parentId`: Link to parent.
- `parentInfo`: **Snapshot** `{ id, name, profileURL }`.

## 6. Enrollment (`enrollments`)
The final piece linking a Student to a Class.

| Field | Description |
| :--- | :--- |
| `studentId`/`parentId` | Raw ID links. |
| `programId`/`classId` | Raw ID links. |
| `parent`/`student` | **Full Snapshots** for fallback-free rendering. |
| `program`/`class` | **Full Snapshots** (including schedule and branch metadata). |
| `amount`/`status` | Financial and academic state. |

---

> [!IMPORTANT]
> **Snapshots at Creation**: All classes and enrollments MUST capture snapshots at the time of creation. This allows the UI to render historical records instantly even if the source program or branch is modified or deleted.
