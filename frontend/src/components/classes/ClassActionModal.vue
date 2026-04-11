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
        <div
          class="flex flex-col gap-xs"
          :class="{ 'group is-error': isSubmittingAttempted && errors.sourceTermId }"
        >
          <label class="text-xs font-black uppercase text-content-muted tracking-widest"
            >Source Term (Reference)</label
          >
          <AppSelect
            v-model="localData.sourceTermId"
            :items="sortedTerms"
            placeholder="Copy from..."
          />
          <div
            v-if="isSubmittingAttempted && errors.sourceTermId"
            class="text-error text-3xs font-black px-1 mt-1 uppercase"
          >
            {{ errors.sourceTermId }}
          </div>
        </div>
        <div
          class="flex flex-col gap-xs"
          :class="{ 'group is-error': isSubmittingAttempted && errors.targetTermId }"
        >
          <label class="text-xs font-black uppercase text-content-muted tracking-widest"
            >Target Term (Destination)</label
          >
          <AppSelect
            v-model="localData.targetTermId"
            :items="sortedTerms"
            placeholder="New term..."
          />
          <div
            v-if="isSubmittingAttempted && errors.targetTermId"
            class="text-error text-3xs font-black px-1 mt-1 uppercase"
          >
            {{ errors.targetTermId }}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-xs">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Branch Filter (Optional)</label
        >
        <AppSelect
          v-model="localData.branchId"
          :items="branches"
          placeholder="-- All Active Branches --"
        />
      </div>

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
    >
      <div
        class="flex flex-col gap-xs mb-sm col-span-2"
        :class="{ 'group is-error': isSubmittingAttempted && errors.programId }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Master Program Model <span class="text-error">*</span></label
        >
        <AppSelect
          v-model="localData.programId"
          :items="programs"
          placeholder="Select Program Catalog..."
          @change="onProgramChange"
        />
        <div
          v-if="isSubmittingAttempted && errors.programId"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.programId }}
        </div>
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.termId }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Academic Term <span class="text-error">*</span></label
        >
        <AppSelect v-model="localData.termId" :items="sortedTerms" placeholder="Term..." />
        <div
          v-if="isSubmittingAttempted && errors.termId"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.termId }}
        </div>
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.branchId }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Branch Location <span class="text-error">*</span></label
        >
        <AppSelect v-model="localData.branchId" :items="branches" placeholder="Branch..." />
        <div
          v-if="isSubmittingAttempted && errors.branchId"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.branchId }}
        </div>
      </div>

      <div class="col-span-2 flex items-center gap-md py-2 opacity-50 mt-sm">
        <div class="h-px bg-border flex-1"></div>
        <span class="text-3xs font-black uppercase tracking-[2px] text-content-muted"
          >Scheduling & Personnel</span
        >
        <div class="h-px bg-border flex-1"></div>
      </div>

      <div class="flex flex-col gap-xs col-span-2">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest opacity-60"
          >Program Master Templates</label
        >
        <AppSelect
          v-model="selectedScheduleId"
          :items="programSchedules"
          placeholder="Autofill from master template..."
          @change="onScheduleTemplatePick"
        />
        <p class="text-3xs text-primary/60 mt-1 font-bold italic tracking-tight">
          Selecting a template will synchronize the Day and Timeslot fields automatically.
        </p>
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.day }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Instruction Day <span class="text-error">*</span></label
        >
        <AppSelect
          v-model="localData.day"
          :items="
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
              (d) => ({ id: d, name: d }),
            )
          "
          :searchable="false"
        />
        <div
          v-if="isSubmittingAttempted && errors.day"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.day }}
        </div>
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.timeslot }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Time Window <span class="text-error">*</span></label
        >
        <input
          type="text"
          v-model="localData.timeslot"
          placeholder="e.g. 10:30 - 12:00"
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-black outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft group-[.is-error]:border-error group-[.is-error]:bg-error-soft group-[.is-error]:ring-error/10"
        />
        <div
          v-if="isSubmittingAttempted && errors.timeslot"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.timeslot }}
        </div>
      </div>

      <div class="flex flex-col gap-xs col-span-2">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Assigned Instructor</label
        >
        <AppSelect
          v-model="localData.teacherId"
          :items="teachers"
          placeholder="Search teacher registry..."
        />
      </div>

      <div class="col-span-2 flex items-center gap-md py-2 opacity-50 mt-sm">
        <div class="h-px bg-border flex-1"></div>
        <span class="text-3xs font-black uppercase tracking-[2px] text-content-muted"
          >Economic Overrides</span
        >
        <div class="h-px bg-border flex-1"></div>
      </div>

      <div class="flex flex-col gap-xs">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Instance Price ($)</label
        >
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted font-bold"
            >$</span
          >
          <input
            type="number"
            v-model="localData.price"
            step="0.01"
            class="w-full pl-9 pr-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-black outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
          />
        </div>
      </div>

      <div class="flex flex-col gap-xs">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Max Load</label
        >
        <input
          type="number"
          v-model="localData.capacity"
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-black outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
        />
      </div>

      <div class="flex flex-col gap-xs">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Logical Status</label
        >
        <AppSelect
          v-model="localData.status"
          :items="[
            { id: 'open', name: 'Open (Active)' },
            { id: 'close', name: 'Closed (Hidden)' },
          ]"
          :searchable="false"
        />
      </div>

      <div class="flex flex-col gap-xs">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Scheduling Strategy</label
        >
        <AppSelect
          v-model="localData.scheduleType"
          :items="[
            { id: 'fix', name: 'Fixed Slot' },
            { id: 'flexible', name: 'Flexible / Private' },
          ]"
          :searchable="false"
        />
      </div>

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
          :class="{ 'button-disabled-visual': !isFormValid || (type === 'edit' && !isChanged) }"
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
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { branchService } from '@/services/branchService'
import { userService } from '@/services/userService'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'duplicate'
  classInstance: Object,
  loading: Boolean,
})

const emit = defineEmits(['close', 'submit'])

const localData = ref({
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

const originalData = ref({})
const initialDataString = ref('')
const isSubmittingAttempted = ref(false)

const syncData = () => {
  if (props.type === 'edit' && props.classInstance) {
    const data = { ...props.classInstance }
    localData.value = data
    originalData.value = { ...data }
    initialDataString.value = JSON.stringify(data)
  } else {
    localData.value = {
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
    }
    initialDataString.value = JSON.stringify(localData.value)
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      syncData()
      isSubmittingAttempted.value = false
    }
  },
)

const errors = computed(() => {
  const d = localData.value
  const errs = {}
  if (props.type === 'duplicate') {
    if (!d.sourceTermId) errs.sourceTermId = 'Select source'
    if (!d.targetTermId) errs.targetTermId = 'Select destination'
  } else {
    if (!d.programId) errs.programId = 'Catalog entry required'
    if (!d.termId) errs.termId = 'Term required'
    if (!d.branchId) errs.branchId = 'Branch required'
    if (!d.day) errs.day = 'Day required'
    if (!d.timeslot?.trim()) errs.timeslot = 'Window required'
  }
  return errs
})

const isFormValid = computed(() => Object.keys(errors.value).length === 0)
const isChanged = computed(() => JSON.stringify(localData.value) !== initialDataString.value)

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
  fetchProgramSchedules()
}

const onScheduleTemplatePick = (scheduleId) => {
  const schedule = programSchedules.value.find((s) => s.id === scheduleId)
  if (schedule) {
    const [day, time] = schedule.name.split(' (')
    localData.value.day = day
    localData.value.timeslot = time.replace(')', '')
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
  isSubmittingAttempted.value = true
  if (!isFormValid.value || (props.type === 'edit' && !isChanged.value)) return
  emit('submit', { ...localData.value })
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
