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

<template>
  <div class="flex flex-col gap-xl w-full h-full min-h-0 px-xl overflow-y-auto scrollable-v">
    <section
      v-if="$slots.overview"
      class="bg-white rounded-std p-xl shadow-sm border border-black/5 flex flex-col gap-xl"
    >
      <div class="ui-section-header border-none flex items-center gap-md">
        <h2 class="ui-section-title whitespace-nowrap">{{ overviewTitle }}</h2>
        <div class="ui-section-divider"></div>
      </div>
      <slot name="overview"></slot>
    </section>

    <section class="bg-white rounded-std p-0 shadow-sm border border-black/5 flex flex-col">
      <div class="w-full flex flex-col">
        <slot name="table"></slot>
      </div>
    </section>
  </div>
</template>
