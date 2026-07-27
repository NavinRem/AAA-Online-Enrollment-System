<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/studentStore'
import { parentPortalService } from '@/services/parentAuthService'
import ChildSwitcher from '@/components/ChildSwitcher.vue'
import OnlinePaymentModal from '@/components/OnlinePaymentModal.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import { getProgramProfileURL } from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'

const router = useRouter()
const studentStore = useStudentStore()

const enrollments = ref([])
const loadingEnrollments = ref(false)
const showPaymentModal = ref(false)
const activePaymentEnrollment = ref(null)

const studentStanding = ref(null)
const studentAttendanceRate = ref(null)

const loadEnrollments = async () => {
  loadingEnrollments.value = true
  try {
    const list = await parentPortalService.getMyEnrollments()
    enrollments.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('Failed loading enrollments:', err)
  } finally {
    loadingEnrollments.value = false
  }
}

const loadStudentSummary = async (studentId) => {
  if (!studentId) {
    studentStanding.value = null
    studentAttendanceRate.value = null
    return
  }
  try {
    const [perfRes, attRes] = await Promise.all([
      parentPortalService.getChildPerformance(studentId).catch(() => null),
      parentPortalService.getChildAttendance(studentId).catch(() => []),
    ])

    if (perfRes && (perfRes.overallGrade || (Array.isArray(perfRes) && perfRes[0]?.overallGrade))) {
      const data = Array.isArray(perfRes) ? perfRes[0] : perfRes
      studentStanding.value = data.overallGrade || null
    } else {
      studentStanding.value = null
    }

    if (Array.isArray(attRes) && attRes.length > 0) {
      const present = attRes.filter((r) => (r.status || '').toLowerCase() === 'present').length
      studentAttendanceRate.value = Math.round((present / attRes.length) * 100) + '%'
    } else {
      studentAttendanceRate.value = null
    }
  } catch (err) {
    console.error('Failed loading student summary stats:', err)
  }
}

watch(
  () => studentStore.selectedStudentId,
  (newId) => {
    if (newId) {
      loadStudentSummary(newId)
    }
  },
  { immediate: true },
)

onMounted(() => {
  loadEnrollments()
})

const currentStudentEnrollments = computed(() => {
  if (!studentStore.selectedStudent) return []
  return enrollments.value.filter((e) => {
    const sId = e.studentId || e.student?.id
    return sId === studentStore.selectedStudent.id && !e.isDeleted
  })
})

const unpaidEnrollments = computed(() => {
  return currentStudentEnrollments.value.filter((e) => {
    const st = (e.paymentStatus || e.status || '').toLowerCase()
    return st === 'unpaid' || st === 'pending'
  })
})

const activeClassesCount = computed(() => {
  return currentStudentEnrollments.value.filter((e) => {
    const st = (e.paymentStatus || e.status || '').toLowerCase()
    return st === 'paid' || st === 'active' || st === 'confirmed'
  }).length
})

const triggerPayment = (enrollment) => {
  activePaymentEnrollment.value = enrollment
  showPaymentModal.value = true
}

const handlePaymentSuccess = () => {
  loadEnrollments()
}
</script>

<template>
  <div class="space-y-5 pb-28">
    <!-- Top Child Switcher Tabs -->
    <ChildSwitcher />

    <div class="space-y-5">
      <!-- Unpaid Fees Action Banner (If Any) -->
      <div
        v-if="studentStore.selectedStudent && unpaidEnrollments.length > 0"
        class="p-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-sm relative overflow-hidden"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black flex-shrink-0 shadow-sm"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <span
                class="inline-block text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full mb-1"
              >
                Fee Payment Required
              </span>
              <h3 class="text-sm font-extrabold text-[#0f172a]">Unpaid Class Fees Due</h3>
              <p class="text-xs text-[#334155] mt-0.5">
                {{ studentStore.selectedStudent?.name || 'Your child' }} has
                {{ unpaidEnrollments.length }} pending enrollment fee waiting to be settled.
              </p>
            </div>
          </div>
          <button
            @click="triggerPayment(unpaidEnrollments[0])"
            class="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 text-xs flex-shrink-0"
          >
            <span>Pay Online (${{ unpaidEnrollments[0].amount || 150 }})</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Quick Status Overview Banner -->
      <div
        class="bg-gradient-to-br from-[#f0f9ff] to-white border border-[#0ea5e9]/20 rounded-2xl p-4 shadow-sm"
      >
        <div class="flex items-center justify-between mb-3 border-b border-[#e2e8f0]/60 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-xs font-extrabold text-[#0f172a] uppercase tracking-wider"
              >Student Status Summary</span
            >
          </div>
          <span
            class="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full"
          >
            ● Active Profile
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 pt-1 text-center">
          <div class="bg-white rounded-xl p-2.5 border border-[#e2e8f0] shadow-2xs">
            <p class="text-[10px] text-[#64748b] font-bold uppercase">Standing</p>
            <p class="text-xs font-black text-[#0284c7] mt-0.5">
              {{
                studentStanding
                  ? '★ ' + studentStanding
                  : studentStore.selectedStudent
                    ? 'No Grade Yet'
                    : 'No Profile Selected'
              }}
            </p>
          </div>
          <div class="bg-white rounded-xl p-2.5 border border-[#e2e8f0] shadow-2xs">
            <p class="text-[10px] text-[#64748b] font-bold uppercase">Attendance</p>
            <p class="text-xs font-black text-emerald-700 mt-0.5">
              {{
                studentAttendanceRate
                  ? studentAttendanceRate + ' Punctual'
                  : studentStore.selectedStudent
                    ? 'No Logs Yet'
                    : 'No Profile Selected'
              }}
            </p>
          </div>
          <div class="bg-white rounded-xl p-2.5 border border-[#e2e8f0] shadow-2xs">
            <p class="text-[10px] text-[#64748b] font-bold uppercase">Enrollments</p>
            <p class="text-xs font-black text-[#0f172a] mt-0.5">{{ activeClassesCount }} Active</p>
          </div>
        </div>
      </div>

      <!-- Core Feature Cards (Academic Performance & Attendance) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <!-- Card 1: Academic Performance & Exams -->
        <div
          @click="
            router.push(
              studentStore.selectedStudent?.id
                ? `/performance/${studentStore.selectedStudent.id}`
                : '/performance',
            )
          "
          class="group p-4 bg-white border border-[#e2e8f0] hover:border-[#0ea5e9] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div class="flex items-start justify-between gap-3">
            <div
              class="w-11 h-11 rounded-xl bg-[#f0f9ff] text-[#0ea5e9] border border-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors"
            >
              <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#0284c7]">
                  Exams & Grades
                </span>
                <svg
                  class="w-4 h-4 text-[#64748b] group-hover:text-[#0ea5e9] group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <h3
                class="text-base font-extrabold text-[#0f172a] mt-0.5 group-hover:text-[#0284c7] transition-colors"
              >
                Academic Performance
              </h3>
              <p class="text-xs text-[#64748b] mt-1 leading-normal">
                Check exam scores, teacher evaluation remarks, skills mastered, and overall term
                progress.
              </p>
            </div>
          </div>

          <div
            class="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-bold text-[#0284c7]"
          >
            <span>View Full Report Card</span>
            <span
              class="bg-[#f0f9ff] px-2 py-0.5 rounded-md border border-[#0ea5e9]/20 font-extrabold"
              >Check Remarks →</span
            >
          </div>
        </div>

        <!-- Card 2: Attendance Tracking -->
        <div
          @click="
            router.push(
              studentStore.selectedStudent?.id
                ? `/attendance/${studentStore.selectedStudent.id}`
                : '/attendance',
            )
          "
          class="group p-4 bg-white border border-[#e2e8f0] hover:border-[#0ea5e9] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div class="flex items-start justify-between gap-3">
            <div
              class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
            >
              <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Class Presence
                </span>
                <svg
                  class="w-4 h-4 text-[#64748b] group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <h3
                class="text-base font-extrabold text-[#0f172a] mt-0.5 group-hover:text-emerald-700 transition-colors"
              >
                Attendance History
              </h3>
              <p class="text-xs text-[#64748b] mt-1 leading-normal">
                Review session-by-session presence, punctuality records, and absence notes.
              </p>
            </div>
          </div>

          <div
            class="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-bold text-emerald-700"
          >
            <span>Check Session Log</span>
            <span
              class="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-extrabold"
              >View Records →</span
            >
          </div>
        </div>
      </div>

      <!-- Enrolled Programs List for Selected Student -->
      <div class="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3.5">
          <div>
            <h3 class="text-base font-extrabold text-[#0f172a]">Enrolled Classes</h3>
            <p class="text-xs text-[#64748b]">
              Current class schedule & status for
              {{ studentStore.selectedStudent?.name || 'your child' }}
            </p>
          </div>
          <RouterLink
            to="/enroll"
            class="px-3 py-1.5 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] border border-[#0ea5e9]/30 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1"
          >
            <span>+ Enroll New</span>
          </RouterLink>
        </div>

        <div v-if="loadingEnrollments" class="py-8 text-center text-xs font-bold text-[#64748b]">
          Loading enrollments...
        </div>

        <div
          v-else-if="currentStudentEnrollments.length === 0"
          class="py-8 text-center bg-[#f8fafc] rounded-2xl border border-dashed border-[#e2e8f0] p-5"
        >
          <div
            class="w-10 h-10 bg-white border border-[#e2e8f0] rounded-full flex items-center justify-center mx-auto mb-2 text-[#64748b]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <p class="text-sm font-extrabold text-[#0f172a]">No active classes found</p>
          <p class="text-xs text-[#64748b] mt-0.5 mb-4">
            You can self-enroll your child right now using our fast online scheduler.
          </p>
          <RouterLink
            to="/enroll"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <span>Start Online Self-Enrollment</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </RouterLink>
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="enrollment in currentStudentEnrollments"
            :key="enrollment.id"
            class="p-4 rounded-2xl bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs transition-all"
          >
            <div class="flex items-start gap-3.5 min-w-0">
              <div
                class="w-11 h-11 rounded-2xl overflow-hidden bg-white ring-2 ring-[#e2e8f0] shadow-md flex items-center justify-center flex-shrink-0"
              >
                <img
                  v-if="
                    getProgramProfileURL(
                      enrollment.profileURL || enrollment.program?.profileURL,
                      enrollment.program?.name || enrollment.programName,
                    )
                  "
                  :src="
                    getProgramProfileURL(
                      enrollment.profileURL || enrollment.program?.profileURL,
                      enrollment.program?.name || enrollment.programName,
                    )
                  "
                  :alt="enrollment.program?.name || enrollment.programName"
                  class="w-full h-full object-cover"
                  @error="$event.target.style.display = 'none'"
                />
                <span v-else class="text-base font-black text-[#0284c7]">
                  {{
                    (enrollment.program?.name || enrollment.programName || 'E')
                      .charAt(0)
                      .toUpperCase()
                  }}
                </span>
              </div>
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-extrabold text-[#0f172a] truncate">
                    {{ enrollment.program?.name || enrollment.programName || 'Class Offering' }}
                  </span>
                  <AppBadge :status="enrollment.paymentStatus || enrollment.status || 'Unpaid'" />
                  <AppBadge :branch="enrollment.branchObj || enrollment.branchId || 'AEON'" />
                </div>
                <p class="text-xs text-[#334155] flex items-center gap-2">
                  <span class="font-extrabold text-[#0284c7]">{{
                    enrollment.class?.schedule || enrollment.schedule || 'Regular Schedule'
                  }}</span>
                </p>
              </div>
            </div>

            <div
              class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e2e8f0] flex-shrink-0"
            >
              <span class="text-sm font-black text-[#0f172a]"
                >${{ formatPrice(enrollment.amount || 150) }}</span
              >
              <button
                v-if="
                  (enrollment.paymentStatus || enrollment.status || '').toLowerCase() === 'unpaid'
                "
                @click="triggerPayment(enrollment)"
                class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Pay Fee Online
              </button>
              <AppBadge v-else :status="enrollment.paymentStatus || enrollment.status || 'Paid'" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Online Payment Modal -->
    <OnlinePaymentModal
      :show="showPaymentModal"
      :enrollment="activePaymentEnrollment"
      @close="showPaymentModal = false"
      @paid="handlePaymentSuccess"
    />
  </div>
</template>
