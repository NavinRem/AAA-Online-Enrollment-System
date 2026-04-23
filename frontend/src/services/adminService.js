import { request } from './api'

export const adminService = {
  createAdmin(data) {
    return request('/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllAdmins() {
    return request('/admins', {
      method: 'GET',
    })
  },

  getAdmin(id) {
    return request(`/admins/${id}`, {
      method: 'GET',
    })
  },

  updateAdmin(id, data) {
    return request(`/admins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteAdmin(id) {
    return request(`/admins/${id}`, {
      method: 'DELETE',
    })
  },
}
