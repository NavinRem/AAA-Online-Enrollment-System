const progressService = require("../services/progressService");

exports.getStudentProgress = async (req, res) => {
  try {
    const result = await progressService.getStudentProgress(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
