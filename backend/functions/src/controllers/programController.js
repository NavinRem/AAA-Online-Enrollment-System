const programService = require("../services/programService");

exports.createProgram = async (req, res) => {
  try {
    const result = await programService.createProgram(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await programService.getAllPrograms();
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProgram = async (req, res) => {
  try {
    const program = await programService.getProgram(req.params.id);
    res.status(200).json(program);
  } catch (error) {
    if (error.message === "Program not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    const result = await programService.updateProgram(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const result = await programService.deleteProgram(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
