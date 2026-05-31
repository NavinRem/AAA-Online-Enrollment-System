<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { useActionModal } from '@/composables/useActionModal'
import { useModalText } from '@/composables/useModalText'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'delete'
  branch: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const { modalTitle, submitLabel, modalIcon } = useModalText(() => props.type, 'Branch')

const getInitialData = () => ({
  name: '',
  abbr: '',
  location: '',
  phone: '',
  color: 'blue',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if (props.branch) {
    return { ...props.branch, deleteConfirm: '' }
  }
  return getInitialData()
}

const { localData, isDirty, errors, shaking, validate, clearError, triggerShake, getPayload } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    mapSourceToForm,
    sourceKey: 'branch',
    autoClear: 3000,
  },
)

const showConfirm = ref(false)
const validationMessage = ref('')
const colorOptions = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'cyan',
  'purple',
  'magenta',
  'pink',
  'gray',
]

const requestConfirm = () => {
  validationMessage.value = ''
  if (props.type === 'edit' && !isDirty.value) return

  const rules = {
    required: props.type === 'delete' ? ['deleteConfirm'] : ['name', 'abbr', 'location', 'phone'],
    custom: {},
  }

  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (!validate(rules)) {
    validationMessage.value =
      props.type === 'delete'
        ? 'Please type DELETE to confirm.'
        : 'Please fill out all required fields to proceed.'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)

    if (props.type !== 'delete') {
      if (!localData.name) triggerShake('name')
      if (!localData.abbr) triggerShake('abbr')
      if (!localData.location) triggerShake('location')
      if (!localData.phone) triggerShake('phone')
    } else {
      triggerShake('deleteConfirm')
    }
    return
  }

  showConfirm.value = true
}

const handleActionSubmit = () => {
  showConfirm.value = false
  const payload = getPayload()

  if (props.type === 'delete') {
    emit('submit', { id: localData.id })
    return
  }

  emit('submit', payload)
}

const confirmRows = computed(() => {
  const rows = [
    { key: 'Name', value: localData.name },
    { key: 'Abbr', value: localData.abbr, badge: true, type: localData.color },
    { key: 'Location', value: localData.location || 'Not Specified' },
    { key: 'Phone', value: localData.phone || 'N/A' },
  ]

  if (props.type === 'delete') {
    rows.push({
      key: 'DeleteConfirm',
      value: localData.deleteConfirm,
      valueClass: 'text-error font-bold',
    })
  }

  return rows
})

const isFormInvalid = computed(() => {
  if (props.type === 'delete') {
    return !localData.deleteConfirm
  }
  return !localData.name || !localData.abbr || !localData.location || !localData.phone
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      showConfirm.value = false
    }
  },
  { immediate: true }
)
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    :icon="modalIcon"
    :error="error"
    :success="success"
    maxWidth="600px"
    @close="$emit('close')"
  >
    <div class="relative min-h-[350px]">
      <!-- ADD / EDIT MODE -->
      <form
        v-if="type === 'add' || type === 'edit'"
        id="branchActionForm"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
        @submit.prevent="requestConfirm"
        novalidate
      >
        <div class="grid grid-cols-2 gap-lg">
          <AppInput
            v-model="localData.name"
            label="Branch Name"
            placeholder="e.g. Central Plaza..."
            required
            :error="errors.name"
            :shake="shaking.name"
            @input="clearError('name')"
          />
          <AppInput
            v-model="localData.abbr"
            label="Abbreviation"
            placeholder="e.g. CP"
            required
            :error="errors.abbr"
            :shake="shaking.abbr"
            @input="clearError('abbr')"
          >
            <template #suffix>
              <AppBadge :status="localData.abbr || '??'" :type="localData.color" />
            </template>
          </AppInput>
        </div>
        <div class="grid grid-cols-2 gap-lg">
          <AppInput
            v-model="localData.location"
            label="Physical Address"
            placeholder="Street, City, Landmark..."
            required
            :error="errors.location"
            :shake="shaking.location"
            @input="clearError('location')"
          />
          <AppInput
            v-model="localData.phone"
            label="Support Contact"
            placeholder="+1 (555) 000-0000"
            required
            :error="errors.phone"
            :shake="shaking.phone"
            @input="clearError('phone')"
          />
        </div>

        <div
          class="flex flex-col gap-md p-lg bg-surface-subtle border border-outline-std/50 rounded-md"
        >
          <span class="text-3xs font-semibold text-content-muted">Visual Identity</span>
          <div class="flex flex-wrap gap-2.5">
            <button
              v-for="color in colorOptions"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden"
              :class="[
                localData.color === color
                  ? 'border-primary shadow-lg scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100',
              ]"
              :style="{ backgroundColor: `var(--color-${color})` }"
              @click="localData.color = color"
            >
              <img
                v-if="localData.color === color"
                :src="getActionIcon('check')"
                class="w-4 h-4 brightness-0 invert"
              />
            </button>
          </div>
        </div>
      </form>

      <!-- DELETE MODE -->
      <div
        v-else-if="type === 'delete'"
        class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div
          class="bg-white border border-outline-std rounded-md p-lg flex flex-col gap-lg shadow-sm"
          v-if="branch"
        >
          <div class="flex items-center gap-4">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <AppBadge :status="branch.abbr" :type="branch.color" />
                <span class="text-sm font-semibold text-content-dark tracking-tighter"
                  >{{ branch.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">Permanent Decommissioning</strong>
            <p class="text-xs opacity-90 font-medium leading-relaxed">
              Decommissioning this branch will restrict all future enrollments and class scheduling
              for this location. Historical data will be preserved but the entity will be removed
              from active operations.
            </p>
          </div>
        </AppAlert>

        <AppInput
          v-model="localData.deleteConfirm"
          label="Security Confirmation"
          placeholder='Type "DELETE" to confirm'
          required
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-2xs font-bold text-error/60 mt-1">
              Type <span class="px-1 font-bold text-error">DELETE</span> to authorize
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Confirmation Overlay ── -->
      <AppConfirmOverlay
        :show="showConfirm"
        :title="
          type === 'delete' ? 'Delete Branch' : type === 'edit' ? 'Edit Branch' : 'Add Branch'
        "
        :subtitle="
          type === 'delete'
            ? 'This action will permanently erase this branch and its historical data.'
            : 'Please verify the logistical details and parameters before proceeding.'
        "
        :icon="modalIcon"
        :image="getImageUrl('enrollment/total-enrollment')"
        :rows="confirmRows"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleActionSubmit"
      />
    </div>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="validationMessage" type="error" class="w-full">
          {{ validationMessage }}
        </AppAlert>
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type === 'delete' ? 'danger' : 'primary'"
            type="button"
            @click="requestConfirm"
            :loading="loading"
            :disabled="loading"
            :class="{
              'opacity-60 grayscale-[0.2]': (type === 'edit' && !isDirty) || isFormInvalid,
            }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>
