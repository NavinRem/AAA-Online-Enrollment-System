const authService = require('../services/authService')
const adminService = require('../services/adminService')
const parentService = require('../services/parentService')
const teacherService = require('../services/teacherService')
const studentService = require('../services/studentService')
const { db, COLLECTIONS } = require('../config/database')

/**
 * @route POST /users/registerAccount
 * @description Create or update a parent account
 */
exports.registerParentAccount = async (req, res) => {
  try {
    const result = await parentService.registerParent(req.body)
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
    const { role } = req.body
    let result
    if (role?.toLowerCase() === 'teacher') {
      result = await teacherService.registerTeacher(req.body)
    } else {
      result = await adminService.registerAdmin(req.body)
    }
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /users
 * @description Get all users across all roles (Admin, Parent, Teacher)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const [admins, parents, teachers] = await Promise.all([
      adminService.getAllAdmins(),
      parentService.getAllParents({ limit: 10 }),
      teacherService.getAllTeachers(),
    ])
    res.status(200).json([...admins, ...parents, ...teachers])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /users/allParents
 * @description Admin Only: Get all parent accounts
 */
exports.getAllParents = async (req, res) => {
  try {
    const parents = await parentService.getAllParents({ limit: 1000 })
    res.status(200).json(parents)
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
    const user = await authService.getUser(req.params.uid)
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
    const roleData = await authService.getUserRole(req.params.uid)
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
    const { uid: id } = req.params
    const user = await authService.getUser(id)
    let result

    switch (user.role?.toLowerCase()) {
      case 'admin':
        result = await adminService.updateAdmin(id, req.body)
        break
      case 'parent':
      case 'guardian':
        result = await parentService.updateParent(id, req.body)
        break
      case 'teacher':
        result = await teacherService.updateTeacher(id, req.body)
        break
      default:
        throw new Error('Unsupported user role for update')
    }

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
    const { uid: id } = req.params
    const user = await authService.getUser(id)
    let result

    switch (user.role?.toLowerCase()) {
      case 'admin':
        result = await adminService.deleteAdmin(id)
        break
      case 'parent':
      case 'guardian':
        result = await parentService.deleteParent(id)
        break
      case 'teacher':
        result = await teacherService.deleteTeacher(id)
        break
      default:
        throw new Error('Unsupported user role for deletion')
    }

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
    const [admins, parents, teachers] = await Promise.all([
      adminService.getAllAdmins(),
      parentService.getAllParents(),
      teacherService.getAllTeachers(),
    ])

    const allUsers = [...admins, ...parents, ...teachers]
    let count = 0

    for (const user of allUsers) {
      if (user.role === 'parent' || user.role === 'guardian') {
        await parentService.syncParentMirrors(user.id)
        count++
      }
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
    const result = await authService.manualPasswordReset(req.params.uid)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
