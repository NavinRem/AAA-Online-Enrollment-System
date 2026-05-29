<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { getImageUrl } from '@/utils/assetHelper'
import { formatPrice, calculateClassProgress } from '@/utils/formatUtils'
import { calculateDashboardStats } from '@/utils/statsHelper'
import { getAvatarUrl } from '@/utils/profileHelper'
import { authService } from '@/services/authService'

import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import MiniCard from '../components/common/cards/MiniCard.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import RecentEnrollmentTable from '../components/enrollments/RecentEnrollmentTable.vue'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import { formatDateOnly, parseDate } from '@/utils/formatUtils'

const dataStore = useDataStore()

const userProfile = ref({
  name: 'Loading...',
  role: '...',
  profileURL: null,
})

const loading = ref(true)
const currentTermIndex = ref(0)
let termInterval = null

const getGroupedSettings = (item) => {
  if (!item.branchSettings?.length) return []

  const groups = []
  item.branchSettings.forEach((setting) => {
    const key = `${setting.startDate}_${setting.endDate}`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      const progress = calculateClassProgress(setting.startDate, setting.endDate)
      group = {
        key,
        startDate: setting.startDate,
        endDate: setting.endDate,
        status: progress.status,
        branchIds: [],
      }
      groups.push(group)
    }
    group.branchIds.push(setting.branchId)
  })
  return groups.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
}

const getTermPanelHeader = (term) => {
  if (!term) return 'Academic Term'
  const todayStr = new Date().toISOString().split('T')[0]

  const allGroups = term.groupedSettings || getGroupedSettings(term)
  const isAnyActive =
    allGroups.length > 0
      ? allGroups.some((g) => g.startDate <= todayStr && g.endDate >= todayStr)
      : term.startDate <= todayStr && term.endDate >= todayStr

  if (isAnyActive) return 'Active Academic Term'

  const isAnyUpcoming =
    allGroups.length > 0 ? allGroups.some((g) => g.startDate > todayStr) : term.startDate > todayStr

  if (isAnyUpcoming) return 'Upcoming Academic Term'

  return 'Recent Academic Term'
}

const isArchived = (endDate) => {
  if (!endDate) return false
  const todayStr = new Date().toISOString().split('T')[0]
  return endDate < todayStr
}

const activeTerms = computed(() => {
  const termData = dataStore.terms
  if (!Array.isArray(termData) || termData.length === 0) return []

  const todayStr = new Date().toISOString().split('T')[0]
  const branches = dataStore.branches

  // Candidates: terms that have at least one branch or global date not yet archived
  let candidates = termData.filter((t) => {
    const allGroups = getGroupedSettings(t)
    if (allGroups.length > 0) {
      return allGroups.some((g) => g.endDate >= todayStr)
    }
    return t.endDate >= todayStr
  })

  // Fallback: If everything is archived, show the most recently archived term
  if (candidates.length === 0) {
    const archived = [...termData].sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
    if (archived.length > 0) {
      candidates = [archived[0]]
    }
  } else {
    // Sort active/upcoming candidates by start date (closest to today first)
    candidates.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  }

  return candidates.map((t) => {
    const allGroups = getGroupedSettings(t)

    const branchIds = t.branchIds || (t.branchId ? [t.branchId] : [])
    const enrichedBranches = branchIds
      .map((bId) => {
        const branch = branches.find((b) => String(b.id) === String(bId))
        return branch ? { abbr: branch.abbr, color: branch.color } : null
      })
      .filter(Boolean)

    return {
      ...t,
      branches: enrichedBranches,
      groupedSettings: allGroups, // Always show all branch groups, even if some are archived
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
    dataStore.trials,
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
    if (activeTerms.value?.length > 1) {
      currentTermIndex.value = (currentTermIndex.value + 1) % activeTerms.value.length
    }
  }, 5000)
}

onUnmounted(() => {
  if (termInterval) clearInterval(termInterval)
})

const profileImageUrl = computed(() => getAvatarUrl(userProfile.value))

const todayStats = computed(() => {
  const todayPay = `$${formatPrice(stats.value.today.pay)}`
  return [
    {
      label: 'Today New Accounts',
      value: stats.value.today.reg,
      image: getImageUrl('dashboard/registration'),
    },
    {
      label: 'Today Enrollments',
      value: stats.value.today.enroll,
      image: getImageUrl('dashboard/enrollment'),
    },
    {
      label: 'Today Trial Class',
      value: stats.value.today.trial,
      image: getImageUrl('dashboard/trial'),
    },
    {
      label: 'Today Payments',
      value: todayPay,
      image: getImageUrl('dashboard/payment'),
    },
  ]
})

const thisWeekStats = computed(() => {
  const weekPay = `$${formatPrice(stats.value.week.pay)}`
  return [
    {
      label: 'This Week New Accounts',
      value: stats.value.week.reg,
      image: getImageUrl('dashboard/registration'),
    },
    {
      label: 'This Week Enrollments',
      value: stats.value.week.enroll,
      image: getImageUrl('dashboard/enrollment'),
    },
    {
      label: 'This Week Trial Classes',
      value: stats.value.week.trial,
      image: getImageUrl('dashboard/trial'),
    },
    {
      label: 'This Week Payments',
      value: weekPay,
      image: getImageUrl('dashboard/payment'),
    },
  ]
})

const totalStats = computed(() => {
  const totalRev = `$${formatPrice(stats.value.totals.totalRevenue)}`
  return [
    {
      title: 'Total Enrollments',
      value: stats.value.totals.enrollments,
      image: getImageUrl('dashboard/card-top-program'),
    },
    {
      title: 'Total Parents',
      value: stats.value.totals.parents,
      image: getImageUrl('parent/total-parent'),
    },
    {
      title: 'Total Students',
      value: stats.value.totals.students,
      image: getImageUrl('student/total-student'),
    },
    {
      title: 'Total Branches',
      value: stats.value.totals.branches,
      image: getImageUrl('dashboard/card-branch'),
    },
    {
      title: 'Total Programs',
      value: stats.value.totals.programs,
      image: getImageUrl('dashboard/card-available-program'),
    },
    {
      title: 'Total Trial',
      value: stats.value.totals.trials,
      image: getImageUrl('dashboard/card-trial'),
    },
    {
      title: 'Total Revenue',
      value: totalRev,
      image: getImageUrl('dashboard/card-revenue'),
    },
  ]
})

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
    dataStore.classes,
  )
})
</script>

<template>
  <DashboardLayout>
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center h-[60vh] gap-lg text-content-muted"
    >
      <div
        class="w-12 h-12 border-4 border-surface-light border-r-primary rounded-full animate-spin"
      ></div>
      <p class="font-semibold text-sm opacity-70">Loading Dashboard Data...</p>
    </div>
    <div
      v-else
      class="flex flex-col lg:flex-row gap-xl px-xl pb-xl w-full h-[calc(100vh - 100px)] overflow-hidden"
    >
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

      <div class="hidden lg:block lg:min-w-72 h-full min-h-0 max-w-80 flex-shrink-0">
        <div class="ui-detail-card h-full flex flex-col min-h-0 gap-md !p-lg">
          <div
            class="border-b-[1px] border-gray-200 pb-lg flex flex-col items-center text-center gap-2"
          >
            <div
              class="w-24 h-24 rounded-2xl overflow-hidden bg-surface-light ring-4 ring-white shadow-md mb-2"
            >
              <img class="w-full h-full object-cover" :src="profileImageUrl" alt="User" />
            </div>
            <div class="flex flex-col items-center">
              <p class="text-xs font-semibold text-content-muted tracking-[0.14em] mb-1 opacity-70">
                {{ userProfile?.role }}
              </p>
              <h3 class="text-xl font-bold text-content-dark tracking-tighter leading-tight">
                {{ userProfile?.name }}
              </h3>
            </div>
          </div>

          <div class="relative overflow-hidden min-h-36 flex flex-col">
            <div
              class="px-md py-4 rounded-md bg-primary-soft border border-outline-std flex flex-col items-center justify-center flex-1"
            >
              <span class="text-md font-semibold text-primary-dark mb-1">
                {{ getTermPanelHeader(currentTerm) }}
              </span>

              <Transition name="slide" mode="out-in">
                <div
                  v-if="currentTerm"
                  :key="currentTerm.id"
                  class="w-full flex flex-col items-center"
                >
                  <span
                    class="text-lg font-bold text-content-dark tracking-tighter leading-tight mb-2 text-center"
                  >
                    {{ currentTerm.name }}
                  </span>

                  <div class="w-full flex flex-col gap-3 mt-2">
                    <template v-if="currentTerm.groupedSettings?.length">
                      <div
                        v-for="group in currentTerm.groupedSettings"
                        :key="group.key"
                        class="flex flex-col items-center gap-1.5 border-b border-primary/10 last:border-0 pb-3 last:pb-0 w-full"
                      >
                        <div class="flex justify-center gap-1">
                          <AppBadge
                            v-for="bId in group.branchIds"
                            :key="bId"
                            :status="
                              dataStore.branches.find((b) => String(b.id) === String(bId))?.abbr
                            "
                            :type="
                              dataStore.branches.find((b) => String(b.id) === String(bId))?.color ||
                              'neutral'
                            "
                          />
                        </div>
                        <div
                          class="flex w-full justify-center items-center gap-2 px-3 py-1 rounded-full border transition-colors"
                          :class="
                            isArchived(group.endDate)
                              ? 'bg-surface-subtle border-outline-std/5 opacity-60'
                              : 'bg-white border-primary/5'
                          "
                        >
                          <span
                            class="text-xs font-bold tabular-nums"
                            :class="
                              isArchived(group.endDate)
                                ? 'text-content-muted/70'
                                : 'text-content-muted'
                            "
                            >{{ formatDateOnly(group.startDate) }}</span
                          >
                          <span
                            class="font-black text-xs"
                            :class="
                              isArchived(group.endDate)
                                ? 'text-content-muted/30'
                                : 'text-content-muted'
                            "
                            >→</span
                          >
                          <span
                            class="text-xs font-bold tabular-nums"
                            :class="
                              isArchived(group.endDate)
                                ? 'text-content-muted/70'
                                : 'text-content-muted'
                            "
                            >{{ formatDateOnly(group.endDate) }}</span
                          >
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="flex flex-col items-center gap-1.5 w-full">
                        <div class="flex flex-wrap justify-center gap-1">
                          <AppBadge
                            v-for="b in currentTerm.branches"
                            :key="b.abbr"
                            :status="b.abbr"
                            :type="b.color"
                          />
                        </div>
                        <div
                          class="flex items-center gap-2 px-3 py-1 rounded-full border transition-colors"
                          :class="
                            isArchived(currentTerm.endDate)
                              ? 'bg-surface-subtle border-outline-std/5 opacity-60'
                              : 'bg-white border-primary/5'
                          "
                        >
                          <span
                            class="text-xs font-bold tabular-nums"
                            :class="
                              isArchived(currentTerm.endDate)
                                ? 'text-content-muted/70'
                                : 'text-content-muted'
                            "
                            >{{ formatDateOnly(currentTerm.startDate) }}</span
                          >
                          <span
                            class="font-black text-xs"
                            :class="
                              isArchived(currentTerm.endDate)
                                ? 'text-content-muted/30'
                                : 'text-content-muted/30'
                            "
                            >→</span
                          >
                          <span
                            class="text-xs font-bold tabular-nums"
                            :class="
                              isArchived(currentTerm.endDate)
                                ? 'text-content-muted/70'
                                : 'text-content-muted'
                            "
                            >{{ formatDateOnly(currentTerm.endDate) }}</span
                          >
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
                <div v-else key="no-term" class="flex flex-col items-center justify-center py-2">
                  <span class="text-sm font-semibold text-content-muted">No terms defined</span>
                  <router-link
                    to="/terms"
                    class="text-xs text-primary font-bold mt-2 hover:underline"
                  >
                    Create Term
                  </router-link>
                </div>
              </Transition>
            </div>

            <div v-if="activeTerms.length > 1" class="flex justify-center gap-1 mt-2">
              <div
                v-for="(term, idx) in activeTerms"
                :key="term.id || idx"
                class="w-1 h-1 rounded-full transition-all duration-300"
                :class="idx === currentTermIndex ? 'bg-primary w-3' : 'bg-surface-light'"
              ></div>
            </div>
          </div>

          <div class="flex flex-1 flex-col min-h-0 gap-md">
            <h6 class="flex-shrink-0 font-bold text-content-dark text-center">Basic Information</h6>
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
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
