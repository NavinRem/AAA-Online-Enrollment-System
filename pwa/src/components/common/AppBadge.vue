<script setup>
import AppBadge from './ui/AppBadge.vue'
</script>

<template>
  <AppBadge v-bind="$attrs">
    <slot />
  </AppBadge>
</template>
