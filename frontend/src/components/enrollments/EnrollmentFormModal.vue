<template>
  <AppModal :show="isOpen" @close="$emit('close')"
    :title="isEditMode ? 'Edit Enrollment Record' : 'Create New Enrollment'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')">
    <form id="enrollmentForm" novalidate @submit.prevent="validateAndSubmit" class="flex flex-col gap-lg">
      <div class="grid grid-cols-2 gap-x-lg gap-y-md">
        <!-- Parent Selection -->
        <AppSelect v-model="form.parentId"
          :items="activeParents.map((p) => ({ id: p.uid || p.id, name: p.name, profileURL: p.profileURL }))"
          label="Parent Name" placeholder="Search Active Parent..." required :disabled="isSelectionLocked"
          :error="errors.parentId" :shake="shaking.parentId" @change="selectParent" />

        <!-- Student Selection -->
        <AppSelect v-model="form.studentId"
          :items="availableStudents.map((s) => ({ id: s.id || s.uid, name: s.name, profileURL: s.profileURL }))"
          label="Student Name" placeholder="Search Active Student..." required
          :disabled="!form.parentId || isSelectionLocked" :error="errors.studentId" :shake="shaking.studentId"
          @change="handleStudentChange" @click-disabled="handleDisabledClick('studentId')" />

        <AppSelect v-model="form.programId"
          :items="availableProgramsForStudent.map((p) => ({ id: p.id, name: p.name, profileURL: p.profileURL }))"
          label="Program Name" placeholder="Choose Program..." required class="col-span-2 sm:col-span-1"
          :disabled="!form.studentId" :error="errors.programId" :shake="shaking.programId" @change="handleProgramChange"
          @click-disabled="handleDisabledClick('programId')" />

        <!-- Class Slot Selection -->
        <AppSelect v-model="form.classId" :items="availableClasses.map((cl) => ({
          id: cl.id,
          name: `${cl.day} (${cl.timeslot}) - ${cl.numStudent}/${cl.capacity} enrolled`,
        }))
          " label="Schedule And Branch" placeholder="Select Slot..." required class="col-span-2 sm:col-span-1"
          :disabled="!form.programId" :error="errors.classId" :shake="shaking.classId" @change="clearError('classId')"
          @click-disabled="handleDisabledClick('classId')" />
      </div>

      <!-- Financial & Session Panel -->
      <transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0">
        <div v-if="form.programId && form.classId"
          class="grid grid-cols-1 md:grid-cols-3 gap-xl bg-surface-subtle/50 p-xl rounded-std border-2 border-dashed border-outline-std mt-4">
          <div class="flex flex-col gap-md">
            <span
              class="text-2xs font-black text-content-muted uppercase tracking-[2px] border-b border-outline-std/40 pb-1 mb-1">Operational
              Audit</span>
            <div v-if="sessionInfo" class="flex flex-col gap-md">
              <div class="p-xl rounded-sm border-2 border-outline-std bg-white shadow-sm flex flex-col gap-1">
                <span class="text-3xs text-content-muted font-black uppercase tracking-widest leading-none">Total
                  Units</span>
                <span class="text-2xl font-black text-content-dark tracking-tighter">{{ sessionInfo.total }}
                  sessions</span>
              </div>
              <div class="p-xl rounded-sm border-2 border-primary/20 bg-primary/5 shadow-sm flex flex-col gap-1">
                <span class="text-3xs text-primary font-black uppercase tracking-widest leading-none">Active
                  Payload</span>
                <span class="text-2xl font-black text-primary tracking-tighter italic">{{ sessionInfo.remaining }}
                  remaining</span>
                <span v-if="sessionInfo.passed > 0"
                  class="text-3xs text-content-muted font-bold tracking-tight mt-1">({{ sessionInfo.passed }} sessions
                  elapsed)</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-md bg-white p-xl rounded-sm border-2 border-outline-std shadow-sm">
            <span
              class="text-2xs font-black text-content-muted uppercase tracking-[2px] border-b border-outline-std/40 pb-1 mb-1">Economic
              Adjustments</span>
            <div class="flex flex-col gap-lg">
              <label class="flex items-center justify-between cursor-pointer group">
                <span
                  class="text-xs font-black uppercase text-content-dark group-hover:text-primary transition-colors tracking-tighter">Proration
                  logic</span>
                <div
                  class="relative inline-flex items-center h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-border"
                  :class="{ 'bg-primary': form.isProrated }">
                  <input type="checkbox" v-model="form.isProrated" class="sr-only" />
                  <span
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
                    :class="form.isProrated ? 'translate-x-5' : 'translate-x-0'"></span>
                </div>
              </label>

              <AppInput v-model.number="form.discountAmount" type="number" label="Manual Discount ($)" placeholder="0"
                @input="clearError('discountAmount')">
                <template #suffix>
                  <span class="text-xs font-black text-content-muted">$</span>
                </template>
              </AppInput>

              <div class="h-px bg-border/40"></div>

              <label class="flex items-center justify-between cursor-pointer group">
                <span
                  class="text-xs font-black uppercase text-content-dark group-hover:text-error transition-colors tracking-tighter">Custom
                  override</span>
                <div
                  class="relative inline-flex items-center h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-border"
                  :class="{ 'bg-error': form.isCustomPrice }">
                  <input type="checkbox" v-model="form.isCustomPrice" class="sr-only" />
                  <span
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
                    :class="form.isCustomPrice ? 'translate-x-5' : 'translate-x-0'"></span>
                </div>
              </label>

              <transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
                <div v-if="form.isCustomPrice">
                  <AppInput v-model.number="form.customPrice" type="number" label="Custom Override Price ($)"
                    placeholder="0" inputClass="border-error focus:ring-error/20" @input="clearError('customPrice')">
                    <template #suffix>
                      <span class="text-xs font-black text-error">$</span>
                    </template>
                  </AppInput>
                </div>
              </transition>
            </div>
          </div>

          <div class="flex flex-col gap-lg">
            <div
              class="bg-primary text-white p-xl rounded-std flex items-center justify-between shadow-2xl relative overflow-hidden border-2 border-primary-dark group">
              <div class="flex flex-col relative z-10">
                <span class="text-2xs font-black uppercase tracking-widest opacity-70">Tuition Total</span>
                <div v-if="prorateSavings > 0"
                  class="py-1 px-2 rounded-sm mt-2 bg-white/20 text-3xs font-black uppercase tracking-widest border border-white/10">
                  Savings: ${{ formatPrice(prorateSavings) }}
                </div>
              </div>
              <div class="flex flex-col items-end relative z-10">
                <span
                  class="text-3xl font-black tracking-tighter group-hover:scale-105 transition-transform duration-500">${{
                    formatPrice(finalAmount) }}</span>
              </div>
              <div
                class="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000">
              </div>
            </div>

            <AppButton type="submit" variant="primary" :loading="loading" form="enrollmentForm"
              class="w-full py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
              :disabled="loading" :class="{ 'button-disabled-visual': !isChanged }">
              {{ isEditMode ? 'Authorize Update' : 'Initialize Registry' }}
            </AppButton>
          </div>
        </div>
      </transition>

      <!-- Remarks Section -->
      <div class="flex flex-col gap-xs mt-md" v-if="selectedClass">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest">Administrative Audit
          Remarks</label>
        <div class="flex flex-wrap gap-xs mb-sm bg-surface-light p-2 rounded-sm border border-outline-std/20">
          <button v-for="preset in ['Trial Session', 'Sibling Disc', 'Adv. Payment', 'Scholarship']" :key="preset"
            type="button"
            class="px-3 py-1 bg-white border-2 border-outline-std rounded-sm text-3xs font-black uppercase tracking-widest cursor-pointer transition-all hover:bg-primary-soft hover:text-primary hover:border-primary-dark/20"
            :class="{
              'bg-primary text-white border-primary-dark shadow-md scale-105':
                isRemarkPresetActive(preset),
            }" @click="toggleRemarkPreset(preset)">
            {{ preset }}
          </button>
        </div>
        <textarea v-model="form.remark" placeholder="Provide confidential processing notes for internal audit trait..."
          rows="2"
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-4 focus:ring-info-soft shadow-sm"
          :class="{
            'border-error bg-error-soft ring-error/10': errors.remark,
            'animate-shake': shaking.remark,
          }"></textarea>
        <div v-if="errors.remark" class="text-error text-3xs font-black px-1 mt-0.5 uppercase tracking-widest">
          {{ errors.remark }}
        </div>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'
import { getSessionCounts } from '@/utils/programHelper'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  parents: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  programs: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  enrollments: { type: Array, default: () => [] },
  enrollment: { type: Object, default: null },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit', 'program-change', 'register-student'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  parentId: '',
  studentId: '',
  programId: '',
  classId: '',
  isProrated: true,
  discountAmount: 0,
  isSponsorship: false,
  sponsorName: '',
  isCustomPrice: false,
  customPrice: 0,
  remark: '',
})

const activeParents = computed(() =>
  (props.parents || []).filter((p) => (p.status || 'Active').toLowerCase() === 'active'),
)

const availableProgramsForStudent = computed(() => {
  if (!form.studentId) return props.programs
  return props.programs.filter(
    (program) =>
      !props.enrollments.some(
        (e) =>
          e.studentId === form.studentId &&
          e.programId === program.id &&
          !['cancelled', 'canceled'].includes((e.status || '').toLowerCase()),
      ),
  )
})

const availableStudents = computed(() => {
  if (!form.parentId) return []
  return props.students.filter((s) => s.parentId === form.parentId || s.parentUid === form.parentId)
})

const selectedProgram = computed(() => props.programs.find((c) => c.id === form.programId))
const selectedClass = computed(() => props.classes.find((c) => c.id === form.classId))

const availableClasses = computed(() => {
  if (!form.programId) return []
  return props.classes.filter((cl) => cl.programId === form.programId)
})

const sessionInfo = computed(() => {
  if (!selectedProgram.value || !selectedClass.value) return null
  return getSessionCounts(selectedProgram.value.startDate, selectedProgram.value.endDate, {
    [selectedClass.value.day]: selectedClass.value.timeslot,
  })
})

const finalAmount = computed(() => {
  if (form.isCustomPrice) return form.customPrice
  let price = selectedProgram.value?.price || 0
  if (form.isProrated && sessionInfo.value && sessionInfo.value.total > 0) {
    price = (price / sessionInfo.value.total) * sessionInfo.value.remaining
  }
  return price - (form.discountAmount || 0)
})

const prorateSavings = computed(() => {
  const price = selectedProgram.value?.price || 0
  if (!form.isProrated || !sessionInfo.value || price <= 0 || sessionInfo.value.total <= 0) return 0
  return (price / sessionInfo.value.total) * sessionInfo.value.passed
})

const isEditMode = computed(() => !!props.enrollment)
const initialDataString = ref('')
const isChanged = computed(
  () => !isEditMode.value || JSON.stringify(form) !== initialDataString.value,
)
const isSelectionLocked = computed(() => isEditMode.value)

const handleDisabledClick = (field) => {
  if (isSelectionLocked.value && (field === 'parentId' || field === 'studentId')) return

  if (field === 'studentId' && !form.parentId) {
    errors.parentId = 'PLEASE SELECT A PARENT FIRST'
    triggerShake('parentId')
  } else if (field === 'programId' && !form.studentId) {
    errors.studentId = 'PLEASE SELECT A STUDENT FIRST'
    triggerShake('studentId')
  } else if (field === 'classId' && !form.programId) {
    errors.programId = 'PLEASE SELECT A PROGRAM FIRST'
    triggerShake('programId')
  }
}

const validateAndSubmit = () => {
  const isValid = validate({
    required: ['parentId', 'studentId', 'programId', 'classId'],
  })

  if (!isValid || (isEditMode.value && !isChanged.value)) return

  emit('submit', {
    ...(isEditMode.value ? { id: props.enrollment.id } : {}),
    ...form,
    amount: finalAmount.value,
    enrollmentType:
      (!form.isProrated || sessionInfo.value?.passed === 0) &&
        !form.isCustomPrice &&
        (form.discountAmount || 0) === 0
        ? 'Full'
        : 'Partial',
  })

  // Explicitly clear errors on successful submission to avoid persistence in next modal open
  clearError()
}

const selectParent = (uid) => {
  form.parentId = uid
  form.studentId = form.programId = form.classId = ''
  clearError()
}

const handleStudentChange = () => {
  form.programId = ''
  form.classId = ''
  clearError('studentId')
}

const handleProgramChange = (pid) => {
  form.programId = pid
  form.classId = ''
  clearError('programId')
  emit('program-change', pid)
}

const toggleRemarkPreset = (p) => {
  let values = (form.remark || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  values = values.includes(p) ? values.filter((v) => v !== p) : [...values, p]
  form.remark = values.join(', ')
}

const isRemarkPresetActive = (p) =>
  (form.remark || '')
    .split(',')
    .map((v) => v.trim())
    .includes(p)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.enrollment) {
        resetForm(props.enrollment)
        initialDataString.value = JSON.stringify(form)
      } else {
        resetForm({
          parentId: '',
          studentId: '',
          programId: '',
          classId: '',
          isProrated: true,
          discountAmount: 0,
          isCustomPrice: false,
          customPrice: 0,
          remark: '',
        })
      }
    } else {
      clearError()
    }
  },
)
</script>
