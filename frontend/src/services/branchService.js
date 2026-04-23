import { request } from './api'

export const branchService = {
  createBranch(data) {
    return request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllBranches() {
    return request('/branches', {
      method: 'GET',
    })
  },

  getBranch(id) {
    return request(`/branches/${id}`, {
      method: 'GET',
    })
  },

  updateBranch(id, data) {
    return request(`/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteBranch(id) {
    return request(`/branches/${id}`, {
      method: 'DELETE',
    })
  },
}

export default branchService
