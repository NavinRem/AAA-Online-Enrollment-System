<script setup>
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'

const props = defineProps({
  form: { type: Object, required: true },
  programs: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  filteredSchedules: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
  isEditMode: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:form',
  'program-change',
  'click-disabled',
  'schedule-change',
  'toggle-schedule-manage',
  'clear-error',
  'toggle-all-branches',
  'remove-branch',
])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
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
  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
    <div class="flex flex-col w-full gap-xs md:col-span-2">
      <AppSelect
        :modelValue="form.programId"
        @update:modelValue="updateForm('programId', $event)"
        :items="programs"
        label="Target Program"
        placeholder="Select a master program to base this class on..."
        required
        :disabled="isEditMode"
        :error="errors.programId"
        :shake="shaking.programId"
        @change="$emit('program-change')"
        @click-disabled="$emit('click-disabled', 'programId')"
      >
        <template #selected="{ item }">
          <div v-if="item" class="flex items-center justify-between gap-xs flex-1 pr-sm">
            <div class="flex items-center gap-sm flex-1">
              <div
                class="w-10 h-10 overflow-hidden rounded-full border border-outline-std shrink-0 flex items-center justify-center"
              >
                <img
                  v-if="item.profileURL"
                  :src="item.profileURL"
                  alt=""
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="w-full flex flex-col">
                <span class="text-sm font-semibold text-content-dark truncate">{{
                  item.name
                }}</span>
                <span class="text-3xs font-semibold text-content-muted">{{ item.category }}</span>
              </div>
            </div>
            <AppBadge type="blue">{{ item.duration }} mn</AppBadge>
          </div>
        </template>
        <template #item="{ item }">
          <div class="flex items-center gap-sm">
            <div
              class="w-8 h-8 overflow-hidden rounded-full border border-outline-std shrink-0 flex items-center justify-center"
            >
              <img
                v-if="item.profileURL"
                :src="item.profileURL"
                alt=""
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex flex-col w-full">
              <span class="text-sm font-semibold text-content-dark truncate">{{ item.name }}</span>
              <span class="text-3xs font-semibold text-content-muted">{{ item.category }}</span>
            </div>
          </div>
        </template>
      </AppSelect>
    </div>

    <div class="flex flex-col w-full gap-xs">
      <div class="flex items-center justify-between">
        <label class="text-sm font-semibold text-content-muted flex items-center gap-1">
          Branch Selection
          <span class="text-error font-bold leading-none">*</span>
        </label>
        <button
          type="button"
          @click="$emit('toggle-all-branches')"
          class="text-xs font-bold text-primary hover:underline"
        >
          {{
            form.branchIds?.length === branches?.length
              ? 'Deselect all branches'
              : 'Select all branches'
          }}
        </button>
      </div>
      <AppSelect
        :modelValue="form.branchIds"
        @update:modelValue="updateForm('branchIds', $event)"
        :items="branches"
        placeholder="Select branches..."
        required
        multiple
        :error="errors.branchIds"
        :shake="shaking.branchIds"
        @change="$emit('clear-error', 'branchIds')"
      >
        <template #selected="{ items }">
          <div v-if="!items?.length" class="text-content-muted/40 italic">Choose branches...</div>
          <div v-else class="flex items-center gap-2 overflow-hidden flex-wrap">
            <div
              v-for="item in items"
              :key="item.id"
              class="flex items-center gap-1 bg-surface-subtle border border-transparent hover:border-error/10 hover:bg-error/10 rounded-full pl-0.5 pr-0.5 py-0.5 animate-in zoom-in-95 duration-200 cursor-pointer transition-colors"
              title="Click to remove"
              @click.stop="$emit('remove-branch', item.id)"
            >
              <AppBadge
                :status="item.abbr"
                :type="item.color"
                size="sm"
                class="w-12 text-center pointer-events-none"
              />
            </div>
          </div>
        </template>
        <template #item="{ item }">
          <div class="flex items-center gap-3 w-full">
            <AppBadge :status="item.abbr" :type="item.color" size="sm" class="w-12 text-center" />
            <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
          </div>
        </template>
      </AppSelect>
    </div>

    <div class="flex flex-col w-full gap-xs">
      <div class="flex items-center justify-between">
        <label class="text-sm font-semibold text-content-muted flex items-center gap-1">
          Schedule Selection
          <span class="text-error font-bold leading-none">*</span>
        </label>
        <button
          type="button"
          @click="$emit('toggle-schedule-manage')"
          class="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          Manage Schedules
        </button>
      </div>
      <AppSelect
        :modelValue="form.scheduleIds"
        @update:modelValue="updateForm('scheduleIds', $event)"
        :items="filteredSchedules"
        placeholder="Select schedules..."
        required
        multiple
        :error="errors.scheduleIds"
        :shake="shaking.scheduleIds"
        :disabled="!form.programId"
        @change="$emit('schedule-change')"
        @click-disabled="$emit('click-disabled', 'scheduleIds')"
      >
        <template #selected="{ items }">
          <span v-if="!items?.length" class="text-content-muted/40 italic"
            >Choose from catalog...</span
          >
          <span v-else class="text-sm font-semibold text-primary"
            >{{ items.length }} schedule{{ items.length === 1 ? '' : 's' }} selected</span
          >
        </template>
        <template #item="{ item }">
          <div class="flex items-center justify-between w-full">
            <AppBadge :status="item.day" type="day" size="sm" />
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-content-muted opacity-40"
                >({{ getScheduleDuration(item.time) }})</span
              >
              <span class="text-xs font-semibold text-primary">{{ item.time }}</span>
            </div>
          </div>
        </template>
      </AppSelect>
    </div>

    <div class="flex flex-col w-full gap-xs">
      <AppSelect
        :modelValue="form.status"
        @update:modelValue="updateForm('status', $event)"
        :items="statusOptions"
        label="Class Status"
        placeholder="Select status..."
        required
      >
        <template #selected="{ item }">
          <AppBadge v-if="item" :status="item.name" :type="item.color" size="sm" />
          <span v-else class="text-content-muted/40 italic">Select status...</span>
        </template>
        <template #item="{ item }">
          <AppBadge :status="item.name" :type="item.color" size="sm" />
        </template>
      </AppSelect>
    </div>
  </div>
</template>
