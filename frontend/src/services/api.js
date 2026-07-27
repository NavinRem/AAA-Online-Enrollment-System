
import { auth } from '../firebase'
import { config } from '../config'
import { triggerSystemNotification } from './notificationInterceptor'

const API_URL = config.api.baseUrl

export async function request(endpoint, options = {}) {
  let url = `${API_URL}${endpoint}`
  const method = options.method || 'GET'
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
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



  let currentUser = auth.currentUser
  if (!currentUser) {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      currentUser = user
    })
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
    cache: 'no-store',
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

  if (method !== 'GET') {
    triggerSystemNotification(endpoint, method, responseData, options)
  }

  return responseData
}
