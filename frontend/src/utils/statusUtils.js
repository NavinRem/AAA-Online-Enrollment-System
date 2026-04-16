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
    'created at',
    'parent paid',
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
  magenta: ['unmarked', 'archived', 'full', 'parent', 'ocic', 'high-revenue', 'private'],
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
    'registered-today',
    'filter',
    'group',
    'student',
    'sponsored',
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
    'paid-today',
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
  green: 'invert(55%) sepia(86%) saturate(382%) hue-rotate(113deg) brightness(95%) contrast(89%)',
  yellow: 'invert(61%) sepia(95%) saturate(1633%) hue-rotate(1deg) brightness(101%) contrast(93%)',
  orange: 'invert(24%) sepia(99%) saturate(3736%) hue-rotate(16deg) brightness(94%) contrast(101%)',
  red: 'invert(39%) sepia(81%) saturate(2314%) hue-rotate(336deg) brightness(95%) contrast(97%)',
  blue: 'invert(51%) sepia(87%) saturate(2371%) hue-rotate(167deg) brightness(101%) contrast(105%)',
  purple:
    'invert(16%) sepia(94%) saturate(3848%) hue-rotate(282deg) brightness(79%) contrast(110%)',
  magenta:
    'invert(18%) sepia(61%) saturate(6015%) hue-rotate(323deg) brightness(85%) contrast(106%)',
  teal: 'invert(24%) sepia(87%) saturate(638%) hue-rotate(130deg) brightness(96%) contrast(93%)',
  gray: 'invert(38%) sepia(10%) saturate(394%) hue-rotate(170deg) brightness(94%) contrast(89%)',
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

export const getStatusDisplay = (val) => {
  if (val === undefined || val === null || val === '') return 'N/A'
  const s = String(val)

  const themeKeys = Object.keys(THEMES)
  const parts = s.includes(':') ? s.split(':') : [s]
  const prefix = parts[0].toLowerCase().trim()

  const clean = themeKeys.includes(prefix) ? parts.slice(1).join(':').trim() : s
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
  const s = (student.status || '').toLowerCase().trim()
  if (student.archived || s === 'stopped') return 'Stopped'
  if (s === 'suspended') return 'Suspended'
  if (s === 'graduated') return 'Graduated'

  const sid = String(student.id || student.uid || '')
  const sRegs = regs.filter((r) => String(r.studentId || '') === sid)

  if (sRegs.length > 0) return 'Studying'
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
