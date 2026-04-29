<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
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
  status: 'upcoming',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if (props.term) {
    const data = { ...props.term, deleteConfirm: '' }
    // Migration: ensure branchIds exists
    if (!data.branchIds) {
      data.branchIds = data.branchId ? [data.branchId] : []
    }
    return data
  }
  return getInitialData()
}

const {
  localData,
  isDirty,
  shaking,
  errors,
  validate,
  clearError,
  triggerShake,
  resetForm,
} = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
  sourceKey: 'term',
})

const showConfirm = ref(false)
const isBranchDropdownOpen = ref(false)
const dropdownContainer = ref(null)

const toggleAllBranches = () => {
  if (localData.branchIds.length === props.branches.length) {
    localData.branchIds = []
  } else {
    localData.branchIds = props.branches.map(b => b.id)
  }
  clearError('branchIds')
}

const handleClickOutside = (event) => {
  if (isBranchDropdownOpen.value && dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
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

  const rules = {
    required: props.type === 'delete' ? ['deleteConfirm'] : ['name', 'startDate', 'totalSessions', 'branchIds'],
    custom: {}
  }

  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (!validate(rules)) {
    if (props.type !== 'delete') {
      triggerShake('name')
    }
    return
  }

  showConfirm.value = true
}

const handleActionSubmit = () => {
  showConfirm.value = false

  const payload = { ...localData }

  if (props.type === 'delete') {
    emit('submit', { id: localData.id })
    return
  }

  // Remove UI-only fields
  delete payload.deleteConfirm

  // Calculate and persist status based on dates
  const prog = calculateClassProgress(localData.startDate, localData.endDate)
  payload.status = prog.status.toLowerCase()

  emit('submit', payload)
}

const confirmRows = computed(() => {
  const rows = [
    { key: 'Term', value: localData.name, badge: true, type: 'blue' },
    { key: 'Start Date', value: formatDateOnly(localData.startDate), badge: true, type: 'green' },
    { key: 'End Date', value: formatDateOnly(localData.endDate), badge: true, type: 'red' },
    { key: 'Sessions', value: `${localData.totalSessions} Weeks` },
    { key: 'Scope', value: '' }, // Handled by slot
    { key: 'Status', value: calculateClassProgress(localData.startDate, localData.endDate).status, badge: true },
  ]

  if (props.type === 'delete') {
    rows.push({ key: 'Security Check', value: localData.deleteConfirm, valueClass: 'text-error font-black' })
  }

  return rows
})

// Auto-calculate end date
watch(() => [localData.startDate, localData.totalSessions], ([start, sessions]) => {
  if (!start || !sessions) return
  const date = new Date(start)
  // End date should be on the same day of the week as start date after (sessions - 1) weeks
  // This ensures we count exactly 'sessions' occurrences of that day (e.g., 11 Mondays)
  date.setDate(date.getDate() + (parseInt(sessions) - 1) * 7)
  localData.endDate = date.toISOString().split('T')[0]
})

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
  <AppModal :show="isOpen" :title="modalTitle" :icon="modalIcon" :error="error" :success="success" maxWidth="600px"
    @close="$emit('close')">
    <div class="relative min-h-[350px]">
      <!-- ADD / EDIT MODE -->
      <form v-if="type === 'add' || type === 'edit'" id="termActionForm"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
        @submit.prevent="requestConfirm" novalidate>

        <AppInput v-model="localData.name" label="Term Name" placeholder="e.g. T1-2026-Saturday" required
          :error="errors.name" :shake="shaking.name" @input="clearError('name')" />

        <div class="grid grid-cols-2 gap-lg">
          <AppInput v-model="localData.startDate" type="date" label="Start Date" required :error="errors.startDate"
            :shake="shaking.startDate" @input="clearError('startDate')" />
          <AppInput v-model="localData.totalSessions" type="number" label="Total Sessions" required
            :error="errors.totalSessions" :shake="shaking.totalSessions" @input="clearError('totalSessions')" />
        </div>

        <div class="grid grid-cols-2 gap-lg">
          <AppInput v-model="localData.endDate" type="date" label="Auto-calculated End Date" readonly disabled />

          <div class="flex flex-col gap-xs text-left w-full">
            <label class="text-sm font-semibold text-content-dark flex items-center justify-between gap-1">
              <div class="flex items-center gap-1">
                Branch Scope <span class="text-error font-bold leading-none">*</span>
              </div>
              <button type="button" @click="toggleAllBranches"
                class="text-[10px] text-primary hover:underline font-black uppercase tracking-tighter">
                {{ localData.branchIds.length === branches.length ? 'Unselect All' : 'Select All' }}
              </button>
            </label>

            <div class="relative group" ref="dropdownContainer">
              <div @click="isBranchDropdownOpen = !isBranchDropdownOpen"
                class="w-full px-4 py-3 border-2 border-outline-std rounded-sm bg-white text-base outline-none transition-all hover:border-primary/50 cursor-pointer flex items-center justify-between min-h-[50px]"
                :class="{ 'border-primary ring-[3px] ring-info-soft': isBranchDropdownOpen, 'ui-input-invalid': errors.branchIds }">

                <div class="flex flex-wrap gap-1 max-w-[85%]">
                  <span v-if="localData.branchIds.length === 0" class="text-content-light/50 italic text-base">Select
                    branches...</span>
                  <template v-else>
                    <AppBadge v-for="id in localData.branchIds" :key="id"
                      :status="branches.find(b => b.id === id)?.abbr"
                      :type="branches.find(b => b.id === id)?.color || 'blue'" size="sm" />
                  </template>
                </div>

                <span class="text-xs transition-transform duration-300"
                  :class="{ 'rotate-180': isBranchDropdownOpen }">▼</span>
              </div>

              <!-- Dropdown Content -->
              <transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 scale-95 translate-y-2" enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 translate-y-2">
                <div v-if="isBranchDropdownOpen"
                  class="absolute z-[100] mt-2 w-full bg-white border-2 border-outline-std rounded-sm shadow-2xl overflow-hidden max-h-[250px] flex flex-col">
                  <div class="flex flex-col overflow-y-auto scrollable-v p-2 gap-1">
                    <label v-for="branch in branches" :key="branch.id"
                      class="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-surface-subtle group"
                      :class="{ 'bg-primary/5': localData.branchIds.includes(branch.id) }">
                      <span class="text-sm font-bold text-content-dark truncate uppercase tracking-tight">{{
                        branch.name }}</span>
                      <div class="flex items-center gap-2 min-w-0">
                        <AppBadge :status="branch.abbr" :type="branch.color || 'blue'" />
                        <input type="checkbox" v-model="localData.branchIds" :value="branch.id"
                          class="w-4 h-4 rounded border-outline-std text-primary focus:ring-primary/20 cursor-pointer"
                          @change="clearError('branchIds')" />
                      </div>
                    </label>
                  </div>
                </div>
              </transition>
            </div>
            <p v-if="errors.branchIds" class="text-3xs font-black text-error uppercase tracking-widest pl-1 mt-0.5">{{
              errors.branchIds }}</p>
          </div>
        </div>

        <div v-if="localData.startDate && localData.branchIds.length > 0"
          class="p-4 rounded-md bg-primary/5 border border-primary/10 flex flex-col gap-1 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-primary uppercase tracking-widest">Scheduling Insight</span>
            <div class="h-px flex-1 bg-primary/10"></div>
          </div>
          <p class="text-sm text-content-dark leading-tight">
            This term will span exactly <span class="text-primary">{{ localData.totalSessions }}</span> weekly sessions
            starting
            from
            <span class="text-primary font-bold">{{ formatDateOnly(localData.startDate) }}</span> across
            <span class="text-primary">{{ localData.branchIds.length }}</span> targeted branch{{
              localData.branchIds.length > 1
                ? 'es' : '' }}.
          </p>
        </div>

      </form>

      <!-- DELETE MODE -->
      <div v-else-if="type === 'delete'"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="bg-white border border-outline-std rounded-md p-lg flex flex-col gap-lg shadow-sm" v-if="term">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-primary/5 bg-surface-subtle border border-outline-std/50 flex items-center justify-center">
              <span class="text-2xl">📅</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-black text-content-dark tracking-tighter">{{ term.name }}</span>
              <span class="text-xs font-bold text-content-muted">{{ formatDateOnly(term.startDate) }} — {{
                formatDateOnly(term.endDate) }}</span>
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-black tracking-tight uppercase">⚠ Permanent Data Deletion</strong>
            <p class="text-xs opacity-90 font-medium leading-relaxed">
              Purging this term will permanently remove its scheduling data. This action is irreversible and should only
              be performed if no active classes are linked to this term.
            </p>
          </div>
        </AppAlert>

        <AppInput v-model="localData.deleteConfirm" label="Security Confirmation" placeholder='Type "DELETE" to confirm'
          required :error="errors.deleteConfirm" :shake="shaking.deleteConfirm" @input="clearError('deleteConfirm')">
          <template #label-extra>
            <span class="block text-2xs font-black uppercase text-error/60 mt-1">
              Type <span class="px-1 font-black text-error">DELETE</span> to authorize
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Confirmation Overlay ── -->
      <AppConfirmOverlay :show="showConfirm"
        :title="type === 'delete' ? 'Delete Term' : (type === 'edit' ? 'Edit Term' : 'Add Term')"
        :subtitle="type === 'delete' ? 'This action will permanently erase this academic term and its historical data.' : 'Please verify the academic schedule and parameters before proceeding.'"
        :icon="modalIcon" :rows="confirmRows" :confirmLabel="submitLabel" :loading="loading" @back="showConfirm = false"
        @confirm="handleActionSubmit">
        <template #row-Scope>
          <div class="flex flex-wrap justify-end gap-1 max-w-[200px]">
            <template v-if="localData.branchIds.length > 0">
              <AppBadge v-for="id in localData.branchIds" :key="id" :status="branches.find(b => b.id === id)?.abbr"
                :type="branches.find(b => b.id === id)?.color || 'blue'" size="sm" />
            </template>
            <AppBadge v-else status="Global" type="neutral" size="sm" />
          </div>
        </template>
      </AppConfirmOverlay>
    </div>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          <span class="text-xs font-black tracking-tight uppercase">No modifications detected</span>
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton :variant="type === 'delete' ? 'danger' : 'primary'" type="button" @click="requestConfirm"
            :loading="loading" :disabled="loading"
            :class="{ 'opacity-50 pointer-events-none': type === 'edit' && !isDirty }">
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>
