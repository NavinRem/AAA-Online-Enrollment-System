<template>
  <button
    class="app-btn"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      {
        'is-loading': loading,
        'is-disabled': disabled || loading,
        'has-icon-only': iconOnly,
      },
    ]"
    :type="type"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner"></span>

    <span v-if="$slots['icon-left'] && !loading" class="icon-span left">
      <slot name="icon-left"></slot>
    </span>

    <span v-if="icon && !loading" class="icon-span material-symbols-rounded">{{ icon }}</span>

    <span
      v-if="!iconOnly && ($slots.default || text)"
      class="btn-text"
      :class="{ 'hidden-text': loading }"
    >
      <slot>{{ text }}</slot>
    </span>

    <span v-if="$slots['icon-right'] && !loading" class="icon-span right">
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script src="./AppButton.js"></script>
<style src="./AppButton.css" scoped></style>
