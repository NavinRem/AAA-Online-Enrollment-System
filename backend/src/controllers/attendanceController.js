const attendanceService = require('../services/attendanceService')

exports.recordAttendance = async (req, res) => {
  try {
    const { classId, sessionId, statuses } = req.body
    const result = await attendanceService.recordAttendance(classId, sessionId, statuses)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params
    const result = await attendanceService.getClassAttendance(classId)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
