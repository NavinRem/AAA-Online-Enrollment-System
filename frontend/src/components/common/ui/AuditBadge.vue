<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AppBadge from './AppBadge.vue'
import AppButton from './AppButton.vue'
import { getImageUrl } from '@/utils/assetHelper'
import { useDataStore } from '@/stores/dataStore'
import { getAdminProfile } from '@/utils/adminBranchHelper'
import { formatDate } from '@/utils/formatUtils'

const props = defineProps({
  meta: { type: Object, default: null },
  history: { type: Array, default: () => [] },
  item: { type: Object, default: null },
})

const dataStore = useDataStore()

const effectiveHistory = computed(() => {
  if (props.history && props.history.length > 0) return props.history
  if (props.item?.auditHistory && props.item.auditHistory.length > 0) return props.item.auditHistory
  if (props.meta?.auditHistory && props.meta.auditHistory.length > 0) return props.meta.auditHistory
  if (props.meta && (props.meta.name || props.meta.email)) return [props.meta]
  return []
})

const isOpen = ref(false)
const popoverStyle = ref({})

/* ── Branch Helper ────────────────────────────────────────────────────────── */

const resolveAdminBranch = (entry) => {
  if (!entry) return ''
  let b = entry.branch || entry.adminBranch || entry.branchName
  if (!b && entry.uid) {
    const foundAdmin = dataStore.admins?.find(
      (a) => a.id === entry.uid || a.email === entry.email || a.name === entry.name,
    )
    if (foundAdmin?.branch) b = foundAdmin.branch
  }
  if (!b) {
    const currentAdmin = getAdminProfile()
    if (currentAdmin && (currentAdmin.name === entry.name || currentAdmin.id === entry.uid)) {
      b = currentAdmin.branch
    }
  }
  if (!b) return 'Main'
  if (typeof b === 'object') return b.abbr || b.name || 'Main'
  return b
}

/* ── Timestamp helpers ────────────────────────────────────────────────────── */

const shortTime = computed(() => {
  return formatDate(props.meta?.timestamp)
})

const formatTime = (ts) => {
  return formatDate(ts)
}

const getActivityText = (logItem, idx, totalLen) => {
  if (logItem?.action) return logItem.action
  if (logItem?.activityType) return logItem.activityType
  if (idx === totalLen - 1) return 'Created Record'
  return 'Edited Details'
}

const getActivityClass = (text) => {
  const lower = String(text || '').toLowerCase()
  if (lower.includes('cancel') || lower.includes('drop') || lower.includes('delete')) {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  if (lower.includes('create') || lower.includes('paid')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (lower.includes('transfer')) {
    return 'bg-purple-50 text-purple-700 border-purple-200'
  }
  if (lower.includes('status')) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */

const adminFallback = getImageUrl('profiles/avatar-admin')
const avatarSrc = computed(() => props.meta?.profileURL || adminFallback)
const getAvatarSrc = (url) => url || adminFallback

/* ── Popover open / close ─────────────────────────────────────────────────── */

const listStyle = ref({ maxHeight: '320px' })

const toggleHistory = (event) => {
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - 16
  const spaceAbove = rect.top - 16

  if (spaceBelow < 280 && spaceAbove > spaceBelow) {
    const availableListH = Math.max(140, Math.min(320, spaceAbove - 60))
    popoverStyle.value = {
      bottom: `${window.innerHeight - rect.top + 6}px`,
      top: 'auto',
      left: `${Math.max(10, Math.min(window.innerWidth - 320, rect.left - 20))}px`,
    }
    listStyle.value = { maxHeight: `${availableListH}px` }
  } else {
    const availableListH = Math.max(140, Math.min(320, spaceBelow - 60))
    popoverStyle.value = {
      top: `${rect.bottom + 6}px`,
      bottom: 'auto',
      left: `${Math.max(10, Math.min(window.innerWidth - 320, rect.left - 20))}px`,
    }
    listStyle.value = { maxHeight: `${availableListH}px` }
  }
  isOpen.value = true
}

const closeOnOutside = (e) => {
  if (!isOpen.value) return
  if (e.target.closest?.('[data-audit-popover]')) return
  isOpen.value = false
}

const closeOnScroll = (e) => {
  if (!isOpen.value) return
  if (e.target?.closest && e.target.closest('[data-audit-popover]')) return
  isOpen.value = false
}

onMounted(() => {
  window.addEventListener('mousedown', closeOnOutside)
  window.addEventListener('scroll', closeOnScroll, true)
})
onUnmounted(() => {
  window.removeEventListener('mousedown', closeOnOutside)
  window.removeEventListener('scroll', closeOnScroll, true)
})
</script>

<template>
  <!-- ── POPULATED: clickable admin identity card ─────────────────────────── -->
  <div
    v-if="meta && meta.name"
    class="ui-audit-badge group"
    data-audit-badge
    title="Click to view full audit activity trail"
    @click.stop="toggleHistory($event)"
  >
    <!-- Avatar -->
    <div class="relative flex-shrink-0">
      <div class="ui-stack-item transition-transform">
        <img :src="avatarSrc" alt="admin" class="w-full h-full object-cover" />
      </div>
      <!-- Live indicator dot -->
      <span
        class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white shadow-sm"
      />
    </div>

    <!-- Name + branch + timestamp -->
    <div class="ui-identity-info min-w-0">
      <div class="flex items-center gap-xs">
        <span
          class="font-bold text-sm text-content-dark truncate group-hover:text-primary transition-colors"
        >
          {{ meta.name }}
        </span>
        <AppBadge v-if="resolveAdminBranch(meta)" :branch="resolveAdminBranch(meta)" />
      </div>
      <span class="ui-cell-muted truncate">{{ shortTime || 'Just now' }}</span>
    </div>
  </div>

  <!-- ── FALLBACK: system / pre-audit record ──────────────────────────────── -->
  <div
    v-else
    class="ui-audit-badge opacity-80 cursor-pointer group hover:opacity-100 transition-opacity"
    data-audit-badge
    title="Click to view full audit activity trail"
    @click.stop="toggleHistory($event)"
  >
    <div class="ui-stack-item flex-shrink-0">
      <img :src="adminFallback" alt="system" class="w-full h-full object-cover" />
    </div>
    <div class="ui-identity-info min-w-0">
      <span class="font-bold text-sm text-content-dark truncate group-hover:text-primary transition-colors">System Initial</span>
      <span class="ui-cell-muted">Automated</span>
    </div>
  </div>

  <!-- ── AUDIT TRAIL LOG POPOVER ──────────────────────────────────────────── -->
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="ui-audit-popover"
        data-audit-popover
        :style="popoverStyle"
        @click.stop
      >
        <!-- Header -->
        <div class="ui-audit-popover-header">
          <div class="flex items-center gap-xs">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span class="ui-audit-popover-title">Audit Trail Log</span>
          </div>
          <AppButton variant="ghost" size="xs" icon-only @click="isOpen = false">✕</AppButton>
        </div>

        <!-- Chronological list, newest first -->
        <div class="flex flex-col gap-sm overflow-y-auto pr-xs custom-scrollbar" :style="listStyle">
          <template v-if="effectiveHistory && effectiveHistory.length > 0">
            <div
              v-for="(logItem, idx) in [...effectiveHistory].reverse()"
              :key="idx"
              class="ui-audit-log-item"
            >
              <div class="ui-stack-item flex-shrink-0 mt-0.5">
                <img
                  :src="getAvatarSrc(logItem.profileURL)"
                  :alt="logItem.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="ui-identity-info min-w-0 flex-1">
                <div class="flex flex-col items-start justify-between">
                  <span class="font-bold text-sm text-content-dark truncate">{{
                    logItem.name || 'Admin'
                  }}</span>
                  <span class="font-semibold text-xs text-content-muted flex-shrink-0">{{
                    formatTime(logItem.timestamp)
                  }}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-extrabold border"
                    :class="
                      getActivityClass(getActivityText(logItem, idx, effectiveHistory.length))
                    "
                  >
                    {{ getActivityText(logItem, idx, effectiveHistory.length) }}
                  </span>
                  <AppBadge
                    v-if="resolveAdminBranch(logItem)"
                    :branch="resolveAdminBranch(logItem)"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- No history yet — show fallback -->
          <template v-else-if="meta && meta.name">
            <div class="ui-audit-log-item">
              <div class="ui-stack-item flex-shrink-0 mt-0.5">
                <img :src="avatarSrc" :alt="meta.name" class="w-full h-full object-cover" />
              </div>
              <div class="ui-identity-info min-w-0 flex-1">
                <div class="flex flex-col items-start justify-between gap-xs">
                  <span class="font-bold text-sm text-content-dark truncate">{{ meta.name }}</span>
                  <span class="font-bold text-xs text-primary flex-shrink-0">{{
                    formatTime(meta.timestamp)
                  }}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    Created Record
                  </span>
                  <AppBadge v-if="resolveAdminBranch(meta)" :branch="resolveAdminBranch(meta)" />
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="ui-audit-log-item">
              <div class="ui-stack-item flex-shrink-0 mt-0.5">
                <img :src="adminFallback" alt="system" class="w-full h-full object-cover" />
              </div>
              <div class="ui-identity-info min-w-0 flex-1">
                <div class="flex flex-col items-start justify-between gap-xs">
                  <span class="font-bold text-sm text-content-dark truncate">System Initial</span>
                  <span class="font-bold text-xs text-content-muted flex-shrink-0">{{
                    formatTime(meta?.timestamp || item?.createdAt || item?.enrollAt)
                  }}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-extrabold border bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Automated Record
                  </span>
                  <AppBadge branch="Main" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
