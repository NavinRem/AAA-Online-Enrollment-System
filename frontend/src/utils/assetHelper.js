/**
 * Vite Dynamic Asset Resolution
 * Using import.meta.glob ensures all assets are found and bundled correctly.
 */
const images = import.meta.glob('../assets/images/**/*.{png,jpg,jpeg,svg,webp}', { eager: true })
const icons = import.meta.glob('../assets/icons/**/*.{png,jpg,jpeg,svg,webp}', { eager: true })

/**
 * Normalizes a keyword for asset lookup.
 */
const normalize = (name) => {
  if (!name) return ''
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/_/g, '-')
}

/**
 * Core resolver for project assets.
 * 
 * Logic:
 * 1. Cleanup path.
 * 2. Try direct match in collection.
 * 3. If image, try convention patterns (classes/card-*, profiles/avatar-*).
 */
const getAsset = (collections, baseDir, path) => {
  if (!path) return ''
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  const normalizedPath = normalize(cleanPath)
  
  const hasExtension = normalizedPath.includes('.')
  const extensions = hasExtension ? [''] : ['.png', '.jpg', '.jpeg', '.svg', '.webp']
  
  // 1. Direct Lookup (using normalized path)
  for (const ext of extensions) {
    const fullPath = `../assets/${baseDir}/${normalizedPath}${ext}`
    if (collections[fullPath]) return collections[fullPath].default || collections[fullPath]
  }
  
  // 2. Convention Fallbacks (Images only)
  if (baseDir === 'images') {
    const patterns = [
      `classes/card-${normalizedPath}`,
      `profiles/avatar-${normalizedPath}`,
      `dashboard/card-${normalizedPath}`,
      `status/badge-${normalizedPath}`
    ]
    for (const p of patterns) {
      for (const ext of extensions) {
        const fullPath = `../assets/${baseDir}/${p}${ext}`
        if (collections[fullPath]) return collections[fullPath].default || collections[fullPath]
      }
    }
  }
  
  return ''
}

/**
 * Main Image Resolution Entry Point
 */
export const getImageUrl = (param1, param2) => {
  if (!param1) return ''
  
  // Already resolved URL (Storage, Absolute, Data, etc.)
  if (!param2 && typeof param1 === 'string' && (param1.startsWith('http') || param1.includes('firebasestorage') || param1.startsWith('/') || param1.startsWith('data:'))) {
    return param1
  }

  // Double Param Logic (e.g., getImageUrl('profiles', 'boy'))
  if (param1 && param2) {
    return getAsset(images, 'images', `${param1}/${param2}`)
  }

  // Single identifier logic (e.g., getImageUrl('Piano'))
  return getAsset(images, 'images', param1)
}

/**
 * Icon Loader
 */
export const getIconUrl = (param1, param2) => {
  if (!param1) return ''
  
  const name = (param2 || param1).toLowerCase()
  const isSvg = name.includes('.svg') || name.includes('svgrepo')
  
  if (!isSvg) return getImageUrl(param1, param2)

  const path = param2 ? `${param1}/${param2}` : param1
  const resolved = getAsset(icons, 'icons', path)
  return resolved || getImageUrl(param1, param2)
}

/**
 * Standardized Profile Resolution Helpers
 */
export const getProgramProfileURL = (profileURL, category) => {
  if (profileURL) return getImageUrl(profileURL)
  if (category) return getImageUrl(category)
  return getImageUrl('classes/card-model')
}

export const getParentProfileURL = (profileURL) => {
  return getImageUrl(profileURL) || getImageUrl('profiles/avatar-man')
}

export const getStudentProfileURL = (profileURL) => {
  return getImageUrl(profileURL) || getImageUrl('profiles/avatar-boy')
}

export const getTeacherProfileURL = (profileURL) => {
  return getImageUrl(profileURL) || getImageUrl('profiles/avatar-teacher-man')
}

/**
 * Convenience Shorthands
 */
export const getProfileAsset = (name) => getImageUrl('profiles', `avatar-${name}`)
export const getDashboardAsset = (name) => getImageUrl('dashboard', `card-${name}`)
export const getClassAsset = (name) => getImageUrl('classes', `card-${name}`)
export const getProgramAsset = (name) => getImageUrl('programs', name)
export const getStatusAsset = (name) => getImageUrl('status', `badge-${name}`)
export const getCommonAsset = (name) => getImageUrl('common', name)

export const ALL_BUILTIN_AVATARS = [
  getProfileAsset('boy'),
  getProfileAsset('girl'),
  getProfileAsset('man'),
  getProfileAsset('woman'),
  getProfileAsset('teacher-man'),
  getProfileAsset('teacher-woman'),
]
