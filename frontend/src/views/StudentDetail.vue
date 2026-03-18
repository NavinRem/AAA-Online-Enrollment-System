<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import DetailedSummaryCard from '@/components/common/cards/DetailedSummaryCard.vue'
import { userService } from '@/services/userService'
import { enrollmentService } from '@/services/enrollmentService'
import { trackingService } from '@/services/trackingService'
import { formatDate, formatDateOnly } from '@/utils/dateFormatter'
import { calculateStudentStatus } from '@/utils/studentStatusHelper'
import { filterDetailEnrollments, getAcademicStatus } from '@/utils/enrollmentHelper'
import StudentActionModal from '@/components/students/StudentActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

import { getImageUrl } from '@/utils/assetHelper'

const route = useRoute()
const router = useRouter()

const student = ref(null)
const parent = ref(null)
const enrollments = ref([])
const attendanceHistory = ref([])
const progressData = ref(null)

const computedStatus = computed(() => {
  if (!student.value) return 'Inactive'
  return calculateStudentStatus(student.value, enrollments.value)
})

const primaryParent = computed(() => {
  const role = String(parent.value?.role || '').toLowerCase()
  return role.includes('parent') ? parent.value : null
})

const primaryGuardian = computed(() => {
  const role = String(parent.value?.role || '').toLowerCase()
  return role.includes('guardian') ? parent.value : null
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

const filteredAcademic = computed(() => {
  const result = filterDetailEnrollments(enrollments.value, {
    academicStatus: currentFilter.value === 'all' ? null : currentFilter.value
  })

  return result
    .filter(r => searchQuery.value ? (r.courseTitle || '').toLowerCase().includes(searchQuery.value.toLowerCase()) : true)
    .sort((a, b) => {
      const aAct = getAcademicStatus(a) === 'Studying' ? 1 : 0
      const bAct = getAcademicStatus(b) === 'Studying' ? 1 : 0
      if (aAct !== bAct) return bAct - aAct
      return new Date(b.enrollAt || b.createdAt) - new Date(a.enrollAt || a.createdAt)
    })
})

const studentStats = computed(() => {
  // 1. Academic History: Number of confirmed enrollments
  const academicCount = enrollments.value.length

  // 2. Attendance Rate: Based on 'present' status in history
  let attendanceRate = '0%'
  if (attendanceHistory.value.length > 0) {
    const presentCount = attendanceHistory.value.filter(a => (a.status || '').toLowerCase() === 'present').length
    attendanceRate = Math.round((presentCount / attendanceHistory.value.length) * 100) + '%'
  }

  // 3. Behavior Standing: From progress data or default
  const behaviorStanding = progressData.value?.overallProgress || 'Good'

  // 4. Exam Average: Find highest score from enrollments or default
  const examAverage = enrollments.value.reduce((max, e) => {
    const score = parseInt(e.score || 0)
    return score > max ? score : max
  }, 0) || '-'

  return [
    {
      label: 'Academic History',
      value: academicCount,
      image: getImageUrl('classes/card-robotic'),
      color: '#e0f2fe'
    },
    {
      label: 'Attendance',
      value: attendanceRate,
      image: getImageUrl('programs/program'),
      color: '#f0fdf4'
    },
    {
      label: 'Behavior Standing',
      value: behaviorStanding,
      image: getImageUrl('profiles/avatar-student'),
      color: '#fff7ed'
    },
    {
      label: 'Exam Average',
      value: examAverage,
      image: getImageUrl('programs/program'),
      color: '#faf5ff'
    }
  ]
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
    const pId = studentData.parentId || studentData.parent_id
    console.log('Student Parent ID:', pId)
    if (pId) {
      try {
        const pData = await userService.getProfile(pId)
        console.log('Fetched Parent Data:', pData)
        parent.value = pData
      } catch (e) {
        console.warn('Could not fetch parent context silently', e)
      }
    }

    // 3. Fetch Enrollments
    const allEnrollments = (await enrollmentService.getAllEnrollments()) || []
    enrollments.value = allEnrollments.filter((r) => {
      const sId = String(r.student_id || r.studentId || '')
      return sId === String(id)
    })

    // 4. Fetch Attendance & Progress
    try {
      const [attendance, progress] = await Promise.all([
        trackingService.getAttendanceHistory(id),
        trackingService.getStudentProgress(id)
      ])
      attendanceHistory.value = attendance || []
      progressData.value = progress || null
    } catch (e) {
      console.warn('Could not fetch tracking data silently', e)
    }
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

      <template #left-content v-if="student">
        <!-- Student Quick Stats Row -->
        <div class="metrics-row">
          <DataMetricCard
            v-for="stat in studentStats"
            :key="stat.label"
            :label="stat.label"
            :value="stat.value"
            :image="stat.image"
            :color="stat.color"
          />
        </div>

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
                    <td><StatusBadge :status="getAcademicStatus(item)" /></td>
                    <td>
                      <button
                        v-if="
                          getAcademicStatus(item) !== 'Suspended' && getAcademicStatus(item) !== 'Stopped'
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
                      <StatusBadge :status="getAcademicStatus(item)" />
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
                <img :src="student?.profileURL || getImageUrl('profiles/avatar-student')" alt="Student Profile" />
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
                  :src="primaryParent.profileURL"
                  alt="Parent Avatar"
                  class="small-avatar"
                />
                <div class="child-info">
                  <strong>{{
                    primaryParent.name ||
                    primaryParent.fullName ||
                    primaryParent.fullname ||
                    primaryParent.displayName ||
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
                  :src="primaryGuardian.profileURL || getImageUrl('profiles/avatar-guardian')"
                  alt="Guardian Avatar"
                  class="small-avatar"
                />
                <div class="child-info">
                  <strong>{{
                    primaryGuardian.name ||
                    primaryGuardian.fullName ||
                    primaryGuardian.fullname ||
                    primaryGuardian.displayName ||
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
@import '@/assets/styles/detail-view.css';

/* Student-specific sidebar tweaks if any */
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
</style>
