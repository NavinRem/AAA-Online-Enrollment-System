import { request } from './api'

export const userService = {
  getAllUsers() {
    return request('/users')
  },

  getProfile(uid) {
    return request(`/users/${uid}`)
  },
}
