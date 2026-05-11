<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '@/services/authService'

import { getImageUrl, getIconUrl } from '@/utils/assetHelper'
import { getAvatarUrl } from '@/utils/profileHelper'
import SearchBox from '@/components/common/data/SearchBox.vue'

const route = useRoute()
const searchQuery = ref('')
const userProfile = ref(null)
const userName = ref('Loading...')
const userRole = ref('...')

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
})
</script>

<template>
  <header class="topbar-root">
    <div class="flex items-center gap-md">
      <button
        class="lg:hidden flex flex-col items-center justify-center gap-[5px] w-10 h-10 bg-white shadow-sm rounded-std"
        @click="emit('toggle-menu')">
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
      </button>
      <h1 class="topbar-title">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="hidden lg:flex flex-1 max-w-[500px] mx-12">
      <SearchBox v-model="searchQuery" placeholder="Search something..." variant="white" />
    </div>

    <div class="flex items-center gap-md">
      <button class="topbar-action-btn">
        <img :src="getIconUrl('action', 'bell-svgrepo.svg')" alt="Notifications" class="w-5 opacity-60" />
      </button>
      <button class="topbar-action-btn">
        <img :src="getIconUrl('navigation', 'setting.svg')" alt="Settings" class="w-5 opacity-60" />
      </button>

      <div class="topbar-user-pill">
        <div class="flex flex-col text-right">
          <span class="font-semibold text-xs text-content-dark leading-tight">{{ userName }}</span>
          <span class="text-2xs font-bold text-content-muted tracking-wider">{{
            userRole
          }}</span>
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
