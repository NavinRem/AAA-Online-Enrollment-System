import { formatPrice } from './formatUtils'

export const isPriceValue = (val) => {
  if (val === null || val === undefined || val === '') return false
  const s = String(val).trim()
  return /^[฿$€£¥₩]?\s?\d+([,.]\d+)*$/.test(s) || /^\d+([,.]\d+)*\s?[฿$€£¥₩]?$/.test(s)
}

export const getPriceBadge = (val, symbol = '$') => ({
  label: formatPrice(val, symbol),
  category: 'teal',
})

export { formatPrice }

// 1. Core Pattern Lookups
export const isPaid = (s) =>
  ['paid', 'confirmed', 'active', 'success'].includes(String(s || '').toLowerCase())
export const isCancelled = (s) => ['canceled', 'cancelled'].includes(String(s || '').toLowerCase())
export const isUnpaid = (s) => {
  const l = String(s || '').toLowerCase()
  return l === 'unpaid' || l === 'pending'
}
export const isPending = (s) => String(s || '').toLowerCase() === 'pending'

// 2. CSS-driven Theme Mapping (Lookup driven)
const STATUS_CATEGORIES = {
  green: [
    'paid',
    'confirmed',
    'active',
    'success',
    'on-time',
    'present',
    'excellent',
    'studying',
    'start',
    'cash',
  ],
  yellow: [
    'unpaid',
    'pending',
    'deactivated',
    'suspended',
    'warning',
    'permission',
    'inactive',
    'upcoming',
    'scheduled',
    'wing',
  ],
  red: ['canceled', 'cancelled', 'failed', 'stopped', 'absent', 'serious', 'closed'],
  blue: [
    'graduated',
    'late',
    'good',
    'fair',
    'guardian',
    'updated at',
    'prorated',
    'discount',
    'end',
    'online',
    'transfer',
    'aba',
    'acleda',
    'sathapana',
    'sky',
  ],
  purple: [
    'make-up',
    'makeup',
    'trial',
    'intermediate',
    'children',
    'in progress',
    'sponsorship',
    'partial',
  ],
  magenta: ['unmarked', 'archived', 'full', 'parent'],
}

const THEMES = {
  green: { backgroundColor: '#e6f8ea', color: '#2e7d32' },
  yellow: { backgroundColor: '#fff8e1', color: '#c49000' },
  orange: { backgroundColor: '#fff3e0', color: '#e65100' },
  red: { backgroundColor: '#ffebee', color: '#c62828' },
  blue: { backgroundColor: '#e3f2fd', color: '#0d47a1' },
  purple: { backgroundColor: '#f3e5f5', color: '#6a1b9a' },
  magenta: { backgroundColor: '#fce4ec', color: '#c2185b' },
  teal: { backgroundColor: '#ccfbf1', color: '#0f766e' },
  gray: { backgroundColor: '#f1f3f4', color: '#5f6368' },
}

export { THEMES }

export const getStatusCategory = (status) => {
  if (!status) return 'gray'

  if (isPriceValue(status)) return 'blue'

  const s = String(status).toLowerCase().trim().split(':')[0]
  for (const [color, matches] of Object.entries(STATUS_CATEGORIES)) {
    if (matches.includes(s)) return color
  }
  return 'gray'
}

export const getStatusDisplay = (s) => {
  if (!s) return 'N/A'
  const clean = s.includes(':') ? s.split(':')[1].trim() : s
  const lower = clean.toLowerCase()
  if (isPaid(lower)) return 'Paid'
  if (isCancelled(lower)) return 'Cancelled'
  if (isPending(lower)) return 'Pending'
  if (isUnpaid(lower)) return 'Unpaid'
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export const getStatusTheme = (s, overrideCategory = null) => {
  const category = overrideCategory || getStatusCategory(s)
  return THEMES[category] || THEMES.gray
}

// 3. Entity-specific Logic
export const isEnrollmentActive = (r) => {
  if (!r || isCancelled(r.status || r.paymentStatus) || !isPaid(r.status || r.paymentStatus))
    return false
  return !r.endDate || new Date(r.endDate) >= new Date()
}

export const calculateStudentStatus = (student, regs = []) => {
  if (['Suspended', 'Stopped'].includes(student.status)) return student.status
  const sid = String(student.id || student.uid || '')
  const sRegs = regs.filter((r) => String(r.studentId || '') === sid)
  if (!sRegs.length) return 'Inactive'

  if (sRegs.some(isEnrollmentActive)) return 'Studying'
  if (sRegs.some((r) => isPaid(r.status || r.paymentStatus))) return 'Graduated'
  if (sRegs.some((r) => isCancelled(r.status || r.paymentStatus))) return 'Stopped'
  return 'Inactive'
}

export const getEnrollmentDisplayStatus = (r) => {
  if (!r) return 'Unpaid'
  const s = (r.status || '').toLowerCase()
  const p = (r.paymentStatus || '').toLowerCase()
  if (['cancelled', 'canceled'].includes(s)) return 'Cancelled'
  if (
    ['paid', 'confirmed', 'active', 'success', 'graduated'].includes(p) ||
    ['active', 'confirmed', 'graduated'].includes(s)
  )
    return 'Paid'
  return 'Unpaid'
}

export const getEnrollmentDisplayMode = (r) => {
  if (!r) return 'Full'
  const mode = r.enrollmentType || 'Full'
  return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase()
}
