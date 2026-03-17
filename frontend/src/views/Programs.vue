<script setup>
import { ref, onMounted, computed } from 'vue'
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
import { calculateProgramStats } from '../utils/programHelper'

import { getImageUrl, getIconUrl } from '@/utils/assetHelper'

const programs = ref([])
const enrollments = ref([])
const sessions = ref([])
const loading = ref(true)
const currentFilter = ref('all')
const now = ref(new Date())
const newlyCreatedId = ref(null)

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
    { label: 'In Progressing', value: s.inProgressCount, image: getImageUrl('programs/in-progress-program'), color: '#e1f5fe' }
  ]
})

const fetchPrograms = async () => {
  loading.value = true
  try {
    const [coursesData, regsData, sessionsData] = await Promise.all([
      courseService.getAllCourses().catch((e) => {
        console.error('Error fetching courses:', e)
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
  { label: 'No', width: '80px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Program', class: 'hide-on-tablet' },
  { label: 'Title' },
  { label: 'Sessions', class: 'hide-on-mobile' },
  { label: 'Price', class: 'hide-on-mobile', align: 'center', width: '100px' },
  { label: 'Term', class: 'hide-on-tablet' },
  { label: 'Schedule', class: 'hide-on-tablet' },
  { label: 'Level', class: 'hide-on-tablet', align: 'center', width: '120px' },
  { label: 'Status', align: 'center', width: '120px' },
  { label: 'Action', width: '80px', align: 'center' },
]

const { searchQuery, searchResults } = useSearch(programs, programSearchMapper)

const filteredPrograms = computed(() => {
  const list = searchResults.value || []
  const f = currentFilter.value

  let result = [...list]
  // Filtering
  if (f.startsWith('level:')) {
    const level = f.replace('level:', '')
    result = result.filter((p) => (p.level || '').toLowerCase() === level)
  } else if (f.startsWith('status:')) {
    const status = f.replace('status:', '')
    result = result.filter((p) => (p.status || 'Active').toLowerCase() === status)
  }

  // Sort by Created Date Descending (Newest first)
  return result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
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
            { label: 'Status: Active', value: 'status:active' },
            { label: 'Status: Upcoming', value: 'status:upcoming' },
            { label: 'Status: Closed', value: 'status:closed' },
            { label: 'Level: Beginner', value: 'level:beginner' },
            { label: 'Level: Intermediate', value: 'level:intermediate' },
            { label: 'Level: Advanced', value: 'level:advanced' },
          ]"
          :rowClass="getRowClass"
          @row-click="onRowClick"
          @action="({ type, item }) => handleAction(type, item)"
        >
          <template #toolbar-actions>
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
            <td class="hide-on-mobile">{{ item.numberSessions || 0 }} Sessions</td>
            <td class="hide-on-mobile text-center"><StatusBadge :status="'$' + (item.price || 0)" /></td>
            <td class="hide-on-tablet"><StatusBadge :status="item.termName || 'Term 1 2026'" /></td>
            <td class="hide-on-tablet">
              <div class="schedule-info" v-if="item.schedule">
                <span class="day">{{ item.schedule.day.substring(0, 3) }}</span>
                <span class="time">{{ item.schedule.timeslot }}</span>
              </div>
              <span v-else class="help-text-small">Not scheduled</span>
            </td>
            <td class="hide-on-tablet text-center"><StatusBadge :status="item.levelName || item.level || 'Beginner'" /></td>
            <td class="text-center"><StatusBadge :status="item.status || 'Active'" /></td>
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
</style>
