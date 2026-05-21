<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { useActionModal } from '@/composables/useActionModal'
import TeacherAssignmentTab from './TeacherAssignmentTab.vue'
import { teacherService } from '@/services/teacherService'

const assignmentTabRef = ref(null)
const assignmentChanges = ref({ adds: [], removes: [] })

const props = defineProps({
  isOpen: Boolean,
  type: {
    type: String,
    default: 'plus', // 'plus', 'edit', 'delete', 'reactivate', 'deactivate'
  },
  teacher: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'refresh'])

const getInitialData = () => ({
  name: '',
  email: '',
  phone: '',
  programIds: [],
  status: 'active',
  profileURL: '',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  const newVal = props.teacher
  if (newVal) {
    return {
      name: newVal.name || '',
      email: newVal.email || '',
      phone: newVal.phone || '',
      programIds: newVal.programIds || [],
      status: newVal.status || 'active',
      profileURL: newVal.profileURL || '',
      deleteConfirm: '',
    }
  }
  return getInitialData()
}

const {
  localData: form,
  errors: formErrors,
  shaking: formShaking,
  isDirty,
  validate,
  clearError,
  triggerShake,
} = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
  autoClear: 3000,
})

const activeTab = ref('profile')
const showConfirm = ref(false)
const confirmType = ref('profile') // 'profile' or 'assignments'
const programs = ref([])
const loadingPrograms = ref(false)

const fetchPrograms = async () => {
  loadingPrograms.value = true
  try {
    const data = await programService.getAllPrograms()
    programs.value = (Array.isArray(data) ? data : []).map((p) => ({
      id: p.id,
      name: p.name,
      profileURL: p.profileURL,
    }))
  } catch (error) {
    console.error('Failed to fetch programs', error)
  } finally {
    loadingPrograms.value = false
  }
}

onMounted(fetchPrograms)

const validateForm = () => {
  const rules = {
    required: ['profileURL', 'name', 'email', 'phone', 'programIds'],
    custom: {
      email: (val) => /^\S+@\S+\.\S+$/.test(val) || 'Invalid email format',
    },
  }
  return validate(rules)
}

const requestConfirm = () => {
  if (activeTab.value === 'profile') {
    if (props.type === 'delete') {
      if (form.deleteConfirm !== 'DELETE') {
        triggerShake('deleteConfirm')
        return
      }
    } else if (['plus', 'edit'].includes(props.type)) {
      if (!validateForm()) return
    }
    confirmType.value = 'profile'
  } else {
    if (!assignmentTabRef.value?.hasChanges) {
      emit('close')
      return
    }
    assignmentChanges.value = assignmentTabRef.value.getChanges()
    confirmType.value = 'assignments'
  }
  showConfirm.value = true
}

const handleActionSubmit = async () => {
  showConfirm.value = false

  if (confirmType.value === 'profile') {
    const payload = { ...form }
    const forbidden = ['id', '_id', 'createdAt', 'updatedAt', 'deleteConfirm']
    forbidden.forEach((key) => delete payload[key])
    emit('submit', payload)
  } else {
    // Handle assignments submission
    try {
      const { adds, removes } = assignmentChanges.value
      const promises = [
        ...adds.map((offering) =>
          teacherService.assignToClass(props.teacher.id, offering.termId, offering.offeringId),
        ),
        ...removes.map((offering) => {
          return teacherService.unassignFromClass(
            props.teacher.id,
            offering.termId,
            offering.offeringId,
          )
        }),
      ]
      await Promise.all(promises)
      emit('refresh')
      emit('close')
    } catch (err) {
      console.error('Failed to update assignments', err)
    }
  }
}

const modalTitle = computed(() => {
  const titles = {
    edit: 'Edit Teacher Profile',
    delete: 'Delete Teacher Record',
    reactivate: 'Reactivate Teacher',
    deactivate: 'Suspend Teacher',
    plus: 'New Teacher Registration',
  }
  return titles[props.type] || 'Teacher Action'
})

const submitLabel = computed(() => {
  if (confirmType.value === 'assignments') return 'Confirm Assignments'
  const labels = {
    edit: 'Save Changes',
    delete: 'Delete Permanently',
    reactivate: 'Reactivate',
    deactivate: 'Suspend',
    plus: 'Add Teacher',
  }
  return labels[props.type] || 'Confirm'
})

const confirmRows = computed(() => {
  if (confirmType.value === 'assignments') {
    const { adds, removes } = assignmentChanges.value
    const rows = [{ key: 'Teacher', value: form.name }]
    if (adds.length > 0) {
      rows.push({ key: 'Adding', value: adds.length })
    }
    if (removes.length > 0) {
      rows.push({ key: 'Removing', value: removes.length })
    }
    return rows
  }

  const rows = [
    { key: 'Teacher', value: form.name },
    { key: 'Email', value: form.email },
    { key: 'Phone', value: form.phone },
    {
      key: 'Programs',
      value: form.programIds.map((id) => programs.value.find((p) => p.id === id)?.name).join(', '),
    },
  ]

  if (props.type === 'delete') {
    rows.push({ key: 'Status', value: 'Permanently Deleted', valueClass: 'text-error font-bold' })
  }

  return rows
})
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      activeTab.value = 'profile'
    }
  },
)
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    variant="action"
    :icon="getActionIcon(type)"
    :error="error"
    :success="success"
    @close="$emit('close')"
  >
    <!-- Tab Switcher (Only for Edit) -->
    <div v-if="type === 'edit' && !success" class="ui-tabs-nav mb-6">
      <button
        @click="activeTab = 'profile'"
        class="ui-tab-item"
        :class="{ active: activeTab === 'profile' }"
      >
        <span class="text-sm">👤</span>
        Profile Info
      </button>
      <button
        @click="activeTab = 'assignments'"
        class="ui-tab-item"
        :class="{ active: activeTab === 'assignments' }"
      >
        <span class="text-sm">📅</span>
        Class Assignments
      </button>
    </div>

    <!-- Lifecycle Alerts -->
    <!-- Non-Form Actions (Reactivate/Deactivate/Delete) -->
    <div v-if="['reactivate', 'deactivate', 'delete'].includes(type)" class="flex flex-col gap-6">
      <!-- Profile Preview -->
      <div
        class="flex items-center gap-4 p-4 rounded-xl bg-surface-subtle border-2 border-outline-std/50 shadow-sm"
      >
        <div
          class="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white shrink-0"
        >
          <img
            :src="teacher?.profileURL || getImageUrl('profiles/avatar-teacher-man')"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex flex-col text-left overflow-hidden">
          <span class="text-base font-bold text-content-dark truncate">{{ teacher?.name }}</span>
          <span class="text-xs font-semibold text-content-muted truncate italic">{{
            teacher?.email
          }}</span>
        </div>
      </div>

      <!-- Reactivate Specific -->
      <div v-if="type === 'reactivate'" class="flex flex-col gap-lg">
        <AppAlert type="warning">
          <div class="flex flex-col gap-1 text-left">
            <strong class="text-sm font-semibold tracking-tight text-warning-dark"
              >Reactivation Protocol</strong
            >
            <span class="text-xs opacity-90 font-medium leading-relaxed">
              Account access will be restored immediately. This teacher will be eligible for active
              class assignments and attendance tracking across their assigned programs.
            </span>
          </div>
        </AppAlert>
      </div>

      <!-- Deactivate Specific -->
      <div v-if="type === 'deactivate'" class="flex flex-col gap-lg">
        <AppAlert type="warning">
          <div class="flex flex-col gap-1 text-left">
            <strong class="text-sm font-semibold tracking-tight">Account Suspension</strong>
            <span class="text-xs opacity-90 font-medium leading-relaxed">
              Deactivating this account will restrict the teacher's access to the portal. Ongoing
              class assignments will remain, but the status will reflect as inactive.
            </span>
          </div>
        </AppAlert>
      </div>

      <!-- Delete Specific -->
      <div v-if="type === 'delete'" class="flex flex-col gap-lg">
        <AppAlert type="error">
          <div class="flex flex-col gap-0.5 text-left">
            <strong class="text-sm font-semibold tracking-tight">⚠ Permanent Record Removal</strong>
            <span class="text-xs opacity-90 font-medium leading-relaxed">
              This action will permanently purge the faculty record. This is irreversible. Linked
              historical data will be severed from the active database.
            </span>
          </div>
        </AppAlert>

        <AppInput
          v-model="form.deleteConfirm"
          label="Authorization Confirmation"
          placeholder="DELETE"
          required
          :shake="formShaking.deleteConfirm"
          :error="formErrors.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-2xs font-semibold mt-0.5">
              Type <span class="text-error px-1 font-bold">DELETE</span> to authorize removal
            </span>
          </template>
        </AppInput>
      </div>
    </div>

    <!-- Main Form (Add/Edit) -->
    <template v-if="activeTab === 'profile'">
      <form
        v-if="['plus', 'edit'].includes(type)"
        @submit.prevent="requestConfirm"
        class="flex flex-col gap-6"
      >
        <AvatarSelector
          v-model="form.profileURL"
          label="Teacher Avatar"
          role="teacher"
          :uid="teacher?.id"
          required
          :error="formErrors.profileURL"
          :shake="formShaking.profileURL"
          @input="clearError('profileURL')"
        />

        <AppInput
          v-model="form.name"
          label="Teacher Name"
          placeholder="e.g. Dr. John Doe"
          required
          :error="formErrors.name"
          :shake="formShaking.name"
          @input="clearError('name')"
        />
        <AppInput
          v-model="form.email"
          type="email"
          label="Email"
          placeholder="teacher@aaa.edu"
          required
          :error="formErrors.email"
          :shake="formShaking.email"
          @input="clearError('email')"
        />
        <AppInput
          v-model="form.phone"
          label="Phone Number"
          placeholder="e.g. 012 345 678"
          required
          :error="formErrors.phone"
          :shake="formShaking.phone"
          @input="clearError('phone')"
        />

        <AppSelect
          v-model="form.programIds"
          label="Programs"
          placeholder="Choose programs..."
          :items="programs"
          multiple
          :loading="loadingPrograms"
          required
          :error="formErrors.programIds"
          :shake="formShaking.programIds"
          @change="clearError('programIds')"
        >
          <template #item="{ item }">
            <div class="flex items-center gap-1 w-full">
              <div
                class="w-8 h-8 rounded-xl border border-outline-std overflow-hidden bg-white shrink-0 shadow-md"
              >
                <img
                  :src="item.profileURL || getImageUrl('dashboard/card-top-program')"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex flex-col text-left">
                <span class="text-sm font-bold text-content-dark">{{ item.name }}</span>
              </div>
            </div>
          </template>
        </AppSelect>
      </form>
    </template>

    <!-- Assignments Tab -->
    <template v-else-if="activeTab === 'assignments'">
      <TeacherAssignmentTab
        ref="assignmentTabRef"
        :teacher="teacher"
        :qualifiedProgramIds="form.programIds"
      />
    </template>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex flex-col items-end w-full gap-md">
        <AppAlert
          v-if="activeTab === 'profile' && type === 'edit' && !isDirty"
          type="info"
          class="w-full"
        >
          <div class="flex items-center gap-2 text-left">
            <span class="text-lg">ℹ️</span>
            <div class="flex flex-col">
              <span class="text-xs font-semibold tracking-tight">No modifications detected</span>
              <span class="text-4xs opacity-80"
                >Please update at least one field to enable saving.</span
              >
            </div>
          </div>
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')" :disabled="loading || !!success"
            >Cancel</AppButton
          >

          <AppButton
            :variant="
              type === 'delete'
                ? 'danger'
                : type === 'deactivate'
                  ? 'warning'
                  : type === 'reactivate'
                    ? 'success'
                    : 'primary'
            "
            type="button"
            @click="requestConfirm"
            :loading="loading"
            :disabled="
              loading || !!success || (activeTab === 'profile' && type === 'edit' && !isDirty)
            "
            :class="{
              'button-disabled-visual': activeTab === 'profile' && type === 'edit' && !isDirty,
            }"
          >
            {{ activeTab === 'assignments' ? 'Done' : submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>

    <!-- Confirmation Overlay -->
    <AppConfirmOverlay
      :show="showConfirm"
      :title="modalTitle"
      :subtitle="
        type === 'delete' ? 'This action is irreversible.' : 'Verify details before proceeding.'
      "
      :icon="getActionIcon(type)"
      :rows="confirmRows"
      :confirmLabel="submitLabel"
      :loading="loading"
      @back="showConfirm = false"
      @confirm="handleActionSubmit"
    >
      <!-- Custom Row for Teacher Profile Preview -->
      <template #row-Teacher>
        <div
          class="flex items-center justify-between gap-5 p-3 rounded-sm bg-surface-subtle border border-outline-std max-w-72"
        >
          <div
            class="w-12 h-12 rounded-xl overflow-hidden border border-white shadow-sm shrink-0 bg-white"
          >
            <img
              :src="
                form.profileURL || teacher?.profileURL || getImageUrl('profiles/avatar-teacher-man')
              "
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex flex-col text-left overflow-hidden">
            <span class="text-sm font-black text-content-dark truncate">{{ form.name }}</span>
            <span class="text-xs font-bold text-content-muted truncate italic">{{
              form.phone
            }}</span>
            <span class="text-xs font-bold text-content-muted truncate italic">{{
              form.email
            }}</span>
          </div>
        </div>
      </template>

      <!-- Custom Row for Adding Classes -->
      <template #row-Adding>
        <div class="flex flex-col gap-2 w-full max-w-72">
          <div
            v-for="add in assignmentChanges.adds"
            :key="add.offeringId"
            class="flex items-center justify-between p-3 rounded-sm bg-primary-soft/30 border border-primary/20"
          >
            <div class="flex flex-col text-left">
              <span class="text-sm font-black text-content-dark">{{ add.program?.name }}</span>
              <span class="text-xs font-bold text-content-dark">{{ add.schedule?.day }}</span>
              <span class="text-xs font-bold text-primary">{{ add.schedule?.time }}</span>
            </div>
            <AppBadge
              :status="add.branch?.abbr || 'HQ'"
              size="xs"
              :type="add.branch?.color || 'blue'"
            />
          </div>
        </div>
      </template>

      <!-- Custom Row for Removing Classes -->
      <template #row-Removing>
        <div class="flex flex-col gap-2 w-full max-w-72">
          <div
            v-for="remove in assignmentChanges.removes"
            :key="remove.offeringId"
            class="flex items-center justify-between p-3 rounded-xl bg-error-soft/30 border border-error/20"
          >
            <div class="flex flex-col text-left">
              <span class="text-xs font-black text-content-dark truncate">{{
                remove.program?.name
              }}</span>
              <span class="text-4xs font-bold text-error"
                >{{ remove.schedule?.day }} • {{ remove.schedule?.time }}</span
              >
            </div>
            <AppBadge :status="remove.branch?.abbr || 'HQ'" size="xs" type="red" />
          </div>
        </div>
      </template>
    </AppConfirmOverlay>
  </AppModal>
</template>
