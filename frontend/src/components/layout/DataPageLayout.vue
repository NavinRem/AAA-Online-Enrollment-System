<template>
  <div class="page-container">
    <section v-if="$slots.overview" class="overview-section card-box">
      <h2 class="section-title">{{ overviewTitle }}</h2>
      <div class="cards-row">
        <slot name="overview"></slot>
      </div>
    </section>

    <section class="table-section card-box flex-grower">
      <div class="table-responsive flex-grower">
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
<style scoped>
.card-box {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--space-xl);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-deep);
  margin-bottom: var(--space-lg);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
}



.table-header .section-title {
  margin-bottom: 0;
}

.header-actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  margin-left: auto;
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-lg);
  width: 100%;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}


</style>
