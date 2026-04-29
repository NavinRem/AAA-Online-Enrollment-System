<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { calculateClassProgress, formatDateOnly } from '@/utils/formatUtils'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'

const route = useRoute()
const router = useRouter()

const classData = ref(null)
const students = ref([])
const loading = ref(true)
const errorMessage = ref('')
const activeTab = ref('students')

const classStats = computed(() => {
  if (!classData.value) return []

  const progress = calculateClassProgress(
    classData.value.term?.startDate,
    classData.value.term?.endDate,
    classData.value.day,
    classData.value.timeslot
  )

  return [
    {
      label: 'Class Progress',
      value: `${progress.percentage}%`,
      subtitle: progress.weekInfo,
      image: getImageUrl('dashboard/card-active-program'),
      color: 'bg-primary-soft',
    },
    {
      label: 'Enrollment',
      value: `${classData.value.currentCount || 0} / ${classData.value.capacity || 20}`,
      subtitle: 'Student Capacity',
      image: getImageUrl('enrollment/total-enrollment'),
      color: 'bg-primary-soft',
    },
    {
      label: 'Attendance Rate',
      value: '94%', // Placeholder
      subtitle: 'Average Present',
      image: getImageUrl('data-metric-card/attendance'),
      color: 'bg-primary-soft',
    },
    {
      label: 'Term Status',
      value: progress.status,
      subtitle: 'Academic Cycle',
      image: getImageUrl('dashboard/card-upcoming-program'),
      color: 'bg-primary-soft',
    }
  ]
})

const modal = ref({
  isOpen: false,
  type: 'edit',
  loading: false
})

const openEditModal = () => {
  modal.value = { isOpen: true, type: 'edit', loading: false }
}

const handleModalSubmit = async (payload) => {
  modal.value.loading = true
  try {
    await classService.updateClass(classData.value.id, payload)
    await fetchData(classData.value.id)
    modal.value.isOpen = false
  } catch (err) {
    console.error('Update failed:', err)
  } finally {
    modal.value.loading = false
  }
}

const fetchData = async (id) => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [data, enrollmentData] = await Promise.all([
      classService.getClass(id),
      enrollmentService.getAllEnrollments({ classId: id, status: 'active' })
    ])
    classData.value = data
    students.value = enrollmentData || []
  } catch (err) {
    console.error('Failed to fetch class details:', err)
    errorMessage.value = err.message || 'Failed to load class details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.params.id) fetchData(route.params.id)
})

watch(() => route.params.id, (newId) => {
  if (newId) fetchData(newId)
})

const navigateToStudent = (studentId) => {
  router.push(`/students/${studentId}`)
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/classes" title="Class Detail"
      sidebarWidth="sm">
      <template #header-actions v-if="classData">
        <div class="flex items-center gap-3">
          <AppButton variant="primary" @click="openEditModal">
            <img :src="getActionIcon('edit')" class="w-4 h-4 brightness-0 invert" />
            <span>Edit Class</span>
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="classData">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div v-for="stat in classStats" :key="stat.label"
            class="bg-white rounded-md p-6 border border-outline-std shadow-sm hover:shadow-md transition-all duration-300 group">
            <div class="flex items-center gap-4">
              <div
                class="rounded-xl flex items-center justify-center bg-surface-subtle group-hover:bg-primary/5 transition-colors">
                <img :src="stat.image" class="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest leading-none mb-1">{{
                  stat.label }}</span>
                <span class="text-xl font-black text-content-dark tracking-tight">{{ stat.value }}</span>
                <span v-if="stat.subtitle" class="text-[9px] font-bold text-content-muted mt-0.5">{{ stat.subtitle
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="flex items-center gap-2 p-2 bg-white rounded-full border border-outline-std w-fit mb-8">
          <button v-for="tab in ['students', 'attendance', 'progress']" :key="tab"
            class="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
            :class="activeTab === tab ? 'bg-primary text-white shadow-md ring-1 ring-black/5 scale-[1.02]' : 'text-content-muted hover:text-content-dark hover:bg-white/50'"
            @click="activeTab = tab">
            {{ tab }}
          </button>
        </div>

        <section class="ui-detail-card overflow-hidden animate-fade-in min-h-[500px]">
          <div v-if="activeTab === 'students'">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-black text-content-dark">Enrolled Students ({{ students.length }})</h3>
              <AppButton variant="secondary" size="sm" @click="router.push('/enrollments')">
                <img :src="getActionIcon('plus')" class="w-3 h-3" />
                <span>Add Student</span>
              </AppButton>
            </div>

            <div v-if="students.length > 0" class="overflow-x-auto rounded-xl border border-outline-std bg-white">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-subtle/50">
                    <th class="p-4 text-xs font-black text-content-muted uppercase tracking-widest">No</th>
                    <th class="p-4 text-xs font-black text-content-muted uppercase tracking-widest">Student</th>
                    <th class="p-4 text-xs font-black text-content-muted uppercase tracking-widest">Parent</th>
                    <th class="p-4 text-xs font-black text-content-muted uppercase tracking-widest">Enrolled Date</th>
                    <th class="p-4 text-xs font-black text-content-muted uppercase tracking-widest text-center">Status
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-std/50">
                  <tr v-for="(enrollment, idx) in students" :key="enrollment.id"
                    class="hover:bg-surface-subtle/30 transition-colors cursor-pointer"
                    @click="navigateToStudent(enrollment.studentId)">
                    <td class="p-4 text-xs font-bold text-content-muted">{{ idx + 1 }}</td>
                    <td class="p-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl overflow-hidden border border-outline-std bg-white p-1">
                          <img :src="enrollment.student?.profileURL || getImageUrl('profiles/avatar-student')"
                            class="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div class="flex flex-col">
                          <span class="text-sm font-black text-content-dark leading-tight">{{ enrollment.student?.name
                          }}</span>
                          <span class="text-[10px] font-bold text-content-muted">{{
                            enrollment.student?.nickname || 'No Nickname' }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="p-4">
                      <span class="text-xs font-bold text-content-dark">{{ enrollment.parent?.name || 'N/A' }}</span>
                    </td>
                    <td class="p-4 text-xs font-bold text-content-muted tabular-nums">
                      {{ formatDateOnly(enrollment.enrollmentDate || enrollment.createdAt) }}
                    </td>
                    <td class="p-4 text-center">
                      <AppBadge :status="enrollment.status" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-24 opacity-30">
              <img :src="getImageUrl('common/no-data')" class="w-24 mb-4 grayscale" />
              <span class="text-sm font-black uppercase tracking-widest">No Students Enrolled Yet</span>
            </div>
          </div>

          <div v-else-if="activeTab === 'attendance'" class="flex flex-col items-center justify-center py-32 gap-4">
            <div class="w-16 h-16 rounded-3xl bg-surface-subtle flex items-center justify-center mb-2">
              <img :src="getActionIcon('calendar')" class="w-8 h-8 opacity-20" />
            </div>
            <h3 class="text-base font-black text-content-dark">Attendance Tracking</h3>
            <p class="text-sm text-content-muted text-center max-w-sm">This module is coming soon. You will be able to
              track daily presence and session performance here.</p>
          </div>

          <div v-else-if="activeTab === 'progress'" class="flex flex-col items-center justify-center py-32 gap-4">
            <div class="w-16 h-16 rounded-3xl bg-surface-subtle flex items-center justify-center mb-2">
              <img :src="getImageUrl('dashboard/card-top-program')" class="w-8 h-8 opacity-20" />
            </div>
            <h3 class="text-base font-black text-content-dark">Academic Progress</h3>
            <p class="text-sm text-content-muted text-center max-w-sm">Detailed academic metrics, scores, and progress
              reports for this class instance will be available here.</p>
          </div>
        </section>
      </template>

      <template #right-content v-if="classData">
        <div class="flex flex-col gap-8">
          <!-- Class Summary Card -->
          <section class="ui-detail-card flex flex-col items-center gap-6">
            <h2 class="w-full font-black text-content-dark text-center border-b border-outline-std/50 pb-4">Class
              Identity</h2>
            <div class="relative group">
              <div
                class="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-outline-std p-4 bg-white">
                <img :src="getProgramProfileURL(classData.program?.profileURL, classData.program?.category)"
                  class="w-full h-full object-contain" />
              </div>
              <div class="absolute -bottom-2 -right-2">
                <AppBadge :status="classData.branch?.abbr || 'FM'" :type="classData.branch?.color || 'blue'" />
              </div>
            </div>

            <div class="flex flex-col items-center text-center gap-1">
              <span class="text-lg font-black text-content-dark tracking-tight leading-tight">{{ classData.program?.name
              }}</span>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">{{
                  classData.program?.category }}</span>
                <span class="text-primary/30">•</span>
                <span class="text-[10px] font-black text-primary uppercase tracking-widest">{{ classData.program?.level
                }}</span>
              </div>
            </div>

            <div class="w-full grid grid-cols-2 gap-4 mt-2">
              <div class="flex flex-col p-3 bg-surface-subtle rounded-xl border border-outline-std/50">
                <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mb-1">Day</span>
                <span class="text-xs font-black text-content-dark">{{ classData.day }}</span>
              </div>
              <div class="flex flex-col p-3 bg-surface-subtle rounded-xl border border-outline-std/50">
                <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mb-1">Time</span>
                <span class="text-xs font-black text-content-dark">{{ classData.timeslot }}</span>
              </div>
            </div>
          </section>

          <!-- Teachers Card -->
          <section class="ui-detail-card">
            <h3 class="font-black text-content-dark mb-4 flex items-center gap-2">
              <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40" />
              Assigned Teachers
            </h3>
            <div class="flex flex-col gap-4">
              <div v-for="teacher in classData.teachers" :key="teacher.id"
                class="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-subtle transition-colors border border-transparent hover:border-outline-std/50 cursor-pointer"
                @click="router.push('/teachers')">
                <div
                  class="w-12 h-12 rounded-xl overflow-hidden border border-outline-std bg-white ring-2 ring-primary/5">
                  <img :src="teacher.profileURL || getImageUrl('profiles/avatar-teacher-woman')"
                    class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-black text-content-dark">{{ teacher.name }}</span>
                  <span class="text-[10px] font-bold text-content-muted">{{ teacher.category || 'Lead Instructor'
                  }}</span>
                </div>
              </div>
              <div v-if="!classData.teachers?.length" class="text-center py-4 italic text-content-muted text-xs">
                No teachers assigned.
              </div>
            </div>
          </section>

          <!-- Term Info -->
          <section class="ui-detail-card bg-primary/5 border-primary/20">
            <h3 class="font-black text-primary mb-4 text-sm uppercase tracking-widest">Academic Context</h3>
            <div class="flex flex-col gap-4">
              <div class="flex justify-between items-center pb-3 border-b border-primary/10">
                <span class="text-xs font-bold text-content-muted">Active Term</span>
                <AppBadge :status="classData.term?.name" type="blue" />
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-content-muted">Duration</span>
                <span class="text-xs font-black text-content-dark">{{ classData.term?.startDate }} — {{
                  classData.term?.endDate }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-content-muted">Total Sessions</span>
                <span class="text-xs font-black text-primary">{{ classData.term?.totalSessions }} Weeks</span>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <ClassActionModal :isOpen="modal.isOpen" :type="modal.type" :classInstance="classData" :loading="modal.loading"
      @close="modal.isOpen = false" @submit="handleModalSubmit" />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white rounded-[2rem] p-8 border border-outline-std shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5;
}
</style>
