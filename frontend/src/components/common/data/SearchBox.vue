<template>
  <div class="search-box-wrapper" :class="[`variant-${variant}`]">
    <img :src="getActionIcon('search')" class="search-icon" />
    <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" type="text" class="search-input"
      :placeholder="placeholder" />
  </div>
</template>

<script setup>
import { getActionIcon } from '@/utils/assetHelper'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
  variant: {
    type: String,
    default: 'default',
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
@import '@/assets/styles/components/SearchBox.css';
</style>
