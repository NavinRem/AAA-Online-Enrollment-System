<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'

const props = defineProps({
  localData: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
  branches: { type: Array, default: () => [] },
})

const emit = defineEmits(['update-form', 'clear-error', 'toggle-branches', 'update:localData'])

const updateField = (field, value) => {
  const newData = { ...props.localData, [field]: value }
  emit('update:localData', newData)
}

const toggleBranch = (branchId, checked) => {
  const newIds = new Set(props.localData.branchIds || [])
  if (checked) {
    newIds.add(branchId)
  } else {
    newIds.delete(branchId)
  }
  updateField('branchIds', Array.from(newIds))
  emit('clear-error', 'branchIds')
}

const isBranchDropdownOpen = ref(false)
const dropdownContainer = ref(null)

const handleClickOutside = (event) => {
  if (
    isBranchDropdownOpen.value &&
    dropdownContainer.value &&
    !dropdownContainer.value.contains(event.target)
  ) {
    isBranchDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <AppInput
    :modelValue="localData.name"
    @update:modelValue="(val) => updateField('name', val)"
    label="Term Name"
    placeholder="e.g. T1-2026-Saturday"
    required
    :error="errors.name"
    :shake="shaking.name"
    @input="$emit('clear-error', 'name')"
  />

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">
    <AppInput
      :modelValue="localData.totalSessions"
      @update:modelValue="(val) => updateField('totalSessions', val)"
      type="number"
      label="Total Sessions"
      required
      :error="errors.totalSessions"
      :shake="shaking.totalSessions"
      @input="$emit('clear-error', 'totalSessions')"
    />

    <div class="flex flex-col gap-xs text-left w-full">
      <label
        class="text-sm font-semibold text-content-muted flex items-center justify-between gap-1"
      >
        <div class="flex items-center gap-1">Branch Scope</div>
        <button
          type="button"
          @click="$emit('toggle-branches')"
          class="text-xs text-primary hover:underline font-bold tracking-tighter"
        >
          {{ localData.branchIds.length === branches.length ? 'Unselect All' : 'Select All' }}
        </button>
      </label>

      <div
        class="relative group"
        ref="dropdownContainer"
        :class="{ 'animate-shake': shaking.branchIds }"
      >
        <div
          @click="isBranchDropdownOpen = !isBranchDropdownOpen"
          class="w-full px-4 py-3 border-2 border-outline-std rounded-sm bg-white text-base outline-none transition-all hover:border-primary/50 cursor-pointer flex items-center justify-between min-h-12"
          :class="{
            'border-primary ring ring-info-soft': isBranchDropdownOpen,
            'ui-input-invalid': errors.branchIds,
          }"
        >
          <div class="flex flex-wrap gap-1 flex-1 min-w-0">
            <span
              v-if="localData.branchIds.length === 0"
              class="text-content-light/50 italic text-base"
              >Select branches...</span
            >
            <template v-else>
              <AppBadge
                v-for="id in localData.branchIds"
                :key="id"
                :status="branches.find((b) => String(b.id) === String(id))?.abbr"
                :type="branches.find((b) => String(b.id) === String(id))?.color || 'blue'"
              />
            </template>
          </div>

          <span
            class="text-xs transition-transform duration-300"
            :class="{ 'rotate-180': isBranchDropdownOpen }"
            >▼</span
          >
        </div>

        <!-- Dropdown Content -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="isBranchDropdownOpen"
            class="absolute z-50 mt-2 w-full bg-white border-2 border-outline-std rounded-sm shadow-2xl overflow-hidden max-h-64 flex flex-col"
          >
            <div class="flex flex-col overflow-y-auto scrollable-v p-2 gap-1">
              <label
                v-for="branch in branches"
                :key="branch.id"
                class="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-surface-subtle group"
                :class="{
                  'bg-primary/5': localData.branchIds.some(
                    (bid) => String(bid) === String(branch.id),
                  ),
                }"
              >
                <span class="text-sm font-semibold text-content-dark truncate tracking-tight">{{
                  branch.name
                }}</span>
                <div class="flex items-center gap-2 min-w-0">
                  <AppBadge :status="branch.abbr" :type="branch.color || 'blue'" />
                  <input
                    type="checkbox"
                    :checked="localData.branchIds.includes(branch.id)"
                    @change="(e) => toggleBranch(branch.id, e.target.checked)"
                    class="w-4 h-4 rounded border-outline-std text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </div>
              </label>
            </div>
          </div>
        </transition>
      </div>
      <p v-if="errors.branchIds" class="text-xs font-semibold text-error pl-1 mt-0.5">
        {{ errors.branchIds }}
      </p>
    </div>
  </div>

  <div
    v-if="localData.branchIds.length === 0"
    class="p-4 bg-surface-subtle border border-outline-std rounded-md text-center animate-in fade-in slide-in-from-top-2 duration-300"
  >
    <span class="text-sm font-bold text-content-muted"
      >Please select at least one branch to configure term dates.</span
    >
  </div>
</template>
