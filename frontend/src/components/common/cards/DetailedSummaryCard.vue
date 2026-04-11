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
    <h3
      v-if="title"
      class="text-2xl font-black text-content-dark tracking-tighter text-center py-4"
    >
      {{ title }}
    </h3>

    <div class="w-full">
      <slot name="outside"></slot>
    </div>

    <div class="bg-primary-soft rounded-std p-5 flex flex-col gap-4 shadow-inner">
      <div v-if="$slots.header">
        <slot name="header"></slot>
      </div>

      <h4 v-if="subtitle" class="text-lg font-black text-content-dark tracking-tight ml-1">
        {{ subtitle }}
      </h4>

      <div class="bg-white rounded-lg p-5 shadow-sm border border-outline-std">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Logic migrated to standard utility naming to resolve PostCSS expansion errors with custom tokens. */
:deep(.detail-row) {
  @apply flex flex-col mb-5 items-start last:mb-0;
}

:deep(.detail-row.align-center) {
  @apply flex-row justify-between items-center;
}

:deep(.summary-label) {
  @apply text-[15px] font-black text-content-dark mb-1 leading-none tracking-tight opacity-80;
}

:deep(.summary-value) {
  @apply text-sm text-content-muted font-bold leading-relaxed;
}

:deep(.summary-value.inline) {
  @apply inline-block ml-2;
}
</style>
