<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon, getImageUrl, getProgramProfileURL } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { branchService } from '@/services/branchService'
import { teacherService } from '@/services/teacherService'
import { termService } from '@/services/termService'
import { categoryService } from '@/services/categoryService'
import { classService } from '@/services/classService'
import { useActionModal } from '@/composables/useActionModal'
import { calculateClassProgress } from '@/utils/formatUtils'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'duplicate', 'delete'
  classInstance: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const getInitialData = () => ({
  programId: '',
  termId: '',
  branchIds: [],
  schedules: [], // For multi-schedule batch add
  day: '',
  startTime: '',
  endTime: '',
  durationHour: 1,
  durationMinute: 30,
  teacherIds: [],
  capacity: 10,
  status: 'active',
  scheduleType: 'fixed',
  adminNote: '',
  sourceTermId: '',
  targetTermId: '',
  deleteConfirm: '',
  selectedIds: [], // For selective duplicate
})

const mapSourceToForm = () => {
  if (props.type === 'duplicateSelected' && props.classInstance) {
    return { ...getInitialData(), ...props.classInstance }
  }
  if ((props.type === 'edit' || props.type === 'delete') && props.classInstance) {
    const data = { ...props.classInstance, deleteConfirm: '' }
    // Flatten schedule for the UI form
    const schedule = data.schedule || (data.schedules && data.schedules.length > 0 ? data.schedules[0] : null)
    if (schedule) {
      data.day = schedule.day || ''
      const [start, end] = (schedule.time).split(' - ')
      data.startTime = start || ''
      data.endTime = end || ''

      // Calculate duration from existing times
      if (data.startTime && data.endTime) {
        const parseTime = (timeStr) => {
          const [time, ampm] = (timeStr || '').split(' ')
          if (!time || !ampm) return null
          let [h, m] = time.split(':').map(Number)
          if (ampm === 'PM' && h !== 12) h += 12
          if (ampm === 'AM' && h === 12) h = 0
          return h * 60 + m
        }
        const startMin = parseTime(data.startTime)
        const endMin = parseTime(data.endTime)
        if (startMin !== null && endMin !== null) {
          let diff = endMin - startMin
          if (diff < 0) diff += 1440 // handle midnight
          data.durationHour = Math.floor(diff / 60)
          data.durationMinute = diff % 60
        }
      }
    }
    // Map capacity for consistency
    if (data.maxCapacity !== undefined) data.capacity = data.maxCapacity

    // Map schedule type
    data.scheduleType = data.scheduleType || 'fixed'

    // Map teachers to teacherIds for multiple select
    if (data.teachers && Array.isArray(data.teachers)) {
      data.teacherIds = data.teachers.map(t => t.id || t.uid)
    }
    // Map branchIds for multiple select
    if (data.branchId && (!data.branchIds || data.branchIds.length === 0)) {
      data.branchIds = [data.branchId]
    }

    return data
  }
  return getInitialData()
}

const { localData, isDirty, errors, shaking, clearError, triggerShake, validate, resetForm } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    mapSourceToForm,
    sourceKey: 'classInstance',
  },
)

const programs = ref([])
const terms = ref([])
const branches = ref([])
const teachers = ref([])
const allClassInstances = ref([])
const showConfirm = ref(false)
const isBranchDropdownOpen = ref(false)
const dropdownContainer = ref(null)

const toggleAllBranches = () => {
  if (localData.branchIds.length === filteredBranches.value.length) {
    localData.branchIds = []
  } else {
    localData.branchIds = filteredBranches.value.map(b => b.id)
  }
  clearError('branchIds')
}

const handleClickOutside = (event) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isBranchDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const timeOptions = computed(() => {
  const options = []
  for (let h = 8; h <= 17; h++) {
    for (let m of ['00', '15', '30', '45']) {
      const ampm = h >= 12 ? 'PM' : 'AM'
      let displayH = h % 12
      if (displayH === 0) displayH = 12
      const time = `${displayH}:${m} ${ampm}`
      options.push({ id: time, name: time })
    }
  }
  return options
})

const sortedTerms = computed(() => [...terms.value].sort((a, b) => b.id.localeCompare(a.id)))

const availableMigrationTerms = computed(() => {
  if (props.type !== 'duplicateSelected' || !localData.selectedIds?.length) return sortedTerms.value

  const selectedClasses = allClassInstances.value.filter(c => localData.selectedIds.includes(c.id))
  
  return sortedTerms.value.filter(term => {
    // 1. Must be strictly upcoming (start date in future)
    const todayStr = new Date().toISOString().split('T')[0]
    if (term.startDate <= todayStr) return false

    // 2. Check if any selected class already exists in this term
    const existingInTerm = allClassInstances.value.filter(c => c.termId === term.id && !c.isDeleted)
    
    const hasOverlap = selectedClasses.some(sc => {
      return existingInTerm.some(ec => {
        const scTime = sc.schedule?.time || (sc.schedules && sc.schedules[0]?.time)
        const ecTime = ec.schedule?.time || (ec.schedules && ec.schedules[0]?.time)
        return ec.programId === sc.programId && 
               ec.branchId === sc.branchId && 
               (ec.schedule?.day === sc.schedule?.day) && 
               ecTime === scTime
      })
    })

    return !hasOverlap
  })
})

const selectedClassItems = computed(() => {
  if (!localData.selectedIds?.length) return []
  return allClassInstances.value.filter(c => localData.selectedIds.includes(c.id))
})

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Class'
  if (props.type === 'duplicate') return 'Batch Term Propagation'
  if (props.type === 'duplicateSelected') return 'Selective Term Migration'
  if (props.type === 'delete') return 'Delete Class'
  return 'Add Class'
})

const selectedProgram = computed(() => programs.value.find(p => p.id === localData.programId))

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  return props.type === 'add' ? getActionIcon('plus') : getActionIcon('edit')
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Edit'
  if (props.type === 'delete') return 'Delete'
  if (props.type === 'duplicateSelected') return 'Migrate'
  return 'Add'
})

const filteredBranches = computed(() => {
  if (!localData.termId) return branches.value
  const term = terms.value.find(t => t.id === localData.termId)
  if (!term) return branches.value

  const termBranchIds = term.branchIds || (term.branchId ? [term.branchId] : [])
  if (termBranchIds.length === 0) return branches.value

  return branches.value.filter(b => termBranchIds.includes(b.id))
})

const onProgramChange = (programId) => {
  localData.programId = programId
  clearError('programId')

  const prog = programs.value.find(p => p.id === programId)
  if (prog) {
    checkSessionMatch()
  }
}

const onTermChange = (termId) => {
  localData.termId = termId
  clearError('termId')

  // Prune branch selection if new term doesn't support them
  const term = terms.value.find(t => t.id === termId)
  if (term) {
    const termBranchIds = term.branchIds || (term.branchId ? [term.branchId] : [])
    if (termBranchIds.length > 0) {
      localData.branchIds = (localData.branchIds || []).filter(id => termBranchIds.includes(id))
    }
  }
  checkSessionMatch()
}

const addScheduleSlot = () => {
  localData.schedules.push({
    day: 'Saturday',
    startTime: '9:00 AM',
    endTime: '10:30 AM',
    durationHour: 1,
    durationMinute: 30
  })
}

const removeScheduleSlot = (index) => {
  localData.schedules.splice(index, 1)
}

const updateScheduleEndTime = (index) => {
  const sched = localData.schedules[index]
  if (!sched.startTime) return

  const [time, ampm] = sched.startTime.split(' ')
  if (!time || !ampm) return
  let [hours, minutes] = time.split(':').map(Number)

  if (ampm === 'PM' && hours !== 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  const h = parseInt(sched.durationHour) || 0
  const m = parseInt(sched.durationMinute) || 0

  date.setMinutes(date.getMinutes() + (h * 60) + m)

  let endHours = date.getHours()
  const endMinutes = date.getMinutes().toString().padStart(2, '0')
  const endAmpm = endHours >= 12 ? 'PM' : 'AM'

  endHours = endHours % 12
  if (endHours === 0) endHours = 12

  sched.endTime = `${endHours}:${endMinutes} ${endAmpm}`
}

const calculateEndTime = () => {
  if (!localData.startTime) return

  const [time, ampm] = localData.startTime.split(' ')
  if (!time || !ampm) return
  let [hours, minutes] = time.split(':').map(Number)

  if (ampm === 'PM' && hours !== 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  const h = parseInt(localData.durationHour) || 0
  const m = parseInt(localData.durationMinute) || 0

  date.setMinutes(date.getMinutes() + (h * 60) + m)

  let endHours = date.getHours()
  const endMinutes = date.getMinutes().toString().padStart(2, '0')
  const endAmpm = endHours >= 12 ? 'PM' : 'AM'

  endHours = endHours % 12
  if (endHours === 0) endHours = 12

  localData.endTime = `${endHours}:${endMinutes} ${endAmpm}`
}

watch(() => [localData.startTime, localData.durationHour, localData.durationMinute], calculateEndTime)

const sessionWarning = ref('')
const checkSessionMatch = () => {
  const prog = programs.value.find(p => p.id === localData.programId)
  const term = terms.value.find(t => t.id === localData.termId)
  if (prog && term) {
    if (prog.totalSessions !== term.totalSessions) {
      sessionWarning.value = `Warning: Program has ${prog.totalSessions} sessions but Term is ${term.totalSessions} weeks.`
    } else {
      sessionWarning.value = ''
    }
  }
}

watch(() => [localData.programId, localData.termId], checkSessionMatch)

const duplicateWarning = computed(() => {
  if (props.type === 'delete') return ''
  if (!localData.programId || !localData.termId || !localData.branchIds.length || !localData.day || !localData.startTime) return ''

  const currentTimeslot = `${localData.startTime} - ${localData.endTime}`

  const duplicates = allClassInstances.value.filter(c => {
    // Skip self if editing
    if (props.type === 'edit' && c.id === localData.id) return false

    const matchesProgram = c.programId === localData.programId
    const matchesTerm = c.termId === localData.termId
    const matchesDay = c.schedules?.some(s => s.day === localData.day)
    const matchesTime = c.schedules?.some(s => s.time === currentTimeslot)

    if (!matchesProgram || !matchesTerm || !matchesDay || !matchesTime) return false

    // Check if any selected branch is in the class
    const classBranchIds = c.branchIds || (c.branchId ? [c.branchId] : [])
    return localData.branchIds.some(id => classBranchIds.includes(id))
  })

  if (duplicates.length > 0) {
    const overlappingBranches = duplicates.flatMap(d => {
      const db = d.branchIds || (d.branchId ? [d.branchId] : [])
      return db.filter(id => localData.branchIds.includes(id))
        .map(id => branches.value.find(b => b.id === id)?.name)
        .filter(Boolean)
    })
    return `Warning: Duplicate class already exists for ${[...new Set(overlappingBranches)].join(', ')} at this day/time.`
  }

  return ''
})

// Capacity is now manually entered with no auto-calculation logic based on teacher count.

const fetchData = async () => {
  try {
    const [p, t, b, teachersData, catsData, classesData] = await Promise.all([
      programService.getAllPrograms(),
      termService.getAllTerms().then(list => {
        const todayStr = new Date().toISOString().split('T')[0]
        if (props.type === 'add') {
          return list.filter(item => item.startDate > todayStr)
        }
        return list.filter(item => item.endDate >= todayStr || item.id === localData.termId)
      }),
      branchService.getAllBranches(),
      teacherService.getAllTeachers(),
      categoryService.getAllCategories(),
      classService.getAllClasses(),
    ])

    const categoriesList = Array.isArray(catsData) ? catsData : (catsData?.data || [])

    programs.value = (p || []).map((prog) => {
      const cat = categoriesList.find(c => (c.id || c._id) === prog.categoryId)
      return {
        ...prog,
        id: prog.id || prog._id,
        profileURL: prog.profileURL || '',
        categoryProfileURL: cat?.profileURL || ''
      }
    })
    terms.value = t || []
    branches.value = b || []
    teachers.value = (teachersData || []).map((t) => ({
      id: t.uid || t.id,
      name: t.name,
      profileURL: t.profileURL || '',
      category: t.category || ''
    }))
    allClassInstances.value = classesData || []
  } catch (err) {
    console.error(err)
  }
}

const requestConfirm = () => {
  if (props.type === 'edit' && !isDirty.value) return

  const validationRules = {
    required:
      props.type === 'duplicate'
        ? ['sourceTermId', 'targetTermId']
        : props.type === 'duplicateSelected'
          ? ['targetTermId']
          : props.type === 'delete'
            ? ['deleteConfirm']
            : ['programId', 'termId', 'branchIds', 'day', 'startTime', 'endTime', 'teacherIds'],
    custom: {}
  }

  if (props.type === 'delete') {
    validationRules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (props.type === 'add' || props.type === 'edit') {
    validationRules.required.push('capacity')
  }

  if (!validate(validationRules)) return

  if (duplicateWarning.value) {
    triggerShake('programId')
    return
  }

  showConfirm.value = true
}

const handleActionSubmit = () => {
  showConfirm.value = false

  if (props.type === 'duplicate' || props.type === 'duplicateSelected') {
    const { durationHour, durationMinute, ...cleanData } = localData
    emit('submit', JSON.parse(JSON.stringify(cleanData)))
    return
  }

  if (props.type === 'delete') {
    emit('submit', { id: localData.id })
    return
  }

  // Construct clean payload explicitly
  const payload = {
    programId: localData.programId,
    termId: localData.termId,
    branchIds: localData.branchIds,
    teacherIds: localData.teacherIds,
    capacity: parseInt(localData.capacity || 0),
    scheduleType: localData.scheduleType || 'fixed',
    adminNote: localData.adminNote || '',
  }

  if (props.type === 'add' && localData.schedules.length > 0) {
    payload.schedules = localData.schedules.map(s => ({
      day: s.day,
      time: `${s.startTime} - ${s.endTime}`
    }))
  } else {
    payload.schedule = {
      day: localData.day,
      time: `${localData.startTime} - ${localData.endTime}`,
    }
  }

  // Calculate and persist status based on Term dates
  const term = terms.value.find(t => t.id === localData.termId)
  if (term) {
    const activeSched = payload.schedules ? payload.schedules[0] : payload.schedule
    const prog = calculateClassProgress(term.startDate, term.endDate, activeSched.day, activeSched.time)
    payload.status = prog.status.toLowerCase()
  } else {
    payload.status = localData.status || 'upcoming'
  }

  emit('submit', payload)
}

const confirmRows = computed(() => {
  if (props.type === 'duplicate') {
    return [
      {
        key: 'Source Term', value: (() => {
          const t = terms.value.find(term => term.id === localData.sourceTermId)
          return t ? `${t.name} (${t.startDate} - ${t.endDate})` : 'N/A'
        })()
      },
      {
        key: 'Target Term', value: (() => {
          const t = terms.value.find(term => term.id === localData.targetTermId)
          return t ? `${t.name} (${t.startDate} - ${t.endDate})` : 'N/A'
        })()
      },
      { key: 'Branch Filter', value: branches.value.find(b => b.id === localData.branchId)?.name || 'All Branches' }
    ]
  }

  if (props.type === 'duplicateSelected') {
    return [
      {
        key: 'Destination Term', value: (() => {
          const t = terms.value.find(term => term.id === localData.targetTermId)
          return t ? `${t.name} (${t.startDate} - ${t.endDate})` : 'N/A'
        })()
      },
      { key: 'Classes Selected', value: `${localData.selectedIds?.length || 0} Instances` }
    ]
  }

  const rows = [
    { key: 'Program', value: selectedProgram.value ? `${selectedProgram.value.name} (${selectedProgram.value.level})` : 'N/A' },
    {
      key: 'Term',
      value: (() => {
        const t = terms.value.find(term => term.id === localData.termId)
        return t ? t.name : 'N/A'
      })()
    },
    { key: 'Branches', value: localData.branchIds.length + ' selected' },
    { key: 'Schedule Type', value: localData.scheduleType },
    {
      key: 'Schedule',
      value: props.type === 'add' && localData.schedules.length > 0
        ? localData.schedules.map(s => `${s.day} (${s.startTime})`).join(', ')
        : `${localData.day}, ${localData.startTime} - ${localData.endTime}`
    },
    { key: 'Teachers', value: teachers.value.filter(t => localData.teacherIds?.includes(t.id)).map(t => t.name).join(', ') || 'Pending' },
    { key: 'Class Capacity', value: localData.capacity + ' Students' },
    {
      key: 'Status',
      value: (() => {
        const term = terms.value.find(t => t.id === localData.termId)
        if (!term) return 'Upcoming'
        const day = props.type === 'add' && localData.schedules.length > 0 ? localData.schedules[0].day : localData.day
        const time = props.type === 'add' && localData.schedules.length > 0 ? `${localData.schedules[0].startTime} - ${localData.schedules[0].endTime}` : `${localData.startTime} - ${localData.endTime}`
        return calculateClassProgress(term.startDate, term.endDate, day, time).status
      })(),
      badge: true
    }
  ]

  if (localData.adminNote?.trim()) {
    rows.push({ key: 'Admin Note', value: localData.adminNote })
  }

  if (props.type === 'delete') {
    rows.push({ key: 'Security Check', value: localData.deleteConfirm, valueClass: 'text-error font-bold' })
  }

  return rows
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchData()
      showConfirm.value = false
    }
  },
)
</script>

<template>
  <AppModal :show="isOpen" :title="modalTitle" :icon="modalIcon" :error="error" :success="success" maxWidth="800px"
    @close="$emit('close')">
    <div class="relative min-h-[400px]">
      <!-- DUPLICATE MODE -->
      <div v-if="type === 'duplicate'"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="grid grid-cols-2 gap-lg">
          <AppSelect v-model="localData.sourceTermId" :items="sortedTerms" label="Source Term"
            placeholder="Reference Term..." required :error="errors.sourceTermId" :shake="shaking.sourceTermId"
            @change="clearError('sourceTermId')" />

          <AppSelect v-model="localData.targetTermId" :items="sortedTerms" label="Target Term"
            placeholder="Destination Term..." required :error="errors.targetTermId" :shake="shaking.targetTermId"
            @change="clearError('targetTermId')" />
        </div>

        <AppSelect v-model="localData.branchId" :items="branches" label="Branch Scope"
          placeholder="-- All Active Branches --" />

        <AppAlert type="info">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight uppercase">Batch Propagation Logic</strong>
            <p class="text-xs opacity-90 font-medium leading-relaxed">
              Clones all class instances from the source into the destination term. Enrollments and attendance records
              will be initialized to zero.
            </p>
          </div>
        </AppAlert>
      </div>

      <!-- DUPLICATE SELECTED MODE -->
      <div v-if="type === 'duplicateSelected'"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- INSTRUCTIONS -->
        <div class="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-primary/10 rounded-lg">
              <img :src="getActionIcon('info')" class="w-4 h-4 opacity-70" />
            </div>
            <span class="text-xs font-bold text-primary uppercase tracking-widest">Migration Instructions</span>
          </div>
          <ul class="text-[10px] text-content-muted space-y-1.5 list-disc pl-5 font-medium leading-relaxed">
            <li>Choose a **Destination Term** from the dropdown below. Only upcoming terms are shown.</li>
            <li>Verify the **Class Summary** to confirm you are migrating the intended schedules.</li>
            <li>The system will propagate configurations including teachers, capacity, and timing.</li>
            <li><strong class="text-primary">Note:</strong> Enrollments are reset; migrated classes will start with zero students.</li>
          </ul>
        </div>

        <div class="bg-surface-subtle/50 p-6 rounded-2xl border border-outline-std/50 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-primary uppercase tracking-widest">Selective Term Migration</span>
            <AppBadge :status="localData.selectedIds?.length + ' Classes'" type="blue" size="sm" />
          </div>
          <p class="text-xs text-content-muted font-medium leading-relaxed">
            Propagate the selected class configurations (Schedules, Teachers, and Capacity) into a new academic term.
          </p>

          <div class="mt-2 flex flex-col gap-2">
            <div v-for="cls in selectedClassItems" :key="cls.id" 
              class="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-primary/5">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold text-content-dark">{{ cls.program?.name }}</span>
                <AppBadge :status="cls.branch?.abbr" :type="cls.branch?.color" size="xs" />
              </div>
              <span class="text-[10px] font-semibold text-content-muted uppercase tracking-tight">
                {{ cls.schedule?.day }} @ {{ cls.schedule?.time }}
              </span>
            </div>
          </div>
        </div>

        <AppSelect v-model="localData.targetTermId" :items="availableMigrationTerms" label="Select Destination Term"
          placeholder="Choose next term..." required :error="errors.targetTermId" :shake="shaking.targetTermId"
          @change="clearError('targetTermId')">
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center justify-between w-full">
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-black">{{ item.name }}</span>
                <div class="flex gap-1">
                  <AppBadge v-for="bId in (item.branchIds || (item.branchId ? [item.branchId] : []))" 
                    :key="bId" :status="branches.find(b => b.id === bId)?.abbr" 
                    :type="branches.find(b => b.id === bId)?.color || 'blue'" size="xs" />
                </div>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[10px] font-bold uppercase text-success tracking-widest">{{ item.startDate }} </span>
                <span class="text-[8px] text-content-muted/30">/</span>
                <span class="text-[10px] font-bold uppercase text-error tracking-widest">{{ item.endDate }} </span>
              </div>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-black">{{ item.name }}</span>
                <div class="flex gap-1">
                  <AppBadge v-for="bId in (item.branchIds || (item.branchId ? [item.branchId] : []))" 
                    :key="bId" :status="branches.find(b => b.id === bId)?.abbr" 
                    :type="branches.find(b => b.id === bId)?.color || 'blue'" size="xs" />
                </div>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[10px] font-bold uppercase text-success tracking-widest">{{ item.startDate }} </span>
                <span class="text-[8px] text-content-muted/30">/</span>
                <span class="text-[10px] font-bold uppercase text-error tracking-widest">{{ item.endDate }} </span>
              </div>
            </div>
          </template>
        </AppSelect>

        <AppAlert type="warning" size="sm">
          <p class="text-xs font-semibold leading-relaxed">
            Note: All enrollment counts will be reset to 0 in the new term instances.
          </p>
        </AppAlert>
      </div>

      <!-- ADD / EDIT MODE -->
      <form v-else-if="type === 'add' || type === 'edit'" id="classActionForm"
        class="grid grid-cols-2 gap-x-6 gap-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
        @submit.prevent="requestConfirm" novalidate>

        <div v-if="type === 'add'" class="col-span-2">
          <AppAlert type="info" size="sm">
            <div class="flex flex-col gap-1">
              <span class="font-bold uppercase tracking-widest text-[10px]">Academic Integrity Check</span>
              <p class="text-xs leading-relaxed opacity-80 font-medium">
                Verify the <strong>Program</strong>, <strong>Term</strong>, and <strong>Schedule</strong> carefully.
                Establishing a class with incorrect parameters may require manual enrollment migration later.
              </p>
            </div>
          </AppAlert>
        </div>

        <AppSelect v-model="localData.programId" :items="programs" label="Select Program"
          placeholder="Select Program..." class="col-span-2" required :error="errors.programId"
          :shake="shaking.programId" @change="onProgramChange">
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-3 flex-1 overflow-hidden">
              <div class="w-10 h-10 rounded-xl border border-outline-std overflow-hidden bg-white shrink-0 p-1.5">
                <img :src="getProgramProfileURL(item.profileURL, item.category, item.categoryProfileURL)"
                  class="w-full h-full object-contain" />
              </div>
              <div class="flex flex-col flex-1 overflow-hidden">
                <span class="text-sm font-semibold text-content-dark truncate">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-semibold text-content-muted uppercase tracking-widest">{{ item.category
                  }}</span>
                  <span class="text-[8px] text-primary/40">•</span>
                  <span class="text-[9px] font-semibold text-primary uppercase tracking-widest">{{ item.level }}</span>
                </div>
              </div>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-3 w-full p-0.5">
              <div
                class="w-11 h-11 rounded-xl border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm p-1.5">
                <img :src="getProgramProfileURL(item.profileURL, item.category, item.categoryProfileURL)"
                  class="w-full h-full object-contain" />
              </div>
              <div class="flex flex-col flex-1 overflow-hidden">
                <span class="text-sm font-semibold text-content-dark truncate">{{ item.name }}</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-semibold text-content-muted">{{ item.category }}</span>
                  <span class="text-[8px] text-primary/40">•</span>
                  <span class="text-[10px] font-semibold text-primary uppercase tracking-tight">{{ item.level }}</span>
                </div>
              </div>
            </div>
          </template>
        </AppSelect>

        <AppSelect v-model="localData.termId" :items="sortedTerms" label="Academic Term" placeholder="Term..." required
          :error="errors.termId" :shake="shaking.termId" @change="onTermChange">
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center justify-between w-full text-black">
              <AppBadge :status="item.name" type="blue" />
              <span class="text-[10px] font-semibold uppercase text-success tracking-widest">{{ item.startDate }} </span> -
              <span class="text-[10px] font-semibold uppercase text-error tracking-widest">{{ item.endDate }} </span>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center justify-between w-full text-black">
              <AppBadge :status="item.name" type="blue" />
              <span class="text-[10px] font-semibold uppercase text-success tracking-widest">{{ item.startDate }} </span> -
              <span class="text-[10px] font-semibold uppercase text-error tracking-widest">{{ item.endDate }} </span>
            </div>
          </template>
        </AppSelect>

        <AppSelect v-model="localData.scheduleType"
          :items="[{ id: 'fixed', name: 'Fixed' }, { id: 'flexible', name: 'Flexible' }]" label="Schedule Type"
          placeholder="Select type..." required :error="errors.scheduleType" :shake="shaking.scheduleType"
          :searchable="false" @change="clearError('scheduleType')">
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-2">
              <AppBadge :status="item.name" :type="item.id === 'fixed' ? 'blue' : 'green'" size="sm" />
              <span class="text-xs font-medium text-content-muted">{{ item.id === 'fixed' ? 'Regular sessions' :
                'Negotiable' }}</span>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-2">
              <AppBadge :status="item.name" :type="item.id === 'fixed' ? 'blue' : 'green'" size="sm" />
              <span class="text-[10px] font-medium text-content-muted">{{ item.id === 'fixed' ? 'Regular sessions' :
                'Negotiable' }}</span>
            </div>
          </template>
        </AppSelect>

        <div class="flex flex-col gap-xs text-left w-full">
          <label class="text-sm font-semibold text-content-dark flex items-center justify-between gap-1">
            <div class="flex items-center gap-1">
              Branch Scope <span class="text-error font-bold leading-none">*</span>
            </div>
            <button type="button" @click="toggleAllBranches"
              class="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter">
              {{ localData.branchIds.length === filteredBranches.length ? 'Unselect All' : 'Select All' }}
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
                  <AppBadge v-for="id in localData.branchIds" :key="id" :status="branches.find(b => b.id === id)?.abbr"
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
              leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-2">
              <div v-if="isBranchDropdownOpen"
                class="absolute z-[100] mt-2 w-full bg-white border-2 border-outline-std rounded-sm shadow-2xl overflow-hidden max-h-[250px] flex flex-col">
                <div class="flex flex-col overflow-y-auto scrollable-v p-2 gap-1">
                  <label v-for="branch in filteredBranches" :key="branch.id"
                    class="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-surface-subtle group"
                    :class="{ 'bg-primary/5': localData.branchIds.includes(branch.id) }">
                    <span class="text-sm font-semibold text-content-dark truncate uppercase tracking-tight">{{ branch.name
                      }}</span>
                    <div class="flex items-center gap-2 min-w-0">
                      <AppBadge :status="branch.abbr" :type="branch.color || 'blue'" />
                      <input type="checkbox" v-model="localData.branchIds" :value="branch.id"
                        class="w-4 h-4 rounded border-outline-std text-primary focus:ring-primary/20 cursor-pointer"
                        @change="clearError('branchIds')" />
                    </div>
                  </label>
                  <div v-if="filteredBranches.length === 0" class="p-4 text-center text-xs text-content-muted italic">
                    No branches available for this term
                  </div>
                </div>
              </div>
            </transition>
          </div>
          <span v-if="errors.branchIds"
            class="text-[10px] font-semibold text-error mt-1 animate-in fade-in slide-in-from-top-1">{{
              errors.branchIds }}</span>
        </div>

        <!-- Multi-Schedule Section (Add Mode) -->
        <div v-if="type === 'add'" class="col-span-2 flex flex-col gap-4 bg-surface-subtle/50 p-4 rounded-xl border border-outline-std">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-bold text-content-dark uppercase tracking-tight">Class Schedules</span>
              <span class="text-[10px] text-content-muted font-medium uppercase tracking-widest">Add one or more time slots</span>
            </div>
            <AppButton size="xs" variant="secondary" @click="addScheduleSlot">
              <img :src="getActionIcon('plus')" class="w-3 h-3" />
              <span>Add Time Slot</span>
            </AppButton>
          </div>

          <div v-if="localData.schedules.length === 0" class="text-center py-6 border-2 border-dashed border-outline-std rounded-xl text-content-muted/50 italic text-xs">
            No specific schedules added yet. Use the default below or add multiple slots.
          </div>

          <div v-for="(sched, sIdx) in localData.schedules" :key="sIdx" class="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg border border-outline-std shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div class="col-span-3">
              <AppSelect v-model="sched.day" :items="['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => ({ id: d, name: d }))" label="Day" required :searchable="false" size="sm" />
            </div>
            <div class="col-span-3">
              <AppSelect v-model="sched.startTime" :items="timeOptions" label="Start" required :searchable="false" size="sm" @change="updateScheduleEndTime(sIdx)" />
            </div>
            <div class="col-span-2">
              <AppSelect v-model="sched.durationHour" :items="[0, 1, 2, 3].map(h => ({ id: h, name: h + 'h' }))" label="H" required :searchable="false" size="sm" @change="updateScheduleEndTime(sIdx)" />
            </div>
            <div class="col-span-2">
              <AppSelect v-model="sched.durationMinute" :items="[0, 15, 30, 45].map(m => ({ id: m, name: m + 'm' }))" label="M" required :searchable="false" size="sm" @change="updateScheduleEndTime(sIdx)" />
            </div>
            <div class="col-span-2 flex items-center justify-center pb-2">
              <button type="button" @click="removeScheduleSlot(sIdx)" class="w-8 h-8 rounded-full hover:bg-error/10 text-error/40 hover:text-error transition-all flex items-center justify-center">
                <img :src="getActionIcon('delete')" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Default Schedule (Used as primary if no multi-schedules, or for Edit mode) -->
        <div v-if="type === 'edit' || (type === 'add' && localData.schedules.length === 0)" class="col-span-2 grid grid-cols-2 gap-x-6 gap-y-5">
          <AppSelect v-model="localData.day"
            :items="['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => ({ id: d, name: d }))"
            label="Instruction Day" required :error="errors.day" :shake="shaking.day" :searchable="false"
            @change="clearError('day')">
            <template #selected="{ item }">
              <div v-if="item" class="flex items-center gap-2">
                <span class="text-sm font-semibold"
                  :class="['Saturday', 'Sunday'].includes(item.name) ? 'text-primary font-bold' : 'text-content-dark'">{{
                    item.name }}</span>
                <span v-if="['Saturday', 'Sunday'].includes(item.name)"
                  class="text-xs font-semibold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-full tracking-tighter">Weekend</span>
              </div>
            </template>
            <template #item="{ item }">
              <div class="flex items-center justify-between w-full">
                <span class="text-sm font-semibold"
                  :class="['Saturday', 'Sunday'].includes(item.name) ? 'text-primary font-bold' : 'text-content-dark'">{{
                    item.name }}</span>
                <span v-if="['Saturday', 'Sunday'].includes(item.name)"
                  class="text-xs font-semibold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-full tracking-tighter">Weekend</span>
              </div>
            </template>
          </AppSelect>
  
          <div class="col-span-1 grid grid-cols-2 gap-3">
            <AppSelect v-model="localData.durationHour" :items="[0, 1, 2, 3, 4].map(h => ({ id: h, name: h + ' hr' }))"
              label="Duration (H)" placeholder="0" required :error="errors.durationHour" :shake="shaking.durationHour"
              :searchable="false" @change="() => { clearError('durationHour'); calculateEndTime(); }">
              <template #selected="{ item }">
                <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
              <template #item="{ item }">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
            </AppSelect>
            <AppSelect v-model="localData.durationMinute" :items="[0, 15, 30, 45].map(m => ({ id: m, name: m + ' min' }))"
              label="Duration (M)" placeholder="0" required :error="errors.durationMinute" :shake="shaking.durationMinute"
              :searchable="false" @change="() => { clearError('durationMinute'); calculateEndTime(); }">
              <template #selected="{ item }">
                <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
              <template #item="{ item }">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
            </AppSelect>
          </div>
  
          <div class="col-span-2 grid grid-cols-2 gap-6">
            <AppSelect v-model="localData.startTime" :items="timeOptions" label="Start Time" placeholder="--:-- --"
              required :error="errors.startTime" :shake="shaking.startTime" :searchable="false"
              @change="() => { clearError('startTime'); calculateEndTime(); }">
              <template #selected="{ item }">
                <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
              <template #item="{ item }">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
            </AppSelect>
            <AppSelect v-model="localData.endTime" :items="timeOptions" label="End Time (Auto)" placeholder="00:00"
              required :error="errors.endTime" :shake="shaking.endTime" :searchable="false" disabled>
              <template #selected="{ item }">
                <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
              <template #item="{ item }">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </template>
            </AppSelect>
          </div>
        </div>

        <div v-if="sessionWarning || duplicateWarning" class="col-span-2 space-y-2">
          <AppAlert v-if="sessionWarning" type="warning" size="sm">{{ sessionWarning }}</AppAlert>
          <AppAlert v-if="duplicateWarning" type="error" size="sm">{{ duplicateWarning }}
          </AppAlert>
        </div>

        <AppSelect v-model="localData.teacherIds" :items="teachers" label="Assigned Teachers"
          placeholder="Search registry..." required :error="errors.teacherIds" :shake="shaking.teacherIds"
          @change="clearError('teacherIds')" class="col-span-2" multiple>
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full overflow-hidden border border-outline-std bg-white">
                <img :src="item.profileURL || getImageUrl('profiles/avatar-teacher-woman')"
                  class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
                <span v-if="item.category" class="text-[8px] font-bold text-primary uppercase tracking-widest">{{
                  item.category }}</span>
              </div>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-3 w-full">
              <div class="w-8 h-8 rounded-xl overflow-hidden border border-outline-std bg-white shadow-sm">
                <img :src="item.profileURL || getImageUrl('profiles/avatar-teacher-woman')"
                  class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col flex-1">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
                <span v-if="item.category" class="text-[8px] font-bold text-content-muted uppercase tracking-widest">{{
                  item.category }}</span>
              </div>
              <AppBadge v-if="item.category" :status="item.category" />
            </div>
          </template>
        </AppSelect>

        <AppInput v-model="localData.capacity" type="number" label="Class Capacity" placeholder="e.g. 25"
          :error="errors.capacity" :shake="shaking.capacity" @input="clearError('capacity')" class="col-span-2">
          <template #label-extra>
            <span class="text-[9px] text-content-muted ml-2">(Maximum students allowed, 0 = Unlimited)</span>
          </template>
        </AppInput>
      </form>

      <!-- DELETE MODE -->
      <div v-else-if="type === 'delete'"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="bg-white border border-outline-std rounded-2xl p-lg flex flex-col gap-lg shadow-sm"
          v-if="classInstance">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-primary/5 bg-white p-2 border border-outline-std/50">
              <img
                :src="getProgramProfileURL(classInstance.program?.profileURL, classInstance.program?.category, classInstance.program?.categoryProfileURL)"
                class="w-full h-full object-contain" />
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-semibold text-content-dark tracking-tighter">{{ classInstance.program?.name
                }}</span>
              <span class="text-xs font-semibold text-content-muted">{{ classInstance.schedule.day }}, {{
                classInstance.schedule.time
                }}</span>
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight uppercase">Permanent Termination</strong>
            <p class="text-xs opacity-90 font-medium leading-relaxed">
              This will erase all linked enrollment history and attendance records for this specific class. This
              action
              is
              irreversible.
            </p>
          </div>
        </AppAlert>

        <AppInput v-model="localData.deleteConfirm" label="Security Confirmation" placeholder='Type "DELETE" to confirm'
          required :error="errors.deleteConfirm" :shake="shaking.deleteConfirm" @input="clearError('deleteConfirm')">
          <template #label-extra>
            <span class="block text-2xs font-bold uppercase text-error/60 mt-1">
              Type <span class="px-1 font-bold">DELETE</span> to authorize
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Confirmation Overlay ── -->
      <AppConfirmOverlay :show="showConfirm"
        :title="type === 'delete' ? 'Delete Class' : (type === 'edit' ? 'Edit Class' : 'Add Class')"
        :subtitle="type === 'delete' ? 'This action will permanently erase this class and its historical data.' : 'Please verify the class details and parameters before proceeding.'"
        :icon="modalIcon" :rows="confirmRows" :confirmLabel="submitLabel" :loading="loading" @back="showConfirm = false"
        @confirm="handleActionSubmit">
        <template #row-Branches>
          <div class="flex flex-wrap justify-end gap-1">
            <AppBadge v-for="id in localData.branchIds" :key="id" :status="branches.find(b => b.id === id)?.abbr"
              :type="branches.find(b => b.id === id)?.color || 'blue'" size="sm" />
          </div>
        </template>
        <template #row-Term>
          <div class="flex flex-col items-end gap-1">
            <AppBadge :status="terms.find(t => t.id === localData.termId)?.name" type="blue" size="sm" />
            <div class="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
              <span class="text-success">{{terms.find(t => t.id === localData.termId)?.startDate}}</span>
              <span class="text-content-muted/30">/</span>
              <span class="text-error">{{terms.find(t => t.id === localData.termId)?.endDate}}</span>
            </div>
          </div>
        </template>
        <template #row-Schedule-Type>
          <AppBadge :status="localData.scheduleType" :type="localData.scheduleType === 'fixed' ? 'blue' : 'green'"
            size="sm" />
        </template>
        <template #row-Schedule>
          <div class="flex items-center gap-2">
            <AppBadge :status="localData.day" type="blue" size="sm" />
            <span class="text-sm font-semibold text-content-dark">{{ localData.startTime }} - {{ localData.endTime }}</span>
          </div>
        </template>
        <template #row-Class-Capacity>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-content-dark">{{ localData.capacity }}</span>
            <span class="text-[10px] font-semibold text-content-muted uppercase tracking-widest">Students</span>
          </div>
        </template>
      </AppConfirmOverlay>
    </div>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          <span class="text-xs font-semibold tracking-tight uppercase">No modifications detected</span>
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