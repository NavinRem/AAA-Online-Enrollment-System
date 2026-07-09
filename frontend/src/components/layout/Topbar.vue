<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { paymentService } from '@/services/paymentService'
import {  getIconUrl } from '@/utils/assetHelper'
import { getAvatarUrl } from '@/utils/profileHelper'
import SearchBox from '@/components/common/data/SearchBox.vue'
import { useNotificationStore } from '@/stores/notificationStore'
import NotificationCenter from '@/components/layout/NotificationCenter.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AdminProfileModal from '@/components/layout/AdminProfileModal.vue'
import { getAdminProfile, getAdminBranch } from '@/utils/adminBranchHelper'


const route = useRoute()
const searchQuery = ref('')
const userProfile = computed(() => getAdminProfile())
const userName = computed(() => getAdminProfile()?.name || 'Administrator')
const userRole = computed(() => getAdminProfile()?.role || 'Admin')
const showProfileModal = ref(false)
const currentAdminBranch = computed(() => getAdminBranch())


// Notification Center State
const notifStore = useNotificationStore()
const showNotifications = ref(false)
const pendingOnlinePayments = ref([])
const notifRef = ref(null)

const handleOutsideClick = (e) => {
  if (
    notifRef.value &&
    !notifRef.value.contains(e.target) &&
    !e.target.closest('.notif-filter-dropdown')
  ) {
    showNotifications.value = false
  }
}

const loadNotifications = async () => {
  try {
    const allPayments = await paymentService.getAllPayments()
    if (Array.isArray(allPayments)) {
      pendingOnlinePayments.value = allPayments.filter((p) => {
        const method = String(p.method || p.paymentMethod || '').toLowerCase()
        const status = String(p.paymentStatus || p.status || '').toLowerCase()
        return method !== 'cash' && ['pending', 'unpaid', 'verifying'].includes(status)
      })
    }
  } catch (e) {
    console.warn('Failed to load notification badge', e)
  }
}

const emit = defineEmits(['toggle-menu'])

const pageTitle = computed(() => route.meta.title)
const avatarUrl = computed(() => getAvatarUrl(userProfile.value))

onMounted(() => {
  loadNotifications()
  const notifInterval = setInterval(loadNotifications, 15000)
  window.addEventListener('mousedown', handleOutsideClick)
  onUnmounted(() => {
    clearInterval(notifInterval)
    window.removeEventListener('mousedown', handleOutsideClick)
  })
})
</script>

<template>
  <header class="topbar-root">
    <div class="flex items-center gap-md">
      <button
        class="lg:hidden flex flex-col items-center justify-center gap-1 w-10 h-10 bg-white shadow-sm rounded-std"
        @click="emit('toggle-menu')"
      >
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
      </button>
      <h1 class="topbar-title">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="hidden lg:flex flex-1 max-w-lg mx-12">
      <SearchBox v-model="searchQuery" placeholder="Search something..." variant="white" />
    </div>

    <div class="flex items-center gap-md">
      <!-- Interactive Notification Bell -->
      <div class="relative" ref="notifRef">
        <button
          @click="showNotifications = !showNotifications"
          class="topbar-action-btn relative"
          :class="{ 'ring-2 ring-primary/20 bg-primary/5': showNotifications }"
        >
          <img
            :src="getIconUrl('action', 'bell-svgrepo.svg')"
            alt="Notifications"
            class="w-5 opacity-60 transition-transform"
            :class="{
              'animate-shake': notifStore.unreadCount > 0 && !showNotifications,
            }"
          />
          <span
            v-if="notifStore.unreadCount > 0"
            class="absolute -top-1 -right-1 bg-rose-500 text-white text-3xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs"
          >
            {{ notifStore.unreadCount }}
          </span>
        </button>

        <!-- Notification Popover -->
        <NotificationCenter :isOpen="showNotifications" @close="showNotifications = false" />
      </div>

      <button class="topbar-action-btn">
        <img :src="getIconUrl('navigation', 'setting.svg')" alt="Settings" class="w-5 opacity-60" />
      </button>

      <div
        class="topbar-user-pill"
        @click="showProfileModal = true"
        title="Click to view & update Administrator Profile and Assigned Branch"
      >
        <div class="flex flex-col text-right justify-center items-end gap-0.5">
          <span class="font-bold text-sm text-content-dark leading-tight">{{
            userName || 'Administrator'
          }}</span>
          <AppBadge v-if="currentAdminBranch" :branch="currentAdminBranch" />
          <span v-else class="text-2xs font-bold text-content-muted tracking-wider">No Branch</span>
        </div>
        <div class="topbar-user-avatar">
          <img :src="avatarUrl" alt="Profile" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>

    <AdminProfileModal
      :isOpen="showProfileModal"
      @close="showProfileModal = false"
      @saved="
        (saved) => {
          userName = saved.name
          userRole = saved.role
        }
      "
    />
  </header>
</template>
<style scoped>
.topbar-root {
  @apply flex items-center justify-between p-4 px-8 bg-surface-light/95 w-full sticky top-0 z-50 backdrop-blur-md border-b border-surface-light/50;
}

.topbar-title {
  @apply text-2xl font-bold text-content-dark whitespace-nowrap tracking-tight;
}

.topbar-action-btn {
  @apply hidden sm:flex bg-white w-10 h-10 rounded-full items-center justify-center shadow-md shadow-black/5 cursor-pointer transition-all;
}

.topbar-action-btn:hover {
  @apply bg-white ring-4 ring-primary/5;
}

.topbar-user-pill {
  @apply flex items-center gap-sm bg-white p-1.5 pl-6 rounded-full shadow-md shadow-black/5 ml-sm border border-outline-std/50 cursor-pointer;
}

.topbar-user-pill:hover {
  @apply border-primary/20;
}

.topbar-user-avatar {
  @apply w-10 h-10 rounded-full overflow-hidden border border-outline-std/50 bg-primary/5 transition-transform;
}

.group:hover .topbar-user-avatar {
  @apply scale-105;
}
</style>
