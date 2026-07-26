<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/studentStore'
import { parentPortalService } from '@/services/parentAuthService'
import ChildSwitcher from '@/components/ChildSwitcher.vue'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()

const performanceList = ref([])
const loading = ref(false)
const selectedClassId = ref('all')

const loadPerformance = async (studentId) => {
  if (!studentId) return
  loading.value = true
  try {
    const res = await parentPortalService.getChildPerformance(studentId)
    if (res && Array.isArray(res)) {
      performanceList.value = res
    } else if (res && (res.overallGrade || res.skillsMastered || res.className)) {
      performanceList.value = [res]
    } else {
      performanceList.value = []
    }
  } catch (err) {
    console.error('Failed fetching performance:', err)
    performanceList.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => studentStore.selectedStudentId,
  (newId) => {
    if (newId) {
      if (route.params.studentId !== newId) {
        router.replace(`/performance/${newId}`)
      }
      loadPerformance(newId)
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (route.params.studentId) {
    studentStore.selectStudent(route.params.studentId)
    loadPerformance(route.params.studentId)
  } else if (studentStore.selectedStudentId) {
    loadPerformance(studentStore.selectedStudentId)
  }
})

const displayRecords = computed(() => {
  if (selectedClassId.value === 'all') return performanceList.value
  return performanceList.value.filter((r) => r.classId === selectedClassId.value || r.id === selectedClassId.value)
})
</script>

<template>
  <div class="space-y-5 pb-28">
    <!-- Child Switcher Header -->
    <ChildSwitcher />

    <!-- Page Title & Class Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-[#e2e8f0] shadow-sm">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-extrabold text-[#0f172a]">Academic Report Card & Exams</h1>
          <span class="px-2.5 py-0.5 bg-[#f0f9ff] text-[#0284c7] border border-[#0ea5e9]/20 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs">
            {{ performanceList.length }} {{ performanceList.length === 1 ? 'Program' : 'Programs' }}
          </span>
        </div>
        <p class="text-xs text-[#64748b] mt-0.5">
          Official evaluation & exam progress for <strong class="text-[#0ea5e9]">{{ studentStore.selectedStudent?.name || 'your child' }}</strong>
        </p>
      </div>

      <!-- Class Filter Pill Bar if multiple classes -->
      <div v-if="performanceList.length > 1" class="flex items-center gap-1.5 overflow-x-auto py-1">
        <button
          type="button"
          @click="selectedClassId = 'all'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 cursor-pointer border',
            selectedClassId === 'all'
              ? 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white border-[#0ea5e9] shadow-md'
              : 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:bg-white'
          ]"
        >
          All Classes
        </button>
        <button
          v-for="rec in performanceList"
          :key="rec.id"
          @click="selectedClassId = rec.classId || rec.id"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 cursor-pointer border',
            selectedClassId === (rec.classId || rec.id)
              ? 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white border-[#0ea5e9] shadow-md'
              : 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:bg-white'
          ]"
        >
          {{ rec.className || rec.programName || 'Class' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-16 text-center text-xs font-bold text-[#64748b] flex flex-col items-center justify-center gap-3">
      <svg class="animate-spin h-6 w-6 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Loading academic evaluations across enrolled programs...</span>
    </div>

    <!-- Main Report Cards List -->
    <div v-else class="space-y-6">
      <div
        v-for="(rec, idx) in displayRecords"
        :key="rec.id || idx"
        class="bg-white rounded-3xl border border-[#e2e8f0] p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden group hover:shadow-md transition-all"
      >
        <!-- Top accent gradient -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] via-[#38bdf8] to-[#0284c7]"></div>

        <!-- Class Header & Badges -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
              {{ (rec.className || rec.programName || 'E').charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Branch Badge -->
                <span
                  :class="[
                    'inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold leading-none whitespace-nowrap shadow-2xs',
                    rec.branchId && (String(rec.branchId).toUpperCase() === 'FM' || String(rec.branchId).toUpperCase() === 'SEN SOK') ? 'bg-[#f3e8ff] text-[#581c87]' : 'bg-[#e0f2fe] text-[#0284c7]'
                  ]"
                >
                  {{ rec.branchId || 'AEON' }}
                </span>
                <!-- Status Badge -->
                <span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold leading-none whitespace-nowrap shadow-2xs bg-[#d1fae5] text-[#064e3b]">
                  {{ rec.isEnrollmentSummary ? 'Active Standing' : 'Verified Report' }}
                </span>
              </div>
              <h3 class="text-base font-black text-[#0f172a] mt-1 leading-snug">{{ rec.className || rec.programName || 'Enrolled Class' }}</h3>
              <p class="text-xs font-extrabold text-[#334155] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>👨‍🏫 Teacher: <strong>{{ rec.instructor || 'Faculty' }}</strong></span>
                <span class="text-[#94a3b8]">•</span>
                <span>🕒 {{ rec.schedule || 'Regular Schedule' }}</span>
              </p>
            </div>
          </div>

          <div class="text-right flex-shrink-0">
            <span class="text-xs font-black uppercase tracking-wider text-[#0ea5e9] block">{{ rec.termName || 'Current Term' }}</span>
            <span class="text-[11px] text-[#64748b] font-bold">{{ rec.evaluationDate ? new Date(rec.evaluationDate).toLocaleDateString() : 'Active Term' }}</span>
          </div>
        </div>

        <!-- Overall Grade Banner -->
        <div class="p-5 rounded-2xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1 relative z-10">
            <span class="text-[10px] font-black uppercase tracking-widest text-[#f0f9ff]/90 block">
              Academic Evaluation Standing
            </span>
            <h4 class="text-2xl sm:text-3xl font-black tracking-tight">
              {{ rec.overallGrade || 'Satisfactory' }}
            </h4>
            <p class="text-xs text-[#f0f9ff]/90 font-medium">
              Comprehensive performance indicator based on session participation and skill check-ins.
            </p>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black self-end sm:self-center shadow-inner">
            ★
          </div>
        </div>

        <!-- Teacher Remarks Quote Card -->
        <div class="p-4.5 rounded-2xl bg-[#f0f9ff] border border-[#0ea5e9]/30 shadow-sm relative">
          <div class="flex items-center gap-2 text-[#0284c7] text-xs font-extrabold uppercase tracking-wider mb-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span>Instructor Remarks</span>
          </div>
          <blockquote class="text-xs sm:text-sm text-[#0f172a] italic leading-relaxed pl-3 border-l-2 border-[#0ea5e9]">
            "{{ rec.teacherRemarks || 'Student is currently enrolled and actively participating in class sessions.' }}"
          </blockquote>
        </div>

        <!-- Skills Mastered Section -->
        <div class="p-4.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] shadow-2xs space-y-3">
          <h4 class="text-xs font-extrabold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
            <span>🎯 Skills & Competencies Tracked</span>
            <span class="text-[11px] text-[#0284c7] font-bold">({{ (rec.skillsMastered || []).length }})</span>
          </h4>

          <div v-if="(rec.skillsMastered || []).length > 0" class="flex flex-wrap gap-2 pt-1">
            <div
              v-for="skill in rec.skillsMastered"
              :key="skill"
              class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-2xs"
            >
              <span class="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">✓</span>
              <span>{{ skill }}</span>
            </div>
          </div>
          <div v-else class="py-3 text-center text-xs font-bold text-[#64748b]">
            No skills assessed yet for the current term.
          </div>
        </div>

        <!-- Exam & Assessment Results if grades present -->
        <div v-if="(rec.grades || rec.examScores || rec.evaluations || []).length > 0" class="bg-white rounded-2xl border border-[#e2e8f0] p-4.5 shadow-2xs space-y-3">
          <h4 class="text-xs font-extrabold text-[#0f172a] uppercase tracking-wider">Exam & Assessment Breakdown</h4>
          <div class="space-y-2">
            <div
              v-for="exam in (rec.grades || rec.examScores || rec.evaluations)"
              :key="exam.id || exam.title || exam.assessmentName"
              class="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <span class="text-sm font-extrabold text-[#0f172a]">{{ exam.assessmentName || exam.title || exam.name || 'Assessment' }}</span>
                <p v-if="exam.remarks || exam.notes" class="text-xs text-[#334155] mt-0.5">{{ exam.remarks || exam.notes }}</p>
              </div>
              <div class="flex items-center gap-2 self-end sm:self-center">
                <span class="text-xs font-extrabold text-[#0f172a]">{{ exam.score !== undefined ? exam.score + '%' : 'Graded' }}</span>
                <span class="px-3 py-1 rounded-lg bg-[#f0f9ff] border border-[#0ea5e9]/30 text-[#0284c7] text-xs font-extrabold">
                  Grade: {{ exam.grade || 'A' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zero State if no classes enrolled -->
      <div v-if="displayRecords.length === 0" class="p-8 bg-white rounded-3xl border border-dashed border-[#e2e8f0] text-center shadow-sm">
        <div class="w-12 h-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-full flex items-center justify-center mx-auto mb-3 text-[#64748b]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-sm font-extrabold text-[#0f172a]">No academic evaluation records found</p>
        <p class="text-xs text-[#64748b] mt-1">Once your child enrolls in classes and instructors complete term check-ins, performance evaluations will appear here.</p>
      </div>
    </div>
  </div>
</template>
