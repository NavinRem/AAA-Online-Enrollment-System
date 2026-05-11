# Term/Class/Schedule Refactor Plan

## Summary

Create a schedule management module, refactor `classes` into lightweight class products, and make term offerings hold the term-specific branch/schedule/student context used by enrollment.

## Key Changes

- Add `schedules` collection like category/level management:
  - Fields: `day`, `time`, `status`, `createdAt`, `updatedAt`, `isDeleted`.
  - Add backend CRUD: validator, service, controller, route, `COLLECTIONS.SCHEDULE`.
  - Add frontend schedule service, management view/modal, route, and sidebar/settings navigation entry.

- Refactor `classes` into product/catalog records:
  - Save only reusable product identity for enrollment selection: `programId`, `program`, optional `scheduleIds`/`schedules` snapshots, `status`, timestamps, `isDeleted`.
  - Do not save branch, term, capacity, student count, student list, schedule type, or admin note on class documents.
  - Class create/edit selects one or more schedules from the schedule collection, similar to choosing category/level.

- Refactor `terms` into term-specific offerings:
  - Keep term fields: `name`, `branchIds`, `startDate`, `endDate`, `totalSessions`, `status`.
  - Add `offerings`: each offering has stable `offeringId`, `classId`, `program` snapshot, `branchId`/branch snapshot, `scheduleId`/schedule snapshot, and `students`.
  - Add term duplication from a prior term via `duplicateFromTermId`, copying offerings and students into the new term for small edits between terms.
  - Term edit supports changing offering student status without modifying global student/class records.

- Keep enrollment flow mostly the same for users:
  - User still selects student -> program/class -> branch/schedule option.
  - Available options come from active/upcoming term offerings where `offering.classId` or `offering.program.id` matches the selected program/class.
  - Enrollment saves `classId` for compatibility plus `termId`, `termOfferingId`, and copied class/term/branch/schedule snapshots for historical display.
  - Enrollment create/cancel/delete/update syncs the chosen term offering's student list and derived counts.

## UI Behavior

- Class modal:
  - Remove term, branch, capacity, schedule type, admin note, teacher/student roster fields.
  - Add schedule multi-select sourced from `schedules`.
  - Save class as a product with selected schedule references only.

- Enrollment modal:
  - After program/class selection, show available active/upcoming term offerings grouped by branch and schedule.
  - Display branch, term, schedule, and total student count for that class across all branches/offerings.
  - Submit hidden `termId` and `termOfferingId` with the existing enrollment details.

- Term modal/page:
  - Add optional "Duplicate from previous term" selector when creating a term.
  - Show/edit offerings and copied student statuses for the term.

## Checklist

- [ ] Create `doc/term_class_schedule_refactor_plan.md`.
- [ ] Add backend schedule CRUD module and collection constant.
- [ ] Add frontend schedule service, view, modal, route/navigation.
- [ ] Refactor backend class validator/service/controller to product-only data.
- [ ] Refactor frontend class modal/list/detail for product-only class data.
- [ ] Extend backend term validator/service for offerings and prior-term duplication.
- [ ] Update frontend term create/edit UI for duplication and offerings.
- [ ] Update enrollment backend to persist/sync `termId` and `termOfferingId`.
- [ ] Update enrollment frontend option filtering from active/upcoming term offerings.
- [ ] Update search/stat helpers that currently read branch/term/count from class docs.
- [ ] Add/adjust backend tests for schedules, class product save, term duplication, and enrollment offering sync.
- [ ] Run backend tests and frontend build.

## Test Plan

- Create schedules and verify duplicate day/time schedules are blocked or soft-deleted records are ignored.
- Create a class product with multiple selected schedules and verify no branch/count/capacity/students/admin note are saved.
- Create a term from a prior term and verify offerings and students are copied.
- In enrollment, select a program/class and verify only active/upcoming term offerings appear with branch and schedule.
- Create/cancel/delete enrollment and verify term offering students/counts update while class product remains unchanged.
- Run `npm --workspace backend test`.
- Run `npm --workspace frontend run build`.

## Assumptions

- A class document is a product/catalog item, not an operational class section.
- Branch belongs to term offerings, not class documents.
- Schedule options are managed globally in a new `schedules` collection.
- Enrollment will save `termOfferingId` internally so branch/schedule/term history is stable.
- Existing uncommitted class-related work will be preserved and adapted, not reverted.
