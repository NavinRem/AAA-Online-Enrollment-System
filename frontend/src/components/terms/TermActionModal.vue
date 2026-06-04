<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getProgramProfileURL, getImageUrl } from '@/utils/assetHelper'
import { useActionModal } from '@/composables/useActionModal'
import { calculateClassProgress, formatDateOnly } from '@/utils/formatUtils'
import { calculateSessionDate, calculateTermEndDate } from '@/utils/sessionHelper'
import { useDataStore } from '@/stores/dataStore'
import { useModalText } from '@/composables/useModalText'

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

const firstClassDate = computed(() => {
  if (props.type !== 'session' || !props.schedule?.day || !localData.startDate) return null
  const startDate = new Date(localData.startDate)
  if (isNaN(startDate.getTime())) return null

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDayIndex = dayNames.findIndex(
    (d) => d.toLowerCase() === props.schedule.day.toLowerCase(),
  )

  if (targetDayIndex !== -1) {
    const offset = (targetDayIndex - startDate.getDay() + 7) % 7
    const firstDate = new Date(startDate)
    firstDate.setDate(startDate.getDate() + offset)
    return formatDateOnly(firstDate)
  }
  return null
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
const isBranchDropdownOpen = ref(false)
const dropdownContainer = ref(null)
const scheduleDropdownOpen = ref(false)
const schedDropdownRef = ref(null)

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

const handleClickOutside = (event) => {
  if (
    isBranchDropdownOpen.value &&
    dropdownContainer.value &&
    !dropdownContainer.value.contains(event.target)
  ) {
    isBranchDropdownOpen.value = false
  }
  if (
    scheduleDropdownOpen.value &&
    schedDropdownRef.value &&
    !schedDropdownRef.value.contains(event.target)
  ) {
    scheduleDropdownOpen.value = false
  }
}

const getSessionTeacherIds = (weekIndex) => {
  const sessionData = (currentOffering.value?.sessionTeachers || [])[weekIndex]
  if (!sessionData) return []
  if (sessionData.teachers && Array.isArray(sessionData.teachers)) {
    return sessionData.teachers.map((t) => t?.id).filter(Boolean)
  }
  if (Array.isArray(sessionData)) {
    return sessionData.map((t) => t?.id).filter(Boolean)
  }
  return sessionData.id ? [sessionData.id] : []
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

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

const calculateBranchEndDate = (branchId) => {
  const setting = localData.branchSettings?.find((s) => String(s.branchId) === String(branchId))
  return setting?.endDate || ''
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
    :icon="type === 'session' ? undefined : modalIcon"
    :error="error"
    :success="success"
    :maxWidth="type === 'session' ? '1000px' : '600px'"
    @close="$emit('close')"
  >
    <template #header v-if="type === 'session'">
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
                <span class="text-xs font-bold text-content-muted">
                  {{ schedule?.day }} {{ schedule?.time }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <!-- Schedule Dropdown Switcher (shown when program has multiple schedules) -->
        <div v-if="allSchedules && allSchedules.length > 1" class="relative" ref="schedDropdownRef">
          <!-- Trigger Button -->
          <button
            type="button"
            class="flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-outline-std rounded-xl text-sm font-bold text-content-dark hover:border-primary/50 hover:shadow-sm transition-all duration-200 w-full justify-between group"
            @click="scheduleDropdownOpen = !scheduleDropdownOpen"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-base">📅</span>
              <div class="flex flex-col items-start leading-tight">
                <span class="text-3xs font-bold text-content-muted/60 uppercase tracking-widest"
                  >Active Schedule</span
                >
                <span class="font-bold text-content-dark">
                  {{ schedule?.day || 'Select Schedule' }}
                  <span class="text-content-muted font-semibold ml-1">{{ schedule?.time }}</span>
                </span>
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
                  <div class="flex flex-col leading-tight">
                    <span class="font-bold">{{ sched.day }}</span>
                    <span class="text-xs font-semibold opacity-70">{{ sched.time }}</span>
                  </div>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </template>

    <div v-if="type === 'session'" class="flex flex-col gap-8">
      <!-- Class Identity Panel -->
      <div class="bg-primary-soft rounded-md p-8 border border-primary/60 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div class="flex items-center gap-6">
            <div
              class="w-20 h-20 rounded-xl bg-white shadow-xl shadow-primary/5 border border-outline-std p-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
            >
              <img
                :src="getProgramProfileURL(program?.profileURL, program?.category)"
                class="w-full h-full object-contain"
              />
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-3">
                <AppBadge
                  v-if="activeBranch"
                  :status="activeBranch.name"
                  size="md"
                  :type="activeBranch.color"
                />
                <span class="text-xs font-bold text-content-muted">{{ term.name }}</span>
              </div>
              <h2 class="text-2xl font-bold text-content-dark mt-2">{{ programName }}</h2>
              <div class="flex items-center gap-4 mt-3">
                <div class="flex items-center gap-2">
                  <AppBadge :status="schedule?.day || 'TBA'" size="md" type="day" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-content-dark">{{
                    schedule?.time || 'TBA'
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex items-center gap-8 bg-white p-6 rounded-3xl border border-outline-std/60 shadow-sm justify-center flex-1 lg:flex-none"
          >
            <div class="flex flex-col items-center px-4 border-r border-outline-std/50">
              <span class="text-xs font-semibold text-content-muted mb-1">Total Sessions</span>
              <span class="text-xl font-bold text-content-dark">{{ term.totalSessions || 0 }}</span>
            </div>
            <div class="flex flex-col items-center pr-4">
              <span class="text-xs font-semibold text-content-muted mb-2">Term Progress</span>
              <div class="flex gap-1.5">
                <div
                  v-for="i in term.totalSessions || 0"
                  :key="i"
                  class="w-4 h-2 rounded-full transition-all duration-700"
                  :class="
                    i <= termProgress
                      ? 'bg-primary shadow-sm shadow-primary/50'
                      : 'bg-outline-std/40'
                  "
                ></div>
              </div>
              <span class="text-xs font-semibold text-primary mt-2"
                >{{ termProgress }} of {{ term.totalSessions || 0 }} Sessions Completed</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment Controls Header -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <h4 class="text-sm font-bold text-content-dark">Session Assignments</h4>
          <p class="text-xs font-bold text-content-muted">
            Showing only specialists for
            <span class="text-primary font-bold">{{ programName }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex">
            <img
              v-for="t in filteredTeachers.slice(0, 3)"
              :key="t.id"
              :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')"
              class="w-7 h-7 rounded-full border-2 border-white shadow-sm"
            />
            <div
              v-if="filteredTeachers.length > 3"
              class="w-7 h-7 rounded-full bg-surface-subtle border-2 border-white flex items-center justify-center text-xs font-bold text-content-muted"
            >
              +{{ filteredTeachers.length - 3 }}
            </div>
          </div>
          <span class="text-xs font-semibold text-content-muted/60">Available Experts</span>
        </div>
      </div>

      <AppAlert
        v-if="conflictMessage"
        type="error"
        class="mb-6 w-full animate-in fade-in slide-in-from-top-2"
      >
        {{ conflictMessage }}
      </AppAlert>

      <!-- Sessions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="i in term.totalSessions || 0"
          :key="i"
          class="flex flex-col gap-4 p-6 bg-white rounded-lg border border-outline-std shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group/session relative overflow-hidden"
          :class="i <= termProgress ? 'bg-surface-subtle/20 opacity-80' : ''"
        >
          <!-- Background Decoration -->
          <div
            class="absolute -top-2 -right-2 text-6xl font-bold text-surface-subtle/5 select-none transition-all group-hover/session:text-primary/5"
          >
            {{ i }}
          </div>

          <div class="flex items-center justify-between relative z-10">
            <div class="flex items-center gap-2.5">
              <span
                class="w-2 h-2 rounded-full transition-all duration-500"
                :class="
                  i === termProgress + 1
                    ? 'bg-primary animate-pulse shadow-sm shadow-primary/60'
                    : 'bg-outline-std'
                "
              ></span>
              <span
                class="text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
                :class="
                  i <= termProgress
                    ? 'bg-surface-subtle text-content-muted'
                    : 'bg-primary-soft text-primary'
                "
              >
                Week {{ i }}
              </span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-xs font-semibold text-content-dark leading-none">
                {{
                  calculateSessionDate(
                    localData?.startDate || term?.startDate,
                    currentOffering?.schedule?.day,
                    i,
                  )
                }}
              </span>
              <span class="text-xs font-semibold text-content-muted/40 leading-none mt-1"
                >Session {{ i }}</span
              >
              <span v-if="i <= termProgress" class="text-xs font-semibold text-green-500/60 mt-1"
                >Past Session</span
              >
            </div>
          </div>

          <div class="flex flex-col gap-3 mt-2 relative z-10">
            <div class="flex items-center justify-between ml-1">
              <span class="text-xs font-semibold text-content-muted">Assign Teacher</span>
              <span
                v-if="getSessionTeacherIds(i - 1).length > 0"
                class="text-xs font-semibold text-green-500 flex items-center gap-1"
              >
                <span class="w-1 h-1 rounded-full bg-green-500"></span> Assigned
              </span>
              <span
                v-else-if="responsibleTeachers.length > 0"
                class="text-xs font-semibold text-primary/60 flex items-center gap-1"
              >
                <span class="w-1 h-1 rounded-full bg-primary/40"></span> Default Specialist
              </span>
            </div>

            <AppSelect
              :modelValue="
                getSessionTeacherIds(i - 1).length > 0
                  ? getSessionTeacherIds(i - 1)
                  : responsibleTeachers.map((t) => t?.id).filter(Boolean)
              "
              :items="filteredTeachers"
              placeholder="Select Specialists..."
              :multiple="true"
              size="lg"
              class="!bg-surface-subtle/30 !rounded-xl border-outline-std group-hover/session:border-primary/30 transition-colors"
              @change="(val) => handleTeacherChange(i - 1, val)"
            >
              <template #item="{ item: t }">
                <div class="flex items-center gap-4 py-1">
                  <div class="relative">
                    <img
                      :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                      class="w-10 h-10 rounded-xl shadow-sm"
                    />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-content-dark">{{ t.name }}</span>
                  </div>
                </div>
              </template>
            </AppSelect>
          </div>
        </div>
      </div>
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
              class="text-sm font-semibold text-content-muted flex items-center justify-between gap-1"
            >
              <div class="flex items-center gap-1">Branch Scope</div>
              <button
                type="button"
                @click="toggleAllBranches"
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
          <div class="flex flex-col">
            <AppInput
              v-model="localData.startDate"
              type="date"
              label="Start Date"
              required
              :error="errors.startDate"
              :shake="shaking.startDate"
              @input="clearError('startDate')"
            />
            <!-- First Class Date Hint -->
            <div
              v-if="type === 'session' && firstClassDate"
              class="mt-2 p-2.5 bg-primary/5 rounded-md border border-primary/20 flex items-start gap-2"
            >
              <span class="text-sm mt-0.5">📅</span>
              <p class="text-xs text-content-dark leading-tight">
                First session: <span class="font-bold text-primary">{{ firstClassDate }}</span>
                <br />
                <span class="text-content-muted/80">End date auto-set based on sessions</span>
              </p>
            </div>
          </div>
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
              class="p-4 bg-surface-subtle/50 rounded-md border border-outline-std hover:border-primary/30 transition-all"
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
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center justify-between w-full gap-4">
              <span class="font-bold text-content-dark truncate flex-1">{{ item.name }}</span>
              <div class="flex items-center gap-2 shrink-0">
                <AppBadge :status="formatDateOnly(item.startDate)" type="green" />
                <span class="text-content-muted text-xs">→</span>
                <AppBadge :status="formatDateOnly(item.endDate)" type="red" />
              </div>
            </div>
            <span v-else class="text-content-light text-sm italic opacity-70">Select a recent term to clone...</span>
          </template>
          <template #item="{ item }">
            <div class="flex items-center justify-between w-full gap-4">
              <span class="font-bold text-content-dark truncate flex-1">{{ item.name }}</span>
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
