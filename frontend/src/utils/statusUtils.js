/**
 * Unified Status Utilities (Checks, Themes, Logic)
 */

// 1. Core Pattern Lookups
export const isPaid = (s) => ['paid', 'confirmed', 'active', 'success'].includes(String(s || '').toLowerCase())
export const isCancelled = (s) => ['canceled', 'cancelled'].includes(String(s || '').toLowerCase())
export const isUnpaid = (s) => { const l = String(s || '').toLowerCase(); return l === 'unpaid' || l === 'pending' }
export const isPending = (s) => String(s || '').toLowerCase() === 'pending'

// 2. CSS-driven Theme Mapping (Lookup driven)
const STATUS_CATEGORIES = {
  green: ['paid', 'confirmed', 'active', 'success', 'on-time', 'present', 'excellent', 'studying', 'start', 'cash'],
  yellow: ['unpaid', 'pending', 'deactivated', 'suspended', 'warning', 'permission', 'inactive', 'upcoming', 'scheduled', 'wing'],
  red: ['canceled', 'cancelled', 'failed', 'stopped', 'absent', 'serious', 'closed'],
  blue: ['graduated', 'late', 'good', 'fair', 'guardian', 'updated at', 'prorated', 'discount', 'end', 'online', 'transfer', 'aba', 'acleda', 'sathapana', 'sky'],
  purple: ['make-up', 'makeup', 'trial', 'intermediate', 'children', 'in progress', 'sponsorship', 'partial'],
  magenta: ['unmarked', 'archived', 'full', 'parent'],
}

const THEMES = {
  green: { backgroundColor: '#10b981', color: '#ecfdf5' },
  yellow: { backgroundColor: '#e2c106ff', color: '#fff7ed' },
  orange: { backgroundColor: '#f97316', color: '#fff7ed' },
  red: { backgroundColor: '#ef4444', color: '#fef2f2' },
  blue: { backgroundColor: '#3b82f6', color: '#eff6ff' },
  purple: { backgroundColor: '#8b5cf6', color: '#f5f3ff' },
  magenta: { backgroundColor: '#ec4899', color: '#fdf2f8' },
}

export const getStatusCategory = (status) => {
  if (!status) return 'gray'
  const s = String(status).toLowerCase().trim().split(':')[0] // Dynamic prefix support
  for (const [color, matches] of Object.entries(STATUS_CATEGORIES)) {
    if (matches.includes(s)) return color
  }
  return 'gray'
}

export const getStatusDisplay = (s) => {
  if (!s) return 'N/A'
  const clean = s.includes(':') ? s.split(':')[1].trim() : s
  const lower = clean.toLowerCase();
  if (isPaid(lower)) return 'Paid'
  if (isCancelled(lower)) return 'Cancelled'
  if (isPending(lower)) return 'Pending'
  if (isUnpaid(lower)) return 'Unpaid'
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export const getStatusTheme = (s) => THEMES[getStatusCategory(s)] || { backgroundColor: '#f8fafc', color: '#475569' }

// 3. Entity-specific Logic
export const isEnrollmentActive = (r) => {
  if (!r || isCancelled(r.status || r.paymentStatus) || !isPaid(r.status || r.paymentStatus)) return false
  return !r.endDate || new Date(r.endDate) >= new Date()
}

export const calculateStudentStatus = (student, regs = []) => {
  if (['Suspended', 'Stopped'].includes(student.status)) return student.status
  const sid = String(student.id || student.uid || '')
  const sRegs = regs.filter(r => String(r.studentId || '') === sid)
  if (!sRegs.length) return 'Inactive'
  
  if (sRegs.some(isEnrollmentActive)) return 'Studying'
  if (sRegs.some(r => isPaid(r.status || r.paymentStatus))) return 'Graduated'
  if (sRegs.some(r => isCancelled(r.status || r.paymentStatus))) return 'Stopped'
  return 'Inactive'
}
