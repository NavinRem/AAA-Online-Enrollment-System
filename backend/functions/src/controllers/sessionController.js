const sessionService = require("../services/sessionService");

/**
 * @route POST /sessions
 * @description Create a new Session (linked to a Course)
 */
exports.createSession = async (req, res) => {
  try {
    const result = await sessionService.createSession(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === "course_id is required") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /courses/:id/sessions/getAvailableSessions
 * @description Get all sessions for a specific course (renamed)
 */
exports.getAvailableSessions = async (req, res) => {
  try {
    const sessions = await sessionService.getAvailableSessions(req.params.id);
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /sessions/:id/validateCapacity
 * @description Check if a session has space
 */
exports.validateCapacity = async (req, res) => {
  try {
    const result = await sessionService.validateCapacity(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Session not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /sessions/:id
 * @description Get a session by ID
 */
exports.getSession = async (req, res) => {
  try {
    const session = await sessionService.getSession(req.params.id);
    res.status(200).json(session);
  } catch (error) {
    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /sessions/:id/instructor
 * @description Assign instructors to a session
 */
exports.assignInstructor = async (req, res) => {
  try {
    const result = await sessionService.assignInstructor(
      req.params.id,
      req.body.instructors,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /sessions/:id/roster
 * @description Get instructor roster
 */
exports.getInstructorRoster = async (req, res) => {
  try {
    const result = await sessionService.getInstructorRoster(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /sessions/sync-counts
 * @description Sync student counts
 */
exports.syncStudentCounts = async (req, res) => {
  try {
    const result = await sessionService.syncStudentCounts(req.body.sessionId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
