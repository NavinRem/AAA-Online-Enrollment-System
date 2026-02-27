<script setup>
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />
      <main class="content-area">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  background-color: #f7f9fc;
  min-height: 100vh;
}

.main-wrapper {
  flex: 1;
  margin-left: 260px; /* Sidebar width */
  display: flex;
  flex-direction: column;
}

.content-area {
  padding: 0 30px 30px 30px;
  flex: 1;
}

@media (max-width: 1024px) {
  .main-wrapper {
    margin-left: 0;
  }
}
</style>
