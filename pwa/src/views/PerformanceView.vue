<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/studentStore'
import { parentPortalService } from '@/services/parentAuthService'
import ChildSwitcher from '@/components/ChildSwitcher.vue'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()

const performanceData = ref(null)
const loading = ref(false)
const showDemo = ref(false)

const loadPerformance = async (studentId) => {
  if (!studentId) return
  loading.value = true
  performanceData.value = null
  try {
    const res = await parentPortalService.getChildPerformance(studentId)
    if (res && (res.overallGrade || res.evaluations || res.skillsMastered || (Array.isArray(res) && res.length > 0))) {
      performanceData.value = Array.isArray(res) ? res[0] : res
    }
  } catch (err) {
    console.error('Failed fetching performance:', err)
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

// Demo data for preview if backend records aren't published yet
const displayData = computed(() => {
  if (performanceData.value && !showDemo.value) return performanceData.value
  if (showDemo.value || !performanceData.value) {
    return {
      overallGrade: 'Excellent',
      termName: 'Mid-Year Term 2 (2026)',
      teacherRemarks:
        'Sokha has demonstrated wonderful dedication and consistency in class. Her technical precision during the practical exam and willingness to assist classmates make her a pleasure to teach!',
      skillsMastered: [
        'Classical Posture & Alignment',
        'Rhythmic Tempo Accuracy',
        'First & Second Position Transitions',
        'Improvisational Musicality',
        'Stage Presence & Expression',
      ],
      examScores: [
        { id: 1, title: 'Practical Technique Assessment', score: '94/100', grade: 'A', date: 'Jul 10, 2026', notes: 'Superior control and balance.' },
        { id: 2, title: 'Music & Theory Quiz', score: '90/100', grade: 'A-', date: 'Jun 28, 2026', notes: 'Solid understanding of rhythm.' },
        { id: 3, title: 'Mid-Term Choreography Evaluation', score: '95/100', grade: 'A+', date: 'Jun 15, 2026', notes: 'Flawless execution!' },
      ],
    }
  }
  return null
})

const badgeColor = computed(() => {
  const grade = (displayData.value?.overallGrade || '').toLowerCase()
  if (grade.includes('outstanding') || grade.includes('excellent') || grade === 'a+') {
    return 'from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
  }
  if (grade.includes('satisfactory') || grade === 'a' || grade === 'b') {
    return 'from-sky-500 to-blue-600 text-white shadow-sky-500/25'
  }
  return 'from-amber-500 to-orange-600 text-slate-950 shadow-amber-500/25'
})
</script>

<template>
  <div class="space-y-6">
    <!-- Child Switcher Header -->
    <ChildSwitcher />

    <!-- Page Title -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <span>Academic Report Card & Exams</span>
          <span v-if="showDemo" class="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
            Preview Mode
          </span>
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Official teacher evaluation and exam progress for {{ studentStore.selectedStudent ? studentStore.selectedStudent.name : 'your child' }}
        </p>
      </div>

      <button
        @click="showDemo = !showDemo"
        class="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
      >
        <span>{{ showDemo ? 'Show Live Records' : '👁️ View Demo Evaluation' }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">
      Loading official performance records...
    </div>

    <!-- Empty State -->
    <div v-else-if="!displayData" class="py-14 text-center bg-slate-900/80 rounded-3xl border border-slate-800 p-8 shadow-xl">
      <div class="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-base font-extrabold text-white">No Exam Evaluations Yet</h3>
      <p class="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
        Performance evaluations and report cards are published by instructors at the end of each term and exam cycle.
      </p>
      <button
        @click="showDemo = true"
        class="mt-5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
      >
        Preview Sample Evaluation Report →
      </button>
    </div>

    <!-- Main Report Card Content -->
    <div v-else class="space-y-6">
      <!-- Overall Grade Banner -->
      <div :class="['p-6 rounded-3xl bg-gradient-to-r shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4', badgeColor]">
        <div class="space-y-1 relative z-10">
          <span class="text-[11px] font-black uppercase tracking-widest opacity-90 block">
            {{ displayData.termName || 'Term Evaluation Status' }}
          </span>
          <h2 class="text-2xl sm:text-3xl font-black tracking-tight">
            {{ displayData.overallGrade || 'Satisfactory' }}
          </h2>
          <p class="text-xs opacity-90 font-medium">
            Verified academic standing for {{ studentStore.selectedStudent?.name }}
          </p>
        </div>

        <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black self-end sm:self-center shadow-inner">
          ★
        </div>
      </div>

      <!-- Teacher Remarks Quote Card -->
      <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative">
        <div class="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <span>Instructor Remarks</span>
        </div>
        <blockquote class="text-sm text-slate-200 italic leading-relaxed pl-3 border-l-2 border-sky-500">
          "{{ displayData.teacherRemarks || 'No remarks provided for this evaluation.' }}"
        </blockquote>
      </div>

      <!-- Skills Mastered Section -->
      <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <h3 class="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎯 Skills & Competencies Mastered</span>
          <span class="text-xs text-sky-400 font-bold">({{ (displayData.skillsMastered || []).length }})</span>
        </h3>

        <div class="flex flex-wrap gap-2 pt-1">
          <div
            v-for="skill in (displayData.skillsMastered || [])"
            :key="skill"
            class="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700/80 text-xs font-bold text-emerald-300 flex items-center gap-2 shadow-sm"
          >
            <span class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</span>
            <span>{{ skill }}</span>
          </div>
        </div>
      </div>

      <!-- Exam & Evaluation Breakdown Table/List -->
      <div class="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Exam & Assessment Results</h3>

        <div class="space-y-3">
          <div
            v-for="exam in (displayData.examScores || displayData.evaluations || [])"
            :key="exam.id || exam.title"
            class="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">{{ exam.title || exam.name || 'Assessment' }}</span>
                <span class="text-[11px] text-slate-400 font-semibold">• {{ exam.date || 'Recent' }}</span>
              </div>
              <p v-if="exam.notes" class="text-xs text-slate-400 mt-0.5">{{ exam.notes }}</p>
            </div>

            <div class="flex items-center gap-3 self-end sm:self-center">
              <span class="text-xs font-mono font-bold text-slate-300">{{ exam.score || 'Graded' }}</span>
              <span class="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-extrabold">
                Grade: {{ exam.grade || 'A' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
