# Project Bug & Error Analysis Checklist - Part 5 (Hidden Bugs & Code Quality)

Deep audit of logic errors, impractical styling, and unnecessary code blocks across the entire project.

## 🔴 High Priority (Wrong Logic / Wrong Data Rendering)

- [x] **Classes.vue: `isOngoing` uses undefined `dayName` variable** (Fixed: Added dayNames array lookup)
- [x] **Classes.vue: `calculateClassProgress` called 3 times per row** (Fixed: Cached as `_progress` during fetch)
- [x] **Dashboard.vue: `stats.value.totals.revenue` key mismatch** (Fixed: Aligned to `totalRevenue`)
- [x] **Dashboard.vue: Enrollment data uses raw response without handling `{ data }` format** (Fixed: Added `rData?.data` fallback)
- [x] **Payments.vue: Amount column always green even for unpaid** (Fixed: Conditional emerald/amber styling)
- [x] **Students.vue: Dead code mutating computed store property** (Fixed: Removed mutation, relies on fetchStudents)

## 🟡 Medium Priority (Impractical Colors / Labels / Styles)

- [x] **All Metric Cards: Same color everywhere** (Fixed: Contextual colors — green/yellow/red/purple per status)
- [x] **Trials.vue: Uses native `confirm()` for delete** (Fixed: Replaced with styled AppConfirmOverlay)
- [x] **AppBadge.vue: Unused `getStatusUI` import** (Fixed: Removed import, simplified displayLabel)
- [x] **Dashboard.vue: Duplicate `formatDateOnly` import** (Fixed: Merged into single import)

## 🟢 Low Priority (Unnecessary Code / Dead Code)

- [x] **Classes.vue: Empty `getRowClass` function** (Fixed: Simplified to arrow function)
- [x] **Enrollments.vue: `storageService` import** (Verified: Actually used on line 321 — NOT dead)
- [x] **Students.vue: Unused `programService`, `termService`, `enrollmentService` imports** (Fixed: Removed dead imports, kept `formatDate` and `getProgramProfileURL`)
- [x] **error_buggy_3.md: Duplicate "Ongoing Error Logs" section** (Fixed: Removed duplicate)
