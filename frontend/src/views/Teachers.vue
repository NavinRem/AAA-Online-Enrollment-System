<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import TeacherActionModal from '@/components/teachers/TeacherActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

import { teacherService } from '@/services/teacherService'
import { useDataStore } from '@/stores/dataStore'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { useSearch, teacherSearchMapper } from '@/composables/useSearch'
import { calculateClassProgress, formatDate } from '@/utils/formatUtils'

defineOptions({ name: 'TeacherList' })

const dataStore = useDataStore()

const teachers = computed(() => dataStore.teachers)
const allPrograms = computed(() => dataStore.programs)
const allClasses = computed(() => dataStore.classes)
const allTerms = computed(() => dataStore.terms)

const loading = ref(true)
const currentFilter = ref('all')

const fetchData = async (force = false) => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(force, ['teachers', 'programs', 'classes', 'terms'])
  } catch (error) {
    console.error('Failed to fetch data', error)
  } finally {
    loading.value = false
  }
}

const getPrograms = (programIds) => {
  if (!programIds || !Array.isArray(programIds)) return []
  return programIds.map((id) => allPrograms.value.find((p) => p.id === id)).filter(Boolean)
}

const getTeacherAssignments = (teacherId) => {
  const assignments = []
  allTerms.value.forEach((term) => {
    ;(term.offerings || []).forEach((offering) => {
      const isDefaultAssigned = (offering.teachers || []).some((t) => t.id === teacherId)
      const isInSessions = (offering.sessionTeachers || []).some((st) => {
        if (!st) return false
        if (st.teachers && Array.isArray(st.teachers))
          return st.teachers.some((t) => t && t.id === teacherId)
        if (Array.isArray(st)) return st.some((t) => t && t.id === teacherId)
        return st && st.id === teacherId
      })
      if (isDefaultAssigned || isInSessions) {
        assignments.push({
          termName: term.name,
          ...offering,
        })
      }
    })
  })
  return assignments
}

onMounted(() => fetchData(false))

const statusFilteredTeachers = computed(() => {
  if (currentFilter.value === 'all') return teachers.value

  if (currentFilter.value === 'working') {
    return teachers.value.filter((t) => workingTeacherIds.value.has(t.id))
  }

  if (currentFilter.value === 'new') {
    const now = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)
    return teachers.value.filter((t) => {
      const created = new Date(t.createdAt || t.date || 0)
      return created >= oneMonthAgo
    })
  }

  return teachers.value.filter((t) => (t.status || 'active').toLowerCase() === currentFilter.value)
})

const { searchQuery, searchResults } = useSearch(statusFilteredTeachers, teacherSearchMapper)

const filteredTeachers = computed(() => {
  return [...searchResults.value].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )
})

const workingTeacherIds = computed(() => {
  const ids = new Set()
  allClasses.value.forEach((cls) => {
    const start = cls.startDate || cls.term?.startDate
    const end = cls.endDate || cls.term?.endDate
    const day = cls.schedule?.day || cls.schedules?.[0]?.day
    const time = cls.schedule?.time || cls.schedules?.[0]?.time

    if (start && end) {
      const { status } = calculateClassProgress(start, end, day, time)
      if (status === 'active' || status === 'ongoing') {
        if (cls.teacherId) ids.add(cls.teacherId)
        if (cls.teachers && Array.isArray(cls.teachers)) {
          cls.teachers.forEach((t) => ids.add(t.id || t))
        }
      }
    }
  })
  return ids
})

const statsCards = computed(() => {
  const allTeacher = teachers.value
  const active = allTeacher.filter((t) => (t.status || 'active').toLowerCase() === 'active')

  // New Teachers: Registered within the last 1 month
  const now = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(now.getMonth() - 1)
  const newTeachersCount = allTeacher.filter((t) => {
    const created = new Date(t.createdAt || t.date || 0)
    return created >= oneMonthAgo
  }).length

  const totalTeachersCount = allTeacher.length
  const activeTeachersCount = active.length
  const workingTeachersCount = workingTeacherIds.value.size

  return [
    {
      label: 'Total Teachers',
      value: totalTeachersCount,
      image: getImageUrl('teacher/total-teacher'),
    },
    {
      label: 'Active Teachers',
      value: activeTeachersCount,
      image: getImageUrl('dashboard/card-student'),
    },
    {
      label: 'Working Teachers',
      value: workingTeachersCount,
      image: getImageUrl('dashboard/card-available-program'),
    },
    {
      label: 'New Teachers',
      value: newTeachersCount,
      image: getImageUrl('dashboard/card-top-program'),
    },
  ]
})

const headers = [
  { label: 'No', width: '50px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Teacher Name' },
  { label: 'Phone', class: 'hidden sm:table-cell' },
  { label: 'Assigned Classes', width: '400px', class: 'hidden lg:table-cell' },
  { label: 'Program', class: 'hidden lg:table-cell' },
  { label: 'Joined Date', class: 'hidden lg:table-cell', align: 'center' },
  { label: 'Status', width: '150px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

// Modal Logic
const isModalOpen = ref(false)
const modalType = ref('add')
const selectedTeacher = ref(null)
const actionLoading = ref(null) // offeringId
const confirmingOffering = ref(null) // offering object
const submitting = ref(false)

const error = ref('')
const success = ref('')

const openModal = (type, teacher = null) => {
  modalType.value = type
  selectedTeacher.value = teacher
  error.value = ''
  success.value = ''
  isModalOpen.value = true
}

const confirmAssign = async () => {
  if (!confirmingOffering.value) return
  const offering = confirmingOffering.value
  actionLoading.value = offering.offeringId
  try {
    await teacherService.assignToClass(
      selectedTeacher.value.id,
      offering.termId,
      offering.offeringId,
    )
    confirmingOffering.value = null
    await fetchData(true)
  } catch (err) {
    error.value = err.message || 'Failed to assign class'
  } finally {
    actionLoading.value = null
  }
}

const handleSubmit = async (formData) => {
  submitting.value = true
  error.value = ''
  success.value = ''
  try {
    if (modalType.value === 'add') {
      await teacherService.createTeacher(formData)
      success.value = 'Teacher added successfully'
    } else if (modalType.value === 'edit') {
      await teacherService.updateTeacher(selectedTeacher.value.id, formData)
      success.value = 'Teacher profile updated successfully'
    } else if (modalType.value === 'delete') {
      await teacherService.deleteTeacher(selectedTeacher.value.id)
      success.value = 'Teacher record deleted'
    } else if (modalType.value === 'reactivate') {
      await teacherService.updateTeacher(selectedTeacher.value.id, { status: 'active' })
      success.value = 'Teacher account reactivated'
    } else if (modalType.value === 'deactivate') {
      await teacherService.updateTeacher(selectedTeacher.value.id, { status: 'inactive' })
      success.value = 'Teacher account deactivated'
    }
    fetchData(true)
    // Auto close after 1.5s on success
    setTimeout(() => {
      if (isModalOpen.value) {
        isModalOpen.value = false
      }
    }, 1500)
  } catch (err) {
    error.value = err.message || 'Failed to save teacher'
    console.error('Failed to save teacher', err)
  } finally {
    submitting.value = false
  }
}

const handleAction = (type, item, closeMenu) => {
  openModal(type, item)
  if (closeMenu) closeMenu()
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Teacher Overview">
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

      <!-- Assignment Confirmation Overlay -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="confirmingOffering"
            class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-content-dark/40 backdrop-blur-sm"
          >
            <div
              class="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl animate-scale-in border border-outline-std"
            >
              <div class="flex flex-col items-center text-center gap-6">
                <div
                  class="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center text-3xl shadow-inner"
                >
                  🤝
                </div>
                <div class="flex flex-col gap-2">
                  <h4 class="text-xl font-black text-content-dark tracking-tight">
                    Confirm Assignment
                  </h4>
                  <p class="text-xs font-bold text-content-muted px-4 leading-relaxed">
                    Are you sure you want to assign
                    <span class="text-primary font-black">{{ selectedTeacher?.name }}</span>
                    to teach
                    <span class="text-content-dark font-black">{{
                      confirmingOffering.program?.name
                    }}</span
                    >?
                  </p>
                </div>

                <!-- Schedule Summary Card -->
                <div
                  class="w-full bg-surface-subtle/50 rounded-2xl p-5 border border-outline-std flex flex-col gap-3"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-4xs font-black text-content-muted uppercase tracking-widest"
                      >Schedule</span
                    >
                    <AppBadge
                      :status="confirmingOffering.branch?.abbr || 'HQ'"
                      size="xs"
                      :type="confirmingOffering.branch?.color || 'blue'"
                    />
                  </div>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-outline-std shadow-sm"
                    >
                      <span class="text-lg">📅</span>
                    </div>
                    <div class="flex flex-col text-left">
                      <span class="text-sm font-black text-content-dark">{{
                        confirmingOffering.schedule?.day
                      }}</span>
                      <span class="text-4xs font-bold text-primary">{{
                        confirmingOffering.schedule?.time
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 w-full mt-2">
                  <AppButton variant="cancel" @click="confirmingOffering = null">
                    Go Back
                  </AppButton>
                  <AppButton variant="primary" @click="confirmAssign" :loading="!!actionLoading">
                    Confirm
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>

      <template #table>
        <DataTable
          title="Teacher Lists"
          :headers="headers"
          :items="filteredTeachers"
          :loading="loading"
          searchPlaceholder="Search by name, email or specialization..."
          :hasFilter="true"
          v-model:searchQuery="searchQuery"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Faculty', value: 'all' },
            { label: 'Active', value: 'active', color: 'green' },
            { label: 'Inactive', value: 'inactive', color: 'red' },
            { label: 'Working', value: 'working', color: 'magenta' },
            { label: 'New', value: 'new', color: 'purple' },
          ]"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span>New Teacher</span>
            </AppButton>
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
            <td
              class="ui-cell text-center hidden md:table-cell"
              :style="{ width: headers[0].width }"
            >
              <span class="font-bold text-content-dark">{{ index + 1 }}</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="ui-identity-cell">
                <div
                  class="ui-avatar ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-500 shadow-sm"
                >
                  <img
                    :src="item.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                    alt="avatar"
                  />
                </div>
                <div class="ui-identity-info">
                  <span
                    class="font-bold text-content-dark group-hover:text-primary transition-colors tracking-tight leading-tight truncate"
                  >
                    {{ item.name }}
                  </span>
                </div>
              </div>
            </td>

            <td class="ui-cell hidden sm:table-cell" :style="{ width: headers[2].width }">
              <span class="font-bold text-content-dark tabular-nums tracking-tighter">{{
                item.phone || '—'
              }}</span>
            </td>

            <td class="ui-cell hidden lg:table-cell">
              <div class="flex flex-wrap gap-1.5">
                <template v-if="getTeacherAssignments(item.id).length > 0">
                  <div
                    v-for="(assign, idx) in getTeacherAssignments(item.id)"
                    :key="assign.offeringId || assign.id || idx"
                    class="group/assign relative flex items-center justify-between gap-10 px-2 py-1.5 rounded-sm bg-primary-soft border border-primary/10 group-hover:bg-white group-hover:border-primary transition-all cursor-default"
                  >
                    <div class="flex flex-col gap-1 items-start">
                      <AppBadge :status="assign.schedule?.day || 'TBA'" type="day" size="xs" />
                      <span class="text-xs font-semibold text-content-dark leading-none tabular-nums">
                        {{ assign.schedule?.time || 'N/A' }}
                      </span>
                    </div>
                    <AppBadge
                      :status="assign.branch?.abbr || 'HQ'"
                      size="xs"
                      :type="assign.branch?.color || 'blue'"
                    />
                  </div>
                </template>
                <span v-else class="text-sm font-bold text-content-muted/40 italic"
                  >No Active Classes</span
                >
              </div>
            </td>

            <td class="ui-cell hidden lg:table-cell" :style="{ width: headers[4].width }">
              <div class="flex flex-wrap gap-2">
                <template
                  v-if="
                    getPrograms(item.programIds).length > 0 ||
                    getTeacherAssignments(item.id)
                      .map((a) => a.program)
                      .filter(Boolean).length > 0
                  "
                >
                  <div
                    v-for="prog in Array.from(
                      new Map(
                        [
                          ...getPrograms(item.programIds),
                          ...getTeacherAssignments(item.id)
                            .map((a) => a.program)
                            .filter(Boolean),
                        ].map((p) => [p.id, p]),
                      ).values(),
                    )"
                    :key="prog.id"
                    class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-primary-soft border border-primary/10 group-hover:bg-white group-hover:border-primary transition-all duration-300"
                  >
                    <div
                      class="w-8 h-8 rounded-lg overflow-hidden border bg-white shadow-sm border-primary/20 shrink-0"
                    >
                      <img
                        :src="prog.profileURL || getImageUrl('dashboard/card-top-program')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <span class="font-bold truncate pr-5">{{ prog.name }}</span>
                  </div>
                </template>
                <span v-else class="font-bold text-content-muted italic opacity-40"
                  >No Program Assigned</span
                >
              </div>
            </td>

            <!-- Joined Date -->
            <td class="ui-cell hidden lg:table-cell text-center">
              <span class="ui-cell-muted">
                {{ formatDate(item.createdAt) }}
              </span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <AppBadge :status="item.status || 'active'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
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
                        @click="handleAction('edit', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold">Edit</span>
                      </button>

                      <button
                        v-if="(item.status || 'active').toLowerCase() === 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-success group"
                        @click="handleAction('reactivate', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('reactivate')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold">Reactivate</span>
                      </button>
                      <button
                        v-else
                        class="ui-dropdown-item ui-dropdown-item-danger group"
                        @click="handleAction('deactivate', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('cancel')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold">Deactivate</span>
                      </button>

                      <div class="h-px bg-surface-light mx-1 my-1"></div>

                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold"
                        @click="handleAction('delete', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
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

    <TeacherActionModal
      :isOpen="isModalOpen"
      :type="modalType"
      :teacher="selectedTeacher"
      :loading="submitting"
      :error="error"
      :success="success"
      @close="isModalOpen = false"
      @submit="handleSubmit"
      @refresh="fetchData"
    />
  </DashboardLayout>
</template>
