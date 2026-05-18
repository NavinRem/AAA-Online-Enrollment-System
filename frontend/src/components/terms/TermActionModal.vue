<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { useActionModal } from '@/composables/useActionModal'
import { calculateClassProgress, formatDateOnly } from '@/utils/formatUtils'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'delete'
  term: Object,
  branches: { type: Array, default: () => [] },
  terms: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const getInitialData = () => ({
  name: '',
  startDate: '',
  endDate: '',
  totalSessions: 11,
  branchIds: [],
  branchSettings: [],
  duplicateFromTermId: '',
  status: 'upcoming',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if (props.term) {
    const data = { ...props.term, deleteConfirm: '' }
    // Migration: ensure branchIds and branchSettings exist
    if (!data.branchIds) {
      data.branchIds = data.branchId ? [data.branchId] : []
    }
    if (!data.branchSettings) {
      data.branchSettings = data.branchIds.map((id) => ({
        branchId: id,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || 'upcoming',
      }))
    }
    return data
  }
  return getInitialData()
}

const { localData, shaking, errors, validate, clearError, triggerShake, resetForm } =
  useActionModal(props, emit, {
    getInitialData,
    mapSourceToForm,
    sourceKey: 'term',
    autoClear: 3000,
  })

const showConfirm = ref(false)
const isBranchDropdownOpen = ref(false)
const dropdownContainer = ref(null)

const toggleAllBranches = () => {
  if (localData.branchIds.length === props.branches.length) {
    localData.branchIds = []
  } else {
    localData.branchIds = props.branches.map((b) => b.id)
  }
  clearError('branchIds')
}

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

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Term'
  if (props.type === 'delete') return 'Delete Term'
  return 'Add Term'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  return props.type === 'add' ? getActionIcon('plus') : getActionIcon('edit')
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Edit'
  if (props.type === 'delete') return 'Delete'
  return 'Add'
})

const requestConfirm = () => {
  if (props.type === 'edit' && !isDirty.value) return

  // Sync representative dates from first branch if in branch-specific mode
  if (localData.branchIds.length > 0 && localData.branchSettings?.length > 0) {
    const firstSetting = localData.branchSettings[0]
    if (firstSetting.startDate) {
      localData.startDate = firstSetting.startDate
      localData.endDate = firstSetting.endDate
    }
  }

  const rules = {
    required: props.type === 'delete' ? ['deleteConfirm'] : ['name', 'totalSessions'],
    custom: {
      startDate: (val) => {
        if (props.type === 'delete') return true
        if (val) return true
        return 'Start Date is required'
      }
    },
  }

  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (!validate(rules)) {
    return
  }

  showConfirm.value = true
}

const isDirty = computed(() => {
  if (props.type !== 'edit') return true
  if (!props.term) return false

  const initial = props.term
  const current = localData

  // Check basic fields
  const basicFields = ['name', 'startDate', 'endDate', 'totalSessions']
  const basicChanged = basicFields.some((f) => initial[f] !== current[f])

  // Check branch associations
  const initialBranches = [...(initial.branchIds || [])].sort().join(',')
  const currentBranches = [...(current.branchIds || [])].sort().join(',')
  const branchesChanged = initialBranches !== currentBranches

  // Check branch settings (deep comparison of key fields)
  const settingsChanged =
    JSON.stringify(initial.branchSettings || []) !== JSON.stringify(current.branchSettings || [])

  return basicChanged || branchesChanged || settingsChanged
})

const handleActionSubmit = () => {
  showConfirm.value = false

  const payload = { ...localData }

  if (props.type === 'delete') {
    emit('submit', { id: localData.id })
    return
  }

  if (payload.totalSessions !== undefined && payload.totalSessions !== null) {
    payload.totalSessions = parseInt(payload.totalSessions, 10)
  }

  // Remove UI-only fields
  delete payload.deleteConfirm

  // Calculate status for each branch setting
  if (payload.branchSettings && payload.branchSettings.length > 0) {
    payload.branchSettings = payload.branchSettings.map((s) => ({
      ...s,
      status: calculateClassProgress(s.startDate, s.endDate).status.toLowerCase(),
    }))

    // Representative status from first branch
    payload.status = payload.branchSettings[0].status
    payload.startDate = payload.branchSettings[0].startDate
    payload.endDate = payload.branchSettings[0].endDate
  } else {
    // Fallback to global dates
    const prog = calculateClassProgress(localData.startDate, localData.endDate)
    payload.status = prog.status.toLowerCase()
  }

  emit('submit', payload)
}

const confirmRows = computed(() => {
  const rows = [
    { key: 'Term', value: localData.name, badge: true, type: 'blue' },
    {
      key: 'Start Date',
      value: formatDateOnly(localData.startDate || localData.branchSettings?.[0]?.startDate),
      badge: true,
      type: 'green',
    },
    {
      key: 'End Date',
      value: formatDateOnly(localData.endDate || localData.branchSettings?.[0]?.endDate),
      badge: true,
      type: 'red',
    },
    { key: 'Sessions', value: `${localData.totalSessions} Weeks` },
    { key: 'Duplicate From', value: duplicateTermLabel.value || 'Fresh Term' },
    { key: 'Scope', value: '' }, // Handled by slot
    {
      key: 'Status',
      value: calculateClassProgress(
        localData.startDate || localData.branchSettings?.[0]?.startDate,
        localData.endDate || localData.branchSettings?.[0]?.endDate,
      ).status,
      badge: true,
    },
  ]

  if (props.type === 'delete') {
    rows.push({
      key: 'Security Check',
      value: localData.deleteConfirm,
      valueClass: 'text-error font-bold',
    })
  }

  return rows
})

const duplicateTermOptions = computed(() => {
  if (!props.terms) return []
  return [...props.terms]
    .filter((item) => String(item.id) !== String(localData.id))
    .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
    }))
})

const duplicateTermLabel = computed(
  () =>
    duplicateTermOptions.value.find((item) => item.id === localData.duplicateFromTermId)?.name ||
    '',
)

// Auto-calculate end date for global
watch(
  () => [localData.startDate, localData.totalSessions],
  ([start, sessions]) => {
    if (!start || !sessions) return
    const date = new Date(start)
    date.setDate(date.getDate() + (parseInt(sessions) - 1) * 7)
    localData.endDate = date.toISOString().split('T')[0]
  },
)

// Sync branchSettings with branchIds
watch(
  () => localData.branchIds,
  (newIds) => {
    if (!localData.branchSettings) localData.branchSettings = []

    // Remove settings for unselected branches
    localData.branchSettings = localData.branchSettings.filter((s) => newIds.includes(s.branchId))

    // Add settings for new branches, using global dates as initial default
    newIds.forEach((id) => {
      if (!localData.branchSettings.find((s) => s.branchId === id)) {
        localData.branchSettings.push({
          branchId: id,
          startDate: localData.startDate,
          endDate: localData.endDate,
          status: 'upcoming',
        })
      }
    })
  },
  { deep: true },
)

const getBranchSetting = (branchId) => {
  if (!localData.branchSettings) localData.branchSettings = []
  let setting = localData.branchSettings.find((s) => String(s.branchId) === String(branchId))
  if (!setting) {
    setting = {
      branchId,
      startDate: localData.startDate,
      endDate: localData.endDate,
      status: 'upcoming',
    }
    localData.branchSettings = [...localData.branchSettings, setting]
  }
  return setting
}

const calculateBranchEndDate = (branchId) => {
  const setting = getBranchSetting(branchId)
  if (!setting.startDate || !localData.totalSessions) return ''
  const date = new Date(setting.startDate)
  date.setDate(date.getDate() + (parseInt(localData.totalSessions) - 1) * 7)
  const endDate = date.toISOString().split('T')[0]
  setting.endDate = endDate
  return endDate
}

const updateBranchStartDate = (branchId, val) => {
  const setting = getBranchSetting(branchId)
  setting.startDate = val
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      showConfirm.value = false
    }
  },
)
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    :icon="modalIcon"
    :error="error"
    :success="success"
    maxWidth="600px"
    @close="$emit('close')"
  >
    <div class="relative min-h-[350px]">
      <!-- ADD / EDIT MODE -->
      <form
        v-if="type === 'add' || type === 'edit'"
        id="termActionForm"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
        @submit.prevent="requestConfirm"
        novalidate
      >
        <AppInput
          v-model="localData.name"
          label="Term Name"
          placeholder="e.g. T1-2026-Saturday"
          required
          :error="errors.name"
          :shake="shaking.name"
          @input="clearError('name')"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <AppInput
            v-model="localData.totalSessions"
            type="number"
            label="Total Sessions"
            required
            :error="errors.totalSessions"
            :shake="shaking.totalSessions"
            @input="clearError('totalSessions')"
          />

          <div class="flex flex-col gap-xs text-left w-full">
            <label
              class="text-sm font-semibold text-content-dark flex items-center justify-between gap-1"
            >
              <div class="flex items-center gap-1">
                Branch Scope
              </div>
              <button
                type="button"
                @click="toggleAllBranches"
                class="text-xs text-primary hover:underline font-bold tracking-tighter"
              >
                {{ localData.branchIds.length === branches.length ? 'Unselect All' : 'Select All' }}
              </button>
            </label>

            <div class="relative group" ref="dropdownContainer" :class="{ 'animate-shake': shaking.branchIds }">
              <div
                @click="isBranchDropdownOpen = !isBranchDropdownOpen"
                class="w-full px-4 py-3 border-2 border-outline-std rounded-sm bg-white text-base outline-none transition-all hover:border-primary/50 cursor-pointer flex items-center justify-between min-h-[50px]"
                :class="{
                  'border-primary ring-[3px] ring-info-soft': isBranchDropdownOpen,
                  'ui-input-invalid': errors.branchIds,
                }"
              >
                <div class="flex flex-wrap gap-1 max-w-[85%]">
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
                  class="absolute z-[100] mt-2 w-full bg-white border-2 border-outline-std rounded-sm shadow-2xl overflow-hidden max-h-[250px] flex flex-col"
                >
                  <div class="flex flex-col overflow-y-auto scrollable-v p-2 gap-1">
                    <label
                      v-for="branch in branches"
                      :key="branch.id"
                      class="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-surface-subtle group"
                      :class="{ 'bg-primary/5': localData.branchIds.some(bid => String(bid) === String(branch.id)) }"
                    >
                      <span
                        class="text-sm font-semibold text-content-dark truncate tracking-tight"
                        >{{ branch.name }}</span
                      >
                      <div class="flex items-center gap-2 min-w-0">
                        <AppBadge :status="branch.abbr" :type="branch.color || 'blue'" />
                        <input
                          type="checkbox"
                          v-model="localData.branchIds"
                          :value="branch.id"
                          class="w-4 h-4 rounded border-outline-std text-primary focus:ring-primary/20 cursor-pointer"
                          @change="clearError('branchIds')"
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
          class="grid grid-cols-2 gap-lg animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <AppInput
            v-model="localData.startDate"
            type="date"
            label="Start Date"
            required
            :error="errors.startDate"
            :shake="shaking.startDate"
            @input="clearError('startDate')"
          />
          <AppInput
            v-model="localData.endDate"
            type="date"
            label="Auto-calculated End Date"
            readonly
            disabled
          />
        </div>
        <div
          v-if="localData.branchIds.length > 0"
          class="flex flex-col gap-4 mt-2 border-t border-outline-std pt-4"
        >
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-content-muted">Branch-Specific Scheduling</label>
            <span class="text-xs font-medium text-primary italic"
              >Different dates per branch? Edit below</span
            >
          </div>
          <div class="grid grid-cols-1 gap-3">
            <div
              v-for="branchId in localData.branchIds"
              :key="branchId"
              class="p-4 bg-surface-subtle/50 rounded-xl border border-outline-std hover:border-primary/30 transition-all"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <AppBadge
                    :status="branches.find((b) => String(b.id) === String(branchId))?.abbr"
                    :type="branches.find((b) => String(b.id) === String(branchId))?.color || 'blue'"
                  />
                  <span class="text-sm font-bold text-content-dark tracking-tight">{{
                    branches.find((b) => String(b.id) === String(branchId))?.name
                  }}</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <AppInput
                  :modelValue="getBranchSetting(branchId).startDate"
                  type="date"
                  label="Start Date"
                  size="sm"
                  @update:modelValue="(val) => updateBranchStartDate(branchId, val)"
                />
                <AppInput
                  :modelValue="calculateBranchEndDate(branchId)"
                  type="date"
                  label="End Date"
                  size="sm"
                  readonly
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        <AppSelect
          v-if="type === 'add'"
          v-model="localData.duplicateFromTermId"
          :items="duplicateTermOptions"
          label="Duplicate Offerings From"
          placeholder="Select a recent term to clone..."
        >
          <template #item="{ item }">
            <div class="flex items-center justify-between w-full gap-4">
              <span class="font-bold text-content-dark truncate">{{ item.name }}</span>
              <div class="flex items-center gap-2 shrink-0">
                <AppBadge :status="formatDateOnly(item.startDate)" type="green" />
                <span class="text-content-muted text-xs">→</span>
                <AppBadge :status="formatDateOnly(item.endDate)" type="red" />
              </div>
            </div>
          </template>
        </AppSelect>
      </form>

      <!-- DELETE MODE -->
      <div
        v-else-if="type === 'delete'"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div
          class="bg-white border border-outline-std rounded-md p-lg flex flex-col gap-lg shadow-sm"
          v-if="term"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-primary/5 bg-surface-subtle border border-outline-std/50 flex items-center justify-center"
            >
              <span class="text-2xl">📅</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-semibold text-content-dark tracking-tighter">{{
                term.name
              }}</span>
              <span class="text-xs font-semibold text-content-muted"
                >{{ formatDateOnly(term.startDate) }} — {{ formatDateOnly(term.endDate) }}</span
              >
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">⚠ Permanent Data Deletion</strong>
            <p class="text-xs opacity-90 font-medium leading-relaxed">
              Purging this term will permanently remove its scheduling data. This action is
              irreversible and should only be performed if no active classes are linked to this
              term.
            </p>
          </div>
        </AppAlert>

        <AppInput
          v-model="localData.deleteConfirm"
          label="Security Confirmation"
          placeholder='Type "DELETE" to confirm'
          required
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-xs font-bold text-error/60 mt-1">
              Type <span class="text-error px-1 font-bold">DELETE</span> to authorize
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Confirmation Overlay ── -->
      <AppConfirmOverlay
        :show="showConfirm"
        :title="type === 'delete' ? 'Delete Term' : type === 'edit' ? 'Edit Term' : 'Add Term'"
        :subtitle="
          type === 'delete'
            ? 'This action will permanently erase this academic term and its historical data.'
            : 'Please verify the academic schedule and parameters before proceeding.'
        "
        :icon="modalIcon"
        :rows="confirmRows"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleActionSubmit"
      >
        <template #row-Scope>
          <div class="flex flex-wrap justify-end gap-1 max-w-[200px]">
            <template v-if="localData.branchIds.length > 0">
              <AppBadge
                v-for="id in localData.branchIds"
                :key="id"
                :status="branches.find((b) => String(b.id) === String(id))?.abbr"
                :type="branches.find((b) => String(b.id) === String(id))?.color || 'blue'"
              />
            </template>
            <AppBadge v-else status="Global" type="neutral" />
          </div>
        </template>
      </AppConfirmOverlay>
    </div>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert
          v-if="type === 'edit' && !isDirty"
          type="info"
          class="w-full"
        >
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type === 'delete' ? 'danger' : 'primary'"
            type="button"
            @click="requestConfirm"
            :loading="loading"
            :disabled="loading || (type === 'edit' && !isDirty)"
            :class="{ 'opacity-50 pointer-events-none': type === 'edit' && !isDirty }"
          >
            {{
              type === 'delete' ? 'Delete Term' : type === 'edit' ? 'Save Changes' : 'Create Term'
            }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>
