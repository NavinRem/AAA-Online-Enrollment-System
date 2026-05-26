<script setup>
import { computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import { useDataStore } from '@/stores/dataStore'
import { getImageUrl, getProgramProfileURL } from '@/utils/assetHelper'
import { calculateClassProgress } from '@/utils/formatUtils'
import AppBadge from '../common/ui/AppBadge.vue'

const dataStore = useDataStore()

const props = defineProps({
  isOpen: Boolean,
  term: {
    type: Object,
    required: true,
  },
  offeringId: [String, Number],
  programId: [String, Number],
  programName: String,
  schedule: Object,
  teachers: {
    type: Array,
    default: () => [],
  },
  activeBranch: Object,
})

const emit = defineEmits(['close', 'update-teacher'])

const filteredTeachers = computed(() => {
  if (!props.programId) return props.teachers
  return props.teachers.filter((t) =>
    (t.programIds || []).some((pid) => String(pid) === String(props.programId)),
  )
})

const currentOffering = computed(() => {
  if (!props.term || !props.offeringId) return null
  return (props.term.offerings || []).find((o) => o.offeringId === props.offeringId)
})

const program = computed(() => {
  if (!props.programId) return null
  return dataStore.programs.find((p) => String(p.id) === String(props.programId))
})

const responsibleTeachers = computed(() => {
  if (!currentOffering.value) return []
  return (currentOffering.value.teacherIds || [])
    .map((tid) => {
      return props.teachers.find((t) => String(t.id) === String(tid))
    })
    .filter(Boolean)
})

const termProgress = computed(() => {
  if (!props.term || !props.term.totalSessions) return 0
  const progress = calculateClassProgress(props.term.startDate, props.term.endDate)
  // Convert percentage to number of dots
  const completedSessions = Math.round((progress.percentage / 100) * props.term.totalSessions)
  return completedSessions || 0
})

const handleTeacherChange = (weekIndex, teacherId) => {
  emit('update-teacher', {
    offeringId: props.offeringId,
    weekIndex,
    teacherId,
  })
}
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="`Session Management: ${programName}`"
    maxWidth="1000px"
    @close="$emit('close')"
  >
    <template #header>
      <div class="flex flex-col">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-outline-std p-2 overflow-hidden"
          >
            <img
              :src="getProgramProfileURL(program?.profileURL, program?.category)"
              class="w-full h-full object-contain"
            />
          </div>
          <div class="flex flex-col">
            <h3 class="text-xl font-black text-content-dark leading-tight uppercase tracking-tight">
              Weekly Faculty Assignment
            </h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm font-bold text-primary">{{ programName }}</span>
              <span class="text-xs font-bold text-content-muted/40">•</span>
              <span class="text-xs font-bold text-content-muted">
                {{ schedule?.day }} {{ schedule?.time }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-8 py-4">
      <!-- Class Identity Panel -->
      <div
        class="bg-primary-soft rounded-2xl p-8 border border-primary/60 relative overflow-hidden"
      >
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
                  <AppBadge :status="schedule?.day || 'TBA'" size="md" type="blue" />
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
              <span class="text-4xs font-black text-content-muted uppercase tracking-widest mb-1"
                >Total Sessions</span
              >
              <span class="text-xl font-black text-content-dark">{{
                term.totalSessions || 0
              }}</span>
            </div>
            <div class="flex flex-col items-center pr-4">
              <span class="text-4xs font-black text-content-muted uppercase tracking-widest mb-2"
                >Term Progress</span
              >
              <div class="flex gap-1.5">
                <div
                  v-for="i in term.totalSessions || 0"
                  :key="i"
                  class="w-4 h-2 rounded-full transition-all duration-700"
                  :class="
                    i <= termProgress
                      ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]'
                      : 'bg-outline-std/40'
                  "
                ></div>
              </div>
              <span class="text-5xs font-black text-primary mt-2 uppercase tracking-tighter"
                >{{ termProgress }} of {{ term.totalSessions || 0 }} Sessions Completed</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment Controls Header -->
      <div class="flex items-center justify-between px-2 mt-4">
        <div class="flex flex-col">
          <h4 class="text-sm font-black text-content-dark uppercase tracking-wider">
            Session Assignments
          </h4>
          <p class="text-xs font-bold text-content-muted mt-1">
            Showing only specialists for
            <span class="text-primary font-black">{{ programName }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex -space-x-2">
            <img
              v-for="t in filteredTeachers.slice(0, 3)"
              :key="t.id"
              :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')"
              class="w-7 h-7 rounded-full border-2 border-white shadow-sm"
            />
            <div
              v-if="filteredTeachers.length > 3"
              class="w-7 h-7 rounded-full bg-surface-subtle border-2 border-white flex items-center justify-center text-4xs font-black text-content-muted"
            >
              +{{ filteredTeachers.length - 3 }}
            </div>
          </div>
          <span class="text-4xs font-black text-content-muted/60 uppercase tracking-widest"
            >Available Experts</span
          >
        </div>
      </div>

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
            class="absolute -top-2 -right-2 text-6xl font-black text-surface-subtle/5 select-none transition-all group-hover/session:text-primary/5"
          >
            {{ i }}
          </div>

          <div class="flex items-center justify-between relative z-10">
            <div class="flex items-center gap-2.5">
              <span
                class="w-2 h-2 rounded-full transition-all duration-500"
                :class="
                  i === termProgress + 1
                    ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.6)]'
                    : 'bg-outline-std'
                "
              ></span>
              <span
                class="text-4xs font-black px-3.5 py-1.5 rounded-lg uppercase tracking-wider shadow-sm transition-colors"
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
              <span
                class="text-5xs font-black text-content-muted/40 uppercase tracking-widest leading-none"
                >Session {{ i }}</span
              >
              <span
                v-if="i <= termProgress"
                class="text-5xs font-black text-green-500/60 uppercase mt-1"
                >Past Session</span
              >
            </div>
          </div>

          <div class="flex flex-col gap-3 mt-2 relative z-10">
            <div class="flex items-center justify-between ml-1">
              <span class="text-4xs font-black text-content-muted uppercase tracking-[0.15em]"
                >Assign Faculty</span
              >
              <span
                v-if="(currentOffering?.sessionTeachers || [])[i - 1]"
                class="text-5xs font-black text-green-500 uppercase flex items-center gap-1"
              >
                <span class="w-1 h-1 rounded-full bg-green-500"></span> Assigned
              </span>
              <span
                v-else-if="responsibleTeachers.length > 0"
                class="text-5xs font-black text-primary/60 uppercase flex items-center gap-1"
              >
                <span class="w-1 h-1 rounded-full bg-primary/40"></span> Default Specialist
              </span>
            </div>

            <AppSelect
              :modelValue="
                (currentOffering?.sessionTeachers || [])[i - 1]?.id || responsibleTeachers[0]?.id
              "
              :items="filteredTeachers"
              placeholder="Select Specialist..."
              size="lg"
              class="!bg-surface-subtle/30 !rounded-xl border-outline-std group-hover/session:border-primary/30 transition-colors"
              @change="(val) => handleTeacherChange(i - 1, val)"
            >
              <template #selected="{ item: t }">
                <div v-if="t" class="flex items-center gap-3 py-1">
                  <div class="relative">
                    <img
                      :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                      class="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                    />
                    <div
                      class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"
                    ></div>
                  </div>
                  <div class="flex flex-col">
                    <span
                      class="text-xs font-black text-content-dark truncate max-w-36 leading-tight"
                      >{{ t.name }}</span
                    >
                    <span class="text-5xs font-bold text-primary uppercase tracking-tighter"
                      >{{ t.branchAbbr || 'HQ' }} Specialist</span
                    >
                  </div>
                </div>
                <div v-else class="flex items-center gap-2 py-1 opacity-60 italic">
                  <span class="text-xs font-bold text-content-muted">No instructor assigned</span>
                </div>
              </template>
              <template #item="{ item: t }">
                <div class="flex items-center gap-4 py-1">
                  <div class="relative">
                    <img
                      :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                      class="w-10 h-10 rounded-xl shadow-sm"
                    />
                    <div
                      class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"
                    ></div>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-black text-content-dark">{{ t.name }}</span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span
                        class="text-4xs font-bold text-content-muted uppercase tracking-wider bg-surface-subtle px-2 py-0.5 rounded"
                        >{{ t.branchAbbr || 'HQ' }}</span
                      >
                      <span class="text-4xs font-bold text-primary italic">Expert</span>
                    </div>
                  </div>
                </div>
              </template>
            </AppSelect>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full px-2">
        <div class="flex items-center gap-4 text-content-muted">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span class="text-4xs font-black uppercase tracking-wider">Auto-Saved</span>
          </div>
          <span class="text-xs font-bold italic opacity-60"
            >Faculty list is restricted to specialists for this program.</span
          >
        </div>
        <div class="flex items-center gap-3">
          <AppButton variant="ghost" size="md" @click="$emit('close')">
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
           
            @click="$emit('close')"
          >
            Finish
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.scrollable-v::-webkit-scrollbar {
  width: 6px;
}

.scrollable-v::-webkit-scrollbar-track {
  background: transparent;
}

.scrollable-v::-webkit-scrollbar-thumb {
  @apply bg-outline-std/50 rounded-full hover:bg-outline-std;
}
</style>
