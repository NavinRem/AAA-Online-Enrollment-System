<script setup>
import { useAuth } from '@/composables/useAuth'
import PwaNavbar from '@/components/PwaNavbar.vue'

const { currentUser } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
    <PwaNavbar v-if="currentUser" />
    <main :class="currentUser ? 'pt-16 pb-20 sm:pb-8 max-w-4xl mx-auto px-4 sm:px-6' : ''">
      <RouterView />
    </main>
  </div>
</template>

