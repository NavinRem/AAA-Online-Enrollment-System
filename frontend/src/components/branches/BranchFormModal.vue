<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  branch: { type: Object, default: null },
  branches: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})
const emit = defineEmits(['close', 'submit'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  name: '',
  abbr: '',
  location: '',
  phone: '',
  color: 'blue',
})

const showConfirm = ref(false)

const isEditMode = computed(() => !!props.branch)

const colorOptions = ['red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple', 'magenta', 'pink', 'gray']

const colorUsage = computed(() => {
  const usage = {}
  props.branches.forEach((b) => {
    if (props.branch && b.id === props.branch.id) return
    if (b.color) usage[b.color] = b.name
  })
  return usage
})

const initialDataString = ref('')
const isChanged = computed(
  () => !isEditMode.value || JSON.stringify(form) !== initialDataString.value,
)

const hasAnyError = computed(() => Object.values(errors).some((e) => !!e))

const confirmRows = computed(() => [
  { key: 'branch Name', value: form.name },
  { key: 'Abbreviation', value: form.abbr, badge: true, type: form.color },
  { key: 'Location', value: form.location || 'Central Facility' },
  { key: 'Phone', value: form.phone || 'Not Provided' },
  { key: 'Color Theme', value: form.color.toUpperCase() },
])

const requiredFields = ['name', 'abbr', 'location', 'phone']

const isSubmittable = computed(() =>
  requiredFields.every((f) => !!form[f]) && (!isEditMode.value || isChanged.value)
)

const handleSubmit = () => {
  const isValid = validate({
    required: requiredFields,
  })

  if (!isValid) {
    Object.keys(errors).forEach((key) => {
      if (errors[key]) triggerShake(key)
    })
    return
  }

  if (isEditMode.value && !isChanged.value) {
    errors.name = 'No changes detected. Please update at least one field.'
    triggerShake('name')
    return
  }

  showConfirm.value = true
}

const handleFinalSubmit = () => {
  const payload = { ...form }
  emit('submit', payload)
  showConfirm.value = false
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.branch) {
        resetForm({
          name: props.branch.name || '',
          abbr: props.branch.abbr || '',
          location: props.branch.location || '',
          phone: props.branch.phone || '',
          color: props.branch.color || 'blue',
        })
        initialDataString.value = JSON.stringify(form)
      } else {
        resetForm({
          name: '',
          abbr: '',
          location: '',
          phone: '',
          color: 'blue',
        })
      }
      showConfirm.value = false
    } else {
      clearError()
    }
  },
)
</script>

<template>
  <AppModal :show="isOpen" @close="$emit('close')" :title="isEditMode ? 'Edit branch' : 'Create New branch'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')" :error="error" :success="success">
    <form @submit.prevent="handleSubmit" class="enroll-form-root">

      <div class="ui-form-grid">
        <div class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AppInput v-model="form.name" label="branch Name" required placeholder="e.g. Central Plaza..."
            :error="errors.name" :shake="shaking.name" @input="clearError('name')" />
          <AppInput v-model="form.abbr" label="Abbreviation" required placeholder="e.g. CP" :error="errors.abbr"
            :shake="shaking.abbr" @input="clearError('abbr')" />
        </div>

        <div class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <AppInput v-model="form.location" label="Physical Location" required placeholder="Full address or landmark..."
            :error="errors.location" :shake="shaking.location" @input="clearError('location')" />
          <AppInput v-model="form.phone" label="Branch Phone" required placeholder="Contact number..."
            :error="errors.phone" :shake="shaking.phone" @input="clearError('phone')" />
        </div>
      </div>

      <!-- Detail Panel -->
      <transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0">
        <div v-if="form.location && form.phone" class="enrollment-detail-panel">
          <div class="enroll-twin-card">
            <span class="enroll-section-label">branch Identity Preview</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item">
                <span class="enroll-info-key">Legal Name</span>
                <span class="enroll-info-val">{{ form.name }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Identifier</span>
                <div class="flex items-center gap-2">
                  <AppBadge :status="form.abbr || '—'" :type="form.color" />
                </div>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Address</span>
                <span class="enroll-info-val italic truncate block max-w-[200px]" :title="form.location">{{
                  form.location
                  || 'Location Not Specified' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Contact</span>
                <span class="enroll-info-val tabular-nums">{{ form.phone || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Appearance Panel -->
          <div class="enroll-twin-card">
            <span class="enroll-section-label">Branch Appearance</span>
            <div class="flex flex-col gap-3">
              <div class="flex flex-wrap gap-2.5 p-3 rounded-md bg-surface-subtle border border-outline-std/50">
                <div v-for="color in colorOptions" :key="color" class="relative group">
                  <button type="button"
                    class="w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden"
                    :class="[
                      form.color === color ? 'border-primary shadow-lg scale-110' : 'border-transparent opacity-60 hover:opacity-100',
                      colorUsage[color] ? 'cursor-not-allowed opacity-20 grayscale scale-90' : 'cursor-pointer'
                    ]" :style="{ backgroundColor: `var(--color-${color})` }" :disabled="!!colorUsage[color]"
                    @click="form.color = color">
                    <img v-if="form.color === color" :src="getActionIcon('check')"
                      class="w-4 h-4 brightness-0 invert" />
                  </button>

                  <!-- Tooltip for used colors -->
                  <div v-if="colorUsage[color]"
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-content-dark text-[8px] font-black text-white uppercase tracking-tighter whitespace-nowrap rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl">
                    Used by: {{ colorUsage[color] }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Confirmation Overlay -->
      <AppConfirmOverlay :show="showConfirm"
        :title="isEditMode ? 'Confirm Entity Update' : 'Confirm branch Establishment'"
        subtitle="Ensure all logistical details are correct before proceeding." :icon="getImageUrl('dashboard/branch')"
        :rows="confirmRows" :confirmLabel="isEditMode ? 'Update Branch' : 'Create Branch'" :loading="loading"
        @back="showConfirm = false" @confirm="handleFinalSubmit" />
    </form>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div>
          <div v-if="hasAnyError" class="text-error font-bold text-sm flex items-center gap-2">
            <span>⚠</span> Please resolve highlighted issues.
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" class="ui-btn-cancel" @click="$emit('close')">
            Cancel
          </button>
          <AppButton type="button" variant="primary" :loading="loading" class="ui-btn-premium" :disabled="loading"
            :class="{ 'opacity-50 grayscale-[0.3]': !isSubmittable }" @click="handleSubmit">
            {{ isEditMode ? 'Update Branch' : 'Create Branch' }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped></style>
