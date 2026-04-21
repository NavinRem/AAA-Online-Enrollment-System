const parentService = require('../services/parentService')
const studentService = require('../services/studentService')

/**
 * @route POST /parents/register
 * @description Create a parent account
 */
exports.registerParent = async (req, res) => {
  try {
    const result = await parentService.registerParent(req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /parents/:id
 * @description Get a parent by ID
 */
exports.getParent = async (req, res) => {
  try {
    const parent = await parentService.getParent(req.params.id)
    res.status(200).json(parent)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

/**
 * @route GET /parents
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
 * @route PATCH /parents/:id
 * @description Update parent profile
 */
exports.updateParent = async (req, res) => {
  try {
    const result = await parentService.updateParent(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route DELETE /parents/:id
 * @description Delete parent account
 */
exports.deleteParent = async (req, res) => {
  try {
    const result = await parentService.deleteParent(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route POST /parents/:uid/students
 * @description Add a student profile to a parent's account
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
 * @route GET /parents/:uid/students
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
