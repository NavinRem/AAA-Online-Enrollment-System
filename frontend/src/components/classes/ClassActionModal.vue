<script setup>
import { ref, computed, watch } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import ClassBasicInfoPanel from './forms/ClassBasicInfoPanel.vue'
import ClassSelectionPanel from './forms/ClassSelectionPanel.vue'
import ClassScheduleConfiguration from './forms/ClassScheduleConfiguration.vue'
import ClassScheduleManagePanel from './forms/ClassScheduleManagePanel.vue'
import { getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { scheduleService } from '@/services/scheduleService'
import { classService } from '@/services/classService'
import { useDataStore } from '@/stores/dataStore'
import { useModalText } from '@/composables/useModalText'
import { filterDuplicatePrograms, filterDuplicateClasses } from '@/utils/dropdownUtils'
import { sortSchedulesChronologically } from '@/utils/formatUtils'

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

const {
  localData: form,
  originalData,
  isDirty,
  errors,
  shaking,
  validate,
  clearError,
  triggerShake,
} = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
  sourceKey: 'classInstance',
  autoClear: 3000,
})

const dataStore = useDataStore()

const teachers = computed(() =>
  dataStore.teachers.map((t) => ({
    id: t.id,
    name: t.name,
    profileURL: t.profileURL,
    branchAbbr: t.branchAbbr,
  })),
)
const branches = computed(() => dataStore.branches)
const classes = computed(() => {
  return dataStore.classes.map((c) => {
    let schedules = c.schedules || []
    if (schedules.length === 0 && c.scheduleIds) {
      schedules = c.scheduleIds
        .map((sid) => dataStore.schedules.find((s) => String(s.id) === String(sid)))
        .filter(Boolean)
    }
    return { ...c, schedules }
  })
})

const programs = computed(() => {
  let list = dataStore.programs.map((program) => {
    const category = dataStore.categories.find((item) => item.id === program.categoryId)
    return {
      ...program,
      categoryProfileURL: category?.profileURL || '',
    }
  })

  return filterDuplicatePrograms(list, props.context, props.type, classes.value)
})

const schedules = computed(() =>
  dataStore.schedules.map((schedule) => ({
    ...schedule,
    name: `${schedule.day} (${schedule.time})`,
  })),
)
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
  return sortSchedulesChronologically(schedules.value)
})

const getScheduleById = (id) => schedules.value.find((s) => s.id === id)


const getScheduleDurationMinutes = (timeRange) => {
  const range = (timeRange || '').split(' - ')
  if (range.length !== 2) return null
  
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

const { modalTitle, submitLabel, modalIcon } = useModalText(() => props.type, 'Class', {
  customTitle,
})

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
      rows.push({ key: 'Branches', value: '' })
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
      },
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
  console.log('Classes before filter:', classes.value)
  console.log(
    'Filtered picker classes:',
    filterDuplicateClasses(classes.value, form.programId, props.context?.existingOfferings),
  )
  return filterDuplicateClasses(classes.value, form.programId, props.context?.existingOfferings)
})

const previewSchedules = computed(() => {
  let result;
  if (props.context && props.type === 'add') {
    result = form.classIds.map((id) => {
      const item = filteredPickerClasses.value.find((c) => c.id === id)
      return {
        id: id,
        day: item?.displaySchedule?.day || '',
        time: item?.displaySchedule?.time || '',
        isClassId: true,
      }
    })
  } else {
    result = form.scheduleIds.map((id) => {
      const sched = getScheduleById(id)
      return {
        id: id,
        day: sched?.day || '',
        time: sched?.time || '',
        isClassId: false,
      }
    })
  }
  
  return sortSchedulesChronologically(result)
})

const loadOptions = async (skipCache = false) => {
  const modules = ['classes', 'schedules', 'teachers', 'programs', 'branches']
  await dataStore.fetchAllCommonData(skipCache, modules)
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
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
    errors.programId = 'Please select a program first'
    triggerShake('programId')
  }
  if (field === 'programId') {
    if (props.context) {
      validationMessage.value = 'Program cannot be changed when managing term classes'
      setTimeout(() => {
        validationMessage.value = ''
      }, 3000)
    } else if (props.type === 'edit') {
      validationMessage.value = 'Program identity cannot be changed after a class is created'
      setTimeout(() => {
        validationMessage.value = ''
      }, 3000)
    }
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

const toggleAllBranches = () => {
  if (form.branchIds.length === branches.value.length) {
    form.branchIds = []
  } else {
    form.branchIds = branches.value.map((b) => b.id)
  }
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
        <div v-if="!context || type === 'edit'" class="flex flex-col gap-6">
          <ClassBasicInfoPanel
            v-model:form="form"
            :programs="programs"
            :branches="branches"
            :filtered-schedules="filteredSchedules"
            :status-options="statusOptions"
            :errors="errors"
            :shaking="shaking"
            :is-edit-mode="type === 'edit'"
            @program-change="handleProgramChange"
            @click-disabled="handleDisabledClick"
            @schedule-change="handleScheduleChange"
            @toggle-schedule-manage="toggleScheduleManage"
            @clear-error="clearError"
            @toggle-all-branches="toggleAllBranches"
            @remove-branch="(id) => form.branchIds = form.branchIds.filter(bid => bid !== id)"
          />
        </div>
        <div v-else-if="context && type === 'add'" class="flex flex-col gap-5">
          <ClassSelectionPanel
            v-model:form="form"
            :programs="programs"
            :filtered-picker-classes="filteredPickerClasses"
            :errors="errors"
            :shaking="shaking"
            @program-change="handleProgramChange"
            @click-disabled="handleDisabledClick"
            @clear-error="clearError"
          />
        </div>

        <!-- Selected Schedules Preview -->
        <ClassScheduleConfiguration
          v-model:form="form"
          :preview-schedules="previewSchedules"
          :teachers="teachers"
          @deselect-schedule="deselectSchedule"
          @remove-class="(id) => form.classIds = form.classIds.filter(cid => cid !== id)"
        />

        <ClassScheduleManagePanel
          v-if="manageSchedules"
          v-model:new-schedule="newSchedule"
          :calculated-end-time="calculatedEndTime"
          :lookup-loading="lookupLoading"
          :lookup-error="lookupError"
          :lookup-success="lookupSuccess"
          :sorted-schedules="sortedSchedules"
          :schedules-length="schedules.length"
          :just-added-id="justAddedId"
          :day-options="dayOptions"
          @toggle="toggleScheduleManage"
          @add-schedule="addSchedule"
          @delete-schedule="deleteSchedule"
          @clear-error="lookupError = ''"
          @clear-success="lookupSuccess = ''"
        />
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
              'opacity-60 grayscale-20': (type === 'edit' && !isDirty) || isFormInvalid,
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
    <template #row-Branches>
      <div class="flex flex-wrap gap-1 justify-end max-w-[70%]">
        <AppBadge
          v-for="id in form.branchIds"
          :key="id"
          :status="branches.find((b) => b.id === id)?.abbr"
          :type="branches.find((b) => b.id === id)?.color"
          size="sm"
          class="w-10 text-center"
        />
      </div>
    </template>

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
            <div class="flex flex-col items-end shrink-0 min-w-20">
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
