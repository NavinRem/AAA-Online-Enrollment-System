<script setup>
import { ref, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: {
    type: String,
    default: 'add' // 'add', 'edit'
  },
  teacher: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const form = ref({
  name: '',
  email: '',
  phone: '',
  specialization: '',
  status: 'active'
})

watch(() => props.teacher, (newVal) => {
  if (newVal) {
    form.value = { ...newVal }
  } else {
    form.value = {
      name: '',
      email: '',
      phone: '',
      specialization: '',
      status: 'active'
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('submit', { ...form.value })
}
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="type === 'edit' ? 'Engineer Faculty Profile' : 'Initialize Faculty Member'"
    maxWidth="500px"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
      <AppInput 
        v-model="form.name" 
        label="Full Professional Name" 
        placeholder="e.g. Dr. John Doe" 
        required 
      />
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppInput 
          v-model="form.email" 
          type="email" 
          label="Communication Email" 
          placeholder="teacher@aaa.edu" 
          required 
        />
        <AppInput 
          v-model="form.phone" 
          label="Contact Number" 
          placeholder="+1..." 
        />
      </div>

      <AppInput 
        v-model="form.specialization" 
        label="Academic Specialization" 
        placeholder="e.g. Quantum Physics, Visual Arts" 
      />

      <AppSelect
        v-model="form.status"
        label="Deployment Status"
        :items="[
          { id: 'active', name: 'Active Duty' },
          { id: 'inactive', name: 'On Leave / Inactive' },
        ]"
      />

      <div class="flex items-center justify-end gap-3 mt-4">
        <AppButton variant="cancel" @click="$emit('close')">Abort</AppButton>
        <AppButton type="submit" variant="primary" :loading="loading" class="px-8 font-black">
           {{ type === 'add' ? 'Authorize' : 'Update Profile' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
