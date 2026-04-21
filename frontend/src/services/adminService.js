import { request } from './api'

export const adminService = {
  getAllAdmins() {
    return request('/admins')
  },

  getAdmin(id) {
    return request(`/admins/${id}`)
  },

  registerAdmin(data) {
    return request('/admins/register', {
      method: 'POST',
      body: JSON.stringify(data),
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
