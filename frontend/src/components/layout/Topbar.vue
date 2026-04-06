<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
import { getImageUrl, getIconUrl, getActionIcon } from '@/utils/assetHelper'
import { getAvatarUrl } from '@/utils/profileHelper'

const route = useRoute()
const searchQuery = ref('')
const userProfile = ref(null)
const userName = ref('Loading...')
const userRole = ref('...')

const emit = defineEmits(['toggle-menu'])

const pageTitle = computed(() => route.meta.title || 'Dashboard')
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
        role: 'Guest'
      }
    }
  })
})
</script>

<template>
  <header class="topbar">
    <div class="header-left">
      <button class="menu-toggle" @click="emit('toggle-menu')">
        <span class="hamburger"></span>
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <div class="header-center desktop-only">
      <div class="search-wrapper">
        <input v-model="searchQuery" type="text" placeholder="Search something" class="search-input" />
        <img :src="getActionIcon('search')" class="search-icon" />
      </div>
    </div>

    <div class="header-right">
      <button class="icon-btn">
        <img :src="getIconUrl('action', 'bell-svgrepo.svg')" alt="Notifications" />
      </button>
      <button class="icon-btn">
        <img :src="getIconUrl('navigation', 'setting.svg')" alt="Settings" />
      </button>

      <div class="user-profile-topbar">
        <div class="user-info-topbar">
          <span class="user-name-topbar">{{ userName }}</span>
          <span class="user-role-topbar">{{ userRole }}</span>
        </div>
        <div class="user-avatar-topbar">
          <img :src="avatarUrl" alt="Profile" />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background: var(--bg-light);
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 5px;
}

.hamburger {
  display: block;
  width: 24px;
  height: 2px;
  background: #333;
  position: relative;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: #333;
  left: 0;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  bottom: -8px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-dark);
  white-space: nowrap;
}

.header-center {
  flex: 1;
  max-width: 500px;
  margin: 0 40px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-btn {
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  cursor: pointer;
}

.icon-btn img {
  width: 20px;
  opacity: 0.7;
}

.user-profile-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 10px 10px 10px 25px;
  border-radius: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  margin-left: 10px;
}

.user-info-topbar {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name-topbar {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.user-role-topbar {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.user-avatar-topbar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #e5e5e5;
  background-color: var(--accent-light);
}

.user-avatar-topbar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
