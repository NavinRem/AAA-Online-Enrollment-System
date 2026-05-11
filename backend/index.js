const { onRequest } = require('firebase-functions/v2/https')
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const logger = require('firebase-functions/logger')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const app = express()
app.set('trust proxy', 1)

const { limiter } = require('./src/config/limiters')

const enrollmentRoutes = require('./src/routes/enrollments')
const paymentRoutes = require('./src/routes/payments')

const studentRoutes = require('./src/routes/students')
const parentRoutes = require('./src/routes/parents')
const authRoutes = require('./src/routes/auth')
const adminRoutes = require('./src/routes/admins')
const teacherRoutes = require('./src/routes/teachers')

const programRoutes = require('./src/routes/programs')
const categoryRoutes = require('./src/routes/categories')
const levelRoutes = require('./src/routes/levels')
const termRoutes = require('./src/routes/terms')
const scheduleRoutes = require('./src/routes/schedules')
const branchRoutes = require('./src/routes/branches')
const classRoutes = require('./src/routes/classes')
const trialRoutes = require('./src/routes/trials')
const attendanceRoutes = require('./src/routes/attendance')

app.use(helmet())
app.use(cors({ origin: true }))
app.use(limiter)
app.use(express.json())

const apiRouter = express.Router()

apiRouter.use('/enrollments', enrollmentRoutes)
apiRouter.use('/payments', paymentRoutes)

apiRouter.use('/students', studentRoutes)
apiRouter.use('/parents', parentRoutes)
apiRouter.use('/auth', authRoutes)
apiRouter.use('/users', authRoutes)
apiRouter.use('/admins', adminRoutes)
apiRouter.use('/teachers', teacherRoutes)

apiRouter.use('/programs', programRoutes)
apiRouter.use('/categories', categoryRoutes)
apiRouter.use('/levels', levelRoutes)
apiRouter.use('/terms', termRoutes)
apiRouter.use('/schedules', scheduleRoutes)
apiRouter.use('/branches', branchRoutes)
apiRouter.use('/classes', classRoutes)
apiRouter.use('/trials', trialRoutes)
apiRouter.use('/attendance', attendanceRoutes)

app.use('/api', apiRouter)
app.use('/', apiRouter)

app.get('/', (req, res) => {
  res.send('Online Enrollment System API is running!')
})

app.use((req, res) => {
  logger.warn('404 Not Found:', {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
  })
  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    suggestion: 'Check your VITE_API_URL or endpoint paths.',
  })
})

app.use((err, req, res) => {
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    path: req.path,
  })
})

exports.api = onRequest(app)

// Automated Capacity Sync Trigger
// This ensures that whenever an enrollment is created, updated, or deleted,
// the corresponding class's currentCount is recalculated to maintain data integrity.
exports.onEnrollmentWrite = onDocumentWritten('enrollments/{enrollmentId}', async (event) => {
  const classIdBefore = event.data.before.data()?.classId
  const classIdAfter = event.data.after.data()?.classId
  
  const classService = require('./src/services/classService')
  
  const syncTasks = []
  if (classIdBefore) syncTasks.push(classService.syncStudentCount(classIdBefore))
  if (classIdAfter && classIdAfter !== classIdBefore) syncTasks.push(classService.syncStudentCount(classIdAfter))
  
  if (syncTasks.length > 0) {
    await Promise.all(syncTasks)
  }
})
