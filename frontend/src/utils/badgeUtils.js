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
    'parent paid': 'green',
    sponsored: 'blue',
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
    'joined-today': 'magenta',
    'paid-today': 'green',
    'trial-today': 'purple',
    new: 'green',
    full: 'magenta',
    all: 'blue',
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
  teal: { backgroundColor: 'var(--color-teal-soft)', color: 'var(--color-teal)' },
  cyan: { backgroundColor: 'var(--color-cyan-soft)', color: 'var(--color-cyan)' },
  pink: { backgroundColor: 'var(--color-pink-soft)', color: 'var(--color-pink)' },
  gray: { backgroundColor: 'var(--color-gray-soft)', color: 'var(--color-gray)' },
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
  cyan: 'invert(48%) sepia(96%) saturate(1243%) hue-rotate(156deg) brightness(91%) contrast(98%)',
  pink: 'invert(26%) sepia(91%) saturate(3474%) hue-rotate(314deg) brightness(96%) contrast(95%)',
  gray: 'invert(38%) sepia(10%) saturate(394%) hue-rotate(170deg) brightness(94%) contrast(89%)',
}

export const resolveColor = (value, module = null) => {
  // 1. If module is a direct color name, use it
  if (module && THEMES[module.toLowerCase()]) return module.toLowerCase()

  if (!value) return 'gray'
  const key = String(value).toLowerCase().trim()

  // 2. If module is a registry key, look it up
  if (module && REGISTRIES[module]) return REGISTRIES[module][key] ?? 'gray'

  // 3. Global lookup across all registries
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

export const getStatusUI = getBadgeUI
export const getStatusTheme = getBadgeTheme
export const getStatusFilter = getBadgeFilter
