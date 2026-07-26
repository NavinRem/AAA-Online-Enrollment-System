import { useStudentStore } from '@/stores/studentStore'

const COMMON_STATUSES = {
  active: 'green',
  'active now': 'green',
  upcoming: 'blue',
  archived: 'magenta',
  inactive: 'red',
  failed: 'red',
  success: 'green',
  transferred: 'blue',
  transfer: 'blue',
  cancelled: 'red',
  canceled: 'red',
}

const REGISTRIES = {
  academic: {
    ...COMMON_STATUSES,
    studying: 'green',
    graduated: 'blue',
    suspended: 'yellow',
    stopped: 'red',
    trial: 'purple',
    ongoing: 'blue',
    passed: 'green',
    prospect: 'purple',
    intermediate: 'purple',
    'in progress': 'purple',
    available: 'green',
    full: 'red',
    completed: 'green',
  },
  finance: {
    ...COMMON_STATUSES,
    paid: 'green',
    confirmed: 'green',
    unpaid: 'yellow',
    pending: 'yellow',
    partial: 'purple',
    cancelled: 'red',
    canceled: 'red',
    refunded: 'orange',
    'parent paid': 'green',
    sponsored: 'blue',
    full: 'magenta',
  },
  payment: {
    cash: 'purple',
    online: 'magenta',
    'bakong khqr': 'magenta',
    aba: 'magenta',
    acleda: 'magenta',
    sathapana: 'magenta',
    aeon: 'purple',
  },
  account: {
    ...COMMON_STATUSES,
    hold: 'orange',
  },
  gender: {
    female: 'pink',
    male: 'blue',
  },
  attendance: {
    present: 'green',
    'on-time': 'green',
    absent: 'red',
    late: 'blue',
    attended: 'green',
  },
  role: {
    admin: 'red',
    teacher: 'purple',
    parent: 'magenta',
    student: 'blue',
  },
  admin: {
    ...COMMON_STATUSES,
  },
  tag: {
    online: 'blue',
    'joined-today': 'magenta',
    'paid-today': 'green',
    'trial-today': 'purple',
    new: 'green',
    full: 'magenta',
    all: 'blue',
    group: 'purple',
    private: 'pink',
    hidden: 'blue',
  },
  trial: {
    booked: 'purple',
    'walk-in': 'magenta',
    successful: 'green',
    confirmed: 'blue',
    attended: 'blue',
    absent: 'red',
  },
  day: {
    monday: 'yellow',
    mon: 'yellow',
    tuesday: 'orange',
    tue: 'orange',
    wednesday: 'green',
    wed: 'green',
    thursday: 'purple',
    thu: 'purple',
    thur: 'purple',
    thurs: 'purple',
    friday: 'magenta',
    fri: 'magenta',
    saturday: 'blue',
    sat: 'blue',
    sunday: 'red',
    sun: 'red',
  },
}

const THEMES = {
  green: { backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success-deep)' },
  yellow: { backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning-deep)' },
  orange: { backgroundColor: 'var(--color-orange-soft)', color: 'var(--color-orange-deep)' },
  red: { backgroundColor: 'var(--color-error-soft)', color: 'var(--color-error-deep)' },
  blue: { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary-deep)' },
  purple: { backgroundColor: 'var(--color-purple-soft)', color: 'var(--color-purple-deep)' },
  magenta: { backgroundColor: 'var(--color-magenta-soft)', color: 'var(--color-magenta-deep)' },
  pink: { backgroundColor: 'var(--color-pink-soft)', color: 'var(--color-pink-deep)' },
  gray: { backgroundColor: 'var(--color-gray-soft)', color: 'var(--color-gray-deep)' },
}

const THEME_FILTERS = {
  green: 'invert(15%) sepia(87%) saturate(1450%) hue-rotate(136deg) brightness(92%) contrast(101%)',
  yellow: 'invert(18%) sepia(91%) saturate(2464%) hue-rotate(24deg) brightness(91%) contrast(101%)',
  orange: 'invert(15%) sepia(99%) saturate(4138%) hue-rotate(10deg) brightness(96%) contrast(112%)',
  red: 'invert(13%) sepia(94%) saturate(5411%) hue-rotate(358deg) brightness(94%) contrast(110%)',
  blue: 'invert(36%) sepia(96%) saturate(1636%) hue-rotate(176deg) brightness(95%) contrast(105%)',
  purple:
    'invert(13%) sepia(77%) saturate(5603%) hue-rotate(272deg) brightness(85%) contrast(106%)',
  magenta:
    'invert(14%) sepia(85%) saturate(3174%) hue-rotate(318deg) brightness(94%) contrast(106%)',
  pink: 'invert(14%) sepia(85%) saturate(3174%) hue-rotate(318deg) brightness(94%) contrast(106%)',
  gray: 'invert(34%) sepia(12%) saturate(1001%) hue-rotate(175deg) brightness(97%) contrast(90%)',
}

export const resolveColor = (value, module = null) => {
  if (module && THEMES[module.toLowerCase()]) return module.toLowerCase()
  if (!value) return 'gray'

  const key = String(value).toLowerCase().trim()

  // Module-specific lookup
  if (module && REGISTRIES[module]) return REGISTRIES[module][key] ?? 'gray'

  // Global lookup across all registries
  for (const group of Object.values(REGISTRIES)) {
    if (group[key]) return group[key]
  }

  return 'gray'
}

export const getStatusUI = (value, module = null) => {
  const color = resolveColor(value, module)
  return {
    color,
    theme: THEMES[color] || THEMES.gray,
    filter: THEME_FILTERS[color] || 'none',
  }
}

export const getStatusTheme = (value, module = null) => getStatusUI(value, module).theme
export const getStatusFilter = (value, module = null) => getStatusUI(value, module).filter

export const resolveBranchBadgeProps = (branchVal, branchesList = null) => {
  if (!branchVal) return null

  let list = branchesList
  if (!list || !Array.isArray(list) || list.length === 0) {
    try {
      list = useStudentStore().branches || []
    } catch {
      // Pinia store not ready or not in active Vue context
    }
  }

  // Determine lookup keys whether branchVal is an object or string/number
  let lookupId = ''
  let lookupName = ''
  let lookupAbbr = ''
  if (typeof branchVal === 'object') {
    lookupId = String(branchVal.id || '')
      .trim()
      .toLowerCase()
    lookupName = String(branchVal.name || branchVal.branchName || '')
      .trim()
      .toLowerCase()
    lookupAbbr = String(branchVal.abbr || branchVal.branchAbbr || '')
      .trim()
      .toLowerCase()
  } else {
    const str = String(branchVal).trim().toLowerCase()
    lookupId = str
    lookupName = str
    lookupAbbr = str
  }

  // Always check studentStore branches first so the actual color from the branch modal is used
  if (Array.isArray(list) && list.length > 0) {
    const match = list.find((b) => {
      const bId = String(b.id || '')
        .trim()
        .toLowerCase()
      const bName = String(b.name || '')
        .trim()
        .toLowerCase()
      const bAbbr = String(b.abbr || '')
        .trim()
        .toLowerCase()
      return (
        (lookupId && bId === lookupId) ||
        (lookupName && (bName === lookupName || bAbbr === lookupName)) ||
        (lookupAbbr && (bAbbr === lookupAbbr || bName === lookupAbbr))
      )
    })
    if (match) {
      return {
        status: match.abbr || match.name,
        type: match.color || match.badgeColor || 'blue',
      }
    }
  }

  // Fallback if branch is not yet in store list
  if (typeof branchVal === 'object') {
    return {
      status:
        branchVal.abbr ||
        branchVal.branchAbbr ||
        branchVal.name ||
        branchVal.branchName ||
        branchVal.id ||
        'Branch',
      type:
        branchVal.color ||
        branchVal.branchColor ||
        branchVal.badgeColor ||
        branchVal.type ||
        'gray',
    }
  }

  return { status: String(branchVal).trim(), type: 'gray' }
}

export const TERM_COLORS = ['blue', 'green', 'purple', 'magenta']

export const getTermColor = (termVal, termsList = null) => {
  if (termVal === null || termVal === undefined) return TERM_COLORS[0]

  if (typeof termVal === 'number') {
    return TERM_COLORS[Math.abs(termVal) % TERM_COLORS.length]
  }

  let list = termsList
  if (!Array.isArray(list)) {
    try {
      list = useStudentStore().terms || []
    } catch {
      list = []
    }
  }

  if (typeof termVal === 'object') {
    if (termVal.color || termVal.termColor || termVal.badgeColor) {
      return termVal.color || termVal.termColor || termVal.badgeColor
    }
    if (Array.isArray(list) && list.length > 0) {
      const matchIdx = list.findIndex(
        (t) => String(t.id) === String(termVal.id) || String(t.name) === String(termVal.name),
      )
      if (matchIdx >= 0) {
        return TERM_COLORS[matchIdx % TERM_COLORS.length]
      }
    }
    const nameStr = String(termVal.name || termVal.termName || '').trim()
    const tNumMatch = nameStr.match(/T(\d+)/i) || nameStr.match(/Term\s*(\d+)/i)
    if (tNumMatch) {
      const idx = parseInt(tNumMatch[1], 10) - 1
      if (idx >= 0) return TERM_COLORS[idx % TERM_COLORS.length]
    }
    return TERM_COLORS[0]
  }

  const strVal = String(termVal).trim()
  if (Array.isArray(list) && list.length > 0) {
    const matchIdx = list.findIndex(
      (t) => String(t.id) === strVal || String(t.name).toLowerCase() === strVal.toLowerCase(),
    )
    if (matchIdx >= 0) {
      return TERM_COLORS[matchIdx % TERM_COLORS.length]
    }
  }

  const tNumMatch = strVal.match(/T(\d+)/i) || strVal.match(/Term\s*(\d+)/i)
  if (tNumMatch) {
    const idx = parseInt(tNumMatch[1], 10) - 1
    if (idx >= 0) return TERM_COLORS[idx % TERM_COLORS.length]
  }

  return TERM_COLORS[0]
}

export const resolveTermBadgeProps = (termVal, termsList = null) => {
  if (!termVal) return null
  const status =
    typeof termVal === 'object'
      ? termVal.name || termVal.termName || String(termVal.id || 'Term')
      : String(termVal).trim()
  const type = getTermColor(termVal, termsList)
  return { status, type }
}
