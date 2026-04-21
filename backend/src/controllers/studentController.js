const studentService = require('../services/studentService')

exports.createStudent = async (req, res) => {
  try {
    const result = await studentService.createStudent(req.body)
    res.status(201).json(result)
  } catch (error) {
    if (
      error.message.includes('Invalid') ||
      error.message.includes('required')
    ) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}

exports.getStudent = async (req, res) => {
  try {
    const student = await studentService.getStudent(req.params.id)
    res.status(200).json(student)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}

exports.getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents()
    res.status(200).json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getStudentsByParentID = async (req, res) => {
  try {
    const students = await studentService.getStudentsByParentID(
      req.params.parentId,
    )
    res.status(200).json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateStudent = async (req, res) => {
  try {
    const result = await studentService.updateStudent(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}

exports.deleteStudent = async (req, res) => {
  try {
    const result = await studentService.deleteStudent(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}
