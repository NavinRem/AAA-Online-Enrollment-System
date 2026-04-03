<template>
    <AppModal :show="isOpen" title="Register New Parent / Guardian" @close="$emit('close')"
        :icon="getActionIcon('plus')">
        <form class="form-grid" @submit.prevent="handleFormSubmit">
            <div class="form-group full-width">
                <label>Full Name <span class="required">*</span></label>
                <input type="text" v-model="formData.name" placeholder="Enter full name" class="standard-input"
                    :class="{ 'field-error': errors.name }" />
                <div v-if="errors.name" class="field-error-msg">{{ errors.name }}</div>
            </div>

            <div class="form-group">
                <label>Email Address <span class="required">*</span></label>
                <input type="email" v-model="formData.email" placeholder="email@example.com" class="standard-input"
                    :class="{ 'field-error': errors.email }" />
                <div v-if="errors.email" class="field-error-msg">{{ errors.email }}</div>
            </div>

            <div class="form-group">
                <label>Phone Number <span class="required">*</span></label>
                <input type="tel" v-model="formData.phone" placeholder="e.g. +855..." class="standard-input"
                    :class="{ 'field-error': errors.phone }" />
                <div v-if="errors.phone" class="field-error-msg">{{ errors.phone }}</div>
            </div>

            <div class="form-group">
                <label>Role <span class="required">*</span></label>
                <select v-model="formData.role" class="standard-input" :class="{ 'field-error': errors.role }">
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                </select>
                <div v-if="errors.role" class="field-error-msg">{{ errors.role }}</div>
            </div>

            <div class="form-group full-width">
                <label>Profile Avatar <span class="required">*</span></label>
                <AvatarSelector v-model="formData.profile" :role="formData.role"
                    :customFileName="`${formData.name}_${formData.role}`" />
                <div v-if="errors.profile" class="field-error-msg">{{ errors.profile }}</div>
            </div>

            <div class="form-group full-width">
                <label>Password (Temporary)</label>
                <input type="text" v-model="formData.password" placeholder="Leave blank for auto-generated"
                    class="standard-input" />
                <small class="text-muted-modern">The parent will be asked to change this on first login.</small>
            </div>
            <!-- Hidden submit for Enter key functionality -->
            <button type="submit" style="display: none;"></button>
        </form>

        <template #footer>
            <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%; gap: 12px;">
                <transition name="toast-fade">
                    <div v-if="error" class="alert-box error" style="width: 100%; margin-bottom: 0;">
                        {{ error }}
                    </div>
                </transition>

                <transition name="toast-fade">
                    <div v-if="success" class="alert-box success" style="width: 100%; margin-bottom: 0;">
                        {{ success }}
                    </div>
                </transition>

                <div style="display: flex; gap: 12px; justify-content: flex-end; width: 100%;">
                    <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
                    <AppButton variant="primary" @click="handleFormSubmit" :loading="loading" :disabled="isFormInvalid"
                        :class="{ 'button-disabled-visual': isFormInvalid }">
                        Create Account
                    </AppButton>
                </div>
            </div>
        </template>
    </AppModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
    isOpen: Boolean,
    loading: Boolean,
    error: String,
    success: String,
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
    name: '',
    email: '',
    phone: '',
    role: 'parent',
    profile: '',
    password: '',
})

const showHint = ref(false)
let hintTimeout = null

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        formData.value = {
            name: '',
            email: '',
            phone: '',
            role: 'parent',
            profile: '',
            password: '',
        }
        showHint.value = false
    }
})

const errors = ref({})

const validationHint = computed(() => {
    const data = formData.value
    const errs = {}

    if (!data.name?.trim()) errs.name = 'Full name is required.'
    if (!data.email?.trim() || !data.email.includes('@')) errs.email = 'Valid email is required.'
    if (!data.phone?.trim()) errs.phone = 'Phone number is required.'
    if (!data.role) errs.role = 'Role is required.'
    if (!data.profile || data.profile === '') errs.profile = 'Please select a profile avatar.'

    errors.value = errs
    return Object.values(errs)[0] || ''
})

const isFormInvalid = computed(() => !!validationHint.value)

const handleFormSubmit = () => {
    if (isFormInvalid.value) return
    emit('submit', { ...formData.value })
}
</script>

<style scoped>
.validation-hint-toast {
    font-size: 0.8rem;
    color: #ef4444;
    background: #fef2f2;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid #fee2e2;
    max-width: fit-content;
    animation: shake 0.4s ease;
}

@keyframes shake {

    10%,
    90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%,
    80% {
        transform: translate3d(2px, 0, 0);
    }

    30%,
    50%,
    70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%,
    60% {
        transform: translate3d(4px, 0, 0);
    }
}

.text-muted-modern {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 4px;
}

.required {
    color: #ef4444;
}

.alert-box {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
}

.alert-box.error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fee2e2;
}

.alert-box.success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #dcfce7;
}
</style>
