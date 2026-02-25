<script setup>
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'
import { registrationService } from '../services/registrationService'
import { storageService } from '../services/storageService'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const user = ref(null)
const userProfile = ref(null)
const students = ref([])
const courses = ref([])
const sessions = ref([])
const selectedCourse = ref(null)
const loading = ref(true)

// Form Data - Add Student
const showAddStudent = ref(false)
const newStudent = ref({
  fullname: '',
  dob: '',
  medical_note: '',
})

// Enrollment Data
const showEnrollModal = ref(false)
const selectedSession = ref(null)
const selectedStudentId = ref('')

// Profile Image
const isUploading = ref(false)

onMounted(async () => {
  const currentUser = authService.getCurrentUser()
  if (currentUser) {
    user.value = currentUser
    await Promise.all([fetchUserProfile(currentUser.uid), fetchStudents(), fetchCourses()])
  } else {
    router.push('/')
  }
  loading.value = false
})

const fetchUserProfile = async (uid) => {
  try {
    const profile = await userService.getProfile(uid)
    userProfile.value = profile
  } catch (error) {
    console.error('Failed to fetch user profile', error)
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploading.value = true
  try {
    const url = await storageService.uploadProfileImage(user.value.uid, file)

    // Update Frontend State
    if (!userProfile.value) userProfile.value = {}
    userProfile.value.profileURL = url

    // Update Backend
    await userService.registerParentAccount({
      uid: user.value.uid,
      email: user.value.email,
      profileURL: url,
    })

    alert('Profile image updated!')
  } catch (error) {
    console.error('Upload failed', error)
    alert(error.message)
  } finally {
    isUploading.value = false
  }
}

const fetchStudents = async () => {
  try {
    students.value = await userService.getStudents(user.value.uid)
  } catch (error) {
    console.error('Failed to fetch students', error)
  }
}

const fetchCourses = async () => {
  try {
    courses.value = await courseService.getAllCourses()
  } catch (error) {
    console.error('Failed to fetch courses', error)
  }
}

const handleCourseSelect = async (course) => {
  selectedCourse.value = course
  try {
    sessions.value = await courseService.getSessions(course.id)
  } catch (error) {
    console.error('Failed to fetch sessions', error)
    sessions.value = []
  }
}

const openEnrollModal = (session) => {
  selectedSession.value = session
  showEnrollModal.value = true
  // Default to first student if available
  if (students.value.length > 0) {
    selectedStudentId.value = students.value[0].id
  }
}

const handleEnroll = async () => {
  if (!selectedStudentId.value) {
    alert('Please select a child to enroll')
    return
  }

  try {
    await registrationService.create({
      studentID: selectedStudentId.value,
      courseID: selectedCourse.value.id,
      sessionID: selectedSession.value.id,
    })
    alert('Enrollment Successful!')
    showEnrollModal.value = false
    // Could refresh session capacity here if needed
  } catch (error) {
    console.error('Enrollment failed', error)
    alert(error.message || 'Enrollment failed')
  }
}

const handleAddStudent = async () => {
  if (!newStudent.value.fullname || !newStudent.value.dob) {
    alert('Please fill in Full Name and Date of Birth')
    return
  }

  try {
    await userService.addStudent(user.value.uid, newStudent.value)
    alert('Child added successfully!')
    showAddStudent.value = false
    newStudent.value = { fullname: '', dob: '', medical_note: '' }
    await fetchStudents()
  } catch (error) {
    console.error('Failed to add student', error)
    alert('Failed to add student')
  }
}

const handleLogout = async () => {
  await authService.logout()
  router.push('/')
}
</script>

<template>
  <div class="dashboard">
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div class="profile-header">
        <div class="profile-img-container">
          <img
            :src="userProfile?.profileURL || 'https://via.placeholder.com/100'"
            alt="Profile"
            class="profile-img"
          />
          <label for="file-upload" class="upload-icon"> 📷 </label>
          <input
            id="file-upload"
            type="file"
            @change="handleFileUpload"
            accept="image/*"
            style="display: none"
          />
        </div>
        <h2>Welcome, {{ user?.email }}!</h2>
        <span v-if="isUploading">Uploading...</span>
      </div>

      <div class="container">
        <!-- Left Column: Children -->
        <div class="column">
          <div class="section">
            <h3>My Children</h3>
            <ul v-if="students.length > 0" class="student-list">
              <li v-for="student in students" :key="student.id">
                <strong>{{ student.fullname }}</strong> (Born: {{ student.DoB }})
              </li>
            </ul>
            <p v-else>No children added yet.</p>

            <button v-if="!showAddStudent" @click="showAddStudent = true" class="add-btn">
              + Add Child
            </button>

            <div v-if="showAddStudent" class="add-student-form">
              <h4>Add New Child</h4>
              <input v-model="newStudent.fullname" placeholder="Full Name" required />
              <label>Date of Birth:</label>
              <input v-model="newStudent.dob" type="date" required />
              <input v-model="newStudent.medical_note" placeholder="Medical Note (Optional)" />
              <div class="form-actions">
                <button @click="handleAddStudent" class="save-btn">Save</button>
                <button @click="showAddStudent = false" class="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Courses -->
        <div class="column">
          <div class="section">
            <h3>Available Courses</h3>
            <ul v-if="courses.length > 0" class="course-list">
              <li
                v-for="course in courses"
                :key="course.id"
                @click="handleCourseSelect(course)"
                :class="{ active: selectedCourse?.id === course.id }"
              >
                <strong>{{ course.title }}</strong> - ${{ course.price }}
                <div class="detail">{{ course.description }}</div>
              </li>
            </ul>
            <p v-else>No courses available.</p>
          </div>

          <div v-if="selectedCourse" class="section sessions-section">
            <h3>Sessions for {{ selectedCourse.title }}</h3>
            <div v-if="sessions.length > 0">
              <div v-for="session in sessions" :key="session.id" class="session-card">
                <div>
                  <strong>Days:</strong> {{ session.schedule?.day }}<br />
                  <strong>Time:</strong> {{ session.schedule?.timeslot }}<br />
                  <small>{{ session.num_student }} / {{ session.capacity }} Enrolled</small>
                </div>
                <button
                  @click="openEnrollModal(session)"
                  :disabled="session.num_student >= session.capacity"
                  class="enroll-btn"
                >
                  {{ session.num_student >= session.capacity ? 'Full' : 'Enroll' }}
                </button>
              </div>
            </div>
            <p v-else>No sessions scheduled for this course.</p>
          </div>
        </div>
      </div>

      <!-- Enrollment Modal -->
      <div v-if="showEnrollModal" class="modal-overlay">
        <div class="modal">
          <h3>Enroll in {{ selectedCourse.title }}</h3>
          <p>
            For session: {{ selectedSession.schedule?.day }} at
            {{ selectedSession.schedule?.timeslot }}
          </p>

          <label>Select Child:</label>
          <select v-model="selectedStudentId">
            <option v-for="student in students" :value="student.id" :key="student.id">
              {{ student.fullname }}
            </option>
          </select>

          <div class="modal-actions">
            <button @click="handleEnroll" class="save-btn">Confirm Enrollment</button>
            <button @click="showEnrollModal = false" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>

      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
}

/* Profile Header */
.profile-header {
  margin-bottom: 30px;
}
.profile-img-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 10px;
}
.profile-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
.upload-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #fff;
  border-radius: 50%;
  padding: 5px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  font-size: 1.2em;
}

.container {
  display: flex;
  gap: 20px;
}
.column {
  flex: 1;
}

/* Sections */
.section {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  text-align: left;
}

/* Lists */
.student-list,
.course-list {
  list-style: none;
  padding: 0;
}
.student-list li,
.course-list li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.course-list li.active {
  /** Highlight selected course */
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}
.detail {
  font-size: 0.9em;
  color: #666;
}

/* Forms */
.add-student-form {
  background: #f9f9f9;
  padding: 15px;
  margin-top: 15px;
  border-radius: 8px;
}
.add-student-form input,
select {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  box-sizing: border-box;
}

/* Buttons */
.add-btn,
.enroll-btn {
  background-color: #2196f3;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.save-btn {
  background-color: #4caf50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}
.cancel-btn {
  background-color: #9e9e9e;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.logout-btn {
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 20px;
}

/* Session Cards */
.session-card {
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  text-align: left;
}
.modal-actions {
  margin-top: 15px;
  text-align: right;
}
</style>
