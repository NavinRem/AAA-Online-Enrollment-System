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
      <div class="form-group full-width" :class="{ 'field-error': isSubmittingAttempted && errors.sourceTermId }">
        <label>Source Term (From) <span class="required">*</span></label>
        <AppSelect v-model="localData.sourceTermId" :items="sortedTerms" placeholder="-- Select Term to Copy From --" />
        <div v-if="isSubmittingAttempted && errors.sourceTermId" class="field-error-msg">{{ errors.sourceTermId }}</div>
      </div>
      <div class="form-group full-width" :class="{ 'field-error': isSubmittingAttempted && errors.targetTermId }">
        <label>Target Term (To) <span class="required">*</span></label>
        <AppSelect v-model="localData.targetTermId" :items="sortedTerms" placeholder="-- Select New Term --" />
        <div v-if="isSubmittingAttempted && errors.targetTermId" class="field-error-msg">{{ errors.targetTermId }}</div>
      </div>
      <div class="form-group full-width">
        <label>Branch (Optional Filter)</label>
        <AppSelect v-model="localData.branchId" :items="branches" placeholder="-- All Branches --" />
      </div>
      <div class="info-box-standard full-width">
        <p>This will create new class instances for the target term using selected classes from the source term as
          templates. Student counts will be reset to 0.</p>
      </div>
    </div>

    <!-- ADD / EDIT MODE -->
    <form v-else id="classActionForm" class="form-grid" @submit.prevent="handleActionSubmit">
      <div class="form-group full-width" :class="{ 'field-error': isSubmittingAttempted && errors.programId }">
        <label>Program Model <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.programId">Current Tag: {{
            originalData.programId }}</span>
        </label>
        <AppSelect v-model="localData.programId" :items="programs" placeholder="-- Select Program Catalog --"
          @change="onProgramChange" />
        <div v-if="isSubmittingAttempted && errors.programId" class="field-error-msg">{{ errors.programId }}</div>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.termId }">
        <label>Academic Term <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.termId">Saved: {{ originalData.termId
            }}</span>
        </label>
        <AppSelect v-model="localData.termId" :items="sortedTerms" placeholder="-- Select Term --" />
        <div v-if="isSubmittingAttempted && errors.termId" class="field-error-msg">{{ errors.termId }}</div>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.branchId }">
        <label>Branch <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.branchId">Saved: {{ originalData.branchId
            }}</span>
        </label>
        <AppSelect v-model="localData.branchId" :items="branches" placeholder="-- Select Branch --" />
        <div v-if="isSubmittingAttempted && errors.branchId" class="field-error-msg">{{ errors.branchId }}</div>
      </div>

      <div class="divider full-width">Schedule & Teacher</div>

      <div class="form-group full-width">
        <label>Schedule Template (Bone Structure)</label>
        <AppSelect v-model="selectedScheduleId" :items="programSchedules" placeholder="-- Pick a template slot --"
          @change="onScheduleTemplatePick" />
        <p class="help-text">Selecting a template auto-fills the day and time below.</p>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.day }">
        <label>Day <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.day">Original: {{ originalData.day
            }}</span>
        </label>
        <AppSelect v-model="localData.day"
          :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ id: d, name: d }))"
          :searchable="false" />
        <div v-if="isSubmittingAttempted && errors.day" class="field-error-msg">{{ errors.day }}</div>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.timeslot }">
        <label>Timeslot <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.timeslot">Original: {{
            originalData.timeslot
            }}</span>
        </label>
        <input type="text" v-model="localData.timeslot" placeholder="e.g. 10:30 - 12:00" class="standard-input" />
        <div v-if="isSubmittingAttempted && errors.timeslot" class="field-error-msg">{{ errors.timeslot }}</div>
      </div>

      <div class="form-group full-width">
        <label>Teacher
          <span class="original-value" v-if="type === 'edit' && originalData.teacherId">Saved Tag: {{
            originalData.teacherId
            }}</span>
        </label>
        <AppSelect v-model="localData.teacherId" :items="teachers" placeholder="-- Assign Teacher --" />
      </div>

      <div class="divider full-width">Overrides & Settings</div>

      <div class="form-group">
        <label>Price ($)
          <span class="original-value" v-if="type === 'edit' && originalData.price">Original: ${{ originalData.price
            }}</span>
        </label>
        <input type="number" v-model="localData.price" step="0.01" class="standard-input" />
      </div>

      <div class="form-group">
        <label>Max Capacity
          <span class="original-value" v-if="type === 'edit' && originalData.capacity">Original: {{
            originalData.capacity
            }}</span>
        </label>
        <input type="number" v-model="localData.capacity" class="standard-input" />
      </div>

      <div class="form-group">
        <label>Status
          <span class="original-value" v-if="type === 'edit' && originalData.status">Original: {{ originalData.status
            }}</span>
        </label>
        <AppSelect v-model="localData.status" :items="[
          { id: 'open', name: 'Open' },
          { id: 'close', name: 'Closed' }
        ]" :searchable="false" />
      </div>

      <div class="form-group">
        <label>Schedule Type
          <span class="original-value" v-if="type === 'edit' && originalData.scheduleType">Original: {{
            originalData.scheduleType }}</span>
        </label>
        <AppSelect v-model="localData.scheduleType" :items="[
          { id: 'fix', name: 'Fixed Slot' },
          { id: 'flexible', name: 'Flexible/Private' }
        ]" :searchable="false" />
      </div>

      <div class="form-group full-width mb-none">
        <label>Admin Note (Optional)</label>
        <textarea v-model="localData.adminNote" rows="2" placeholder="Private notes for staff..."
          class="standard-input"></textarea>
      </div>
    </form>

    <template #footer>
      <div class="flex-align-center flex-end w-full gap-sm">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton variant="primary" :form="type === 'duplicate' ? null : 'classActionForm'" type="submit"
          @click="type === 'duplicate' ? handleActionSubmit() : null" :loading="loading" :disabled="loading"
          :class="{ 'button-disabled-visual': !isFormValid || (type === 'edit' && !isChanged) }">
          {{ submitLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { branchService } from '@/services/branchService'
import { userService } from '@/services/userService'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'duplicate'
  classInstance: Object,
  loading: Boolean,
})

const emit = defineEmits(['close', 'submit'])

const localData = ref({
  programId: '',
  termId: '',
  branchId: '',
  day: '',
  timeslot: '',
  teacherId: '',
  price: 0,
  capacity: 0,
  status: 'open',
  scheduleType: 'fix',
  adminNote: '',
  sourceTermId: '',
  targetTermId: '',
})

const originalData = ref({})
const initialDataString = ref('')
const isSubmittingAttempted = ref(false)

const syncData = () => {
  if (props.type === 'edit' && props.classInstance) {
    const data = { ...props.classInstance }
    localData.value = data
    originalData.value = { ...data }
    initialDataString.value = JSON.stringify(data)
  } else {
    localData.value = {
      programId: '', termId: '', branchId: '', day: '', timeslot: '',
      teacherId: '', price: 0, capacity: 0, status: 'open', scheduleType: 'fix',
      adminNote: '', sourceTermId: '', targetTermId: ''
    }
    initialDataString.value = JSON.stringify(localData.value)
  }
}

watch(() => props.isOpen, (val) => {
  if (val) {
    syncData()
    isSubmittingAttempted.value = false
  }
})

const errors = computed(() => {
  const d = localData.value
  const errs = {}
  if (props.type === 'duplicate') {
    if (!d.sourceTermId) errs.sourceTermId = 'Source term is required.'
    if (!d.targetTermId) errs.targetTermId = 'Target term is required.'
  } else {
    if (!d.programId) errs.programId = 'Program model is required.'
    if (!d.termId) errs.termId = 'Academic term is required.'
    if (!d.branchId) errs.branchId = 'Branch is required.'
    if (!d.day) errs.day = 'Day is required.'
    if (!d.timeslot?.trim()) errs.timeslot = 'Timeslot is required.'
  }
  return errs
})

const isFormValid = computed(() => Object.keys(errors.value).length === 0)
const isChanged = computed(() => JSON.stringify(localData.value) !== initialDataString.value)

const programs = ref([])
const terms = ref([])
const branches = ref([])
const teachers = ref([])
const programSchedules = ref([])
const selectedScheduleId = ref('')

const sortedTerms = computed(() => [...terms.value].sort((a, b) => b.id.localeCompare(a.id)))

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Class Schedule'
  if (props.type === 'duplicate') return 'Batch Duplicate Classes'
  return 'Register New Class Slot'
})

const modalIcon = computed(() => {
  if (props.type === 'edit') return getActionIcon('edit')
  return getActionIcon('plus')
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Update Slot'
  if (props.type === 'duplicate') return 'Execute Duplication'
  return 'Create Class Slot'
})

const fetchProgramSchedules = async () => {
  if (!localData.value.programId) return
  try {
    const schedules = await programService.getProgramSchedules(localData.value.programId)
    programSchedules.value = schedules.map(s => ({
      id: s.id,
      name: `${s.day} (${s.timeslot})`
    }))
  } catch (err) { console.error(err) }
}

const onProgramChange = (programId) => {
  localData.value.programId = programId
  fetchProgramSchedules()
}

const onScheduleTemplatePick = (scheduleId) => {
  const schedule = programSchedules.value.find(s => s.id === scheduleId)
  if (schedule) {
    const [day, time] = schedule.name.split(' (')
    localData.value.day = day
    localData.value.timeslot = time.replace(')', '')
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
    teachers.value = u.filter(user => user.role === 'teacher').map(t => ({ id: t.uid || t.id, name: t.name }))
  } catch (err) { console.error(err) }
}

const handleActionSubmit = () => {
  isSubmittingAttempted.value = true
  if (!isFormValid.value || (props.type === 'edit' && !isChanged.value)) return
  emit('submit', { ...localData.value })
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchData()
    if (localData.value.programId) fetchProgramSchedules()
  }
})
</script>

<style scoped>
@import "@/assets/styles/components/ActionModalShared.css";

.info-box-standard {
  background: var(--info-soft);
  border: 1px solid var(--primary-light);
  padding: var(--space-md);
  border-radius: var(--border-radius-sm);
  color: var(--primary-color);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.modal-header-main {
  margin-bottom: var(--space-md);
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.modal-title-icon {
  width: 32px;
  height: 32px;
}
</style>
