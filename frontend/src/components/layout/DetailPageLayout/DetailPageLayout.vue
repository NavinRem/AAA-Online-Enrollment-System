<template>
  <div class="dashboard-content detail-page">
    <div v-if="loading" class="loading-state">Loading details...</div>
    <div v-else-if="errorMessage" class="error-state">
      <p>⚠️ {{ errorMessage }}</p>
      <AppButton variant="subtle" @click="goBack">Go Back</AppButton>
    </div>

    <div v-else class="detail-container">
      <div class="content-grid main-layout-grid">
        <div class="left-content-area">
          <div class="header-section">
            <AppButton variant="light" size="sm" @click="goBack"> Back </AppButton>
            <div class="header-actions">
              <slot name="header-actions"></slot>
            </div>
          </div>

          <!-- Provide standard detail layout components via slot -->
          <div class="main-cards-grid">
            <slot name="left-content"></slot>
          </div>
        </div>

        <div class="right-content-area sticky-sidebar">
          <slot name="right-content"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/ui/AppButton/AppButton.vue'

const props = defineProps({
  loading: Boolean,
  errorMessage: String,
  backRoute: {
    type: String,
    default: '/',
  },
})

const router = useRouter()
const goBack = () => router.push(props.backRoute)
</script>

<style src="./DetailPageLayout.css" scoped></style>
