/**
 * Shared status checking logic to avoid duplication across helpers and views.
 */

export const isPaid = (status) => {
  const s = String(status || '').toLowerCase()
  return ['paid', 'confirmed', 'active', 'success'].includes(s)
}

export const isCancelled = (status) => {
  const s = String(status || '').toLowerCase()
  return ['canceled', 'cancelled'].includes(s)
}

export const isUnpaid = (status) => {
  const s = String(status || '').toLowerCase()
  return s === 'unpaid' || s === 'pending'
}

export const isPending = (status) => {
  return String(status || '').toLowerCase() === 'pending'
}

/**
 * Maps a status string to a UI category (color).
 */
export const getStatusCategory = (status) => {
  const s = String(status).toLowerCase().trim()
  const validColors = [
    'green',
    'yellow',
    'red',
    'blue',
    'purple',
    'magenta',
    'orange',
    'gray',
    'emerald',
    'sky',
    'rose',
    'amber',
  ]

  // 0. Direct color match
  if (validColors.includes(s)) return s

  // 1. Dynamic color prefix (e.g., "blue:Monday" -> blue)
  if (s.includes(':')) {
    const [color] = s.split(':')
    if (validColors.includes(color)) return color
  }

  const categories = {
    green: [
      'paid',
      'confirmed',
      'active',
      'on-time',
      'present',
      'excellent',
      'studying',
      'parent',
      'created at',
      'joined at',
      'success',
      'past',
      'full',
      'start',
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
    ],
    red: ['canceled', 'cancelled', 'failed', 'stopped', 'absent', 'serious', 'closed'],
    blue: [
      'graduated',
      'late',
      'good',
      'fair',
      'guardian',
      'updated at',
      'partial',
      'prorated',
      'discount',
      'end',
    ],
    purple: ['make-up', 'makeup', 'trial', 'intermediate', 'children', 'in progress', 'sponsorship'],
    magenta: ['unmarked', 'archived'],
  }

  // 1. Exact match
  for (const [color, matches] of Object.entries(categories)) {
    if (matches.includes(s)) return color
  }

  // 2. Numeric dynamic mapping (e.g., age-based coloring)
  let numericValue = s
  if (s.startsWith('age:')) {
    numericValue = s.replace('age:', '').trim()
  }

  if (numericValue !== '' && !isNaN(numericValue)) {
    const num = parseFloat(numericValue)
    if (num < 6) return 'green'
    if (num < 10) return 'blue'
    if (num < 15) return 'purple'
    return 'blue'
  }

  // 3. Mode/Suffix matches (e.g., "Full Enrollment" -> "full")
  if (s.includes('enrollment')) {
    const prefix = s.replace('enrollment', '').trim()
    for (const [color, matches] of Object.entries(categories)) {
      if (matches.includes(prefix)) return color
    }
  }

  // 4. Pattern / Partial matches
  if (s.includes('$') || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(s))
    return 'blue'
  if (/:[0-9]{2}\s*(am|pm)/i.test(s)) return 'blue'
  if (s.includes('years')) return 'blue'

  return 'gray'
}

/**
 * Maps a status string to a user-friendly display name.
 */
export const getStatusDisplay = (status) => {
  if (status === undefined || status === null) return 'N/A'
  let s = String(status)

  // Clean dynamic color prefix if present (e.g., "blue:Monday" -> "Monday")
  if (s.includes(':')) {
    const parts = s.split(':')
    const color = parts[0].toLowerCase().trim()
    const validColors = ['green', 'yellow', 'red', 'blue', 'purple', 'magenta', 'orange', 'gray']
    if (validColors.includes(color)) {
      s = parts.slice(1).join(':').trim()
    }
  }

  const lower = s.toLowerCase().trim()

  const genericTerms = [
    'active',
    'inactive',
    'studying',
    'graduated',
    'stopped',
    'suspended',
    'upcoming',
    'in progress',
    'archived',
    'closed',
    'scheduled',
  ]

  if (genericTerms.includes(lower)) {
    return lower
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (isPaid(lower)) return 'Paid'
  if (isCancelled(lower)) return 'Cancelled'
  if (isPending(lower)) return 'Pending'
  if (isUnpaid(lower)) return 'Unpaid'

  return s
}

/**
 * Returns a CSS style object for status-aware UI themes.
 */
export const getStatusTheme = (status) => {
  if (status === 'all' || !status) return {}

  const category = getStatusCategory(status)

  const themes = {
    green: {
      backgroundColor: '#10b981',
      color: '#ecfdf5',
    },
    yellow: {
      backgroundColor: '#e2c106ff',
      color: '#fff7ed',
    },
    orange: {
      backgroundColor: '#f97316',
      color: '#fff7ed',
    },
    red: {
      backgroundColor: '#ef4444',
      color: '#fef2f2',
    },
    blue: {
      backgroundColor: '#3b82f6',
      color: '#eff6ff',
    },
    purple: {
      backgroundColor: '#8b5cf6',
      color: '#f5f3ff',
    },
    magenta: {
      backgroundColor: '#ec4899',
      color: '#fdf2f8',
    },
    gray: {
      backgroundColor: '#f8fafc',
      color: '#475569',
    },
  }

  return themes[category] || themes.gray
}
