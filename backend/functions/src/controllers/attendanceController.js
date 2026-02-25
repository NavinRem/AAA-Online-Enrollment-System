const attendanceService = require("../services/attendanceService");

exports.markCheckIn = async (req, res) => {
  try {
    const result = await attendanceService.markCheckIn(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markCheckOut = async (req, res) => {
  try {
    const result = await attendanceService.markCheckOut(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const result = await attendanceService.getAttendanceHistory(
      req.params.studentId,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceLogs = async (req, res) => {
  try {
    const result = await attendanceService.getAttendanceLogs(
      req.params.sessionId,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestMakeUpSession = async (req, res) => {
  try {
    const result = await attendanceService.requestMakeUpSession(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
