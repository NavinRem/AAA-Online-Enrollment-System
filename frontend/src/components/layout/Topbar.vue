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
  padding: var(--space-md) var(--space-2xl);
  background: var(--bg-light);
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
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
  background: var(--text-deep);
  position: relative;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: var(--text-deep);
  left: 0;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  bottom: -8px;
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-dark);
  white-space: nowrap;
}

.header-center {
  flex: 1;
  max-width: 500px;
  margin: 0 var(--space-3xl);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.icon-btn {
  background: var(--white);
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
  gap: var(--space-sm);
  background: var(--white);
  padding: var(--space-sm) var(--space-sm) var(--space-sm) var(--space-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  margin-left: var(--space-sm);
}

.user-info-topbar {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name-topbar {
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--text-dark);
}

.user-role-topbar {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.user-avatar-topbar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background-color: var(--accent-light);
}

.user-avatar-topbar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
