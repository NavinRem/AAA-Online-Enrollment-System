<script setup>
defineProps({
  title: String,
  avatarUrl: String,
  loading: Boolean,
  hasAvatar: {
    type: Boolean,
    default: true,
  },
})

// Use dynamic import helper if needed, but for now we'll pass full strings
</script>

<template>
  <div class="detail-card">
    <h3 v-if="title" class="card-caption">{{ title }}</h3>

    <div v-if="hasAvatar" class="avatar-wrapper">
      <img :src="avatarUrl" :alt="title" class="avatar-icon" onerror="
          this.src =
            'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2300aeef\'><path d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/></svg>'
        " />
    </div>

    <div class="info-block-light">
      <slot v-if="!loading"></slot>
      <div v-else class="loading-shimmer">Loading...</div>
    </div>
  </div>
</template>

<style scoped>
.detail-card {
  background: var(--white);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  text-align: left;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.card-caption {
  font-weight: 850;
  color: var(--text-deep);
  margin: 0 0 20px;
  font-size: 1.3rem;
  letter-spacing: -0.3px;
  text-align: center;
}

.avatar-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  border-radius: 50%;
  border: 2px solid var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  background: var(--bg-subtle);
  overflow: hidden;
}

.avatar-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

/* Specific styling for SVG icons used as avatars to prevent huge scaling */
.avatar-icon[src$=".svg"] {
  object-fit: contain;
  padding: 15px;
  background: var(--bg-subtle);
}

.info-block-light {
  background: var(--primary-soft);
  border-radius: 12px;
  padding: 18px 20px;
  text-align: left;
  flex-grow: 1;
}

:deep(p) {
  margin: 0 0 12px;
  font-size: 1rem;
  color: var(--text-deep);
  line-height: 1.5;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
}

:deep(p:last-child) {
  margin-bottom: 0;
}

:deep(strong) {
  color: var(--text-deep);
  font-weight: 800;
  font-size: 1.05rem;
}

.loading-shimmer {
  color: var(--text-light);
  text-align: center;
}
</style>
