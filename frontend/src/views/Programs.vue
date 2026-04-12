<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import ProgramActionModal from '../components/programs/ProgramActionModal.vue'
import { programService } from '../services/programService'
import { useSearch, programSearchMapper } from '../composables/useSearch'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus } from '@/utils/programHelper'

const programs = ref([])
const sessions = ref([])
const loading = ref(true)
const currentFilter = ref('all')
const categoryFilter = ref('all')
const categories = ref([])
const isCategoryFilterOpen = ref(false)
const categorySearchQuery = ref('')
const categoryMenuStyles = ref({})
const now = ref(new Date())
const newlyCreatedId = ref(null)

const router = useRouter()

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const actionModal = ref({
  isOpen: false,
  type: 'add',
  program: null,
  loading: false,
  error: '',
  success: '',
})

const statsCards = computed(() => {
  return [
    {
      label: 'Total Products',
      value: programs.value.length,
      image: getImageUrl('programs/total-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Group Programs',
      value: programs.value.filter((p) => p.type === 'group').length,
      image: getImageUrl('programs/active-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Private Programs',
      value: programs.value.filter((p) => p.type === 'private').length,
      image: getImageUrl('programs/upcoming-program'),
      color: 'var(--accent-light)',
    },
  ]
})

const fetchPrograms = async () => {
  loading.value = true
  try {
    const [programsData, catsData] = await Promise.all([
      programService.getAllPrograms().catch((e) => {
        console.error('Error fetching programs:', e)
        return []
      }),
      programService.getAllCategories().catch((e) => {
        console.error('Error fetching categories:', e)
        return []
      }),
    ])
    programs.value = Array.isArray(programsData) ? programsData : []
    categories.value = Array.isArray(catsData) ? catsData : []
  } catch (error) {
    console.error('Failed to fetch programs or categories', error)
  } finally {
    loading.value = false
  }
}

const intervalId = ref(null)

const filteredCategories = computed(() => {
  if (!categorySearchQuery.value) return categories.value
  const q = categorySearchQuery.value.toLowerCase()
  return categories.value.filter((c) => c.name.toLowerCase().includes(q))
})

onMounted(() => {
  fetchPrograms()
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

const programHeaders = [
  { label: 'No', width: '50px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'Category', width: '150px' },
  { label: 'Program Model', width: '250px' },
  { label: 'Sessions', align: 'center', width: '80px', class: 'hidden sm:table-cell' },
  { label: 'Weeks', align: 'center', width: '80px', class: 'hidden sm:table-cell' },
  { label: 'Base Price', align: 'center', width: '100px' },
  { label: 'Cap', align: 'center', width: '50px', class: 'hidden lg:table-cell' },
  { label: 'Type', align: 'center', width: '100px' },
  { label: 'Action', width: '60px', align: 'center' },
]

const { searchQuery, searchResults } = useSearch(programs, programSearchMapper)

const filteredPrograms = computed(() => {
  const list = searchResults.value || []
  let result = [...list]

  if (categoryFilter.value !== 'all') {
    result = result.filter((p) => (p.category || 'General') === categoryFilter.value)
  }

  if (currentFilter.value.startsWith('status:')) {
    const filterStatus = currentFilter.value.replace('status:', '')
    result = result.filter((p) => {
      const displayStatus = getProgramDisplayStatus(p, sessions.value, now.value).toLowerCase()
      return displayStatus === filterStatus.toLowerCase()
    })
  }

  if (currentFilter.value === 'sort:category') {
    result.sort((a, b) => {
      const catA = (a.category || 'General').toLowerCase()
      const catB = (b.category || 'General').toLowerCase()
      if (catA !== catB) return catA.localeCompare(catB)
      return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
    })
  } else {
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  return result
})

const handleAction = (type, program) => {
  openModal(type, program)
}

const openModal = (type, program = null) => {
  actionModal.value = {
    isOpen: true,
    type,
    program,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  actionModal.value.isOpen = false
  actionModal.value.error = ''
  actionModal.value.success = ''
}

const handleActionSubmit = async (formData) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'add') {
      const result = await programService.createProgram(formData)
      newlyCreatedId.value = result.id

      if (formData.schedule) {
        await programService.createSession({
          programId: result.id,
          branch: { id: 'FM', name: 'Funmall', abbr: 'FM' },
          schedule: {
            day: formData.schedule.day,
            timeslot: formData.schedule.timeslot,
          },
          capacity: 20,
        })
      }

      actionModal.value.success = 'Program & Initial Session created successfully!'
    } else if (actionModal.value.type === 'edit') {
      await programService.updateProgram(actionModal.value.program.id, formData)
      newlyCreatedId.value = actionModal.value.program.id
      actionModal.value.success = 'Program updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await programService.deleteProgram(actionModal.value.program.id)
      actionModal.value.success = 'Program deleted successfully!'
    }

    setTimeout(() => {
      closeModal()
      fetchPrograms()
    }, 1500)
  } catch (error) {
    actionModal.value.error = error.message || 'Action failed'
  } finally {
    actionModal.value.loading = false
  }
}

const selectCategory = (name) => {
  categoryFilter.value = name
  isCategoryFilterOpen.value = false
}

const toggleCategoryFilter = (event) => {
  isCategoryFilterOpen.value = !isCategoryFilterOpen.value
  if (isCategoryFilterOpen.value) {
    categorySearchQuery.value = ''
    const rect = event.currentTarget.getBoundingClientRect()
    categoryMenuStyles.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      minWidth: '200px',
    }
  }
}

const closeCategoryFilter = (event) => {
  setTimeout(() => {
    const menu = document.querySelector('.category-filter-menu')
    if (menu && menu.contains(event.relatedTarget)) return
    isCategoryFilterOpen.value = false
  }, 200)
}

const onRowClick = (item) => {
  if (item.id === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  router.push(`/programs/${item.id}`)
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Program Overview">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable
          title="Program List"
          :headers="programHeaders"
          :items="filteredPrograms"
          :loading="loading"
          entityName="program"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search programs..."
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Programs', value: 'all' },
            { label: 'Sort: Category', value: 'sort:category' },
            { label: 'Status: Active', value: 'status:active' },
            { label: 'Status: Upcoming', value: 'status:upcoming' },
            { label: 'Status: In Progress', value: 'status:in progress' },
            { label: 'Status: Closed', value: 'status:closed' },
            { label: 'Status: Archived', value: 'status:archived' },
          ]"
          :rowClass="getRowClass"
          @row-click="onRowClick"
          @action="({ type, item }) => handleAction(type, item)"
        >
          <template #toolbar-actions>
            <div class="relative">
              <AppButton
                variant="secondary"
                :class="{ 'ring-2 ring-primary bg-primary-soft': categoryFilter !== 'all' }"
                @click="toggleCategoryFilter"
                @blur="closeCategoryFilter"
              >
                <span v-if="categoryFilter === 'all'">All Categories</span>
                <span v-else class="font-bold">{{ categoryFilter }}</span>
              </AppButton>
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
                    v-if="isCategoryFilterOpen"
                    class="ui-dropdown-menu category-filter-menu"
                    :style="categoryMenuStyles"
                    @mousedown.stop
                  >
                    <div class="px-md py-sm border-b border-surface-light">
                      <input
                        type="text"
                        v-model="categorySearchQuery"
                        placeholder="Search category..."
                        class="w-full text-xs p-2 bg-surface-light rounded-sm border-none focus:ring-1 focus:ring-primary outline-none"
                        @mousedown.stop
                      />
                    </div>
                    <div class="max-h-[220px] overflow-y-auto scrollable-v">
                      <div
                        class="ui-dropdown-item"
                        :class="{
                          'bg-primary-soft text-primary font-bold': categoryFilter === 'all',
                        }"
                        @click.stop="selectCategory('all')"
                      >
                        All Categories
                      </div>
                      <div
                        v-for="cat in filteredCategories"
                        :key="cat.id"
                        class="ui-dropdown-item"
                        :class="{
                          'bg-primary-soft text-primary font-bold': categoryFilter === cat.name,
                        }"
                        @click.stop="selectCategory(cat.name)"
                      >
                        {{ cat.name }}
                      </div>
                      <div
                        v-if="filteredCategories.length === 0"
                        class="px-md py-xl text-center text-content-muted italic text-xs"
                      >
                        No matches found
                      </div>
                    </div>
                  </div>
                </transition>
              </Teleport>
            </div>
            <AppButton variant="primary" @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert mt-px" /> Add
              Program
            </AppButton>
          </template>

          <template
            #row="{
              item,
              index,
              toggleMenu,
              activeMenuId,
              isMenuAbove,
              menuStyles,
              handleAction,
              headers,
            }"
          >
            <td
              class="ui-cell text-center font-bold text-content-muted/50 hidden md:table-cell"
              :style="{ width: headers[0].width }"
            >
              {{ index + 1 }}
            </td>
            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar-sm ring-1 ring-border">
                  <img
                    :src="getProgramProfileURL(item.profileURL || item.imageURL, item.category)"
                    alt="program"
                  />
                </div>
                <div class="ui-identity-info">
                  <span class="font-bold text-xs text-content-dark">{{
                    item.category || 'General'
                  }}</span>
                  <span class="text-3xs text-content-muted uppercase font-bold tracking-tight"
                    >Category</span
                  >
                </div>
              </div>
            </td>
            <td class="ui-cell" :style="{ width: headers[2].width }">
              <span class="font-black text-content-dark tracking-tighter">{{
                item.name || item.title
              }}</span>
            </td>
            <td
              class="ui-cell text-center hidden sm:table-cell"
              :style="{ width: headers[3].width }"
            >
              <span class="font-bold text-content-muted/70">{{ item.sessionNumber || '—' }}</span>
            </td>
            <td
              class="ui-cell text-center hidden sm:table-cell"
              :style="{ width: headers[4].width }"
            >
              <span class="font-bold text-content-muted/70">{{ item.weeksNumber || '—' }}</span>
            </td>
            <td
              class="ui-cell text-center font-bold text-primary"
              :style="{ width: headers[5].width }"
            >
              <StatusBadge :status="'$' + (item.basePrice || 0)" />
            </td>
            <td
              class="ui-cell text-center hidden lg:table-cell font-bold text-content-muted/50 uppercase text-2xs"
              :style="{ width: headers[6].width }"
            >
              {{ item.maxCapacity || '∞' }}
            </td>
            <td class="ui-cell text-center font-black" :style="{ width: headers[7].width }">
              <StatusBadge
                :status="item.type || 'group'"
                :type="item.type === 'private' ? 'purple' : 'blue'"
              />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <div class="ui-action-menu">
                <button class="ui-btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="font-bold">⋮</span>
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
                        class="ui-dropdown-item hover:text-info group"
                        @click="
                          () => {
                            handleAction('edit', item)
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        Edit
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button
                        class="ui-dropdown-item hover:bg-error/5 hover:text-error group text-error/70 font-bold"
                        @click="
                          () => {
                            handleAction('delete', item)
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 brightness-0 invert opacity-60 group-hover:opacity-100 transition-opacity"
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

    <ProgramActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :program="actionModal.program"
      :loading="actionModal.loading"
      :error="actionModal.error"
      :success="actionModal.success"
      @close="closeModal"
      @submit="handleActionSubmit"
    />
  </DashboardLayout>
</template>
