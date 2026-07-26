/**
 * @fileoverview Re-export module for backward compatibility.
 *
 * This file allows components to import from either:
 *   - `@/services/parentAuthService`  (auth-focused imports)
 *   - `@/services/parentService`      (direct import)
 *
 * Both `parentAuthService` (login, register, logout) and `parentPortalService`
 * (API calls for enrollments, attendance, performance, etc.) are defined in
 * `parentService.js`. This re-export keeps import paths clean and consistent.
 */
export { parentAuthService, parentPortalService } from './parentService'
