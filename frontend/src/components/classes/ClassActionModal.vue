<template>
  <AppModal :show="isOpen" maxWidth="600px" @close="$emit('close')">
    <template #header>
      <div class="modal-header-main">
        <div class="modal-title-wrapper">
          <img :src="modalIcon" class="modal-title-icon" />
          <h3>{{ modalTitle }}</h3>
        </div>
      </div>
    </template>

    <!-- DUPLICATE MODE -->
    <div v-if="type === 'duplicate'" class="form-grid">
      <div class="form-group full-width">
        <label>Source Term (From) <span class="required">*</span></label>
        <AppSelect v-model="localData.sourceTermId" :items="sortedTerms" placeholder="-- Select Term to Copy From --" />
      </div>
      <div class="form-group full-width">
        <label>Target Term (To) <span class="required">*</span></label>
        <AppSelect v-model="localData.targetTermId" :items="sortedTerms" placeholder="-- Select New Term --" />
      </div>
      <div class="form-group full-width">
        <label>Branch (Optional Filter)</label>
        <AppSelect v-model="localData.branchId" :items="branches" placeholder="-- All Branches --" />
      </div>
      <div class="info-box full-width">
        <p>This will create new class instances for the target term using selected classes from the source term as templates. Student counts will be reset to 0.</p>
      </div>
    </div>

    <!-- ADD / EDIT MODE -->
    <form v-else class="form-grid" @submit.prevent="handleSubmit">
      <div class="form-group full-width">
        <label>Program Model <span class="required">*</span></label>
        <AppSelect v-model="localData.programId" :items="programs" placeholder="-- Select Program Catalog --"
          @change="onProgramChange" />
      </div>

      <div class="form-group">
        <label>Academic Term <span class="required">*</span></label>
        <AppSelect v-model="localData.termId" :items="sortedTerms" placeholder="-- Select Term --" />
      </div>

      <div class="form-group">
        <label>Branch <span class="required">*</span></label>
        <AppSelect v-model="localData.branchId" :items="branches" placeholder="-- Select Branch --" />
      </div>

      <div class="divider full-width">Schedule & Teacher</div>

      <div class="form-group full-width">
        <label>Schedule Template (Bone Structure)</label>
        <AppSelect v-model="selectedScheduleId" :items="programSchedules" placeholder="-- Pick a template slot --"
          @change="onScheduleTemplatePick" />
        <p class="help-text">Selecting a template auto-fills the day and time below.</p>
      </div>

      <div class="form-group">
        <label>Day <span class="required">*</span></label>
        <AppSelect v-model="localData.day"
          :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ id: d, name: d }))"
          :searchable="false" />
      </div>

      <div class="form-group">
        <label>Timeslot <span class="required">*</span></label>
        <input type="text" v-model="localData.timeslot" placeholder="e.g. 10:30 - 12:00" />
      </div>

      <div class="form-group full-width">
        <label>Teacher</label>
        <AppSelect v-model="localData.teacherId" :items="teachers" placeholder="-- Assign Teacher --" />
      </div>

      <div class="divider full-width">Overrides & Settings</div>

      <div class="form-group">
        <label>Price ($)</label>
        <input type="number" v-model="localData.price" step="0.01" />
      </div>

      <div class="form-group">
        <label>Max Capacity</label>
        <input type="number" v-model="localData.capacity" />
      </div>

      <div class="form-group">
        <label>Status</label>
        <AppSelect v-model="localData.status" :items="[
          { id: 'open', name: 'Open' },
          { id: 'close', name: 'Closed' }
        ]" :searchable="false" />
      </div>
      
      <div class="form-group">
        <label>Schedule Type</label>
        <AppSelect v-model="localData.scheduleType" :items="[
          { id: 'fix', name: 'Fixed Slot' },
          { id: 'flexible', name: 'Flexible/Private' }
        ]" :searchable="false" />
      </div>

      <div class="form-group full-width mb-none">
        <label>Admin Note (Optional)</label>
        <textarea v-model="localData.adminNote" rows="2" placeholder="Private notes for staff..."></textarea>
      </div>
    </form>

    <template #footer>
      <div class="flex-align-center flex-end w-full gap-sm">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton variant="primary" @click="handleSubmit" :loading="loading" :disabled="!isFormValid">
          {{ type === 'duplicate' ? 'Start Duplication' : 'Save Class' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { programService } from '@/services/programService'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import { useActionModal } from '@/composables/useActionModal'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  classItem: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const programs = ref([])
const terms = ref([])
const branches = ref([])
const teachers = ref([])
const programSchedules = ref([])
const selectedScheduleId = ref('')

const getInitialData = () => ({
  programId: '',
  termId: '',
  branchId: '',
  teacherId: '',
  day: 'Monday',
  timeslot: '',
  scheduleType: 'fix',
  status: 'open',
  adminNote: '',
  price: 0,
  capacity: 15,
  // Duplicate fields
  sourceTermId: '',
  targetTermId: '',
})

const mapSourceToForm = () => {
  if (props.type === 'add' || props.type === 'duplicate') return getInitialData()
  const c = props.classItem || {}
  return {
    ...getInitialData(),
    ...c,
    programId: c.programId || c.program?.id,
    termId: c.termId || c.term?.id,
    branchId: c.branchId || c.branch?.id,
    teacherId: c.teacherId || c.teacher?.id,
  }
}

const { localData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm
})

const sortedTerms = computed(() => {
  return [...terms.value].sort((a, b) => b.name.localeCompare(a.name))
})

const isFormValid = computed(() => {
  if (props.type === 'duplicate') {
    return localData.value.sourceTermId && localData.value.targetTermId
  }
  return (
    localData.value.programId &&
    localData.value.termId &&
    localData.value.branchId &&
    localData.value.day &&
    localData.value.timeslot
  )
})

const modalTitle = computed(() => {
  if (props.type === 'duplicate') return 'Bulk Duplicate Classes'
  return props.type === 'add' ? 'Open New Class' : 'Edit Class Instance'
})

const modalIcon = computed(() => {
  if (props.type === 'duplicate') return getActionIcon('calendar')
  return props.type === 'add' ? getActionIcon('plus') : getActionIcon('edit')
})

const onProgramChange = async () => {
  const p = programs.value.find(pr => pr.id === localData.value.programId)
  if (p) {
    localData.value.price = p.basePrice
    localData.value.capacity = p.maxCapacity
    fetchProgramSchedules()
  }
}

const fetchProgramSchedules = async () => {
  if (!localData.value.programId) return
  try {
    const data = await programService.getSchedules(localData.value.programId)
    programSchedules.value = data.map(s => ({
      id: s.id,
      name: `${s.day} @ ${s.timeslot}`,
      day: s.day,
      timeslot: s.timeslot
    }))
  } catch (err) { console.error(err) }
}

const onScheduleTemplatePick = () => {
  const s = programSchedules.value.find(sch => sch.id === selectedScheduleId.value)
  if (s) {
    localData.value.day = s.day
    localData.value.timeslot = s.timeslot
  }
}

const fetchData = async () => {
  try {
    const [p, t, b, u] = await Promise.all([
      programService.getAllPrograms(),
      programService.getAllTerms(),
      branchService.getAllBranches(),
      userService.getAllUsers()
    ])
    programs.value = p || []
    terms.value = t || []
    branches.value = b || []
    teachers.value = u.filter(user => user.role === 'teacher')
  } catch (err) { console.error(err) }
}

const handleSubmit = () => submitForm(isFormValid.value)

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchData()
    if (localData.value.programId) fetchProgramSchedules()
  }
})
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.full-width {
  grid-column: span 2;
}

.divider {
  margin: var(--space-sm) 0 var(--space-3xs);
  font-weight: 700;
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
}

.form-group label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-dark);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
}

.help-text {
  font-size: var(--text-3xs);
  color: var(--text-light);
  margin-top: 4px;
}

.info-box {
  background: var(--primary-soft);
  border: 1px solid var(--primary-light);
  padding: var(--space-md);
  border-radius: var(--border-radius-sm);
  color: var(--primary-hover);
  font-size: var(--text-sm);
}
</style>
