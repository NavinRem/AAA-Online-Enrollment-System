<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { paymentService } from '@/services/paymentService'
import { formatPrice } from '@/utils/formatUtils'

import { getImageUrl, getIconUrl } from '@/utils/assetHelper'
import { getAvatarUrl } from '@/utils/profileHelper'
import SearchBox from '@/components/common/data/SearchBox.vue'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const userProfile = ref(null)
const userName = ref('Loading...')
const userRole = ref('...')

// Notification Center State
const showNotifications = ref(false)
const pendingOnlinePayments = ref([])
const notifRef = ref(null)

const handleOutsideClick = (e) => {
  if (notifRef.value && !notifRef.value.contains(e.target)) {
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

// Demo Helper: Trigger mock notification during presentation
const addDemoNotification = () => {
  pendingOnlinePayments.value.unshift({
    id: 'demo-' + Date.now(),
    receiptId: 'KHQR-' + Math.floor(1000 + Math.random() * 9000),
    parent: { name: 'Sophie Lam' },
    student: { name: 'Timmy Lam' },
    program: { name: 'Piano For Kids' },
    session: 'Sunday (9:00 AM)',
    branchId: 'AEON',
    amount: 81.82,
    transactionId: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
    status: 'pending',
    date: new Date().toISOString(),
  })
}

const emit = defineEmits(['toggle-menu'])

const pageTitle = computed(() => route.meta.title)
const avatarUrl = computed(() => getAvatarUrl(userProfile.value))

onMounted(() => {
  authService.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const profile = await authService.getUserProfile(user.uid)
        if (profile) {
          userProfile.value = profile
          userName.value = profile.name
          userRole.value = profile.role
        }
      } catch (e) {
        console.warn('Failed to load profile for topbar', e)
        userName.value = 'User'
        userRole.value = 'Unknown'
      }
    } else {
      userName.value = 'Guest'
      userRole.value = 'Guest'
      userProfile.value = {
        profileURL: getImageUrl('profiles', 'avatar-guest'),
        role: 'Guest',
      }
    }
  })
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
            :class="{ 'animate-bounce opacity-100': pendingOnlinePayments.length > 0 }"
          />
          <span
            v-if="pendingOnlinePayments.length > 0"
            class="absolute -top-1 -right-1 bg-rose-500 text-white text-2xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse"
          >
            {{ pendingOnlinePayments.length }}
          </span>
        </button>

        <!-- Notification Popover -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showNotifications"
            class="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-md shadow-2xl border border-outline-std z-dropdown overflow-hidden"
            @click.stop
          >
            <div
              class="p-4 bg-surface-subtle border-b border-outline-std flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-content-dark">Pending KHQR Verification</span>
                <span
                  v-if="pendingOnlinePayments.length > 0"
                  class="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full"
                >
                  {{ pendingOnlinePayments.length }} Required
                </span>
              </div>
              <button
                @click="addDemoNotification"
                class="text-2xs text-primary font-bold hover:underline bg-primary/10 px-2 py-1 rounded-md"
                title="Click to simulate incoming bank payment alert"
              >
                + Demo Alert
              </button>
            </div>

            <div class="max-h-96 overflow-y-auto divide-y divide-outline-std/50">
              <div
                v-for="item in pendingOnlinePayments"
                :key="item.id"
                class="p-4 hover:bg-primary/5 transition-colors flex flex-col gap-2.5"
              >
                <!-- Top Row: Bank Badge, Ref, Date -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider"
                    >
                      📱 KHQR Online
                    </span>
                    <span
                      v-if="item.branchId"
                      class="text-2xs font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded"
                    >
                      {{ item.branchId }}
                    </span>
                  </div>
                  <span class="text-xs font-mono font-bold text-content-muted">
                    Trans Ref: {{ item.transactionId || 'N/A' }}
                  </span>
                </div>

                <!-- Middle Row: Parent, Student, Amount -->
                <div
                  class="flex items-center justify-between bg-surface-subtle/60 p-2.5 rounded-lg border border-outline-std/40"
                >
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-content-dark"
                      >Parent: {{ item.parent?.name || 'Parent' }}</span
                    >
                    <span class="text-xs font-semibold text-content-muted"
                      >Student:
                      <strong class="text-content-dark">{{
                        item.student?.name || 'Student'
                      }}</strong></span
                    >
                  </div>
                  <div class="flex flex-col items-end">
                    <span class="text-2xs uppercase font-bold text-content-muted">Amount Due</span>
                    <span class="text-lg font-black text-emerald-600"
                      >${{ formatPrice(item.amount) }}</span
                    >
                  </div>
                </div>

                <!-- Bottom Row: Program detail & Action button -->
                <div class="flex items-center justify-between pt-1">
                  <div class="flex flex-col text-2xs text-content-muted">
                    <span v-if="item.program"
                      >Program:
                      <strong class="text-content-dark">{{
                        item.program?.name || item.program
                      }}</strong></span
                    >
                    <span v-if="item.receiptId"
                      >Receipt Ref:
                      <strong class="text-content-dark">{{ item.receiptId }}</strong></span
                    >
                  </div>
                  <button
                    @click="((showNotifications = false), router.push('/payment'))"
                    class="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>Verify Record</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div
                v-if="pendingOnlinePayments.length === 0"
                class="p-8 text-center flex flex-col items-center justify-center gap-1"
              >
                <span class="text-2xl">🎉</span>
                <span class="text-sm font-bold text-content-dark">All payments verified!</span>
                <span class="text-xs text-content-muted"
                  >No pending KHQR transactions waiting for review.</span
                >
                <button
                  @click="addDemoNotification"
                  class="mt-2 text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  ⚡ Simulate Incoming KHQR Alert
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <button class="topbar-action-btn">
        <img :src="getIconUrl('navigation', 'setting.svg')" alt="Settings" class="w-5 opacity-60" />
      </button>

      <div class="topbar-user-pill">
        <div class="flex flex-col text-right">
          <span class="font-semibold text-xs text-content-dark leading-tight">{{ userName }}</span>
          <span class="text-2xs font-bold text-content-muted tracking-wider">{{ userRole }}</span>
        </div>
        <div class="topbar-user-avatar">
          <img :src="avatarUrl" alt="Profile" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>
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
