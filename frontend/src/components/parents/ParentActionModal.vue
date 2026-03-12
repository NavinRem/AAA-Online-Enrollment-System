<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')">
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="success" class="success-banner">{{ success }}</div>

    <div class="target-summary" v-if="user">
      Executing action on: <strong>{{ user.name || user.email }}</strong>
    </div>

    <!-- Edit Form -->
    <div v-if="type === 'edit'" class="form-grid">
      <div class="form-group full-width">
        <label>Full Name</label>
        <span class="original-value" v-if="originalData.name">Original: {{ originalData.name }}</span>
        <input type="text" v-model="localData.name" placeholder="Enter full name" />
      </div>

      <div class="form-group full-width">
        <label>Email Address</label>
        <span class="original-value" v-if="originalData.email">Original: {{ originalData.email }}</span>
        <input type="email" v-model="localData.email" placeholder="Enter email" />
      </div>

      <div class="form-group full-width">
        <label>Phone Number</label>
        <span class="original-value" v-if="originalData.phone">Original: {{ originalData.phone }}</span>
        <input type="tel" v-model="localData.phone" placeholder="Enter phone number" />
      </div>

      <div class="form-group full-width">
        <label>Role</label>
        <span class="original-value" v-if="originalData.role">Original: {{ originalData.role }}</span>
        <select v-model="localData.role" class="form-select">
          <option value="parent">Parent</option>
          <option value="guardian">Guardian</option>
        </select>
      </div>
    </div>

    <!-- Deactivate Form -->
    <div v-if="type === 'deactivate'" class="form-group full-width">
      <div class="info-block warning">
        <div class="icon">⚠️</div>
        <div class="text">
          <strong>Deactivation Warning</strong>
          <p>
            Deactivating an account will prevent the user from logging in. This family's child
            records will remain untouched, and you can reactivate them at any time.
          </p>
        </div>
      </div>
    </div>

    <!-- Activate Form -->
    <div v-if="type === 'activate'" class="form-group full-width">
      <div class="info-block active-info">
        <div class="icon">✅</div>
        <div class="text">
          <strong>Account Reactivation</strong>
          <p>
            Reactivating this account will restore the user's ability to log in and manage their
            children's enrollments immediately.
          </p>
        </div>
      </div>
    </div>

    <!-- Delete Form -->
    <div v-if="type === 'delete'" class="form-group full-width">
      <div class="info-block danger">
        <div class="icon">🛑</div>
        <div class="text">
          <strong>Critical Permanent Action</strong>
          <p>
            Deleting an account removes the record entirely. It can never be recovered. This should
            only be used for accidental duplicate enrollments.
          </p>
        </div>
      </div>
      <label>To confirm, type <strong class="danger-text">DELETE</strong> below</label>
      <input type="text" v-model="localData.deleteConfirm" placeholder="Type DELETE" />
    </div>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton
        :variant="type === 'delete' || type === 'deactivate' ? 'danger' : 'primary'"
        @click="handleSubmit"
        :loading="loading"
        :disabled="loading || !isFormValid"
      >
        Confirm Action
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useActionModal } from '@/composables/useActionModal'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'edit', 'deactivate', 'delete'
  user: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const getInitialData = () => ({
  name: '',
  phone: '',
  email: '',
  role: 'parent',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  const u = props.user || {}
  return {
    name: u.name || '',
    phone: u.phone || '',
    email: u.email || '',
    role: u.role || 'parent',
    deleteConfirm: '',
  }
}

const { localData, originalData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
})

const modalTitle = computed(() => {
  const titles = {
    edit: 'Edit User',
    deactivate: 'Deactivate User',
    activate: 'Reactivate User',
    delete: 'Delete User',
  }
  return titles[props.type] || 'Action Modal'
})

const isFormValid = computed(() => {
  if (props.type === 'edit') {
    return (
      localData.value.name.trim() &&
      localData.value.email.trim() &&
      localData.value.phone.trim() &&
      localData.value.role
    )
  }
  if (props.type === 'delete') {
    return localData.value.deleteConfirm === 'DELETE'
  }
  return true
})

const handleSubmit = () => submitForm(isFormValid.value)
</script>

<style scoped>
.original-value {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: -4px;
  margin-bottom: 4px;
  font-style: italic;
}
</style>
