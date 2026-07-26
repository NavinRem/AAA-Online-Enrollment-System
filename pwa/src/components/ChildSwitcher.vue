<script setup>
import { onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'

const studentStore = useStudentStore()

onMounted(() => {
  studentStore.fetchChildren()
})
</script>

<template>
  <div class="mb-5">
    <div v-if="studentStore.loading" class="flex items-center justify-center gap-2 text-xs font-bold text-[#64748b] py-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
      <svg class="animate-spin h-4 w-4 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Loading student profiles...</span>
    </div>

    <div v-else-if="studentStore.error" class="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold">
      {{ studentStore.error }}
    </div>

    <div v-else-if="studentStore.children.length === 0" class="p-5 bg-white border border-[#e2e8f0] rounded-2xl text-center shadow-sm">
      <div class="w-10 h-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-full flex items-center justify-center mx-auto mb-2.5 text-[#64748b]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <p class="text-sm font-extrabold text-[#0f172a]">No student profiles linked yet</p>
      <p class="text-xs text-[#64748b] mt-1">Please contact AAA Academy admin or enroll your child below to link accounts.</p>
    </div>

    <div v-else class="space-y-2.5">
      <div class="flex items-center justify-between text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider px-1">
        <span>Active Child Selector</span>
        <span class="text-[#0284c7] font-extrabold bg-[#f0f9ff] px-2 py-0.5 rounded-full border border-[#0ea5e9]/20">
          {{ studentStore.children.length }} {{ studentStore.children.length === 1 ? 'Student Linked' : 'Students Linked' }}
        </span>
      </div>

      <div class="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x">
        <button
          v-for="child in studentStore.children"
          :key="child.id"
          @click="studentStore.selectStudent(child.id)"
          :class="[
            'flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all flex-shrink-0 snap-start text-left cursor-pointer transform active:scale-95 shadow-sm min-w-[220px]',
            (studentStore.selectedStudentId === child.id || (studentStore.selectedStudent && studentStore.selectedStudent.id === child.id))
              ? 'bg-[#f0f9ff] border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20 shadow-md'
              : 'bg-white border-[#e2e8f0] hover:border-[#0ea5e9]/50 hover:bg-[#f8fafc]'
          ]"
        >
          <div class="flex items-center gap-3">
            <!-- Avatar pill -->
            <div :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm',
              (studentStore.selectedStudentId === child.id || (studentStore.selectedStudent && studentStore.selectedStudent.id === child.id))
                ? 'bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white'
                : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b]'
            ]">
              {{ child.name ? child.name.charAt(0).toUpperCase() : 'S' }}
            </div>

            <div>
              <div class="text-sm font-extrabold leading-tight text-[#0f172a]">{{ child.name }}</div>
              <div class="text-[11px] font-bold text-[#64748b] flex items-center gap-1.5 mt-0.5">
                <span>{{ child.level || child.programName || 'Student' }}</span>
                <span v-if="child.branchId" class="w-1.5 h-1.5 bg-[#0ea5e9] rounded-full"></span>
                <span v-if="child.branchId" class="uppercase text-[10px] text-[#0284c7] font-extrabold bg-white px-1.5 py-0.5 rounded border border-[#e2e8f0]">{{ child.branchId }}</span>
              </div>
            </div>
          </div>

          <!-- Active check icon / status -->
          <div v-if="studentStore.selectedStudentId === child.id || (studentStore.selectedStudent && studentStore.selectedStudent.id === child.id)" class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <div v-else class="w-6 h-6 rounded-full border border-[#e2e8f0] bg-[#f8fafc] flex-shrink-0"></div>
        </button>
      </div>
    </div>
  </div>
</template>
