/**
 * Vite Dynamic Asset Resolution
 * Consolidated helpers for images and icons.
 */
const ASSETS = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { eager: true })

/**
 * Standardizes identifying strings into consistent kebab-case paths.
 */
const normalize = (val) =>
  val
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') || ''

/**
 * Core Resolver: Returns the URL for a local asset based on its category and name.
 * Respects Firebase Storage URLs and absolute paths.
 */
const resolveAsset = (category, path) => {
  if (!path) return ''

  // Already resolved URL or Firebase Storage URL
  if (
    path.startsWith('http') ||
    path.startsWith('/') ||
    path.startsWith('data:') ||
    path.includes('firebasestorage')
  ) {
    return path
  }

  // Cleanup: remove leading slash and normalize naming
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  const normalizedPath = normalize(cleanPath)

  // Consistency: Try the exact path or common extensions within the specific category folder
  const searchPaths = [
    normalizedPath,
    `${normalizedPath}.png`,
    `${normalizedPath}.svg`,
    `${normalizedPath}.jpg`,
    `${normalizedPath}.webp`,
    `${normalizedPath}.jpeg`,
  ]

  for (const p of searchPaths) {
    const fullKey = `../assets/${category}/${p}`
    if (ASSETS[fullKey]) return ASSETS[fullKey].default || ASSETS[fullKey]
  }

  return ''
}

/**
 * Primary Functions: getImage(path) and getIcon(path)
 * usage: getImage('profiles/avatar-boy') or getImage('profiles', 'avatar-boy')
 */
export const getImage = (param1, param2) => {
  const path = param2 ? `${param1}/${param2}` : param1
  return resolveAsset('images', path)
}

export const getIcon = (param1, param2) => {
  const path = param2 ? `${param1}/${param2}` : param1
  return resolveAsset('icons', path)
}

/**
 * Backward Compatibility Aliases ( getImageURL, getIconURL )
 */
export const getImageUrl = getImage
export const getIconUrl = getIcon

/**
 * Semantic Profile Helpers
 */
export const getProgramProfileURL = (url) => getImage(url)
export const getParentProfileURL = (url) => getImage(url)
export const getStudentProfileURL = (url) => getImage(url)
export const getTeacherProfileURL = (url) => getImage(url)

/**
 * Standardized Action Icon Mapping
 */
export const ACTION_ICONS = {
  edit: 'action/edit',
  pay: 'action/pay',
  cancel: 'action/cancel',
  delete: 'action/delete',
  view: 'action/eye-view',
  search: 'action/search',
  filter: 'action/filter',
  plus: 'action/plus-circle',
  download: 'action/download',
  upload: 'action/cloud-upload',
  save: 'action/cloud-upload',
  back: 'action/back',
  close: 'action/close',
}

/**
 * Resolves an action icon URL.
 * @param {string} action - Semantic name (e.g., 'edit')
 */
export const getActionIcon = (action) => {
  const path = ACTION_ICONS[normalize(action)] || action
  return getIcon(path)
}

/**
 * Registry of default avatars for selectors
 */
const getProfile = (name) => getImage('profiles', `avatar-${name}`)
export const ALL_BUILTIN_AVATARS = [
  getProfile('boy'),
  getProfile('girl'),
  getProfile('man'),
  getProfile('woman'),
  getProfile('teacher-man'),
  getProfile('teacher-woman'),
]

/**
 * Comparison Utility: Safely compares two profile identifiers (Local vs Remote).
 */
export const isSameProfileAsset = (asset1, asset2) => {
  if (!asset1 || !asset2) return asset1 === asset2

  const extractCore = (val) => {
    if (typeof val !== 'string') return val
    let core = val.split('?')[0].split('#')[0]

    if (core.includes('firebasestorage.googleapis.com')) {
      const parts = core.split('/o/')
      if (parts.length > 1) {
        core = decodeURIComponent(parts[1]).split('/').slice(1).join('/')
      }
    }

    return core.toLowerCase().replace(/\/$/, '').trim()
  }

  return extractCore(asset1) === extractCore(asset2)
}
