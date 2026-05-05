<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { getImageUrl } from '@/utils/assetHelper'
import { parseDate, formatPrice, formatDateOnly } from '@/utils/formatUtils'
import { calculateDashboardStats } from '@/utils/statsHelper'
import { getAvatarUrl } from '@/utils/profileHelper'
import { authService } from '@/services/authService'

import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import MiniCard from '../components/common/cards/MiniCard.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import RecentEnrollmentTable from '../components/enrollments/RecentEnrollmentTable.vue'
import { enrichEnrollments } from '@/utils/enrollmentHelper'

const dataStore = useDataStore()

const userProfile = ref({
  name: 'Loading...',
  role: '...',
  profileURL: null,
})

const loading = ref(true)
const currentTermIndex = ref(0)
let termInterval = null

const activeTerms = computed(() => {
  const termData = dataStore.terms
  if (!Array.isArray(termData) || termData.length === 0) return []

  const todayStr = new Date().toISOString().split('T')[0]
  const branches = dataStore.branches

  const filtered = termData.filter(t =>
    t.status === 'active' || (t.startDate <= todayStr && t.endDate >= todayStr)
  )

  return filtered.map(t => {
    const branchIds = t.branchIds || (t.branchId ? [t.branchId] : [])
    const enrichedBranches = branchIds.map(bId => {
      const branch = branches.find(b => b.id === bId)
      return branch ? { abbr: branch.abbr, color: branch.color } : null
    }).filter(Boolean)

    return {
      ...t,
      branches: enrichedBranches
    }
  })
})

const currentTerm = computed(() => activeTerms.value[currentTermIndex.value] || null)

const stats = computed(() => {
  return calculateDashboardStats(
    dataStore.parents,
    dataStore.enrollments,
    dataStore.programs,
    dataStore.students,
    dataStore.classes,
    dataStore.branches,
    dataStore.trials
  )
})

onMounted(() => {
  authService.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) {
      userProfile.value = {
        name: 'Guest',
        role: 'Guest',
        profileURL: getImageUrl('profiles', 'avatar-guest'),
      }
      loading.value = false
      return
    }

    try {
      const profile = await authService.getUserProfile(currentUser.uid)
      userProfile.value = profile
      await dataStore.fetchAllCommonData(true)

      startTermCycling()
    } catch (err) {
      console.error('Dashboard error:', err)
      userProfile.value = {
        name: 'User',
        role: 'Unknown',
        profileURL: getImageUrl('profiles', 'avatar-guest'),
      }
    } finally {
      loading.value = false
    }
  })
})

const startTermCycling = () => {
  if (termInterval) clearInterval(termInterval)
  termInterval = setInterval(() => {
    if (activeTerms.value.length > 1) {
      currentTermIndex.value = (currentTermIndex.value + 1) % activeTerms.value.length
    }
  }, 5000)
}

onUnmounted(() => {
  if (termInterval) clearInterval(termInterval)
})

const profileImageUrl = computed(() => getAvatarUrl(userProfile.value))

const todayStats = computed(() => [
  {
    label: 'New Accounts',
    value: stats.value.today.reg,
    image: getImageUrl('dashboard/registration'),
    color: 'var(--color-info-soft)',
  },
  {
    label: 'Today Enrollments',
    value: stats.value.today.enroll,
    image: getImageUrl('dashboard/enrollment'),
    color: 'var(--color-success-soft)',
  },
  {
    label: 'Today Trial Class',
    value: stats.value.today.trial,
    image: getImageUrl('dashboard/trial'),
    color: 'var(--color-warning-soft)',
  },
  {
    label: "Today Payments",
    value: `$${formatPrice(stats.value.today.pay)}`,
    image: getImageUrl('dashboard/payment'),
    color: 'var(--color-success-soft)',
  },
])

const thisWeekStats = computed(() => [
  {
    label: 'New Accounts',
    value: stats.value.week.reg,
    image: getImageUrl('dashboard/registration'),
    color: 'var(--color-info-soft)',
  },
  {
    label: 'This Week Enrollments',
    value: stats.value.week.enroll,
    image: getImageUrl('dashboard/enrollment'),
    color: 'var(--color-success-soft)',
  },
  {
    label: 'This Week Trial Classes',
    value: stats.value.week.trial,
    image: getImageUrl('dashboard/trial'),
    color: 'var(--color-warning-soft)',
  },
  {
    label: 'This Week Payments',
    value: `$${formatPrice(stats.value.week.pay)}`,
    image: getImageUrl('dashboard/payment'),
    color: 'var(--color-success-soft)',
  },
])

const totalStats = computed(() => [
  {
    title: 'Total Enrollments',
    value: stats.value.totals.enrollments,
    image: getImageUrl('dashboard/card-top-program'),
    color: 'var(--color-primary-soft)',
  },
  {
    title: 'Total Parents',
    value: stats.value.totals.parents,
    image: getImageUrl('parent/total-parent'),
    color: 'var(--color-info-soft)',
  },
  {
    title: 'Total Students',
    value: stats.value.totals.students,
    image: getImageUrl('student/total-student'),
    color: 'var(--color-info-soft)',
  },
  {
    title: 'Total Branches',
    value: stats.value.totals.branches,
    image: getImageUrl('dashboard/card-branch'),
    color: 'var(--color-success-soft)',
  },
  {
    title: 'Total Programs',
    value: stats.value.totals.programs,
    image: getImageUrl('dashboard/card-available-program'),
    color: 'var(--color-success-soft)',
  },
  {
    title: 'Total Trial',
    value: stats.value.totals.trials,
    image: getImageUrl('dashboard/card-trial'),
    color: 'var(--color-warning-soft)',
  },
  {
    title: 'Total Revenue',
    value: `$${formatPrice(stats.value.totals.totalRevenue)}`,
    image: getImageUrl('dashboard/card-revenue'),
    color: 'var(--color-success-soft)',
  },
])


const mappedEnrollments = computed(() => {
  const raw = [...dataStore.enrollments]
    .sort((a, b) => {
      const timeB = parseDate(b.enrollAt || b.createdAt).getTime()
      const timeA = parseDate(a.enrollAt || a.createdAt).getTime()
      return timeB - timeA
    })
    .slice(0, 5)

  return enrichEnrollments(
    raw,
    dataStore.parents,
    dataStore.students,
    dataStore.getProgramWithCategory,
    dataStore.classes
  )
})
</script>

<template>
  <DashboardLayout>
    <div v-if="loading" class="flex flex-col items-center justify-center h-[60vh] gap-lg text-content-muted">
      <div class="w-12 h-12 border-4 border-surface-light border-r-primary rounded-full animate-spin"></div>
      <p class="font-semibold text-sm tracking-widest uppercase opacity-70">
        Loading Dashboard Data...
      </p>
    </div>
    <div v-else class="flex flex-col lg:flex-row gap-xl px-xl w-full h-[calc(100vh - 100px)] overflow-hidden">
      <div class="flex flex-col flex-1 min-w-0 h-full gap-lg overflow-y-auto pr-md scrollable-v">
        <section class="ui-detail-card">
          <div class="ui-section-header border-none flex items-center gap-md">
            <h2 class="ui-section-title whitespace-nowrap">Today Summary</h2>
            <div class="ui-section-divider"></div>
          </div>
          <DataMetrics :stats="todayStats" />
        </section>

        <section class="ui-detail-card">
          <div class="ui-section-header border-none flex items-center gap-md">
            <h2 class="ui-section-title whitespace-nowrap">This Week</h2>
            <div class="ui-section-divider"></div>
          </div>
          <DataMetrics :stats="thisWeekStats" />
        </section>

        <RecentEnrollmentTable :enrollments="mappedEnrollments" />
      </div>

      <div class="hidden lg:block lg:min-w-[300px] h-full min-h-0 max-w-[320px] flex-shrink-0">
        <div class="ui-detail-card h-full flex flex-col min-h-0 gap-md !p-lg">
          <div class="border-b-[1px] border-gray-200 pb-lg flex flex-col items-center text-center gap-2">
            <div class="w-24 h-24 rounded-2xl overflow-hidden bg-surface-light ring-4 ring-white shadow-md mb-2">
              <img class="w-full h-full object-cover" :src="profileImageUrl" alt="User" />
            </div>
            <div class="flex flex-col items-center">
              <p class="text-xs font-semibold text-content-muted uppercase tracking-[0.14em] mb-1 opacity-70">
                {{ userProfile?.role }}
              </p>
              <h3 class="text-xl font-bold text-content-dark tracking-tighter leading-tight">
                {{ userProfile?.name }}
              </h3>
            </div>
          </div>

          <div class="relative overflow-hidden min-h-[140px] flex flex-col">
            <Transition name="fade" mode="out-in">
              <div v-if="currentTerm" :key="currentTerm.id"
                class="px-md py-4 rounded-md border border-primary/20 bg-primary/5 flex flex-col items-center flex-1">
                <span class="text-sm font-semibold uppercase tracking-widest text-primary mb-1">Active Academic
                  Term</span>

                <span class="text-md font-bold text-content-dark tracking-tighter leading-tight mb-2 text-center">
                  {{ currentTerm.name }}
                </span>

                <div class="w-full flex flex-col gap-2.5 mt-2">
                  <!-- Branch Column Row -->
                  <div class="flex justify-center items-center border-b border-primary/10 pb-2.5 px-1">
                    <div class="flex flex-wrap justify-end gap-1">
                      <AppBadge v-for="b in currentTerm.branches" :key="b.abbr" :status="b.abbr" :type="b.color"
                        class="!px-1.5 !py-0.5 !text-xs" />
                    </div>
                  </div>

                  <!-- Date Column Row -->
                  <div class="flex justify-center items-center px-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-content-dark tabular-nums">
                        {{ formatDateOnly(currentTerm.startDate) }}
                      </span>
                      <span class="w-2 h-px bg-content-muted/30"></span>
                      <span class="text-xs font-semibold text-content-dark tabular-nums">
                        {{ formatDateOnly(currentTerm.endDate) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <div v-if="activeTerms.length > 1" class="flex justify-center gap-1 mt-2">
              <div v-for="(_, idx) in activeTerms" :key="idx" class="w-1 h-1 rounded-full transition-all duration-300"
                :class="idx === currentTermIndex ? 'bg-primary w-3' : 'bg-surface-light'">
              </div>
            </div>
          </div>

          <div class="flex flex-1 flex-col min-h-0 gap-md">
            <h3 class="flex-shrink-0 text-xs font-semibold uppercase tracking-widest text-content-dark text-center">
              Basic Information
            </h3>
            <div class="flex flex-1 flex-col min-h-0 gap-3 scrollable-v">
              <MiniCard v-for="stat in totalStats" :key="stat.title" v-bind="stat" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
