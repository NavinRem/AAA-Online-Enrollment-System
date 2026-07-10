<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AuditBadge from '@/components/common/ui/AuditBadge.vue'
import TermActionModal from '@/components/terms/TermActionModal.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import { termService } from '@/services/termService'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { formatShortDate, formatPrice, calculateClassProgress } from '@/utils/formatUtils'
import { useSearch } from '@/composables/useSearch'
import { useDataStore } from '@/stores/dataStore'

const loading = ref(false)
const items = ref([])
const branches = ref([])
const statusFilter = ref('all')
const dataStore = useDataStore()
const sortMode = ref('newest')

const router = useRouter()

const headers = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Academic Term', width: '220px' },
  { label: 'Branch', width: '120px', align: 'center' },
  { label: 'Start Date', width: '140px', align: 'center' },
  { label: 'End Date', width: '140px', align: 'center' },
  { label: 'Status', width: '110px', align: 'center' },
  { label: 'Progress', width: '160px', align: 'center' },
  { label: 'Enrolled', width: '100px', align: 'center' },
  { label: 'Trials', width: '100px', align: 'center' },
  { label: 'Revenue', width: '100px', align: 'center' },
  { label: 'Modified By', width: '140px', align: 'left' },
  { label: 'Action', width: '50px', align: 'center' },
]

const fetchData = async (force = false) => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(force, [
      'terms',
      'programs',
      'classes',
      'categories',
      'schedules',
      'branches',
      'enrollments',
      'trials',
    ])

    const terms = dataStore.terms || []
    branches.value = dataStore.branches

    const syncPayloads = []
    items.value = terms.map((term) => {
      const prog = calculateClassProgress(term.startDate, term.endDate)
      const calculatedStatus = prog.status.toLowerCase()

      if (term.status !== calculatedStatus) {
        syncPayloads.push({ id: term.id, status: calculatedStatus })
      }

      const sortedSettings = [...(term.branchSettings || [])].sort(
        (a, b) => new Date(a.endDate || a.startDate) - new Date(b.endDate || b.startDate),
      )

      const branchIds = term.branchIds || (term.branchId ? [term.branchId] : [])
      const studentIds = new Set()
      let totalRevenue = 0
      let trialCount = 0

      branchIds.forEach((bId) => {
        const setting = sortedSettings.find((s) => String(s.branchId) === String(bId))
        const startDate = new Date(setting?.startDate || term.startDate)
        const endDate = new Date(setting?.endDate || term.endDate)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)

        const branchEnrollments = dataStore.enrollments.filter((e) => {
          const isSameBranch = String(e?.['class']?.branch?.id || e?.branchId) === String(bId)
          if (!isSameBranch) return false
          const enrollDate = new Date(e.createdAt || e.enrollAt)
          return enrollDate >= startDate && enrollDate <= endDate
        })

        const activeEnrollments = branchEnrollments.filter((e) => {
          const status = String(e.status || '').toLowerCase()
          return !['cancelled', 'deleted', 'failed'].includes(status)
        })

        activeEnrollments.forEach((e) => {
          studentIds.add(e.studentId)
          const isPaid = ['paid', 'confirmed', 'success'].includes(
            String(e.paymentStatus || '').toLowerCase(),
          )
          if (isPaid) {
            totalRevenue += Number(e.amount || e.finalPrice || e.totalPrice || 0)
          }
        })

        const branchTrials = dataStore.trials.filter((t) => {
          const isSameBranch = String(t.branch?.id || t.branchId) === String(bId)
          const trialDate = new Date(t.trialDate)
          return isSameBranch && trialDate >= startDate && trialDate <= endDate
        })
        trialCount += branchTrials.length
      })

      return {
        ...term,
        status: calculatedStatus,
        branchIds,
        totalSessions: term.totalSessions || 11,
        branchSettings: sortedSettings,
        enrollmentCount: studentIds.size,
        totalRevenue,
        trialCount,
      }
    })

    // Perform background sync for critical mismatches without blocking the UI
    if (syncPayloads.length > 0) {
      Promise.all(
        syncPayloads.map((p) => termService.updateTerm(p.id, { status: p.status })),
      ).catch((err) => console.warn('[TermSync] Background sync partially failed', err))
    }
  } catch (err) {
    console.error('Failed to fetch terms', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchData(false))

const { searchQuery, searchResults } = useSearch(items, (item) => {
  const branchText = (item.branchIds || [])
    .map((id) => branches.value.find((b) => String(b.id) === String(id))?.abbr || '')
    .filter(Boolean)
    .join(' ')
  return [item.name, item.status, branchText].filter(Boolean).join(' ').toLowerCase()
})

const currentPage = ref(1)
const pageSize = 10

const totalItems = computed(() => displayItems.value.length)
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return displayItems.value.slice(start, end)
})

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

// Metrics logic
const statsCards = computed(() => {
  const stats = items.value.map((item) => calculateClassProgress(item.startDate, item.endDate))
  const mostEnrolledTerm = [...items.value].sort((a, b) => b.enrollmentCount - a.enrollmentCount)[0]
  const mostTrialsTerm = [...items.value].sort((a, b) => b.trialCount - a.trialCount)[0]

  return [
    {
      label: 'Total Terms',
      value: items.value.length,
      image: getImageUrl('enrollment/total-enrollment'),
    },
    {
      label: 'Most Popular',
      value: `${mostEnrolledTerm?.enrollmentCount} Enrolled`,
      subtitle: mostEnrolledTerm?.name,
      image: getImageUrl('programs/active-program'),
    },
    {
      label: 'Highest Interest',
      value: `${mostTrialsTerm?.trialCount} Trials`,
      subtitle: mostTrialsTerm?.name,
      image: getImageUrl('enrollment/total-paid-enrollment'),
    },
    {
      label: 'Active Terms',
      value: stats.filter((s) => ['active', 'ongoing', 'full'].includes(s.status)).length,
      image: getImageUrl('programs/upcoming-program'),
    },
  ]
})

const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const modal = ref({
  isOpen: false,
  type: 'add',
  submitting: false,
  selectedTerm: null,
  error: '',
  success: '',
})

const addClassModal = ref({
  isOpen: false,
  selectedTerm: null,
  loading: false,
  error: '',
  success: '',
})

const openAddClass = (term) => {
  addClassModal.value.selectedTerm = term
  addClassModal.value.error = ''
  addClassModal.value.success = ''
  addClassModal.value.isOpen = true
}

const handleAddClass = async (payload) => {
  addClassModal.value.loading = true
  addClassModal.value.error = ''
  try {
    const term = addClassModal.value.selectedTerm
    await termService.updateTerm(term.id, { classIds: payload.classIds })
    addClassModal.value.success = 'Classes added successfully'
    setTimeout(() => {
      addClassModal.value.isOpen = false
      fetchData(true)
    }, 1500)
  } catch (err) {
    addClassModal.value.error = err.message || 'Failed to add classes'
  } finally {
    addClassModal.value.loading = false
  }
}

const openModal = (type = 'add', item = null) => {
  modal.value.selectedTerm = item
  modal.value.type = type
  modal.value.error = ''
  modal.value.success = ''
  modal.value.isOpen = true
}

const handleTableAction = ({ type, item }) => {
  openModal(type, item)
}

const handleActionSubmit = async (payload) => {
  modal.value.submitting = true
  modal.value.error = ''
  modal.value.success = ''

  try {
    if (modal.value.type === 'delete') {
      await termService.deleteTerm(payload.id)
      modal.value.success = 'Term deleted successfully'
    } else if (modal.value.type === 'edit') {
      await termService.updateTerm(modal.value.selectedTerm.id, payload)
      modal.value.success = 'Term updated successfully'
    } else {
      const res = await termService.createTerm(payload)
      newlyCreatedId.value = res.id
      modal.value.success = 'Term created successfully'
    }

    fetchData(true)
    // Auto close after 1.5s on success
    setTimeout(() => {
      if (modal.value.isOpen) {
        modal.value.isOpen = false
        modal.value.selectedTerm = null
      }
    }, 1500)
  } catch (err) {
    modal.value.error = err.message || 'Term action failed'
    console.error('Term action failed:', err)
  } finally {
    modal.value.submitting = false
  }
}

const sortedItems = computed(() => {
  return [...searchResults.value].sort((a, b) => {
    if (sortMode.value === 'enrollments') return b.enrollmentCount - a.enrollmentCount
    if (sortMode.value === 'trials') return b.trialCount - a.trialCount
    if (sortMode.value === 'revenue') return b.totalRevenue - a.totalRevenue
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })
})

const displayItems = computed(() => {
  if (statusFilter.value === 'all') return sortedItems.value
  return sortedItems.value.filter((item) => {
    const prog = calculateClassProgress(item.startDate, item.endDate)
    if (statusFilter.value === 'upcoming') return prog.status === 'upcoming'
    if (statusFilter.value === 'active')
      return prog.status === 'active' || prog.status === 'ongoing' || prog.status === 'available'
    if (statusFilter.value === 'archived') return prog.isArchived
    return true
  })
})

const isTermReadOnly = (item) => {
  const prog = calculateClassProgress(item.startDate, item.endDate)
  const status = prog.status.toLowerCase()
  return status === 'active' || status === 'ongoing' || status === 'available' || prog.isArchived
}

const goToDetail = (item) => {
  router.push(`/terms/${item.id}`)
}

const getGroupedSettings = (item) => {
  if (!item.branchSettings?.length) return []

  const groups = []
  item.branchSettings.forEach((setting) => {
    const key = `${setting.startDate}_${setting.endDate}`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      const progress = calculateClassProgress(
        setting.startDate,
        setting.endDate,
        null,
        null,
        item.totalSessions,
      )
      group = {
        key,
        startDate: setting.startDate,
        endDate: setting.endDate,
        status: progress.status,
        totalSessions: item.totalSessions,
        branchIds: [],
      }
      groups.push(group)
    }
    group.branchIds.push(setting.branchId)
  })
  return groups
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Term Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard
            v-for="card in statsCards"
            :key="card.label"
            v-bind="card"
            :loading="loading"
          />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Term List"
          :headers="headers"
          :items="paginatedItems"
          :loading="loading"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search by term name, status or branch..."
          :hasPagination="true"
          :currentPage="currentPage"
          :pageSize="pageSize"
          :totalItems="totalItems"
          @update:currentPage="currentPage = $event"
          :hasSort="false"
          :rowClass="getRowClass"
          @action="handleTableAction"
          @row-click="goToDetail"
        >
          <template #toolbar-actions>
            <div class="flex items-center gap-3">
              <AppButton variant="primary" size="md" @click="openModal('add')">
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-light">New Term</span>
              </AppButton>
            </div>
          </template>

          <template
            #row="{
              item,
              index,
              headers,
              toggleMenu,
              activeMenuId,
              isMenuAbove,
              menuStyles,
              closeMenu,
            }"
          >
            <td class="ui-cell text-center" :style="{ width: headers[0].width }">
              <span
                v-if="calculateClassProgress(item.startDate, item.endDate).status === 'ongoing'"
                class="text-xs"
                >🔥</span
              >
              <span v-else>{{ index + 1 }}</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="flex items-center gap-4 group">
                <div class="flex flex-col">
                  <span class="leading-tight">{{ item.name }}</span>
                  <span class="mt-0.5 text-content-muted"
                    >{{ item.totalSessions }} Weekly Sessions</span
                  >
                </div>
              </div>
            </td>

            <!-- Branch Column -->
            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <template v-if="item.branchSettings?.length">
                  <div
                    v-for="group in getGroupedSettings(item)"
                    :key="group.key"
                    class="flex items-center justify-center gap-1 h-8"
                  >
                    <AppBadge
                      v-for="bId in group.branchIds"
                      :key="bId"
                      :status="branches.find((b) => String(b.id) === String(bId))?.abbr"
                      :type="branches.find((b) => String(b.id) === String(bId))?.color || 'neutral'"
                    />
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center h-8">
                    <span class="">Global</span>
                  </div>
                </template>
              </div>
            </td>

            <!-- Start Date Column -->
            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <template v-if="item.branchSettings?.length">
                  <div
                    v-for="group in getGroupedSettings(item)"
                    :key="group.key"
                    class="flex items-center justify-center h-8"
                  >
                    <AppBadge :status="formatShortDate(group.startDate)" type="green" />
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center h-8">
                    <AppBadge :status="formatShortDate(item.startDate)" type="green" />
                  </div>
                </template>
              </div>
            </td>

            <!-- End Date Column -->
            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <template v-if="item.branchSettings?.length">
                  <div
                    v-for="group in getGroupedSettings(item)"
                    :key="group.key"
                    class="flex items-center justify-center h-8"
                  >
                    <AppBadge :status="formatShortDate(group.endDate)" type="red" />
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center h-8">
                    <AppBadge :status="formatShortDate(item.endDate)" type="red" />
                  </div>
                </template>
              </div>
            </td>

            <!-- Status Column: computed live so it reflects today's actual state -->
            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <template v-if="item.branchSettings?.length">
                  <div
                    v-for="group in getGroupedSettings(item)"
                    :key="group.key"
                    class="flex items-center justify-center h-8"
                  >
                    <AppBadge
                      :status="
                        calculateClassProgress(
                          group.startDate,
                          group.endDate,
                          null,
                          null,
                          group.totalSessions,
                        ).status
                      "
                    />
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center h-8">
                    <AppBadge
                      :status="
                        calculateClassProgress(
                          item.startDate,
                          item.endDate,
                          null,
                          null,
                          item.totalSessions,
                        ).status
                      "
                    />
                  </div>
                </template>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6 px-4">
                <template v-if="item.branchSettings?.length">
                  <div
                    v-for="group in getGroupedSettings(item)"
                    :key="group.key"
                    class="w-full max-w-40 flex items-center gap-3 h-8 justify-center"
                  >
                    <div class="flex items-center min-w-10 leading-none gap-1">
                      <span class="text-sm font-bold text-content-dark">{{
                        calculateClassProgress(
                          group.startDate,
                          group.endDate,
                          null,
                          null,
                          group.totalSessions,
                        ).remainingSessions
                      }}</span>
                      <span class="text-xs font-bold text-content-dark/60">Left</span>
                    </div>
                    <div
                      class="flex-1 h-1.5 rounded-full overflow-hidden flex border border-outline-std/5 bg-surface-dark/20"
                    >
                      <div
                        class="h-full bg-primary transition-all duration-700"
                        :style="{
                          width:
                            calculateClassProgress(
                              group.startDate,
                              group.endDate,
                              null,
                              null,
                              group.totalSessions,
                            ).percentage + '%',
                        }"
                      ></div>
                      <div
                        class="h-full bg-content-light/30 transition-all duration-700"
                        :style="{
                          width:
                            100 -
                            calculateClassProgress(
                              group.startDate,
                              group.endDate,
                              null,
                              null,
                              group.totalSessions,
                            ).percentage +
                            '%',
                        }"
                      ></div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div
                    v-for="(prog, index) in [
                      calculateClassProgress(
                        item.startDate,
                        item.endDate,
                        null,
                        null,
                        item.totalSessions,
                      ),
                    ]"
                    :key="index"
                    class="w-full max-w-40 flex items-center gap-3 h-8 justify-center"
                  >
                    <div class="flex flex-col items-start min-w-10 leading-none gap-0.5">
                      <span class="text-sm font-bold text-content-dark">{{
                        prog.remainingSessions
                      }}</span>
                      <span class="text-xs font-bold text-content-dark/60">Left</span>
                    </div>
                    <div
                      class="flex-1 h-1.5 rounded-full overflow-hidden flex border border-outline-std/5 bg-surface-dark/20"
                    >
                      <div
                        class="h-full bg-primary transition-all duration-700"
                        :style="{ width: prog.percentage + '%' }"
                      ></div>
                      <div
                        class="h-full bg-surface-dark/10 transition-all duration-700"
                        :style="{ width: 100 - prog.percentage + '%' }"
                      ></div>
                    </div>
                  </div>
                </template>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="flex flex-col items-center justify-center gap-1">
                <AppBadge :status="item.enrollmentCount || 0" type="blue" />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <div class="flex flex-col items-center justify-center gap-1">
                <AppBadge :status="item.trialCount || 0" type="purple" />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[9].width }">
              <div class="flex flex-col items-center justify-center gap-1">
                <AppBadge :status="`$${formatPrice(item.totalRevenue || 0)}`" type="green" />
              </div>
            </td>

            <!-- Modified By -->
            <td class="ui-cell text-left">
              <AuditBadge :meta="item.modifiedBy || item.createdBy" :item="item" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[11].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)"
                >
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
                </button>

                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="activeMenuId === item.id"
                      class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <template v-if="!isTermReadOnly(item)">
                        <button
                          class="ui-dropdown-item ui-dropdown-item-info group"
                          @click="
                            () => {
                              openModal('edit', item)
                              closeMenu()
                            }
                          "
                        >
                          <img
                            :src="getActionIcon('edit')"
                            class="w-4 h-4 opacity-40 group-hover:opacity-100"
                          />
                          <span>Edit</span>
                        </button>
                        <button
                          v-if="
                            calculateClassProgress(item.startDate, item.endDate).status ===
                            'upcoming'
                          "
                          class="ui-dropdown-item ui-dropdown-item-info group"
                          @click="
                            () => {
                              openAddClass(item)
                              closeMenu()
                            }
                          "
                        >
                          <img
                            :src="getActionIcon('plus')"
                            class="w-4 h-4 opacity-40 group-hover:opacity-100"
                          />
                          <span>Add Class</span>
                        </button>
                        <div class="h-px bg-surface-light mx-1 my-1"></div>
                      </template>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold"
                        @click="
                          () => {
                            handleTableAction({ type: 'delete', item })
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        Delete
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <TermActionModal
      v-if="modal.isOpen"
      :isOpen="modal.isOpen"
      :type="modal.type"
      :loading="modal.submitting"
      :term="modal.selectedTerm"
      :branches="branches"
      :terms="items"
      :error="modal.error"
      :success="modal.success"
      @close="
        () => {
          modal.isOpen = false
          modal.selectedTerm = null
        }
      "
      @submit="handleActionSubmit"
    />

    <ClassActionModal
      v-if="addClassModal.isOpen"
      :isOpen="addClassModal.isOpen"
      type="add"
      :context="{
        termId: addClassModal.selectedTerm?.id,
        termName: addClassModal.selectedTerm?.name,
        offeringIds: addClassModal.selectedTerm?.offerings?.map((o) => o.classId) || [],
        existingOfferings: addClassModal.selectedTerm?.offerings || [],
      }"
      :loading="addClassModal.loading"
      :error="addClassModal.error"
      :success="addClassModal.success"
      @close="addClassModal.isOpen = false"
      @submit="handleAddClass"
    />
  </DashboardLayout>
</template>
