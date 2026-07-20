<script setup>
import { onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'

const studentStore = useStudentStore()

onMounted(() => {
  studentStore.fetchChildren()
})
</script>

<template>
  <div class="mb-6">
    <div v-if="studentStore.loading" class="flex items-center gap-2 text-sm text-slate-400 py-2">
      <svg class="animate-spin h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Loading your children...</span>
    </div>

    <div v-else-if="studentStore.error" class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
      {{ studentStore.error }}
    </div>

    <div v-else-if="studentStore.children.length === 0" class="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-center">
      <div class="w-10 h-10 bg-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <p class="text-sm font-semibold text-slate-200">No student profiles linked yet</p>
      <p class="text-xs text-slate-400 mt-0.5">Please contact AAA Academy admin or enroll your child below to link accounts.</p>
    </div>

    <div v-else class="space-y-2">
      <div class="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
        <span>Active Child Profile</span>
        <span class="text-sky-400">{{ studentStore.children.length }} {{ studentStore.children.length === 1 ? 'Student' : 'Students' }}</span>
      </div>

      <div class="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x">
        <button
          v-for="child in studentStore.children"
          :key="child.id"
          @click="studentStore.selectStudent(child.id)"
          :class="[
            'flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all flex-shrink-0 snap-start text-left cursor-pointer transform active:scale-95',
            studentStore.selectedStudentId === child.id || (studentStore.selectedStudent && studentStore.selectedStudent.id === child.id)
              ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/20 border-sky-400 text-white shadow-md shadow-sky-500/10'
              : 'bg-slate-800/90 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          ]"
        >
          <!-- Avatar pill -->
          <div :class="[
            'w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-inner',
            studentStore.selectedStudentId === child.id ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          ]">
            {{ child.name ? child.name.charAt(0).toUpperCase() : 'S' }}
          </div>

          <div>
            <div class="text-sm font-bold leading-tight">{{ child.name }}</div>
            <div class="text-[11px] opacity-80 flex items-center gap-1.5 mt-0.5">
              <span>{{ child.level || child.programName || 'Student' }}</span>
              <span v-if="child.branchId" class="w-1 h-1 bg-sky-400 rounded-full"></span>
              <span v-if="child.branchId" class="uppercase font-semibold text-sky-400">{{ child.branchId }}</span>
            </div>
          </div>

          <!-- Active check icon -->
          <div v-if="studentStore.selectedStudentId === child.id" class="ml-1 text-sky-400">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
