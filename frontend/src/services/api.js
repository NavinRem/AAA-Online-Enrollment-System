// Helper to switch between Local and Production
// In Vite, import.meta.env.PROD is true during build
const API_URL = 'https://api-tyweqke5oa-uc.a.run.app'
// const API_URL = 'http://127.0.0.1:5001/aaa-online-registration-e3833/us-central1/api'

// Helper function for making requests
export async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  const response = await fetch(url, config)

  const contentType = response.headers.get('content-type')
  let responseData

  if (contentType && contentType.indexOf('application/json') !== -1) {
    responseData = await response.json()
  } else {
    // If not JSON (e.g. HTML error page), read as text
    const text = await response.text()
    responseData = { message: text || response.statusText }
  }

  // Check for HTTP errors
  if (!response.ok) {
    throw new Error(
      responseData.message ||
        responseData.error ||
        `API Error: ${response.status} ${response.statusText}`,
    )
  }

  // Check for logic errors even if status is 200
  if (responseData.error) {
    throw new Error(responseData.error.message || responseData.error || 'Unknown API Error')
  }

  return responseData
}
