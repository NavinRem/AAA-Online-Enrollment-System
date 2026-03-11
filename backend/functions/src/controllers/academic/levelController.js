const levelService = require("../../services/academic/levelService");

exports.getAllLevels = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const levels = await levelService.getAllLevels(categoryId);
    res.status(200).json(levels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLevel = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await levelService.createLevel(categoryId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLevel = async (req, res) => {
  try {
    const { categoryId, id } = req.params;
    const result = await levelService.deleteLevel(categoryId, id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
