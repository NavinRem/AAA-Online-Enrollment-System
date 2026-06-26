import { storageService } from '@/services/storageService'
import { isSameProfileAsset } from './assetHelper'

/*
  Enriches parent objects with their linked students by scanning the student list.
  This function performs a reverse-lookup to populate childrenInfo arrays, ensuring the frontend
  has access to child data without requiring expensive cross-collection joins in the backend.
 */
export const enrichParents = (parents = [], students = []) => {
  const parent = students.reduce((acc, s) => {
    const pid = s.parentId
    if (pid) {
      if (!acc[pid]) acc[pid] = []
      acc[pid].push({
        id: s.id,
        name: s.name,
        dob: s.dob,
        profileURL: s.profileURL,
        status: s.status,
      })
    }
    return acc
  }, {})

  return parents.map((u) => ({
    ...u,
    childrenInfo: parent[u.id] || [],
  }))
}

const isRegisteredToday = (parent, todayStart) => {
  const createdAt = parent?.createdAt
  if (!createdAt) return false
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  return date.getTime() >= todayStart
}

const isActiveParent = (parent) => {
  return (parent?.status || 'active').toLowerCase() === 'active'
}

const PAID_STATUSES = ['paid', 'confirmed', 'success']

const hasPaidToday = (parentId, enrollments = [], todayStart) => {
  try {
    return enrollments.some((e) => {
      if (e.parentId !== parentId) return false
      const paidAt = e.paidAt
      if (!paidAt) return false
      const status = String(e.status || e.paymentStatus || '').toLowerCase()
      return PAID_STATUSES.includes(status) && new Date(paidAt).getTime() >= todayStart
    })
  } catch (error) {
    console.error('Error checking if parent has paid today:', error)
    return false
  }
}



export const calculateParentStats = (parents = [], enrollments = []) => {
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).getTime()

  return {
    parentCount: parents.length,
    todayCount: parents.filter((p) => isRegisteredToday(p, todayStart)).length,
    paidTodayCount: parents.filter((p) => hasPaidToday(p.id, enrollments, todayStart)).length,
    inactiveCount: parents.filter((p) => (p.status || 'active').toLowerCase() === 'inactive')
      .length,
  }
}

export const filterParents = (parents = [], enrollments = [], filterType = 'all') => {
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).getTime()

  const strategies = {
    active: (p) => isActiveParent(p),
    inactive: (p) => !isActiveParent(p),
    'registered-today': (p) => isRegisteredToday(p, todayStart),
    'paid-today': (p) => hasPaidToday(p.id, enrollments, todayStart),
  }

  const filterFn = strategies[filterType]
  return filterFn ? parents.filter(filterFn) : parents
}

export const processParentProfileImage = async (profileURL, name, currentProfile = '') => {
  if (!profileURL || !profileURL.includes('/profiles/temp/')) {
    return profileURL
  }
  if (currentProfile && isSameProfileAsset(profileURL, currentProfile)) {
    return currentProfile
  }

  try {
    const extension = profileURL.split('?')[0].split('.').pop()
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const newPath = `profiles/parent/${sanitizedName}_parent.${extension}`
    return await storageService.moveProfileImage(profileURL, newPath)
  } catch (error) {
    console.warn('Failed to process parent profile image, fallback to temp:', error)
    return profileURL
  }
}

export const prepareParentPayload = (data) => {
  return {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    profileURL: data.profileURL,
    status: data.status || 'active',
  }
}
