<template>
  <div class="dashboard-content detail-page">
    <div v-if="loading" class="loading-state">Loading details...</div>
    <div v-else-if="errorMessage" class="error-state">
      <p>⚠️ {{ errorMessage }}</p>
      <button class="btn-back" @click="goBack">
        <img :src="getActionIcon('back')" /> Back
      </button>
    </div>

    <div v-else class="detail-container">
      <div class="content-grid main-layout-grid">
        <div class="left-content-area">
          <div class="header-section">
            <button class="btn-back" @click="goBack">
              <img :src="getActionIcon('back')" /> Back
            </button>
            <div class="header-actions">
              <slot name="header-actions"></slot>
            </div>
          </div>

          <div class="main-cards-grid" :class="{ 'is-scrollable': scrollable }">
            <slot name="left-content"></slot>
          </div>
        </div>

        <aside class="sticky-sidebar" :class="{ 'is-scrollable': rightScrollable }">
          <slot name="right-content"></slot>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { getActionIcon } from '@/utils/assetHelper'
import AppButton from '@/components/common/ui/AppButton.vue'

const props = defineProps({
  loading: Boolean,
  errorMessage: String,
  backRoute: {
    type: String,
    default: '/',
  },
  scrollable: {
    type: Boolean,
    default: false,
  },
  rightScrollable: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const goBack = () => router.push(props.backRoute)
</script>

<style>
@import '@/assets/styles/components/DetailPageLayout.css';

.header-actions:empty {
  display: none;
}
</style>
