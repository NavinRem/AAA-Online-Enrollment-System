<script setup>
import { ref, computed, toRef, watch, onMounted, onUnmounted } from 'vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useSearch, parentSearchMapper, studentSearchMapper, programSearchMapper } from '@/composables/useSearch'
import { getStudentProfileURL, getParentProfileURL, getProgramProfileURL } from '@/utils/assetHelper'
import { getSessionCounts } from '@/utils/programHelper'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import { calculateAge } from '@/utils/dateFormatter'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  parents: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  programs: { type: Array, default: () => [] },
  sessions: { type: Array, default: () => [] },
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
  sessionId: '',
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
const isSessionDropdownOpen = ref(false)

const { searchQuery: parentSearchQuery, searchResults: filteredParents } = useSearch(
  toRef(props, 'parents'),
  parentSearchMapper,
)

const { searchQuery: programSearchQuery, searchResults: filteredPrograms } = useSearch(
  toRef(props, 'programs'),
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
  sessionId: ''
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
  isSessionDropdownOpen.value = false
}

const dropdownStyles = ref({ top: '0px', left: '0px', width: '0px' })

const toggleDropdown = (field, event) => {
  const states = {
    parent: isParentDropdownOpen,
    student: isStudentDropdownOpen,
    program: isProgramDropdownOpen,
    session: isSessionDropdownOpen
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
      sessionId: newEnrollment.sessionId || '',
      isProrated: newEnrollment.isProrated ?? true,
      discountAmount: newEnrollment.discountAmount || 0,
      isSponsorship: newEnrollment.isSponsorship || false,
      sponsorName: newEnrollment.sponsorName || '',
      isCustomPrice: newEnrollment.isCustomPrice || false,
      customPrice: newEnrollment.amount || 0, 
      remark: newEnrollment.remark || '',
    }
    // Trigger sessions fetch in parent 
    emit('program-change', newEnrollment.programId)
  }
}, { immediate: true })

// Auto-reset when modal opens/closes
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    clearErrors()
    if (!props.enrollment) {
      // Reset form ONLY for new enrollment
      formData.value = {
        parentId: '',
        studentId: '',
        programId: '',
        sessionId: '',
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
  formData.value.sessionId = ''
  isParentDropdownOpen.value = false
  errors.value.parentId = ''
}

const selectStudent = (student) => {
  formData.value.studentId = student.id || student.uid
  formData.value.programId = ''
  formData.value.sessionId = ''
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
  formData.value.sessionId = ''
  isProgramDropdownOpen.value = false
  errors.value.programId = ''
  emit('program-change', programId)
}

const selectSession = (sessionId) => {
  formData.value.sessionId = sessionId
  isSessionDropdownOpen.value = false
}

const sessionInfo = computed(() => {
  if (!formData.value.programId || !formData.value.sessionId) return null
  const program = props.programs.find((c) => c.id === formData.value.programId)
  const session = props.sessions.find((s) => s.id === formData.value.sessionId)
  if (!program || !session) return null

  return getSessionCounts(program.startDate, program.endDate, session.schedule)
})

const selectedProgram = computed(() => {
  return props.programs.find((c) => c.id === formData.value.programId)
})

const selectedSession = computed(() => {
  if (!formData.value.sessionId) return null
  return props.sessions.find((s) => s.id === formData.value.sessionId)
})

const isAlreadyEnrolled = computed(() => {
  if (!formData.value.studentId || !formData.value.programId) return false
  return props.enrollments.some(
    (e) =>
      e.studentId === formData.value.studentId &&
      e.programId === formData.value.programId &&
      e.status !== 'cancelled' &&
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
      e.status !== 'cancelled'
  )
})

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

const formatPrice = (val) => {
  if (val === undefined || val === null) return '0'
  return Number.isInteger(val) ? val.toString() : val.toFixed(2)
}

const prorateSavings = computed(() => {
  if (!formData.value.isProrated || !sessionInfo.value || !selectedProgramPrice.value) return 0
  const { total, remaining } = sessionInfo.value
  if (total <= 0) return 0
  return (selectedProgramPrice.value / total) * (total - remaining)
})

const isFullEnrollment = computed(() => {
  // Must be full session: Not prorated OR no sessions have passed yet
  const isFullSession = !formData.value.isProrated || (sessionInfo.value?.passed === 0)
  // Must be full price: No discount AND not a manual custom price override
  const isFullPrice = !formData.value.isCustomPrice && (formData.value.discountAmount || 0) === 0

  return isFullSession && isFullPrice
})

const validateAndSubmit = () => {
  clearErrors()
  if (!formData.value.parentId) return setError('parentId', 'Choose a parent first.')
  if (!formData.value.studentId) return setError('studentId', 'Choose a student first.')
  if (!formData.value.programId) return setError('programId', 'Choose a program first.')
  if (!formData.value.sessionId) return setError('sessionId', 'Choose a session first.')

  // Only check duplicate if it's NOT the enrollment we are currently editing
  if (isAlreadyEnrolled.value) {
    return setError('programId', 'This student is already enrolled in this program.')
  }

  handleSubmit()
}

const handleSubmit = () => {
  emit('submit', {
    ...(isEditMode.value ? { id: props.enrollment.id } : {}),
    ...formData.value,
    amount: finalAmount.value,
    enrollmentType: isFullEnrollment.value ? 'Full' : 'Partial'
  })
}
</script>

<template>
  <AppModal :show="isOpen" @close="$emit('close')" :title="isEditMode ? 'Edit Enrollment' : 'Create New Enrollment'">
    <div class="modal-inner-content">
      <!-- Global Alerts (Only for actual errors/success from server) -->
      <transition name="toast-fade">
        <div v-if="props.error && props.error.length > 0" class="alert-box error" style="margin-bottom: 24px;">
          {{ props.error }}
        </div>
      </transition>

      <transition name="toast-fade">
        <div v-if="props.success && props.success.length > 0" class="alert-box success" style="margin-bottom: 24px;">
          {{ props.success }}
        </div>
      </transition>

      <form @submit.prevent="validateAndSubmit" class="enrollment-form">
        <div class="form-grid">
          <!-- Parent Selection -->
          <div class="form-group custom-dropdown-container">
            <label>Select Parent / Guardian</label>
            <div class="custom-dropdown" :class="{ open: isParentDropdownOpen, 'field-error': errors.parentId }">
              <div class="dropdown-header" @click.stop="toggleDropdown('parent', $event)">
                <template v-if="selectedParent">
                  <div class="selected-parent">
                    <img :src="getParentProfileURL(selectedParent.profileURL)" class="avatar-mini-sm" />
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
                  <input type="text" v-model="parentSearchQuery" placeholder="Search name or email..." autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="p in filteredParents" :key="p.uid || p.id" class="dropdown-item"
                    :class="{ active: formData.parentId === (p.uid || p.id) }" @click="selectParent(p.uid || p.id)">
                    <div class="item-main">
                      <img :src="getParentProfileURL(p.profileURL)" class="avatar-mini-sm" />
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

          <!-- Student Selection -->
          <div class="form-group custom-dropdown-container">
            <label>Select Student</label>
            <div class="custom-dropdown"
              :class="{ open: isStudentDropdownOpen, 'step-locked': !formData.parentId, 'field-error': errors.studentId }">
              <div class="dropdown-header"
                @click.stop="!formData.parentId ? setError('parentId', 'Choose a parent first.') : toggleDropdown('student', $event)">
                <template v-if="selectedStudent">
                  <div class="selected-item">
                    <img :src="getStudentProfileURL(selectedStudent.profileURL)" class="avatar-mini-sm" />
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
                  <input type="text" v-model="studentSearchQuery" placeholder="Search student name..." @click.stop
                    autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="s in filteredStudentsList" :key="s.id || s.uid" class="dropdown-item"
                    :class="{ active: formData.studentId === (s.id || s.uid) }" @click="selectStudent(s)">
                    <div class="item-main">
                      <img :src="getStudentProfileURL(s.profileURL)" class="avatar-mini-sm" />
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

          <!-- Program Selection -->
          <div class="form-group custom-dropdown-container">
            <label>Select Program</label>
            <div class="custom-dropdown"
              :class="{ open: isProgramDropdownOpen, 'step-locked': !formData.studentId, 'field-error': errors.programId }">
              <div class="dropdown-header"
                @click.stop="!formData.studentId ? setError('studentId', 'Choose a student first.') : toggleDropdown('program', $event)">
                <template v-if="selectedProgram">
                  <div class="selected-item">
                    <img :src="getProgramProfileURL(selectedProgram.profileURL, selectedProgram.category)"
                      class="avatar-mini-sm" />
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
                  <input type="text" v-model="programSearchQuery" placeholder="Search program title..." @click.stop
                    autofocus />
                </div>
                <ul class="dropdown-list scrollable">
                  <li v-for="c in filteredPrograms" :key="c.id" class="dropdown-item"
                    :class="{ active: formData.programId === c.id }" @click="handleProgramChange(c.id)">
                    <div class="item-main">
                      <img :src="getProgramProfileURL(c.profileURL, c.category)" class="avatar-mini-sm" />
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

          <!-- Session Selection -->
          <div class="form-group custom-dropdown-container">
            <label>Select Session</label>
            <div class="custom-dropdown"
              :class="{ open: isSessionDropdownOpen, 'step-locked': !formData.programId || sessions.length === 0 || (isAlreadyEnrolled && !isEditMode), 'field-error': errors.sessionId }">
              <div class="dropdown-header"
                @click.stop="!formData.programId ? setError('programId', 'Choose a program first.') : ((isAlreadyEnrolled && !isEditMode) ? setError('programId', 'Already enrolled in this program.') : (sessions.length === 0 ? setError('sessionId', 'This program has no available sessions.') : toggleDropdown('session', $event)))">
                <template v-if="selectedSession">
                  <div class="selected-session">
                    <div class="session-display">
                      <div class="session-day"><strong>{{ selectedSession.schedule?.day }}</strong></div>
                      <div class="session-time">{{ selectedSession.schedule?.timeslot }}</div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="placeholder">{{ !formData.programId ? 'Select program first' : (sessions.length === 0 ?
                    'No sessions' : 'Choose a time') }}</span>
                </template>
                <span class="chevron" :class="{ up: isSessionDropdownOpen }"></span>
              </div>
            </div>
            <Teleport to="body">
              <div class="dropdown-menu" v-if="isSessionDropdownOpen" :style="dropdownStyles">
                <ul class="dropdown-list">
                  <li v-for="s in sessions" :key="s.id" class="dropdown-item session-item" :class="{
                    active: formData.sessionId === s.id,
                    disabled: (s.numStudent) >= (s.capacity)
                  }" @click="(s.numStudent) < (s.capacity) && selectSession(s.id)">
                    <div class="session-rows">
                      <div class="session-row-1">
                        <div class="session-display">
                          <div class="session-day"><strong>{{ s.schedule?.day }}</strong></div>
                          <div class="session-time">{{ s.schedule?.timeslot || 'TBD' }}</div>
                        </div>
                        <span v-if="(s.numStudent) >= (s.capacity)" class="full-badge">FULL</span>
                      </div>
                      <div class="session-row-2">
                        <div class="capacity-bar-mini">
                          <div class="capacity-progress"
                            :style="{ width: Math.min(100, ((s.numStudent) / (s.capacity)) * 100) + '%' }">
                          </div>
                        </div>
                        <span class="capacity-text">{{ s.numStudent }} / {{ s.capacity }} enrolled</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </Teleport>
            <div v-if="errors.sessionId" class="field-error-msg">{{ errors.sessionId }}</div>
          </div>
        </div>

        <!-- Program Brief -->
        <div v-if="selectedProgram && selectedSession" class="form-group full-width" style="margin-top: 16px;">
          <label>Program Period</label>
          <div class="period-info-box">
            <StatusBadge :status="selectedProgram.termName" type="blue" />
            <span class="date">{{ selectedProgram.startDate }}</span>
            <span class="sep">to</span>
            <span class="date">{{ selectedProgram.endDate }}</span>
          </div>
        </div>

        <div v-if="isAlreadyEnrolled && !isEditMode" class="alert-box warning">
          ⚠️ This student is already enrolled in this program.
        </div>

        <!-- Session Summary & Prorating -->
        <div v-if="sessionInfo && (!isAlreadyEnrolled || isEditMode)" class="form-group full-width" style="margin-top: 16px;">
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
              <StatusBadge :status="currentEnrollment?.status || 'Unpaid'" />
            </div>

            <div v-if="sessionInfo.passed > 0 && !currentEnrollment" class="prorate-modern">
              <label class="prorate-toggle">
                <div class="toggle-text">
                  <strong>Partial Enrollment</strong>
                  <p>Only pay for the remaining {{ sessionInfo.remaining }} sessions</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" v-model="formData.isProrated" />
                  <span class="slider"></span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Financial Section -->
        <div v-if="sessionInfo && (!isAlreadyEnrolled || isEditMode)" class="form-group full-width" style="margin-top: 16px;">
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
                    placeholder="Sponsor Name" class="mini-input" />
                </div>

                <div class="custom-override">
                  <label class="checkbox-label danger">
                    <input type="checkbox" v-model="formData.isCustomPrice" />
                    Manual Price (Special Case)
                  </label>
                  <input v-if="formData.isCustomPrice" type="number" v-model.number="formData.customPrice"
                    placeholder="Final Price" class="mini-input" @focus="clearErrors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="!isAlreadyEnrolled || isEditMode" class="form-group full-width" style="margin-top: 16px;">
          <label>Enrollment Remarks / Special Case</label>
          <div class="preset-chips chips-div">
            <button v-for="preset in remarkPresets" :key="preset" type="button" class="preset-chip"
              :class="{ active: isRemarkPresetActive(preset) }" @click="toggleRemarkPreset(preset)">
              {{ preset }}
            </button>
          </div>
          <textarea v-model="formData.remark" placeholder="Enter special notes or conditions for this enrollment..."
            rows="2" @focus="clearErrors"></textarea>
          <div v-if="isRemarkPresetActive('Special Occasion Discount')" class="alert-box success"
            style="margin-top: 10px; margin-bottom: 0; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">🎉</span>
            <span><strong>Special Occasion Discount:</strong> Please ensure the discount amount is entered in the
              Payment
              section below.</span>
          </div>
        </div>

        <div v-if="formData.programId && formData.sessionId" class="price-preview">
          <div class="price-info">
            <div class="price-header-row">
              <span class="price-label">Final Amount</span>
              <StatusBadge v-if="!isFullEnrollment" status="Partial Enrollment" type="blue" />
              <StatusBadge v-else status="Full Enrollment" type="green" />
            </div>
            <div class="price-notes">
              <div v-if="sessionInfo && sessionInfo.passed > 0 && formData.isProrated" class="price-note">
                <span class="original-price">${{ formatPrice(selectedProgramPrice) }}</span>
                <span class="badge discount">-${{ formatPrice(prorateSavings) }} (Prorated)</span>
              </div>
              <div v-if="formData.discountAmount > 0" class="price-note">
                <span class="badge discount">-${{ formatPrice(formData.discountAmount) }} (Discount)</span>
              </div>
            </div>
          </div>
          <strong class="price-value">${{ formatPrice(finalAmount) }}</strong>
        </div>

        <!-- Hidden submit for Enter key functionality -->
        <button type="submit" style="display: none;"></button>
      </form>
    </div>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton variant="primary" type="button" @click.stop="validateAndSubmit" :loading="loading"
        :class="{ 'button-disabled': !formData.parentId || !formData.studentId || !formData.programId || !formData.sessionId || (isAlreadyEnrolled && !isEditMode) }">
        {{ isEditMode ? 'Update Enrollment' : 'Confirm Enrollment' }}
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.form-group select,
.form-group input,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s;
}

.form-group textarea {
  resize: none;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  border-color: #00aeef;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
}

.period-info-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #334155;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.period-info-box .sep {
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.75rem;
}


.summary-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-text {
  font-size: 0.9rem;
  color: #334155;
}

.passed-tag {
  display: none;
}

.prorate-action {
  margin-left: auto;
  padding-left: 16px;
  border-left: 1px solid #cbd5e1;
}

.checkbox-label.highlight {
  color: #00aeef;
}

.session-summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: 16px;
}

.summary-top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  width: 44px;
  height: 44px;
  background: #f0f9ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  border: 1px solid #e0f2fe;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.summary-value {
  font-size: 1.1rem;
  color: #1e293b;
}

.summary-value strong {
  font-weight: 700;
  font-size: 1.25rem;
  color: #00aeef;
}

.summary-value small {
  color: #64748b;
  margin-left: 4px;
}

.session-price-hint {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-left: 12px;
  font-style: italic;
}

.passed-badge-small {
  background: #fee2e2;
  color: #ef4444;
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  margin-left: 12px;
  vertical-align: middle;
}

.passed-indicator {
  display: none;
}

/* Prorate Toggle Modern */
.prorate-modern {
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
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
  font-size: 0.95rem;
  color: #1e293b;
  margin-bottom: 2px;
}

.toggle-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-left: 16px;
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
  background-color: #cbd5e1;
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
  background-color: #00aeef;
}

input:checked+.slider:before {
  transform: translateX(24px);
}

.price-notes {
  display: flex;
  gap: 12px;
}

.financial-section {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  gap: 24px;
}

.financial-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.financial-col.separator {
  padding-left: 24px;
  border-left: 1px solid #e2e8f0;
}

.standard-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
}

.financial-grid {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  margin-bottom: 4px;
}

.checkbox-label.danger {
  color: #ef4444;
}

.sponsor-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-input {
  padding: 6px 10px !important;
  font-size: 0.85rem !important;
}

.custom-override {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.price-preview {
  margin-top: 24px;
  padding: 20px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-label {
  color: #0369a1;
  font-weight: 700;
  font-size: 0.95rem;
}

.price-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.partial-status-tag {
  background: #00aeef;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 4px rgba(0, 174, 239, 0.2);
}

.price-note {
  display: flex;
  align-items: center;
  gap: 8px;
}

.original-price {
  text-decoration: line-through;
  color: #64748b;
  font-size: 0.875rem;
}

.badge {
  background: #fff;
  color: #ef4444;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid #fee2e2;
}

.badge.discount {
  color: #10b981;
  border-color: #d1fae5;
  background: #f0fdf4;
}

.price-value {
  font-size: 1.75rem;
  color: #0c4a6e;
  font-weight: 800;
}

.alert-box {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.alert-box.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fee2e2;
}

.alert-box.warning {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fef3c7;
  margin-bottom: 16px;
}

.alert-box.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #d1fae5;
}

.custom-dropdown-container {
  position: relative;
}

.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
}

.custom-dropdown {
  border-radius: 8px;
}

.custom-dropdown.open .dropdown-header {
  border-color: #00aeef;
}

.custom-dropdown.step-locked .dropdown-header {
  cursor: not-allowed !important;
  opacity: 0.7;
  pointer-events: auto !important;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.placeholder {
  color: #94a3b8;
  font-size: 0.95rem;
}

.chevron {
  width: 10px;
  height: 10px;
  border-right: 2px solid #94a3b8;
  border-bottom: 2px solid #94a3b8;
  transform: rotate(45deg);
  transition: transform 0.2s;
  margin-right: 4px;
}

.chevron.up {
  transform: rotate(-135deg);
}

.dropdown-menu {
  position: absolute;
  width: max-content;
  max-width: 90vw;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 3000;
  overflow: hidden;
}

.dropdown-search {
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.dropdown-search input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.dropdown-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-list.scrollable {
  max-height: 240px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.dropdown-item.active {
  background: #f0f9ff;
  color: #00aeef;
}

.item-name {
  font-size: 0.9rem;
  white-space: nowrap;
}

.item-content-between {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.selected-session {
  display: flex;
  flex-direction: column;
}

.session-display {
  display: flex;
  gap: 10px;
}

.session-day {
  font-size: 0.95rem;
  color: #1e293b;
  line-height: 1.2;
}

.session-time {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: normal;
}

.session-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.session-row-1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.session-row-2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #64748b;
}

.full-badge {
  background: #fee2e2;
  color: #ef4444;
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 800;
}

.capacity-bar-mini {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  max-width: 80px;
}

.capacity-progress {
  height: 100%;
  background: #10b981;
  border-radius: 2px;
}

.dropdown-item.session-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f8fafc;
}

.dropdown-item.session-item.active .capacity-progress {
  background: #00aeef;
}

.no-results {
  padding: 16px;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.875rem;
  cursor: default;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from .modal-content {
  transform: scale(0.9) translateY(20px);
}

.field-error {
  border-color: #ef4444 !important;
  background: #fef2f2 !important;
}

.field-error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 6px;
  animation: slideIn 0.3s ease;
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

.button-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  filter: grayscale(0.5);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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

.preset-chips {
  margin: 0;
}

.form-group {
  margin: 0;
}

.chips-div {
  background-color: #f8fafc;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
</style>
