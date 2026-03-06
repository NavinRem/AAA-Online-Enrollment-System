<template>
  <div class="search-box">
    <!-- <span class="search-icon">🔍</span> -->
    <img src="../../../assets/icons/search-svgrepo.svg" class="search-icon" />
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      :placeholder="placeholder"
    />
  </div>
</template>

<script src="./SearchBox.js"></script>
<style src="./SearchBox.css" scoped></style>
