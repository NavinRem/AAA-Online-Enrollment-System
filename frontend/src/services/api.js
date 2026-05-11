import { getCachedData, setCachedData, clearCachePrefix } from './cache'
import { auth } from '../firebase'
import { config } from '../config'

const API_URL = config.api.baseUrl

export async function request(endpoint, options = {}) {
  let url = `${API_URL}${endpoint}`
  const method = options.method || 'GET'

  // Global Parameter Sanitization for GET requests
  if (method === 'GET' && endpoint.includes('?')) {
    const [path, query] = endpoint.split('?')
    const params = new URLSearchParams(query)
    const cleanParams = new URLSearchParams()

    for (const [key, value] of params.entries()) {
      if (
        value !== 'undefined' &&
        value !== 'null' &&
        value !== '' &&
        value !== null &&
        value !== undefined
      ) {
        cleanParams.append(key, value)
      }
    }

    const newQuery = cleanParams.toString()
    url = newQuery ? `${API_URL}${path}?${newQuery}` : `${API_URL}${path}`
  }

  const cacheKey = url
  if (method === 'GET' && !options.skipCache) {
    const cached = getCachedData(cacheKey)
    if (cached) return cached
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Ensure auth is ready before checking currentUser
  let currentUser = auth.currentUser
  if (!currentUser) {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      currentUser = user
    })
    // Small delay to allow Firebase to initialize if it hasn't yet
    await new Promise((resolve) => setTimeout(resolve, 50))
    unsubscribe()
  }

  if (currentUser) {
    try {
      const token = await currentUser.getIdToken()
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
    const error = new Error(
      responseData.message ||
        responseData.error ||
        `API Error: ${response.status} ${response.statusText}`,
    )
    error.status = response.status
    throw error
  }

  if (responseData.error) {
    const errorMsg = responseData.error.message || responseData.error || 'Unknown API Error'
    const error = new Error(errorMsg)
    error.status = response.status
    throw error
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
