<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/studentStore'
import { parentPortalService } from '@/services/parentAuthService'
import ChildSwitcher from '@/components/ChildSwitcher.vue'
import OnlinePaymentModal from '@/components/OnlinePaymentModal.vue'

const router = useRouter()
const studentStore = useStudentStore()

const enrollments = ref([])
const loadingEnrollments = ref(false)
const showPaymentModal = ref(false)
const activePaymentEnrollment = ref(null)

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
    const st = (e.status || '').toLowerCase()
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
  <div class="space-y-6">
    <!-- Top Child Switcher Tabs -->
    <ChildSwitcher />

    <div v-if="studentStore.selectedStudent" class="space-y-6">
      <!-- Unpaid Fees Action Banner (If Any) -->
      <div v-if="unpaidEnrollments.length > 0" class="p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/50 rounded-3xl shadow-lg relative overflow-hidden animate-pulse-subtle">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span class="inline-block text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 mb-1">
                Action Required
              </span>
              <h3 class="text-base font-extrabold text-white">Unpaid Class Fees Due</h3>
              <p class="text-xs text-amber-100/90 mt-0.5">
                {{ studentStore.selectedStudent.name }} has {{ unpaidEnrollments.length }} pending enrollment fee waiting to be settled.
              </p>
            </div>
          </div>
          <button
            @click="triggerPayment(unpaidEnrollments[0])"
            class="py-3 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 text-sm flex-shrink-0"
          >
            <span>Pay Online Now (${{ unpaidEnrollments[0].amount || 150 }})</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Quick Action Cards Grid (Performance & Attendance) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Card 1: Academic Performance & Exams -->
        <div
          @click="router.push(`/performance/${studentStore.selectedStudent.id}`)"
          class="group p-5 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-500/30 hover:border-indigo-400/60 rounded-3xl shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <!-- background glow accent -->
          <div class="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                Exams & Evaluations
              </span>
              <div class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h3 class="text-lg font-extrabold text-white group-hover:text-indigo-200 transition-colors">
              Academic Performance
            </h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Check exam scores, teacher evaluation remarks, skills mastered, and overall term progress for {{ studentStore.selectedStudent.name }}.
            </p>
          </div>

          <div class="mt-5 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs font-bold text-indigo-300">
            <span>View Full Report Card</span>
            <span>★ Satisfactory / Excellent</span>
          </div>
        </div>

        <!-- Card 2: Attendance Tracking -->
        <div
          @click="router.push(`/attendance/${studentStore.selectedStudent.id}`)"
          class="group p-5 bg-gradient-to-br from-sky-950/90 via-slate-900 to-blue-950/90 border border-sky-500/30 hover:border-sky-400/60 rounded-3xl shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div class="absolute -right-8 -top-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-colors"></div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-lg border border-sky-500/30">
                Class Attendance
              </span>
              <div class="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h3 class="text-lg font-extrabold text-white group-hover:text-sky-200 transition-colors">
              Attendance Record
            </h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Track session-by-session presence, punctuality, and absence history across enrolled programs.
            </p>
          </div>

          <div class="mt-5 pt-3 border-t border-sky-500/20 flex items-center justify-between text-xs font-bold text-sky-300">
            <span>Check Session Breakdown</span>
            <span>{{ activeClassesCount }} Active {{ activeClassesCount === 1 ? 'Class' : 'Classes' }}</span>
          </div>
        </div>
      </div>

      <!-- Current Enrollments List for Selected Student -->
      <div class="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-extrabold text-white">Enrolled Programs</h3>
            <p class="text-xs text-slate-400">Current schedule and payment status for {{ studentStore.selectedStudent.name }}</p>
          </div>
          <RouterLink
            to="/enroll"
            class="px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>+ Enroll New</span>
          </RouterLink>
        </div>

        <div v-if="loadingEnrollments" class="py-8 text-center text-sm text-slate-400">
          Loading enrollments...
        </div>

        <div v-else-if="currentStudentEnrollments.length === 0" class="py-10 text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 p-6">
          <p class="text-sm font-bold text-slate-300">No active classes found for this student</p>
          <p class="text-xs text-slate-500 mt-1 mb-4">You can self-enroll your child right now using our fast online scheduler.</p>
          <RouterLink
            to="/enroll"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-sky-400 hover:to-blue-500 transition-all"
          >
            <span>Start Online Self-Enrollment</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </RouterLink>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="enrollment in currentStudentEnrollments"
            :key="enrollment.id"
            class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-extrabold text-white">
                  {{ enrollment.program?.name || enrollment.programName || 'Class Offering' }}
                </span>
                <span
                  :class="[
                    'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border',
                    (enrollment.paymentStatus || enrollment.status || '').toLowerCase() === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : (enrollment.paymentStatus || enrollment.status || '').toLowerCase() === 'verifying'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ (enrollment.paymentStatus || enrollment.status || 'Unpaid').toUpperCase() }}
                </span>
              </div>
              <p class="text-xs text-slate-300 flex items-center gap-2">
                <span class="font-medium text-sky-300">{{ enrollment.class?.schedule || enrollment.schedule || 'Regular Schedule' }}</span>
                <span class="text-slate-500">•</span>
                <span class="uppercase text-[11px] text-slate-400 font-semibold">{{ enrollment.branchId || 'Main Studio' }}</span>
              </p>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
              <span class="text-sm font-black text-slate-200">${{ enrollment.amount || 150 }}</span>
              <button
                v-if="(enrollment.paymentStatus || enrollment.status || '').toLowerCase() === 'unpaid'"
                @click="triggerPayment(enrollment)"
                class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                Pay Fee Online
              </button>
              <span v-else-if="(enrollment.paymentStatus || '').toLowerCase() === 'verifying'" class="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                Verifying Proof...
              </span>
              <span v-else class="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Paid
              </span>
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
