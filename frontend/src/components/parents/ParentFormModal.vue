<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const { form, errors, shaking, validate, clearError, resetForm } = useForm({
  name: '',
  email: '',
  phone: '',
  profileURL: '',
})

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      resetForm({ name: '', email: '', phone: '', profileURL: '' })
    } else {
      clearError()
    }
  },
)

const showConfirm = ref(false)
const isEditMode = computed(() => false)

const confirmRows = computed(() => [
  { key: 'Full Name', value: form.name },
  { key: 'Email Address', value: form.email },
  { key: 'Phone Number', value: form.phone },
  { key: 'Avatar', value: form.profileURL || 'None Selected' },
])

const handleFormSubmit = () => {
  const isValid = validate({
    required: ['name', 'email', 'phone', 'profileURL'],
    custom: {
      email: (val) => (!val?.includes('@') ? 'Valid email is required.' : null),
    },
  })

  if (!isValid) return
  showConfirm.value = true
}

const handleFinalSubmit = () => {
  emit('submit', { ...form, role: 'parent' })
  clearError()
  showConfirm.value = false
}
</script>

<template>
  <AppModal :show="isOpen" @close="$emit('close')" title="Register New Parent" :icon="getActionIcon('plus')"
    :error="error" :success="success">
    <form id="newParentForm" novalidate @submit.prevent="handleFormSubmit" class="flex flex-col gap-lg">
      <div class="grid grid-cols-2 gap-lg">
        <AppInput v-model="form.name" label="Full Name" placeholder="Enter parent full name" required
          :error="errors.name" :shake="shaking.name" @input="clearError('name')" />

        <AppInput v-model="form.email" type="email" label="Email Address" placeholder="Enter parent email" required
          :error="errors.email" :shake="shaking.email" @input="clearError('email')" />

        <AppInput v-model="form.phone" type="tel" label="Phone Number" placeholder="Enter parent phone number" required
          :error="errors.phone" :shake="shaking.phone" @input="clearError('phone')" />

        <div class="flex flex-col gap-xs">
          <label class="text-sm font-semibold text-content-dark">Select Profile Avatar <span
              class="text-error font-bold">*</span></label>
          <AvatarSelector v-model="form.profileURL" role="parent" :customFileName="`${form.name}_parent`"
            :error="errors.profileURL" :shake="shaking.profileURL" @update:modelValue="clearError('profileURL')" />
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end w-full gap-sm">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton variant="primary" form="newParentForm" type="submit" :loading="loading" class="px-8">
          Add
        </AppButton>
      </div>
    </template>
    <AppConfirmOverlay :show="showConfirm" title="Confirm Parent Details"
      subtitle="Please review parent details carefully before confirming."
      :icon="getImageUrl('enrollment/total-enrollment')" :rows="confirmRows"
      :confirmLabel="isEditMode ? 'Update' : 'Add'" :loading="loading" @back="showConfirm = false"
      @confirm="handleFinalSubmit">
      <template #row-Avatar="{ row }">
        <a v-if="row.value !== 'None Selected'" :href="row.value" target="_blank"
          class="text-primary text-sm font-bold hover:underline line-clamp-2 leading-tight max-w-[200px]"
          title="View Avatar URL">
          {{ row.value }}
        </a>
        <span v-else class="app-confirm-val text-content-muted">None Selected</span>
      </template>
    </AppConfirmOverlay>
  </AppModal>
</template>
