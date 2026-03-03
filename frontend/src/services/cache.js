const CACHE_PREFIX = 'aaa_cache_'

export const getCachedData = (key, ttlMinutes = 5) => {
  const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
  if (!cached) return null

  try {
    const { data, timestamp } = JSON.parse(cached)
    const now = new Date().getTime()
    
    if (now - timestamp > ttlMinutes * 60 * 1000) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }
    return data
  } catch (e) {
    return null
  }
}

export const setCachedData = (key, data) => {
  const cacheObj = {
    data,
    timestamp: new Date().getTime()
  }
  localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheObj))
}

export const clearCachePrefix = (prefix) => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(`${CACHE_PREFIX}${prefix}`)) {
      localStorage.removeItem(key)
    }
  })
}
