<script setup>
import { ref, computed, onMounted } from 'vue'
import { teacherService } from '@/services/teacherService'
import { termService } from '@/services/termService'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

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

const assignments = ref([])
const availableOfferings = ref([])
const loading = ref(true)
const pendingAdds = ref([]) // offering objects
const pendingRemoves = ref([]) // offering objects
const error = ref('')

const fetchData = async () => {
  if (!props.teacher?.id) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const [assigned, terms] = await Promise.all([
      teacherService.getAssignments(props.teacher.id),
      termService.getAllTerms(),
    ])
    assignments.value = assigned || []
    pendingAdds.value = []
    pendingRemoves.value = []

    const compatible = []
    terms.forEach((term) => {
      ;(term.offerings || []).forEach((offering) => {
        const programId = offering.program?.id || offering.programId || offering.classId
        const matchesProgram = props.qualifiedProgramIds.some(
          (id) =>
            String(id) === String(programId) ||
            String(id) === String(offering.classId) ||
            String(id) === String(offering.program?.programId),
        )

        const alreadyAssigned = assignments.value.some(
          (a) => String(a.offeringId) === String(offering.offeringId),
        )

        if (matchesProgram && !alreadyAssigned) {
          compatible.push({
            termId: term.id,
            termName: term.name,
            ...offering,
          })
        }
      })
    })
    availableOfferings.value = compatible
  } catch (err) {
    error.value = 'Failed to load assignments'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleAssign = (offering) => {
  pendingAdds.value.push(offering)
}

const handleUnassign = (offering) => {
  const pendingIdx = pendingAdds.value.findIndex((o) => o.offeringId === offering.offeringId)
  if (pendingIdx > -1) {
    pendingAdds.value.splice(pendingIdx, 1)
    return
  }
  pendingRemoves.value.push(offering)
}

const cancelPending = (offeringId) => {
  const addIdx = pendingAdds.value.findIndex((o) => o.offeringId === offeringId)
  if (addIdx > -1) pendingAdds.value.splice(addIdx, 1)

  const removeIdx = pendingRemoves.value.findIndex((o) => o.offeringId === offeringId)
  if (removeIdx > -1) pendingRemoves.value.splice(removeIdx, 1)
}

const hasChanges = computed(() => pendingAdds.value.length > 0 || pendingRemoves.value.length > 0)

const checkConflict = (offering) => {
  if (!offering.schedule?.day || !offering.schedule?.time) return 'invalid'
  const allCurrent = [
    ...assignments.value.filter(
      (a) => !pendingRemoves.value.some((r) => r.offeringId === a.offeringId),
    ),
    ...pendingAdds.value,
  ]
  const conflict = allCurrent.some((a) => {
    return (
      a.offeringId !== offering.offeringId &&
      a.schedule?.day === offering.schedule?.day &&
      a.schedule?.time === offering.schedule?.time
    )
  })
  return conflict ? 'overlap' : false
}

defineExpose({
  getChanges: () => ({
    adds: pendingAdds.value,
    removes: pendingRemoves.value,
  }),
  hasChanges,
})

onMounted(fetchData)
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
      <span class="text-xs font-bold text-content-muted">Synchronizing schedules...</span>
    </div>

    <template v-else>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-sm text-content-muted flex items-center gap-2">
            <span>📅</span> Active Teaching Schedule
          </h3>
          <span
            class="text-xs font-black text-primary bg-primary-soft/50 px-2.5 py-1 rounded-full border border-primary/10"
          >
            {{ assignments.length }} Sessions
          </span>
        </div>

        <div v-if="assignments.length > 0 || pendingAdds.length > 0" class="grid grid-cols-1 gap-3">
          <!-- Existing -->
          <div
            v-for="assign in assignments"
            :key="assign.offeringId"
            class="flex items-center justify-between p-4 rounded-lg bg-white border border-outline-std transition-all shadow-sm group"
            :class="{
              'opacity-50 grayscale border-dashed': pendingRemoves.some(
                (r) => r.offeringId === assign.offeringId,
              ),
            }"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-11 h-11 rounded-xl bg-primary-soft/20 flex items-center justify-center border border-primary/10 shrink-0"
              >
                <span class="text-xl">🏫</span>
              </div>
              <div class="flex flex-col overflow-hidden">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-content-dark truncate">{{
                    assign.program?.name
                  }}</span>
                  <AppBadge
                    :status="assign.branch?.abbr || 'HQ'"
                    size="xs"
                    :type="assign.branch?.color || 'blue'"
                  />
                  <AppBadge
                    v-if="pendingRemoves.some((r) => r.offeringId === assign.offeringId)"
                    status="To be removed"
                    size="xs"
                    type="red"
                  />
                </div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs font-bold text-content-muted">{{
                    assign.schedule?.day
                  }}</span>
                  <span class="text-xs opacity-30">•</span>
                  <span class="text-xs font-black text-primary">{{ assign.schedule?.time }}</span>
                </div>
              </div>
            </div>
            <AppButton
              v-if="!pendingRemoves.some((r) => r.offeringId === assign.offeringId)"
              variant="ghost"
              size="xs"
              class="!text-error font-black hover:bg-error-soft rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              @click="handleUnassign(assign)"
            >
              Unassign
            </AppButton>
            <AppButton
              v-else
              variant="ghost"
              size="xs"
             
              @click="cancelPending(assign.offeringId)"
            >
              Undo
            </AppButton>
          </div>

          <!-- Pending Adds -->
          <div
            v-for="assign in pendingAdds"
            :key="'pending-' + assign.offeringId"
            class="flex items-center justify-between p-4 rounded-lg bg-primary-soft/30 border-2 border-dashed border-primary/40 transition-all shadow-sm"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-primary/10 shrink-0 shadow-inner"
              >
                <span class="text-xl">✨</span>
              </div>
              <div class="flex flex-col overflow-hidden">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-content-dark truncate">{{
                    assign.program?.name
                  }}</span>
                  <AppBadge
                    :status="assign.branch?.abbr || 'HQ'"
                    size="xs"
                    :type="assign.branch?.color || 'blue'"
                  />
                </div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs font-bold text-content-muted">{{
                    assign.schedule?.day
                  }}</span>
                  <span class="text-xs opacity-30">•</span>
                  <span class="text-xs font-black text-primary">{{ assign.schedule?.time }}</span>
                </div>
              </div>
            </div>
            <AppButton
              variant="ghost"
              size="xs"
             
              @click="cancelPending(assign.offeringId)"
            >
              Cancel
            </AppButton>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-outline-std bg-surface-subtle/20"
        >
          <span class="text-3xl opacity-20 mb-3 grayscale">📥</span>
          <span class="text-xs font-bold text-content-muted">No classes assigned yet</span>
          <span class="text-xs text-content-muted/60 mt-1">Assignments will appear here</span>
        </div>
      </div>

      <div class="h-px bg-outline-std/50 mx-2"></div>

      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-sm text-content-muted flex items-center gap-2">
            <span>🔍</span> Compatible Offerings
          </h3>
        </div>

        <AppAlert v-if="error" type="error" closable @close="error = ''" class="mb-2">{{
          error
        }}</AppAlert>

        <div v-if="availableOfferings.length > 0" class="grid grid-cols-1 gap-3">
          <div
            v-for="offering in availableOfferings"
            :key="offering.offeringId"
            class="flex items-center justify-between p-4 rounded-lg bg-surface-subtle/30 border border-transparent hover:border-primary/20 hover:bg-white transition-all group/card"
            :class="{
              'opacity-60 grayscale-[0.5] bg-outline-std/5 pointer-events-none':
                checkConflict(offering) === 'overlap',
              hidden: pendingAdds.some((o) => o.offeringId === offering.offeringId),
            }"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-outline-std shadow-sm group-hover/card:border-primary/20 transition-all shrink-0"
              >
                <img
                  :src="offering.program?.profileURL || getImageUrl('dashboard/card-top-program')"
                  class="w-7 h-7 object-contain"
                />
              </div>
              <div class="flex flex-col overflow-hidden">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-content-dark truncate">{{
                    offering.program?.name
                  }}</span>
                  <AppBadge
                    :status="offering.branch?.abbr || 'HQ'"
                    size="xs"
                    :type="offering.branch?.color || 'neutral'"
                  />
                  <span
                    v-if="checkConflict(offering) === 'overlap'"
                    class="text-xs font-black text-error bg-error-soft px-2 py-0.5 rounded-full tracking-tighter border border-error/10"
                    >Conflict</span
                  >
                  <span
                    v-else-if="checkConflict(offering) === 'invalid'"
                    class="text-xs font-black text-warning bg-warning-soft px-2 py-0.5 rounded-full tracking-tighter border border-warning/10"
                    >Missing</span
                  >
                </div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs font-bold text-content-muted">{{
                    offering.schedule?.day
                  }}</span>
                  <span class="text-xs opacity-30">•</span>
                  <span class="text-xs font-black text-primary">{{ offering.schedule?.time }}</span>
                  <span class="text-xs opacity-30">•</span>
                  <span class="text-xs font-bold text-content-muted tracking-tighter">{{
                    offering.termName
                  }}</span>
                </div>
              </div>
            </div>
            <AppButton
              variant="primary"
              size="xs"
              class="rounded-xl shadow-md shadow-primary/10 font-black px-4"
              @click="handleAssign(offering)"
              :disabled="!!checkConflict(offering)"
            >
              Assign
            </AppButton>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-outline-std bg-surface-subtle/10"
        >
          <span class="text-2xl opacity-20 mb-3 grayscale">🏁</span>
          <span class="text-xs font-bold text-content-muted">No compatible offerings found</span>
        </div>
      </div>
    </template>
  </div>
</template>
