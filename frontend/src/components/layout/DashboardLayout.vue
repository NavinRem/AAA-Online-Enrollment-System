<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

const isSidebarOpen = ref(false)
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="app-layout" :class="{ 'sidebar-open': isSidebarOpen }">
    <div class="sidebar-overlay" @click="isSidebarOpen = false"></div>
    <Sidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />
    <div class="main-wrapper">
      <Topbar @toggle-menu="toggleSidebar" />
      <main class="content-area">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  background-color: #f7f9fc;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.main-wrapper {
  flex: 1;
  margin-left: 260px; /* Sidebar width */
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  min-width: 0; /* Prevent horizontal overflow from content */
}

.content-area {
  padding: 0;
  flex: 1;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 90;
}


</style>
