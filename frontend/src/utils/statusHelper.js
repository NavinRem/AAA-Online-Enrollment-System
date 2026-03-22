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
  const s = String(status || '').toLowerCase().trim()
  
  const categories = {
    green: ['paid', 'confirmed', 'active', 'on-time', 'present', 'excellent', 'studying', 'parent', 'create at', 'joined at', 'success'],
    yellow: ['unpaid', 'pending', 'deactivated', 'suspended', 'warning', 'permission', 'inactive', 'upcoming', 'scheduled'],
    red: ['canceled', 'cancelled', 'failed', 'stopped', 'absent', 'serious', 'closed'],
    blue: ['graduated', 'late', 'good', 'fair', 'guardian', 'update at', 'past'],
    purple: ['make-up', 'makeup', 'intermediate', 'children', 'in progress'],
    magenta: ['unmarked', 'archived']
  }

  // 1. Exact match
  for (const [color, matches] of Object.entries(categories)) {
    if (matches.includes(s)) return color
  }

  // 2. Partial matches for ad-hoc values
  if (s.includes('$') || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(s)) return 'blue'
  if (/:[0-9]{2}\s*(am|pm)/i.test(s)) return 'blue'

  return 'gray'
}

/**
 * Maps a status string to a user-friendly display name.
 */
export const getStatusDisplay = (status) => {
  if (status === undefined || status === null) return 'N/A'
  const s = String(status)
  const lower = s.toLowerCase().trim()

  const genericTerms = [
    'active', 'inactive', 'studying', 'graduated', 'stopped', 'suspended',
    'upcoming', 'in progress', 'archived', 'closed', 'scheduled'
  ]

  if (genericTerms.includes(lower)) {
    return lower.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (isPaid(lower)) return 'Paid'
  if (isCancelled(lower)) return 'Cancelled'
  if (isPending(lower)) return 'Pending'
  if (isUnpaid(lower)) return 'Unpaid'

  return s
}
