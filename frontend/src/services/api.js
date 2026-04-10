import { getCachedData, setCachedData, clearCachePrefix } from './cache'
import { auth } from '../firebase'
import { config } from '../config'

const API_URL = config.api.baseUrl

export async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  const cacheKey = endpoint
  if (method === 'GET' && !options.skipCache) {
    const cached = getCachedData(cacheKey)
    if (cached) return cached
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken()
      headers['Authorization'] = `Bearer ${token}`
    } catch (err) {
      console.warn('Failed to get auth token:', err)
    }
  }

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

  if (method === 'GET') {
    setCachedData(cacheKey, responseData)
  } else {
    const resourceBase = endpoint.split('/')[1]
    if (resourceBase) {
      clearCachePrefix(`/${resourceBase}`)
    }
  }

  return responseData
}
