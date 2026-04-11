<template>
  <AppModal
    :show="isOpen"
    @close="$emit('close')"
    title="Register New Parent"
    :icon="getActionIcon('plus')"
  >
    <form
      id="newParentForm"
      novalidate
      @submit.prevent="handleFormSubmit"
      class="flex flex-col gap-lg"
    >
      <div class="grid grid-cols-2 gap-lg">
        <AppInput
          v-model="form.name"
          label="Full Name"
          placeholder="Enter full name"
          required
          :error="errors.name"
          :shake="shaking.name"
          @input="clearError('name')"
        />

        <AppInput
          v-model="form.email"
          type="email"
          label="Email Address"
          placeholder="example@email.com"
          required
          :error="errors.email"
          :shake="shaking.email"
          @input="clearError('email')"
        />

        <AppInput
          v-model="form.phone"
          type="tel"
          label="Phone Number"
          placeholder="012 345 678"
          required
          :error="errors.phone"
          :shake="shaking.phone"
          @input="clearError('phone')"
        />

        <div class="flex flex-col gap-xs">
          <label class="text-sm font-semibold text-content-dark"
            >Select Profile Avatar <span class="text-error font-bold">*</span></label
          >
          <AvatarSelector
            v-model="form.profileURL"
            role="parent"
            :customFileName="`${form.name}_parent`"
            :error="errors.profileURL"
            :shake="shaking.profileURL"
            @update:modelValue="clearError('profileURL')"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end w-full gap-sm">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton
          variant="primary"
          form="newParentForm"
          type="submit"
          :loading="loading"
          class="px-8"
        >
          Register Parent
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getActionIcon } from '@/utils/assetHelper'

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

const handleFormSubmit = () => {
  const isValid = validate({
    required: ['name', 'email', 'phone', 'profileURL'],
    custom: {
      email: (val) => (!val?.includes('@') ? 'Valid email is required.' : null),
    },
  })

  if (!isValid) return
  emit('submit', { ...form, role: 'parent' })
  clearError()
}
</script>

<style scoped>
/* Scoped styles removed in favor of Tailwind */
</style>
