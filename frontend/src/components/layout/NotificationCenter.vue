<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore, MODULE_CATEGORIES } from '@/stores/notificationStore'
import { useDataStore } from '@/stores/dataStore'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getActionIcon, getIconUrl, getImageUrl } from '@/utils/assetHelper'
import { getModuleBadgeClass } from '@/utils/moduleBadgeUtils'
import { formatDate } from '@/utils/formatUtils'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const router = useRouter()
const notifStore = useNotificationStore()
const dataStore = useDataStore()

// Map an Activity Type string to a valid THEME color key
const getActivityBadgeType = (activityVal) => {
  const v = String(activityVal || '').toLowerCase()
  if (v.includes('create') || v.includes('new')) return 'green'
  if (v.includes('cancel') || v.includes('delete') || v.includes('drop') || v.includes('remove')) return 'red'
  if (v.includes('transfer')) return 'purple'
  if (v.includes('payment') || v.includes('paid') || v.includes('process')) return 'magenta'
  if (v.includes('update') || v.includes('edit') || v.includes('status')) return 'blue'
  return 'blue'
}

const activeModuleFilter = ref('all')
const isFilterOpen = ref(false)
const filterRef = ref(null)
const filterMenuStyles = ref({})
// true = only unread (default), false = all
const showUnreadOnly = ref(true)

const activeFilterLabel = computed(() => {
  const found = MODULE_CATEGORIES.find((m) => m.id === activeModuleFilter.value)
  return found ? found.label : 'All Modules'
})

// Notifications to display: apply module filter, then optionally unread-only
const displayedNotifications = computed(() => {
  const base = notifStore.getFilteredHistory(activeModuleFilter.value)
  return showUnreadOnly.value ? base.filter((i) => !i.read) : base
})

const displayedCount = computed(() => displayedNotifications.value.length)

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) isFilterOpen.value = false
  },
)

const toggleFilter = (event) => {
  if (isFilterOpen.value) {
    isFilterOpen.value = false
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  filterMenuStyles.value = {
    top: `${rect.bottom + 6}px`,
    left: `${Math.max(10, rect.right - 200)}px`,
    width: '200px',
  }
  isFilterOpen.value = true
}

// Full date + time format centralized in formatUtils
const formatFullTime = (isoString) => formatDate(isoString)

const adminFallback = getImageUrl('profiles/avatar-admin-female')
const getAdminAvatar = (item) => item.profileURL || adminFallback

const getActionVerb = (item) => {
  const title = String(item.title || '').toLowerCase()
  const act = item.details?.find((d) => d.label === 'Activity Type')?.value
  if (act) {
    const actLower = String(act).toLowerCase()
    if (actLower.includes('create')) return 'created a new record in'
    if (actLower.includes('delete') || actLower.includes('remove')) return 'deleted a record in'
    if (actLower.includes('payment') || actLower.includes('process')) return 'processed payment in'
    if (actLower.includes('transfer')) return 'transferred a session in'
    if (actLower.includes('update')) return 'updated details in'
    return actLower + ' in'
  }
  if (title.includes('create') || title.includes('new')) return 'created a new record in'
  if (title.includes('delete') || title.includes('remove')) return 'deleted a record in'
  if (title.includes('payment') || title.includes('process')) return 'processed payment in'
  return 'updated details in'
}

/**
 * JS Function Logic to determine Badge color & properties for notification detail items.
 * Easily adjust colors or status mappings below based on label, value, or module.
 */
const getDetailBadgeConfig = (detail, item = null) => {
  const label = String(detail?.label || '').toLowerCase()
  const val = String(detail?.value || '')
  const valLower = val.toLowerCase()

  // 1. Branch badge -> resolve via branch prop
  if (label.includes('branch')) {
    return { branch: detail.value }
  }

  // 2. Activity Type badge -> use semantic activity color mapping
  if (label.includes('activity')) {
    return { status: detail.value, type: getActivityBadgeType(detail.value) }
  }

  // 3. Status or Payment Status -> explicit semantic status colors
  if (label.includes('status') || label.includes('payment')) {
    if (
      valLower.includes('unpaid') ||
      valLower.includes('pending') ||
      valLower.includes('hold') ||
      valLower.includes('suspended')
    ) {
      return { status: detail.value, type: 'yellow' }
    }
    if (
      valLower.includes('cancel') ||
      valLower.includes('drop') ||
      valLower.includes('failed') ||
      valLower.includes('stopped')
    ) {
      return { status: detail.value, type: 'red' }
    }
    if (
      valLower.includes('trial') ||
      valLower.includes('partial') ||
      valLower.includes('transfer')
    ) {
      return { status: detail.value, type: 'purple' }
    }
    if (
      valLower.includes('paid') ||
      valLower === 'active' ||
      valLower.includes('studying') ||
      valLower.includes('success') ||
      valLower.includes('completed')
    ) {
      return { status: detail.value, type: 'green' }
    }
  }

  // 4. Financial Amount ($ amounts) -> colored badges (full / partial) for enrollments
  if (label.includes('amount') || val.startsWith('$')) {
    const isEnrollment =
      String(item?.module || '').toLowerCase() === 'enrollments' ||
      String(item?.link || '').includes('/enrollments')

    let modeType = detail?.colorValue || null

    // If enrollment and modeType not attached, fetch from enrollment records in dataStore
    if (isEnrollment && !modeType) {
      const list = dataStore.enrollments || []
      let linkSearch = ''
      if (item?.link && item.link.includes('search=')) {
        try {
          linkSearch = decodeURIComponent(item.link.split('search=')[1].split('&')[0]).toLowerCase()
        } catch { /* empty */ }
      }
      const nameDetail = item?.details?.find((d) => d.label && d.label.includes('Name'))?.value
      const progDetail = item?.details?.find((d) => d.label && d.label.includes('Program'))?.value
      const amtNumber = Number(String(val).replace(/[^0-9.]/g, ''))

      const match = list.find((e) => {
        if (
          linkSearch &&
          (String(e.id).toLowerCase() === linkSearch ||
            String(e.studentName || e.student?.name || '').toLowerCase() === linkSearch)
        ) {
          return true
        }
        const eName = String(e.studentName || e.student?.name || '').toLowerCase()
        const nMatch = nameDetail && eName && eName.includes(String(nameDetail).toLowerCase())
        const eProg = String(e.programName || e.program?.name || '').toLowerCase()
        const pMatch = progDetail && eProg && eProg.includes(String(progDetail).toLowerCase())
        if (nMatch && pMatch) return true
        if (nMatch && !isNaN(amtNumber) && Number(e.amount) === amtNumber) return true
        return false
      })

      if (match) {
        modeType = match.paymentModeType || (match.isProrated ? 'partial' : 'full')
      } else {
        // Default enrollment amount badge to full ('magenta') if no matching record found
        modeType = 'full'
      }
    }

    if (modeType) {
      return {
        status: detail.value,
        colorValue: modeType,
        type: 'finance',
      }
    }

    return { status: detail.value, type: 'gray' }
  }

  // 5. Term / Schedule / Program / Class / Subject -> neutral gray badge
  if (
    label.includes('term') ||
    label.includes('schedule') ||
    label.includes('program') ||
    label.includes('class') ||
    label.includes('subject') ||
    label.includes('name')
  ) {
    return { status: detail.value, type: 'gray' }
  }

  // 6. Default fallback -> resolves color via global badge registry
  return { status: detail.value }
}

const handleLocateRecord = (item) => {
  notifStore.markAsRead(item.id)
  if (item.link) {
    let targetLink = item.link
    if (targetLink.includes('search=')) {
      targetLink = targetLink.replace('search=', 'highlight=')
    } else if (!targetLink.includes('?')) {
      const targetVal =
        item.details?.find((d) => d.label && d.label.includes('Name'))?.value ||
        item.details?.[0]?.value
      if (targetVal && String(targetVal) !== 'Created Record' && String(targetVal) !== 'Updated Record Details') {
        targetLink += `?highlight=${encodeURIComponent(String(targetVal))}`
      }
    }
    router.push(targetLink)
    emit('close')
  }
}

const getEnhancedDetails = (item) => {
  const list =
    item.details && Array.isArray(item.details)
      ? item.details.filter(
          (d) =>
            d &&
            d.label &&
            !d.label.toLowerCase().includes('id') &&
            !d.label.toLowerCase().includes('code'),
        )
      : []
  list.forEach((d) => {
    if (d.label && d.label.toLowerCase().includes('branch') && (d.value === 'Main Branch' || !d.value)) {
      d.value = item.adminBranch || d.value
    }
  })
  const hasBranch = list.some((d) => d.label && d.label.toLowerCase().includes('branch'))
  if (!hasBranch && item.adminBranch) {
    const insertIdx = list.length > 0 && list[0].label === 'Activity Type' ? 1 : 0
    list.splice(insertIdx, 0, { label: 'Branch', value: item.adminBranch })
  }
  return list
}

const handleOutsideFilterClick = (e) => {
  if (
    isFilterOpen.value &&
    filterRef.value &&
    !filterRef.value.contains(e.target) &&
    !e.target.closest('.notif-filter-dropdown')
  ) {
    isFilterOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleOutsideFilterClick)
  // Ensure branches and enrollments are loaded so badge colors can be resolved
  if (dataStore.branches.length === 0) {
    dataStore.fetchBranches()
  }
  if (dataStore.enrollments.length === 0) {
    dataStore.fetchEnrollments()
  }
})
onUnmounted(() => window.removeEventListener('mousedown', handleOutsideFilterClick))
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
    <div
      v-if="isOpen"
      class="absolute right-0 mt-3 w-[94vw] sm:w-[480px] md:w-[560px] lg:w-[600px] bg-white rounded-md shadow-2xl border border-outline-std z-50 overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- ── Header ────────────────────────────────────────────────────────── -->
      <div
        class="flex items-center justify-center relative border-b border-outline-std bg-surface-subtle py-3 px-4"
      >
        <h3 class="text-lg text-content-dark">Notifications</h3>
      </div>

      <!-- ── Controls Bar ──────────────────────────────────────────────────── -->
      <div
        class="px-4 py-2.5 bg-white border-b border-outline-std/60 flex items-center justify-between gap-3 text-sm font-semibold"
      >
        <!-- Left: count + toggle unread/all + mark all read -->
        <div class="flex items-center gap-2 text-content-muted text-sm flex-wrap">
          <span>
            Showing
            <strong class="text-content-dark font-bold">{{ displayedCount }}</strong>
            {{ showUnreadOnly ? 'unread' : 'total' }}
          </span>
          <span class="text-outline-std/60 mx-0.5">|</span>
          <!-- Toggle between unread-only and all -->
          <AppButton
            size="xs"
            :variant="showUnreadOnly ? 'primary' : 'secondary'"
            @click="showUnreadOnly = !showUnreadOnly"
          >
            {{ showUnreadOnly ? 'Show all' : 'Unread only' }}
          </AppButton>
          <AppButton
            v-if="notifStore.unreadCount > 0"
            size="xs"
            variant="primary"
            @click="notifStore.markAllAsRead(activeModuleFilter)"
          >
            Mark all read
          </AppButton>
        </div>

        <!-- Right: Module filter button -->
        <div class="relative flex-shrink-0" ref="filterRef">
          <AppButton
            :variant="activeModuleFilter === 'all' ? 'secondary' : 'ghost'"
            size="md"
            class="!rounded-md transition-all shadow-xs !py-1.5 !px-3.5"
            :class="{
              '!bg-primary !text-white shadow-md hover:!bg-primary/90':
                activeModuleFilter !== 'all',
            }"
            @click.stop="toggleFilter($event)"
          >
            <img
              :src="getActionIcon('filter')"
              class="w-4 h-4 transition-all"
              :class="
                activeModuleFilter !== 'all' ? 'brightness-0 invert opacity-100' : 'opacity-70'
              "
            />
            <span
              class="font-bold text-sm"
              :class="{ 'text-white': activeModuleFilter !== 'all' }"
              >{{ activeFilterLabel }}</span
            >
          </AppButton>

          <!-- Filter dropdown — teleported so it escapes overflow:hidden -->
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
                v-if="isFilterOpen"
                class="notif-filter-dropdown fixed bg-white rounded-sm shadow-2xl border border-outline-std max-h-72 overflow-y-auto divide-y divide-outline-std/20 z-[9999]"
                :style="filterMenuStyles"
                @click.stop
                @mousedown.stop
              >
                <div
                  v-for="mod in MODULE_CATEGORIES"
                  :key="mod.id"
                  @click="((activeModuleFilter = mod.id), (isFilterOpen = false))"
                  class="px-3 py-2.5 text-sm font-semibold cursor-pointer flex items-center justify-between transition-colors gap-2"
                  :class="
                    activeModuleFilter === mod.id
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'text-content-dark hover:bg-surface-subtle'
                  "
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img
                      v-if="mod.icon"
                      :src="getIconUrl(mod.icon)"
                      :alt="mod.label"
                      class="w-4 h-4 flex-shrink-0 transition-all"
                      :class="[
                        activeModuleFilter === mod.id
                          ? 'opacity-100 !grayscale-0 brightness-0 invert'
                          : 'opacity-60',
                      ]"
                    />
                    <span class="truncate">{{ mod.label }}</span>
                  </div>
                  <span
                    v-if="notifStore.getUnreadCountByModule(mod.id) > 0"
                    :class="
                      activeModuleFilter === mod.id
                        ? 'bg-white text-primary font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 text-3xs'
                        : 'bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 text-3xs'
                    "
                  >
                    {{ notifStore.getUnreadCountByModule(mod.id) }}
                  </span>
                </div>
              </div>
            </transition>
          </Teleport>
        </div>
      </div>

      <!-- ── Notification Rows ─────────────────────────────────────────────── -->
      <div class="max-h-[580px] overflow-y-auto p-3 flex flex-col gap-2.5 flex-1 bg-slate-50/40">
        <div
          v-for="item in displayedNotifications"
          :key="item.id"
          @click="handleLocateRecord(item)"
          class="p-3.5 rounded-md border border-outline-std/70 transition-all flex items-start gap-3.5 relative group shadow-2xs cursor-pointer"
          :class="[
            !item.read
              ? 'bg-primary/[0.04] border-primary/30'
              : 'bg-white hover:border-outline-std',
          ]"
        >
          <div class="relative flex-shrink-0 mt-0.5">
            <!-- Admin Profile Avatar on the left -->
            <img
              :src="getAdminAvatar(item)"
              :alt="item.admin || 'Admin'"
              class="w-10 h-10 rounded-full object-cover border border-outline-std/60 shadow-2xs"
            />
            <!-- Unread dot indicator -->
            <div
              v-if="!item.read"
              class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-2xs"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 flex flex-col gap-1.5">
            <!-- Row 1: Admin Name + Branch + Action Verb + Module Badge inline to prevent awkward overflow wrapping -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-1.5 flex-wrap leading-snug min-w-0 flex-1">
                <span class="font-bold text-sm text-content-dark">{{
                  item.admin || 'System Admin'
                }}</span>
                <!-- Admin branch badge: centralized branch lookup -->
                <AppBadge
                  v-if="item.adminBranch"
                  :branch="item.adminBranch"
                />
                <span class="text-sm text-content-muted">{{ getActionVerb(item) }}</span>
                <!-- Module badge inline with action phrase so it flows naturally -->
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-bold shadow-2xs"
                  :class="getModuleBadgeClass(item.module)"
                >
                  {{ item.module }}
                </span>
              </div>
            </div>

            <!-- Row 2: Subtitle time -->
            <div class="flex items-center gap-1.5 text-xs text-content-muted font-medium">
              <span class="tabular-nums">{{ formatFullTime(item.timestamp) }}</span>
            </div>

            <!-- Row 3: Embedded Detail Card formatted cleanly without clipping -->
            <div
              @click.stop="handleLocateRecord(item)"
              class="mt-1 rounded-md border border-outline-std/80 bg-primary-soft p-3 flex items-start justify-between gap-3 shadow-2xs group/card hover:border-primary/40 transition-all cursor-pointer"
            >
              <!-- Icon Box -->
              <div
                class="w-9 h-9 rounded-md bg-white border border-outline-std flex items-center justify-center text-primary font-bold shadow-2xs flex-shrink-0 mt-0.5"
              >
                <span class="text-base">📄</span>
              </div>

              <!-- Main Info & Metadata Summary -->
              <div class="flex-1 min-w-0 flex flex-col gap-2">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="font-bold text-sm text-content-dark leading-snug break-words">
                    {{ item.title }}
                  </span>
                  <span
                    v-if="item.message"
                    class="text-xs text-content-muted leading-relaxed break-words line-clamp-2"
                  >
                    {{ item.message }}
                  </span>
                </div>
                <div
                  v-if="getEnhancedDetails(item).length > 0"
                  class="flex items-center gap-1.5 flex-wrap"
                >
                  <AppBadge
                    v-for="(detail, dIdx) in getEnhancedDetails(item)"
                    :key="dIdx"
                    v-bind="getDetailBadgeConfig(detail, item)"
                  />
                </div>
              </div>

              <!-- Action button right -->
              <div
                class="w-7 h-7 rounded-md flex items-center justify-center text-content-muted group-hover/card:text-content-dark transition-colors flex-shrink-0 mt-0.5"
                title="View details"
              >
                <span class="text-base font-bold">↗</span>
              </div>
            </div>
          </div>

          <!-- Delete single notification -->
          <button
            @click.stop="notifStore.deleteNotification(item.id)"
            class="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-error-soft hover:text-error transition-all duration-200 flex-shrink-0 self-start mt-0.5"
            title="Remove this notification"
          >
            ×
          </button>
        </div>

        <!-- Empty state -->
        <div
          v-if="displayedCount === 0"
          class="p-12 text-center flex flex-col items-center justify-center gap-2"
        >
          <div class="mb-2">
            <!-- All caught up -->
            <svg
              v-if="showUnreadOnly"
              class="w-10 h-10 text-emerald-500"
              viewBox="0 0 40 40"
              fill="none"
            >
              <!-- Circle drawing -->
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-dasharray="100"
                stroke-dashoffset="100"
                class="animate-draw-circle"
              />

              <!-- Tick drawing -->
              <path
                d="M12 20.5L17.5 26L29 14"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-dasharray="30"
                stroke-dashoffset="30"
                class="animate-draw-check"
              />
            </svg>

            <!-- No notifications -->
            <svg
              v-else
              class="w-10 h-10 text-primary origin-top animate-bell-ring"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <path d="M10 21h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>

          <span class="text-sm font-bold text-content-dark">
            {{ showUnreadOnly ? 'All caught up!' : 'No notifications' }}
          </span>

          <span class="text-sm text-content-muted">
            {{
              showUnreadOnly
                ? 'No unread notifications. Switch to "Show all" to view history.'
                : 'No notifications in this module category.'
            }}
          </span>

          <AppButton
            v-if="showUnreadOnly && notifStore.getFilteredHistory(activeModuleFilter).length > 0"
            size="xs"
            variant="secondary"
            class="mt-2"
            @click="showUnreadOnly = false"
          >
            Show all history
          </AppButton>
        </div>
      </div>
    </div>
  </transition>
</template>
