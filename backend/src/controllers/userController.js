const authService = require('../services/authService')
const adminService = require('../services/adminService')
const parentService = require('../services/parentService')
const teacherService = require('../services/teacherService')

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

exports.getUserRole = async (req, res) => {
  try {
    const roleData = await authService.getUserRole(req.params.uid)
    res.status(200).json(roleData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

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

exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.manualPasswordReset(req.params.uid)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
