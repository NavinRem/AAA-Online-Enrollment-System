<script setup>
import { ref, computed, watch } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { scheduleService } from '@/services/scheduleService'
import { classService } from '@/services/classService'
import { useDataStore } from '@/stores/dataStore'
import { useModalText } from '@/composables/useModalText'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  classInstance: Object,
  context: Object, // { termId, offeringId, termName, offeringIds }
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'clear-error', 'clear-success'])

const getInitialData = () => ({
  programId: '',
  scheduleIds: [],
  branchIds: [],
  classIds: [],
  scheduleCapacities: {},
  scheduleTeachers: {}, // { scheduleId: teacherId }
  deleteConfirm: '',
  status: 'active',
})

const mapSourceToForm = () => {
  const classDataToUse = props.classInstance
  if (classDataToUse) {
    const initialCapacities = {}
    const initialTeachers = {}
    if (classDataToUse.schedules) {
      classDataToUse.schedules.forEach((s) => {
        if (s.capacity) initialCapacities[s.id] = s.capacity
        if (s.teacherId) initialTeachers[s.id] = s.teacherId
      })
    }
    return {
      ...getInitialData(),
      programId: classDataToUse.programId || '',
      scheduleIds: Array.from(
        new Set([
          ...(classDataToUse.scheduleIds ||
            classDataToUse.schedules?.map((schedule) => schedule.id) ||
            []),
        ]),
      ),
      branchIds: Array.from(
        new Set([
          ...(classDataToUse.branchIds ||
            classDataToUse.branches?.map((branch) => branch.id) ||
            []),
        ]),
      ),
      classIds: [],
      scheduleCapacities: initialCapacities,
      scheduleTeachers: initialTeachers,
      status: classDataToUse.status || 'active',
    }
  }
  return getInitialData()
}

const { localData: form, originalData, isDirty, errors, shaking, validate, clearError, triggerShake } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
  sourceKey: 'classInstance',
  autoClear: 3000,
})

const dataStore = useDataStore()

const teachers = computed(() => dataStore.teachers.map((t) => ({
  id: t.id,
  name: t.name,
  profileURL: t.profileURL,
  branchAbbr: t.branchAbbr,
})))
const branches = computed(() => dataStore.branches)
const classes = computed(() => dataStore.classes)

const programs = computed(() => dataStore.programs.map((program) => {
  const category = dataStore.categories.find((item) => item.id === program.categoryId)
  return {
    ...program,
    categoryProfileURL: category?.profileURL || '',
  }
}))

const schedules = computed(() => dataStore.schedules.map((schedule) => ({
  ...schedule,
  name: `${schedule.day} (${schedule.time})`,
})))
const lookupLoading = ref(false)
const lookupError = ref('')
const lookupSuccess = ref('')
const manageSchedules = ref(false)
const justAddedId = ref(null)
const showConfirm = ref(false)
const newSchedule = ref({
  day: 'Saturday',
  startTime: '09:00',
})

const dayOptions = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((day) => ({ id: day, name: day }))

// Only persisted (admin-set) statuses — 'ongoing' is computed on list views
const statusOptions = [
  { id: 'available', name: 'Available', color: 'green' },
  { id: 'upcoming', name: 'Upcoming', color: 'blue' },
]

const selectedProgram = computed(() =>
  programs.value.find((program) => program.id === form.programId),
)
const sortedSchedules = computed(() => {
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return [...schedules.value].sort((left, right) => {
    const leftIndex = dayOrder.indexOf(left.day)
    const rightIndex = dayOrder.indexOf(right.day)

    if (leftIndex !== rightIndex) return leftIndex - rightIndex
    return (left.time || '').localeCompare(right.time || '')
  })
})

const parse12hToMinutes = (time12h) => {
  const [time, period] = time12h.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

const getScheduleById = (id) => schedules.value.find((s) => s.id === id)

const getScheduleDuration = (timeRange) => {
  const range = (timeRange || '').split(' - ')
  if (range.length !== 2) return ''
  const start = parse12hToMinutes(range[0])
  const end = parse12hToMinutes(range[1])
  let diff = end - start
  if (diff < 0) diff += 1440
  return `${diff}mn`
}

const getScheduleDurationMinutes = (timeRange) => {
  const range = (timeRange || '').split(' - ')
  if (range.length !== 2) return null
  const start = parse12hToMinutes(range[0])
  const end = parse12hToMinutes(range[1])
  let diff = end - start
  if (diff < 0) diff += 1440
  return diff
}

const filteredSchedules = computed(() => {
  const active = sortedSchedules.value.filter((s) => s.isDeleted !== true)
  const programDuration = selectedProgram.value?.duration

  // If no program is selected yet, show all active schedules
  if (!programDuration) return active

  return active.filter((s) => {
    // Always keep already-selected schedules so user can deselect them
    if (form.scheduleIds.includes(s.id)) return true

    // Only show unselected schedules whose duration matches the program
    const dur = getScheduleDurationMinutes(s.time)
    return dur !== null && dur === programDuration
  })
})

const customTitle = computed(() => {
  if (props.type === 'remove') return `Remove Class from ${props.context?.termName || 'Term'}`
  if (props.context) return 'Select Class'
  return undefined
})

const { modalTitle, submitLabel, modalIcon } = useModalText(() => props.type, 'Class', { customTitle })

const validationMessage = ref('')
const isFormInvalid = computed(() => {
  if (props.type === 'delete' || props.type === 'remove') return !form.deleteConfirm
  if (props.context) return form.classIds.length === 0
  return !form.programId || form.scheduleIds.length === 0 || form.branchIds.length === 0
})

// isDirty is provided by useActionModal

const confirmRows = computed(() => {
  const rows = []
  
  if (props.context) {
    rows.push(
      { key: 'Program', value: selectedProgram.value?.name || 'N/A' },
      { key: 'Category', value: selectedProgram.value?.category || 'Standard' },
      { key: 'Classes', value: `${form.classIds.length} Schedules Selected` },
    )
  } else {
    rows.push(
      { key: 'Program', value: selectedProgram.value?.name || 'N/A' },
      { key: 'Category', value: selectedProgram.value?.category || 'Standard' },
      { key: 'Duration', value: `${selectedProgram.value?.duration || 0} Minutes` },
    )
    if (form.branchIds && form.branchIds.length > 0) {
      rows.push({ key: 'Branches', value: `${form.branchIds.length} Selected` })
    }
  }

  if (props.type === 'delete' || props.type === 'remove') {
    rows.push(
      {
        key: 'Warning',
        value:
          props.type === 'remove'
            ? 'This will remove the class and all its schedules from this specific branch for this term.'
            : 'This will permanently remove this class product from the catalog.',
        valueClass: 'text-error',
      },
      {
        key: 'DeleteConfirm',
        value: form.deleteConfirm,
        valueClass: 'text-error font-bold',
      }
    )
    return rows
  }

  rows.push({ key: 'Schedules', value: `${form.scheduleIds.length} Sessions Assigned` })
  
  if (form.status) {
    rows.push({ key: 'Status', value: form.status })
  }
  
  return rows
})

const filteredPickerClasses = computed(() => {
  if (!form.programId) return []
  const matches = classes.value.filter(
    (c) =>
      String(c.programId) === String(form.programId) ||
      String(c.program?.id) === String(form.programId),
  )

  const flattened = []
  matches.forEach((c) => {
    if (c.schedules && c.schedules.length > 0) {
      c.schedules.forEach((s) => {
        const isAlreadyAdded = props.context?.existingOfferings?.some(
          (o) => String(o.classId) === String(c.id) && String(o.scheduleId) === String(s.id)
        )
        if (isAlreadyAdded) return

        flattened.push({
          ...c,
          id: `${c.id}_${s.id}`, // Unique ID for AppSelect
          originalClassId: c.id,
          displaySchedule: s,
        })
      })
    } else {
      flattened.push({
        ...c,
        id: `${c.id}_none`,
        originalClassId: c.id,
        displaySchedule: null,
      })
    }
  })

  return flattened
})

const loadOptions = async (skipCache = false) => {
  if (skipCache) {
    await dataStore.fetchSchedules(true)
  }
}

const toggleScheduleManage = () => {
  manageSchedules.value = !manageSchedules.value
  if (!manageSchedules.value) {
    newSchedule.value = { day: 'Saturday', startTime: '09:00' }
    lookupError.value = ''
    lookupSuccess.value = ''
  }
}

const calculatedEndTime = computed(() => {
  if (!newSchedule.value.startTime) return ''
  const [h, m] = newSchedule.value.startTime.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)

  const duration = selectedProgram.value?.duration || 60
  date.setMinutes(date.getMinutes() + duration)

  const endHours = date.getHours()
  const endMinutes = date.getMinutes()
  return formatTime12h(
    `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`,
  )
})

const formatTime12h = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`
}

const addSchedule = async () => {
  if (!newSchedule.value.startTime) return
  const startStr = formatTime12h(newSchedule.value.startTime)
  const endStr = calculatedEndTime.value
  const timeRange = `${startStr} - ${endStr}`

  lookupLoading.value = true
  lookupError.value = ''
  try {
    const response = await scheduleService.createSchedule({
      day: newSchedule.value.day,
      time: timeRange,
    })

    const newId = response?.id || response?.data?.id
    await loadOptions(true)

    // Deduplicate schedule IDs and automatically select the newly created schedule
    if (newId) {
      const currentIds = new Set(form.scheduleIds)
      currentIds.add(newId)
      form.scheduleIds = Array.from(currentIds)
    }

    justAddedId.value = newId
    setTimeout(() => {
      justAddedId.value = null
    }, 5000)

    const addedDay = newSchedule.value.day
    newSchedule.value = { day: 'Saturday', startTime: '09:00' }
    lookupSuccess.value = `Schedule "${addedDay}: ${timeRange}" added to catalog`
    setTimeout(() => {
      lookupSuccess.value = ''
    }, 3000)
  } catch (error) {
    lookupError.value = error.message || 'Failed to add schedule'
  } finally {
    lookupLoading.value = false
  }
}

const deselectSchedule = (scheduleId) => {
  form.scheduleIds = form.scheduleIds.filter((id) => id !== scheduleId)
  handleScheduleChange()
}

const deleteSchedule = async (scheduleId) => {
  lookupLoading.value = true
  lookupError.value = ''
  try {
    await scheduleService.deleteSchedule(scheduleId)
    if (form.scheduleIds.includes(scheduleId)) {
      form.scheduleIds = form.scheduleIds.filter((id) => id !== scheduleId)
    }
    await loadOptions()
  } catch (error) {
    lookupError.value = error.message || 'Failed to delete schedule'
  } finally {
    lookupLoading.value = false
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      clearError()
      return
    }
    await loadOptions()
    manageSchedules.value = false
    lookupError.value = ''
    newSchedule.value = { day: 'Saturday', startTime: '09:00' }

    let classDataToUse = props.classInstance
    if (props.type === 'edit' && classDataToUse?.id) {
      try {
        const response = await classService.getClass(classDataToUse.id)
        classDataToUse = response.data || response
        
        // Update form and originalData with fetched async data
        const initialCapacities = {}
        const initialTeachers = {}
        if (classDataToUse?.schedules) {
          classDataToUse.schedules.forEach((s) => {
            if (s.capacity) initialCapacities[s.id] = s.capacity
            if (s.teacherId) initialTeachers[s.id] = s.teacherId
          })
        }

        const updatedData = {
          programId: classDataToUse?.programId || '',
          scheduleIds: Array.from(
            new Set([
              ...(classDataToUse?.scheduleIds ||
                classDataToUse?.schedules?.map((schedule) => schedule.id) ||
                []),
            ]),
          ),
          branchIds: Array.from(
            new Set([
              ...(classDataToUse?.branchIds ||
                classDataToUse?.branches?.map((branch) => branch.id) ||
                []),
            ]),
          ),
          classIds: [],
          scheduleCapacities: initialCapacities,
          scheduleTeachers: initialTeachers,
          status: classDataToUse?.status || 'active',
        }
        
        Object.assign(form, JSON.parse(JSON.stringify(updatedData)))
        Object.assign(originalData, JSON.parse(JSON.stringify(updatedData)))

      } catch (err) {
        console.error('Failed to fetch full class details:', err)
      }
    }
  },
  { immediate: true },
)

watch(
  () => form.scheduleIds,
  (newIds) => {
    newIds.forEach((id) => {
      if (!form.scheduleCapacities[id]) {
        form.scheduleCapacities[id] = selectedProgram.value?.capacity || 5
      }
    })
  },
  { deep: true },
)

const handleProgramChange = () => {
  clearError('programId')
  if (props.context) {
    form.classIds = []
  }
  // We no longer automatically filter scheduleIds here to allow the user
  // to see 'previously chosen' schedules and manually manage them.
}

const handleScheduleChange = () => {
  clearError('scheduleIds')
}

const handleDisabledClick = (field) => {
  if ((field === 'scheduleIds' || field === 'classIds') && !form.programId) {
    validationMessage.value = 'Please select a program first'
    setTimeout(() => { validationMessage.value = '' }, 3000)
    errors.programId = 'Please select a program first'
    triggerShake('programId')
  }
}

const handleSubmit = () => {
  validationMessage.value = ''
  if (!isDirty.value && props.type === 'edit') return

  if (props.type === 'delete' || props.type === 'remove') {
    if (form.deleteConfirm !== 'DELETE') {
      validationMessage.value = 'Please type DELETE to confirm.'
      setTimeout(() => {
        validationMessage.value = ''
      }, 3000)
      triggerShake('deleteConfirm')
      return
    }
    showConfirm.value = true
    return
  }

  const isValid = validate(
    props.context
      ? { required: ['classIds'] }
      : { required: ['programId', 'scheduleIds', 'branchIds'] },
  )

  if (isValid) {
    showConfirm.value = true
  } else {
    validationMessage.value = 'Please fill out all required fields to proceed.'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
  }
}

const confirmSubmit = () => {
  showConfirm.value = false

  if (props.context && props.type === 'add') {
    const classIds = new Set()
    const scheduleIds = new Set()

    form.classIds.forEach((id) => {
      const [cId, sId] = id.split('_')
      classIds.add(cId)
      if (sId && sId !== 'none') scheduleIds.add(sId)
    })

    emit('submit', {
      classIds: Array.from(classIds),
      scheduleIds: Array.from(scheduleIds),
    })
    return
  }

  // Deduplicate and attach capacities and teachers to schedules
  const uniqueIds = Array.from(new Set(form.scheduleIds))
  const uniqueBranchIds = Array.from(new Set(form.branchIds))
  const enrichedSchedules = uniqueIds.map((id) => ({
    id,
    capacity: form.scheduleCapacities[id] || 20,
    teacherId: form.scheduleTeachers[id] || '',
    teacher: teachers.value.find((t) => t.id === form.scheduleTeachers[id]) || null,
  }))

  emit('submit', {
    programId: form.programId,
    scheduleIds: uniqueIds,
    branchIds: uniqueBranchIds,
    schedulesData: enrichedSchedules,
    status: form.status,
  })
}

const selectAllBranches = () => {
  form.branchIds = branches.value.map((b) => b.id)
  clearError('branchIds')
}
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    :icon="modalIcon"
    :error="error"
    :success="success"
    maxWidth="720px"
    @close="$emit('close')"
    @clear-error="$emit('clear-error')"
    @clear-success="$emit('clear-success')"
  >
    <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
      <AppAlert v-if="context?.termName && type !== 'remove'" type="info">
        <span class="font-bold text-lg">⚠️ This Term Only</span><br />
        You are editing settings for
        <span class="font-bold text-primary">{{ context.termName }}</span
        >. It <span class="underline">will not</span> change class catalog or other terms.
      </AppAlert>

      <template v-if="type !== 'delete' && type !== 'remove'">
        <div
          v-if="!context || type === 'edit'"
          class="grid grid-cols-2 gap-x-8 gap-y-10 items-start"
        >
          <AppSelect
            v-model="form.programId"
            :items="programs"
            label="Program"
            placeholder="Select program..."
            required
            :error="errors.programId"
            :shake="shaking.programId"
            :disabled="!!context"
            @change="handleProgramChange"
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
                    <span class="text-3xs font-semibold text-content-muted">{{
                      item.category
                    }}</span>
                  </div>
                </div>
                <AppBadge :status="`${item.duration} mn`" type="blue" />
              </div>
            </template>
          </AppSelect>
          <div class="flex flex-col w-full gap-xs">
            <div class="flex items-center justify-between">
              <label class="text-sm font-semibold text-content-muted flex items-center gap-1">
                Branch Selection
                <span class="text-error font-bold leading-none">*</span>
              </label>
              <button
                type="button"
                @click="selectAllBranches"
                class="text-xs font-bold text-primary hover:underline"
              >
                Select all branches
              </button>
            </div>
            <AppSelect
              v-model="form.branchIds"
              :items="branches"
              placeholder="Select branches..."
              required
              multiple
              :error="errors.branchIds"
              :shake="shaking.branchIds"
              @change="clearError('branchIds')"
            >
              <template #selected="{ items }">
                <div v-if="!items?.length" class="text-content-muted/40 italic">
                  Choose branches...
                </div>

                <div v-else class="flex items-center gap-2 overflow-hidden flex-wrap">
                  <AppBadge
                    v-for="item in items"
                    :key="item.id"
                    :status="item.abbr"
                    :type="item.color"
                    size="sm"
                    class="w-12 text-center"
                  />
                </div>
              </template>
              <template #item="{ item }">
                <div class="flex items-center gap-3 w-full">
                  <AppBadge
                    :status="item.abbr"
                    :type="item.color"
                    size="sm"
                    class="w-12 text-center"
                  />
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
                @click="toggleScheduleManage"
                class="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Manage Schedules
              </button>
            </div>
            <AppSelect
              v-model="form.scheduleIds"
              :items="filteredSchedules"
              placeholder="Select schedules..."
              required
              multiple
              :error="errors.scheduleIds"
              :shake="shaking.scheduleIds"
              :disabled="!form.programId"
              @change="handleScheduleChange"
              @click-disabled="handleDisabledClick('scheduleIds')"
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
                  <span class="text-sm font-semibold text-content-dark">{{ item.day }}</span>
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
              v-model="form.status"
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
        <div v-else-if="context && type === 'add'" class="flex flex-col gap-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 items-start">
            <AppSelect
              v-model="form.programId"
              :items="programs"
              label="Select Program"
              placeholder="Select a program first..."
              required
              :error="errors.programId"
              :shake="shaking.programId"
              @change="handleProgramChange"
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
                      <span class="text-3xs font-semibold text-content-muted">{{
                        item.category
                      }}</span>
                    </div>
                  </div>
                  <AppBadge :status="`${item.duration} mn`" type="blue" />
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
                    <span class="text-sm font-semibold text-content-dark truncate">{{
                      item.name
                    }}</span>
                    <span class="text-3xs font-semibold text-content-muted">{{
                      item.category
                    }}</span>
                  </div>
                </div>
              </template>
            </AppSelect>

            <AppSelect
              v-model="form.classIds"
              :items="filteredPickerClasses"
              label="Select Classes"
              placeholder="Choose classes..."
              required
              multiple
              :disabled="!form.programId"
              :error="errors.classIds"
              :shake="shaking.classIds"
              dropdownWidth="500px"
              @change="clearError('classIds')"
              @click-disabled="handleDisabledClick('classIds')"
            >
              <template #selected="{ items }">
                <span v-if="!items?.length" class="text-content-muted/40 italic"
                  >Choose classes...</span
                >
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
                  <div class="flex flex-[2] flex-col gap-1 min-w-[120px]">
                    <template v-if="item.displaySchedule">
                      <AppBadge
                        :status="item.displaySchedule.day"
                        type="blue"
                        size="sm"
                        class="w-fit"
                      />
                      <span class="text-xs font-semibold text-content-dark whitespace-nowrap">{{
                        item.displaySchedule.time
                      }}</span>
                    </template>
                    <span v-else class="text-xs text-content-muted font-medium italic"
                      >No schedule</span
                    >
                  </div>

                  <!-- Branches -->
                  <div class="flex flex-col flex-wrap gap-1 min-w-[100px]">
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
        <!-- Selected Schedules Preview -->
        <div
          v-if="(!context || type === 'edit') && form.scheduleIds.length > 0"
          class="flex flex-col gap-4 mt-2 animate-in slide-in-from-top-2 duration-500"
        >
          <div class="flex items-center justify-between px-1">
            <span class="text-sm font-semibold text-content-muted"
              >Selected Sessions Configuration</span
            >
            <span class="text-sm font-bold text-content-muted"
              >{{ form.scheduleIds.length }} session{{
                form.scheduleIds.length === 1 ? '' : 's'
              }}</span
            >
          </div>
          <div class="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div
              v-for="id in form.scheduleIds"
              :key="id"
              class="flex items-center justify-between bg-white border border-outline-std rounded-sm p-5 shadow-sm"
            >
              <div class="flex items-center gap-4 flex-1">
                <div class="flex flex-col gap-1">
                  <span class="text-base font-bold text-content-dark flex items-center gap-2">
                    {{ getScheduleById(id)?.day }}
                    <span class="text-sm font-bold text-content-muted/60 tracking-tighter"
                      >({{ getScheduleDuration(getScheduleById(id)?.time) }})</span
                    >
                  </span>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-sm font-bold text-primary tracking-tight bg-primary-soft/50 px-2 py-0.5 rounded-md border border-primary/10"
                      >{{ getScheduleById(id)?.time }}</span
                    >
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-6 ml-4">
                <div class="flex flex-col gap-1.5 min-w-52">
                  <label class="text-xs font-bold text-content-muted"> Responsible Teacher </label>
                  <AppSelect
                    v-model="form.scheduleTeachers[id]"
                    :items="teachers"
                    placeholder="Assign Teacher..."
                    size="sm"
                    :searchable="true"
                    class="!bg-surface-subtle/50"
                  >
                    <template #selected="{ item }">
                      <div v-if="item" class="flex items-center gap-2">
                        <img
                          :src="item.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                          class="w-5 h-5 rounded-full border border-outline-std"
                        />
                        <span class="text-xs font-bold truncate max-w-24">{{ item.name }}</span>
                      </div>
                    </template>
                    <template #item="{ item }">
                      <div class="flex items-center gap-2 w-full">
                        <img
                          :src="item.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                          class="w-6 h-6 rounded-lg border border-outline-std"
                        />
                        <div class="flex flex-col overflow-hidden">
                          <span class="text-xs font-bold text-content-dark truncate">{{
                            item.name
                          }}</span>
                          <span class="text-xs text-content-muted font-semibold">{{
                            item.branchAbbr || 'Cross-Branch'
                          }}</span>
                        </div>
                      </div>
                    </template>
                  </AppSelect>
                </div>

                <div class="flex flex-col items-center gap-1.5">
                  <label class="text-xs font-bold text-content-muted"> Capacity </label>
                  <div
                    class="flex items-center gap-3 bg-surface-subtle p-sm rounded-sm border border-outline-std"
                  >
                    <input
                      type="number"
                      v-model.number="form.scheduleCapacities[id]"
                      class="w-14 h-6 text-base font-black text-center bg-transparent text-content-dark outline-none focus:text-primary transition-colors"
                      min="1"
                      required
                    />
                    <span class="text-xs font-bold text-content-muted">Seats</span>
                  </div>
                </div>
                <button
                  v-if="!context"
                  type="button"
                  @click="deselectSchedule(id)"
                  class="w-12 h-12 flex items-center justify-center hover:bg-error-soft text-content-muted hover:text-error rounded-xl transition-all border border-transparent hover:border-error/20 group/btn"
                >
                  <img
                    :src="getActionIcon('delete')"
                    class="w-5 h-5 group-hover/btn:opacity-100 transition-opacity"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="manageSchedules"
          class="p-md bg-primary-soft/30 rounded-std border-2 border-dashed border-primary/20 flex flex-col gap-sm animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-primary flex items-center gap-xs">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Manage schedules
            </span>
            <button
              type="button"
              @click="toggleScheduleManage"
              class="text-xs font-semibold text-content-muted hover:text-error"
            >
              Close
            </button>
          </div>

          <div class="flex flex-col gap-sm">
            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
              <!-- Setup Row -->
              <div class="col-span-2 grid grid-cols-[1.2fr_1fr_1fr] gap-4 items-end">
                <AppSelect
                  v-model="newSchedule.day"
                  :items="dayOptions"
                  label="Day"
                  required
                  :searchable="false"
                >
                  <template #selected="{ item }">
                    <span v-if="item" class="text-sm font-semibold text-content-dark">{{
                      item.name
                    }}</span>
                  </template>
                  <template #item="{ item }">
                    <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
                  </template>
                </AppSelect>
                <AppInput v-model="newSchedule.startTime" type="time" label="Start Time" required />
                <AppInput :modelValue="calculatedEndTime" label="End Time" disabled />
              </div>

              <div class="col-span-2 flex justify-end pt-2 border-t border-primary/10">
                <AppButton size="md" type="button" @click="addSchedule" :loading="lookupLoading">
                  Add Schedule
                </AppButton>
              </div>
            </div>
          </div>

          <AppAlert v-if="lookupError" type="error" size="sm" closable @close="lookupError = ''">
            {{ lookupError }}
          </AppAlert>
          <AppAlert
            v-if="lookupSuccess"
            type="success"
            size="sm"
            closable
            @close="lookupSuccess = ''"
          >
            {{ lookupSuccess }}
          </AppAlert>

          <div class="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1 scrollable-v">
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
                  <AppBadge
                    :status="item.day"
                    :type="['Saturday', 'Sunday'].includes(item.day) ? 'purple' : 'blue'"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-content-dark tracking-tight">{{
                    item.time
                  }}</span>
                  <span class="text-sm font-bold text-primary opacity-60"
                    >({{ getScheduleDuration(item.time) }})</span
                  >
                </div>
              </div>

              <button
                type="button"
                @click="deleteSchedule(item.id)"
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
              v-if="!schedules.length"
              class="flex flex-col items-center justify-center py-8 text-content-muted bg-surface-subtle/50 rounded-xl border border-dashed border-outline-std"
            >
              <span class="text-sm font-semibold italic">No schedules found in catalog</span>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="flex flex-col gap-6">
        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">
              {{ type === 'remove' ? '⚠ Branch Removal' : '⚠ Permanent Catalog Removal' }}
            </strong>
            <span class="text-xs opacity-90 font-medium leading-relaxed">
              <template v-if="type === 'remove'">
                Remove {{ props.classInstance?.program?.name || 'this class' }} from
                <span>{{ context?.termName || 'this term' }}</span> at
                <span>{{ context?.branchName || 'this branch' }}</span
                >? This will unenroll all students and delete all schedules for this specific term
                offering.
              </template>
              <template v-else>
                Delete class product {{ props.classInstance?.program?.name || 'this class' }}?
                Existing term offerings and enrollments keep their historical snapshots, but this
                master catalog entry will be permanently erased.
              </template>
            </span>
          </div>
        </AppAlert>

        <AppInput
          v-model="form.deleteConfirm"
          label="Authorization Confirmation"
          placeholder="DELETE"
          required
          :shake="shaking.deleteConfirm"
          :error="errors.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-2xs font-semibold mt-0.5">
              Type <span class="text-error px-1 font-bold">DELETE</span> to authorize
              {{ type === 'remove' ? 'removal' : 'deletion' }}
            </span>
          </template>
        </AppInput>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="validationMessage" type="error" class="w-full">
          {{ validationMessage }}
        </AppAlert>
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <div class="flex items-center justify-end gap-3 w-full">
          <button type="button" class="ui-btn-cancel" @click="$emit('close')">Cancel</button>
          <AppButton
            type="button"
            :variant="type === 'delete' || type === 'remove' ? 'danger' : 'primary'"
            :loading="loading"
            :disabled="loading"
            :class="{
              'opacity-60 grayscale-[0.2]': (type === 'edit' && !isDirty) || isFormInvalid,
            }"
            @click="handleSubmit"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>

  <AppConfirmOverlay
    :show="showConfirm"
    :title="modalTitle"
    :subtitle="
      type === 'delete'
        ? 'This action cannot be undone.'
        : 'Please review the class configuration below.'
    "
    :icon="getActionIcon(type)"
    :image="getProgramProfileURL(selectedProgram?.profileURL, selectedProgram?.category)"
    :rows="confirmRows"
    :confirmLabel="submitLabel"
    :loading="loading"
    @back="showConfirm = false"
    @confirm="confirmSubmit"
  >
    <template #row-Schedules>
      <div class="flex flex-col gap-2 items-end w-full">
        <!-- Regular Class Action Mode -->
        <template v-if="!context">
          <div
            v-for="id in form.scheduleIds"
            :key="id"
            class="flex items-center gap-4 bg-surface-subtle/30 px-4 py-2.5 rounded-xl border border-outline-std/40 transition-all hover:bg-white hover:border-primary/20 w-full justify-end"
          >
            <div class="flex flex-col items-end shrink-0">
              <span class="text-sm font-bold text-content-dark">{{
                getScheduleById(id)?.day
              }}</span>
              <span class="text-xs font-semibold text-primary tracking-tight">{{
                getScheduleById(id)?.time
              }}</span>
            </div>
            <div class="w-px h-8 bg-outline-std/50"></div>
            <div class="flex flex-col items-end shrink-0">
              <span class="text-xs font-black text-content-muted leading-none mb-1">Capacity</span>
              <span class="text-sm font-black text-content-dark leading-none"
                >{{ form.scheduleCapacities[id] || 20 }}
                <span class="text-xs font-bold text-content-muted">Seats</span></span
              >
            </div>
            <AppBadge status="Active" type="green" size="md" class="scale-90 origin-right" />
          </div>
        </template>

        <!-- Class Picker Mode -->
        <template v-else>
          <div
            v-for="id in form.classIds"
            :key="id"
            class="flex items-center gap-4 bg-surface-subtle/30 px-4 py-2.5 rounded-md border border-outline-std transition-all hover:bg-white hover:border-primary"
          >
            <div class="flex flex-col items-end shrink-0 min-w-[80px]">
              <span class="text-sm font-bold text-content-dark">{{
                filteredPickerClasses.find((c) => c.id === id)?.displaySchedule?.day ||
                'No Schedule'
              }}</span>
              <span class="text-xs font-semibold text-primary tracking-tight">{{
                filteredPickerClasses.find((c) => c.id === id)?.displaySchedule?.time || ''
              }}</span>
            </div>
            <AppBadge :status="filteredPickerClasses.find((c) => c.id === id)?.status" />
          </div>
        </template>
      </div>
    </template>
  </AppConfirmOverlay>
</template>
