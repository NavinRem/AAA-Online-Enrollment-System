<script setup>
import { useNotificationStore } from '@/stores/notificationStore'
import { getImageUrl } from '@/utils/assetHelper'
import { getModuleBadgeClass } from '@/utils/moduleBadgeUtils'
import AppBadge from '@/components/common/ui/AppBadge.vue'

const notificationStore = useNotificationStore()
const adminFallback = getImageUrl('profiles/avatar-admin-female')

// Map Activity Type string to a valid THEME color key
const getActivityBadgeType = (activityVal) => {
  const v = String(activityVal || '').toLowerCase()
  if (v.includes('create') || v.includes('new')) return 'green'
  if (v.includes('cancel') || v.includes('delete') || v.includes('drop') || v.includes('remove'))
    return 'red'
  if (v.includes('transfer')) return 'purple'
  if (v.includes('payment') || v.includes('paid') || v.includes('process')) return 'magenta'
  if (v.includes('update') || v.includes('edit') || v.includes('status')) return 'blue'
  return 'blue'
}

const typeStyles = {
  success: {
    border: 'border-l-4 border-l-emerald-500 border-outline-std/60',
    iconBg: 'bg-emerald-100 text-emerald-600',
    icon: '✓',
  },
  info: {
    border: 'border-l-4 border-l-blue-500 border-outline-std/60',
    iconBg: 'bg-blue-100 text-blue-600',
    icon: 'ℹ',
  },
  warning: {
    border: 'border-l-4 border-l-amber-500 border-outline-std/60',
    iconBg: 'bg-amber-100 text-amber-600',
    icon: '⚠',
  },
  error: {
    border: 'border-l-4 border-l-rose-500 border-outline-std/60',
    iconBg: 'bg-rose-100 text-rose-600',
    icon: '✕',
  },
}

const handleToastClick = (toast) => {
  // Just dismiss on click instead of navigating
  notificationStore.removeToast(toast.id)
}

const getEnhancedDetails = (toast) => {
  const list =
    toast.details && Array.isArray(toast.details)
      ? toast.details.filter(
          (d) =>
            d &&
            d.label &&
            !d.label.toLowerCase().includes('id') &&
            !d.label.toLowerCase().includes('code'),
        )
      : []
  list.forEach((d) => {
    if (
      d.label &&
      d.label.toLowerCase().includes('branch') &&
      (d.value === 'Main Branch' || !d.value)
    ) {
      d.value = toast.adminBranch || d.value
    }
  })
  const hasBranch = list.some((d) => d.label && d.label.toLowerCase().includes('branch'))
  if (!hasBranch && toast.adminBranch) {
    const insertIdx = list.length > 0 && list[0].label === 'Activity Type' ? 1 : 0
    list.splice(insertIdx, 0, { label: 'Branch', value: toast.adminBranch })
  }
  return list
}
</script>

<template>
  <div
    class="fixed top-20 right-6 z-[9999] flex flex-col gap-3 w-[440px] max-w-[94vw] pointer-events-none"
  >
    <transition-group
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-x-12 opacity-0 scale-95"
      enter-to-class="transform translate-x-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-x-0 opacity-100 scale-100"
      leave-to-class="transform translate-x-12 opacity-0 scale-95"
    >
      <div
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        class="pointer-events-auto bg-white rounded-sm shadow-2xl border p-4 flex items-start gap-3.5 transition-all duration-300 relative overflow-hidden backdrop-blur-md bg-white/95"
        :class="[
          typeStyles[toast.type]?.border || typeStyles.info.border,
          toast.link ? 'cursor-pointer hover:shadow-primary/10 hover:scale-[1.02]' : '',
        ]"
        @click="handleToastClick(toast)"
      >
        <!-- Admin Avatar -->
        <div class="relative flex-shrink-0 mt-0.5">
          <img
            :src="toast.profileURL || adminFallback"
            :alt="toast.admin || 'Admin'"
            class="w-9 h-9 rounded-full object-cover border border-outline-std/60 shadow-2xs"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col gap-1 min-w-0 pr-4">
          <div class="flex items-center justify-between gap-1.5 flex-wrap">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-bold text-content-dark">{{
                toast.admin || 'System Admin'
              }}</span>
              <!-- Admin branch badge with centralized branch lookup -->
              <AppBadge v-if="toast.adminBranch" :branch="toast.adminBranch" />
            </div>
            <!-- Module badge identical to Notification Center -->
            <span
              v-if="toast.module"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-bold shadow-2xs"
              :class="getModuleBadgeClass(toast.module)"
            >
              {{ toast.module }}
            </span>
          </div>

          <p class="text-sm font-semibold text-content-dark">
            {{ toast.title || 'Notification' }}
          </p>
          <p class="text-xs text-content-muted">
            {{ toast.message }}
          </p>

          <!-- Enhanced metadata details row matching Notification Center layout -->
          <div
            v-if="getEnhancedDetails(toast).length > 0"
            class="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-outline-std/50"
          >
            <template v-for="(detail, dIdx) in getEnhancedDetails(toast)" :key="dIdx">
              <!-- Branch: centralized AppBadge branch lookup -->
              <AppBadge
                v-if="detail.label && detail.label.toLowerCase().includes('branch')"
                :branch="detail.value"
              />
              <!-- Activity Type: semantic color -->
              <AppBadge
                v-else-if="detail.label && detail.label.toLowerCase().includes('activity')"
                :status="detail.value"
                :type="getActivityBadgeType(detail.value)"
              />
              <!-- All other detail fields: auto-resolved by badgeUtils -->
              <AppBadge v-else :status="detail.value" />
            </template>
          </div>
        </div>

        <!-- Close button -->
        <button
          @click.stop="notificationStore.removeToast(toast.id)"
          class="absolute top-3 right-3 text-content-muted hover:text-content-dark w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-base leading-none font-bold"
          title="Dismiss"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>
