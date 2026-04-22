const { onRequest } = require('firebase-functions/v2/https')
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
const branchRoutes = require('./src/routes/branches')
const classRoutes = require('./src/routes/classes')
const trialRoutes = require('./src/routes/trials')

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
apiRouter.use('/branches', branchRoutes)
apiRouter.use('/classes', classRoutes)
apiRouter.use('/trials', trialRoutes)

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
