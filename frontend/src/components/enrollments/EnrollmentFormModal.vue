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

  enrollment: { type: Object, default: null }, // Existing enrollment to edit
  error: { type: String, default: '' },
  success: { type: String, default: '' },
  hint: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit', 'program-change'])

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


const { searchQuery: parentSearchQuery, searchResults: filteredParents } = useSearch(
  toRef(props, 'parents'),
  parentSearchMapper,
)

const availableProgramsForStudent = computed(() => {
  if (!formData.value.studentId) return props.programs
  return props.programs.filter(program => {
    const alreadyEnrolled = props.enrollments.some(e =>
      e.studentId === formData.value.studentId &&
      e.programId === program.id &&
      (e.status || "").toLowerCase() !== "cancelled" &&
      (e.status || "").toLowerCase() !== "canceled"
    )
    return !alreadyEnrolled
  })
})

const { searchQuery: programSearchQuery, searchResults: filteredPrograms } = useSearch(
  availableProgramsForStudent,
  programSearchMapper,
)

const availableStudents = computed(() => {
  if (!formData.value.parentId) return []
  return props.students.filter(
    (s) => s.parentId === formData.value.parentId || s.parentUid === formData.value.parentId,
  )
})

const { searchQuery: studentSearchQuery, searchResults: filteredStudentsList } = useSearch(
  availableStudents,
  studentSearchMapper,
)

const selectedParent = computed(() => {
  if (!formData.value.parentId) return null
  return props.parents.find((p) => (p.uid || p.id) === formData.value.parentId)
})

const errors = ref({
  parentId: '',
  studentId: '',
  programId: '',
  classId: ''
})


const setError = (field, msg) => {
  closeAllDropdowns() // Close any open dropdowns when an error occurs
  errors.value[field] = msg
  // Clear error after 5 seconds
  setTimeout(() => {
    if (errors.value[field] === msg) errors.value[field] = ''
  }, 5000)
}

const clearErrors = () => {
  Object.keys(errors.value).forEach(k => errors.value[k] = '')
}

const closeAllDropdowns = () => {
  isParentDropdownOpen.value = false
  isStudentDropdownOpen.value = false
  isProgramDropdownOpen.value = false
  isClassDropdownOpen.value = false
}


const dropdownStyles = ref({ top: '0px', left: '0px', width: '0px' })

const toggleDropdown = (field, event) => {
  const states = {
    parent: isParentDropdownOpen,
    student: isStudentDropdownOpen,
    program: isProgramDropdownOpen,
    class: isClassDropdownOpen
  }


  const targetState = states[field].value
  const wasOpen = targetState

  closeAllDropdowns()
  clearErrors()

  if (!wasOpen && event) {
    const rect = event.currentTarget.getBoundingClientRect()
    dropdownStyles.value = {
      top: `${rect.bottom + window.scrollY + 4}px`,
      left: `${rect.left + window.scrollX}px`,
      minWidth: `${rect.width}px`
    }
    states[field].value = true
  }
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.custom-dropdown') && !event.target.closest('.dropdown-menu')) {
    closeAllDropdowns()
    clearErrors() // Clear errors when clicking outside
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

const isEditMode = computed(() => !!props.enrollment)

// Auto-populate when edit enrollment is provided
watch(() => props.enrollment, (newEnrollment) => {
  if (newEnrollment && props.isOpen) {
    formData.value = {
      parentId: newEnrollment.parentId || '',
      studentId: newEnrollment.studentId || '',
      programId: newEnrollment.programId || '',
      classId: newEnrollment.classId || '',

      isProrated: newEnrollment.isProrated ?? false,
      discountAmount: newEnrollment.discountAmount || 0,
      isSponsorship: newEnrollment.isSponsorship || false,
      sponsorName: newEnrollment.sponsorName || '',
      isCustomPrice: newEnrollment.isCustomPrice || false,
      customPrice: newEnrollment.amount || 0,
      remark: newEnrollment.remark || '',
    }
    initialFormData.value = JSON.stringify(formData.value)
    emit('program-change', newEnrollment.programId)
  }
}, { immediate: true })

const initialFormData = ref('')
const isChanged = computed(() => {
  if (!isEditMode.value) return true
  return JSON.stringify(formData.value) !== initialFormData.value
})

const showValidationHint = ref(false)
let hintTimeout = null

// Auto-reset when modal opens/closes
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    clearErrors()
    isSubmittingAttempted.value = false
    if (props.enrollment) {
      // POPULATE form for edit mode
      formData.value = {
        parentId: props.enrollment.parentId || '',
        studentId: props.enrollment.studentId || '',
        programId: props.enrollment.programId || '',
        classId: props.enrollment.classId || '',

        isProrated: props.enrollment.isProrated ?? false,
        discountAmount: props.enrollment.discountAmount || 0,
        isSponsorship: props.enrollment.isSponsorship || false,
        sponsorName: props.enrollment.sponsorName || '',
        isCustomPrice: props.enrollment.isCustomPrice || false,
        customPrice: props.enrollment.amount || 0,
        remark: props.enrollment.remark || '',
      }
      initialFormData.value = JSON.stringify(formData.value)
      emit('program-change', props.enrollment.programId)

    } else {
      formData.value = {
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
      }
    }
  }
})

watch(() => formData.value.studentId, (newStudentId) => {
  if (!newStudentId || isEditMode.value) return

  const isNowInvalid = props.enrollments.some(e =>
    e.studentId === newStudentId &&
    e.programId === formData.value.programId &&
    e.status !== 'cancelled'
  )

  if (isNowInvalid) {
    formData.value.programId = ''
    formData.value.classId = ''
    emit('program-change', '')
  }

})

const remarkPresets = [
  'Sibling Discount',
  'Returning Student',
  'Trial Session',
  'Early Bird',
  'Special Needs',
  'Special Occasion Discount'
]

const toggleRemarkPreset = (chipValue) => {
  const currentText = formData.value.remark || ''
  let values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  if (values.includes(chipValue)) {
    values = values.filter((v) => v !== chipValue)
  } else {
    values.push(chipValue)
  }
  formData.value.remark = values.join(', ')
}

const isRemarkPresetActive = (chipValue) => {
  const currentText = formData.value.remark || ''
  const values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  return values.includes(chipValue)
}

const selectParent = (uid) => {
  formData.value.parentId = uid
  formData.value.studentId = ''
  formData.value.programId = ''
  formData.value.classId = ''
  isParentDropdownOpen.value = false

  errors.value.parentId = ''
}

const selectStudent = (student) => {
  formData.value.studentId = student.id || student.uid
  formData.value.programId = ''
  formData.value.classId = ''
  isStudentDropdownOpen.value = false
  errors.value.studentId = ''
}

const selectedStudent = computed(() => {
  if (!formData.value.studentId) return null
  return props.students.find((s) => (s.id || s.uid) === formData.value.studentId)
})

const selectedProgramPrice = computed(() => {
  const c = props.programs.find((c) => c.id === formData.value.programId)
  return c ? c.price || 0 : 0
})

const pricePerSession = computed(() => {
  if (!selectedProgramPrice.value || !sessionInfo.value || sessionInfo.value.total === 0) return 0
  return selectedProgramPrice.value / sessionInfo.value.total
})

const handleProgramChange = (programId) => {
  formData.value.programId = programId
  formData.value.classId = ''
  isProgramDropdownOpen.value = false
  errors.value.programId = ''
  emit('program-change', programId)
}

const selectClass = (classId) => {
  formData.value.classId = classId
  isClassDropdownOpen.value = false
}

const sessionInfo = computed(() => {
  if (!formData.value.programId || !formData.value.classId) return null
  const program = props.programs.find((c) => c.id === formData.value.programId)
  const classInstance = props.classes.find((c) => c.id === formData.value.classId)
  if (!program || !classInstance) return null
  return getSessionCounts(program.startDate, program.endDate, {
    [classInstance.day]: classInstance.timeslot
  })
})

const selectedProgram = computed(() => {
  return props.programs.find((c) => c.id === formData.value.programId)
})

const selectedClass = computed(() => {
  if (!formData.value.classId) return null
  return props.classes.find((c) => c.id === formData.value.classId)
})

const isAlreadyEnrolled = computed(() => {
  if (!formData.value.studentId || !formData.value.programId) return false
  if (props.success) return false

  return props.enrollments.some(
    (e) =>
      e.studentId === formData.value.studentId &&
      e.programId === formData.value.programId &&
      (e.status || "").toLowerCase() !== "cancelled" &&
      (e.status || "").toLowerCase() !== "canceled" &&
      (!isEditMode.value || e.id !== props.enrollment?.id) // Exclude current record if editing
  )
})

const currentEnrollment = computed(() => {
  if (isEditMode.value) return props.enrollment
  if (!formData.value.studentId || !formData.value.programId) return null
  return props.enrollments.find(
    (e) =>
      e.studentId === formData.value.studentId &&
      e.programId === formData.value.programId &&
      (e.status || "").toLowerCase() !== "cancelled" &&
      (e.status || "").toLowerCase() !== "canceled"
  )
})

const displayEnrollmentStatus = computed(() => getEnrollmentDisplayStatus(currentEnrollment.value))

const calculatedPrice = computed(() => {
  const basePrice = selectedProgramPrice.value
  let price = basePrice

  if (formData.value.isProrated && sessionInfo.value) {
    const { total, remaining } = sessionInfo.value
    if (total > 0) {
      price = (basePrice / total) * remaining
    }
  }

  return price - (formData.value.discountAmount || 0)
})

const finalAmount = computed(() => {
  return formData.value.isCustomPrice ? formData.value.customPrice : calculatedPrice.value
})

const prorateSavings = computed(() => {
  if (!formData.value.isProrated || !sessionInfo.value || !selectedProgramPrice.value) return 0
  const { total, remaining } = sessionInfo.value
  if (total <= 0) return 0
  return (selectedProgramPrice.value / total) * (total - remaining)
})

const isFullEnrollment = computed(() => {
  const isFullSession = !formData.value.isProrated || (sessionInfo.value?.passed === 0)
  const isFullPrice = !formData.value.isCustomPrice && (formData.value.discountAmount || 0) === 0

  return isFullSession && isFullPrice
})

const isSubmittingAttempted = ref(false)
const validationHint = computed(() => {
  if (isEditMode.value && !isChanged.value) return 'No changes detected to update.'
  if (!formData.value.parentId) return 'Parent selection is required.'
  if (!formData.value.studentId) return 'Student selection is required.'
  if (!formData.value.programId) return 'Program selection is required.'
  if (!formData.value.classId) return 'Class selection is required.'
  if (isAlreadyEnrolled.value && !isEditMode.value) return 'Student is already enrolled in this program.'

  return ''
})

const validateAndSubmit = () => {
  if (!!validationHint.value) {
    showValidationHint.value = true
    if (hintTimeout) clearTimeout(hintTimeout)
    hintTimeout = setTimeout(() => {
      showValidationHint.value = false
    }, 3000)
    return
  }

  clearErrors()
  handleSubmit()
}

const handleSubmit = () => {
  if (isAlreadyEnrolled.value && !isEditMode.value) {
    setError('programId', 'Student is already enrolled in this program.')
    return
  }

  emit('submit', {
    ...(isEditMode.value ? { id: props.enrollment.id } : {}),
    ...formData.value,
    amount: finalAmount.value,
    enrollmentType: isFullEnrollment.value ? 'Full' : 'Partial',
    basePrice: selectedProgramPrice.value,
    totalSessions: sessionInfo.value?.total || 0,
    remainingSessions: sessionInfo.value?.remaining || 0,
    passedSessions: sessionInfo.value?.passed || 0,
    prorateSavings: prorateSavings.value || 0
  })
}
</script>

<template>
  <AppModal :show="isOpen" @close="$emit('close')" :title="isEditMode ? 'Edit Enrollment' : 'Create New Enrollment'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')">
    <div class="modal-inner-content">
      <form @submit.prevent="validateAndSubmit" class="enrollment-form">
        <div class="form-grid">
          <div class="form-group custom-dropdown-container">
            <label>Select Parent</label>
            <div class="custom-dropdown" :class="{ open: isParentDropdownOpen, 'field-error': errors.parentId }">
              <div class="dropdown-header" @click.stop="toggleDropdown('parent', $event)">
                <template v-if="selectedParent">
                  <div class="selected-parent">
                    <img :src="getParentProfileURL(selectedParent.profile)" class="avatar-mini-enrollment" />
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
                  <input type="text" v-model="parentSearchQuery" placeholder="Search name or email..." autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="p in filteredParents" :key="p.uid || p.id" class="dropdown-item"
                    :class="{ active: formData.parentId === (p.uid || p.id) }" @click="selectParent(p.uid || p.id)">
                    <div class="item-main">
                      <img :src="getParentProfileURL(p.profile)" class="avatar-mini-enrollment" />
                      <span class="item-name">{{ p.name || p.email }}</span>
                    </div>
                    <StatusBadge :status="p.role" />
                  </li>
                  <li v-if="filteredParents.length === 0" class="dropdown-item no-results">
                    No matches found.
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="errors.parentId" class="field-error-msg">{{ errors.parentId }}</div>
          </div>

          <div class="form-group custom-dropdown-container">
            <label>Select Student</label>
            <div class="custom-dropdown"
              :class="{ open: isStudentDropdownOpen, 'step-locked': !formData.parentId, 'field-error': errors.studentId }">
              <div class="dropdown-header"
                @click.stop="!formData.parentId ? setError('parentId', 'Choose a parent first.') : toggleDropdown('student', $event)">
                <template v-if="selectedStudent">
                  <div class="selected-item">
                    <img :src="getStudentProfileURL(selectedStudent.profile)" class="avatar-mini-enrollment" />
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
                  <input type="text" v-model="studentSearchQuery" placeholder="Search student name..." @click.stop
                    autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="s in filteredStudentsList" :key="s.id || s.uid" class="dropdown-item"
                    :class="{ active: formData.studentId === (s.id || s.uid) }" @click="selectStudent(s)">
                    <div class="item-main">
                      <img :src="getStudentProfileURL(s.profile)" class="avatar-mini-enrollment" />
                      <span class="item-name">{{ s.name }}</span>
                    </div>
                    <StatusBadge :status="'Age: ' + calculateAge(s.dob)" />
                  </li>
                  <li v-if="filteredStudentsList.length === 0" class="dropdown-item no-results">
                    No students found.
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="errors.studentId" class="field-error-msg">{{ errors.studentId }}</div>
          </div>

          <div class="form-group custom-dropdown-container">
            <label>Select Program</label>
            <div class="custom-dropdown"
              :class="{ open: isProgramDropdownOpen, 'step-locked': !formData.studentId, 'field-error': errors.programId }">
              <div class="dropdown-header"
                @click.stop="!formData.studentId ? setError('studentId', 'Choose a student first.') : toggleDropdown('program', $event)">
                <template v-if="selectedProgram">
                  <div class="selected-item">
                    <img :src="getProgramProfileURL(selectedProgram.profile, selectedProgram.category)"
                      class="avatar-mini-enrollment" />
                    <span>{{ selectedProgram.title }}</span>
                  </div>
                </template>
                <template v-else>
                  <span class="placeholder">{{ !formData.studentId ? 'Select student first' : 'Select a program'
                  }}</span>
                </template>
                <span class="chevron" :class="{ up: isProgramDropdownOpen }"></span>
              </div>
            </div>
            <Teleport to="body">
              <div class="dropdown-menu" v-if="isProgramDropdownOpen" :style="dropdownStyles">
                <div class="dropdown-search">
                  <img :src="getActionIcon('search')" class="search-icon-mini" />
                  <input type="text" v-model="programSearchQuery" placeholder="Search program title..." @click.stop
                    autofocus />
                </div>
                <ul class="dropdown-list scrollable">
                  <li v-for="c in filteredPrograms" :key="c.id" class="dropdown-item"
                    :class="{ active: formData.programId === c.id }" @click="handleProgramChange(c.id)">
                    <div class="item-main">
                      <img :src="getProgramProfileURL(c.profile, c.category)" class="avatar-mini-enrollment" />
                      <span class="item-name">{{ c.title }}</span>
                    </div>
                    <StatusBadge :status="c.termName" type="blue" />
                  </li>
                  <li v-if="filteredPrograms.length === 0" class="dropdown-item no-results">
                    No matches found.
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="errors.programId" class="field-error-msg">{{ errors.programId }}</div>
          </div>

          <div class="form-group custom-dropdown-container">
            <label>Select Class</label>
            <div class="custom-dropdown"
              :class="{ open: isClassDropdownOpen, 'step-locked': !formData.programId || classes.length === 0 || (isAlreadyEnrolled && !isEditMode), 'field-error': errors.classId }">
              <div class="dropdown-header"
                @click.stop="!formData.programId ? setError('programId', 'Choose a program first.') : ((isAlreadyEnrolled && !isEditMode) ? setError('programId', 'Already enrolled in this program.') : (classes.length === 0 ? setError('classId', 'This program has no available classes.') : toggleDropdown('class', $event)))">
                <template v-if="selectedClass">
                  <div class="selected-session">
                    <div class="session-display-row">
                      <span class="icon text-lg opacity-80">⏰</span>
                      <div class="session-day-text"><strong>{{ selectedClass.day }}</strong></div>
                      <div class="session-time-text">{{ selectedClass.timeslot }}</div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="placeholder">{{ !formData.programId ? 'Select program first' : (classes.length === 0 ?
                    'No available classes' : 'Choose a class') }}</span>
                </template>
                <span class="chevron" :class="{ up: isClassDropdownOpen }"></span>
              </div>
            </div>
            <Teleport to="body">
              <div class="dropdown-menu" v-if="isClassDropdownOpen" :style="dropdownStyles">
                <ul class="dropdown-list">
                  <li v-for="c in classes" :key="c.id" class="dropdown-item session-item" :class="{
                    active: formData.classId === c.id,
                    disabled: (c.numStudent) >= (c.capacity)
                  }" @click="(c.numStudent) < (c.capacity) && selectClass(c.id)">
                    <div class="session-rows">
                      <div class="session-row-1">
                        <div class="session-display-row">
                          <div class="session-day-text"><strong>{{ c.day }}</strong></div>
                          <div class="session-time-text">{{ c.timeslot || 'TBD' }}</div>
                        </div>
                        <span v-if="(c.numStudent) >= (c.capacity)" class="full-badge">FULL</span>
                      </div>
                      <div class="session-row-2">
                        <div class="capacity-bar-mini">
                          <div class="capacity-progress"
                            :style="{ width: Math.min(100, ((c.numStudent) / (c.capacity)) * 100) + '%' }">
                          </div>
                        </div>
                        <span class="capacity-text">{{ c.numStudent }} / {{ c.capacity }} enrolled</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="errors.classId" class="field-error-msg">{{ errors.classId }}</div>
          </div>

        </div>

        <!-- Program Brief -->
        <div v-if="selectedProgram && selectedClass" class="form-group full-width">

          <label>Program Period</label>
          <div class="period-info-box">
            <StatusBadge :status="selectedProgram.termName" type="blue" />
            <span class="date">{{ selectedProgram.startDate }}</span>
            <span class="sep">to</span>
            <span class="date">{{ selectedProgram.endDate }}</span>
          </div>
        </div>

        <AppAlert v-if="isAlreadyEnrolled && !isEditMode" type="warning" class="mt-md">
          This student is already enrolled in this program.
        </AppAlert>

        <!-- Session Summary & Prorating -->
        <div v-if="sessionInfo && (!isAlreadyEnrolled || isEditMode)" class="form-group full-width">
          <label>Session Enrollment Detail</label>
          <div class="session-summary-box">
            <div class="summary-header-row">
              <div class="summary-left">
                <div class="summary-icon">📅</div>
                <div class="summary-content">
                  <div class="summary-label">Sessions Remaining</div>
                  <div class="summary-value">
                    <strong>{{ sessionInfo.remaining }}</strong>
                    <small>of {{ sessionInfo.total }} sessions</small>
                    <span v-if="sessionInfo.passed > 0" class="passed-badge-small">{{ sessionInfo.passed }}
                      passed</span>
                  </div>
                  <div v-if="pricePerSession > 0" class="session-price-hint">(${{ formatPrice(pricePerSession)
                  }}/session)</div>
                </div>
              </div>
              <StatusBadge :status="displayEnrollmentStatus" />
            </div>

            <div v-if="sessionInfo.passed > 0 && !currentEnrollment" class="prorate-modern">
              <label class="prorate-toggle">
                <div class="toggle-text">
                  <strong>Partial Enrollment</strong>
                  <p>Enrolling for <strong>{{ sessionInfo.remaining }}</strong> remaining sessions only</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" v-model="formData.isProrated" />
                  <span class="slider"></span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div v-if="sessionInfo && (!isAlreadyEnrolled || isEditMode)" class="form-group full-width">
          <label>Payment & Discounts</label>
          <div class="financial-section">
            <div class="financial-col">
              <div class="form-group">
                <label for="discountAmount">Discount Amount ($)</label>
                <input id="discountAmount" type="number" v-model.number="formData.discountAmount" min="0"
                  placeholder="0" @focus="clearErrors" class="standard-input" />
              </div>
            </div>

            <div class="financial-col separator">
              <div class="financial-grid">
                <div class="form-group sponsor-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="formData.isSponsorship" />
                    Sponsorship / Third-party
                  </label>
                  <input v-if="formData.isSponsorship" type="text" v-model="formData.sponsorName"
                    placeholder="Sponsor Name" class="mini-input-enrollment" />
                </div>

                <div class="custom-override">
                  <label class="checkbox-label danger">
                    <input type="checkbox" v-model="formData.isCustomPrice" />
                    Manual Price (Special Case)
                  </label>
                  <input v-if="formData.isCustomPrice" type="number" v-model.number="formData.customPrice"
                    placeholder="Final Price" class="mini-input-enrollment" @focus="clearErrors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="formData.classId && (!isAlreadyEnrolled || isEditMode)" class="form-group full-width">
          <label>Enrollment Remarks / Special Case</label>
          <input type="text" v-model="formData.remark" placeholder="Input Enrollment Remark (Optional)"
            class="standard-input mb-md" />
          <div class="preset-chips chips-div-enrollment">
            <button v-for="preset in remarkPresets" :key="preset" type="button" class="preset-chip"
              :class="{ active: isRemarkPresetActive(preset) }" @click="toggleRemarkPreset(preset)">
              {{ preset }}
            </button>
          </div>
          <AppAlert v-if="isRemarkPresetActive('Special Occasion Discount')" type="success" class="mt-md">
            <span><strong>Special Occasion Discount:</strong> Please ensure the discount amount is entered in the
              Payment section below.</span>
          </AppAlert>
        </div>

        <div v-if="formData.programId && formData.classId" class="price-preview-box">
          <div class="price-info-enrollment">
            <div class="price-header-row">
              <span class="price-label-enrollment">Final Amount</span>

              <StatusBadge v-if="!isFullEnrollment" status="Partial Enrollment" />
              <StatusBadge v-else status="Full Enrollment" />
            </div>
            <div class="price-notes-enrollment">
              <div v-if="sessionInfo && sessionInfo.passed > 0 && formData.isProrated" class="price-note-enrollment">
                <span class="original-price-strikethrough">${{ formatPrice(selectedProgramPrice) }}</span>
                <span class="discount-badge-mini">-${{ formatPrice(prorateSavings) }} (Prorated)</span>
              </div>
              <div v-if="formData.discountAmount > 0" class="price-note-enrollment">
                <span class="discount-badge-mini">-${{ formatPrice(formData.discountAmount) }} (Discount)</span>
              </div>
            </div>
          </div>
          <strong class="price-amount-large">${{ formatPrice(finalAmount) }}</strong>
        </div>
        <button type="submit" class="hidden"></button>
      </form>
    </div>
 
    <template #footer>
      <div class="flex-column flex-end w-full gap-sm">
        <transition name="toast-fade">
          <div v-if="props.error && props.error.length > 0" class="alert-box error w-full mb-none">
            {{ props.error }}
          </div>
        </transition>
 
        <transition name="toast-fade">
          <div v-if="props.success && props.success.length > 0" class="alert-box success w-full mb-none">
            {{ props.success }}
          </div>
        </transition>
        <transition name="toast-fade">
          <div v-if="showValidationHint && validationHint" class="validation-hint-toast">
            ⚠️ {{ validationHint }}
          </div>
        </transition>
        <div class="flex-align-center flex-end w-full gap-sm">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton variant="primary" type="button" @click.stop="validateAndSubmit" :loading="loading"
            :disabled="(isAlreadyEnrolled && !isEditMode) || !!validationHint"
            :class="{ 'button-disabled-visual': (isAlreadyEnrolled && !isEditMode) || !!validationHint }">
            {{ isEditMode ? 'Update Enrollment' : 'Confirm Enrollment' }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
  margin-top: var(--space-2xl);
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-dark);
}

.form-group select,
.form-group input,
.form-group textarea {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
  background-color: var(--bg-subtle);
  outline: none;
  transition: all 0.2s;
}

.form-group textarea {
  resize: none;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--primary-color);
  background-color: var(--white);
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
}

.period-info-box {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--bg-subtle);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-xs);
}

.period-info-box .sep {
  color: var(--text-light);
  font-weight: 600;
  font-size: var(--text-xs);
}


.summary-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-text {
  font-size: var(--text-sm);
  color: var(--text-dark);
}

.passed-tag {
  display: none;
}

.prorate-action {
  margin-left: auto;
  padding-left: var(--space-lg);
  border-left: 1px solid var(--border-color);
}

.checkbox-label.highlight {
  color: var(--primary-color);
}

.session-summary-box {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
}

.summary-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.summary-top {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.summary-icon {
  width: 44px;
  height: 44px;
  background: var(--primary-soft);
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  border: 1px solid var(--primary-light);
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-light);
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.summary-value {
  font-size: var(--text-lg);
  color: var(--text-dark);
}

.summary-value strong {
  font-weight: 700;
  font-size: var(--text-xl);
  color: var(--primary-color);
}

.summary-value small {
  color: var(--text-muted);
  margin-left: var(--space-2xs);
}

.session-price-hint {
  font-size: var(--text-sm);
  color: var(--text-light);
  margin-left: var(--space-md);
  font-style: italic;
}

.passed-badge-small {
  background: var(--error-soft);
  color: var(--error-color);
  font-size: var(--text-3xs);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  margin-left: var(--space-sm);
  vertical-align: middle;
}

.passed-indicator {
  display: none;
}

/* Prorate Toggle Modern */
.prorate-modern {
  background: var(--white);
  padding: var(--space-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.prorate-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.toggle-text {
  flex: 1;
}

.toggle-text strong {
  display: block;
  font-size: var(--text-base);
  color: var(--text-dark);
  margin-bottom: var(--space-3xs);
}

.toggle-text p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-left: var(--space-lg);
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--text-light);
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

input:checked+.slider {
  background-color: var(--primary-color);
}

input:checked+.slider:before {
  transform: translateX(24px);
}

.price-notes {
  display: flex;
  gap: var(--space-sm);
}

.financial-section {
  padding: var(--space-lg);
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  display: flex;
  gap: var(--space-xl);
}

.financial-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.financial-col.separator {
  padding-left: var(--space-xl);
  border-left: 1px solid var(--border-color);
}

.financial-grid {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-lg);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  margin-bottom: var(--space-2xs);
}

.checkbox-label.danger {
  color: var(--error-color);
}

.sponsor-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.mini-input {
  padding: var(--space-2xs) var(--space-sm);
  font-size: var(--text-sm);
}

.custom-override {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-inner-content {
  padding: 0 4px;
}

.custom-dropdown-container {
  position: relative;
}


@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.shake {
  animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}

@keyframes shake {

  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
