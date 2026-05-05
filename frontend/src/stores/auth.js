import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isParent = computed(() => profile.value?.role === 'parent')
  const isTeacher = computed(() => profile.value?.role === 'teacher')

  const userRole = computed(() => profile.value?.role || 'guest')
  const userName = computed(() => profile.value?.name || user.value?.displayName || 'User')

  async function fetchProfile() {
    if (!user.value) return null
    try {
      const data = await authService.getMe()
      profile.value = data
      return data
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      if (error.status === 401) {
        console.warn('Session invalid, logging out...')
        await logout()
      }
      profile.value = null
      return null
    }
  }

  function setUser(firebaseUser) {
    user.value = firebaseUser
    if (!firebaseUser) {
      profile.value = null
    }
  }

  let authListenerAttached = false
  let initPromise = null

  async function init() {
    if (initialized.value) return user.value
    if (initPromise) return initPromise
    
    initPromise = new Promise((resolve) => {
      if (authListenerAttached) {
        // If listener is already attached but not initialized yet, 
        // we just wait for the initialized flag to change.
        // This shouldn't happen with the current logic but for safety:
        const unwatch = watch(initialized, (val) => {
          if (val) {
            unwatch()
            resolve(user.value)
          }
        })
        return
      }

      authListenerAttached = true
      authService.onAuthStateChanged(async (firebaseUser) => {
        setUser(firebaseUser)
        if (firebaseUser) {
          await fetchProfile()
        }
        loading.value = false
        
        if (!initialized.value) {
          initialized.value = true
          initPromise = null
          resolve(firebaseUser)
        }
      })
    })

    return initPromise
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  return {
    user,
    profile,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    isParent,
    isTeacher,
    userRole,
    userName,
    fetchProfile,
    setUser,
    init,
    logout
  }
})
