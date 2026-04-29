<script setup>
import { ref, computed, watch } from 'vue'
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
  branchId: '',
  day: '',
  startTime: '',
  endTime: '',
  teacherIds: [],
  capacity: 20,
  status: 'active',
  adminNote: '',
  sourceTermId: '',
  targetTermId: '',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if ((props.type === 'edit' || props.type === 'delete') && props.classInstance) {
    const data = { ...props.classInstance, deleteConfirm: '' }
    // Flatten schedules for the UI form
    if (data.schedules && data.schedules.length > 0) {
      data.day = data.schedules[0].day
      const [start, end] = (data.schedules[0].time || data.schedules[0].timeslot || '').split(' - ')
      data.startTime = start || ''
      data.endTime = end || ''
    }
    // Map capacity for consistency
    if (data.maxCapacity !== undefined) data.capacity = data.maxCapacity

    // Map teachers to teacherIds for multiple select
    if (data.teachers && Array.isArray(data.teachers)) {
      data.teacherIds = data.teachers.map(t => t.id || t.uid)
    } else if (data.teacherId) {
      data.teacherIds = [data.teacherId]
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
const showConfirm = ref(false)

const timeOptions = computed(() => {
  const options = []
  for (let h = 8; h <= 17; h++) {
    for (let m of ['00', '30']) {
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h)
      const time = `${displayH}:${m} ${ampm}`
      options.push({ id: time, name: time })
    }
  }
  return options
})

const sortedTerms = computed(() => [...terms.value].sort((a, b) => b.id.localeCompare(a.id)))

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Class'
  if (props.type === 'duplicate') return 'Batch Term Propagation'
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
  return 'Add'
})

const onProgramChange = (programId) => {
  localData.programId = programId
  clearError('programId')

  const prog = programs.value.find(p => p.id === programId)
  if (prog) {
    localData.capacity = prog.maxCapacity || 20
    checkSessionMatch()
  }
}

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

const fetchData = async () => {
  try {
    const [p, t, b, teachersData, catsData] = await Promise.all([
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
        : props.type === 'delete'
          ? ['deleteConfirm']
          : ['programId', 'termId', 'branchId', 'day', 'startTime', 'endTime', 'teacherIds'],
    custom: {}
  }

  if (props.type === 'delete') {
    validationRules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (!validate(validationRules)) return

  showConfirm.value = true
}

const handleActionSubmit = () => {
  showConfirm.value = false

  if (props.type === 'duplicate') {
    emit('submit', JSON.parse(JSON.stringify(localData)))
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
    branchId: localData.branchId,
    teacherIds: localData.teacherIds,
    maxCapacity: parseInt(localData.capacity || 20),
    scheduleType: 'group',
    adminNote: localData.adminNote || '',
    schedules: [
      {
        day: localData.day,
        timeslot: `${localData.startTime} - ${localData.endTime}`,
      },
    ],
  }

  // Calculate and persist status based on Term dates
  const term = terms.value.find(t => t.id === localData.termId)
  if (term) {
    const prog = calculateClassProgress(term.startDate, term.endDate, localData.day, `${localData.startTime} - ${localData.endTime}`)
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

  const rows = [
    { key: 'Program', value: selectedProgram.value ? `${selectedProgram.value.name} (${selectedProgram.value.level})` : 'N/A' },
    {
      key: 'Term', value: (() => {
        const t = terms.value.find(term => term.id === localData.termId)
        return t ? `${t.name} (${t.startDate} - ${t.endDate})` : 'N/A'
      })()
    },
    { key: 'Branch', value: branches.value.find(b => b.id === localData.branchId)?.name || 'N/A' },
    { key: 'Schedule', value: `${localData.day}, ${localData.startTime} - ${localData.endTime}` },
    { key: 'Teachers', value: teachers.value.filter(t => localData.teacherIds?.includes(t.id)).map(t => t.name).join(', ') || 'Pending' },
    {
      key: 'Status',
      value: (() => {
        const term = terms.value.find(t => t.id === localData.termId)
        if (!term) return 'Upcoming'
        return calculateClassProgress(term.startDate, term.endDate, localData.day, `${localData.startTime} - ${localData.endTime}`).status
      })(),
      badge: true
    }
  ]

  if (props.type === 'delete') {
    rows.push({ key: 'Security Check', value: localData.deleteConfirm, valueClass: 'text-error font-black' })
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
            <strong class="text-sm font-black tracking-tight uppercase">Batch Propagation Logic</strong>
            <p class="text-xs opacity-90 font-medium leading-relaxed">
              Clones all class instances from the source into the destination term. Enrollments and attendance records
              will be initialized to zero.
            </p>
          </div>
        </AppAlert>
      </div>

      <!-- ADD / EDIT MODE -->
      <form v-else-if="type === 'add' || type === 'edit'" id="classActionForm"
        class="grid grid-cols-2 gap-x-6 gap-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
        @submit.prevent="requestConfirm" novalidate>

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
                <span class="text-sm font-black text-content-dark truncate">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest">{{ item.category
                    }}</span>
                  <span class="text-[8px] text-primary/40">•</span>
                  <span class="text-[9px] font-black text-primary uppercase tracking-widest">{{ item.level }}</span>
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
                <span class="text-sm font-black text-content-dark truncate">{{ item.name }}</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-bold text-content-muted">{{ item.category }}</span>
                  <span class="text-[8px] text-primary/40">•</span>
                  <span class="text-[10px] font-black text-primary uppercase tracking-tight">{{ item.level }}</span>
                </div>
              </div>
            </div>
          </template>
        </AppSelect>

        <AppSelect v-model="localData.termId" :items="sortedTerms" label="Academic Term" placeholder="Term..." required
          :error="errors.termId" :shake="shaking.termId" @change="clearError('termId')">
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center justify-between w-full">
              <AppBadge :status="item.name" type="blue" />
              <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">{{ item.startDate }} -
                {{ item.endDate }}</span>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center justify-between w-full">
              <AppBadge :status="item.name" type="blue" />
              <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">{{ item.startDate }} -
                {{ item.endDate }}</span>
            </div>
          </template>
        </AppSelect>

        <AppSelect v-model="localData.branchId" :items="branches" label="Branch Location" placeholder="Branch..."
          required :error="errors.branchId" :shake="shaking.branchId" @change="clearError('branchId')">
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-2">
              <AppBadge :status="item.abbr || item.name" :type="item.color || 'blue'" />
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex items-center justify-between w-full">
              <span class="text-sm font-bold text-content-dark">{{ item.name }}</span>
              <AppBadge :status="item.abbr" :type="item.color || 'blue'" />
            </div>
          </template>
        </AppSelect>

        <AppSelect v-model="localData.day"
          :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ id: d, name: d }))"
          label="Instruction Day" required :error="errors.day" :shake="shaking.day" :searchable="false"
          @change="clearError('day')">
          <template #selected="{ item }">
            <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
          </template>
          <template #item="{ item }">
            <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
          </template>
        </AppSelect>

        <div class="col-span-1 grid grid-cols-2 gap-3">
          <AppSelect v-model="localData.startTime" :items="timeOptions" label="Start" placeholder="00:00" required
            :error="errors.startTime" :shake="shaking.startTime" :searchable="false" @change="clearError('startTime')">
            <template #selected="{ item }">
              <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
            </template>
            <template #item="{ item }">
              <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
            </template>
          </AppSelect>
          <AppSelect v-model="localData.endTime" :items="timeOptions" label="End" placeholder="00:00" required
            :error="errors.endTime" :shake="shaking.endTime" :searchable="false" @change="clearError('endTime')">
            <template #selected="{ item }">
              <span v-if="item" class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
            </template>
            <template #item="{ item }">
              <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
            </template>
          </AppSelect>
        </div>

        <div v-if="sessionWarning" class="col-span-2">
          <AppAlert type="warning" size="sm">{{ sessionWarning }}</AppAlert>
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
                <span v-if="item.category" class="text-[8px] font-black text-primary uppercase tracking-widest">{{
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
                <span class="text-sm font-bold text-content-dark">{{ item.name }}</span>
                <span v-if="item.category" class="text-[8px] font-black text-content-muted uppercase tracking-widest">{{
                  item.category }}</span>
              </div>
              <AppBadge v-if="item.category" :status="item.category" />
            </div>
          </template>
        </AppSelect>
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
              <span class="text-sm font-black text-content-dark tracking-tighter">{{ classInstance.program?.name
              }}</span>
              <span class="text-xs font-bold text-content-muted">{{ classInstance.day }}, {{ classInstance.timeslot
              }}</span>
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-black tracking-tight uppercase">Permanent Termination</strong>
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
            <span class="block text-2xs font-black uppercase text-error/60 mt-1">
              Type <span class="px-1 font-black">DELETE</span> to authorize
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Confirmation Overlay ── -->
      <AppConfirmOverlay :show="showConfirm"
        :title="type === 'delete' ? 'Delete Class' : (type === 'edit' ? 'Edit Class' : 'Add Class')"
        :subtitle="type === 'delete' ? 'This action will permanently erase this class and its historical data.' : 'Please verify the class details and parameters before proceeding.'"
        :icon="modalIcon" :rows="confirmRows" :confirmLabel="submitLabel" :loading="loading" @back="showConfirm = false"
        @confirm="handleActionSubmit" />
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