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
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-deep);
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}



.table-header .section-title {
  margin-bottom: 0;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-left: auto;
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
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
