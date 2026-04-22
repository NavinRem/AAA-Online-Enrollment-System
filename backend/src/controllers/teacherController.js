const teacherService = require('../services/teacherService')

exports.createTeacher = async (req, res) => {
  try {
    const result = await teacherService.createTeacher(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getTeacher = async (req, res) => {
  try {
    const teacher = await teacherService.getTeacher(req.params.id)
    res.status(200).json(teacher)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await teacherService.getAllTeachers(req.query)
    res.status(200).json(teachers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateTeacher = async (req, res) => {
  try {
    const result = await teacherService.updateTeacher(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteTeacher = async (req, res) => {
  try {
    const result = await teacherService.deleteTeacher(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    if (error.message.includes('assigned to active classes')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}
