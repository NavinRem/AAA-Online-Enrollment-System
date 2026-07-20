<script setup>
import { ref, computed, onMounted } from 'vue'
import { parentPortalService } from '@/services/parentAuthService'
import OnlinePaymentModal from '@/components/OnlinePaymentModal.vue'

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
  if (filterStatus.value === 'all') return enrollments.value.filter((e) => !e.isDeleted)
  return enrollments.value.filter((e) => {
    if (e.isDeleted) return false
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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl">
      <div>
        <h1 class="text-xl font-extrabold text-white">All Class Enrollments</h1>
        <p class="text-xs text-slate-400 mt-0.5">Comprehensive enrollment & fee history across all your children</p>
      </div>
      <RouterLink
        to="/enroll"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all"
      >
        <span>+ Self-Enroll New Class</span>
      </RouterLink>
    </div>

    <!-- Filter Pills -->
    <div class="flex gap-2 overflow-x-auto pb-1">
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
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0',
          filterStatus === f.id
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
        ]"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Enrollments List -->
    <div v-if="loading" class="py-12 text-center text-sm text-slate-400">
      Loading enrollments history...
    </div>

    <div v-else-if="filteredEnrollments.length === 0" class="py-12 text-center bg-slate-900/70 rounded-3xl border border-slate-800 p-8">
      <p class="text-sm font-bold text-slate-300">No enrollment records match this filter</p>
      <p class="text-xs text-slate-500 mt-1">Enroll your child to start tracking sessions and payments.</p>
    </div>

    <div v-else class="space-y-3.5">
      <div
        v-for="item in filteredEnrollments"
        :key="item.id"
        class="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-base font-extrabold text-white">
              {{ item.program?.name || item.programName || 'Academic Course' }}
            </span>
            <span
              :class="[
                'text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border',
                (item.paymentStatus || item.status || '').toLowerCase() === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : (item.paymentStatus || item.status || '').toLowerCase() === 'verifying'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              ]"
            >
              {{ (item.paymentStatus || item.status || 'unpaid').toUpperCase() }}
            </span>
          </div>
          <div class="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
            <span class="font-bold text-slate-200">Student: {{ item.student?.name || item.studentName || 'Child' }}</span>
            <span class="text-slate-600">•</span>
            <span class="text-sky-300">{{ item.class?.schedule || item.schedule || 'Weekly Schedule' }}</span>
            <span class="text-slate-600">•</span>
            <span class="uppercase text-slate-400 font-semibold">{{ item.branchId || 'Studio' }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div class="text-right">
            <span class="text-[10px] font-bold text-slate-500 uppercase block">Fee Amount</span>
            <span class="text-lg font-black text-white">${{ item.amount || 150 }}</span>
          </div>

          <button
            v-if="(item.paymentStatus || item.status || '').toLowerCase() === 'unpaid'"
            @click="triggerPay(item)"
            class="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Pay Fee Online</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <div v-else-if="(item.paymentStatus || '').toLowerCase() === 'verifying'" class="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-2 rounded-xl border border-blue-500/20">
            Checking Receipt...
          </div>
          <div v-else class="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Confirmed Seat</span>
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
