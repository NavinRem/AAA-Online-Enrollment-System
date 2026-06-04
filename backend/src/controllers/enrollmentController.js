const enrollmentService = require('../services/enrollmentService')

exports.createEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.createEnrollment(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments(req.query)
    res.status(200).json(enrollments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await enrollmentService.getEnrollment(req.params.id)
    res.status(200).json(enrollment)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updateEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.updateEnrollment(
      req.params.id,
      req.body,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.transferEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.transferEnrollment(
      req.params.id,
      req.body,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.deleteEnrollment(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// --- Specialized Actions ---

exports.getStudentEligibility = async (req, res) => {
  try {
    const { studentId, programId } = req.params
    const result = await enrollmentService.getStudentEligibility(
      studentId,
      programId,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.cancelEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.cancelEnrollment(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.processPayment = async (req, res) => {
  try {
    const result = await enrollmentService.processPayment(
      req.params.id,
      req.body,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getEnrollmentsByParent = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollmentsByParent(
      req.params.parentId,
      req.user,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getEnrollmentsByStudent = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollmentsByStudent(
      req.params.studentId,
      req.user,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
