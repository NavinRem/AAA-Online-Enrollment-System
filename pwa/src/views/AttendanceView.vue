<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/studentStore'
import { parentPortalService } from '@/services/parentAuthService'
import ChildSwitcher from '@/components/ChildSwitcher.vue'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()

const attendanceRecords = ref([])
const loading = ref(false)

const loadAttendance = async (studentId) => {
  if (!studentId) return
  loading.value = true
  attendanceRecords.value = []
  try {
    const res = await parentPortalService.getChildAttendance(studentId)
    attendanceRecords.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.error('Failed loading attendance:', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => studentStore.selectedStudentId,
  (newId) => {
    if (newId) {
      if (route.params.studentId !== newId) {
        router.replace(`/attendance/${newId}`)
      }
      loadAttendance(newId)
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (route.params.studentId) {
    studentStore.selectStudent(route.params.studentId)
    loadAttendance(route.params.studentId)
  } else if (studentStore.selectedStudentId) {
    loadAttendance(studentStore.selectedStudentId)
  }
})

const displayList = computed(() => {
  return attendanceRecords.value || []
})

const stats = computed(() => {
  const list = displayList.value
  if (list.length === 0) {
    return { present: 0, absent: 0, excused: 0, percentage: 0 }
  }
  const present = list.filter((r) => (r.status || '').toLowerCase() === 'present').length
  const absent = list.filter((r) => (r.status || '').toLowerCase() === 'absent').length
  const excused = list.filter((r) => (r.status || '').toLowerCase() === 'excused' || (r.status || '').toLowerCase() === 'late').length
  const total = list.length
  const percentage = Math.round((present / total) * 100)
  return { present, absent, excused, percentage }
})
</script>

<template>
  <div class="space-y-5 pb-28">
    <ChildSwitcher />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-extrabold text-[#0f172a]">Class Attendance Log</h1>
        </div>
        <p class="text-xs text-[#64748b] mt-0.5">
          Session check-in & punctuality record for {{ studentStore.selectedStudent?.name || 'your child' }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="py-12 text-center text-xs font-bold text-[#64748b]">
      Loading attendance history...
    </div>

    <!-- Summary Stats Bar & Session Log (Always Rendered) -->
    <div v-else class="space-y-5">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm text-center">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">Attendance Rate</span>
          <span class="text-xl font-black text-[#0284c7] mt-0.5 block">{{ stats.percentage }}%</span>
        </div>
        <div class="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm text-center">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">Sessions Present</span>
          <span class="text-xl font-black text-emerald-600 mt-0.5 block">{{ stats.present }}</span>
        </div>
        <div class="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm text-center">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">Late / Excused</span>
          <span class="text-xl font-black text-amber-600 mt-0.5 block">{{ stats.excused }}</span>
        </div>
        <div class="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm text-center">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">Absences</span>
          <span class="text-xl font-black text-red-600 mt-0.5 block">{{ stats.absent }}</span>
        </div>
      </div>

      <!-- Attendance List Panel -->
      <div class="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 shadow-sm space-y-3">
        <h3 class="text-xs font-extrabold text-[#0f172a] uppercase tracking-wider mb-2">Detailed Session Log</h3>

        <div v-if="displayList.length > 0" class="space-y-2.5">
          <div
            v-for="rec in displayList"
            :key="rec.id"
            class="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-extrabold text-[#0f172a]">{{ rec.date || 'Recent Session' }}</span>
                <span class="text-[11px] text-[#64748b] font-bold">• {{ rec.sessionName || rec.className || 'Regular Class' }}</span>
              </div>
              <p v-if="rec.remarks" class="text-xs text-[#334155] mt-0.5 italic">{{ rec.remarks }}</p>
            </div>
            <div class="self-end sm:self-center">
              <span
                :class="[
                  'text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border',
                  (rec.status || '').toLowerCase() === 'present' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  (rec.status || '').toLowerCase() === 'late' || (rec.status || '').toLowerCase() === 'excused' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-red-100 text-red-800 border-red-300'
                ]"
              >
                {{ rec.status || 'Present' }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="py-8 text-center bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0] p-5">
          <p class="text-sm font-extrabold text-[#0f172a]">No session check-in records logged yet</p>
          <p class="text-xs text-[#64748b] mt-1">Check-in history and punctuality logs will appear here automatically when marked by instructors.</p>
        </div>
      </div>
    </div>
  </div>
</template>
