import { request } from './api'

const normalizeTerm = (term) => {
  if (term && term.offerings && !Array.isArray(term.offerings)) {
    term.offerings = Object.values(term.offerings)
  }
  return term
}

const normalizeResponse = (res) => {
  if (Array.isArray(res)) return res.map(normalizeTerm)
  if (res && Array.isArray(res.data)) {
    res.data = res.data.map(normalizeTerm)
    return res
  }
  return normalizeTerm(res)
}

export const termService = {
  createTerm(data) {
    return request('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(normalizeResponse)
  },

  getAllTerms() {
    return request('/terms', {
      method: 'GET',
    }).then(normalizeResponse)
  },

  getTerm(id) {
    return request(`/terms/${id}`, {
      method: 'GET',
    }).then(normalizeResponse)
  },

  updateTerm(id, data) {
    return request(`/terms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(normalizeResponse)
  },

  deleteTerm(id) {
    return request(`/terms/${id}`, {
      method: 'DELETE',
    })
  },

  updateTermOffering(termId, offeringId, data) {
    return request(`/terms/${termId}/offerings/${offeringId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

export default termService
