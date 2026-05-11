<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { categoryService } from '@/services/categoryService'
import { scheduleService } from '@/services/scheduleService'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  classInstance: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'clear-error', 'clear-success'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  programId: '',
  scheduleIds: [],
})

const programs = ref([])
const schedules = ref([])
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

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  .map((day) => ({ id: day, name: day }))

const selectedProgram = computed(() => programs.value.find((program) => program.id === form.programId))
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

const getScheduleById = (id) => schedules.value.find(s => s.id === id)

const getScheduleDuration = (timeRange) => {
  const range = (timeRange || '').split(' - ')
  if (range.length !== 2) return ''
  const start = parse12hToMinutes(range[0])
  const end = parse12hToMinutes(range[1])
  let diff = end - start
  if (diff < 0) diff += 1440
  return `${diff}mn`
}

const filteredSchedules = computed(() => {
  if (!selectedProgram.value?.duration) return []
  const duration = selectedProgram.value.duration

  return sortedSchedules.value.filter((s) => {
    // Always show if it's currently selected (even if duration changed, to allow removal)
    if (form.scheduleIds.includes(s.id)) return true

    // Show unselected only if duration matches
    const durStr = getScheduleDuration(s.time)
    const durNum = parseInt(durStr)
    return durNum === duration
  })
})

const modalTitle = computed(() => {
  if (props.type === 'delete') return 'Delete Class Product'
  if (props.type === 'edit') return 'Edit Class Product'
  return 'Add Class Product'
})

const submitLabel = computed(() => {
  if (props.type === 'delete') return 'Delete'
  if (props.type === 'edit') return 'Save Changes'
  return 'Create Class'
})

const isDirty = computed(() => {
  if (props.type !== 'edit') return true
  if (!props.classInstance) return false

  const initialProg = props.classInstance.programId || ''
  const initialScheds = [...(props.classInstance.scheduleIds || props.classInstance.schedules?.map(s => s.id) || [])].sort().join(',')

  const currentProg = form.programId
  const currentScheds = [...form.scheduleIds].sort().join(',')

  return initialProg !== currentProg || initialScheds !== currentScheds
})

const confirmRows = computed(() => {
  if (props.type === 'delete') return [
    { key: 'Warning', value: 'This will permanently remove this class product from the catalog.', valueClass: 'text-error' }
  ]
  return [
    { key: 'Program', value: selectedProgram.value?.name || 'N/A' },
    { key: 'Category', value: selectedProgram.value?.category || 'Standard' },
    { key: 'Duration', value: `${selectedProgram.value?.duration || 0} Minutes` },
    { key: 'Schedules', value: `${form.scheduleIds.length} Sessions Assigned` }
  ]
})

const loadOptions = async (skipCache = false) => {
  const [programData, categoryData, scheduleData] = await Promise.all([
    programService.getAllPrograms(),
    categoryService.getAllCategories(),
    scheduleService.getAllSchedules({}, { skipCache }),
  ])

  const categories = Array.isArray(categoryData) ? categoryData : (categoryData?.data || [])
  const programsList = Array.isArray(programData) ? programData : (programData?.data || [])
  const schedulesList = Array.isArray(scheduleData) ? scheduleData : (scheduleData?.data || [])

  programs.value = programsList.map((program) => {
    const category = categories.find((item) => item.id === program.categoryId)
    return {
      ...program,
      categoryProfileURL: category?.profileURL || '',
    }
  })

  schedules.value = schedulesList.map((schedule) => ({
    ...schedule,
    name: `${schedule.day} (${schedule.time})`,
  }))
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
  return formatTime12h(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`)
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

    // Automatically select the newly created schedule
    if (newId && !form.scheduleIds.includes(newId)) {
      form.scheduleIds.push(newId)
    }

    justAddedId.value = newId
    setTimeout(() => { justAddedId.value = null }, 5000)

    const addedDay = newSchedule.value.day
    newSchedule.value = { day: 'Saturday', startTime: '09:00' }
    lookupSuccess.value = `Schedule "${addedDay}: ${timeRange}" added to catalog`
    setTimeout(() => { lookupSuccess.value = '' }, 3000)
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
    resetForm({
      programId: props.classInstance?.programId || '',
      scheduleIds: [...(props.classInstance?.scheduleIds || props.classInstance?.schedules?.map((schedule) => schedule.id) || [])],
    })
  },
  { immediate: true },
)

const handleProgramChange = () => {
  clearError('programId')
  // We no longer automatically filter scheduleIds here to allow the user 
  // to see 'previously chosen' schedules and manually manage them.
}

const handleScheduleChange = () => {
  clearError('scheduleIds')
}

const handleDisabledClick = (field) => {
  if (field === 'scheduleIds' && !form.programId) {
    errors.programId = 'Please select a program first'
    triggerShake('programId')
  }
}

const handleSubmit = () => {
  if (props.type === 'delete') {
    emit('submit', { id: props.classInstance?.id })
    return
  }

  const isValid = validate({
    required: ['programId', 'scheduleIds'],
  })

  if (isValid) {
    showConfirm.value = true
  }
}

const confirmSubmit = () => {
  showConfirm.value = false
  emit('submit', {
    programId: form.programId,
    scheduleIds: form.scheduleIds,
    status: 'active',
  })
}
</script>

<template>
  <AppModal :show="isOpen" :title="modalTitle" :icon="getActionIcon(type === 'delete' ? 'delete' : 'plus')"
    :error="error" :success="success" maxWidth="720px" @close="$emit('close')" @clear-error="$emit('clear-error')"
    @clear-success="$emit('clear-success')">
    <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
      <template v-if="type !== 'delete'">


        <div class="grid grid-cols-2 gap-6 items-start">
          <AppSelect v-model="form.programId" :items="programs" label="Program" placeholder="Select program..." required
            :error="errors.programId" :shake="shaking.programId" @change="handleProgramChange">
            <template #selected="{ item }">
              <div v-if="item" class="flex items-center gap-3 flex-1 overflow-hidden">
                <div class="w-9 h-9 rounded-xl border border-outline-std overflow-hidden bg-white shrink-0 p-1.5">
                  <img :src="getProgramProfileURL(item.profileURL, item.category, item.categoryProfileURL)"
                    class="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="text-sm font-semibold text-content-dark truncate">{{ item.name }}</span>
                  <span class="text-3xs font-semibold text-content-muted ">{{ item.category
                  }}</span>
                </div>
                <AppBadge :status="`${item.duration} MIN`" type="blue" />
              </div>
            </template>
          </AppSelect>

          <div class="flex flex-col gap-xs">
            <div class="flex justify-between items-center min-h-[20px]">
              <label class="text-sm font-semibold text-content-dark flex items-center gap-1">
                Schedule <span class="text-error font-bold leading-none">*</span>
              </label>
              <button type="button" @click="toggleScheduleManage"
                class="text-xs font-bold text-primary hover:underline tracking-wider">Manage Catalog</button>
            </div>
            <AppSelect v-model="form.scheduleIds" :items="filteredSchedules" placeholder="Select schedules..." required
              multiple :error="errors.scheduleIds" :shake="shaking.scheduleIds" :disabled="!form.programId"
              @change="handleScheduleChange" @click-disabled="handleDisabledClick('scheduleIds')">
              <template #selected="{ items }">
                <span v-if="!items?.length" class="text-content-muted/40 italic">Choose from catalog...</span>
                <span v-else class="text-sm font-semibold text-primary">{{ items.length }} schedule{{ items.length === 1
                  ? '' : 's' }} selected</span>
              </template>
              <template #item="{ item }">
                <div class="flex items-center justify-between w-full">
                  <span class="text-sm font-semibold text-content-dark">{{ item.day }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-content-muted opacity-40">({{ getScheduleDuration(item.time)
                    }})</span>
                    <span class="text-xs font-semibold text-primary">{{ item.time }}</span>
                  </div>
                </div>
              </template>
            </AppSelect>

            <!-- Selected Schedules Preview -->
            <div v-if="form.scheduleIds.length > 0"
              class="flex flex-col gap-2 mt-1 animate-in slide-in-from-top-2 duration-300">
              <div class="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                <div v-for="id in form.scheduleIds" :key="id"
                  class="flex items-center justify-between bg-surface-subtle/40 border border-outline-std rounded-sm p-3 shadow-sm group hover:border-primary/30 transition-all">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-content-dark">{{ getScheduleById(id)?.day }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-primary tracking-tight">{{ getScheduleById(id)?.time
                      }}</span>
                      <span class="text-xs font-bold text-content-muted/50 tracking-tighter">({{
                        getScheduleDuration(getScheduleById(id)?.time) }})</span>
                    </div>
                  </div>
                  <button type="button" @click="deselectSchedule(id)"
                    class="p-2 hover:bg-error-soft rounded-lg transition-all">
                    <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-60" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="manageSchedules"
          class="p-md bg-primary-soft/30 rounded-std border-2 border-dashed border-primary/20 flex flex-col gap-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-primary flex items-center gap-xs">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Manage schedules
            </span>
            <button type="button" @click="toggleScheduleManage"
              class="text-xs font-semibold text-content-muted hover:text-error ">Close</button>
          </div>

          <div class="flex flex-col gap-sm">
            <div class="grid grid-cols-2 gap-x-6 gap-y-4">


              <!-- Setup Row -->
              <div class="col-span-2 grid grid-cols-[1.2fr_1fr_1fr] gap-4 items-end">
                <AppSelect v-model="newSchedule.day" :items="dayOptions" label="Day" :searchable="false">
                  <template #selected="{ item }">
                    <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
                  </template>
                  <template #item="{ item }">
                    <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
                  </template>
                </AppSelect>
                <AppInput v-model="newSchedule.startTime" type="time" label="Start Time" />
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
          <AppAlert v-if="lookupSuccess" type="success" size="sm" closable @close="lookupSuccess = ''">
            {{ lookupSuccess }}
          </AppAlert>

          <div class="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1 scrollable-v">
            <div v-for="item in sortedSchedules" :key="item.id"
              class="px-4 py-2.5 cursor-pointer bg-white border border-outline-std rounded-xl flex items-center justify-between group hover:border-primary/30 hover:bg-primary-light transition-all"
              :class="{ 'ring-2 ring-primary border-primary bg-primary/5 z-10': item.id === justAddedId }">
              <div class="flex items-center gap-4">
                <div class="w-24">
                  <AppBadge :status="item.day" :type="['Saturday', 'Sunday'].includes(item.day) ? 'purple' : 'blue'" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-content-dark tracking-tight">{{ item.time }}</span>
                  <span class="text-sm font-bold text-primary opacity-60">({{ getScheduleDuration(item.time)
                    }})</span>
                </div>
              </div>

              <button type="button" @click="deleteSchedule(item.id)"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-content-muted hover:bg-error-soft hover:text-error transition-all opacity-40 group-hover:opacity-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div v-if="!schedules.length"
              class="flex flex-col items-center justify-center py-8 text-content-muted bg-surface-subtle/50 rounded-xl border border-dashed border-outline-std">
              <span class="text-sm font-semibold italic">No schedules found in catalog</span>
            </div>
          </div>
        </div>
      </template>

      <AppAlert v-else type="error">
        Delete class product {{ props.classInstance?.program?.name || 'this class' }}? Existing term offerings and
        enrollments
        keep their historical snapshots.
      </AppAlert>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <button type="button" class="ui-btn-cancel" @click="$emit('close')">Cancel</button>
        <AppButton type="button" :variant="type === 'delete' ? 'danger' : 'primary'" :loading="loading"
          :disabled="!isDirty" @click="handleSubmit">
          {{ submitLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>

  <AppConfirmOverlay :show="showConfirm" :title="modalTitle"
    :subtitle="type === 'delete' ? 'This action cannot be undone.' : 'Please review the class configuration below.'"
    :icon="getProgramProfileURL(selectedProgram?.profileURL, selectedProgram?.category, selectedProgram?.categoryProfileURL)"
    :rows="confirmRows" :confirmLabel="submitLabel" :loading="loading" @back="showConfirm = false"
    @confirm="confirmSubmit">
    <template #row-Schedules>
      <div class="flex flex-col gap-1 items-end">
        <div v-for="id in form.scheduleIds" :key="id" class="flex items-center gap-2">
          <span class="text-xs font-bold text-content-dark">{{ getScheduleById(id)?.day }}</span>
          <span class="text-3xs font-semibold text-primary">({{ getScheduleById(id)?.time }})</span>
        </div>
      </div>
    </template>
  </AppConfirmOverlay>
</template>
