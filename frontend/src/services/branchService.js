import { request } from './api'

class BranchService {
  getAllBranches() {
    return request('/branches')
  }

  getBranch(id) {
    return request(`/branches/${id}`)
  }

  getBranchSnapshot(branch) {
    if (!branch) return null
    return {
      id: branch.id,
      name: branch.name,
      abbr: branch.abbr,
    }
  }

  createBranch(data) {
    return request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateBranch(id, data) {
    return request(`/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  deleteBranch(id) {
    return request(`/branches/${id}`, {
      method: 'DELETE',
    })
  }
}

const branchService = new BranchService()
export { branchService }
export default branchService
