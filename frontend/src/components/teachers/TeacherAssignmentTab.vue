<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { termService } from '@/services/termService'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { calculateSessionDate } from '@/utils/sessionHelper'
import { calculateClassProgress } from '@/utils/formatUtils'

const props = defineProps({
  teacher: {
    type: Object,
    required: false,
    default: null,
  },
  qualifiedProgramIds: {
    type: Array,
    default: () => [],
  },
})

const TERM_COLORS = ['blue', 'green', 'purple', 'magenta']

const activeTerms = ref([])
const selectedTermId = ref('all')
const allOfferings = ref([])
const loading = ref(true)
const termDropdownOpen = ref(false)
const termDropdownRef = ref(null)
const error = ref('')

const handleOutsideClick = (e) => {
  if (termDropdownRef.value && !termDropdownRef.value.contains(e.target)) {
    termDropdownOpen.value = false
  }
}

// Track local session teacher assignments per offering
// Key: `${termId}_${offeringId}`, Value: array of sessionTeachers
const sessionTeachersMap = ref(new Map())
const originalSessionTeachersMap = ref(new Map())

const fetchData = async () => {
  if (!props.teacher?.id) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const terms = await termService.getAllTerms()
    const active = (terms || []).filter((t) => {
      const progress = calculateClassProgress(t.startDate, t.endDate, null, null, t.totalSessions)
      return progress.status !== 'archived' && progress.status !== 'completed'
    })
    activeTerms.value = active

    const offeringsList = []
    active.forEach((term) => {
      ;(term.offerings || []).forEach((offering) => {
        const programId = offering.program?.id || offering.programId || offering.classId
        const matchesProgram =
          !props.qualifiedProgramIds ||
          props.qualifiedProgramIds.length === 0 ||
          props.qualifiedProgramIds.some(
            (id) =>
              String(id) === String(programId) ||
              String(id) === String(offering.classId) ||
              String(id) === String(offering.program?.programId),
          )

        if (matchesProgram) {
          const key = `${term.id}_${offering.offeringId}`
          const totalSessions = term.totalSessions || 12
          const existingSessions = [...(offering.sessionTeachers || [])]
          while (existingSessions.length < totalSessions) {
            existingSessions.push(null)
          }

          // Clone for local editing and original comparison
          sessionTeachersMap.value.set(key, JSON.parse(JSON.stringify(existingSessions)))
          originalSessionTeachersMap.value.set(key, JSON.parse(JSON.stringify(existingSessions)))

          offeringsList.push({
            termId: term.id,
            termName: term.name,
            termColor: TERM_COLORS[active.indexOf(term) % TERM_COLORS.length],
            termStartDate: term.startDate,
            termTotalSessions: totalSessions,
            key,
            ...offering,
          })
        }
      })
    })
    allOfferings.value = offeringsList
  } catch (err) {
    error.value = 'Failed to load active term offerings'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const termOptions = computed(() => [
  { id: 'all', name: 'All Active Terms' },
  ...activeTerms.value.map((t, idx) => ({
    id: t.id,
    name: t.name,
    badgeStatus: t.name,
    type: TERM_COLORS[idx % TERM_COLORS.length],
  })),
])

const filteredOfferings = computed(() => {
  if (selectedTermId.value === 'all') return allOfferings.value
  return allOfferings.value.filter((o) => String(o.termId) === String(selectedTermId.value))
})

const isTeacherAssignedToSession = (offeringKey, weekIndex) => {
  const sessions = sessionTeachersMap.value.get(offeringKey) || []
  const st = sessions[weekIndex]
  if (!st) return false
  if (st.teachers && Array.isArray(st.teachers)) {
    return st.teachers.some((t) => t && String(t.id) === String(props.teacher?.id))
  }
  if (Array.isArray(st)) {
    return st.some((t) => t && String(t.id) === String(props.teacher?.id))
  }
  return st && String(st.id) === String(props.teacher?.id)
}

const toggleSessionAssignment = (offering, weekIndex) => {
  const key = offering.key
  const sessions = sessionTeachersMap.value.get(key) || []
  const st = sessions[weekIndex]
  const currentAssigned = isTeacherAssignedToSession(key, weekIndex)

  let teacherList = []
  if (st && st.teachers && Array.isArray(st.teachers)) {
    teacherList = [...st.teachers]
  } else if (Array.isArray(st)) {
    teacherList = [...st]
  } else if (st && st.id) {
    teacherList = [st]
  }

  if (currentAssigned) {
    teacherList = teacherList.filter((t) => t && String(t.id) !== String(props.teacher.id))
  } else {
    teacherList.push({
      id: props.teacher.id,
      name: props.teacher.name,
      profileURL: props.teacher.profileURL,
    })
  }

  sessions[weekIndex] = { teachers: teacherList }
  sessionTeachersMap.value.set(key, [...sessions])
}

const assignAllSessions = (offering) => {
  const key = offering.key
  const total = offering.termTotalSessions || 12
  const sessions = sessionTeachersMap.value.get(key) || []
  for (let i = 0; i < total; i++) {
    if (!isTeacherAssignedToSession(key, i)) {
      let st = sessions[i]
      let teacherList = st && st.teachers && Array.isArray(st.teachers) ? [...st.teachers] : []
      teacherList.push({
        id: props.teacher.id,
        name: props.teacher.name,
        profileURL: props.teacher.profileURL,
      })
      sessions[i] = { teachers: teacherList }
    }
  }
  sessionTeachersMap.value.set(key, [...sessions])
}

const clearAllSessions = (offering) => {
  const key = offering.key
  const total = offering.termTotalSessions || 12
  const sessions = sessionTeachersMap.value.get(key) || []
  for (let i = 0; i < total; i++) {
    let st = sessions[i]
    if (st && st.teachers && Array.isArray(st.teachers)) {
      sessions[i] = {
        teachers: st.teachers.filter((t) => t && String(t.id) !== String(props.teacher.id)),
      }
    } else {
      sessions[i] = { teachers: [] }
    }
  }
  sessionTeachersMap.value.set(key, [...sessions])
}

// Conflict Detection: check if assigning this teacher to session weekIndex overlaps with another class session
const getSessionConflict = (offering, weekIndex) => {
  if (!isTeacherAssignedToSession(offering.key, weekIndex)) return null
  if (!offering.schedule?.day || !offering.schedule?.time) return null

  for (const other of allOfferings.value) {
    if (other.key === offering.key) continue
    if (isTeacherAssignedToSession(other.key, weekIndex)) {
      if (
        String(other.schedule?.day).toLowerCase() ===
          String(offering.schedule?.day).toLowerCase() &&
        String(other.schedule?.time) === String(offering.schedule?.time)
      ) {
        if (
          String(other.branchId || other.branch?.id) !==
          String(offering.branchId || offering.branch?.id)
        ) {
          return {
            type: 'Branch Conflict',
            message: `Overlapping session at ${other.branch?.name || other.branch?.abbr || 'another branch'} (${other.program?.name})`,
          }
        }
        return {
          type: 'Schedule Conflict',
          message: `Overlapping session with ${other.program?.name}`,
        }
      }
    }
  }
  return null
}

const getOfferingConflictSummary = (offering) => {
  const total = offering.termTotalSessions || 12
  for (let i = 0; i < total; i++) {
    const conflict = getSessionConflict(offering, i)
    if (conflict) return conflict
  }
  return null
}

const sessionUpdates = computed(() => {
  const updates = []
  sessionTeachersMap.value.forEach((currentSessions, key) => {
    const orig = originalSessionTeachersMap.value.get(key) || []
    if (JSON.stringify(currentSessions) !== JSON.stringify(orig)) {
      const offering = allOfferings.value.find((o) => o.key === key)
      if (offering) {
        const countTeacherSessions = (arr) =>
          arr.filter((st) => {
            if (!st) return false
            if (st.teachers && Array.isArray(st.teachers))
              return st.teachers.some((t) => t && String(t.id) === String(props.teacher?.id))
            if (Array.isArray(st))
              return st.some((t) => t && String(t.id) === String(props.teacher?.id))
            return st && String(st.id) === String(props.teacher?.id)
          }).length

        const sessionCount = countTeacherSessions(currentSessions)
        const origCount = countTeacherSessions(orig)
        const progName = offering.program?.name || 'Class Schedule'
        let actionLabel = `Updated Sessions: ${progName}`
        let actionType = 'Updated Teacher Class Schedule'
        if (sessionCount > origCount) {
          actionLabel = `Added Class Session: ${progName} (+${sessionCount - origCount})`
          actionType = 'Teacher Class Session Added'
        } else if (sessionCount < origCount) {
          actionLabel = `Removed Class Session: ${progName} (-${origCount - sessionCount})`
          actionType = 'Teacher Class Session Removed'
        }

        updates.push({
          termId: offering.termId,
          termName: offering.termName,
          termColor: offering.termColor,
          offeringId: offering.offeringId,
          programName: progName,
          schedule: offering.schedule,
          branch: offering.branch,
          sessionCount,
          actionLabel,
          actionType,
          sessionTeachers: currentSessions,
        })
      }
    }
  })
  return updates
})

const hasChanges = computed(() => sessionUpdates.value.length > 0)

defineExpose({
  getChanges: () => ({
    adds: [],
    removes: [],
    sessionUpdates: sessionUpdates.value,
  }),
  hasChanges,
})

onMounted(() => {
  fetchData()
  document.addEventListener('mousedown', handleOutsideClick)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})
</script>

<template>
  <div class="flex flex-col gap-6 min-h-72">
    <div
      v-if="loading"
      class="flex-1 flex flex-col items-center justify-center py-20 animate-pulse"
    >
      <div
        class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"
      ></div>
      <span class="text-sm font-bold text-content-muted">Loading active term schedules...</span>
    </div>

    <template v-else>
      <!-- Active Terms Filter Header -->
      <div
        class="flex flex-wrap items-center justify-between gap-4 border-b border-outline-std pb-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-content-dark">Active Term Sessions</span>
          <span
            class="text-sm font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20"
          >
            {{ allOfferings.length }} Classes Available
          </span>
        </div>

        <!-- Term Filter Button -->
        <div class="relative" ref="termDropdownRef">
          <AppButton variant="secondary" size="md" @click="termDropdownOpen = !termDropdownOpen">
            <img :src="getActionIcon('filter')" class="w-4 h-4 flex-shrink-0" />
            <span v-if="selectedTermId === 'all'" class="font-bold truncate max-w-40">
              All Active Terms
            </span>
            <AppBadge
              v-else
              :status="activeTerms.find((t) => t.id === selectedTermId)?.name || 'Active Term'"
              :type="termOptions.find((t) => t.id === selectedTermId)?.type || 'blue'"
              size="xs"
            />
          </AppButton>

          <!-- Dropdown Panel -->
          <div
            v-if="termDropdownOpen"
            class="absolute right-0 top-full mt-1.5 z-50 bg-white border border-outline-std rounded-md shadow-xl min-w-44 py-1.5 overflow-hidden"
          >
            <button
              v-for="opt in termOptions"
              :key="opt.id"
              type="button"
              class="flex items-center gap-2.5 w-full h-10 px-3.5 py-2 text-left text-sm font-semibold hover:bg-surface-subtle/70 transition-colors"
              :class="
                selectedTermId === opt.id ? 'text-primary bg-primary-soft/40' : 'text-content-dark'
              "
              @click="((selectedTermId = opt.id), (termDropdownOpen = false))"
            >
              <span v-if="opt.id === 'all'" class="font-bold">All Active Terms</span>
              <AppBadge
                v-else
                :status="opt.name"
                :type="opt.type || 'blue'"
                size="sm"
              />
            </button>
          </div>
        </div>
      </div>

      <AppAlert v-if="error" type="error" closable @close="error = ''" class="mb-2">{{
        error
      }}</AppAlert>

      <!-- Active Class Offerings List -->
      <div v-if="filteredOfferings.length > 0" class="flex flex-col gap-5">
        <div
          v-for="offering in filteredOfferings"
          :key="offering.key"
          class="flex flex-col rounded-md border border-outline-std bg-white shadow-sm overflow-hidden transition-all"
        >
          <!-- Offering Header -->
          <div
            class="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-subtle/40 border-b border-outline-std/60"
          >
            <div class="flex items-center gap-3.5">
              <div
                class="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-outline-std shadow-sm shrink-0 overflow-hidden p-1"
              >
                <img
                  :src="
                    getProgramProfileURL(
                      offering.program?.profileURL,
                      offering.program?.category?.name || offering.program?.category,
                      offering.program?.category?.profileURL,
                    )
                  "
                  class="w-full h-full object-contain"
                />
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-content-dark">{{
                    offering.program?.name || 'Class Offering'
                  }}</span>
                  <AppBadge
                    :status="offering.branch?.abbr || 'HQ'"
                    size="xs"
                    :type="offering.branch?.color || 'blue'"
                  />
                  <AppBadge
                    :status="offering.termName"
                    size="xs"
                    :type="offering.termColor || 'blue'"
                  />
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <AppBadge :status="offering.schedule?.day || 'TBA'" type="day" size="xs" />
                  <span class="text-sm font-semibold text-content-dark">{{
                    offering.schedule?.time || 'TBA'
                  }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div
                v-if="getOfferingConflictSummary(offering)"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-soft border border-error/20 text-error text-sm font-bold"
              >
                <span>!</span>
                <span>{{ getOfferingConflictSummary(offering).message }}</span>
              </div>

              <AppButton variant="secondary" size="xs" @click="assignAllSessions(offering)">
                Assign All Sessions
              </AppButton>
              <AppButton
                variant="ghost"
                size="xs"
                class="!text-error hover:bg-error-soft"
                @click="clearAllSessions(offering)"
              >
                Clear All
              </AppButton>
            </div>
          </div>

          <!-- Weekly Session Selector Grid -->
          <div
            class="p-4 bg-white grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5"
          >
            <button
              v-for="i in offering.termTotalSessions"
              :key="i"
              type="button"
              @click="toggleSessionAssignment(offering, i - 1)"
              class="flex flex-col items-start p-2.5 rounded-sm border transition-all text-left relative overflow-hidden group"
              :class="
                isTeacherAssignedToSession(offering.key, i - 1)
                  ? getSessionConflict(offering, i - 1)
                    ? 'bg-error-soft/60 border-error text-error shadow-sm'
                    : 'bg-primary-soft/60 border-primary text-primary shadow-sm'
                  : 'bg-white hover:bg-surface-subtle/50 border-outline-std text-content-dark'
              "
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-sm font-bold">Week {{ i }}</span>
                <span
                  class="w-4 h-4 rounded-full flex items-center justify-center text-3xs font-bold border transition-colors"
                  :class="
                    isTeacherAssignedToSession(offering.key, i - 1)
                      ? getSessionConflict(offering, i - 1)
                        ? 'bg-error text-white border-error'
                        : 'bg-primary text-white border-primary'
                      : 'border-outline-std text-transparent'
                  "
                >
                  ✓
                </span>
              </div>
              <span class="text-3xs font-semibold text-content-muted mt-1">
                {{ calculateSessionDate(offering.termStartDate, offering.schedule?.day, i) }}
              </span>
              <span
                v-if="getSessionConflict(offering, i - 1)"
                class="text-4xs font-bold text-error mt-0.5 truncate w-full"
              >
                {{ getSessionConflict(offering, i - 1).type }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-14 rounded-md border border-dashed border-outline-std bg-surface-subtle/20"
      >
        <img :src="getActionIcon('calendar')" class="w-8 h-8 opacity-40 mb-2" />
        <span class="text-sm font-bold text-content-muted"
          >No active classes found for this term</span
        >
      </div>
    </template>
  </div>
</template>
