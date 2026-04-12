<template>
  <div class="flex flex-col gap-xl w-full flex-1 h-full px-8 pb-8 overflow-y-auto min-h-0">
    <section v-if="$slots.overview" class="bg-white rounded-std p-xl shadow-sm border border-black/5">
      <div class="ui-section-header !mb-md !pb-xs border-none flex items-center gap-md">
        <h2 class="ui-section-title !text-base whitespace-nowrap">{{ overviewTitle }}</h2>
        <div class="ui-section-divider"></div>
      </div>
      <slot name="overview"></slot>
    </section>

    <section class="bg-white rounded-std p-0 shadow-sm border border-black/5 flex-1 flex flex-col overflow-hidden">
      <div class="w-full h-full flex flex-col overflow-hidden">
        <slot name="table"></slot>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  overviewTitle: {
    type: String,
    default: 'Overview',
  },
  listTitle: {
    type: String,
    default: 'Lists',
  },
})
</script>
