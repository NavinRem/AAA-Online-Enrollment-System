const registrationService = require("../services/registrationService");

/**
 * @route POST /registrations/createEnrollment
 * @description Register a student for a course
 */
exports.createEnrollment = async (req, res) => {
  try {
    const result = await registrationService.createEnrollment(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (
      error.message === "Session not found" ||
      error.message === "Student not found" ||
      error.message === "Course not found"
    ) {
      return res.status(404).json({ error: error.message });
    }
    if (
      error.message === "Student already registered for this session" ||
      error.message === "Session is full" ||
      error.message === "studentId, courseId, and sessionId are required"
    ) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /registrations/eligibility/:studentId/:courseId
 * @description Check if a student is eligible for a course (placeholder for logic)
 */
exports.getStudentEligibility = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const result = await registrationService.getStudentEligibility(
      studentId,
      courseId,
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Student or Course not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /registrations
 * @description Get all registrations
 */
exports.getAllRegistrations = async (req, res) => {
  try {
    const registrations = await registrationService.getAllRegistrations();
    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /registrations/:id
 * @description Get a single registration
 */
exports.getRegistration = async (req, res) => {
  try {
    const registration = await registrationService.getRegistration(
      req.params.id,
    );
    res.status(200).json(registration);
  } catch (error) {
    if (error.message === "Registration not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.cancelRegistration = async (req, res) => {
  try {
    const result = await registrationService.cancelRegistration(
      req.body.enrollmentId,
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Registration not found")
      return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};
