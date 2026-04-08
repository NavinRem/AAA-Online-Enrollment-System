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
    'ph',
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
    'idle',
  ],
  magenta: ['unmarked', 'archived', 'full', 'parent', 'ocic', 'high-revenue'],
  blue: [
    'graduated',
    'late',
    'good',
    'fair',
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
    'aeon',
    'high-students',
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
    'cm',
    'chip mong',
  ],
  red: [
    'canceled',
    'cancelled',
    'failed',
    'stopped',
    'absent',
    'serious',
    'closed',
    'fm',
    'funmall',
  ],
}

const THEMES = {
  green: { backgroundColor: 'var(--success-soft)', color: 'var(--success-color)' },
  yellow: { backgroundColor: 'var(--warning-soft)', color: 'var(--warning-color)' },
  orange: { backgroundColor: 'var(--orange-soft)', color: 'var(--orange-color)' }, 
  red: { backgroundColor: 'var(--error-soft)', color: 'var(--error-color)' },
  blue: { backgroundColor: 'var(--primary-soft)', color: 'var(--primary-color)' },
  purple: { backgroundColor: 'var(--purple-soft)', color: 'var(--purple-color)' },
  magenta: { backgroundColor: 'var(--magenta-soft)', color: 'var(--magenta-color)' },
  teal: { backgroundColor: 'var(--teal-soft)', color: 'var(--teal-color)' },
  gray: { backgroundColor: 'var(--gray-soft)', color: 'var(--gray-color)' },
}

const THEME_FILTERS = {
  green: 'invert(34%) sepia(35%) saturate(1005%) hue-rotate(85deg) brightness(97%) contrast(85%)',
  yellow: 'invert(53%) sepia(99%) saturate(718%) hue-rotate(5deg) brightness(96%) contrast(102%)',
  orange: 'invert(35%) sepia(87%) saturate(2470%) hue-rotate(15deg) brightness(95%) contrast(105%)',
  red: 'invert(19%) sepia(91%) saturate(3015%) hue-rotate(352deg) brightness(85%) contrast(101%)',
  blue: 'invert(18%) sepia(93%) saturate(3147%) hue-rotate(211deg) brightness(91%) contrast(101%)',
  purple:
    'invert(14%) sepia(91%) saturate(4174%) hue-rotate(274deg) brightness(88%) contrast(101%)',
  magenta:
    'invert(12%) sepia(97%) saturate(5451%) hue-rotate(328deg) brightness(86%) contrast(101%)',
  teal: 'invert(34%) sepia(21%) saturate(3014%) hue-rotate(136deg) brightness(92%) contrast(93%)',
  gray: 'invert(41%) sepia(4%) saturate(546%) hue-rotate(173deg) brightness(94%) contrast(91%)',
}

export { THEMES }

export const getStatusCategory = (status) => {
  if (!status) return 'gray'

  if (isPriceValue(status)) return 'teal'

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

  if (lower === 'active') return 'Active'
  if (lower === 'inactive') return 'Inactive'

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

export const getStatusFilter = (s) => {
  const category = getStatusCategory(s)
  return THEME_FILTERS[category] || 'none'
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
