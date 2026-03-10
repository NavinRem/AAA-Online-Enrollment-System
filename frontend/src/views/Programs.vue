<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import TableToolbar from '../components/common/TableToolbar/TableToolbar.vue'
import SummaryCard from '../components/SummaryCard.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'
import ProgramActionModal from '../components/programs/ProgramActionModal.vue'
import { courseService } from '../services/courseService'
import { registrationService } from '../services/registrationService'
import { useSearch, programSearchMapper } from '../composables/useSearch'
import { getCourseIcon } from '../utils/courseHelper'

const programs = ref([])
const registrations = ref([])
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

  // 2. Active Programs (Programs that have at least one non-cancelled registration)
  const activeRegs = registrations.value.filter(
    (r) =>
      (r.status || '').toLowerCase() !== 'cancelled' && (r.status || '').toLowerCase() !== 'canceled',
  )
  const activeProgramIds = new Set(activeRegs.map((r) => r.course_id || r.courseId))
  const activeCount = programs.value.filter((p) => activeProgramIds.has(p.id)).length

  // 3. Upcoming Programs (Status based)
  const upcomingCount = programs.value.filter(
    (p) => (p.status || '').toLowerCase() === 'upcoming',
  ).length

  // 4. In Progressing Programs (Sessions taking place now)
  const inProgressProgramIds = new Set()
  sessions.value.forEach((s) => {
    if (isInProgress(s.schedule)) {
      inProgressProgramIds.add(s.course_id || s.courseId)
    }
  })
  const inProgressCount = inProgressProgramIds.size

  return [
    { label: 'Total Programs', value: total, image: 'program.png', color: '#e1f5fe' },
    { label: 'Active Programs', value: activeCount, image: 'on-time.png', color: '#e1f5fe' },
    { label: 'Upcoming Programs', value: upcomingCount, image: 'register.png', color: '#e1f5fe' },
    {
      label: 'In Progressing',
      value: inProgressCount,
      image: 'total_payment.png',
      color: '#e1f5fe',
    },
  ]
})

const fetchPrograms = async () => {
  loading.value = true
  try {
    const [coursesData, regsData, sessionsData] = await Promise.all([
      courseService.getAllCourses(),
      registrationService.getAll(),
      courseService.getAllSessions(),
    ])
    programs.value = Array.isArray(coursesData) ? coursesData : []
    registrations.value = Array.isArray(regsData) ? regsData : []
    sessions.value = Array.isArray(sessionsData) ? sessionsData : []
  } catch (error) {
    console.error('Failed to fetch programs, registrations or sessions', error)
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

const { searchQuery, searchResults } = useSearch(programs, programSearchMapper)

const filteredPrograms = computed(() => {
  let list = searchResults.value
  const f = currentFilter.value

  // Filtering
  if (f.startsWith('level:')) {
    const level = f.replace('level:', '')
    list = list.filter((p) => (p.level || '').toLowerCase() === level)
  } else if (f.startsWith('status:')) {
    const status = f.replace('status:', '')
    list = list.filter((p) => (p.status || 'Active').toLowerCase() === status)
  }

  // Default Sort by Title
  return [...list].sort((a, b) => {
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
        <SummaryCard
          v-for="stat in stats"
          :key="stat.label"
          :title="stat.label"
          :value="stat.value"
          :image="stat.image"
          :color="stat.color"
        />
      </template>

      <template #actions>
        <TableToolbar
          :hasSearch="true"
          :searchQuery="searchQuery"
          @update:searchQuery="searchQuery = $event"
          searchPlaceholder="Search programs..."
          :hasFilter="true"
          :currentFilter="currentFilter"
          @update:currentFilter="currentFilter = $event"
          :filterOptions="[
            { label: 'All Programs', value: 'all' },
            { label: 'Status: Active', value: 'status:active' },
            { label: 'Status: Upcoming', value: 'status:upcoming' },
            { label: 'Status: Closed', value: 'status:closed' },
            { label: 'Level: Beginner', value: 'level:beginner' },
            { label: 'Level: Intermediate', value: 'level:intermediate' },
            { label: 'Level: Advanced', value: 'level:advanced' },
          ]"
        >
          <template #actions>
            <AppButton variant="primary" @click="openModal('add')">+ Add Program</AppButton>
          </template>
        </TableToolbar>
      </template>

      <template #table>
        <AppTable
          :headers="[
            'No',
            'Category',
            'Program Title',
            'Sessions',
            'Fee',
            'Term',
            'Schedule',
            'Level',
            'Status',
            'Action',
          ]"
          :loading="loading"
          :empty="filteredPrograms.length === 0"
        >
          <template #loading>Loading programs...</template>
          <template #empty>No programs found matching your criteria.</template>

          <tr
            v-for="(program, index) in filteredPrograms"
            :key="program.id"
            class="clickable-row"
          >
            <td>{{ index + 1 }}</td>
            <td>
              <div class="user-info">
                <div class="program-icon-mini">
                  <img :src="getCourseIcon(program.category || program.title)" alt="course" />
                </div>
                {{ program.category || 'General' }}
              </div>
            </td>
            <td class="bold">{{ program.title || program.name }}</td>
            <td>
              {{ program.number_session || 0 }} Sessions
            </td>
            <td>
              <StatusBadge :status="'$' + (program.price || 0)" />
            </td>
            <td>
              <StatusBadge :status="program.termName || 'Term 1 2026'" />
            </td>
            <td>
              <div class="schedule-info" v-if="program.schedule">
                <span class="day">{{ program.schedule.day.substring(0, 3) }}</span>
                <span class="time">{{ program.schedule.time }}</span>
                <span class="duration">({{ program.schedule.duration }}m)</span>
              </div>
              <span v-else class="help-text-small">Not scheduled</span>
            </td>
            <td>
              <StatusBadge :status="program.levelName || program.level || 'Beginner'" />
            </td>
            <td>
              <StatusBadge :status="program.status || 'Active'" />
            </td>
            <td class="action-cell">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, program.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div
                      v-if="activeMenuId === program.id"
                      class="action-dropdown"
                      :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button @click="handleAction('edit', program)">✏️ Edit</button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', program)">
                        🗑️ Delete
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </tr>
        </AppTable>
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
.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.program-icon-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.program-icon-mini img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

.action-cell {
  position: relative;
  width: 60px;
}

.menu-container {
  position: relative;
  display: flex;
  justify-content: center;
}

.btn-dots {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-dots:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: rotate(90deg);
}

.action-dropdown {
  position: fixed;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 14px;
  box-shadow:
    0 15px 35px -5px rgba(0, 0, 0, 0.15),
    0 5px 15px -5px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.9);
  z-index: 1000;
  padding: 8px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  animation: slideDropdown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

.action-dropdown.open-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 8px;
  transform-origin: bottom right;
  box-shadow:
    0 -15px 35px -5px rgba(0, 0, 0, 0.15),
    0 -5px 15px -5px rgba(0, 0, 0, 0.08);
}

@keyframes slideDropdown {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.action-dropdown button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-dropdown button:hover {
  background: #f8fafc;
  color: #00aeef;
  padding-left: 18px;
}

.action-dropdown .delete-btn {
  color: #ef4444;
}

.action-dropdown .delete-btn:hover {
  background: #fff1f2;
  color: #dc2626;
}

.menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 6px;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f8fafc;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.action-dropdown.open-up.fade-enter-from,
.action-dropdown.open-up.fade-leave-to {
  transform: scale(0.9) translateY(10px);
}
.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.8rem;
}

.schedule-info .day {
  font-weight: 700;
  color: #0f172a;
}

.schedule-info .time {
  color: #64748b;
}

.schedule-info .duration {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.7rem;
}

.help-text-small {
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
