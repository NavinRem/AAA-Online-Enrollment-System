<script setup>
import { useAuth } from '@/composables/useAuth'
import PwaNavbar from '@/components/PwaNavbar.vue'

const { currentUser } = useAuth()
</script>

<template>
  <div
    class="min-h-screen bg-surface-light text-content-dark font-sans antialiased selection:bg-primary selection:text-white flex flex-col items-center"
  >
    <!-- Mobile App Container Shell -->
    <div
      class="w-full max-w-lg min-h-screen bg-surface sm:border-x border-outline-std sm:shadow-xl flex flex-col justify-between relative"
    >
      <PwaNavbar v-if="currentUser" />
      <main
        :class="
          currentUser ? 'pt-16 pb-24 flex-1 px-4 sm:px-5' : 'flex-1 flex flex-col justify-center'
        "
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
