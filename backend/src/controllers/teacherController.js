const teacherService = require('../services/teacherService')

/**
 * @route POST /teachers/register
 * @description Create a teacher account
 */
exports.registerTeacher = async (req, res) => {
  try {
    const result = await teacherService.registerTeacher(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /teachers/:id
 * @description Get a teacher by ID
 */
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await teacherService.getTeacher(req.params.id)
    res.status(200).json(teacher)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

/**
 * @route GET /teachers
 * @description Get all teachers
 */
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await teacherService.getAllTeachers()
    res.status(200).json(teachers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route PATCH /teachers/:id
 * @description Update teacher profile
 */
exports.updateTeacher = async (req, res) => {
  try {
    const result = await teacherService.updateTeacher(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route DELETE /teachers/:id
 * @description Delete teacher account
 */
exports.deleteTeacher = async (req, res) => {
  try {
    const result = await teacherService.deleteTeacher(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
