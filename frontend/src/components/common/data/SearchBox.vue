<template>
  <div class="search-box">
    <img :src="getActionIcon('search')" class="search-icon" />
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      :placeholder="placeholder"
    />
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
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
@import '@/assets/styles/components/SearchBox.css';
</style>
