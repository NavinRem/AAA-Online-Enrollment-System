<script setup>
import { ref, computed } from 'vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  type: {
    type: String,
    default: 'text',
  },
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
  shake: Boolean,
  inputClass: String,
})

defineEmits(['update:modelValue', 'click-disabled'])

const isPasswordVisible = ref(false)

const inputType = computed(() => {
  if (props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password'
  }
  return props.type
})

const togglePassword = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}
</script>

<template>
  <div class="flex flex-col gap-xs text-left w-full" :class="{ 'animate-shake': shake }">
    <label v-if="label" class="text-sm font-semibold text-content-muted flex items-center gap-1">
      {{ label }}
      <span v-if="required" class="text-error font-bold leading-none">*</span>
    </label>

    <div class="relative group">
      <textarea
        v-if="type === 'textarea'"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        class="w-full px-4 py-3 border-2 border-outline-std rounded-sm bg-white text-base outline-none transition-all placeholder:text-content-light/50 placeholder:italic min-h-24 resize-none"
        :class="[
          error ? 'ui-input-invalid' : 'focus:border-primary focus:ring-[3px] focus:ring-info-soft',
          disabled ? 'bg-surface-subtle opacity-60 cursor-not-allowed' : 'hover:border-primary/50',
          inputClass,
        ]"
      ></textarea>

      <input
        v-else
        :value="modelValue"
        :type="inputType"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        class="w-full px-4 py-3 border-2 border-outline-std rounded-sm bg-white text-base outline-none transition-all placeholder:text-content-light/50 placeholder:italic"
        :class="[
          error ? 'ui-input-invalid' : 'focus:border-primary focus:ring-[3px] focus:ring-info-soft',
          disabled ? 'bg-surface-subtle opacity-60 cursor-not-allowed' : 'hover:border-primary/50',
          inputClass,
        ]"
      />

      <!-- Password Toggle -->
      <button
        v-if="type === 'password'"
        type="button"
        @click="togglePassword"
        class="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-0 flex items-center opacity-40 hover:opacity-80 transition-opacity"
      >
        <img
          :src="isPasswordVisible ? getActionIcon('eye-close') : getActionIcon('eye-open')"
          alt="Toggle visibility"
          class="w-5 h-5"
        />
      </button>

      <!-- Unit/Icon Suffix (Optional) -->
      <div
        v-if="$slots.suffix"
        class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <slot name="suffix"></slot>
      </div>
      <div
        v-if="disabled"
        class="absolute inset-0 z-10 cursor-not-allowed"
        @click.stop="$emit('click-disabled')"
      ></div>
    </div>

    <!-- Error Message -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <p v-if="error" class="text-sm font-semibold text-error pl-1 mt-0.5">
        {{ error }}
      </p>
    </transition>
  </div>
</template>
