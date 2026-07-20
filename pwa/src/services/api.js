import { auth } from '@/firebase'

const API_URL = import.meta.env.VITE_API_BASE_URL // same backend as admin portal

export async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  const method = options.method || 'GET'
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const currentUser = auth.currentUser
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken()
      headers['Authorization'] = `Bearer ${token}`
    } catch (err) {
      console.warn('Failed to get auth token:', err)
    }
  }

  const response = await fetch(url, { ...options, headers })
  const contentType = response.headers.get('content-type')
  const responseData = contentType?.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    const error = new Error(responseData.error || responseData.message || `API Error: ${response.status}`)
    error.status = response.status
    throw error
  }

  return responseData
}