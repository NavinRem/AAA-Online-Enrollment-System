<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { studentService } from '@/services/studentService'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus, isSessionInProgress } from '@/utils/programHelper'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import ProgramActionModal from '@/components/programs/ProgramActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

const route = useRoute()
const router = useRouter()

const program = ref(null)
const classes = ref([])
const enrollments = ref([])
const students = ref([])
const loading = ref(true)
const errorMessage = ref('')
const now = ref(new Date())

const activeTab = ref('overview')
const searchQuery = ref('')

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [pData, cData, eData, stdData] = await Promise.all([
      programService.getProgram(id),
      classService.getAvailableClasses(id),
      enrollmentService.getAllEnrollments(),
      studentService.getAllStudents(),
    ])

    program.value = pData
    classes.value = Array.isArray(cData) ? cData : []

    const allEnrollments = Array.isArray(eData) ? eData : []
    enrollments.value = allEnrollments.filter((e) => String(e.programId || '') === String(id))

    students.value = Array.isArray(stdData) ? stdData : []
  } catch (err) {
    console.error('Error fetching program details:', err)
    errorMessage.value = 'Failed to load program details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initData()
  const interval = setInterval(() => {
    now.value = new Date()
  }, 60000)
  return () => clearInterval(interval)
})

const statsCards = computed(() => {
  if (!program.value) return []

  const paidEnrollmentsCount = enrollments.value.filter((e) =>
    ['paid', 'confirmed'].includes(String(e.status || e.paymentStatus).toLowerCase()),
  ).length
  const totalRevenue = enrollments.value
    .filter((e) => ['paid', 'confirmed'].includes(String(e.status || e.paymentStatus).toLowerCase()))
    .reduce((sum, e) => sum + Number(e.amount || program.value.basePrice || 0), 0)

  const scheduledCount = classInstances.value.filter((i) => i.status === 'Scheduled').length
  const maxCapacity = Number(program.value.maxCapacity || 5)
  const remainingCapacity = Math.max(0, maxCapacity - paidEnrollmentsCount)

  return [
    {
      label: 'Live Enrollment',
      value: paidEnrollmentsCount,
      image: getImageUrl('data-metric-card/total-enrolled'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Financial Yield',
      value: `$${totalRevenue.toLocaleString()}`,
      image: getImageUrl('data-metric-card/program-revenue'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Open Sessions',
      value: scheduledCount,
      image: getImageUrl('data-metric-card/remaining-sessions'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Available Slots',
      value: remainingCapacity,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
      color: 'var(--accent-light)',
    },
  ]
})

const enrolledStudents = computed(() => {
  if (!enrollments.value.length) return []

  const enriched = enrichEnrollments(
    enrollments.value,
    [],
    students.value,
    [program.value].filter(Boolean),
  )

  return enriched.filter((e) => {
    const studentName = e.studentName || 'Unknown Student'
    if (!searchQuery.value) return true
    return studentName.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

const classInstances = computed(() => {
  if (!program.value || classes.value.length === 0) return []

  const instances = []
  const start = new Date(program.value.startDate)
  const end = new Date(program.value.endDate)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  classes.value.forEach((cls) => {
    const dayName = cls.day
    if (!dayName) return

    const targetDayIndex = days.indexOf(dayName)
    let current = new Date(start)

    while (current.getDay() !== targetDayIndex) {
      current.setDate(current.getDate() + 1)
    }

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const isToday = dateStr === now.value.toISOString().split('T')[0]
      const isPastDay =
        current < new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate())

      let status = 'Scheduled'
      if (isToday) {
        if (isSessionInProgress(cls)) {
          status = 'In Progress'
        } else {
          const times = (cls.timeslot || '').split('-').map((t) => t.trim())
          if (times.length === 2) {
            const [hours, minutes] = times[1].split(':').map(Number)
            const endMinutes = hours * 60 + minutes
            const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()
            if (currentMinutes > endMinutes) status = 'Past'
          }
        }
      } else if (isPastDay) {
        status = 'Past'
      }

      instances.push({
        id: `${cls.id}-${dateStr}`,
        date: dateStr,
        day: dayName,
        timeslot: cls.timeslot,
        status: status,
      })

      current.setDate(current.getDate() + 7)
    }
  })

  return instances.sort((a, b) => a.date.localeCompare(b.date))
})

const actionModal = ref({
  isOpen: false,
  type: 'edit',
  program: null,
  loading: false,
  error: '',
  success: '',
})

const openActionModal = (type) => {
  actionModal.value = {
    isOpen: true,
    type,
    program: program.value,
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
    if (actionModal.value.type === 'edit') {
      await programService.updateProgram(program.value.id, formData)
      actionModal.value.success = 'Program updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await programService.deleteProgram(program.value.id)
      actionModal.value.success = 'Program deleted successfully!'
      setTimeout(() => {
        router.push('/programs')
      }, 1500)
      return
    }

    setTimeout(() => {
      closeModal()
      initData()
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/programs" title="Program Analytics">
      <template #header-actions v-if="program">
        <div class="flex items-center gap-3">
          <AppButton variant="secondary" class="rounded-xl border-outline-std" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-70" /> 
            <span class="font-bold">Edit Core Data</span>
          </AppButton>
          <div class="w-px h-6 bg-outline-std mx-1"></div>
          <AppButton variant="danger" class="rounded-xl shadow-lg shadow-error/10" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-4 h-4 invert" />
            <span class="font-black">Terminate</span>
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="program">
        <!-- Identity Header -->
        <div class="mb-10 p-8 rounded-[2rem] bg-white border border-outline-std shadow-sm flex flex-col md:flex-row items-center gap-10">
          <div class="w-40 h-40 rounded-[2.5rem] overflow-hidden ring-4 ring-primary/5 shadow-2xl bg-surface-subtle p-6">
            <img :src="getProgramProfileURL(program.profileURL, program.category)" class="w-full h-full object-contain" />
          </div>
          
          <div class="flex flex-col items-center md:items-start text-center md:text-left flex-1">
            <div class="flex items-center gap-3 mb-2">
               <h1 class="text-4xl font-black text-content-dark tracking-tighter">{{ program.name }}</h1>
               <AppBadge :status="getProgramDisplayStatus(program)" />
            </div>
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-6 text-content-muted">
               <div class="flex flex-col">
                  <span class="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-50">Course Category</span>
                  <span class="text-lg font-black text-primary tracking-tight">{{ program.category || 'Standard' }}</span>
               </div>
               <div class="w-px h-8 bg-outline-std"></div>
               <div class="flex flex-col">
                  <span class="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-50">Academic Term</span>
                  <span class="text-sm font-bold text-content-dark">{{ program.termName || 'Open Enrollment' }}</span>
               </div>
               <div class="w-px h-8 bg-outline-std"></div>
               <div class="flex flex-col">
                  <span class="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-50">Base Valuation</span>
                  <span class="text-sm font-black text-emerald-600 tabular-nums">${{ program.basePrice || 0 }}</span>
               </div>
            </div>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DataMetricCard v-for="card in statsCards" :key="card.label" v-bind="card" />
        </div>

        <!-- Repository Tabs -->
        <div class="bg-white rounded-[2.5rem] border border-outline-std shadow-sm overflow-hidden min-h-[500px]">
          <div class="flex items-center gap-2 p-3 bg-surface-subtle/30 border-b border-outline-std">
            <button
              v-for="tab in ['overview', 'students', 'classes']"
              :key="tab"
              class="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
              :class="activeTab === tab ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-content-muted hover:text-content-dark hover:bg-white/50'"
              @click="activeTab = tab"
            >
              {{ tab === 'overview' ? 'Syllabus Details' : tab === 'students' ? 'Class Roster' : 'Attendance Log' }}
            </button>
          </div>

          <div class="p-8">
            <!-- Overview -->
            <div v-if="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="space-y-6">
                  <div class="p-6 rounded-3xl bg-surface-subtle/50 border border-outline-std/50">
                     <span class="text-[10px] font-black uppercase tracking-widest text-content-muted block mb-3">Program Synopsis</span>
                     <p class="text-sm font-medium leading-relaxed text-content-dark italic">
                        {{ program.description || 'Detailed administrative synopsis pending for this academic program.' }}
                     </p>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                     <div class="p-6 rounded-3xl bg-white border border-outline-std shadow-sm">
                        <span class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Difficulty Level</span>
                        <span class="text-base font-black text-content-dark">{{ program.levelName || 'Standard' }}</span>
                     </div>
                     <div class="p-6 rounded-3xl bg-white border border-outline-std shadow-sm">
                        <span class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Max Capacity</span>
                        <span class="text-base font-black text-content-dark uppercase">{{ program.maxCapacity || 'Unlimited' }}</span>
                     </div>
                  </div>
               </div>

               <div class="space-y-4">
                  <div class="p-6 rounded-3xl bg-white border border-outline-std shadow-sm flex items-center justify-between">
                     <div class="flex flex-col">
                        <span class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Active Schedule</span>
                        <span class="text-lg font-black text-content-dark tracking-tight">{{ program.schedule?.day }}</span>
                        <span class="text-[10px] font-black text-primary uppercase tracking-widest">{{ program.schedule?.timeslot }}</span>
                     </div>
                     <div class="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                        <img :src="getActionIcon('calendar')" class="w-6 h-6 opacity-30" />
                     </div>
                  </div>
                  
                  <div class="p-6 rounded-3xl bg-white border border-outline-std shadow-sm flex items-center justify-between">
                     <div class="flex flex-col">
                        <span class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Total Unit Quota</span>
                        <span class="text-lg font-black text-content-dark tracking-tight">{{ program.totalSessions }} Sessions</span>
                        <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                           ${{ (Number(program.basePrice || 0) / (Number(program.totalSessions) || 1)).toFixed(2) }} / unit
                        </span>
                     </div>
                     <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <img :src="getActionIcon('payment')" class="w-6 h-6 opacity-30" />
                     </div>
                  </div>
               </div>
            </div>

            <!-- Roster -->
            <div v-if="activeTab === 'students'">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-lg font-black text-content-dark tracking-tight">Student Enrollment Registry</h3>
                <div class="relative group">
                  <input type="text" v-model="searchQuery" placeholder="Filter by name..."
                    class="w-64 pl-10 pr-4 py-2.5 rounded-xl border border-outline-std text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-content-muted/40" />
                  <img :src="getActionIcon('search')" class="absolute left-3.5 top-3 w-4 h-4 opacity-20" />
                </div>
              </div>

              <div v-if="enrolledStudents.length > 0" class="overflow-hidden rounded-3xl border border-outline-std">
                <table class="w-full text-left">
                  <thead class="bg-surface-subtle/50">
                    <tr>
                      <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">Rank</th>
                      <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">Identity</th>
                      <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest text-center">Academic</th>
                      <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-std">
                    <tr v-for="(item, idx) in enrolledStudents" :key="item.id" class="group hover:bg-surface-subtle/20 cursor-pointer transition-all" @click="router.push(`/students/${item.studentId}`)">
                      <td class="px-6 py-5 text-xs font-black text-content-muted/30 tabular-nums">{{ idx + 1 }}</td>
                      <td class="px-6 py-5">
                        <div class="flex items-center gap-4">
                           <div class="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-sm">
                              <img :src="item.student?.profileURL" class="w-full h-full object-cover" />
                           </div>
                           <div class="flex flex-col">
                              <span class="text-sm font-black text-content-dark group-hover:text-primary transition-colors tracking-tight">{{ item.student?.name }}</span>
                              <span class="text-[9px] font-bold text-content-muted uppercase tracking-widest">Enrolled {{ item.enrollAt }}</span>
                           </div>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-center">
                        <AppBadge :status="item.academicStatus" />
                      </td>
                      <td class="px-6 py-5 text-center">
                        <AppBadge :status="item.displayStatus" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-20 opacity-30">
                <img :src="getImageUrl('common/no-data')" class="w-20 mb-4 grayscale" />
                <span class="text-sm font-black uppercase tracking-widest">No Registered Students</span>
              </div>
            </div>

            <!-- Attendance -->
            <div v-if="activeTab === 'classes'">
               <div v-if="classInstances.length > 0" class="overflow-hidden rounded-3xl border border-outline-std">
                 <table class="w-full text-left">
                   <thead class="bg-surface-subtle/50">
                     <tr>
                       <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">Timeline</th>
                       <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">Session Slot</th>
                       <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest text-center">Live Status</th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-outline-std">
                     <tr v-for="item in classInstances" :key="item.id" class="hover:bg-surface-subtle/20 transition-colors">
                       <td class="px-6 py-5">
                          <div class="flex flex-col">
                             <span class="text-sm font-black text-content-dark tabular-nums tracking-tight">{{ item.date }}</span>
                             <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">{{ item.day }}</span>
                          </div>
                       </td>
                       <td class="px-6 py-5 text-xs font-bold text-content-dark uppercase">
                          {{ item.timeslot }}
                       </td>
                       <td class="px-6 py-5 text-center">
                          <AppBadge :status="item.status" />
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
               <div v-else class="flex flex-col items-center justify-center py-20 opacity-30">
                  <img :src="getImageUrl('common/no-data')" class="w-20 mb-4 grayscale" />
                  <span class="text-sm font-black uppercase tracking-widest">No Class Records Available</span>
               </div>
            </div>
          </div>
        </div>
      </template>

      <template #right-content v-if="program">
        <!-- Faculty Card -->
        <div class="bg-white rounded-[2rem] border border-outline-std shadow-sm overflow-hidden">
           <div class="p-6 border-b border-outline-std bg-surface-subtle/30">
              <h3 class="text-xs font-black uppercase tracking-widest text-content-muted">Assigned Faculty</h3>
           </div>
           <div class="p-6 space-y-4">
              <template v-if="program.teachers?.length">
                <div v-for="t in program.teachers" :key="t.id" class="flex items-center gap-4 group">
                   <div class="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-sm">
                      <img :src="t.profileURL" class="w-full h-full object-cover" />
                   </div>
                   <div class="flex flex-col">
                      <span class="text-sm font-black text-content-dark group-hover:text-primary transition-colors tracking-tight">{{ t.name }}</span>
                      <span class="text-[9px] font-black text-content-muted uppercase tracking-widest">{{ t.role || 'Instructor' }}</span>
                   </div>
                </div>
              </template>
              <div v-else class="flex flex-col items-center py-6 opacity-30 italic">
                 <span class="text-[10px] font-bold uppercase tracking-widest text-content-muted">Unassigned Staff</span>
                 <span class="text-xs font-black text-content-dark mt-1">{{ program.teacherName || 'TBA' }}</span>
              </div>
           </div>
        </div>
        
        <!-- Action Summary -->
        <div class="mt-6 flex flex-col gap-3 opacity-40 px-4">
           <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Initialized</span>
              <span class="text-content-dark">{{ program.createdAt ? new Date(program.createdAt).toLocaleDateString() : 'N/A' }}</span>
           </div>
           <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Last Sync</span>
              <span class="text-content-dark">{{ program.updatedAt ? new Date(program.updatedAt).toLocaleDateString() : 'Active' }}</span>
           </div>
        </div>
      </template>
    </DetailPageLayout>

    <ProgramActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :program="actionModal.program"
      :loading="actionModal.loading" :error="actionModal.error" :success="actionModal.success" @close="closeModal"
      @submit="handleActionSubmit" />
  </DashboardLayout>
</template>
