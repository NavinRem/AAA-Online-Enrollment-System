/**
 * Utility for aggregating payment statistics for financial reporting.
 * Processes a list of payment records to calculate volume, revenue, and exceptions.
 * 
 * @param {Array} payments - List of standardized payment records
 * @returns {Object} Metric summary including revenue and lifecycle counts
 */
export const paymentStatCard = (payments = []) => {
  const totalTransactions = payments.length
  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0)
  const pendingPayments = payments.filter(
    (p) => (p.status || '').toLowerCase() === 'pending',
  ).length
  const refundedPayments = payments.filter(
    (p) => (p.status || '').toLowerCase() === 'refunded',
  ).length

  return {
    totalTransactions,
    totalRevenue,
    pendingPayments,
    refundedPayments,
  }
}
