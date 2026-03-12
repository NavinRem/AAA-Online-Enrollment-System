<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
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

import { getImageUrl, getIconUrl } from '@/utils/assetHelper'

const programs = ref([])
const enrollments = ref([])
const sessions = ref([])
const loading = ref(true)
const activeMenuId = ref(null)
const isMenuAbove = ref(false)
const menuStyles = ref({})
const currentFilter = ref('all')
const now = ref(new Date())

const actionModal = ref({
  isOpen: false,
  type: 'add',
  program: null,
  loading: false,
  error: '',
  success: '',
})

// Helper to check if a session is currently in progress
const isInProgress = (schedule) => {
  if (!schedule || !schedule.day || !schedule.timeslot) return false

  const currentTimeObj = now.value
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const currentDay = days[currentTimeObj.getDay()]

  if (schedule.day !== currentDay) return false

  // Parse timeslot "HH:mm-HH:mm" or "HH:mm - HH:mm"
  const times = schedule.timeslot.split('-').map((t) => t.trim())
  if (times.length !== 2) return false

  const [startH, startM] = times[0].split(':').map(Number)
  const [endH, endM] = times[1].split(':').map(Number)

  const startTime = startH * 60 + startM
  const endTime = endH * 60 + endM
  const currentTimeMinutes = currentTimeObj.getHours() * 60 + currentTimeObj.getMinutes()

  return currentTimeMinutes >= startTime && currentTimeMinutes <= endTime
}

// Stats
const stats = computed(() => {
  // 1. Total Programs
  const total = programs.value.length

  // 2. Active Programs (Programs that have at least one non-cancelled enrollment)
  const activeRegs = enrollments.value.filter(
    (r) =>
      (r.status || '').toLowerCase() !== 'cancelled' && (r.status || '').toLowerCase() !== 'canceled',
  )
  const activeProgramIds = new Set(activeRegs.map((r) => r.courseId))
  const activeCount = programs.value.filter((p) => activeProgramIds.has(p.id)).length

  const upcomingCount = programs.value.filter(
    (p) => (p.status || '').toLowerCase() === 'upcoming',
  ).length

  const inProgressProgramIds = new Set()
  sessions.value.forEach((s) => {
    if (isInProgress(s.schedule)) {
      inProgressProgramIds.add(s.courseId)
    }
  })
  const inProgressCount = inProgressProgramIds.size

  return [
    { label: 'Total Programs', value: total, image: getImageUrl('program'), color: '#e1f5fe' },
    { label: 'Active Programs', value: activeCount, image: getIconUrl('active'), color: '#e1f5fe' },
    { label: 'Upcoming Programs', value: upcomingCount, image: getIconUrl('register'), color: '#e1f5fe' },
    {
      label: 'In Progressing',
      value: inProgressCount,
      image: getIconUrl('total-payment'),
      color: '#e1f5fe',
    },
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
      enrollmentService.getAll().catch((e) => {
        console.error('Error fetching enrollments:', e)
        return []
      }),
      courseService.getAllSessions().catch((e) => {
        return []
      }),
    ])
    programs.value = Array.isArray(coursesData) ? coursesData : []
    enrollments.value = Array.isArray(regsData) ? regsData : []
    sessions.value = Array.isArray(sessionsData) ? sessionsData : []
  } catch (error) {
    // Error handled via UI or logged silently
  } finally {
    loading.value = false
  }
}

const toggleMenu = (event, id) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
    return
  }

  const rect = event.currentTarget.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  isMenuAbove.value = spaceBelow < 280

  if (isMenuAbove.value) {
    menuStyles.value = {
      bottom: `${window.innerHeight - rect.top + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  } else {
    menuStyles.value = {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  }

  activeMenuId.value = id
}

const closeMenu = () => {
  activeMenuId.value = null
}

const handleGlobalClick = (event) => {
  if (activeMenuId.value) {
    const isTrigger = event.target.closest('.btn-dots')
    const isMenu = event.target.closest('.action-dropdown')
    if (!isTrigger && !isMenu) {
      closeMenu()
    }
  }
}

const intervalId = ref(null)

onMounted(() => {
  fetchPrograms()
  window.addEventListener('click', handleGlobalClick)

  // Update every minute to keep "In Progress" fresh
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})

const programHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile' },
  { label: 'Program', class: 'hide-on-tablet' },
  { label: 'Title' },
  { label: 'Sessions', class: 'hide-on-mobile' },
  { label: 'Price', class: 'hide-on-mobile' },
  { label: 'Term', class: 'hide-on-tablet' },
  { label: 'Schedule', class: 'hide-on-tablet' },
  { label: 'Level', class: 'hide-on-tablet' },
  { label: 'Status' },
  { label: 'Action', width: '60px' },
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

  // Default Sort by Title
  return result.sort((a, b) => {
    const titleA = (a.title || a.name || '').toLowerCase()
    const titleB = (b.title || b.name || '').toLowerCase()
    return titleA.localeCompare(titleB)
  })
})

const handleAction = (type, program) => {
  openModal(type, program)
  closeMenu()
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
}

const handleActionSubmit = async (formData) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'add') {
      await courseService.createCourse(formData)
      actionModal.value.success = 'Program created successfully!'
    } else if (actionModal.value.type === 'edit') {
      await courseService.updateCourse(actionModal.value.program.id, formData)
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
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Program Overview" listTitle="Course / Program Catalog">
      <template #overview>
        <DataMetrics :stats="stats" />
      </template>

      <template #table>
        <DataTable
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
          @action="({ type, item }) => handleAction(type, item)"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" @click="openModal('add')">+ Add Program</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile">{{ index + 1 }}</td>
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
            <td class="hide-on-mobile"><StatusBadge :status="'$' + (item.price || 0)" /></td>
            <td class="hide-on-tablet"><StatusBadge :status="item.termName || 'Term 1 2026'" /></td>
            <td class="hide-on-tablet">
              <div class="schedule-info" v-if="item.schedule">
                <span class="day">{{ item.schedule.day.substring(0, 3) }}</span>
                <span class="time">{{ item.schedule.time }}</span>
                <span class="duration">({{ item.schedule.duration }}m)</span>
              </div>
              <span v-else class="help-text-small">Not scheduled</span>
            </td>
            <td class="hide-on-tablet"><StatusBadge :status="item.levelName || item.level || 'Beginner'" /></td>
            <td><StatusBadge :status="item.status || 'Active'" /></td>
            <td class="action-cell">
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
