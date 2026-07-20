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
const showDemo = ref(false)

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
  if (attendanceRecords.value.length > 0 && !showDemo.value) return attendanceRecords.value
  if (showDemo.value || attendanceRecords.value.length === 0) {
    return [
      { id: 1, date: 'Jul 14, 2026', sessionName: 'Ballet Level 1 - Evening Studio', status: 'present', remarks: 'Punctual & engaged' },
      { id: 2, date: 'Jul 12, 2026', sessionName: 'Ballet Level 1 - Evening Studio', status: 'present', remarks: '' },
      { id: 3, date: 'Jul 07, 2026', sessionName: 'Ballet Level 1 - Evening Studio', status: 'present', remarks: '' },
      { id: 4, date: 'Jul 05, 2026', sessionName: 'Ballet Level 1 - Evening Studio', status: 'excused', remarks: 'Parent notified ahead (medical)' },
      { id: 5, date: 'Jun 30, 2026', sessionName: 'Ballet Level 1 - Evening Studio', status: 'present', remarks: '' },
    ]
  }
  return []
})

const stats = computed(() => {
  const list = displayList.value
  const present = list.filter((r) => (r.status || '').toLowerCase() === 'present').length
  const absent = list.filter((r) => (r.status || '').toLowerCase() === 'absent').length
  const excused = list.filter((r) => (r.status || '').toLowerCase() === 'excused' || (r.status || '').toLowerCase() === 'late').length
  const total = list.length || 1
  const percentage = Math.round((present / total) * 100)
  return { present, absent, excused, percentage }
})
</script>

<template>
  <div class="space-y-6">
    <ChildSwitcher />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <span>Class Attendance Record</span>
          <span v-if="showDemo" class="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
            Preview Mode
          </span>
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Session check-in and attendance percentage for {{ studentStore.selectedStudent ? studentStore.selectedStudent.name : 'your child' }}
        </p>
      </div>

      <button
        @click="showDemo = !showDemo"
        class="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
      >
        <span>{{ showDemo ? 'Show Live Records' : '👁️ View Demo Attendance' }}</span>
      </button>
    </div>

    <!-- Summary Stats Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Attendance Rate</span>
        <span class="text-2xl font-black text-sky-400 mt-1 block">{{ stats.percentage }}%</span>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sessions Present</span>
        <span class="text-2xl font-black text-emerald-400 mt-1 block">{{ stats.present }}</span>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Late / Excused</span>
        <span class="text-2xl font-black text-amber-400 mt-1 block">{{ stats.excused }}</span>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Absences</span>
        <span class="text-2xl font-black text-red-400 mt-1 block">{{ stats.absent }}</span>
      </div>
    </div>

    <!-- Attendance List -->
    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">
      Loading attendance logs...
    </div>

    <div v-else-if="displayList.length === 0" class="py-12 text-center bg-slate-900/70 rounded-3xl border border-slate-800 p-8">
      <p class="text-sm font-bold text-slate-300">No session attendance logged yet</p>
      <p class="text-xs text-slate-500 mt-1">Check-in timestamps will appear here after class sessions.</p>
    </div>

    <div v-else class="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-3">
      <h3 class="text-sm font-extrabold text-white uppercase tracking-wider mb-2">Session Check-in History</h3>

      <div
        v-for="record in displayList"
        :key="record.id || record.date"
        class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-white">{{ record.date || 'Recent Session' }}</span>
            <span class="text-xs text-slate-400">• {{ record.sessionName || record.className || 'Class Check-in' }}</span>
          </div>
          <p v-if="record.remarks" class="text-xs text-slate-400 italic">{{ record.remarks }}</p>
        </div>

        <div>
          <span
            :class="[
              'px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border',
              (record.status || '').toLowerCase() === 'present'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : (record.status || '').toLowerCase() === 'absent'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            ]"
          >
            {{ (record.status || 'Present').toUpperCase() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
