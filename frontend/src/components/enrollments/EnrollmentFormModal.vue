<template>
  <AppModal :show="isOpen" @close="$emit('close')"
    :title="isEditMode ? 'Edit Enrollment Details' : 'Create New Enrollment'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')">
    <div class="modal-inner-content">
      <form id="enrollmentForm" @submit.prevent="validateAndSubmit" class="enrollment-form">
        <div class="form-grid">
          <div class="form-group custom-dropdown-container"
            :class="{ 'field-error': isSubmittingAttempted && errors.parentId }">
            <label>Select Parent <span class="required">*</span></label>
            <div class="custom-dropdown" :class="{ open: isParentDropdownOpen, 'step-locked': isSelectionLocked }">
              <div class="dropdown-header" @click.stop="toggleDropdown('parent', $event)">
                <template v-if="selectedParent">
                  <div class="selected-item">
                    <img :src="getParentProfileURL(selectedParent.profileURL)" class="avatar-mini-enrollment" />
                    <span>{{ selectedParent.name || selectedParent.email }}</span>
                  </div>
                </template>
                <template v-else>
                  <span class="placeholder">Choose a parent</span>
                </template>
                <span class="chevron" :class="{ up: isParentDropdownOpen }"></span>
              </div>
            </div>
            <Teleport to="body">
              <div class="dropdown-menu" v-if="isParentDropdownOpen" :style="dropdownStyles">
                <div class="dropdown-search">
                  <img :src="getActionIcon('search')" class="search-icon-mini" />
                  <input type="text" v-model="parentSearchQuery" placeholder="Search name or email..." @click.stop autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="p in filteredParents" :key="p.uid || p.id" class="dropdown-item"
                    :class="{ active: formData.parentId === (p.uid || p.id) }" @click="selectParent(p.uid || p.id)">
                    <div class="item-main">
                      <img :src="getParentProfileURL(p.profileURL)" class="avatar-mini-enrollment" />
                      <span class="item-name">{{ p.name }}</span>
                    </div>
                  </li>
                  <li v-if="filteredParents.length === 0" class="dropdown-item no-results-item">
                    No matches found.
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="isSubmittingAttempted && errors.parentId" class="field-error-msg">{{ errors.parentId }}</div>
          </div>

          <div class="form-group custom-dropdown-container"
            :class="{ 'field-error': isSubmittingAttempted && errors.studentId }">
            <label>Select Student <span class="required">*</span></label>
            <div class="custom-dropdown"
              :class="{ open: isStudentDropdownOpen, 'step-locked': !formData.parentId || isSelectionLocked }">
              <div class="dropdown-header"
                @click.stop="toggleDropdown('student', $event)">
                <template v-if="selectedStudent">
                  <div class="selected-item">
                    <img :src="getStudentProfileURL(selectedStudent.profileURL)" class="avatar-mini-enrollment" />
                    <span>{{ selectedStudent.name }}</span>
                  </div>
                </template>
                <template v-else>
                  <span class="placeholder">{{ !formData.parentId ? 'Select parent first' : 'Choose a student' }}</span>
                </template>
                <span class="chevron" :class="{ up: isStudentDropdownOpen }"></span>
              </div>
            </div>
            <Teleport to="body">
              <div class="dropdown-menu" v-if="isStudentDropdownOpen" :style="dropdownStyles">
                <div class="dropdown-search">
                  <img :src="getActionIcon('search')" class="search-icon-mini" />
                  <input type="text" v-model="studentSearchQuery" placeholder="Search student name..." @click.stop autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="s in filteredStudentsList" :key="s.id || s.uid" class="dropdown-item"
                    :class="{ active: formData.studentId === (s.id || s.uid) }" @click="selectStudent(s)">
                    <div class="item-main">
                      <img :src="getStudentProfileURL(s.profileURL)" class="avatar-mini-enrollment" />
                      <span class="item-name">{{ s.name }}</span>
                    </div>
                    <StatusBadge :status="'Age: ' + calculateAge(s.dob)" type="blue" />
                  </li>
                  <li v-if="filteredStudentsList.length === 0" class="dropdown-item no-results-container">
                    <div class="no-results-content">
                      <span class="no-results-text">No students found.</span>
                      <button v-if="formData.parentId" type="button" class="btn-register-inline"
                        @click="$emit('register-student', formData.parentId); isStudentDropdownOpen = false">
                        <img :src="getActionIcon('plus')" class="btn-icon-mini" /> Register New Child
                      </button>
                    </div>
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="isSubmittingAttempted && errors.studentId" class="field-error-msg">{{ errors.studentId }}</div>
          </div>

          <div class="form-group custom-dropdown-container"
            :class="{ 'field-error': isSubmittingAttempted && errors.programId }">
            <label>Select Program <span class="required">*</span></label>
            <div class="custom-dropdown" :class="{ open: isProgramDropdownOpen, 'step-locked': !formData.studentId }">
              <div class="dropdown-header"
                @click.stop="toggleDropdown('program', $event)">
                <template v-if="selectedProgram">
                  <div class="selected-item">
                    <img :src="getProgramProfileURL(selectedProgram.profileURL, selectedProgram.category)" class="avatar-mini-enrollment" />
                    <span>{{ selectedProgram.title }}</span>
                  </div>
                </template>
                <template v-else>
                  <span class="placeholder">{{ !formData.studentId ? 'Select student first' : 'Select a program' }}</span>
                </template>
                <span class="chevron" :class="{ up: isProgramDropdownOpen }"></span>
              </div>
            </div>
            <Teleport to="body">
              <div class="dropdown-menu" v-if="isProgramDropdownOpen" :style="dropdownStyles">
                <div class="dropdown-search">
                  <img :src="getActionIcon('search')" class="search-icon-mini" />
                  <input type="text" v-model="programSearchQuery" placeholder="Search program title..." @click.stop autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="c in filteredPrograms" :key="c.id" class="dropdown-item"
                    :class="{ active: formData.programId === c.id }" @click="handleProgramChange(c.id)">
                    <div class="item-main">
                      <img :src="getProgramProfileURL(c.profileURL, c.category)" class="avatar-mini-enrollment" />
                      <div class="item-info">
                        <span class="item-name">{{ c.title }}</span>
                        <span class="category-tag-mini">{{ c.category }}</span>
                      </div>
                    </div>
                    <span class="price-tag-mini">${{ formatPrice(c.price) }}</span>
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="isSubmittingAttempted && errors.programId" class="field-error-msg">{{ errors.programId }}</div>
          </div>

          <div class="form-group custom-dropdown-container"
            :class="{ 'field-error': isSubmittingAttempted && errors.classId }">
            <label>Select Class Slot <span class="required">*</span></label>
            <div class="custom-dropdown" :class="{ open: isClassDropdownOpen, 'step-locked': !formData.programId }">
              <div class="dropdown-header"
                @click.stop="toggleDropdown('class', $event)">
                <template v-if="selectedClass">
                  <div class="selected-item">
                    <div class="class-summary-mini">
                      <strong>{{ selectedClass.day }}</strong>
                      <span>{{ selectedClass.timeslot }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="placeholder">{{ !formData.programId ? 'Select program first' : 'Choose a time slot' }}</span>
                </template>
                <span class="chevron" :class="{ up: isClassDropdownOpen }"></span>
              </div>
            </div>
            <Teleport to="body">
              <div class="dropdown-menu" v-if="isClassDropdownOpen" :style="dropdownStyles">
                <ul class="dropdown-list">
                  <li v-for="cl in availableClasses" :key="cl.id" class="dropdown-item"
                    :class="{ active: formData.classId === cl.id, 'full': cl.numStudent >= cl.capacity }"
                    @click="cl.numStudent < cl.capacity ? selectClass(cl.id) : null">
                    <div class="item-main">
                      <div class="class-info-list">
                        <span class="class-day"><strong>{{ cl.day }}</strong></span>
                        <span class="class-time">{{ cl.timeslot }}</span>
                      </div>
                      <span class="class-meta-enrollment">
                        {{ cl.numStudent }}/{{ cl.capacity }} enrolled
                        <span v-if="cl.numStudent >= cl.capacity" class="full-badge">FULL</span>
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="isSubmittingAttempted && errors.classId" class="field-error-msg">{{ errors.classId }}</div>
          </div>
        </div>

        <!-- Price and Sessions Section -->
        <div v-if="formData.programId && formData.classId" class="financial-section mt-lg">
          <div class="financial-col">
            <div class="financial-header">
              <span class="section-label">Session Summary</span>
            </div>
            <div v-if="sessionInfo" class="financial-grid">
              <div class="session-box">
                <span class="box-label">Total Duration</span>
                <span class="box-value">{{ sessionInfo.total }} Sessions</span>
              </div>
              <div class="session-box highlight">
                <span class="box-label">Remaining</span>
                <span class="box-value">{{ sessionInfo.remaining }} Sessions</span>
                <span v-if="sessionInfo.passed > 0" class="box-sub">({{ sessionInfo.passed }} passed)</span>
              </div>
            </div>
          </div>

          <div class="financial-col separator">
            <div class="financial-header">
              <span class="section-label">Pricing Options</span>
            </div>
            <div class="financial-grid">
              <label class="checkbox-label">
                <div class="toggle-switch">
                  <input type="checkbox" v-model="formData.isProrated" id="prorate-toggle" />
                  <span class="slider"></span>
                </div>
                <span>Apply Proration</span>
              </label>

              <div class="form-group mt-xs">
                <label>Manual Discount ($)</label>
                <input type="number" v-model.number="formData.discountAmount" class="standard-input" min="0" />
              </div>

              <div class="divider">Custom Price Overrides</div>

              <label class="checkbox-label">
                <div class="toggle-switch">
                  <input type="checkbox" v-model="formData.isCustomPrice" />
                  <span class="slider"></span>
                </div>
                <span>Set Custom Total</span>
              </label>

              <div v-if="formData.isCustomPrice" class="form-group">
                <input type="number" v-model.number="formData.customPrice" class="standard-input" />
              </div>
            </div>
          </div>

          <div class="financial-col">
            <div class="price-preview-box">
              <div class="total-col">
                <span class="total-label-enrollment">Total Tuition</span>
                <div v-if="prorateSavings > 0" class="savings-tag">Prorate Savings: ${{ formatPrice(prorateSavings) }}</div>
              </div>
              <div class="total-amount-large">${{ formatPrice(finalAmount) }}</div>
            </div>
            <AppButton type="submit" variant="primary" :loading="loading" form="enrollmentForm" class="mt-lg w-full"
              :disabled="loading"
              :class="{ 'button-disabled-visual': isFormInvalid || (isEditMode && !isChanged) }">
              {{ isEditMode ? 'Update Enrollment' : 'Confirm Enrollment' }}
            </AppButton>
          </div>
        </div>

        <div class="form-group mt-md full-width">
          <label>Internal Enrollment Remarks</label>
          <div class="preset-chips mb-sm">
            <button v-for="preset in ['Trial Session', 'Sibling Discount', 'Advanced Payment', 'Waitlisted']" :key="preset"
              type="button" class="preset-chip" @click="toggleRemarkPreset(preset)" 
              :class="{ active: isRemarkPresetActive(preset) }">
              {{ preset }}
            </button>
          </div>
          <textarea v-model="formData.remark" placeholder="Add confidential notes about this enrollment..." rows="2" class="standard-input"></textarea>
        </div>
      </form>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, toRef, watch, onMounted, onUnmounted } from 'vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useSearch, parentSearchMapper, studentSearchMapper, programSearchMapper } from '@/composables/useSearch'
import { getStudentProfileURL, getParentProfileURL, getProgramProfileURL, getActionIcon } from '@/utils/assetHelper'
import { formatPrice, calculateAge } from '@/utils/formatUtils'
import { getSessionCounts } from '@/utils/programHelper'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import { getEnrollmentDisplayStatus } from '@/utils/statusUtils'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  parents: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  programs: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  enrollments: { type: Array, default: () => [] },
  enrollment: { type: Object, default: null },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit', 'program-change', 'register-student'])

const formData = ref({
  parentId: '',
  studentId: '',
  programId: '',
  classId: '',
  isProrated: true,
  discountAmount: 0,
  isSponsorship: false,
  sponsorName: '',
  isCustomPrice: false,
  customPrice: 0,
  remark: '',
})

const isParentDropdownOpen = ref(false)
const isStudentDropdownOpen = ref(false)
const isProgramDropdownOpen = ref(false)
const isClassDropdownOpen = ref(false)

const activeParents = computed(() => (props.parents || []).filter(p => (p.status || 'Active').toLowerCase() === 'active'))

const { searchQuery: parentSearchQuery, searchResults: filteredParents } = useSearch(activeParents, parentSearchMapper)

const availableProgramsForStudent = computed(() => {
  if (!formData.value.studentId) return props.programs
  return props.programs.filter(program => !props.enrollments.some(e => 
    e.studentId === formData.value.studentId && e.programId === program.id && !['cancelled', 'canceled'].includes((e.status || "").toLowerCase())
  ))
})

const { searchQuery: programSearchQuery, searchResults: filteredPrograms } = useSearch(availableProgramsForStudent, programSearchMapper)

const availableStudents = computed(() => {
  if (!formData.value.parentId) return []
  return props.students.filter(s => (s.parentId === formData.value.parentId || s.parentUid === formData.value.parentId))
})

const { searchQuery: studentSearchQuery, searchResults: filteredStudentsList } = useSearch(availableStudents, studentSearchMapper)

const selectedParent = computed(() => props.parents.find(p => (p.uid || p.id) === formData.value.parentId))
const selectedStudent = computed(() => props.students.find(s => (s.id || s.uid) === formData.value.studentId))
const selectedProgram = computed(() => props.programs.find(c => c.id === formData.value.programId))
const selectedClass = computed(() => props.classes.find(c => c.id === formData.value.classId))

const availableClasses = computed(() => {
  if (!formData.value.programId) return []
  return props.classes.filter(cl => cl.programId === formData.value.programId)
})

const sessionInfo = computed(() => {
  if (!selectedProgram.value || !selectedClass.value) return null
  return getSessionCounts(selectedProgram.value.startDate, selectedProgram.value.endDate, { [selectedClass.value.day]: selectedClass.value.timeslot })
})

const selectedProgramPrice = computed(() => selectedProgram.value?.price || 0)

const calculatedPrice = computed(() => {
  let price = selectedProgramPrice.value
  if (formData.value.isProrated && sessionInfo.value && sessionInfo.value.total > 0) {
    price = (selectedProgramPrice.value / sessionInfo.value.total) * sessionInfo.value.remaining
  }
  return price - (formData.value.discountAmount || 0)
})

const finalAmount = computed(() => formData.value.isCustomPrice ? formData.value.customPrice : calculatedPrice.value)

const prorateSavings = computed(() => {
  if (!formData.value.isProrated || !sessionInfo.value || !selectedProgramPrice.value || sessionInfo.value.total <= 0) return 0
  return (selectedProgramPrice.value / sessionInfo.value.total) * (sessionInfo.value.passed)
})

const isEditMode = computed(() => !!props.enrollment)
const initialDataString = ref('')
const isChanged = computed(() => !isEditMode.value || JSON.stringify(formData.value) !== initialDataString.value)
const isSelectionLocked = computed(() => isEditMode.value)

const manualErrors = ref({ parentId: '', studentId: '', programId: '', classId: '' })
const errors = computed(() => {
  const errs = { ...manualErrors.value }
  if (!formData.value.parentId) errs.parentId = 'Parent selection is required.'
  if (!formData.value.studentId) errs.studentId = 'Student selection is required.'
  if (!formData.value.programId) errs.programId = 'Program selection is required.'
  if (!formData.value.classId) errs.classId = 'Class slot selection is required.'
  return Object.fromEntries(Object.entries(errs).filter(([_, v]) => v))
})

const isFormInvalid = computed(() => Object.keys(errors.value).length > 0)
const isSubmittingAttempted = ref(false)

const validateAndSubmit = () => {
  isSubmittingAttempted.value = true
  if (isFormInvalid.value || (isEditMode.value && !isChanged.value)) return
  emit('submit', {
    ...(isEditMode.value ? { id: props.enrollment.id } : {}),
    ...formData.value,
    amount: finalAmount.value,
    enrollmentType: (!formData.value.isProrated || (sessionInfo.value?.passed === 0)) && !formData.value.isCustomPrice && (formData.value.discountAmount || 0) === 0 ? 'Full' : 'Partial'
  })
}

const dropdownStyles = ref({ top: '0px', left: '0px', width: '0px' })
const toggleDropdown = (type, e) => {
  // Feedback for locked or sequential fields
  if (isSelectionLocked.value && (type === 'parent' || type === 'student')) {
    isSubmittingAttempted.value = true
    return
  }

  if (type === 'student' && !formData.value.parentId) {
    setError('parentId', 'Choose a parent first.')
    isSubmittingAttempted.value = true
    return
  }
  if (type === 'program' && !formData.value.studentId) {
    setError('studentId', 'Choose a student first.')
    isSubmittingAttempted.value = true
    return
  }
  if (type === 'class' && !formData.value.programId) {
    setError('programId', 'Select a program first.')
    isSubmittingAttempted.value = true
    return
  }

  const header = e.currentTarget
  const rect = header.getBoundingClientRect()
  dropdownStyles.value = { top: `${rect.bottom + window.scrollY + 4}px`, left: `${rect.left + window.scrollX}px`, width: `${rect.width}px` }
  
  isParentDropdownOpen.value = type === 'parent' ? !isParentDropdownOpen.value : false
  isStudentDropdownOpen.value = type === 'student' ? !isStudentDropdownOpen.value : false
  isProgramDropdownOpen.value = type === 'program' ? !isProgramDropdownOpen.value : false
  isClassDropdownOpen.value = type === 'class' ? !isClassDropdownOpen.value : false
}

const selectParent = (uid) => {
  formData.value.parentId = uid
  formData.value.studentId = formData.value.programId = formData.value.classId = ''
  isParentDropdownOpen.value = false
}
const selectStudent = (s) => {
  formData.value.studentId = s.id || s.uid
  formData.value.programId = formData.value.classId = ''
  isStudentDropdownOpen.value = false
}
const handleProgramChange = (pid) => {
  formData.value.programId = pid
  formData.value.classId = ''
  isProgramDropdownOpen.value = false
  emit('program-change', pid)
}
const selectClass = (cid) => {
  formData.value.classId = cid
  isClassDropdownOpen.value = false
}
const setError = (key, msg) => { manualErrors.value[key] = msg }
const toggleRemarkPreset = (p) => {
  let values = (formData.value.remark || '').split(',').map(v => v.trim()).filter(Boolean)
  values = values.includes(p) ? values.filter(v => v !== p) : [...values, p]
  formData.value.remark = values.join(', ')
}
const isRemarkPresetActive = (p) => (formData.value.remark || '').split(',').map(v => v.trim()).includes(p)

watch(() => props.isOpen, (open) => {
  if (open) {
    if (props.enrollment) {
      formData.value = { ...props.enrollment }
      initialDataString.value = JSON.stringify(formData.value)
    } else {
      formData.value = { parentId: '', studentId: '', programId: '', classId: '', isProrated: true, discountAmount: 0, isCustomPrice: false, customPrice: 0, remark: '' }
    }
    isSubmittingAttempted.value = false
    manualErrors.value = { parentId: '', studentId: '', programId: '', classId: '' }
  }
})
</script>

<style scoped>
@import "@/assets/styles/components/ActionModalShared.css";

.modal-inner-content { padding: 4px; }
.avatar-mini-enrollment { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--border-color); object-fit: cover; }
.selected-item { display: flex; align-items: center; gap: var(--space-sm); font-size: var(--text-sm); font-weight: 500; }
.item-main { display: flex; align-items: center; gap: var(--space-sm); flex: 1; }
.item-info { display: flex; flex-direction: column; gap: 2px; }
.category-tag-mini { font-size: 10px; background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px; color: var(--text-muted); }
.price-tag-mini { margin-left: auto; font-weight: 700; color: var(--primary-color); }
.class-summary-mini { display: flex; flex-direction: column; font-size: var(--text-xs); line-height: 1.3; }
.class-info-list { display: flex; flex-direction: column; gap: 2px; }
.class-meta-enrollment { margin-left: auto; font-size: var(--text-xs); color: var(--text-muted); text-align: right; }
.full-badge { display: block; background: var(--error-soft); color: var(--error-color); font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 2px; margin-top: 2px; }

/* Financial Section */
.financial-section { display: grid; grid-template-columns: 1fr auto 1fr; gap: var(--space-xl); background: var(--bg-subtle); padding: var(--space-xl); border-radius: var(--border-radius); border: 1px solid var(--border-color); }
.financial-col.separator { border-left: 1px dashed var(--border-color); padding-left: var(--space-xl); }
.section-label { display: block; font-size: 10px; font-weight: 850; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--space-sm); }
.financial-grid { display: flex; flex-direction: column; gap: var(--space-md); }
.session-box { padding: var(--space-md); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--white); display: flex; flex-direction: column; }
.session-box.highlight { background: var(--info-soft); border-color: var(--primary-light); }
.box-label { font-size: 10px; color: var(--text-muted); }
.box-value { font-size: var(--text-base); font-weight: 700; color: var(--text-dark); }
.box-sub { font-size: 10px; color: var(--primary-color); font-weight: 600; }
.checkbox-label { display: flex; align-items: center; gap: var(--space-sm); cursor: pointer; font-size: var(--text-sm); font-weight: 500; }

.price-preview-box { background: var(--primary-color); color: white; padding: var(--space-xl); border-radius: var(--border-radius); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 15px rgba(0, 174, 239, 0.2); }
.total-label-enrollment { font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.9; }
.total-amount-large { font-size: 2rem; font-weight: 850; letter-spacing: -1px; }
.savings-tag { background: rgba(255, 255, 255, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-top: 4px; }

.dropdown-item.full { opacity: 0.5; cursor: not-allowed; grayscale: 1; }
.no-results-container { padding: var(--space-md); }
.no-results-content { display: flex; flex-direction: column; align-items: center; gap: var(--space-sm); color: var(--text-muted); font-size: var(--text-sm); }
</style>
