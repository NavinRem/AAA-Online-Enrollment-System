const enrollmentService = require('../services/enrollmentService')

/**
 * @route POST /enrollments/createEnrollment
 * @description Register a student for a program
 */
exports.createEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.createEnrollment(req.body)
    res.status(201).json(result)
  } catch (error) {
    if (
      error.message === 'Class not found' ||
      error.message === 'Student not found' ||
      error.message === 'Program not found'
    ) {
      return res.status(404).json({ error: error.message })
    }
    if (
      error.message === 'Student already enrolled for this class' ||
      error.message === 'Class is full' ||
      error.message === 'studentId, programId, and classId are required'
    ) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /enrollments/eligibility/:studentId/:programId
 * @description Check if a student is eligible for a program (placeholder for logic)
 */
exports.getStudentEligibility = async (req, res) => {
  try {
    const { studentId, programId } = req.params
    const result = await enrollmentService.getStudentEligibility(
      studentId,
      programId,
    )
    res.status(200).json(result)
  } catch (error) {
    if (error.message === 'Student or Program not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /enrollments
 * @description Get all enrollments
 */
exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments()
    res.status(200).json(enrollments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * @route GET /enrollments/:id
 * @description Get a single enrollment
 */
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await enrollmentService.getEnrollment(req.params.id)
    res.status(200).json(enrollment)
  } catch (error) {
    if (error.message === 'Enrollment not found') {
      return res.status(404).json({ message: error.message })
    }
    res.status(500).json({ error: error.message })
  }
}

exports.cancelEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.cancelEnrollment(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    if (error.message === 'Enrollment not found')
      return res.status(404).json({ error: error.message })
    res.status(500).json({ error: error.message })
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
    if (error.message === 'Enrollment not found')
      return res.status(404).json({ error: error.message })
    res.status(500).json({ error: error.message })
  }
}

exports.deleteEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.deleteEnrollment(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    if (error.message === 'Enrollment not found')
      return res.status(404).json({ error: error.message })
    res.status(500).json({ error: error.message })
  }
}
