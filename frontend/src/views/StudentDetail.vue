<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import DetailCard from '../components/cards/DetailCard.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import DetailedSummaryCard from '@/components/cards/DetailedSummaryCard.vue'
import { userService } from '@/services/userService'
import { enrollmentService } from '@/services/enrollmentService'
import { formatDate, formatDateOnly } from '@/utils/dateFormatter'
import { calculateStudentStatus, isEnrollmentActive } from '@/utils/studentStatusHelper'
import StudentActionModal from '@/components/students/StudentActionModal.vue'

import { getImageUrl } from '@/utils/assetHelper'

const route = useRoute()
const router = useRouter()

const student = ref(null)
const parent = ref(null)
const enrollments = ref([])

const computedStatus = computed(() => {
  if (!student.value) return 'Inactive'
  return calculateStudentStatus(student.value, enrollments.value)
})

const primaryParent = computed(() => {
  return parent.value?.role?.toLowerCase() === 'parent' ? parent.value : null
})

const primaryGuardian = computed(() => {
  return parent.value?.role?.toLowerCase() === 'guardian' ? parent.value : null
})

const loading = ref(true)
const errorMessage = ref('')
const globalSuccess = ref('')
const globalError = ref('')
const submitting = ref(false)

const activeTab = ref('academic') // 'academic', 'attendance', 'behavior', 'exam'
const currentFilter = ref('all')
const searchQuery = ref('')

const actionModal = ref({
  isOpen: false,
  type: '',
  student: null,
  enrollment: null,
})

const openActionModal = (type, enrollment = null) => {
  globalError.value = ''
  globalSuccess.value = ''
  actionModal.value = {
    isOpen: true,
    type,
    student: student.value,
    enrollment,
  }
}

const submitActionModal = async (formData) => {
  const { type, student: currentStudent } = actionModal.value
  submitting.value = true
  globalError.value = ''

  try {
    const sid = String(currentStudent.id || currentStudent.uid || '')
    if (type === 'edit') {
      await userService.updateStudent(sid, formData)
      globalSuccess.value = 'Student profile updated!'
    } else if (type === 'override') {
      // 1. Update student level override
      await userService.updateStudent(sid, {
        status: formData.status,
        overrideReason: formData.overrideReason,
        overrideRemark: formData.overrideRemark,
      })

      // 2. Cascade: Update all "Studying" enrollments with same status/reason
      const activeEnrollments = enrollments.value.filter((r) => {
        const status = getAcademicStatus(r)
        return status === 'Studying'
      })

      if (activeEnrollments.length > 0) {
        await Promise.all(
          activeEnrollments.map((enrollment) =>
            enrollmentService.updateEnrollment(enrollment.id, {
              status: formData.status,
              overrideReason: formData.overrideReason,
              overrideRemark: formData.overrideRemark,
              academicStatus: formData.status, // Explicitly set display status
            }),
          ),
        )
      }

      globalSuccess.value = `Student and ${activeEnrollments.length} active programs updated!`
    } else if (type === 'enrollment-override' && actionModal.value.enrollment) {
      const eid = actionModal.value.enrollment.id
      await enrollmentService.updateEnrollment(eid, {
        status: formData.status,
        overrideReason: formData.overrideReason,
        overrideRemark: formData.overrideRemark,
        academicStatus: formData.status,
      })
      globalSuccess.value = 'Course status updated!'
    } else if (type === 'enrollment-delete' && actionModal.value.enrollment) {
      if (formData.deleteConfirm !== 'DELETE') throw new Error('Please type DELETE to confirm.')
      await enrollmentService.deleteEnrollment(actionModal.value.enrollment.id)
      globalSuccess.value = 'Academic record deleted permanently!'
    } else if (type === 'delete') {
      if (formData.deleteConfirm !== 'DELETE') throw new Error('Please type DELETE to confirm.')
      await userService.deleteStudent(sid)
      router.push('/students')
      return
    }

    await fetchData(sid)
    setTimeout(() => {
      actionModal.value.isOpen = false
      globalSuccess.value = ''
    }, 1500)
  } catch (err) {
    globalError.value = err.message || 'Action failed'
  } finally {
    submitting.value = false
  }
}

// Reset filter when navigating tabs
watch(activeTab, () => {
  currentFilter.value = 'all'
  searchQuery.value = ''
})

// Dynamic filter options based on tab
const filterOptions = computed(() => {
  if (activeTab.value === 'academic') {
    return [
      { label: 'All Status', value: 'all' },
      { label: 'Studying', value: 'Studying' },
      { label: 'Graduated', value: 'Graduated' },
      { label: 'Suspended', value: 'Suspended' },
      { label: 'Stopped', value: 'Stopped' },
    ]
  }
  if (activeTab.value === 'attendance') {
    return [
      { label: 'All Status', value: 'all' },
      { label: 'Present', value: 'Present' },
      { label: 'Late', value: 'Late' },
      { label: 'Permission', value: 'Permission' },
      { label: 'Absent', value: 'Absent' },
      { label: 'Make-up', value: 'Make-up' },
    ]
  }
  if (activeTab.value === 'behavior' || activeTab.value === 'exam') {
    return [
      { label: 'All Status', value: 'all' },
      { label: 'Excellent', value: 'Excellent' },
      { label: 'Good/Fair', value: 'Good/Fair' },
      { label: 'Warning', value: 'Warning' },
      { label: 'Serious', value: 'Serious' },
    ]
  }
  return [{ label: 'All', value: 'all' }]
})

const getAcademicStatus = (r) => {
  if (r.academicStatus) return r.academicStatus

  const regStatus = (r.status || '').toLowerCase()
  const now = new Date()
  const endDate = r.endDate ? new Date(r.endDate) : null

  if (isEnrollmentActive(r)) return 'Studying'

  // If paid but cancelled, set it as stopped
  if (['cancelled', 'canceled'].includes(regStatus)) return 'Stopped'

  // If they stopped studying during the term (manual flag or specific status)
  if (regStatus === 'suspended') return 'Suspended'

  // If they passed the end date of the term, set graduate
  // We check if it was ever active/paid before marking as graduated
  const payStatus = (r.paymentStatus || '').toLowerCase()
  const isPaid =
    ['confirmed', 'paid', 'active', 'success'].includes(regStatus) || payStatus === 'paid'

  if (isPaid && endDate && now > endDate) return 'Graduated'

  // If not studying, and not graduated, it's either stopped (cancelled) or pending
  return 'Inactive'
}

const filteredAcademic = computed(() => {
  // 1. Filter: If student enrollment is not paid yet, do not show in their academic list.
  let filtered = enrollments.value.filter((r) => {
    const regStatus = (r.status || '').toLowerCase()
    return !['unpaid', 'pending'].includes(regStatus)
  })

  // 2. Map: Apply status logic
  let list = filtered.map((r, idx) => {
    let st = ''

    if (activeTab.value === 'academic') {
      st = getAcademicStatus(r)
    } else if (activeTab.value === 'attendance') {
      st = ['Present', 'Late', 'Permission', 'Absent', 'Make-up'][idx % 5]
    } else if (activeTab.value === 'behavior' || activeTab.value === 'exam') {
      st = ['Excellent', 'Good/Fair', 'Warning', 'Serious', 'Serious'][idx % 5]
    }

    return { ...r, displayStatus: st }
  })

  if (currentFilter.value !== 'all') {
    list = list.filter(
      (r) => (r.displayStatus || '').toLowerCase() === currentFilter.value.toLowerCase(),
    )
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (r) =>
        (r.course_id && r.course_id.toLowerCase().includes(q)) ||
        (r.courseTitle && r.courseTitle.toLowerCase().includes(q)),
    )
  }

  // Sort prioritize studying (active) over others, then by date descending
  list.sort((a, b) => {
    // Check if actively studying
    const aIsActive = a.displayStatus === 'Studying' ? 1 : 0
    const bIsActive = b.displayStatus === 'Studying' ? 1 : 0
    if (aIsActive !== bIsActive) return bIsActive - aIsActive

    // Sort by recent date
    const aDate = new Date(a.enrollAt || a.createdAt || a.timestamp || 0).getTime()
    const bDate = new Date(b.enrollAt || b.createdAt || b.timestamp || 0).getTime()
    return bDate - aDate
  })

  return list
})

const fetchData = async (id) => {
  try {
    loading.value = true
    errorMessage.value = ''

    // 1. Fetch Student Profile
    const studentData = await userService.getStudent(id)
    if (!studentData) throw new Error('Student not found')
    student.value = studentData

    // 2. Fetch associated Parent profile if reference exists
    const parentId = studentData.parentId || studentData.parent_id
    if (parentId) {
      try {
        const pData = await userService.getProfile(parentId)
        parent.value = pData
      } catch (e) {
        console.warn('Could not fetch parent context silently', e)
      }
    }

    // 3. Fetch Enrollments
    const allEnrollments = (await enrollmentService.getAll()) || []
    enrollments.value = allEnrollments.filter((r) => {
      const sId = String(r.student_id || r.studentId || '')
      return sId === String(id)
    })
  } catch (error) {
    console.error('Failed to load student details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.params.id) fetchData(route.params.id)
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) fetchData(newId)
  },
)
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/students"
      title="Student Details"
    >
      <template #header-actions v-if="student">
        <div class="actions-wrapper">
          <button class="btn-icon edit" title="Edit Profile" @click="openActionModal('edit')">
            ✏️
          </button>
          <button
            class="btn-icon cancel"
            title="Override Status"
            @click="openActionModal('override')"
          >
            ⏸️
          </button>
          <button class="btn-icon delete" title="Delete Student" @click="openActionModal('delete')">
            🗑️
          </button>
        </div>
      </template>

      <template #left-content>
        <!-- Custom Tab Navigation -->
        <div class="tabs-navigation-wrapper">
          <div class="tabs-navigation">
            <AppButton
              variant="ghost"
              :class="{ active: activeTab === 'academic' }"
              @click="activeTab = 'academic'"
            >
              Academic History
            </AppButton>
            <AppButton
              variant="ghost"
              :class="{ active: activeTab === 'attendance' }"
              @click="activeTab = 'attendance'"
            >
              Attendance Record
            </AppButton>
            <AppButton
              variant="ghost"
              :class="{ active: activeTab === 'behavior' }"
              @click="activeTab = 'behavior'"
            >
              Behavior Record
            </AppButton>
            <AppButton
              variant="ghost"
              :class="{ active: activeTab === 'exam' }"
              @click="activeTab = 'exam'"
            >
              Exam Record
            </AppButton>
          </div>

          <div class="global-filter">
            <TableToolbar
              :hasSearch="false"
              :hasFilter="true"
              :currentFilter="currentFilter"
              @update:currentFilter="currentFilter = $event"
              :filterOptions="filterOptions"
            />
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content-container">
          <!-- Academic History Tab -->
          <div v-if="activeTab === 'academic'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Academic History List</h3>
            </div>

            <div class="table-container">
              <table v-if="filteredAcademic.length > 0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Course</th>
                    <th>Session</th>
                    <th>Enrollment Date</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredAcademic" :key="item.id || idx">
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <strong>{{ item.courseTitle || item.course_id || '-' }}</strong>
                    </td>
                    <td>{{ item.sessionSchedule || item.session_id || '-' }}</td>
                    <td>
                      {{ item.createdAt ? formatDate(item.createdAt) : '-' }}
                    </td>
                    <td>{{ formatDate(item.startDate) }}</td>
                    <td>{{ formatDate(item.endDate) }}</td>
                    <td><StatusBadge :status="item.displayStatus" /></td>
                    <td>
                      <button
                        v-if="
                          item.displayStatus !== 'Suspended' && item.displayStatus !== 'Stopped'
                        "
                        class="btn-icon override"
                        title="Override Course Status"
                        @click="openActionModal('enrollment-override', item)"
                      >
                        ⏸️
                      </button>
                      <button
                        class="btn-icon delete"
                        title="Delete Enrollment Record"
                        @click="openActionModal('enrollment-delete', item)"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No academic history records found.</p>
              </div>
            </div>
          </div>

          <!-- Attendance Record Tab -->
          <div v-if="activeTab === 'attendance'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Attendance Record List</h3>
            </div>
            <div class="table-container">
              <table v-if="filteredAcademic.length > 0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Marked By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredAcademic" :key="item.id || idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ item.sessionSchedule || item.session_id || '-' }}</td>
                    <td>
                      {{ item.attendanceDate ? formatDate(item.attendanceDate) : '-' }}
                    </td>
                    <td>{{ item.markedBy || '-' }}</td>
                    <td>
                      <StatusBadge :status="item.displayStatus" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No attendance records found.</p>
              </div>
            </div>
          </div>

          <!-- Behavior Record Tab -->
          <div v-if="activeTab === 'behavior'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Behavior Record List</h3>
            </div>
            <div class="table-container">
              <table v-if="filteredAcademic.length > 0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Marked By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredAcademic" :key="item.id || idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ item.sessionSchedule || item.session_id || '-' }}</td>
                    <td>
                      {{ item.behaviorDate ? formatDate(item.behaviorDate) : '-' }}
                    </td>
                    <td>{{ item.markedBy || '-' }}</td>
                    <td>
                      <StatusBadge :status="item.displayStatus" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No behavior records found.</p>
              </div>
            </div>
          </div>

          <!-- Exam Record Tab -->
          <div v-if="activeTab === 'exam'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Exam Record List</h3>
            </div>
            <div class="table-container">
              <table v-if="filteredAcademic.length > 0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Session</th>
                    <th>Exam Date</th>
                    <th>Examiner</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredAcademic" :key="item.id || idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ item.sessionSchedule || item.session_id || '-' }}</td>
                    <td>
                      {{ item.examDate ? formatDate(item.examDate) : '-' }}
                    </td>
                    <td>{{ item.examiner || '-' }}</td>
                    <td>{{ item.score || '-' }}</td>
                    <td>
                      <StatusBadge :status="item.displayStatus" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No exam records found.</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #right-content v-if="student">
        <DetailedSummaryCard title="Basic Information" subtitle="Student Information">
          <template #outside>
            <div class="profile-header">
              <div class="profile-preview">
                <img :src="student?.profileURL || getImageUrl('profiles', 'child-profile.png')" alt="Student Profile" />
              </div>
            </div>
          </template>

          <div class="detail-info-group">
            <div class="info-item vertical">
              <span>FULLNAME:</span>
              <strong>{{
                student?.name || student?.fullName || student?.fullname || 'Unknown'
              }}</strong>
            </div>

            <div class="info-item vertical">
              <span>DATE OF BIRTH:</span>
              <strong>{{ formatDateOnly(student?.dob || student?.DoB) || '-' }}</strong>
            </div>

            <div class="info-item vertical">
              <span>MEDICAL NOTE:</span>
              <strong>{{ student?.medicalNote || student?.medical_note || 'None' }}</strong>
            </div>

            <div class="info-item status-inline">
              <span>STATUS:</span>
              <StatusBadge :status="computedStatus" />
            </div>

            <div class="info-item vertical" v-if="student?.overrideReason">
              <span>OVERRIDE REASON:</span>
              <strong style="color: #ef4444">{{ student?.overrideReason }}</strong>
            </div>

            <div class="info-item vertical" v-if="student?.overrideRemark">
              <span>OVERRIDE REMARK:</span>
              <strong>{{ student?.overrideRemark }}</strong>
            </div>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Relationships">
          <div class="relationships-list">
            <!-- Primary Parent Block -->
            <div class="relationship-category">
              <span class="category-title">Parent</span>
              <div class="relationship-item" v-if="primaryParent">
                <img
                  :src="primaryParent.profileURL || getImageUrl('profiles', 'female-profile-parent.jpg')"
                  alt="Parent Avatar"
                  class="small-avatar"
                />
                <div class="child-info">
                  <strong>{{
                    primaryParent.name ||
                    primaryParent.fullname ||
                    primaryParent.email ||
                    'Parent Name'
                  }}</strong>
                </div>
              </div>
              <div v-else class="empty-relation-box">
                <!-- <p>No parent mapped.</p> -->
              </div>
            </div>

            <!-- Secondary Guardian Block -->
            <div class="relationship-category" style="margin-top: 5px">
              <span class="category-title">Guardian</span>
              <div class="relationship-item" v-if="primaryGuardian">
                <img
                  :src="primaryGuardian.profileURL || getImageUrl('profiles', 'female-profile-parent.jpg')"
                  alt="Guardian Avatar"
                  class="small-avatar"
                />
                <div class="child-info">
                  <strong>{{
                    primaryGuardian.name ||
                    primaryGuardian.fullname ||
                    primaryGuardian.email ||
                    'Guardian Name'
                  }}</strong>
                </div>
              </div>
              <div v-else class="empty-relation-box">
                <!-- <p>No guardian mapped.</p> -->
              </div>
            </div>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="History Timestamp">
          <div class="timestamp-group">
            <div class="timestamp-item">
              <StatusBadge status="Joined At" />
              <p>{{ formatDate(student?.createdAt || student?.created_at) }}</p>
            </div>
            <div class="timestamp-item">
              <StatusBadge status="Update At" />
              <p>
                {{
                  formatDate(
                    student?.updatedAt ||
                      student?.updated_at ||
                      student?.createdAt ||
                      new Date().toISOString(),
                  )
                }}
              </p>
            </div>
          </div>
        </DetailedSummaryCard>
      </template>
    </DetailPageLayout>

    <StudentActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :student="actionModal.student"
      :enrollment="actionModal.enrollment"
      :loading="submitting"
      :error="globalError"
      :success="globalSuccess"
      @close="actionModal.isOpen = false"
      @submit="submitActionModal"
    />
  </DashboardLayout>
</template>

<style scoped>
/* Override grid layout from DetailPageLayout if needed to fill space */
:deep(.main-cards-grid) {
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
}

/* Tab Navigation */
.tabs-navigation-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
}

.tabs-navigation {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  width: fit-content;
}

.tabs-navigation .app-btn {
  color: #64748b;
  font-weight: 600;
  border-radius: 12px;
}

.tabs-navigation .app-btn:hover {
  background: #f1f5f9;
}

.tabs-navigation .app-btn.active {
  background: #00aeef;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 174, 239, 0.25);
}

.tab-content-container {
  min-height: 400px;
}

.detail-section-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.04);
}

.section-header {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
}

/* Tables */
.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 16px 12px;
  border-bottom: 2px solid #f8fafc;
}

td {
  padding: 16px 12px;
  font-size: 0.9rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

tr:last-child td {
  border-bottom: none;
}

td strong {
  color: #1a1a1a;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
}

.actions-wrapper {
  display: flex;
  gap: 8px;
}

/* Summary Card Matching Styles */
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
  text-align: center;
  gap: 5px;
}

.profile-preview {
  display: flex;
  justify-content: center;
}

.profile-preview img {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
}

.detail-info-group {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.info-item {
  display: flex;
  font-size: 0.95rem;
}

.info-item.vertical {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.info-item.vertical span {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
}

.info-item.vertical strong {
  color: #1e293b;
  font-size: 1.05rem;
}

.status-inline {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 5px;
}

.status-inline > span:first-child {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.relationship-category {
  display: flex;
  flex-direction: column;
}

.category-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
  display: block;
}

.relationship-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.relationship-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.small-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.child-info {
  display: flex;
  flex-direction: column;
}

.child-info strong {
  font-size: 1rem;
  color: #0f172a;
}

.empty-relation {
  color: #94a3b8;
  font-size: 0.95rem;
  font-style: italic;
  text-align: center;
  margin-top: 10px;
}

.empty-relation-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: transparent;
  border-radius: 12px;
  height: 60px;
}

.empty-relation-box p {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

.timestamp-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timestamp-item p {
  margin-top: 8px;
  font-size: 0.95rem;
  color: #4a5568;
  font-weight: 500;
}
</style>
