<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'
import { useAuth } from '@/composables/useAuth'
import { parentPortalService } from '@/services/parentAuthService'
import ChildSwitcher from '@/components/ChildSwitcher.vue'
import OnlinePaymentModal from '@/components/OnlinePaymentModal.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import {
  getProgramProfileURL,
  getStudentProfileURL,
  getParentProfileURL,
} from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'

const studentStore = useStudentStore()
const { currentUser } = useAuth()
const parentProfileData = ref(null)

const availableClasses = ref([])
const myEnrollments = ref([])
const loading = ref(false)
const enrolling = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const selectedBranch = ref('ALL')
const selectedOffering = ref(null)

const showPaymentModal = ref(false)
const newlyCreatedEnrollment = ref(null)

const parentAvatarUrl = computed(() =>
  getParentProfileURL(parentProfileData.value?.profileURL || currentUser.value?.photoURL),
)
const studentAvatarUrl = computed(() =>
  getStudentProfileURL(studentStore.selectedStudent?.profileURL),
)

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [classesRes, enrollRes] = await Promise.all([
      parentPortalService.getAvailableClasses(),
      parentPortalService.getMyEnrollments(),
    ])
    let list = []
    if (Array.isArray(classesRes)) {
      list = classesRes
    } else if (classesRes && Array.isArray(classesRes.offerings)) {
      list = classesRes.offerings
    } else if (classesRes && Array.isArray(classesRes.classes)) {
      list = classesRes.classes
    }
    if (classesRes && classesRes.branches) {
      studentStore.branches = classesRes.branches
    }
    if (classesRes && classesRes.terms) {
      studentStore.terms = classesRes.terms
    }
    availableClasses.value = list
    myEnrollments.value = Array.isArray(enrollRes) ? enrollRes : []
  } catch (err) {
    console.error('Failed loading self-enrollment data:', err)
    errorMessage.value = 'Could not fetch available classes from server.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loadData()
  studentStore.fetchChildren()
  try {
    const p = await parentPortalService.getMyProfile()
    if (p) parentProfileData.value = p
  } catch (err) {
    console.warn('Could not fetch parent profile details in self-enroll:', err)
  }
})

const branchesList = computed(() => {
  const set = new Set()
  availableClasses.value.forEach((c) => {
    if (c.branchId) set.add(c.branchId)
    if (c.branch?.name) set.add(c.branch.name)
  })
  return ['ALL', ...Array.from(set)]
})

// Active enrollments for selected student
const studentActiveEnrollments = computed(() => {
  if (!studentStore.selectedStudent) return []
  return myEnrollments.value.filter((e) => {
    if (e.isDeleted) return false
    const sId = e.studentId || e.student?.id
    if (sId !== studentStore.selectedStudent.id) return false
    const st = (e.paymentStatus || e.status || '').toLowerCase()
    return ['paid', 'unpaid', 'active', 'confirmed', 'pending', 'verifying', 'success'].includes(st)
  })
})

// Filter available offerings enforcing duplicate and schedule conflict checks
const processedClasses = computed(() => {
  if (!studentStore.selectedStudent) return []
  return availableClasses.value
    .map((item) => {
      let isDuplicate
      let isConflict = false
      let conflictReason = ''

      const pId = item.programId || item.program?.id
      const pName = (item.programName || item.program?.name || item.name || '').trim().toLowerCase()
      const itemSched = (item.schedule || '').trim().toLowerCase()

      // Check Duplicate ONLY if student already enrolled in exact same class ID, or exact same program IN THE SAME TERM
      isDuplicate = studentActiveEnrollments.value.some((e) => {
        const eProgramId = e.programId || e.program?.id
        const eProgramName = (e.programName || e.program?.name || '').trim().toLowerCase()
        const eClassId = e.classId
        const eTermId = e.termId
        if (item.classId && eClassId && item.classId === eClassId && item.termId === eTermId)
          return true
        if (item.termId && eTermId && item.termId === eTermId) {
          if (
            (pId && eProgramId && pId === eProgramId) ||
            (pName && eProgramName && pName === eProgramName)
          )
            return true
        }
        return false
      })

      if (isDuplicate) {
        conflictReason = 'Already enrolled in this program for this term'
      }

      // Check Schedule Conflict (if not duplicate) - clash occurs when enrolled in same day & time concurrently inside the same term
      if (!isDuplicate && itemSched) {
        isConflict = studentActiveEnrollments.value.some((e) => {
          const eSched = (e.class?.schedule || e.schedule || '').trim().toLowerCase()
          if (!eSched || eSched !== itemSched) return false
          if (item.termId && e.termId && item.termId !== e.termId) return false
          return true
        })
        if (isConflict) {
          conflictReason = `Schedule clash across branches (${item.schedule})`
        }
      }

      // Branch filter check
      const matchesBranch =
        selectedBranch.value === 'ALL' ||
        item.branchId === selectedBranch.value ||
        item.branch?.name === selectedBranch.value

      return {
        ...item,
        isDuplicate,
        isConflict,
        conflictReason,
        isEligible: !isDuplicate && !isConflict && matchesBranch,
        matchesBranch,
      }
    })
    .filter((c) => c.matchesBranch)
})

const eligibleClasses = computed(() => processedClasses.value.filter((c) => c.isEligible))
const conflictedClasses = computed(() => processedClasses.value.filter((c) => !c.isEligible))

const selectClassForEnrollment = (cls) => {
  if (!cls.isEligible) return
  selectedOffering.value = cls
  errorMessage.value = ''
}

const handleConfirmSelfEnroll = async () => {
  if (!studentStore.selectedStudent || !selectedOffering.value) return
  enrolling.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      studentId: studentStore.selectedStudent.id,
      classId: selectedOffering.value.id,
      programId: selectedOffering.value.programId || selectedOffering.value.program?.id || '',
      branchId: selectedOffering.value.branchId || 'AEON',
      amount: selectedOffering.value.amount || selectedOffering.value.fee || 150,
      termId: selectedOffering.value.termId || '',
      termOfferingId: selectedOffering.value.termOfferingId || '',
      scheduleId: selectedOffering.value.scheduleId || '',
      programName:
        selectedOffering.value.programName ||
        selectedOffering.value.program?.name ||
        selectedOffering.value.name ||
        '',
      schedule: selectedOffering.value.schedule || '',
    }

    const res = await parentPortalService.selfEnroll(payload)
    const enrollmentDoc = res.enrollment ||
      res || {
        id: res.id || 'enroll_' + Date.now(),
        studentId: payload.studentId,
        classId: payload.classId,
        amount: payload.amount,
        status: 'unpaid',
        paymentStatus: 'unpaid',
        programName:
          selectedOffering.value.programName ||
          selectedOffering.value.program?.name ||
          'Enrolled Class',
        studentName: studentStore.selectedStudent.name,
        schedule: selectedOffering.value.schedule,
        branchId: selectedOffering.value.branchId,
        branchObj: selectedOffering.value.branchObj || {
          abbr: selectedOffering.value.branchId,
          color: selectedOffering.value.branchColor || 'blue',
        },
        branchColor: selectedOffering.value.branchColor || 'blue',
        profileURL: selectedOffering.value.profileURL,
        student: studentStore.selectedStudent,
        parent: parentProfileData.value || currentUser.value || {},
      }

    // Refresh data
    await loadData()
    newlyCreatedEnrollment.value = enrollmentDoc
    selectedOffering.value = null
    successMessage.value = 'Enrollment successful! Please settle the fee online below.'
    showPaymentModal.value = true
  } catch (err) {
    console.error('Self enroll failed:', err)
    errorMessage.value = err.message || 'Could not complete self-enrollment.'
  } finally {
    enrolling.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-36">
    <!-- Step 1: Child Switcher Header -->
    <ChildSwitcher />

    <div class="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-[#0f172a]">Online Self-Enrollment</h1>
          <p class="text-xs text-[#64748b] mt-0.5">
            Select class schedule for
            <strong class="text-[#0ea5e9]">{{ studentStore.selectedStudent?.name }}</strong> with
            automatic conflict prevention
          </p>
        </div>

        <!-- Single Clean Admin Portal Style Dropdown -->
        <div class="flex items-center gap-2.5">
          <label class="text-xs font-bold text-[#64748b] flex items-center gap-1.5 flex-shrink-0">
            <svg
              class="w-4 h-4 text-[#0ea5e9]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>Branch:</span>
          </label>
          <select
            v-model="selectedBranch"
            class="bg-white hover:bg-[#f8fafc] border-2 border-[#e2e8f0] hover:border-[#0ea5e9]/50 text-[#0f172a] rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-[#0ea5e9] focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all shadow-2xs cursor-pointer min-w-[160px]"
          >
            <option v-for="b in branchesList" :key="b" :value="b">
              {{ b === 'ALL' ? 'All Branches / Studios' : b }}
            </option>
          </select>
        </div>
      </div>

      <!-- Parent and Student Avatars Profile Bar -->
      <div
        v-if="studentStore.selectedStudent"
        class="flex items-center justify-between flex-wrap gap-3 p-3.5 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <div
              class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#0ea5e9]/20 bg-white shadow-2xs"
            >
              <img :src="parentAvatarUrl" alt="Parent" class="w-full h-full object-cover" />
            </div>
            <div class="text-xs">
              <span class="text-[10px] font-bold text-[#64748b] block leading-none"
                >Parent / Guardian</span
              >
              <span class="font-extrabold text-[#0f172a]">{{
                parentProfileData?.name || currentUser?.displayName || 'Parent'
              }}</span>
            </div>
          </div>
          <span class="text-[#cbd5e1] font-bold">→</span>
          <div class="flex items-center gap-2">
            <div
              class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#10b981]/20 bg-white shadow-2xs"
            >
              <img :src="studentAvatarUrl" alt="Student" class="w-full h-full object-cover" />
            </div>
            <div class="text-xs">
              <span class="text-[10px] font-bold text-[#64748b] block leading-none"
                >Enrolling Student</span
              >
              <span class="font-extrabold text-[#0f172a]">{{
                studentStore.selectedStudent?.name
              }}</span>
            </div>
          </div>
        </div>
        <span class="text-xs font-bold text-[#0284c7] bg-[#e0f2fe] px-3 py-1 rounded-full">
          Identity & Relationship Verified ✓
        </span>
      </div>
    </div>

    <!-- Alert status -->
    <div
      v-if="errorMessage"
      class="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2 shadow-sm"
    >
      <svg
        class="w-4 h-4 text-red-600 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <div
      v-if="successMessage"
      class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm"
    >
      <svg
        class="w-4 h-4 text-emerald-600 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Step 2: Available Classes Grid -->
    <div
      v-if="!studentStore.selectedStudent"
      class="p-8 bg-white border border-[#e2e8f0] rounded-3xl text-center shadow-sm"
    >
      <div
        class="w-12 h-12 bg-[#f0f9ff] text-[#0284c7] rounded-full flex items-center justify-center mx-auto mb-3 font-extrabold text-xl"
      >
        👧
      </div>
      <h3 class="text-base font-black text-[#0f172a]">Please select a student above</h3>
      <p class="text-xs text-[#64748b] mt-1">
        We need to check eligibility and existing schedule conflicts first.
      </p>
    </div>

    <div
      v-else-if="loading"
      class="py-16 text-center bg-white rounded-3xl border border-[#e2e8f0] shadow-sm"
    >
      <svg class="animate-spin h-8 w-8 text-[#0ea5e9] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p class="text-sm font-extrabold text-[#0f172a]">
        Loading available courses and checking schedule conflicts...
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Section Header -->
      <div class="flex items-center justify-between px-1">
        <div>
          <h2 class="text-base font-black text-[#0f172a]">Available Classes for Enrollment</h2>
          <p class="text-xs text-[#64748b]">
            Showing eligible open classes matching {{ studentStore.selectedStudent.name }}'s
            requirements
          </p>
        </div>
        <span
          class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold leading-none whitespace-nowrap bg-[#d1fae5] text-[#064e3b]"
        >
          {{ eligibleClasses.length }} Available
        </span>
      </div>

      <div
        v-if="eligibleClasses.length === 0"
        class="p-8 bg-white border border-[#e2e8f0] rounded-3xl text-center shadow-sm"
      >
        <p class="text-sm font-extrabold text-[#0f172a]">
          No classes available for self-enrollment right now
        </p>
        <p class="text-xs text-[#64748b] mt-1">
          This might be due to existing enrollments in all active terms or schedule clashes.
        </p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div
          v-for="item in eligibleClasses"
          :key="item.id"
          @click="selectClassForEnrollment(item)"
          :class="[
            'p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1',
            selectedOffering?.id === item.id
              ? 'bg-gradient-to-b from-[#f0f9ff]/90 to-white border-[#0ea5e9] ring-4 ring-[#0ea5e9]/20 shadow-md'
              : 'bg-white border-[#e2e8f0] hover:border-[#0ea5e9]/60 hover:bg-[#f8fafc]/50',
          ]"
        >
          <!-- Top Gradient Accent Bar -->
          <div
            :class="[
              'absolute top-0 left-0 right-0 h-1 transition-opacity duration-300',
              selectedOffering?.id === item.id
                ? 'bg-gradient-to-r from-[#0ea5e9] via-[#38bdf8] to-[#0284c7] opacity-100'
                : 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] opacity-0 group-hover:opacity-100',
            ]"
          ></div>

          <div class="space-y-3.5">
            <!-- Branch Badge showing exact branch color, selected mark inline, & Price Tag using AppBadge style -->
            <div class="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <AppBadge :branch="item.branchObj || item.branchId || 'AEON'" />
                <!-- Inline checkmark without covering floating overlay -->
                <span
                  v-if="selectedOffering?.id === item.id"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#0ea5e9] text-white shadow-2xs"
                >
                  <svg
                    class="w-3.5 h-3.5 stroke-[3]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Selected ✓
                </span>
              </div>
              <AppBadge
                :status="`$${formatPrice(item.amount || item.fee || 150)} / term`"
                type="green"
              />
            </div>

            <!-- Program Title with Profile Image -->
            <div class="flex items-start gap-3.5 pt-1">
              <div
                class="w-12 h-12 rounded-2xl overflow-hidden bg-[#f0f9ff] ring-2 ring-[#e2e8f0] shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
              >
                <img
                  v-if="getProgramProfileURL(item.profileURL, item.programName)"
                  :src="getProgramProfileURL(item.profileURL, item.programName)"
                  :alt="item.programName"
                  class="w-full h-full object-cover"
                  @error="$event.target.style.display = 'none'"
                />
                <span v-else class="text-base font-black text-[#0284c7]">
                  {{
                    (item.programName || item.program?.name || item.name || 'C')
                      .charAt(0)
                      .toUpperCase()
                  }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <h4
                  class="text-base font-black text-[#0f172a] leading-snug group-hover:text-[#0284c7] transition-colors truncate"
                >
                  {{ item.programName || item.program?.name || item.name || 'Enrolled Class' }}
                </h4>
                <p class="text-xs text-[#64748b] font-bold mt-0.5 flex items-center gap-1 truncate">
                  <span>👨‍🏫 Teacher:</span>
                  <strong class="text-[#334155] truncate">{{
                    item.instructor || item.teacherName || 'Faculty'
                  }}</strong>
                </p>
              </div>
            </div>

            <!-- Schedule & Capacity Box -->
            <div
              class="bg-[#f8fafc] group-hover:bg-white border border-[#e2e8f0] rounded-2xl p-3.5 space-y-2 transition-colors shadow-2xs"
            >
              <div class="flex items-center gap-2 text-xs font-extrabold text-[#0f172a]">
                <svg
                  class="w-4 h-4 text-[#0ea5e9] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{{ item.schedule || 'Flexible Schedule' }}</span>
              </div>
              <div
                class="flex items-center justify-between text-[11px] font-bold text-[#64748b] pt-1 border-t border-[#e2e8f0]"
              >
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{{
                    item.seatsAvailable !== null
                      ? item.seatsAvailable + ' seats open'
                      : 'Open Registration'
                  }}</span>
                </span>
                <span
                  class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-none whitespace-nowrap bg-[#e0f2fe] text-[#0284c7]"
                >
                  {{ item.termName || 'Upcoming Term' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Footer & Action Button -->
          <div class="mt-4 pt-3.5 border-t border-[#e2e8f0] flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#94a3b8]">
              {{
                selectedOffering?.id === item.id ? 'Ready for confirmation' : 'Click card or button'
              }}
            </span>
            <button
              type="button"
              :class="[
                'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer',
                selectedOffering?.id === item.id
                  ? 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white shadow-md ring-2 ring-[#0ea5e9]/30'
                  : 'bg-[#f0f9ff] group-hover:bg-[#0ea5e9] text-[#0284c7] group-hover:text-white',
              ]"
            >
              <span>{{ selectedOffering?.id === item.id ? 'Selected ✓' : 'Select Class' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Schedule Conflicts / Unavailable Section -->
      <div v-if="conflictedClasses.length > 0" class="pt-6 border-t border-[#e2e8f0] space-y-4">
        <div class="flex items-center justify-between px-1">
          <div>
            <h3 class="text-sm font-black text-[#64748b] flex items-center gap-1.5">
              <span>⚠️ Unavailable or Schedule Clashes</span>
            </h3>
            <p class="text-[11px] text-[#94a3b8]">
              Classes filtered out to prevent time collisions or double enrollment
            </p>
          </div>
          <span
            class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold leading-none whitespace-nowrap bg-[#fef3c7] text-[#78350f]"
          >
            {{ conflictedClasses.length }} Restricted
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 opacity-75">
          <div
            v-for="item in conflictedClasses"
            :key="item.id"
            class="p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-black text-[#475569]">{{
                  item.programName || item.program?.name || item.name
                }}</span>
                <span
                  :class="[
                    'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-none whitespace-nowrap',
                    item.isDuplicate
                      ? 'bg-[#f3e8ff] text-[#581c87]'
                      : 'bg-[#fef3c7] text-[#78350f]',
                  ]"
                >
                  {{ item.isDuplicate ? 'Duplicate Program' : 'Schedule Conflict' }}
                </span>
              </div>
              <p class="text-[11px] text-[#64748b] font-bold mt-1">
                {{ item.schedule }} • {{ item.conflictReason }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3: Fixed Bottom Confirmation Modal/Popup exactly centered inside Mobile Viewport -->
    <div
      v-if="selectedOffering"
      class="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[calc(32rem-2rem)] bg-white/95 backdrop-blur-xl p-5 rounded-3xl border-2 border-[#0ea5e9] shadow-2xl flex flex-col gap-4 ring-4 ring-[#0ea5e9]/10 animate-slide-up"
    >
      <div class="flex items-start gap-3.5">
        <div
          class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0 mt-0.5"
        >
          ✓
        </div>
        <div class="flex-1 min-w-0">
          <span class="text-[10px] font-black uppercase tracking-widest text-[#0284c7] block"
            >Step 3: Confirm Seat Reservation</span
          >
          <p class="text-sm font-extrabold text-[#0f172a] leading-tight mt-0.5 truncate">
            Enrolling
            <strong class="text-[#0ea5e9]">{{ studentStore.selectedStudent?.name }}</strong> into
            {{
              selectedOffering.programName ||
              selectedOffering.program?.name ||
              selectedOffering.name
            }}
          </p>
          <div
            class="text-xs text-[#64748b] font-bold mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"
          >
            <span class="text-[#334155]">{{ selectedOffering.schedule }}</span>
            <span class="text-[#94a3b8]">•</span>
            <span
              >Fee:
              <strong class="text-emerald-700 font-black"
                >${{ selectedOffering.amount || selectedOffering.fee || 150 }}</strong
              ></span
            >
          </div>
        </div>
      </div>

      <div
        class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-[#f1f5f9]"
      >
        <button
          type="button"
          @click="selectedOffering = null"
          class="py-3 px-4 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] text-xs font-bold text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0] transition-colors text-center cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleConfirmSelfEnroll"
          :disabled="enrolling"
          class="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg
            v-if="enrolling"
            class="animate-spin h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{{ enrolling ? 'Reserving Seat...' : 'Confirm & Self-Enroll Now →' }}</span>
        </button>
      </div>
    </div>

    <!-- Interactive Online Payment Modal -->
    <OnlinePaymentModal
      :show="showPaymentModal"
      :enrollment="newlyCreatedEnrollment"
      @close="showPaymentModal = false"
      @paid="loadData"
    />
  </div>
</template>
