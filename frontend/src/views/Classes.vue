<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import { classService } from '@/services/classService'
import { termService } from '@/services/termService'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { useSearch } from '@/composables/useSearch'
import {
  sortSchedulesChronologically
} from '@/utils/formatUtils'

const router = useRouter()
const dataStore = useDataStore()
const loading = ref(true)

// Filters have been removed for Master Catalog view

onMounted(() => {
  fetchClasses()
})

const classHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Class Identity', width: '200px' },
  { label: 'Branches', width: '150px', align: 'center' },
  { label: 'Schedules', width: '180px', align: 'center' },
  { label: 'Status', width: '110px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

const fetchClasses = async () => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(true, [
      'classes',
      'programs',
      'categories',
      'schedules',
      'terms',
      'branches',
    ])
  } finally {
    loading.value = false
  }
}

const masterClasses = computed(() => {
  const products = dataStore.classes || []

  return products
    .map((product) => {
      // Enrich program with latest category data for accurate profile URLs
      const liveProgram = dataStore.programs.find(
        (p) => p.id === product.programId || p.id === product.program?.id,
      )
      const category = dataStore.categories.find((c) => c.id === liveProgram?.categoryId)

      const program = liveProgram
        ? {
            ...liveProgram,
            category: {
              name: category?.name,
              profileURL: category?.profileURL,
            },
          }
        : product.program

      // Ensure branches exist directly on the product or resolve from branchIds
      let branches = product.branches || []
      if (branches.length === 0 && product.branchIds) {
        branches = product.branchIds
          .map((bid) => dataStore.branches.find((b) => String(b.id) === String(bid)))
          .filter(Boolean)
      }

      // Sort schedules
      let schedules = product.schedules || []
      if (schedules.length === 0 && product.scheduleIds) {
        schedules = product.scheduleIds
          .map((sid) => dataStore.schedules.find((s) => String(s.id) === String(sid)))
          .filter(Boolean)
      }

      schedules = sortSchedulesChronologically(schedules)

      schedules = schedules.map((sched) => {
        let scheduleStatus = product.status || 'available'
        const computedStatus = scheduleStatus

        return {
          ...sched,
          computedStatus,
        }
      })

      const branchesText = branches.map((b) => `${b.abbr} ${b.name}`).join(' ')
      const schedulesText = schedules.map((s) => `${s.day} ${s.time}`).join(' ')

      return {
        id: product.id,
        classProduct: product,
        program,
        branches,
        schedules,
        status: product.status === 'active' ? 'available' : (product.status || 'available'),
        searchText: [program?.name, branchesText, schedulesText, product.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
        createdAt: product.createdAt || 0,
      }
    })
    .sort((a, b) => {
      // Primary sort: Newest created/updated first
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB - dateA
    })
})

const { searchQuery, searchResults } = useSearch(masterClasses, (o) => {
  return o.searchText || ''
})

const currentPage = ref(1)
const pageSize = 10

const totalItems = computed(() => searchResults.value.length)
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return searchResults.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const statsCards = computed(() => {
  const products = dataStore.classes || []
  const availableCount = products.filter((p) => p.status === 'available' || p.status === 'active').length
  const upcomingCount = products.filter((p) => p.status === 'upcoming').length

  const totalProductsCount = products.length
  const categoriesCount = dataStore.categories?.length || 0

  return [
    {
      label: 'Total Classes',
      value: totalProductsCount,
      image: getImageUrl('programs/total-program'),
    },
    {
      label: 'Available',
      value: availableCount,
      image: getImageUrl('programs/active-program'),
    },
    {
      label: 'Upcoming',
      value: upcomingCount,
      image: getImageUrl('enrollment/total-enrollment'),
    },
    {
      label: 'Categories',
      value: categoriesCount,
      image: getImageUrl('programs/total-program'),
    },
  ]
})

const modal = ref({
  isOpen: false,
  type: 'add',
  classItem: null,
  context: null, // { termId, offeringId, scheduleId, etc }
  loading: false,
  error: '',
  success: '',
})

const openAddModal = () => {
  modal.value = {
    isOpen: true,
    type: 'add',
    classItem: null,
    context: null,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  modal.value.isOpen = false
  modal.value.error = ''
  modal.value.success = ''
}

const handleAction = (type, item, context = null) => {
  modal.value = {
    isOpen: true,
    type,
    classItem: item,
    context,
    loading: false,
    error: '',
    success: '',
  }
}

const handleModalSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  try {
    if (modal.value.type === 'add') {
      await classService.createClass(payload)
    } else if (modal.value.type === 'edit') {
      if (modal.value.context?.termId && modal.value.context?.offeringId) {
        // Mode: Update specific offering within a term
        await termService.updateTermOffering(
          modal.value.context.termId,
          modal.value.context.offeringId,
          payload,
        )
      } else {
        // Mode: Update global class product
        await classService.updateClass(modal.value.classItem.id, payload)
      }
    } else if (modal.value.type === 'delete') {
      await classService.deleteClass(modal.value.classItem.id)
    }

    modal.value.success = 'Operation successful'
    await fetchClasses()
    setTimeout(closeModal, 1000)
  } catch (error) {
    modal.value.error = error.message || 'Class action failed'
  } finally {
    modal.value.loading = false
  }
}

const navigateToDetail = (item) => {
  const classId = item.classProduct?.id || item.classId
  if (classId) router.push(`/classes/${classId}`)
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Class Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard
            v-for="stat in statsCards"
            :key="stat.label"
            v-bind="stat"
            :loading="loading"
          />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Class List"
          :headers="classHeaders"
          :items="paginatedResults"
          :loading="loading"
          entityName="class"
          :flexible="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search class..."
          :hasPagination="true"
          :currentPage="currentPage"
          :pageSize="pageSize"
          :totalItems="totalItems"
          @update:currentPage="currentPage = $event"
          @row-click="navigateToDetail"
        >
          <template #toolbar-actions>
            <div class="flex items-center gap-3">
              <!-- Filters have been removed -->

              <AppButton variant="primary" size="md" @click="openAddModal">
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-tight">Add Class</span>
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
              {{ index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="flex items-center gap-4">
                <div
                  class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/80 shadow-sm bg-surface-subtle p-1.5"
                >
                  <img
                    :src="
                      getProgramProfileURL(
                        item.program?.profileURL,
                        item.program?.category?.name || item.program?.category,
                        item.program?.category?.profileURL,
                      )
                    "
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="flex flex-col">
                  <span class="leading-tight">{{ item.program?.name }}</span>
                  <span class="mt-0.5 text-xs font-semibold text-content-muted">
                    {{ item.program?.category?.name }}
                  </span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <div class="flex flex-col items-center justify-center py-6">
                <div
                  v-if="item.branches && item.branches.length > 0"
                  class="flex flex-wrap gap-lg justify-center items-center"
                >
                  <AppBadge
                    v-for="b in item.branches"
                    :key="b.id || b.abbr"
                    :status="b.abbr"
                    :type="b.color || 'neutral'"
                  />
                </div>
                <div v-else class="flex flex-col items-center justify-center h-8">
                  <span class="text-content-muted text-xs font-bold italic">Empty</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div
                  v-for="sched in item.schedules"
                  :key="sched.id || `${sched.day}-${sched.time}`"
                  class="flex flex-col items-center justify-center h-10 gap-1"
                >
                  <AppBadge :status="sched.day" type="day" size="sm" />
                  <span
                    class="text-xs font-semibold text-content-dark leading-none tabular-nums"
                    >{{ sched.time }}</span
                  >
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div
                  v-for="sched in item.schedules"
                  :key="sched.id || `${sched.day}-${sched.time}`"
                  class="flex items-center justify-center h-10"
                >
                  <AppBadge :status="sched.computedStatus" />
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
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
                      <button
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="
                          () => {
                            handleAction('edit', item.classProduct)
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span>Edit Class</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="
                          () => {
                            handleAction('delete', item.classProduct)
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
  </DashboardLayout>

  <ClassActionModal
    :isOpen="modal.isOpen"
    :type="modal.type"
    :classInstance="modal.classItem"
    :loading="modal.loading"
    :error="modal.error"
    :success="modal.success"
    @close="closeModal"
    @submit="handleModalSubmit"
    @clear-error="modal.error = ''"
    @clear-success="modal.success = ''"
  />
</template>
