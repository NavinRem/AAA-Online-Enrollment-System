<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'
import { parentPortalService } from '@/services/parentAuthService'
import ChildSwitcher from '@/components/ChildSwitcher.vue'
import OnlinePaymentModal from '@/components/OnlinePaymentModal.vue'

const studentStore = useStudentStore()

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

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [classesRes, enrollRes] = await Promise.all([
      parentPortalService.getAvailableClasses(),
      parentPortalService.getMyEnrollments(),
    ])
    availableClasses.value = Array.isArray(classesRes) ? classesRes : []
    myEnrollments.value = Array.isArray(enrollRes) ? enrollRes : []
  } catch (err) {
    console.error('Failed loading self-enrollment data:', err)
    errorMessage.value = 'Could not fetch available classes from server.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  studentStore.fetchChildren()
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

// Enrolled Program IDs or Names (Rule 1: Duplicate Prevention)
const enrolledProgramIdentifiers = computed(() => {
  const set = new Set()
  studentActiveEnrollments.value.forEach((e) => {
    if (e.programId) set.add(e.programId)
    if (e.program?.id) set.add(e.program.id)
    if (e.programName) set.add(e.programName.trim().toLowerCase())
    if (e.program?.name) set.add(e.program.name.trim().toLowerCase())
  })
  return set
})

// Enrolled Schedules (Rule 2: Cross-Program Schedule Conflict Prevention)
const enrolledSchedules = computed(() => {
  const set = new Set()
  studentActiveEnrollments.value.forEach((e) => {
    const sched = e.class?.schedule || e.schedule || ''
    if (sched) {
      set.add(sched.trim().toLowerCase())
    }
  })
  return set
})

// Filter available offerings enforcing duplicate and schedule conflict checks
const processedClasses = computed(() => {
  if (!studentStore.selectedStudent) return []
  return availableClasses.value.map((item) => {
    let isDuplicate = false
    let isConflict = false
    let conflictReason = ''

    const pId = item.programId || item.program?.id
    const pName = (item.programName || item.program?.name || item.name || '').trim().toLowerCase()
    const itemSched = (item.schedule || '').trim().toLowerCase()

    // Check Duplicate
    if ((pId && enrolledProgramIdentifiers.value.has(pId)) || (pName && enrolledProgramIdentifiers.value.has(pName))) {
      isDuplicate = true
      conflictReason = 'Already enrolled in this program'
    }

    // Check Schedule Conflict (if not already duplicate)
    if (!isDuplicate && itemSched && enrolledSchedules.value.has(itemSched)) {
      isConflict = true
      conflictReason = `Schedule clash across branches (${item.schedule})`
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
  }).filter((c) => c.matchesBranch)
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
      branchId: selectedOffering.value.branchId || '',
      amount: selectedOffering.value.amount || selectedOffering.value.fee || 150,
    }

    const res = await parentPortalService.selfEnroll(payload)
    const enrollmentDoc = res.enrollment || res || {
      id: res.id || 'enroll_' + Date.now(),
      studentId: payload.studentId,
      classId: payload.classId,
      amount: payload.amount,
      status: 'unpaid',
      paymentStatus: 'unpaid',
      programName: selectedOffering.value.programName || selectedOffering.value.program?.name || 'Enrolled Class',
      studentName: studentStore.selectedStudent.name,
      schedule: selectedOffering.value.schedule,
      branchId: selectedOffering.value.branchId,
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
  <div class="space-y-6">
    <!-- Step 1: Child Switcher Header -->
    <ChildSwitcher />

    <div class="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white">Online Self-Enrollment</h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Select class schedule for <strong class="text-sky-300">{{ studentStore.selectedStudent?.name }}</strong> with automatic conflict prevention
        </p>
      </div>

      <!-- Branch Filter Dropdown -->
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-slate-400">Branch:</label>
        <select
          v-model="selectedBranch"
          class="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option v-for="b in branchesList" :key="b" :value="b">{{ b === 'ALL' ? 'All Branches / Studios' : b }}</option>
        </select>
      </div>
    </div>

    <!-- Alert status -->
    <div v-if="errorMessage" class="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs font-medium text-red-400 flex items-center gap-2">
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="successMessage" class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-400 flex items-center gap-2">
      <span>{{ successMessage }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">
      Loading available programs and verifying schedule conflicts...
    </div>

    <!-- Offerings Grid -->
    <div v-else class="space-y-6">
      <!-- Section 1: Eligible Offerings -->
      <div class="space-y-3">
        <h3 class="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Available Classes for Enrollment</span>
          <span class="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-full text-xs font-black">{{ eligibleClasses.length }}</span>
        </h3>

        <div v-if="eligibleClasses.length === 0" class="p-8 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 text-center">
          <p class="text-sm font-bold text-slate-300">No eligible new offerings available</p>
          <p class="text-xs text-slate-500 mt-1">Your child is either enrolled across current terms or schedules clash with available times.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="item in eligibleClasses"
            :key="item.id"
            @click="selectClassForEnrollment(item)"
            :class="[
              'p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative transform active:scale-[0.99]',
              selectedOffering?.id === item.id
                ? 'bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 border-sky-400 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-md'
            ]"
          >
            <!-- Selected badge -->
            <div v-if="selectedOffering?.id === item.id" class="absolute -top-3 right-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow">
              Selected
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {{ item.branchId || 'Studio' }}
                </span>
                <span class="text-sm font-black text-emerald-400">${{ item.amount || item.fee || 150 }}</span>
              </div>
              <h4 class="text-base font-extrabold text-white leading-tight">
                {{ item.programName || item.program?.name || item.name || 'Dance & Ballet Class' }}
              </h4>
              <p class="text-xs text-slate-300 mt-2 flex items-center gap-1.5 font-medium">
                <svg class="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ item.schedule || 'Sat-Sun 10:00 AM' }}</span>
              </p>
              <p v-if="item.instructor || item.teacherName" class="text-xs text-slate-400 mt-1">
                Teacher: <strong class="text-slate-300">{{ item.instructor || item.teacherName }}</strong>
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span class="text-slate-400">{{ item.seatsAvailable ? item.seatsAvailable + ' seats left' : 'Seats Open' }}</span>
              <span :class="selectedOffering?.id === item.id ? 'text-sky-300 font-black' : 'text-slate-400 font-bold'">
                {{ selectedOffering?.id === item.id ? 'Ready to Enroll ✓' : 'Tap to Select →' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Conflicted & Duplicate Offerings (Filtered Out per enrollment_rules.md) -->
      <div v-if="conflictedClasses.length > 0" class="space-y-3 pt-4 border-t border-slate-800">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span>Ineligible / Conflicting Classes (Filtered by Rule Engine)</span>
          <span class="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px]">{{ conflictedClasses.length }}</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-65">
          <div
            v-for="item in conflictedClasses"
            :key="item.id"
            class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between gap-3 cursor-not-allowed"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-slate-300">{{ item.programName || item.program?.name || item.name }}</span>
                <span
                  :class="[
                    'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                    item.isDuplicate ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ item.isDuplicate ? 'Duplicate Program' : 'Schedule Conflict' }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ item.schedule }} • {{ item.conflictReason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3: Bottom Fixed / Floating Confirmation Bar -->
    <div v-if="selectedOffering" class="sticky bottom-16 sm:bottom-6 z-40 bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-sky-500/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
      <div>
        <span class="text-[10px] font-black uppercase tracking-widest text-sky-400 block">Step 3: Confirm Enrollment</span>
        <p class="text-sm font-extrabold text-white">
          Enrolling <strong class="text-sky-300">{{ studentStore.selectedStudent?.name }}</strong> into {{ selectedOffering.programName || selectedOffering.program?.name || selectedOffering.name }}
        </p>
        <p class="text-xs text-slate-400 mt-0.5">{{ selectedOffering.schedule }} • Fee: <strong class="text-emerald-400">${{ selectedOffering.amount || selectedOffering.fee || 150 }}</strong></p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="selectedOffering = null"
          class="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleConfirmSelfEnroll"
          :disabled="enrolling"
          class="flex-1 sm:flex-none py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg v-if="enrolling" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ enrolling ? 'Processing Seat Reservation...' : 'Confirm & Self-Enroll Now →' }}</span>
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
