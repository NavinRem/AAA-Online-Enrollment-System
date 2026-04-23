import { request } from './api'

export const programService = {
  createProgram(data) {
    return request('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllPrograms() {
    return request('/programs', {
      method: 'GET',
    })
  },

  getProgram(id) {
    return request(`/programs/${id}`, {
      method: 'GET',
    })
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
    return []
  },

  async addProgramSchedule(_, data) {
    return { id: `mock-${Date.now()}`, ...data }
  },

  async deleteProgramSchedule() {
    return { message: 'Schedule deleted successfully (mock)' }
  },
}

export default programService
