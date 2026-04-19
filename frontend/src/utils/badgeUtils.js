const REGISTRIES = {
  finance: {
    paid: 'green',
    confirmed: 'green',
    success: 'green',
    unpaid: 'yellow',
    pending: 'yellow',
    partial: 'purple',
    failed: 'red',
    cancelled: 'red',
    canceled: 'red',
    refunded: 'orange',
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
    studying: 'green',
    graduated: 'blue',
    suspended: 'yellow',
    stopped: 'red',
    trial: 'purple',
    intermediate: 'purple',
    'in progress': 'purple',
  },
  account: {
    active: 'green',
    inactive: 'yellow',
    archived: 'magenta',
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
    private: 'magenta',
    'registered-today': 'magenta',
    new: 'green',
    full: 'red',
  },
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

const resolveColor = (value, module = null) => {
  if (!value) return 'gray'
  const key = String(value).toLowerCase().trim()
  if (module) return REGISTRIES[module]?.[key] ?? 'gray'
  for (const group of Object.values(REGISTRIES)) {
    if (group[key]) return group[key]
  }
  return 'gray'
}

const getBadgeUI = (value, module = null) => ({
  color: resolveColor(value, module),
  theme: THEMES[resolveColor(value, module)] ?? THEMES.gray,
  filter: THEME_FILTERS[resolveColor(value, module)] ?? 'none',
})
const getBadgeTheme = (value, module = null) => getBadgeUI(value, module).theme
const getBadgeFilter = (value, module = null) => getBadgeUI(value, module).filter

// Aliases for compatibility
export const getStatusUI = getBadgeUI
export const getStatusTheme = getBadgeTheme
export const getStatusFilter = getBadgeFilter
