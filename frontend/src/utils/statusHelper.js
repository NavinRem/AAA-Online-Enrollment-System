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
