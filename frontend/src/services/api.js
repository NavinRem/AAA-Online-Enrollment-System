import { getCachedData, setCachedData, clearCachePrefix } from './cache'

import { config } from '../config'

const API_URL = config.api.baseUrl

// Helper function for making requests
export async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  // 1. Return Cache early if applicable
  const cacheKey = endpoint
  if (method === 'GET' && !options.skipCache) {
    const cached = getCachedData(cacheKey)
    if (cached) return cached
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const headers = {
    ...defaultHeaders,
    ...options.headers,
  }

  if (headers['Content-Type'] === undefined) {
    delete headers['Content-Type']
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(url, config)

  const contentType = response.headers.get('content-type')
  let responseData

  if (contentType && contentType.indexOf('application/json') !== -1) {
    responseData = await response.json()
  } else {
    const text = await response.text()
    responseData = { message: text || response.statusText }
  }

  if (!response.ok) {
    throw new Error(
      responseData.message ||
        responseData.error ||
        `API Error: ${response.status} ${response.statusText}`,
    )
  }

  if (responseData.error) {
    throw new Error(responseData.error.message || responseData.error || 'Unknown API Error')
  }

  // 2. Set Cache on success for GET
  if (method === 'GET') {
    setCachedData(cacheKey, responseData)
  } else {
    // 3. Clear cache aggressively if we mutate (POST, DELETE, PUT)
    // E.g., if we POST to /enrollments, we clear the '/enrollments' cache.
    const resourceBase = endpoint.split('/')[1]
    if (resourceBase) {
      clearCachePrefix(`/${resourceBase}`)
    }
  }

  return responseData
}
