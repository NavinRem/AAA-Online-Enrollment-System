<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: String,
})
</script>

<template>
  <div class="w-full flex flex-col gap-lg">
    <h3 v-if="title" class="text-2xl font-bold text-content-dark tracking-tighter text-center py-4">
      {{ title }}
    </h3>

    <div class="w-full">
      <slot name="outside"></slot>
    </div>

    <div class="bg-primary-soft rounded-std p-5 flex flex-col gap-4 shadow-inner">
      <div v-if="$slots.header">
        <slot name="header"></slot>
      </div>

      <h4 v-if="subtitle" class="text-lg font-bold text-content-dark tracking-tight ml-1">
        {{ subtitle }}
      </h4>

      <div class="bg-white rounded-lg p-5 shadow-sm border border-outline-std">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
