<script setup>
import { useRouter } from 'vue-router'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  loading: Boolean,
  errorMessage: String,
  backRoute: {
    type: String,
    default: '/',
  },
  scrollable: {
    type: Boolean,
    default: true,
  },
  rightScrollable: {
    type: Boolean,
    default: true,
  },
  sidebarWidth: {
    type: String,
    default: 'md', // sm (3 cols), md (4 cols), lg (5 cols)
  },
})

const router = useRouter()
const goBack = () => router.push(props.backRoute)

import { computed } from 'vue'
const colSpans = computed(() => {
  if (props.sidebarWidth === 'sm') return { main: 'md:col-span-9', side: 'md:col-span-3' }
  if (props.sidebarWidth === 'lg') return { main: 'md:col-span-7', side: 'md:col-span-5' }
  return { main: 'md:col-span-8', side: 'md:col-span-4' }
})
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 bg-surface-light w-full">
    <div v-if="loading" class="flex flex-col items-center justify-center p-20 text-content-muted italic animate-pulse">
      <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-md"></div>
      Loading details...
    </div>

    <div v-else-if="errorMessage" class="flex flex-col items-center justify-center p-20 gap-lg text-center">
      <div class="text-5xl">⚠️</div>
      <p class="text-xl font-bold text-content-dark">{{ errorMessage }}</p>
      <button class="ui-back-button" @click="goBack">
        <img :src="getActionIcon('back')" />
        Back to Safety
      </button>
    </div>

    <div v-else class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-xl flex-1 min-h-0 p-8 w-full max-w-[1600px] mx-auto">
        <!-- Left Content (Main) -->
        <div :class="[colSpans.main, 'flex flex-col gap-lg min-h-0 text-content-dark']">
          <div class="flex items-center justify-between min-h-[48px]">
            <button class="ui-back-button" @click="goBack">
              <img :src="getActionIcon('back')" />
              Back
            </button>
            <div class="flex items-center gap-md">
              <slot name="header-actions"></slot>
            </div>
          </div>

          <div class="flex flex-col gap-lg pr-1" :class="scrollable ? 'overflow-y-auto scrollable-v' : ''">
            <slot name="left-content"></slot>
          </div>
        </div>

        <!-- Right Content (Sidebar) -->
        <aside
          :class="[colSpans.side, 'flex flex-col gap-lg h-full min-h-0 rounded-std', rightScrollable ? 'overflow-y-auto scrollable-v' : '']"
        >
          <slot name="right-content"></slot>
        </aside>
      </div>
    </div>
  </div>
</template>
