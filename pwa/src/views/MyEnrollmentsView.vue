<script setup>
import { ref, computed, onMounted } from 'vue'
import { parentPortalService } from '@/services/parentAuthService'
import OnlinePaymentModal from '@/components/OnlinePaymentModal.vue'
import { useStudentStore } from '@/stores/studentStore'
import AppBadge from '@/components/common/AppBadge.vue'
import { getProgramProfileURL } from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'

const enrollments = ref([])
const loading = ref(false)
const filterStatus = ref('all') // 'all', 'paid', 'unpaid', 'verifying'
const showPaymentModal = ref(false)
const selectedEnrollment = ref(null)

const fetchAllEnrollments = async () => {
  loading.value = true
  try {
    const list = await parentPortalService.getMyEnrollments()
    enrollments.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('Failed fetching enrollments:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllEnrollments()
})

const filteredEnrollments = computed(() => {
  let list = enrollments.value.filter((e) => !e.isDeleted)
  const studentStore = useStudentStore()
  if (studentStore.selectedStudent?.id) {
    list = list.filter((e) => (e.studentId || e.student?.id) === studentStore.selectedStudent.id)
  }
  if (filterStatus.value === 'all') return list
  return list.filter((e) => {
    const st = (e.paymentStatus || e.status || '').toLowerCase()
    if (filterStatus.value === 'unpaid') return st === 'unpaid' || st === 'pending'
    return st === filterStatus.value
  })
})

const triggerPay = (enrollment) => {
  selectedEnrollment.value = enrollment
  showPaymentModal.value = true
}
</script>

<template>
  <div class="space-y-5 pb-28">
    <ChildSwitcher />

    <!-- Header -->
    <div class="flex items-center justify-between bg-white p-4.5 rounded-2xl border border-[#e2e8f0] shadow-sm">
      <div>
        <h1 class="text-lg font-extrabold text-[#0f172a]">My Enrolled Classes</h1>
        <p class="text-xs text-[#64748b] mt-0.5">Manage schedules, attendance, and fee status</p>
      </div>
      <RouterLink
        to="/enroll"
        class="px-3.5 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
      >
        <span>+ New Enrollment</span>
      </RouterLink>
    </div>

    <!-- Filter Pills -->
    <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="f in [
          { id: 'all', label: 'All Records' },
          { id: 'paid', label: 'Paid' },
          { id: 'unpaid', label: 'Pending Fee' },
          { id: 'verifying', label: 'Under Review' },
        ]"
        :key="f.id"
        @click="filterStatus = f.id"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 cursor-pointer shadow-2xs',
          filterStatus === f.id
            ? 'bg-[#0ea5e9] text-white shadow-sm'
            : 'bg-white text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0]'
        ]"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-xs font-bold text-[#64748b]">
      Loading enrollments...
    </div>

    <!-- Enrollments List / Panel Container -->
    <div v-else class="space-y-3.5">
      <div v-if="filteredEnrollments.length === 0" class="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center shadow-sm">
        <div class="w-12 h-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-full flex items-center justify-center mx-auto mb-3 text-[#64748b]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p class="text-sm font-extrabold text-[#0f172a]">No enrollments found matching this filter</p>
        <p class="text-xs text-[#64748b] mt-1 mb-4">You can enroll online right now to secure a seat in upcoming terms.</p>
        <RouterLink
          to="/enroll"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
        >
          <span>Browse Available Programs →</span>
        </RouterLink>
      </div>

      <div
        v-else
        v-for="enr in filteredEnrollments"
        :key="enr.id"
        class="bg-white rounded-3xl border border-[#e2e8f0] p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group"
      >
        <!-- Top accent gradient on hover -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl overflow-hidden bg-[#f0f9ff] ring-2 ring-[#e2e8f0] shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <img
                v-if="getProgramProfileURL(enr.profileURL || enr.program?.profileURL, enr.program?.name || enr.programName)"
                :src="getProgramProfileURL(enr.profileURL || enr.program?.profileURL, enr.program?.name || enr.programName)"
                :alt="enr.program?.name || enr.programName"
                class="w-full h-full object-cover"
                @error="$event.target.style.display = 'none'"
              />
              <span v-else class="text-base font-black text-[#0284c7]">
                {{ (enr.program?.name || enr.programName || 'E').charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <AppBadge :branch="enr.branchObj || enr.branchId || 'AEON'" />
              <h3 class="text-base font-black text-[#0f172a] mt-1.5 leading-snug group-hover:text-[#0284c7] transition-colors">{{ enr.program?.name || enr.programName || 'Enrolled Class' }}</h3>
              <p class="text-xs font-extrabold text-[#334155] mt-0.5 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ enr.class?.schedule || enr.schedule || 'Regular Schedule' }}</span>
              </p>
            </div>
          </div>
          <div class="text-right flex-shrink-0 space-y-1">
            <div class="text-base font-black text-[#0f172a]">${{ formatPrice(enr.amount || 150) }}</div>
            <AppBadge :status="enr.paymentStatus || enr.status || 'Unpaid'" />
          </div>
        </div>

        <div class="pt-3.5 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              @click="$router.push(`/performance/${studentStore.selectedStudent?.id || enr.studentId || ''}`)"
              class="px-3.5 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] hover:text-[#0f172a] border border-[#e2e8f0] rounded-xl text-xs font-extrabold text-[#334155] transition-all active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <span>Exams & Scores</span>
            </button>
            <button
              @click="$router.push(`/attendance/${studentStore.selectedStudent?.id || enr.studentId || ''}`)"
              class="px-3.5 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] hover:text-[#0f172a] border border-[#e2e8f0] rounded-xl text-xs font-extrabold text-[#334155] transition-all active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <span>Attendance</span>
            </button>
          </div>

          <button
            v-if="(enr.paymentStatus || enr.status || '').toLowerCase() === 'unpaid'"
            @click="triggerPay(enr)"
            class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Pay Fee Now →</span>
          </button>
          <div v-else-if="(enr.paymentStatus || '').toLowerCase() === 'verifying'" class="text-xs text-[#0284c7] font-extrabold bg-[#f0f9ff] px-3.5 py-1.5 rounded-xl border border-[#0ea5e9]/30 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#0ea5e9] animate-ping"></span>
            <span>Checking Receipt...</span>
          </div>
          <div v-else class="text-xs text-emerald-800 font-extrabold bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Confirmed Seat ✓</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Online Payment Modal -->
    <OnlinePaymentModal
      :show="showPaymentModal"
      :enrollment="selectedEnrollment"
      @close="showPaymentModal = false"
      @paid="fetchAllEnrollments"
    />
  </div>
</template>
