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
        <input type="text" v-model="localData.name" placeholder="Enter full name" />
      </div>

      <div class="form-group full-width">
        <label>Email Address</label>
        <input type="email" v-model="localData.email" placeholder="Enter email" />
      </div>

      <div class="form-group full-width">
        <label>Phone Number</label>
        <input type="tel" v-model="localData.phone" placeholder="Enter phone number" />
      </div>

      <div class="form-group full-width">
        <label>Role</label>
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
            children's registrations immediately.
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
            only be used for accidental duplicate registrations.
          </p>
        </div>
      </div>
      <label>To confirm, type <strong class="danger-text">DELETE</strong> below</label>
      <input type="text" v-model="localData.deleteConfirm" placeholder="Type DELETE" />
    </div>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Nevermind</AppButton>
      <AppButton
        :variant="type === 'delete' || type === 'deactivate' ? 'danger' : 'primary'"
        @click="handleSubmit"
        :loading="loading"
        :disabled="loading"
      >
        Confirm Action
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '../common/AppModal/AppModal.vue'
import AppButton from '../common/AppButton/AppButton.vue'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'edit', 'deactivate', 'delete'
  user: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const localData = ref({
  name: '',
  phone: '',
  email: '',
  role: 'parent',
  deleteConfirm: '',
})

// Sync local data with prop when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.user) {
      localData.value = {
        name: props.user.name || '',
        phone: props.user.phone || '',
        email: props.user.email || '',
        role: props.user.role || 'parent',
        deleteConfirm: '',
      }
    }
  },
)

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit User'
  if (props.type === 'deactivate') return 'Deactivate User'
  if (props.type === 'activate') return 'Reactivate User'
  if (props.type === 'delete') return 'Delete User'
  return 'Action Modal'
})

const handleSubmit = () => {
  emit('submit', { ...localData.value })
}
</script>
