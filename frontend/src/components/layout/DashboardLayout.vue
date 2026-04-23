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
  <div class="flex bg-surface-light h-screen relative overflow-hidden w-full">
    <div v-if="isSidebarOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] lg:hidden transition-opacity duration-300"
      @click="isSidebarOpen = false"></div>

    <Sidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />

    <div class="flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300 ease-in-out"
      :class="['lg:ml-[260px]', isSidebarOpen ? 'ml-0' : 'ml-0']">
      <Topbar @toggle-menu="toggleSidebar" />

      <main class="flex-1 min-h-0 h-full overflow-hidden flex flex-col items-stretch">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
