<template>
    <AppModal :show="isOpen" title="Register New Parent" @close="$emit('close')" :icon="getActionIcon('plus')">
        <form class="form-grid" @submit.prevent="handleFormSubmit">
            <div class="form-group full-width">
                <label>Full Name <span class="required">*</span></label>
                <input type="text" v-model="formData.name" placeholder="Enter full name" class="standard-input"
                    :class="{ 'field-error': isSubmittingAttempted && errors.name }" />
                <div v-if="isSubmittingAttempted && errors.name" class="field-error-msg">{{ errors.name }}</div>
            </div>

            <div class="form-group">
                <label>Email Address <span class="required">*</span></label>
                <input type="email" v-model="formData.email" placeholder="email@example.com" class="standard-input"
                    :class="{ 'field-error': isSubmittingAttempted && errors.email }" />
                <div v-if="isSubmittingAttempted && errors.email" class="field-error-msg">{{ errors.email }}</div>
            </div>

            <div class="form-group">
                <label>Phone Number <span class="required">*</span></label>
                <input type="tel" v-model="formData.phone" placeholder="e.g. +855..." class="standard-input"
                    :class="{ 'field-error': isSubmittingAttempted && errors.phone }" />
                <div v-if="isSubmittingAttempted && errors.phone" class="field-error-msg">{{ errors.phone }}</div>
            </div>

            <div class="field-item full-width profile-selector-section">
                <label class="field-label">Select Profile Avatar</label>
                <AvatarSelector v-model="formData.profileURL" />
                <p class="avatar-guidance">Only .jpg, .png, and .webp images are accepted.</p>
                <div v-if="isSubmittingAttempted && errors.profile" class="field-error-msg">{{ errors.profile }}</div>
            </div>

            <div class="form-group full-width">
                <label>Password (Temporary)</label>
                <input type="text" v-model="formData.password" placeholder="Leave blank for auto-generated"
                    class="standard-input" />
                <small class="text-muted-modern">The parent will be asked to change this on first login.</small>
            </div>
            <!-- Hidden submit for Enter key functionality -->
            <button type="submit" class="hidden"></button>
        </form>

        <template #footer>
            <div class="flex-column flex-end w-full gap-sm">
                <transition name="toast-fade">
                    <div v-if="showValidationHint && validationHint" class="validation-hint-toast">
                        ⚠️ {{ validationHint }}
                    </div>
                </transition>

                <div v-if="error || success" class="w-full">
                    <transition name="alert-fade">
                        <AppAlert v-if="error" :show="!!error" type="error" closable @close="$emit('update:error', '')">
                            {{ error }}
                        </AppAlert>
                    </transition>

                    <transition name="alert-fade">
                        <AppAlert v-if="success" :show="!!success" type="success" closable
                            @close="$emit('update:success', '')">
                            {{ success }}
                        </AppAlert>
                    </transition>
                </div>

                <div class="flex-align-center flex-end w-full gap-sm">
                    <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
                    <AppButton variant="primary" @click="handleFormSubmit" :loading="loading"
                        :disabled="loading || success" :class="{ 'button-disabled-visual': isFormInvalid || success }">
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
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
    isOpen: Boolean,
    loading: Boolean,
    error: String,
    success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const isSubmittingAttempted = ref(false)
const showValidationHint = ref(false)
let hintTimeout = null

const formData = ref({
    name: '',
    email: '',
    phone: '',
    profileURL: '',
    status: 'Active',
    password: '',
})

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        formData.value = {
            name: '',
            email: '',
            phone: '',
            profileURL: '',
            password: '',
        }
        isSubmittingAttempted.value = false
        showValidationHint.value = false
    }
})

const errors = ref({})

const validationHint = computed(() => {
    const data = formData.value
    const errs = {}

    if (!data.name?.trim()) errs.name = 'Full name is required.'
    if (!data.email?.trim() || !data.email.includes('@')) errs.email = 'Valid email is required.'
    if (!data.phone?.trim()) errs.phone = 'Phone number is required.'
    if (!data.profileURL || data.profileURL === '') errs.profile = 'Please select a profile avatar.'

    errors.value = errs
    return Object.values(errs)[0] || ''
})

const isFormInvalid = computed(() => !!validationHint.value)

const handleFormSubmit = () => {
    isSubmittingAttempted.value = true
    if (isFormInvalid.value) {
        showValidationHint.value = true
        if (hintTimeout) clearTimeout(hintTimeout)
        hintTimeout = setTimeout(() => {
            showValidationHint.value = false
        }, 3000)
        return
    }
    emit('submit', { ...formData.value, role: 'parent' })
}
</script>

<style scoped>
.validation-hint-toast {
    font-size: var(--text-xs);
    color: var(--error-color);
    background: var(--error-soft);
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--error-soft);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    max-width: fit-content;
    animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
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

.toast-fade-enter-active,
.toast-fade-leave-active {
    transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.text-muted-modern {
    display: block;
    font-size: var(--text-xs);
    color: var(--text-light);
    margin-top: 4px;
}

.required {
    color: var(--error-color);
    font-weight: bold;
    margin-left: 2px;
}

.avatar-guidance {
    font-size: var(--text-xs);
    color: var(--text-light);
    margin-top: 6px;
    font-style: italic;
    display: block;
}
</style>
