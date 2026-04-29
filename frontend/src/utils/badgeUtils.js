const COMMON_STATUSES = {
  active: 'green',
  upcoming: 'blue',
  archived: 'magenta',
  inactive: 'yellow',
  failed: 'red',
  success: 'green',
}

const REGISTRIES = {
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
    cash: 'green',
    aba: 'blue',
    acleda: 'blue',
    sathapana: 'blue',
    wing: 'yellow',
    aeon: 'purple',
  },
  academic: {
    ...COMMON_STATUSES,
    studying: 'green',
    graduated: 'blue',
    suspended: 'yellow',
    stopped: 'red',
    trial: 'purple',
    ongoing: 'green',
    passed: 'green',
    prospect: 'purple',
    intermediate: 'purple',
    'in progress': 'purple',
  },
  account: {
    ...COMMON_STATUSES,
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
  },
  role: {
    admin: 'red',
    teacher: 'purple',
    parent: 'magenta',
    student: 'blue',
  },
  tag: {
    online: 'blue',
    transfer: 'blue',
    'joined-today': 'magenta',
    'paid-today': 'green',
    'trial-today': 'purple',
    new: 'green',
    full: 'magenta',
    all: 'blue',
    group: 'purple',
    private: 'magenta',
    hidden: 'blue',
  },
  trial: {
    booked: 'purple',
    'walk-in': 'magenta',
    successful: 'green',
  },
}

const THEMES = {
  green: { backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)' },
  yellow: { backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning)' },
  orange: { backgroundColor: 'var(--color-orange-soft)', color: 'var(--color-orange)' },
  red: { backgroundColor: 'var(--color-error-soft)', color: 'var(--color-error)' },
  blue: { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' },
  purple: { backgroundColor: 'var(--color-purple-soft)', color: 'var(--color-purple)' },
  magenta: { backgroundColor: 'var(--color-magenta-soft)', color: 'var(--color-magenta)' },
  pink: { backgroundColor: 'var(--color-pink-soft)', color: 'var(--color-pink)' },
  gray: { backgroundColor: 'var(--color-gray-soft)', color: 'var(--color-gray)' },
}

const THEME_FILTERS = {
  green: 'invert(55%) sepia(86%) saturate(382%) hue-rotate(113deg) brightness(95%) contrast(89%)',
  yellow: 'invert(61%) sepia(95%) saturate(1633%) hue-rotate(1deg) brightness(101%) contrast(93%)',
  orange: 'invert(24%) sepia(99%) saturate(3736%) hue-rotate(16deg) brightness(94%) contrast(101%)',
  red: 'invert(39%) sepia(81%) saturate(2314%) hue-rotate(336deg) brightness(95%) contrast(97%)',
  blue: 'invert(51%) sepia(87%) saturate(2371%) hue-rotate(167deg) brightness(101%) contrast(105%)',
  purple: 'invert(16%) sepia(94%) saturate(3848%) hue-rotate(282deg) brightness(79%) contrast(110%)',
  magenta: 'invert(18%) sepia(61%) saturate(6015%) hue-rotate(323deg) brightness(85%) contrast(106%)',
  pink: 'invert(26%) sepia(91%) saturate(3474%) hue-rotate(314deg) brightness(96%) contrast(95%)',
  gray: 'invert(38%) sepia(10%) saturate(394%) hue-rotate(170deg) brightness(94%) contrast(89%)',
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
