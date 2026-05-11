const scheduleService = require('../services/scheduleService')

exports.createSchedule = async (req, res) => {
  try {
    const result = await scheduleService.createSchedule(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await scheduleService.getAllSchedules(req.query)
    res.status(200).json(schedules)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getSchedule = async (req, res) => {
  try {
    const schedule = await scheduleService.getSchedule(req.params.id)
    res.status(200).json(schedule)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updateSchedule = async (req, res) => {
  try {
    const result = await scheduleService.updateSchedule(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteSchedule = async (req, res) => {
  try {
    const result = await scheduleService.deleteSchedule(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
