<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DetailMetricCard from '@/components/common/data/DetailMetricCard.vue'
import { termService } from '@/services/termService'
import { branchService } from '@/services/branchService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatPrice, formatShortDate, calculateClassProgress, generateClassSessions, formatDateOnly } from '@/utils/formatUtils'
import TermActionModal from '@/components/terms/TermActionModal.vue'
import TermOfferingActionModal from '@/components/terms/TermOfferingActionModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

const loading = ref(true)
const errorMessage = ref('')
const term = ref(null)
const branches = ref([])
const activeBranchId = ref(null)
const activeSubTab = ref('classes') // 'classes' or 'students'

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [tData, bData] = await Promise.all([
      termService.getTerm(id),
      branchService.getAllBranches(),
      dataStore.fetchTrials(),
      dataStore.fetchEnrollments(),
      dataStore.fetchStudents(),
      dataStore.fetchPrograms()
    ])

    term.value = tData.data || tData
    branches.value = bData.data || bData

    if (term.value.branchIds && term.value.branchIds.length > 0) {
      activeBranchId.value = term.value.branchIds[0]
    }
  } catch (err) {
    console.error('Error fetching term details:', err)
    errorMessage.value = 'Failed to load term details'
  } finally {
    loading.value = false
  }
}

onMounted(initData)

const termBranches = computed(() => {
  if (!term.value || !branches.value.length) return []
  return term.value.branchIds.map(id => branches.value.find(b => b.id === id)).filter(Boolean)
})

const activeBranch = computed(() => {
  return branches.value.find(b => b.id === activeBranchId.value)
})

const activeBranchSetting = computed(() => {
  if (!term.value || !activeBranchId.value || !term.value.branchSettings) return null
  return term.value.branchSettings.find(s => s.branchId === activeBranchId.value)
})

const branchOfferings = computed(() => {
  if (!term.value || !activeBranchId.value) return []
  const rawOfferings = (term.value.offerings || []).filter(o => String(o.branchId) === String(activeBranchId.value))

  return rawOfferings.map(off => {
    // Find students for this offering from global enrollments
    const enrollments = dataStore.enrollments.filter(e =>
      String(e.termId) === String(term.value.id) &&
      String(e.branchId) === String(activeBranchId.value) &&
      String(e.classId) === String(off.classId)
    )

    const students = enrollments.map(e => {
      const student = dataStore.students.find(s => String(s.id) === String(e.studentId))
      if (!student) return null
      return {
        ...student,
        paymentStatus: e.status || 'unpaid',
        status: e.status || 'active',
        enrollmentId: e.id
      }
    }).filter(Boolean)

    return {
      ...off,
      students
    }
  })
})

const branchStudents = computed(() => {
  const studentMap = new Map()
  branchOfferings.value.forEach(offering => {
    ; (offering.students || []).forEach(s => {
      if (!studentMap.has(s.id || s.studentId)) {
        studentMap.set(s.id || s.studentId, {
          ...s,
          offeringName: `${offering.program?.name || 'Program'} - ${offering.schedule?.day || ''} ${offering.schedule?.time || ''}`
        })
      }
    })
  })
  return Array.from(studentMap.values())
})

const getOfferingSessions = (offering) => {
  if (!offering || !term.value) return []
  const setting = activeBranchSetting.value || term.value
  return generateClassSessions(
    setting.startDate,
    offering.schedule?.day,
    term.value.totalSessions || 11
  )
}

const getAttendanceHeaders = (offering) => {
  const sessions = getOfferingSessions(offering)
  const headers = [
    { label: 'No', width: '50px', align: 'center' },
    { label: 'Student Identity', width: '220px' },
    { label: 'Level', width: '100px', align: 'center' },
    { label: 'Session', width: '120px', align: 'center' }
  ]

  sessions.forEach((s, i) => {
    headers.push({
      label: `Session ${i + 1}`,
      subLabel: formatDateOnly(s.date).split(' ').slice(0, 2).join(' '), // Short date like "17 April"
      width: '100px',
      align: 'center'
    })
  })

  headers.push({ label: 'Remark', width: '150px' })
  return headers
}

const branchTrials = computed(() => {
  if (!term.value || !activeBranchId.value) return []

  const setting = activeBranchSetting.value || term.value
  const startDate = new Date(setting.startDate)
  const endDate = new Date(setting.endDate)

  // Trials that belong to this branch and fall within the term's date range
  return dataStore.trials.filter(t => {
    const isSameBranch = t.branchId === activeBranchId.value
    const trialDate = new Date(t.trialDate)
    return isSameBranch && trialDate >= startDate && trialDate <= endDate
  })
})

const branchDisplayData = computed(() => {
  if (!term.value) return null
  const setting = activeBranchSetting.value || term.value
  const progress = calculateClassProgress(setting.startDate, setting.endDate)
  return {
    status: progress.status,
    startDate: setting.startDate,
    endDate: setting.endDate
  }
})

const statsCards = computed(() => {
  if (!term.value) return []

  const offerings = branchOfferings.value
  const students = branchStudents.value
  const revenue = offerings.reduce((sum, o) => sum + (o.revenue || 0), 0)

  return [
    {
      label: 'Total Classes',
      value: offerings.length,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Enrolled Students',
      value: students.length,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Term Revenue',
      value: `$${formatPrice(revenue)}`,
      image: getImageUrl('data-metric-card/program-revenue'),
    },
    {
      label: 'Total Trials',
      value: branchTrials.value.length,
      image: getImageUrl('enrollment/total-enrollment'),
    }
  ]
})

const classHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Class Identity' },
  { label: 'Schedule', width: '150px' },
  { label: 'Capacity', align: 'center', width: '150px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const studentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student Identity' },
  { label: 'Enrolled Class' },
  { label: 'Payment', align: 'center', width: '120px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const modal = ref({
  isOpen: false,
  type: 'edit',
  loading: false,
  error: '',
  success: '',
})

const openModal = (type) => {
  modal.value.type = type
  modal.value.isOpen = true
}

const addClassModal = ref({
  isOpen: false,
  loading: false,
  error: '',
  success: ''
})

const handleAddClass = async (newOffering) => {
  addClassModal.value.loading = true
  addClassModal.value.error = ''
  try {
    const updatedOfferings = [...(term.value.offerings || []), newOffering]
    await termService.updateTerm(term.value.id, { offerings: updatedOfferings })
    addClassModal.value.success = 'Class added successfully'
    setTimeout(() => {
      addClassModal.value.isOpen = false
      addClassModal.value.success = ''
      initData()
    }, 1500)
  } catch (err) {
    addClassModal.value.error = err.message || 'Failed to add class'
  } finally {
    addClassModal.value.loading = false
  }
}

const handleActionSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  try {
    if (modal.value.type === 'delete') {
      await termService.deleteTerm(term.value.id)
      modal.value.success = 'Term deleted successfully'
      setTimeout(() => router.push('/terms'), 1500)
    } else {
      await termService.updateTerm(term.value.id, payload)
      modal.value.success = 'Term updated successfully'
      setTimeout(() => {
        modal.value.isOpen = false
        initData()
      }, 1500)
    }
  } catch (err) {
    modal.value.error = err.message || 'Action failed'
  } finally {
    modal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/terms" title="Term Analytics"
      sidebarWidth="sm">
      <template #header-actions v-if="term">
        <div class="flex items-center">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Term" @click="openModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100 transition-opacity" />
          </button>
          <div class="w-px h-6 bg-outline-std/50 mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Term" @click="openModal('delete')">
            <img :src="getActionIcon('delete')"
              class="w-5 h-5 icon-danger group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </template>

      <template #left-content v-if="term">
        <!-- Metrics Grid for Branch -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DetailMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Branch Selector & Sub Tabs -->
        <div class="flex flex-col gap-6 mb-8">
          <div class="flex flex-wrap items-center gap-2 p-2 bg-white rounded-2xl border border-outline-std w-fit">
            <button v-for="branch in termBranches" :key="branch.id"
              class="px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 border border-transparent"
              :class="activeBranchId === branch.id
                ? 'shadow-md ring-1 ring-black/5'
                : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'" :style="activeBranchId === branch.id ? {
                  backgroundColor: `var(--color-${branch.color || 'blue'})`,
                  color: 'white'
                } : {}" @click="activeBranchId = branch.id">
              {{ branch.name }}
            </button>
          </div>

          <div class="flex items-center gap-1 p-1 bg-white rounded-xl border border-outline-std w-fit">
            <button v-for="tab in ['classes', 'students']" :key="tab"
              class="px-8 py-2.5 rounded-lg text-xs font-bold  transition-all duration-300"
              :class="activeSubTab === tab ? 'bg-primary text-white shadow-md' : 'text-content-muted hover:text-content-dark'"
              @click="activeSubTab = tab">
              {{ tab }}
            </button>
          </div>
        </div>

        <section
          class="overflow-hidden animate-fade-in min-h-[400px] border border-outline-std rounded-[2rem] bg-white shadow-sm">
          <DataTable v-if="activeSubTab === 'classes'" title="Branch Classes" :headers="classHeaders"
            :items="branchOfferings" entityName="class" :flexible="true" :hasSearch="false">
            <template #toolbar-actions>
              <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
                @click="addClassModal.isOpen = true">
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-tight">Add Class</span>
              </AppButton>
            </template>
            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                {{ index + 1 }}
              </td>
              <td class="ui-cell">
                <div class="flex flex-col">
                  <span class="">{{ item.program?.name || 'Program' }}</span>
                  <span class="tracking-tight">{{ item.classId
                    }}</span>
                </div>
              </td>
              <td class="ui-cell">
                <div class="flex flex-col gap-1">
                  <AppBadge :status="item.schedule?.day" type="blue" />
                  <span class="">{{ item.schedule?.time }}</span>
                </div>
              </td>
              <td class="ui-cell text-center">
                <div class="flex flex-col items-center gap-1 px-4">
                  <div class="w-full h-1 bg-surface-subtle rounded-full overflow-hidden">
                    <div class="h-full bg-primary"
                      :style="{ width: (item.currentCount / (item.capacity || 20) * 100) + '%' }"></div>
                  </div>
                  <span class="">{{ item.currentCount || 0 }}/{{ item.capacity
                    || 20 }}</span>
                </div>
              </td>
              <td class="ui-cell text-center">
                <AppBadge :status="item.status || 'Active'" />
              </td>
            </template>
          </DataTable>

          <div v-else class="flex flex-col gap-12">
            <template v-if="branchOfferings.length > 0">
              <div v-for="offering in branchOfferings" :key="offering.id" class="flex flex-col gap-6">
                <div class="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex justify-between items-center">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-primary/10">
                      <span class="text-xl">📅</span>
                    </div>
                    <div class="flex flex-col">
                      <h3 class="text-lg font-black text-primary tracking-tight">Class Schedule: {{
                        offering.schedule?.day?.toUpperCase() }}</h3>
                      <span class="text-xs font-bold text-content-muted">{{ offering.program?.name }} • {{
                        offering.schedule?.time
                      }}</span>
                    </div>
                  </div>
                  <AppBadge :status="offering.status || 'Active'" />
                </div>

                <div class="overflow-hidden border border-outline-std rounded-[2rem] bg-white shadow-sm">
                  <DataTable :headers="getAttendanceHeaders(offering)" :items="offering.students || []"
                    entityName="student" :flexible="true" :hasSearch="false">
                    <template #header-session>
                      <div class="flex flex-col gap-1 items-center">
                        <span class="block">Session</span>
                        <select
                          class="text-3xs bg-surface-subtle border border-outline-std rounded px-1 py-0.5 font-semibold text-content-muted focus:outline-none">
                          <option>Filter</option>
                        </select>
                      </div>
                    </template>

                    <template #row="{ item, index, headers }">
                      <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                        {{ index + 1 }}
                      </td>
                      <td class="ui-cell" :style="{ width: headers[1].width }">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full overflow-hidden bg-surface-subtle border border-outline-std">
                            <img :src="item.profileURL || getImageUrl('common/default-avatar')"
                              class="w-full h-full object-cover" />
                          </div>
                          <div class="flex flex-col">
                            <span class="font-bold text-content-dark text-sm">{{ item.name }}</span>
                            <span class="text-3xs text-content-muted font-bold tracking-tighter">{{ item.studentId
                            }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                        <AppBadge :status="offering.program?.level || 'Basic'" type="magenta" />
                      </td>
                      <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                        <div
                          class="w-24 h-7 bg-surface-subtle rounded-full border border-outline-std flex items-center justify-between px-2 cursor-pointer hover:bg-surface-light transition-colors">
                          <span class="text-3xs font-black text-content-muted">Session</span>
                          <span class="text-xs">▾</span>
                        </div>
                      </td>

                      <td v-for="n in (term.totalSessions || 11)" :key="n" class="ui-cell text-center"
                        style="width: 100px">
                        <div
                          class="w-8 h-8 mx-auto rounded-full bg-surface-subtle border border-outline-std flex items-center justify-center cursor-pointer hover:bg-primary-soft hover:border-primary/30 transition-all group">
                          <div class="w-1.5 h-1.5 rounded-full bg-content-muted/30 group-hover:bg-primary/50"></div>
                        </div>
                      </td>

                      <td class="ui-cell" :style="{ width: headers[headers.length - 1].width }">
                        <div
                          class="w-full h-8 bg-surface-subtle/50 border border-dashed border-outline-std rounded-lg px-2 flex items-center">
                          <span class="text-3xs italic text-content-muted">Add remark...</span>
                        </div>
                      </td>
                    </template>
                  </DataTable>
                </div>
              </div>
            </template>
            <div v-else class="flex flex-col items-center justify-center py-20 text-content-muted">
              <span class="text-4xl mb-4">📭</span>
              <p class="text-lg font-bold">No classes found for this branch</p>
              <p class="text-sm">Switch to another branch or add classes to this term.</p>
            </div>
          </div>
        </section>
      </template>

      <template #right-content v-if="term">
        <div class="flex flex-col gap-md">
          <!-- Identity Card -->
          <section class="ui-detail-card flex flex-col items-center gap-4 py-6">
            <h2 class="w-full font-bold text-content-dark text-center">
              Basic Information</h2>
            <div class="relative group">
              <div
                class="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle flex items-center justify-center p-6">
                <img :src="getImageUrl('enrollment/total-enrollment')" alt="Term Icon"
                  class="w-full h-full object-contain" />
              </div>
            </div>
            <div class="text-center">
              <h3 class="text-xl font-black text-content-dark tracking-tight">{{ term.name }}</h3>
              <span class="text-sm font-bold text-content-muted  mt-1">{{ term.totalSessions }}
                Weekly Sessions</span>
            </div>
          </section>

          <!-- Parameters Card -->
          <section class="ui-detail-card !py-8">
            <div class="flex flex-col items-center gap-6">
              <div v-if="activeBranch"
                class="flex flex-col items-center gap-2 w-full pb-6 border-b border-outline-std/50">
                <span class="text-xs font-bold text-content-muted uppercase tracking-widest">Selected Branch</span>
                <AppBadge :status="activeBranch.name" :type="activeBranch.color" class="px-6 py-1.5 text-sm" />
              </div>

              <div class="grid grid-cols-2 gap-x-12 gap-y-8 w-full" v-if="branchDisplayData">
                <div class="flex flex-col items-center gap-2">
                  <span class="text-xs font-bold text-content-muted uppercase tracking-widest">Status</span>
                  <AppBadge :status="branchDisplayData.status" />
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-xs font-bold text-content-muted uppercase tracking-widest">Locations</span>
                  <span class="text-md font-black text-content-dark">{{ term.branchIds.length }} Branches</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-xs font-bold text-content-muted uppercase tracking-widest">Duration</span>
                  <span class="text-md font-black text-content-dark">{{ term.totalSessions }} Weeks</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-xs font-bold text-content-muted uppercase tracking-widest">Sessions</span>
                  <span class="text-md font-black text-content-dark">{{ term.totalSessions }} Total</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-xs font-bold text-content-muted uppercase tracking-widest">Start Date</span>
                  <AppBadge :status="formatShortDate(branchDisplayData.startDate)" type="green" />
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-xs font-bold text-content-muted uppercase tracking-widest">End Date</span>
                  <AppBadge :status="formatShortDate(branchDisplayData.endDate)" type="red" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <TermActionModal :isOpen="modal.isOpen" :type="modal.type" :term="term" :branches="branches"
      :loading="modal.loading" :error="modal.error" :success="modal.success" @close="modal.isOpen = false"
      @submit="handleActionSubmit" />

    <TermOfferingActionModal :isOpen="addClassModal.isOpen" :term="term" :initialBranchId="activeBranchId"
      :loading="addClassModal.loading" :error="addClassModal.error" :success="addClassModal.success"
      @close="addClassModal.isOpen = false" @submit="handleAddClass" />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white rounded-[2rem] p-8 border border-outline-std shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5;
}
</style>
