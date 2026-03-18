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
import { courseService } from '../services/courseService'
import { enrollmentService } from '../services/enrollmentService'
import { useSearch, programSearchMapper } from '../composables/useSearch'
import { getCourseIcon } from '../utils/courseHelper'
import { calculateProgramStats, getProgramDisplayStatus } from '../utils/programHelper'

import { getImageUrl } from '@/utils/assetHelper'

const programs = ref([])
const enrollments = ref([])
const sessions = ref([])
const loading = ref(true)
const currentFilter = ref('all')
const categoryFilter = ref('all') // New
const categories = ref([]) // New
const now = ref(new Date())
const newlyCreatedId = ref(null)

const router = useRouter()

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'new-row-highlight' : ''
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
  const s = calculateProgramStats(programs.value, enrollments.value, sessions.value, now.value)
  return [
    { label: 'Total Programs', value: s.total, image: getImageUrl('programs/total-program'), color: '#e1f5fe' },
    { label: 'Active Programs', value: s.activeCount, image: getImageUrl('programs/active-program'), color: '#e1f5fe' },
    { label: 'Upcoming Programs', value: s.upcomingCount, image: getImageUrl('programs/upcoming-program'), color: '#e1f5fe' },
    { label: 'In Progress', value: s.inProgressCount, image: getImageUrl('programs/in-progress-program'), color: '#e1f5fe' },
    { label: 'Archived', value: s.archivedCount, image: getImageUrl('programs/closed-program'), color: '#e1f5fe' }
  ]
})

const fetchPrograms = async () => {
  loading.value = true
  try {
    const [coursesData, catsData, regsData, sessionsData] = await Promise.all([
      courseService.getAllCourses().catch((e) => {
        console.error('Error fetching courses:', e)
        return []
      }),
      courseService.getAllCategories().catch((e) => {
        console.error('Error fetching categories:', e)
        return []
      }),
      enrollmentService.getAllEnrollments().catch((e) => {
        console.error('Error fetching enrollments:', e)
        return []
      }),
      courseService.getAllSessions().catch(() => {
        return []
      }),
    ])
    programs.value = Array.isArray(coursesData) ? coursesData : []
    categories.value = Array.isArray(catsData) ? catsData : []
    enrollments.value = Array.isArray(regsData) ? regsData : []
    sessions.value = Array.isArray(sessionsData) ? sessionsData : []
  } catch (error) {
    console.error('Failed to fetch programs, enrollments or sessions', error)
  } finally {
    loading.value = false
  }
}

const intervalId = ref(null)

onMounted(() => {
  fetchPrograms()

  // Update every minute to keep "In Progress" fresh
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

const programHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Category', class: 'hide-on-tablet' },
  { label: 'Title', width: '200px' },
  { label: 'Teachers', class: 'hide-on-tablet', width: '150px' },
  { label: 'Term', class: 'hide-on-tablet', width: '120px' },
  { label: 'Period (Start-End)', class: 'hide-on-mobile' },
  { label: 'Schedule', class: 'hide-on-tablet' },
  { label: 'Level', class: 'hide-on-tablet', align: 'center', width: '30px' },
  { label: 'Price', class: 'hide-on-mobile', align: 'center', width: '90px' },
  { label: 'Status', align: 'center', width: '100px' },
  { label: 'Action', width: '60px', align: 'center' },
]

const { searchQuery, searchResults } = useSearch(programs, programSearchMapper)

const filteredPrograms = computed(() => {
  const list = searchResults.value || []
  let result = [...list]

  // 1. Filtering by Category (Separate Filter)
  if (categoryFilter.value !== 'all') {
    result = result.filter(p => (p.category || 'General') === categoryFilter.value)
  }

  // 2. Filtering by Status (Main Filter)
  if (currentFilter.value.startsWith('status:')) {
    const filterStatus = currentFilter.value.replace('status:', '')
    result = result.filter((p) => {
      const displayStatus = getProgramDisplayStatus(p, sessions.value, now.value).toLowerCase()
      return displayStatus === filterStatus.toLowerCase()
    })
  }

  // 3. Sorting
  if (currentFilter.value === 'sort:category') {
    result.sort((a, b) => {
      const catA = (a.category || 'General').toLowerCase()
      const catB = (b.category || 'General').toLowerCase()
      if (catA !== catB) return catA.localeCompare(catB)
      return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
    })
  } else {
    // Default Sort: Created Date Descending
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
      const result = await courseService.createCourse(formData)
      newlyCreatedId.value = result.id
      
      // Auto-create initial session if schedule exists
      if (formData.schedule) {
        await courseService.createSession({
          course_id: result.id,
          schedule: {
            day: formData.schedule.day,
            timeslot: formData.schedule.timeslot
          },
          capacity: 20 // Default capacity
        })
      }
      
      actionModal.value.success = 'Program & Initial Session created successfully!'
    } else if (actionModal.value.type === 'edit') {
      await courseService.updateCourse(actionModal.value.program.id, formData)
      newlyCreatedId.value = actionModal.value.program.id
      actionModal.value.success = 'Program updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await courseService.deleteCourse(actionModal.value.program.id)
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
            <!-- New Category Filter Dropdown -->
            <div class="category-filter-wrapper">
              <select v-model="categoryFilter" class="category-select">
                <option value="all">All Categories</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <AppButton variant="primary" @click="openModal('add')">+ Add Program</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile text-center">
              {{ index + 1 }}
            </td>
            <td class="hide-on-tablet">
              <div class="user-info">
                <div class="program-icon-mini">
                  <img :src="getCourseIcon(item.category || item.title)" alt="course" />
                </div>
                {{ item.category || 'General' }}
              </div>
            </td>
            <td class="bold">{{ item.title }}</td>
            <td class="hide-on-tablet">
              <div v-if="item.teachers && item.teachers.length > 0" class="mini-teacher-list">
                <div v-for="t in item.teachers.slice(0, 2)" :key="t.id" class="mini-teacher-item">
                  <img :src="t.profileURL || getImageUrl('profiles/avatar-parent')" />
                  <span>{{ t.name }}</span>
                </div>
                <span v-if="item.teachers.length > 2" class="more-count">+{{ item.teachers.length - 2 }}</span>
              </div>
              <span v-else class="help-text-small">No teachers</span>
            </td>
            <td class="hide-on-tablet">
              <StatusBadge :status="item.termName || item.term || 'No Term'" />
            </td>
            <td class="hide-on-mobile">
              <div class="period-info" v-if="item.startDate">
                <span>{{ item.startDate }}</span>
                <span class="to-label">to</span>
                <span>{{ item.endDate }}</span>
              </div>
              <StatusBadge v-else :status="item.termName || 'No Dates'" />
            </td>
            <td class="hide-on-tablet">
              <div class="schedule-info" v-if="item.schedule">
                <span class="day">{{ item.schedule.day.substring(0, 3) }}</span>
                <span class="time">{{ item.schedule.timeslot }}</span>
              </div>
              <span v-else class="help-text-small">Not scheduled</span>
            </td>
            <td class="hide-on-tablet text-center"><StatusBadge :status="item.levelName || item.level || 'Beginner'" /></td>
            <td class="hide-on-mobile text-center"><StatusBadge :status="'$' + (item.price || 0)" /></td>
            <td class="text-center"><StatusBadge :status="getProgramDisplayStatus(item, sessions, now)" /></td>
            <td class="action-cell text-center">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }" :style="menuStyles" @click.stop>
                      <button @click="handleAction('edit', item)">✏️ Edit</button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">🗑️ Delete</button>
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

<style scoped>
.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.825rem;
}

.schedule-info .day {
  font-weight: 700;
  color: #1e293b;
}

.schedule-info .time {
  color: #64748b;
}

.schedule-info .duration {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.75rem;
}

.help-text-small {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
}
.user-info {
  cursor: pointer;
  gap: 10px;
}

.category-filter-wrapper {
  margin-right: 10px;
}

.category-select {
  padding: 8px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  color: #444;
  outline: none;
  cursor: pointer;
}

.category-select:focus {
  border-color: #00aeef;
}

.mini-teacher-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mini-teacher-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.mini-teacher-item img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.more-count {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-left: 26px;
}

.period-info {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: #475569;
}

.to-label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
