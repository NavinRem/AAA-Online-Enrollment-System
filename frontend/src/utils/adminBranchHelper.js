import { ref } from 'vue'
import { auth } from '@/firebase'
import { adminService } from '@/services/adminService'

// Reactive state so Topbar, Dashboard and Modals update instantly across the app
const reactiveAdminProfile = ref(loadAdminProfileFromStorage())

function loadAdminProfileFromStorage() {
  const savedProfileStr = localStorage.getItem('aaa-admin-profile')
  let savedProfile = {}
  if (savedProfileStr) {
    try {
      savedProfile = JSON.parse(savedProfileStr)
    } catch (e) {
      console.warn('Failed to parse admin profile', e)
    }
  }

  const currentUser = auth?.currentUser
  return {
    id: savedProfile.id || currentUser?.uid || '',
    name: savedProfile.name || currentUser?.displayName || '',
    email: savedProfile.email || currentUser?.email || '',
    role: savedProfile.role || 'Admin',
    branch: savedProfile.branch || localStorage.getItem('aaa-admin-branch') || '',
    profileURL: savedProfile.profileURL || currentUser?.photoURL || 'profiles/avatar-admin-female',
  }
}

export function getAdminProfile() {
  const current = reactiveAdminProfile.value
  const currentUser = auth?.currentUser
  return {
    ...current,
    id: current.id || currentUser?.uid || '',
    name: current.name || currentUser?.displayName || '',
    email: current.email || currentUser?.email || '',
    profileURL: current.profileURL || currentUser?.photoURL || 'profiles/avatar-admin-female',
  }
}

export function getAdminBranch() {
  return reactiveAdminProfile.value?.branch || localStorage.getItem('aaa-admin-branch') || ''
}

/**
 * Sync active admin identity with Firestore database
 */
export async function syncAdminProfileWithDatabase() {
  const current = getAdminProfile()
  if (!current.email && !current.id) return current

  try {
    let remote = null
    if (current.email) {
      remote = await adminService.getAdminByEmail(current.email)
    }
    if (!remote && current.id) {
      remote = await adminService.getAdminById(current.id)
    }

    if (remote) {
      const next = { ...current, ...remote }
      reactiveAdminProfile.value = next
      localStorage.setItem('aaa-admin-profile', JSON.stringify(next))
      if (next.branch) localStorage.setItem('aaa-admin-branch', next.branch)
      return next
    }
  } catch (err) {
    console.warn('Unable to sync admin profile with database:', err)
  }
  return current
}

export function saveAdminProfile(updatedProfile) {
  const current = getAdminProfile()
  const next = {
    ...current,
    ...updatedProfile,
  }

  reactiveAdminProfile.value = next
  localStorage.setItem('aaa-admin-profile', JSON.stringify(next))
  if (next.branch) {
    localStorage.setItem('aaa-admin-branch', next.branch)
  }

  // Persist asynchronously to Firestore database
  const targetId =
    next.id || (next.email ? next.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default_admin')
  adminService
    .createAdmin({ ...next, id: targetId })
    .catch((err) => console.warn('Background save to Firestore failed:', err))

  window.dispatchEvent(new CustomEvent('aaa-admin-profile-changed', { detail: next }))
  return next
}

export function useAdminProfile() {
  return {
    adminProfile: reactiveAdminProfile,
    getAdminProfile,
    getAdminBranch,
    saveAdminProfile,
    syncAdminProfileWithDatabase,
  }
}
