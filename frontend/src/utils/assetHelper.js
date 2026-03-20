/**
 * Vite Dynamic Asset Resolution
 * Using import.meta.glob ensures all assets are found and bundled correctly.
 */
const images = import.meta.glob('../assets/images/**/*.{png,jpg,jpeg,svg,webp}', { eager: true })
const icons = import.meta.glob('../assets/icons/**/*.{png,jpg,jpeg,svg,webp}', { eager: true })

/**
 * ASSET_PATH_MAP: Explicitly map legacy fuzzy keywords to new standardized paths.
 */
const ASSET_PATH_MAP = {
  'student': 'profiles/avatar-boy',
  'parent': 'profiles/avatar-man',
  'guardian': 'profiles/avatar-man',
  'admin': 'profiles/avatar-admin',
  'teacher-man': 'profiles/avatar-teacher-man',
  'teacher-woman': 'profiles/avatar-teacher-woman',
  'profile-admin': 'profiles/avatar-admin',
  'child-profile': 'profiles/avatar-student',
  'total-student': 'dashboard/card-student',
  'total-parent': 'dashboard/card-parent',
  'total-program': 'dashboard/card-program',
  'total-guardian': 'dashboard/card-guardian',
  'total-account': 'dashboard/card-account',
  'user-online': 'dashboard/user-online',
  'piano': 'classes/card-piano',
  'robotic': 'classes/card-robotic',
  'ballet': 'classes/card-ballet',
  'paid': 'status/badge-paid',
  'unpaid': 'status/badge-unpaid',
  'pending': 'status/badge-pending',
  'cancel': 'status/badge-cancel',
  'logo': 'common/logo-main',
  'aaa-logo': 'common/logo-main',
  'program': 'programs/program'
}

const normalizeAssetName = (name) => {
  if (!name) return ''
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/_/g, '-')
}

/**
 * Resolves an asset from the globbed collections.
 */
const resolveAsset = (collections, baseDir, path) => {
  if (!path) return ''
  
  // Clean path (remove leading slashes)
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  
  // Try with various extensions if not provided
  const extensions = cleanPath.includes('.') ? [''] : ['.png', '.jpg', '.jpeg', '.svg', '.webp']
  
  for (const ext of extensions) {
    const fullPath = `../assets/${baseDir}/${cleanPath}${ext}`
    if (collections[fullPath]) {
      return collections[fullPath].default || collections[fullPath]
    }
  }
  
  return ''
}

/**
 * Dynamic Image Loader
 */
export const getImageUrl = (param1, param2) => {
  if (!param1) return ''
  
  // Case 1: Explicit Path 'category/filename'
  if (!param2 && param1.includes('/')) {
    const resolved = resolveAsset(images, 'images', param1)
    if (resolved) return resolved
  }

  // Case 2: Standardized Alias (Legacy support)
  const kw = normalizeAssetName(param2 || param1)
  const mappedPath = ASSET_PATH_MAP[kw]
  if (mappedPath) {
    const resolved = resolveAsset(images, 'images', mappedPath)
    if (resolved) return resolved
  }

  // Case 3: Category passed as first arg, name as second
  if (param1 && param2) {
    const path = `${normalizeAssetName(param1)}/${normalizeAssetName(param2)}`
    const resolved = resolveAsset(images, 'images', path)
    if (resolved) return resolved
  }

  // Final Fallback
  return ''
}

/**
 * Dynamic Icon Loader
 */
export const getIconUrl = (param1, param2) => {
  if (!param1) return ''
  
  const name = param2 || param1
  const isSvg = name.toLowerCase().includes('.svg') || name.includes('svgrepo')
  
  // If it's not an SVG, route it to getImageUrl (Raster icons)
  if (!isSvg) {
     return getImageUrl(param1, param2)
  }

  // Try icons folder
  const path = param2 ? `${param1}/${param2}` : param1
  const resolved = resolveAsset(icons, 'icons', path)
  if (resolved) return resolved

  // Fallback to images (some icons are stored there)
  return getImageUrl(param1, param2)
}

/**
 * Convenience helpers
 */
export const getProfileAsset = (name) => getImageUrl('profiles', `avatar-${name}`)
export const getDashboardAsset = (name) => getImageUrl('dashboard', `card-${name}`)
export const getClassAsset = (name) => getImageUrl('classes', `card-${name}`)
export const getProgramAsset = (name) => getImageUrl('programs', name)
export const getStatusAsset = (name) => getImageUrl('status', `badge-${name}`)
export const getBackgroundAsset = (name) => getImageUrl('backgrounds', name)
export const getCommonAsset = (name) => getImageUrl('common', name)

export const getAssetUrl = (param1, param2) => getImageUrl(param1, param2)
