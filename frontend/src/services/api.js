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

  // Handle headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Allow removing Content-Type (e.g. for FormData)
  if (headers['Content-Type'] === undefined) {
    delete headers['Content-Type']
  }

  const fetchOptions = {
    ...options,
    headers,
  }

  const response = await fetch(url, fetchOptions)
  const contentType = response.headers.get('content-type')
  
  let responseData
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json()
  } else {
    const text = await response.text()
    responseData = { message: text || response.statusText }
  }

  // Error handling
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

  // 2. Cache management
  if (method === 'GET') {
    setCachedData(cacheKey, responseData)
  } else {
    // Clear cache for this resource type if we mutate
    const resourceBase = endpoint.split('/')[1]
    if (resourceBase) {
      clearCachePrefix(`/${resourceBase}`)
    }
  }

  return responseData
}
