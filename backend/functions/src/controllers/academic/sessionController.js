const sessionService = require("../../services/academic/sessionService");

/**
 * @route POST /sessions
 * @description Create a new Session (linked to a Program)
 */
exports.createSession = async (req, res) => {
  try {
    const result = await sessionService.createSession(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === "programId is required") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @description Get all sessions for a specific program
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
 * @route GET /sessions
 * @description Get all sessions across all programs
 */
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await sessionService.getAllSessions();
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
 * @route PUT /sessions/:id/teacher
 * @description Assign teachers to a session
 */
exports.assignTeacher = async (req, res) => {
  try {
    const result = await sessionService.assignTeacher(
      req.params.id,
      req.body.teachers,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /sessions/:id/teachers
 * @description Get session teachers
 */
exports.getSessionTeachers = async (req, res) => {
  try {
    const result = await sessionService.getSessionTeachers(req.params.id);
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
/**
 * @route POST /sessions/sync-all
 * @description Recalculate student counts for all sessions
 */
exports.syncAllSessions = async (req, res) => {
  try {
    const result = await sessionService.syncAllSessionCounts();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
