import { request } from './api'

export const branchService = {
  createBranch(data) {
    return request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllBranches() {
    return request('/branches')
  },

  getBranch(id) {
    return request(`/branches/${id}`)
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
