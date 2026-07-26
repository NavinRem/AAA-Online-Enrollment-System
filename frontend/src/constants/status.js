/**
 * Standardized status definitions for the entire application.
 * Ensures consistency between Dashboard, Payments, and Enrollment views.
 */

const PAYMENT_STATUS = {
  PAID: 'paid',
  CONFIRMED: 'confirmed',
  SUCCESS: 'success',
  ACTIVE: 'active', // Some legacy active records are treated as paid
  PENDING: 'pending',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
}

const PAID_STATUS_LIST = [
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.CONFIRMED,
  PAYMENT_STATUS.SUCCESS,
  PAYMENT_STATUS.ACTIVE,
]

const PENDING_STATUS_LIST = [
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.UNPAID,
  PAYMENT_STATUS.PARTIAL,
]

export const isPaid = (status) => {
  if (!status) return false
  return PAID_STATUS_LIST.includes(String(status).toLowerCase().trim())
}

export const isPending = (status) => {
  if (!status) return false
  return PENDING_STATUS_LIST.includes(String(status).toLowerCase().trim())
}
