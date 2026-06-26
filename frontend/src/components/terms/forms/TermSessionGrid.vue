<script setup>
import { computed } from 'vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getProgramProfileURL, getImageUrl } from '@/utils/assetHelper'
import { calculateSessionDate } from '@/utils/sessionHelper'

const props = defineProps({
  program: { type: Object, default: null },
  programName: { type: String, default: '' },
  activeBranch: { type: Object, default: null },
  term: { type: Object, default: () => ({}) },
  schedule: { type: Object, default: null },
  termProgress: { type: Number, default: 0 },
  filteredTeachers: { type: Array, default: () => [] },
  conflictMessage: { type: String, default: '' },
  responsibleTeachers: { type: Array, default: () => [] },
  localData: { type: Object, default: () => ({}) },
  currentOffering: { type: Object, default: null }
})

const emit = defineEmits(['teacher-change'])

const getSessionTeacherIds = (weekIndex) => {
  const sessionData = (props.currentOffering?.sessionTeachers || [])[weekIndex]
  if (!sessionData) return []
  if (sessionData.teachers && Array.isArray(sessionData.teachers)) {
    return sessionData.teachers.map((t) => t?.id).filter(Boolean)
  }
  if (Array.isArray(sessionData)) {
    return sessionData.map((t) => t?.id).filter(Boolean)
  }
  return sessionData.id ? [sessionData.id] : []
}

const handleTeacherChange = (weekIndex, teacherIds) => {
  emit('teacher-change', weekIndex, teacherIds)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Class Identity Panel -->
    <div class="bg-primary-soft rounded-md p-8 border border-primary/60 relative overflow-hidden">
      <!-- Abstract Background Shape -->
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
        <div class="flex items-center gap-6">
          <div
            class="w-20 h-20 rounded-xl bg-white shadow-xl shadow-primary/5 border border-outline-std p-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
          >
            <img
              :src="getProgramProfileURL(program?.profileURL, program?.category)"
              class="w-full h-full object-contain"
            />
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-3">
              <AppBadge
                v-if="activeBranch"
                :status="activeBranch.name"
                size="md"
                :type="activeBranch.color"
              />
              <span class="text-xs font-bold text-content-muted">{{ term.name }}</span>
            </div>
            <h2 class="text-2xl font-bold text-content-dark mt-2">{{ programName }}</h2>
            <div class="flex items-center gap-4 mt-3">
              <div class="flex items-center gap-2">
                <AppBadge :status="schedule?.day || 'TBA'" size="md" type="day" />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-content-dark">{{
                  schedule?.time || 'TBA'
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex items-center gap-8 bg-white p-6 rounded-3xl border border-outline-std/60 shadow-sm justify-center flex-1 lg:flex-none"
        >
          <div class="flex flex-col items-center px-4 border-r border-outline-std/50">
            <span class="text-xs font-semibold text-content-muted mb-1">Total Sessions</span>
            <span class="text-xl font-bold text-content-dark">{{ term.totalSessions || 0 }}</span>
          </div>
          <div class="flex flex-col items-center pr-4">
            <span class="text-xs font-semibold text-content-muted mb-2">Term Progress</span>
            <div class="flex gap-1.5">
              <div
                v-for="i in term.totalSessions || 0"
                :key="i"
                class="w-4 h-2 rounded-full transition-all duration-700"
                :class="
                  i <= termProgress
                    ? 'bg-primary shadow-sm shadow-primary/50'
                    : 'bg-outline-std/40'
                "
              ></div>
            </div>
            <span class="text-xs font-semibold text-primary mt-2"
              >{{ termProgress }} of {{ term.totalSessions || 0 }} Sessions Completed</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Assignment Controls Header -->
    <div class="flex items-center justify-between">
      <div class="flex flex-col">
        <h4 class="text-sm font-bold text-content-dark">Session Assignments</h4>
        <p class="text-xs font-bold text-content-muted">
          Showing only specialists for
          <span class="text-primary font-bold">{{ programName }}</span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex">
          <img
            v-for="t in filteredTeachers.slice(0, 3)"
            :key="t.id"
            :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')"
            class="w-7 h-7 rounded-full border-2 border-white shadow-sm"
          />
          <div
            v-if="filteredTeachers.length > 3"
            class="w-7 h-7 rounded-full bg-surface-subtle border-2 border-white flex items-center justify-center text-xs font-bold text-content-muted"
          >
            +{{ filteredTeachers.length - 3 }}
          </div>
        </div>
        <span class="text-xs font-semibold text-content-muted/60">Available Experts</span>
      </div>
    </div>

    <AppAlert
      v-if="conflictMessage"
      type="error"
      class="mb-6 w-full animate-in fade-in slide-in-from-top-2"
    >
      {{ conflictMessage }}
    </AppAlert>

    <!-- Sessions Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="i in term.totalSessions || 0"
        :key="i"
        class="flex flex-col gap-4 p-6 bg-white rounded-lg border border-outline-std shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group/session relative overflow-hidden"
        :class="i <= termProgress ? 'bg-surface-subtle/20 opacity-80' : ''"
      >
        <!-- Background Decoration -->
        <div
          class="absolute -top-2 -right-2 text-6xl font-bold text-surface-subtle/5 select-none transition-all group-hover/session:text-primary/5"
        >
          {{ i }}
        </div>

        <div class="flex items-center justify-between relative z-10">
          <div class="flex items-center gap-2.5">
            <span
              class="w-2 h-2 rounded-full transition-all duration-500"
              :class="
                i === termProgress + 1
                  ? 'bg-primary animate-pulse shadow-sm shadow-primary/60'
                  : 'bg-outline-std'
              "
            ></span>
            <span
              class="text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
              :class="
                i <= termProgress
                  ? 'bg-surface-subtle text-content-muted'
                  : 'bg-primary-soft text-primary'
              "
            >
              Week {{ i }}
            </span>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-xs font-semibold text-content-dark leading-none">
              {{
                calculateSessionDate(
                  localData?.startDate || term?.startDate,
                  currentOffering?.schedule?.day,
                  i,
                )
              }}
            </span>
            <span class="text-xs font-semibold text-content-muted/40 leading-none mt-1"
              >Session {{ i }}</span
            >
            <span v-if="i <= termProgress" class="text-xs font-semibold text-green-500/60 mt-1"
              >Past Session</span
            >
          </div>
        </div>

        <div class="flex flex-col gap-3 mt-2 relative z-10">
          <div class="flex items-center justify-between ml-1">
            <span class="text-xs font-semibold text-content-muted">Assign Teacher</span>
            <span
              v-if="getSessionTeacherIds(i - 1).length > 0"
              class="text-xs font-semibold text-green-500 flex items-center gap-1"
            >
              <span class="w-1 h-1 rounded-full bg-green-500"></span> Assigned
            </span>
            <span
              v-else-if="responsibleTeachers.length > 0"
              class="text-xs font-semibold text-primary/60 flex items-center gap-1"
            >
              <span class="w-1 h-1 rounded-full bg-primary/40"></span> Default Specialist
            </span>
          </div>

          <AppSelect
            :modelValue="
              getSessionTeacherIds(i - 1).length > 0
                ? getSessionTeacherIds(i - 1)
                : responsibleTeachers.map((t) => t?.id).filter(Boolean)
            "
            :items="filteredTeachers"
            placeholder="Select Specialists..."
            :multiple="true"
            size="lg"
            class="!bg-surface-subtle/30 !rounded-xl border-outline-std group-hover/session:border-primary/30 transition-colors"
            @change="(val) => handleTeacherChange(i - 1, val)"
          >
            <template #item="{ item: t }">
              <div class="flex items-center gap-4 py-1">
                <div class="relative">
                  <img
                    :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                    class="w-10 h-10 rounded-xl shadow-sm"
                  />
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-content-dark">{{ t.name }}</span>
                </div>
              </div>
            </template>
          </AppSelect>
        </div>
      </div>
    </div>
  </div>
</template>
