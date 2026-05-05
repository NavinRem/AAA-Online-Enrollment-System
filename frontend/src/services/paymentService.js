import { request } from './api'

export const paymentService = {
  getAllPayments() {
    return request('/payments')
  },

  getFinancialStats() {
    return request('/payments/stats')
  },

  getPaymentHistory(uid) {
    return request(`/payments/history/${uid}`)
  },

  initiatePayment(data) {
    return request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  verifyPayment(transactionId) {
    return request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    })
  },
}
