<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'

const route = useRoute()
const searchQuery = ref('')
const userName = ref('Loading...')
const userRole = ref('...')

const pageTitle = computed(() => route.meta.title || 'Dashboard')

onMounted(() => {
  authService.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userProfile = await userService.getProfile(user.uid)
        if (userProfile) {
          userName.value = userProfile.name || userProfile.email || 'User'
          userRole.value = userProfile.role
            ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
            : 'User'
        }
      } catch (e) {
        console.warn('Failed to load profile for topbar', e)
        userName.value = 'User'
        userRole.value = 'Unknown'
      }
    } else {
      userName.value = 'Guest'
      userRole.value = ''
    }
  })
})

const getIconPath = (icon) => {
  return new URL(`../assets/icons/${icon}`, import.meta.url).href
}
</script>

<template>
  <header class="topbar">
    <div class="header-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <div class="header-center">
      <div class="search-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search something"
          class="search-input"
        />
        <img src="../assets/icons/search-svgrepo.svg" class="search-icon" />
      </div>
    </div>

    <div class="header-right">
      <button class="icon-btn">
        <img src="../assets/icons/bell-svgrepo.svg" alt="Notifications" />
      </button>
      <button class="icon-btn">
        <img src="../assets/icons/setting-svgrepo.svg" alt="Settings" />
      </button>

      <div class="user-profile">
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role">{{ userRole }}</span>
        </div>
        <div class="user-avatar">
          <img src="@/assets/images/profile-admin.png" alt="Profile" />
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
  background: #f7f9fc;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a1a1a;
}

.header-center {
  flex: 1;
  max-width: 500px;
  margin: 0 40px;
}

.search-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border-radius: 25px;
  border: none;
  background: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  font-size: 0.95rem;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  opacity: 0.4;
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

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 5px 5px 5px 15px;
  border-radius: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  margin-left: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a1a1a;
}

.user-role {
  font-size: 0.75rem;
  color: #999;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
