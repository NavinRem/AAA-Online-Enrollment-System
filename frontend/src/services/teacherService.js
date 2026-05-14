import { request } from './api'

export const teacherService = {
  createTeacher(data) {
    return request('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllTeachers() {
    return request('/teachers', {
      method: 'GET',
    })
  },

  getTeacher(id) {
    return request(`/teachers/${id}`, {
      method: 'GET',
    })
  },

  updateTeacher(id, data) {
    return request(`/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteTeacher(id) {
    return request(`/teachers/${id}`, {
      method: 'DELETE',
    })
  },
 
  getAssignments(id) {
    return request(`/teachers/${id}/assignments`, {
      method: 'GET',
    })
  },
 
  assignToClass(id, termId, offeringId) {
    return request(`/teachers/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ termId, offeringId }),
    })
  },
 
  unassignFromClass(id, termId, offeringId) {
    return request(`/teachers/${id}/unassign`, {
      method: 'POST',
      body: JSON.stringify({ termId, offeringId }),
    })
  },
}
