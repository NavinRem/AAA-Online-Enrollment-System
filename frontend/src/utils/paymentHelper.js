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
