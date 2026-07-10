import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAdminProfile, getAdminBranch } from '@/utils/adminBranchHelper'
import notificationSoundUrl from '@/assets/sounds/notification.wav'

const STORAGE_KEY = 'aaa-notification-history'
const MAX_HISTORY_ITEMS = 200

export function getNotificationVolume() {
  try {
    const v = localStorage.getItem('aaa-notification-volume')
    return v !== null ? Number(v) : 1.0
  } catch {
    return 1.0
  }
}

export function setNotificationVolume(val) {
  try {
    const v = Math.max(0, Math.min(1, Number(val)))
    localStorage.setItem('aaa-notification-volume', String(v))
  } catch {
    /* ignore */
  }
}

function playFallbackChime(type = 'success', vol = 1.0) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    const freq = type === 'warning' || type === 'error' ? 440 : 587.33
    const freq2 = type === 'warning' || type === 'error' ? 349.23 : 880

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.12)

    const maxGain = Math.min(1.0, 0.5 * vol)
    gain.gain.setValueAtTime(maxGain, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.start(now)
    osc.stop(now + 0.3)
  } catch {
    // Ignore audio context errors
  }
}

export function playNotificationAlertSound(type = 'success') {
  const vol = getNotificationVolume()
  if (vol <= 0) return
  try {
    const audio = new Audio(notificationSoundUrl)
    audio.volume = vol
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        playFallbackChime(type, vol)
      })
    }
  } catch {
    playFallbackChime(type, vol)
  }
}

export const MODULE_CATEGORIES = [
  { id: 'all', label: 'All Modules', icon: 'navigation/dashboard.svg' },
  { id: 'enrollments', label: 'Enrollments', icon: 'navigation/enrollment.svg' },
  { id: 'trials', label: 'Trials', icon: 'navigation/trial.svg' },
  { id: 'branches', label: 'Branches', icon: 'navigation/branch.svg' },
  { id: 'teachers', label: 'Teachers', icon: 'navigation/parent.svg' },
  { id: 'parents', label: 'Parents', icon: 'navigation/parent.svg' },
  { id: 'students', label: 'Students', icon: 'navigation/student.svg' },
  { id: 'programs', label: 'Programs', icon: 'navigation/program.svg' },
  { id: 'classes', label: 'Classes', icon: 'navigation/class.svg' },
  { id: 'payments', label: 'Payments', icon: 'navigation/dollar.svg' },
  { id: 'terms', label: 'Terms', icon: 'navigation/program.svg' },
]

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref([])
  const history = ref([])
  const isInitialized = ref(false)

  // Initialize from localStorage
  function init() {
    if (isInitialized.value) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          history.value = parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load notification history from localStorage', e)
    } finally {
      isInitialized.value = true
    }
  }

  // Persist to localStorage
  function save() {
    try {
      // Limit to MAX_HISTORY_ITEMS to prevent localStorage overflow
      if (history.value.length > MAX_HISTORY_ITEMS) {
        history.value = history.value.slice(0, MAX_HISTORY_ITEMS)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch (e) {
      console.warn('Failed to save notification history to localStorage', e)
    }
  }

  // Computed counters
  const unreadCount = computed(() => history.value.filter((i) => !i.read).length)

  function getUnreadCountByModule(moduleId) {
    if (moduleId === 'all') return unreadCount.value
    return history.value.filter((i) => !i.read && String(i.module || '').toLowerCase() === String(moduleId || '').toLowerCase()).length
  }

  function getFilteredHistory(moduleId = 'all') {
    if (moduleId === 'all') return history.value
    return history.value.filter((i) => String(i.module || '').toLowerCase() === String(moduleId || '').toLowerCase())
  }

  /**
   * Trigger a new notification alert & toast
   * @param {Object} payload
   * @param {string} payload.title - Notification title
   * @param {string} payload.message - Notification descriptive text
   * @param {string} [payload.type='success'] - 'success' | 'info' | 'warning' | 'error'
   * @param {string} [payload.module='system'] - 'enrollments' | 'payments' | 'students' | 'programs' | 'system'
   * @param {string} [payload.link=null] - Optional URL or route path
   * @param {number} [payload.duration=5000] - Duration in ms before toast auto-dismisses
   */
  function notify({
    title,
    message,
    type = 'success',
    module = 'system',
    link = null,
    admin = null,
    adminBranch = null,
    details = null,
    duration = 5000,
    sound = true,
  }) {
    if (!isInitialized.value) init()

    const rawMod = module || 'System'
    const capitalizedModule = rawMod.toLowerCase() === 'khqr' ? 'KHQR' : rawMod.charAt(0).toUpperCase() + rawMod.slice(1)
    const id = Date.now() + '-' + Math.random().toString(36).substring(2, 7)
    const timestamp = new Date().toISOString()

    const resolvedAdmin = admin || getAdminProfile()?.name || 'Sona Navin'
    const resolvedBranch = adminBranch || getAdminBranch() || 'Tuol Kork Branch'

    const item = {
      id,
      title: title || 'System Notification',
      message: message || '',
      type,
      module: capitalizedModule,
      link,
      admin: resolvedAdmin,
      adminBranch: resolvedBranch,
      details: details || null,
      timestamp,
      read: false,
    }

    // Add to persistent history
    history.value.unshift(item)
    save()

    // Add to active toast popup queue
    toasts.value.push(item)

    // Play notification alert sound when toaster pops up to alert the admin
    if (sound) {
      playNotificationAlertSound(type)
    }

    // Auto remove from toasts
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      toasts.value.splice(idx, 1)
    }
  }

  function markAsRead(id) {
    const item = history.value.find((i) => i.id === id)
    if (item && !item.read) {
      item.read = true
      save()
    }
  }

  function markAllAsRead(moduleId = 'all') {
    let changed = false
    history.value.forEach((i) => {
      if (!i.read && (moduleId === 'all' || i.module === moduleId)) {
        i.read = true
        changed = true
      }
    })
    if (changed) save()
  }

  function deleteNotification(id) {
    const idx = history.value.findIndex((i) => i.id === id)
    if (idx !== -1) {
      history.value.splice(idx, 1)
      save()
    }
  }

  function clearHistory(moduleId = 'all') {
    if (moduleId === 'all') {
      history.value = []
    } else {
      history.value = history.value.filter((i) => i.module !== moduleId)
    }
    save()
  }

  // Automatically init on store creation
  init()

  return {
    toasts,
    history,
    unreadCount,
    getUnreadCountByModule,
    getFilteredHistory,
    init,
    notify,
    removeToast,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearHistory,
    playNotificationAlertSound,
  }
})
