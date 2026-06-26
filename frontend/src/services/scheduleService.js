import { request } from './api'

const scheduleService = {
  createSchedule(data) {
    return request('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllSchedules(filters = {}, options = {}) {
    const params = new URLSearchParams(filters).toString()
    const query = params ? `?${params}` : ''
    return request(`/schedules${query}`, options)
  },

  getSchedule(id) {
    return request(`/schedules/${id}`)
  },

  updateSchedule(id, data) {
    return request(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteSchedule(id) {
    return request(`/schedules/${id}`, {
      method: 'DELETE',
    })
  },
}

export { scheduleService }
