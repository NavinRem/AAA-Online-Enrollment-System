<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
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
        const profile = await userService.getProfile(user.uid)
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
  <header
    class="flex items-center justify-between p-4 px-8 bg-surface-light/95 w-full sticky top-0 z-50 backdrop-blur-md border-b border-surface-light/50"
  >
    <div class="flex items-center gap-md">
      <button
        class="lg:hidden flex flex-col items-center justify-center gap-[5px] w-10 h-10 bg-white shadow-sm rounded-std"
        @click="emit('toggle-menu')"
      >
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
        <span class="w-6 h-0.5 bg-text-dark rounded-full"></span>
      </button>
      <h1 class="text-2xl font-extrabold text-content-dark whitespace-nowrap tracking-tight">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="hidden lg:flex flex-1 max-w-[500px] mx-12">
      <SearchBox v-model="searchQuery" placeholder="Search something" />
    </div>

    <div class="flex items-center gap-md">
      <button
        class="hidden sm:flex bg-white w-10 h-10 rounded-full items-center justify-center shadow-md shadow-black/5 cursor-pointer hover:bg-white hover:ring-4 hover:ring-primary/5 transition-all"
      >
        <img
          :src="getIconUrl('action', 'bell-svgrepo.svg')"
          alt="Notifications"
          class="w-5 opacity-60"
        />
      </button>
      <button
        class="hidden sm:flex bg-white w-10 h-10 rounded-full items-center justify-center shadow-md shadow-black/5 cursor-pointer hover:bg-white hover:ring-4 hover:ring-primary/5 transition-all"
      >
        <img :src="getIconUrl('navigation', 'setting.svg')" alt="Settings" class="w-5 opacity-60" />
      </button>

      <div
        class="flex items-center gap-sm bg-white p-1.5 pl-6 rounded-full shadow-md shadow-black/5 ml-sm border border-outline-std/50 group hover:border-primary/20 transition-all cursor-pointer"
      >
        <div class="flex flex-col text-right">
          <span class="font-extrabold text-xs text-content-dark leading-tight">{{ userName }}</span>
          <span class="text-2xs font-bold text-content-muted uppercase tracking-wider">{{
            userRole
          }}</span>
        </div>
        <div
          class="w-10 h-10 rounded-full overflow-hidden border border-outline-std/50 bg-primary/5 group-hover:scale-105 transition-transform"
        >
          <img :src="avatarUrl" alt="Profile" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  </header>
</template>
