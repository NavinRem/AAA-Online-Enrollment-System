<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getImageUrl } from '@/utils/assetHelper'
import { useActionModal } from '@/composables/useActionModal'
import { calculateClassProgress, formatDateOnly } from '@/utils/formatUtils'
import { calculateTermEndDate } from '@/utils/sessionHelper'
import { useDataStore } from '@/stores/dataStore'
import { useModalText } from '@/composables/useModalText'
import TermSessionHeader from './forms/TermSessionHeader.vue'
import TermSessionGrid from './forms/TermSessionGrid.vue'
import TermBasicInfoPanel from './forms/TermBasicInfoPanel.vue'
import TermBranchSettingsPanel from './forms/TermBranchSettingsPanel.vue'
import TermDuplicatePanel from './forms/TermDuplicatePanel.vue'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'delete'
  term: Object,
  branches: { type: Array, default: () => [] },
  terms: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  success: String,
  offeringId: [String, Number],
  programId: [String, Number],
  programName: String,
  schedule: Object,
  allSchedules: { type: Array, default: () => [] },
  teachers: { type: Array, default: () => [] },
  activeBranch: Object,
})

const emit = defineEmits(['close', 'submit', 'update-teacher', 'switch-schedule'])

const dataStore = useDataStore()

const filteredTeachers = computed(() => {
  if (!props.programId) return props.teachers
  return props.teachers.filter((t) =>
    (t.programIds || []).some((pid) => String(pid) === String(props.programId)),
  )
})

const currentOffering = computed(() => {
  if (!props.term || !props.offeringId) return null
  return (props.term.offerings || []).find((o) => o.offeringId === props.offeringId)
})

const program = computed(() => {
  if (!props.programId) return null
  return dataStore.programs.find((p) => String(p.id) === String(props.programId))
})

const responsibleTeachers = computed(() => {
  if (!currentOffering.value) return []
  return (currentOffering.value.teacherIds || [])
    .map((tid) => {
      return props.teachers.find((t) => String(t.id) === String(tid))
    })
    .filter(Boolean)
})

const termProgress = computed(() => {
  if (!props.term || !props.term.totalSessions) return 0
  const progress = calculateClassProgress(props.term.startDate, props.term.endDate)
  const completedSessions = Math.round((progress.percentage / 100) * props.term.totalSessions)
  return completedSessions || 0
})

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
        status: data.status,
      }))
    }
    return data
  }
  return getInitialData()
}

const { localData, shaking, errors, validate, clearError, getPayload } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    mapSourceToForm,
    sourceKey: 'term',
    autoClear: 3000,
  },
)

const showConfirm = ref(false)

const conflictMessage = ref('')

const checkForConflicts = (teacherIds, weekIndex) => {
  const sourceOffering = currentOffering.value
  if (!sourceOffering || !sourceOffering.schedule || !props.term || !props.term.offerings)
    return null

  // teacherIds is an array of IDs from the multi-select
  for (const tid of teacherIds) {
    const conflictingOffering = props.term.offerings.find((o) => {
      // Must be a different branch
      if (String(o.branchId) === String(sourceOffering.branchId)) return false

      // Must have the same schedule
      if (
        !o.schedule ||
        o.schedule.day !== sourceOffering.schedule.day ||
        o.schedule.time !== sourceOffering.schedule.time
      )
        return false

      // Check if teacher is assigned to this week
      const sessionTeachers = o.sessionTeachers || []
      const weekTeachers = sessionTeachers[weekIndex]

      if (weekTeachers && weekTeachers.teachers) {
        return weekTeachers.teachers.some((t) => String(t.id) === String(tid))
      } else {
        // Fallback to default responsible teachers
        return (o.teacherIds || []).some((id) => String(id) === String(tid))
      }
    })

    if (conflictingOffering) {
      const teacher = props.teachers.find((t) => String(t.id) === String(tid))
      const branchName =
        props.branches.find((b) => String(b.id) === String(conflictingOffering.branchId))?.name ||
        'another branch'
      return `Conflict: Teacher ${teacher?.name || 'Selected'} is already scheduled at ${branchName} for ${conflictingOffering.schedule.day} ${conflictingOffering.schedule.time} during Week ${weekIndex + 1}.`
    }
  }
  return null
}

const handleTeacherChange = (weekIndex, teacherIds) => {
  conflictMessage.value = ''

  const conflict = checkForConflicts(teacherIds, weekIndex)
  if (conflict) {
    conflictMessage.value = conflict
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      conflictMessage.value = ''
    }, 5000)
    return
  }

  emit('update-teacher', {
    offeringId: props.offeringId,
    weekIndex,
    teacherId: teacherIds,
  })
}

const toggleAllBranches = () => {
  if (localData.branchIds.length === props.branches.length) {
    localData.branchIds = []
  } else {
    localData.branchIds = props.branches.map((b) => b.id)
  }
  clearError('branchIds')
}






const customTitle = computed(() => {
  if (props.type === 'session') return `Session Management: ${props.programName}`
  return undefined
})

const { modalTitle, submitLabel, modalIcon } = useModalText(() => props.type, 'Term', {
  customTitle,
})

const validationMessage = ref('')
const isFormInvalid = computed(() => {
  if (props.type === 'delete') return !localData.deleteConfirm
  if (!localData.name || !localData.totalSessions) return true
  if (localData.branchIds.length > 0) {
    return !localData.branchSettings || localData.branchSettings.some((s) => !s.startDate)
  }
  return !localData.startDate
})

const requestConfirm = () => {
  validationMessage.value = ''
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
        if (localData.branchIds.length > 0) {
          const allFilled = localData.branchSettings?.every((s) => s.startDate)
          return allFilled || 'All branch start dates are required'
        }
        if (val) return true
        return 'Start Date is required'
      },
    },
  }

  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (!validate(rules)) {
    validationMessage.value =
      props.type === 'delete'
        ? 'Please type DELETE to confirm.'
        : 'Please fill out all required fields to proceed.'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
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

  const payload = getPayload()

  if (props.type === 'delete') {
    emit('submit', { id: localData.id })
    return
  }

  if (payload.totalSessions !== undefined && payload.totalSessions !== null) {
    payload.totalSessions = parseInt(payload.totalSessions, 10)
  }

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
    { key: 'Name', value: localData.name, valueClass: 'font-bold text-content-dark' },
    {
      key: 'StartDate',
      value: formatDateOnly(localData.startDate || localData.branchSettings?.[0]?.startDate),
    },
    {
      key: 'EndDate',
      value: formatDateOnly(localData.endDate || localData.branchSettings?.[0]?.endDate),
    },
    { key: 'TotalSessions', value: `${localData.totalSessions} Weeks` },
  ]

  if (props.type === 'add') {
    rows.push({ key: 'DuplicateTerm', value: duplicateTermLabel.value || 'Fresh Term' })
  }

  rows.push({ key: 'Branches', value: '' }) // Handled by slot

  if (props.type !== 'add' && props.term) {
    const offeringsCount = (props.term.offerings || []).length
    rows.push(
      { key: 'Classes', value: `${offeringsCount} Schedules` },
      { key: 'Students', value: `${props.term.totalStudents || 0} Enrolled` },
    )
  }

  rows.push({
    key: 'Status',
    value: calculateClassProgress(
      localData.startDate || localData.branchSettings?.[0]?.startDate,
      localData.endDate || localData.branchSettings?.[0]?.endDate,
    ).status,
  })

  if (props.type === 'delete') {
    rows.push({
      key: 'DeleteConfirm',
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

// Auto-calculate end date for global (schedule-day-aware)
// The schedule prop gives us the class day — e.g. Wednesday class starting from a Saturday term.
watch(
  () => [localData.startDate, localData.totalSessions],
  ([start, sessions]) => {
    if (!start || !sessions) return
    // Use the schedule day from props if available so end date lands on actual last session
    const scheduleDay = props.schedule?.day
    localData.endDate = calculateTermEndDate(start, sessions, scheduleDay)
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

// Auto-calculate end dates for branch settings (schedule-day-aware)
watch(
  () => [localData.branchSettings, localData.totalSessions],
  () => {
    if (!localData.branchSettings || !localData.totalSessions) return
    const scheduleDay = props.schedule?.day
    localData.branchSettings.forEach((setting) => {
      if (!setting.startDate) return
      setting.endDate = calculateTermEndDate(
        setting.startDate,
        localData.totalSessions,
        scheduleDay,
      )
    })
  },
  { deep: true, immediate: true },
)


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
    :icon="type === 'session' ? undefined : modalIcon"
    :error="error"
    :success="success"
    :maxWidth="type === 'session' ? '1000px' : '600px'"
    @close="$emit('close')"
  >
    <template #header v-if="type === 'session'">
      <TermSessionHeader
        :program="program"
        :program-name="programName"
        :schedule="schedule"
        :all-schedules="allSchedules"
        :offering-id="offeringId"
        @switch-schedule="$emit('switch-schedule', $event)"
      />
    </template>

    <div v-if="type === 'session'" class="flex flex-col gap-8">
      <TermSessionGrid
        :program="program"
        :program-name="programName"
        :active-branch="activeBranch"
        :term="term"
        :schedule="schedule"
        :term-progress="termProgress"
        :filtered-teachers="filteredTeachers"
        :conflict-message="conflictMessage"
        :responsible-teachers="responsibleTeachers"
        :local-data="localData"
        :current-offering="currentOffering"
        @teacher-change="handleTeacherChange"
      />
    </div>

    <div v-if="type !== 'session'" class="relative min-h-80">
      <!-- ADD / EDIT MODE -->
      <form
        v-if="type === 'add' || type === 'edit'"
        id="termActionForm"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
        @submit.prevent="requestConfirm"
        novalidate
      >
        <TermBasicInfoPanel
          :local-data="localData"
          :errors="errors"
          :shaking="shaking"
          :branches="branches"
          @clear-error="clearError"
          @toggle-branches="toggleAllBranches"
        />

        <TermBranchSettingsPanel
          :local-data="localData"
          :errors="errors"
          :branches="branches"
          @clear-error="clearError"
          @apply-master-date="() => {
            if (localData.startDate) {
              localData.branchSettings.forEach(s => s.startDate = localData.startDate)
            }
          }"
          @update-branch-start-date="updateBranchStartDate"
        />

        <TermDuplicatePanel
          v-if="type === 'add'"
          :local-data="localData"
          :duplicate-term-options="duplicateTermOptions"
        />
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
        :title="modalTitle"
        :subtitle="
          type === 'delete'
            ? 'This action will permanently erase this academic term and its historical data.'
            : 'Please verify the academic schedule and parameters before proceeding.'
        "
        :icon="modalIcon"
        :image="getImageUrl('enrollment/total-enrollment')"
        :rows="confirmRows"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleActionSubmit"
      >
        <template #row-Branches>
          <div class="flex flex-wrap justify-end gap-1 max-w-52">
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
      <div v-if="type === 'session'" class="flex items-center justify-between w-full px-2">
        <div class="flex items-center gap-4 text-content-muted">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span class="text-4xs font-black uppercase tracking-wider">Auto-Saved</span>
          </div>
          <span class="text-xs font-bold italic opacity-60"
            >Teachers are filtered to specialists for this program.</span
          >
        </div>
        <div class="flex items-center gap-3">
          <AppButton variant="ghost" size="md" @click="$emit('close')"> Cancel </AppButton>
          <AppButton variant="primary" size="md" @click="$emit('close')"> Finish </AppButton>
        </div>
      </div>
      <div v-else class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="validationMessage" type="error" class="w-full">
          {{ validationMessage }}
        </AppAlert>
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type === 'delete' ? 'danger' : 'primary'"
            type="button"
            @click="requestConfirm"
            :loading="loading"
            :disabled="loading"
            :class="{
              'opacity-60 grayscale-20': (type === 'edit' && !isDirty) || isFormInvalid,
            }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>
