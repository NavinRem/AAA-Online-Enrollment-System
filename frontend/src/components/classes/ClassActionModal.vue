<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    :icon="modalIcon"
    maxWidth="600px"
    @close="$emit('close')"
  >
    <!-- DUPLICATE MODE -->
    <div v-if="type === 'duplicate'" class="flex flex-col gap-lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <AppSelect
          v-model="localData.sourceTermId"
          :items="sortedTerms"
          label="Source Term (Reference)"
          placeholder="Copy from..."
          required
          :error="errors.sourceTermId"
          :shake="shaking.sourceTermId"
          @change="clearError('sourceTermId')"
        />

        <AppSelect
          v-model="localData.targetTermId"
          :items="sortedTerms"
          label="Target Term (Destination)"
          placeholder="New term..."
          required
          :error="errors.targetTermId"
          :shake="shaking.targetTermId"
          @change="clearError('targetTermId')"
        />
      </div>

      <AppSelect
        v-model="localData.branchId"
        :items="branches"
        label="Branch Filter (Optional)"
        placeholder="-- All Active Branches --"
      />

      <AppAlert type="info">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-black tracking-tight uppercase"
            >Batch Propagation Logic</strong
          >
          <p class="text-xs opacity-90 font-medium leading-relaxed">
            This operation clones all class instances from the source term into the destination
            term. Enrollments and attendance records will be initialized to zero.
          </p>
        </div>
      </AppAlert>
    </div>

    <!-- ADD / EDIT MODE -->
    <form
      v-else
      id="classActionForm"
      class="grid grid-cols-2 gap-x-lg gap-y-md"
      @submit.prevent="handleActionSubmit"
      novalidate
    >
      <AppSelect
        v-model="localData.programId"
        :items="programs"
        label="Master Program Model"
        placeholder="Select Program Catalog..."
        class="col-span-2"
        required
        :error="errors.programId"
        :shake="shaking.programId"
        @change="onProgramChange"
      />

      <AppSelect
        v-model="localData.termId"
        :items="sortedTerms"
        label="Academic Term"
        placeholder="Term..."
        required
        :error="errors.termId"
        :shake="shaking.termId"
        @change="clearError('termId')"
      />

      <AppSelect
        v-model="localData.branchId"
        :items="branches"
        label="Branch Location"
        placeholder="Branch..."
        required
        :error="errors.branchId"
        :shake="shaking.branchId"
        @change="clearError('branchId')"
      />

      <div class="col-span-2 flex items-center gap-md py-2 opacity-50 mt-sm">
        <div class="h-px bg-border flex-1"></div>
        <span class="text-3xs font-black uppercase tracking-[2px] text-content-muted"
          >Scheduling & Personnel</span
        >
        <div class="h-px bg-border flex-1"></div>
      </div>

      <AppSelect
        v-model="selectedScheduleId"
        :items="programSchedules"
        label="Program Master Templates"
        placeholder="Autofill from master template..."
        class="col-span-2"
        @change="onScheduleTemplatePick"
      />

      <AppSelect
        v-model="localData.day"
        :items="
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (d) => ({ id: d, name: d }),
          )
        "
        label="Instruction Day"
        required
        :error="errors.day"
        :shake="shaking.day"
        :searchable="false"
        @change="clearError('day')"
      />

      <AppInput
        v-model="localData.timeslot"
        label="Time Window"
        placeholder="e.g. 10:30 - 12:00"
        required
        :error="errors.timeslot"
        :shake="shaking.timeslot"
        @input="clearError('timeslot')"
      />

      <AppSelect
        v-model="localData.teacherId"
        :items="teachers"
        label="Assigned Instructor"
        placeholder="Search teacher registry..."
        class="col-span-2"
      />

      <div class="col-span-2 flex items-center gap-md py-2 opacity-50 mt-sm">
        <div class="h-px bg-border flex-1"></div>
        <span class="text-3xs font-black uppercase tracking-[2px] text-content-muted"
          >Economic Overrides</span
        >
        <div class="h-px bg-border flex-1"></div>
      </div>

      <AppInput
        v-model="localData.price"
        type="number"
        label="Instance Price ($)"
        placeholder="0.00"
        step="0.01"
      />

      <AppInput v-model="localData.capacity" type="number" label="Max Load" placeholder="0" />

      <AppSelect
        v-model="localData.status"
        label="Logical Status"
        :items="[
          { id: 'open', name: 'Open (Active)' },
          { id: 'close', name: 'Closed (Hidden)' },
        ]"
        :searchable="false"
      />

      <AppSelect
        v-model="localData.scheduleType"
        label="Scheduling Strategy"
        :items="[
          { id: 'fix', name: 'Fixed Slot' },
          { id: 'flexible', name: 'Flexible / Private' },
        ]"
        :searchable="false"
      />

      <div class="flex flex-col gap-xs col-span-2">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Administrative Synopsis</label
        >
        <textarea
          v-model="localData.adminNote"
          rows="2"
          placeholder="Private internal record notes..."
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
        ></textarea>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end w-full gap-md">
        <AppButton variant="cancel" @click="$emit('close')">Cancel Entry</AppButton>
        <AppButton
          variant="primary"
          :form="type === 'duplicate' ? null : 'classActionForm'"
          type="submit"
          @click="type === 'duplicate' ? handleActionSubmit() : null"
          :loading="loading"
          :disabled="loading"
          :class="{ 'button-disabled-visual': type === 'edit' && !isDirty }"
        >
          {{ submitLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { branchService } from '@/services/branchService'
import { userService } from '@/services/userService'
import { useActionModal } from '@/composables/useActionModal'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'duplicate'
  classInstance: Object,
  loading: Boolean,
})

const emit = defineEmits(['close', 'submit'])

const getInitialData = () => ({
  programId: '',
  termId: '',
  branchId: '',
  day: '',
  timeslot: '',
  teacherId: '',
  price: 0,
  capacity: 0,
  status: 'open',
  scheduleType: 'fix',
  adminNote: '',
  sourceTermId: '',
  targetTermId: '',
})

const mapSourceToForm = () => {
  if (props.type === 'edit' && props.classInstance) {
    return { ...props.classInstance }
  }
  return getInitialData()
}

const { localData, isDirty, errors, shaking, clearError, submitForm } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    mapSourceToForm,
  },
)

const programs = ref([])
const terms = ref([])
const branches = ref([])
const teachers = ref([])
const programSchedules = ref([])
const selectedScheduleId = ref('')

const sortedTerms = computed(() => [...terms.value].sort((a, b) => b.id.localeCompare(a.id)))

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Engineer Class Instance'
  if (props.type === 'duplicate') return 'Batch Term Propagation'
  return 'Initialize Class Instance'
})

const modalIcon = computed(() => {
  if (props.type === 'edit') return getActionIcon('edit')
  return getActionIcon('plus')
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Update Session'
  if (props.type === 'duplicate') return 'Authorize Propagation'
  return 'Create Session'
})

const fetchProgramSchedules = async () => {
  if (!localData.value.programId) return
  try {
    const schedules = await programService.getProgramSchedules(localData.value.programId)
    programSchedules.value = schedules.map((s) => ({
      id: s.id,
      name: `${s.day} (${s.timeslot})`,
    }))
  } catch (err) {
    console.error(err)
  }
}

const onProgramChange = (programId) => {
  localData.value.programId = programId
  clearError('programId')
  fetchProgramSchedules()
}

const onScheduleTemplatePick = (scheduleId) => {
  const schedule = programSchedules.value.find((s) => s.id === scheduleId)
  if (schedule) {
    const [day, time] = schedule.name.split(' (')
    localData.value.day = day
    localData.value.timeslot = time.replace(')', '')
    clearError('day')
    clearError('timeslot')
  }
}

const fetchData = async () => {
  try {
    const [p, t, b, u] = await Promise.all([
      programService.getAllPrograms(),
      programService.getAllTerms(),
      branchService.getAllBranches(),
      userService.getAllUsers(),
    ])
    programs.value = p || []
    terms.value = t || []
    branches.value = b || []
    teachers.value = u
      .filter((user) => user.role === 'teacher')
      .map((t) => ({ id: t.uid || t.id, name: t.name }))
  } catch (err) {
    console.error(err)
  }
}

const handleActionSubmit = () => {
  const validationRules = {
    required:
      props.type === 'duplicate'
        ? ['sourceTermId', 'targetTermId']
        : ['programId', 'termId', 'branchId', 'day', 'timeslot'],
  }

  if (props.type === 'edit' && !isDirty.value) return

  submitForm(validationRules)
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchData()
      if (localData.value.programId) fetchProgramSchedules()
    }
  },
)
</script>

<style scoped>
/* Scoped styles entirely removed. UI standardizing complete via utility patterns. */
</style>
