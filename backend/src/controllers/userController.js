const userService = require('../services/userService')
const studentService = require('../services/studentService')
const { db, COLLECTIONS } = require('../config/database')

/**
 * @route POST /users/registerAccount
 * @description Create or update a parent account
 */
exports.registerParentAccount = async (req, res) => {
  try {
    const result = await userService.registerParentAccount(req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route POST /users/registerStaffAccount
 * @description Create a staff account (Admin/Teacher)
 */
exports.registerStaffAccount = async (req, res) => {
  try {
    const result = await userService.registerAdminAccount(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /users
 * @description Get all users from the unified 'users' collection
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers()
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /users/:uid
 * @description Get a single user by ID
 */
exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUser(req.params.uid)
    res.status(200).json(user)
  } catch (error) {
    if (error.message.includes('not found'))
      return res.status(404).json({ error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /users/:uid/role
 * @description Get user role strictly from Auth or Firestore
 */
exports.getUserRole = async (req, res) => {
  try {
    const roleData = await userService.getUserRole(req.params.uid)
    res.status(200).json(roleData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route POST /users/:uid/registerStudentProfile
 * @description Add a student to a parent's account
 */
exports.registerStudentProfile = async (req, res) => {
  try {
    const result = await studentService.createStudent({
      ...req.body,
      parentId: req.params.uid,
    })
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route PUT /students/:id/medical
 * @description Update medical info for a student
 */
exports.updateMedicalInfo = async (req, res) => {
  try {
    const result = await studentService.updateStudent(req.params.id, {
      medicalNote: req.body.medicalNote || 'None',
    })
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /users/:uid/students
 * @description Get all students for a parent
 */
exports.getStudentsByParentID = async (req, res) => {
  try {
    const students = await studentService.getStudentsByParentID(req.params.uid)
    res.status(200).json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route PUT /users/:uid
 * @description Update user profile
 */
exports.updateUser = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.uid, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route DELETE /users/:uid
 * @description Delete user account
 */
exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.uid)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /users/allStudents
 * @description Admin: Get all students
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents()
    res.status(200).json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route POST /users/run-standardization
 * @description Simplified Trigger for Data Consolidation & Mirroring
 */
exports.runStandardization = async (req, res) => {
  try {
    console.log('🚀 Starting data standardization and mirroring...')

    const users = await userService.getAllUsers()
    let count = 0

    for (const user of users) {
      const collection =
        user.role === 'admin' ? COLLECTIONS.ADMIN : COLLECTIONS.PARENT
      await userService._syncUserMirrors(
        user.uid,
        db.collection(collection).doc(user.uid),
      )
      count++
    }

    res.status(200).json({
      message: 'Data standardization and mirroring completed successfully',
      stats: { totalProcessed: count },
    })
  } catch (err) {
    console.error('Standardization failed:', err)
    res.status(500).json({ error: err.message })
  }
}

/**
 * @route POST /users/:uid/reset-password
 * @description Admin-led manual password reset
 */
exports.resetPassword = async (req, res) => {
  try {
    const result = await userService.manualPasswordReset(req.params.uid)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
