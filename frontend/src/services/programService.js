import { request } from './api'

export const programService = {
  createProgram(data) {
    return request('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllPrograms() {
    return request('/programs')
  },

  getProgram(id) {
    return request(`/programs/${id}`)
  },

  updateProgram(id, data) {
    return request(`/programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteProgram(id) {
    return request(`/programs/${id}`, {
      method: 'DELETE',
    })
  },

  async getProgramSchedules() {
    // Return empty array locally to avoid out-of-scope backend requests
    return []
  },

  async addProgramSchedule(_, data) {
    // Return mock success and local ID
    return { id: `mock-${Date.now()}`, ...data }
  },

  async deleteProgramSchedule() {
    // Return mock success
    return { message: 'Schedule deleted successfully (mock)' }
  },
}

export default programService
