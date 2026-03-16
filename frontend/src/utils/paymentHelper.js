export const paymentStatCard = (payments) => {
  const total_transactions = payments.length
  const total_revenue = payments.reduce((acc, payment) => acc + payment.amount, 0)
  const pending_payments = payments.filter((payment) => payment.status === 'Pending').length
  const refunded_payments = payments.filter((payment) => payment.status === 'Refunded').length
  
  return {
    total_transactions,
    total_revenue,
    pending_payments,
    refunded_payments,
  }
}