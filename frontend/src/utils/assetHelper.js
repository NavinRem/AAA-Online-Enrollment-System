const ASSETS = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { eager: true })

const normalize = (val) =>
  val
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') || ''

const resolveAsset = (category, path) => {
  if (
    !path ||
    typeof path !== 'string' ||
    path.startsWith('http') ||
    path.startsWith('/') ||
    path.startsWith('data:') ||
    path.includes('firebasestorage')
  ) {
    return path
  }

  let normPath = normalize(path)
  if (normPath === 'profiles/avatar-admin' || normPath === 'avatar-admin') {
    normPath = normPath.replace('avatar-admin', 'avatar-admin-female')
  }
  const extensions = ['', '.png', '.svg', '.jpg', '.webp', '.jpeg']

  for (const ext of extensions) {
    const key = `../assets/${category}/${normPath}${ext}`
    if (ASSETS[key]) return ASSETS[key].default || ASSETS[key]
  }

  return ''
}

export const getImageUrl = (p1, p2) => resolveAsset('images', p2 ? `${p1}/${p2}` : p1)
export const getIconUrl = (p1, p2) => resolveAsset('icons', p2 ? `${p1}/${p2}` : p1)

export const getProgramProfileURL = (progUrl, catName, catUrl) => {
  if (progUrl) return resolveAsset('images', progUrl)
  if (catUrl) return resolveAsset('images', catUrl)
  if (catName) {
    const categoryAsset = resolveAsset('images', `categories/${normalize(catName)}`)
    if (categoryAsset) return categoryAsset
  }
  return resolveAsset('images', 'common/logo-main')
}
export const getParentProfileURL = (url) =>
  resolveAsset('images', url) || resolveAsset('images', 'profiles/avatar-man')
export const getStudentProfileURL = (url) =>
  resolveAsset('images', url) || resolveAsset('images', 'profiles/avatar-boy')


const ACTION_ICONS = {
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
  'eye-open': 'action/eye-open',
  'eye-close': 'action/eye-close',
  'reset-password': 'action/reset-password',
  reactivate: 'action/reactivate',
  deactivate: 'action/deactivate',
  email: 'action/email',
  cash: 'action/cash',
  branch: 'navigation/branch',
  time: 'filter/ongoing'
}

export const getActionIcon = (name) => getIconUrl(ACTION_ICONS[normalize(name)] || name)



export const isSameProfileAsset = (a, b) => {
  if (!a || !b) return a === b
  const core = (v) =>
    v
      .split('?')[0]
      .split('/')
      .pop()
      .split('.')[0]
      .replace(/^avatar-/, '')
      .toLowerCase()
      .trim()
  return core(a) === core(b)
}
