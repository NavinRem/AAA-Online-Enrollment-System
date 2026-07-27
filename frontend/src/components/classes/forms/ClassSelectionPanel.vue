<script setup>
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'

const props = defineProps({
  form: { type: Object, required: true },
  programs: { type: Array, default: () => [] },
  filteredPickerClasses: { type: Array, default: () => [] },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:form', 'program-change', 'click-disabled', 'clear-error'])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 items-start">
      <AppSelect
        :modelValue="form.programId"
        @update:modelValue="updateForm('programId', $event)"
        :items="programs"
        label="Select Program"
        placeholder="Select a program first..."
        required
        :error="errors.programId"
        :shake="shaking.programId"
        @change="$emit('program-change')"
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

      <AppSelect
        :modelValue="form.classIds"
        @update:modelValue="updateForm('classIds', $event)"
        :items="filteredPickerClasses"
        label="Select Classes"
        placeholder="Choose classes..."
        required
        multiple
        :disabled="!form.programId"
        :error="errors.classIds"
        :shake="shaking.classIds"
        dropdownWidth="500px"
        @change="$emit('clear-error', 'classIds')"
        @click-disabled="$emit('click-disabled', 'classIds')"
      >
        <template #selected="{ items }">
          <span v-if="!items?.length" class="text-content-muted/40 italic">Choose classes...</span>
          <span v-else class="text-sm font-semibold text-primary"
            >{{ items.length }} class{{ items.length === 1 ? '' : 'es' }} selected</span
          >
        </template>
        <template #item="{ item }">
          <div
            class="flex items-center gap-4 w-full p-2 rounded-md transition-colors"
            :class="
              form.classIds.includes(item.id)
                ? 'bg-primary/5 border border-primary/20'
                : 'border border-transparent'
            "
          >
            <!-- Schedule (Day & Time in columns) -->
            <div style="flex: 2" class="flex flex-col gap-1 min-w-28">
              <template v-if="item.displaySchedule">
                <AppBadge :status="item.displaySchedule.day" type="day" size="sm" class="w-fit" />
                <span class="text-xs font-semibold text-content-dark whitespace-nowrap">{{
                  item.displaySchedule.time
                }}</span>
              </template>
              <span v-else class="text-xs text-content-muted font-medium italic">No schedule</span>
            </div>

            <!-- Branches -->
            <div class="flex flex-col flex-wrap gap-1 min-w-24">
              <AppBadge
                v-for="branch in item.branches || []"
                :key="branch.id"
                :status="branch.abbr || branch.name"
                :type="branch.color"
                size="sm"
              />
            </div>

            <!-- Status -->
            <div class="w-24 shrink-0 flex items-center justify-center">
              <AppBadge :status="item.status" size="sm" />
            </div>

            <!-- Selection Mark -->
            <div class="w-12 shrink-0 flex items-center justify-end">
              <div
                class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="
                  form.classIds.includes(item.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-outline-std bg-surface-subtle'
                "
              >
                <svg
                  v-if="form.classIds.includes(item.id)"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </template>
      </AppSelect>
    </div>
  </div>
</template>
