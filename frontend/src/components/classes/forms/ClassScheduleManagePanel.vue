<script setup>
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'

const props = defineProps({
  newSchedule: { type: Object, required: true },
  calculatedEndTime: { type: String, default: '' },
  lookupLoading: { type: Boolean, default: false },
  lookupError: { type: String, default: '' },
  lookupSuccess: { type: String, default: '' },
  sortedSchedules: { type: Array, default: () => [] },
  schedulesLength: { type: Number, default: 0 },
  justAddedId: { type: [String, Number], default: null },
  dayOptions: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:newSchedule',
  'toggle',
  'add-schedule',
  'delete-schedule',
  'clear-error',
  'clear-success'
])

const updateSchedule = (field, value) => {
  emit('update:newSchedule', { ...props.newSchedule, [field]: value })
}

const getScheduleDuration = (timeRange) => {
  const range = (timeRange || '').split(' - ')
  if (range.length !== 2) return ''
  
  // local parser for duration
  const parse12hToMinutesLocal = (time12h) => {
    const [time, period] = time12h.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  const start = parse12hToMinutesLocal(range[0])
  const end = parse12hToMinutesLocal(range[1])
  let diff = end - start
  if (diff < 0) diff += 1440
  return `${diff}mn`
}
</script>

<template>
  <div class="p-md bg-primary-soft/30 rounded-std border-2 border-dashed border-primary/20 flex flex-col gap-sm animate-in fade-in slide-in-from-top-2 duration-300">
    <div class="flex justify-between items-center">
      <span class="text-sm font-semibold text-primary flex items-center gap-xs">
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        Manage schedules
      </span>
      <button
        type="button"
        @click="$emit('toggle')"
        class="text-xs font-semibold text-content-muted hover:text-error"
      >
        Close
      </button>
    </div>

    <div class="flex flex-col gap-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-4">
        <!-- Setup Row -->
        <div class="col-span-2 grid gap-4 items-end" style="grid-template-columns: 1.2fr 1fr 1fr">
          <AppSelect
            :modelValue="newSchedule.day"
            @update:modelValue="updateSchedule('day', $event)"
            :items="dayOptions"
            label="Day"
            required
            :searchable="false"
          >
            <template #selected="{ item }">
              <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
            </template>
            <template #item="{ item }">
              <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
            </template>
          </AppSelect>
          <AppInput
            :modelValue="newSchedule.startTime"
            @update:modelValue="updateSchedule('startTime', $event)"
            type="time"
            label="Start Time"
            required
          />
          <AppInput :modelValue="calculatedEndTime" label="End Time" disabled />
        </div>

        <div class="col-span-2 flex justify-end pt-2 border-t border-primary/10">
          <AppButton size="md" type="button" @click="$emit('add-schedule')" :loading="lookupLoading">
            Add Schedule
          </AppButton>
        </div>
      </div>
    </div>

    <AppAlert v-if="lookupError" type="error" size="sm" closable @close="$emit('clear-error')">
      {{ lookupError }}
    </AppAlert>
    <AppAlert
      v-if="lookupSuccess"
      type="success"
      size="sm"
      closable
      @close="$emit('clear-success')"
    >
      {{ lookupSuccess }}
    </AppAlert>

    <div class="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1 scrollable-v">
      <div
        v-for="item in sortedSchedules"
        :key="item.id"
        class="px-4 py-2.5 cursor-pointer bg-white border border-outline-std rounded-xl flex items-center justify-between group hover:border-primary/30 hover:bg-primary-light transition-all"
        :class="{
          'ring-2 ring-primary border-primary bg-primary/5 z-10': item.id === justAddedId,
        }"
      >
        <div class="flex items-center gap-4">
          <div class="w-24">
            <AppBadge :status="item.day" type="day" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-content-dark tracking-tight">{{ item.time }}</span>
            <span class="text-sm font-bold text-primary opacity-60">
              ({{ getScheduleDuration(item.time) }})
            </span>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('delete-schedule', item.id)"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-content-muted hover:bg-error-soft hover:text-error transition-all opacity-40 group-hover:opacity-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
      <div
        v-if="schedulesLength === 0"
        class="flex flex-col items-center justify-center py-8 text-content-muted bg-surface-subtle/50 rounded-xl border border-dashed border-outline-std"
      >
        <span class="text-sm font-semibold italic">No schedules found in catalog</span>
      </div>
    </div>
  </div>
</template>
