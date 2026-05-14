<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps({
  isOpen: Boolean,
  term: Object,
  initialBranchId: [String, Number],
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

import { useForm } from '@/composables/useForm'
const dataStore = useDataStore()

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  branchIds: [],
  programIds: [],
}, { autoClear: 3000 })

const programs = computed(() => dataStore.programs)
const branches = computed(() => {
  if (!props.term || !dataStore.branches.length) return dataStore.branches
  const termBranchIds = props.term.branchIds || []
  const filtered = dataStore.branches.filter((b) =>
    termBranchIds.map(String).includes(String(b.id)),
  )

  if (filtered.length === 0) {
    return [{ id: 'none', name: 'No Branch', abbr: 'EMPTY', color: 'neutral' }]
  }
  return filtered
})

const isBranchLocked = computed(() => !!props.initialBranchId)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      resetForm({
        branchIds: props.initialBranchId ? [props.initialBranchId] : [],
        programIds: [],
      })
    }
  },
)

const handleSubmit = () => {
  const isValid = validate({
    required: ['branchIds', 'programIds'],
  })

  if (!isValid) {
    if (errors.branchIds) triggerShake('branchIds')
    if (errors.programIds) triggerShake('programIds')
    return
  }

  emit('submit', {
    branchIds: form.branchIds,
    programIds: form.programIds,
  })
}

const selectAllBranches = () => {
  form.branchIds = branches.value.filter((b) => b.id !== 'none').map((b) => b.id)
  clearError('branchIds')
}

const selectAllPrograms = () => {
  form.programIds = programs.value.map((p) => p.id)
  clearError('programIds')
}
</script>

<template>
  <AppModal
    :show="isOpen"
    title="Add Classes to Term"
    :icon="getActionIcon('plus')"
    :error="error"
    :success="success"
    maxWidth="550px"
    @close="$emit('close')"
  >
    <div class="flex flex-col gap-lg py-2">
      <div
        class="bg-surface-subtle/50 p-4 rounded-2xl border border-outline-std flex items-center gap-4 mb-2"
      >
        <div
          class="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-outline-std"
        >
          <span class="text-2xl">📅</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-content-muted leading-none mb-1">Target Term</span>
          <h3 class="text-md font-black text-content-dark tracking-tight">{{ term?.name }}</h3>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between px-1">
          <label class="text-sm font-semibold text-content-dark"
            >Select Target Branches <span class="text-error font-bold leading-none">*</span></label
          >
          <button
            type="button"
            @click="selectAllBranches"
            class="text-3xs font-bold text-primary hover:underline"
          >
            Select All
          </button>
        </div>
        <AppSelect
          v-model="form.branchIds"
          :items="branches"
          placeholder="Choose branches..."
          required
          multiple
          :error="errors.branchIds"
          :shake="shaking.branchIds"
          class="mb-4"
        >
          <template #selected="{ items }">
            <div v-if="!items?.length" class="text-content-muted/50 italic">
              Select target branches...
            </div>
            <div v-else class="flex flex-wrap gap-1 py-1">
              <AppBadge
                v-for="item in items"
                :key="item.id"
                :status="item.abbr"
                :type="item.color || 'blue'"
              />
            </div>
          </template>
          <template #item="{ item }">
            <div v-if="item" class="flex items-center gap-2">
              <AppBadge :status="item.abbr" :type="item.color || 'blue'" />
              <span class="font-bold text-content-dark">{{ item.name }}</span>
            </div>
          </template>
        </AppSelect>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between px-1">
          <label class="text-sm font-semibold text-content-dark"
            >Select Class Products <span class="text-error font-bold leading-none">*</span></label
          >
          <button
            type="button"
            @click="selectAllPrograms"
            class="text-3xs font-bold text-primary hover:underline"
          >
            Select All
          </button>
        </div>
        <AppSelect
          v-model="form.programIds"
          :items="programs"
          placeholder="Select multiple classes..."
          required
          multiple
          :error="errors.programIds"
          :shake="shaking.programIds"
        >
          <template #selected="{ items }">
            <div v-if="!items?.length" class="text-content-muted/50 italic">
              Select from catalog...
            </div>
            <div v-else class="flex flex-wrap gap-2 py-1">
              <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full pl-1 pr-3 py-1 shadow-sm"
              >
                <div
                  class="w-6 h-6 rounded-full overflow-hidden border border-primary/20 bg-white flex items-center justify-center p-0.5"
                >
                  <img
                    :src="getProgramProfileURL(item.profileURL, item.category)"
                    class="w-full h-full object-contain"
                  />
                </div>
                <span class="text-xs font-bold text-primary">{{ item.name }}</span>
              </div>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg border border-outline-std overflow-hidden bg-white p-1"
              >
                <img
                  :src="getProgramProfileURL(item.profileURL, item.category)"
                  class="w-full h-full object-contain"
                />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-content-dark text-sm">{{ item.name }}</span>
                <span class="text-3xs text-content-muted font-bold tracking-tighter"
                  >{{ item.category }} • {{ item.duration }}mn</span
                >
              </div>
            </div>
          </template>
        </AppSelect>
        <p class="text-3xs font-bold text-content-muted italic mt-1 pl-1">
          * All schedules associated with these products will be added to the selected branch.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          Add {{ form.programIds.length }} Class{{ form.programIds.length === 1 ? '' : 'es' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
