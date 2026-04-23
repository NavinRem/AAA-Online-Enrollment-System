import { request } from './api'

export const trialService = {
  createTrial(data) {
    return request('/trials', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllTrials() {
    return request('/trials', {
      method: 'GET',
    })
  },

  getTrial(id) {
    return request(`/trials/${id}`, {
      method: 'GET',
    })
  },

  updateTrial(id, data) {
    return request(`/trials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteTrial(id) {
    return request(`/trials/${id}`, {
      method: 'DELETE',
    })
  },
}
