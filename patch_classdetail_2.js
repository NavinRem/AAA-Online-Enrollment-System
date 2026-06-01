const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'frontend/src/views/ClassDetail.vue')
let content = fs.readFileSync(file, 'utf8')

// Add utility functions for disable logic
content = content.replace(
  /const updateAttendanceStatus = async \(sessionId, studentId, status\) => {/,
  `const isSessionDisabled = (sessionDate, enrollAt) => {
  const sDate = new Date(sessionDate).setHours(0,0,0,0)
  const eDate = enrollAt ? new Date(enrollAt).setHours(0,0,0,0) : 0
  const now = new Date().setHours(0,0,0,0)
  return sDate > now || (eDate && sDate < eDate)
}

const getSessionDisableReason = (sessionDate, enrollAt) => {
  const sDate = new Date(sessionDate).setHours(0,0,0,0)
  const eDate = enrollAt ? new Date(enrollAt).setHours(0,0,0,0) : 0
  const now = new Date().setHours(0,0,0,0)
  if (sDate > now) return "Session is in the future"
  if (eDate && sDate < eDate) return "Student enrolled after this session"
  return ""
}

const toggleEnrollmentField = async (enrollmentId, field) => {
  try {
    const item = filteredEnrollments.value.find((e) => e.id === enrollmentId)
    if (!item) return
    const newValue = !item[field]
    item[field] = newValue
    await enrollmentService.updateEnrollment(enrollmentId, { [field]: newValue })
  } catch (error) {
    console.error('Failed to update field:', error)
  }
}

const updateAttendanceStatus = async (sessionId, studentId, status) => {`
)

// Update attendance cell logic
content = content.replace(
  /:class="\[\s*ATTENDANCE_STATUS\[getAttendanceStatus\(session\.id, item\.studentId\)\]\?\.theme \|\|\s*ATTENDANCE_STATUS\.N\.theme,\s*session\.date > new Date\(\)\s*\?\s*'opacity-20 grayscale cursor-not-allowed'\s*:\s*'cursor-pointer hover:shadow-md',\s*\]"\s*@click="session\.date <= new Date\(\) \? toggleAttendanceDropdown\(session\.id, item\.studentId\) : null"/s,
  `:class="[
                        ATTENDANCE_STATUS[getAttendanceStatus(session.id, item.studentId)]?.theme ||
                          ATTENDANCE_STATUS.N.theme,
                        isSessionDisabled(session.date, item.enrollAt)
                          ? 'opacity-20 grayscale cursor-not-allowed'
                          : 'cursor-pointer hover:shadow-md',
                      ]"
                      :title="getSessionDisableReason(session.date, item.enrollAt)"
                      @click="!isSessionDisabled(session.date, item.enrollAt) ? toggleAttendanceDropdown(session.id, item.studentId) : null"`
)

// Update special columns
content = content.replace(
  /<!-- Special Columns -->.*?<\/td>/s,
  `<!-- Special Columns -->
              <td class="ui-cell text-center">
                <button
                  @click="toggleEnrollmentField(item.id, 'hasPassedExam')"
                  class="w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors border"
                  :class="item.hasPassedExam ? 'bg-green-100 border-green-500 text-green-600' : 'bg-surface-subtle border-outline-std text-content-muted hover:bg-gray-100'"
                  title="Mark Exam Passed"
                >
                  <CheckCircle2 v-if="item.hasPassedExam" class="w-4 h-4" />
                </button>
              </td>
              <td class="ui-cell text-center">
                <button
                  @click="toggleEnrollmentField(item.id, 'hasReceivedReportCard')"
                  class="w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors border"
                  :class="item.hasReceivedReportCard ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-surface-subtle border-outline-std text-content-muted hover:bg-gray-100'"
                  title="Mark Report Card Sent"
                >
                  <CheckCircle2 v-if="item.hasReceivedReportCard" class="w-4 h-4" />
                </button>
              </td>
              <td class="ui-cell text-center">
                <button
                  @click="toggleEnrollmentField(item.id, 'hasReceivedCertificate')"
                  class="w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors border"
                  :class="item.hasReceivedCertificate ? 'bg-purple-100 border-purple-500 text-purple-600' : 'bg-surface-subtle border-outline-std text-content-muted hover:bg-gray-100'"
                  title="Mark Certificate Issued"
                >
                  <CheckCircle2 v-if="item.hasReceivedCertificate" class="w-4 h-4" />
                </button>
              </td>
              <td class="ui-cell">
                <span class="text-xs text-content-muted">{{ item.remark || '-' }}</span>
              </td>`
)

fs.writeFileSync(file, content)
