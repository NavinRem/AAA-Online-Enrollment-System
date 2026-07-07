<script setup>
import { ref } from 'vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getProgramProfileURL } from '@/utils/assetHelper'

defineProps({
  program: { type: Object, default: null },
  programName: { type: String, default: '' },
  schedule: { type: Object, default: null },
  allSchedules: { type: Array, default: () => [] },
  offeringId: { type: [String, Number], default: null }
})

defineEmits(['switch-schedule'])

const scheduleDropdownOpen = ref(false)
const schedDropdownRef = ref(null)

const toggleScheduleDropdown = () => {
  scheduleDropdownOpen.value = !scheduleDropdownOpen.value
}

</script>

<template>
  <div class="flex justify-between items-start w-full gap-4 pr-lg">
    <div class="flex flex-col">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-outline-std p-2 overflow-hidden"
        >
          <img
            :src="getProgramProfileURL(program?.profileURL, program?.category)"
            class="w-full h-full object-contain"
          />
        </div>
        <div class="flex flex-col">
          <h3 class="text-2xl font-bold text-content-dark">Manage Class Sessions</h3>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-sm font-bold text-primary">{{ programName }}</span>
            <span class="text-xs font-bold text-content-muted/40">•</span>
            <div class="flex items-center gap-1.5" v-if="schedule?.day">
              <AppBadge :status="schedule?.day" type="day" size="xs" />
              <span class="text-xs font-semibold text-content-dark">{{ schedule?.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Schedule Dropdown Switcher -->
    <div v-if="allSchedules && allSchedules.length > 1" class="relative" ref="schedDropdownRef">
      <!-- Trigger Button -->
      <button
        type="button"
        class="flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-outline-std rounded-xl text-sm font-bold text-content-dark hover:border-primary/50 hover:shadow-sm transition-all duration-200 w-full justify-between group"
        @click="toggleScheduleDropdown"
      >
        <div class="flex items-center gap-2.5">
          <span class="text-base">📅</span>
          <div class="flex flex-col items-start leading-tight">
            <span class="text-3xs font-bold text-content-muted/60 uppercase tracking-widest"
              >Active Schedule</span
            >
            <div class="flex items-center gap-1.5 mt-0.5" v-if="schedule?.day">
              <AppBadge :status="schedule?.day" type="day" size="xs" />
              <span class="text-xs font-semibold text-content-dark">{{ schedule?.time }}</span>
            </div>
            <span v-else class="font-bold text-content-dark">Select Schedule</span>
          </div>
        </div>
        <span
          class="text-content-muted text-xs transition-transform duration-200"
          :class="{ 'rotate-180': scheduleDropdownOpen }"
          >▼</span
        >
      </button>
      <!-- Dropdown Menu -->
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-1"
      >
        <div
          v-if="scheduleDropdownOpen"
          class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-outline-std rounded-md shadow-xl shadow-primary/10 z-50 overflow-hidden"
        >
          <div class="p-1.5 flex flex-col gap-0.5">
            <button
              v-for="sched in allSchedules.filter(
                (s) => String(s.offeringId) !== String(offeringId),
              )"
              :key="sched.offeringId"
              type="button"
              class="flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-bold transition-all duration-150 w-full text-left text-content-dark hover:bg-surface-subtle hover:text-primary"
              @click="
                () => {
                  $emit('switch-schedule', sched)
                  scheduleDropdownOpen = false
                }
              "
            >
              <span class="text-base opacity-60">📅</span>
                <div class="flex items-center gap-1.5">
                  <AppBadge :status="sched.day" type="day" size="xs" />
                  <span class="text-xs font-semibold text-content-dark">{{ sched.time }}</span>
                </div>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
